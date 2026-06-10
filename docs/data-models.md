# Data Models — WakeRef

> Generated: 2026-06-11 · Deep Scan · Source of truth: `scripts/wakeref_schema.sql` (reference dump) and `scripts/wakeref_post_restore.sql` (executable: view, functions, RLS, grants, bucket).

WakeRef stores all data in a single Supabase PostgreSQL database (`public` schema). There is no ORM and no migration framework — schema changes are applied by hand in the Supabase SQL Editor and mirrored into the two SQL files above. The frontend talks to the database directly through PostgREST (the `@supabase/supabase-js` client), so the **RLS policies, the `figures_full` view, and the RPC functions _are_ the API contract** (see `api-contracts.md`).

## Entity overview

| Table | Purpose | Public read | Public write |
|-------|---------|-------------|--------------|
| `categories` | 14 fixed trick categories (spin, railey, s-bend…) with color + sort order | ✅ all rows | ❌ |
| `figures` | Trick entries (the core entity) | ✅ `published = true` only | ❌ |
| `prerequisites` | Many-to-many self-join on `figures` (trick → required tricks) | ✅ all rows | ❌ |
| `videos` | Video references (Storage uploads or external URLs) | ✅ `takedown_requested = false` | ❌ |
| `video_submissions` | Public video suggestions awaiting moderation | ❌ (admin reads) | ✅ insert only |
| `takedown_requests` | Copyright removal requests from video authors | ❌ (admin reads) | ✅ insert only |
| `compositions` | Saved runs from the Compo page (no auth) | ❌ (read via RPC by id) | ✅ insert only |

"Public write" = the anonymous (`anon`) role. All admin mutations run as the `authenticated` role.

## Enumerated types

- `sport_type` — `wakeboard` | `wakeskate` (column `figures.sport`, default `wakeboard`)
- `video_source` — used by `videos.source_type`, default `upload` (the other value is the external/embed case)

## Tables

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `integer` PK | sequence-backed |
| `name` | `text` | UNIQUE |
| `slug` | `text` | UNIQUE — used in `/figures?cat=<slug>` |
| `color` | `text` | hex color for badges |
| `sort_order` | `integer` | default 0 |

The canonical category list is also duplicated client-side in `src/data/categories.js` (with icons) for rendering without a round-trip. Keep the two in sync when adding a category.

### `figures` — core entity
| Column | Type | Notes |
|--------|------|-------|
| `id` | `integer` PK | |
| `slug` | `text` | UNIQUE — used in `/figures/:slug` |
| `name` | `text` | |
| `category_id` | `integer` FK → `categories.id` | |
| `sport` | `sport_type` | default `wakeboard` |
| `difficulty` | `smallint` | CHECK 1–5 |
| `description`, `description_en` | `text` | bilingual (FR / EN) |
| `tips`, `tips_en` | `text[]` | bilingual array of tips |
| `is_switch` | `boolean` | marks a switch variant |
| `switch_of` | `integer` FK → `figures.id` | self-reference to the base trick |
| `published` | `boolean` | default `true`; **RLS hides unpublished from `anon`** |
| `contexts` | `text[]` | values from `src/data/contexts.js`: `kicker`, `jib`, `flat`, `air_trick` |
| `approach` | `text[]` | takeoff stance tags |
| `rotation` | `text[]` | rotation tags |
| `inverted` | `boolean` | invert flag |
| `rewind` | `boolean` | rewind flag |
| `created_at`, `updated_at` | `timestamptz` | `updated_at` auto-maintained by trigger `figures_updated_at` |

**Switch groups.** A figure and its switch variant form a "switch group" keyed by `coalesce(switch_of, id)`. Videos are shared across the whole group (see the view and `home_stats`).

### `prerequisites`
Composite PK `(figure_id, requires_id)`, both FK → `figures.id`. Directed edge: "to land `figure_id`, you should first know `requires_id`."

### `videos`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `integer` PK | |
| `figure_id` | `integer` FK → `figures.id` | NOT NULL |
| `title`, `caption` | `text` | |
| `file_path` | `text` | path inside the `videos` Storage bucket (for uploads) |
| `source_type` | `video_source` | `upload` (Storage file) vs external |
| `source_url` | `text` | external video URL when not an upload |
| `creator_name`, `creator_url` | `text` | attribution |
| `takedown_requested` | `boolean` | `true` hides the row from public RLS |
| `takedown_email`, `takedown_at` | | set when a takedown is processed |
| `sort_order` | `integer` | ordering within a figure |
| `uploaded_at` | `timestamptz` | |

Thumbnails are derived by convention: `thumbnails/<shortcode>.jpg` in the same bucket (see `FigureDetail.jsx`, `AdminDashboard.jsx`, `AdminNoVideos.jsx`).

### `video_submissions`
Public-facing trick-video suggestion box. Columns: `figure_id` (FK, NOT NULL), `source_url` (NOT NULL), `title`, `creator_name`, `creator_url`, `caption`, `status` (`pending` | `approved` | `rejected`, CHECK-constrained, default `pending`), `submitted_at`. An INSERT here fires the `notify-video-submission` Edge Function via a database webhook (configured in the Supabase dashboard).

### `takedown_requests`
Columns: `video_id` (FK → `videos.id`), `name`, `email` (NOT NULL), `message`, `handled` (default `false`), `created_at`.

### `compositions` — saved Compo runs
| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | short shareable id used in `/compo/:id` |
| `name` | `text` | CHECK `length <= 80` |
| `data` | `jsonb` NOT NULL | minimal run snapshot; CHECK `pg_column_size(data) <= 51200` (50 KB) |
| `score` | `integer` | denormalized total |
| `created_at` | `timestamptz` | |

Anti-abuse: trigger `compositions_rate_limit` (BEFORE INSERT, `security definer`) rejects inserts when ≥ 20 rows were created in the last minute. Anonymous users can insert and read **one** row by id via `get_composition(cid)`, but cannot list the table.

## The `figures_full` view (the real read model)

`figures_full` is a `security_invoker` view that denormalizes everything the UI needs for a figure into one row. The frontend reads from this view (not the raw `figures` table) for all display purposes. It adds, on top of the `figures` columns:

- `category_name`, `category_slug`, `category_color` (joined from `categories`)
- `switch_of_figure` — JSON `{id, name, slug}` of the base trick (when this is a switch variant)
- `switch_versions` — JSON array of switch variants of this figure
- `prerequisites` — JSON array of `{id, name, slug}` required tricks
- `videos` — JSON array of non-takedown videos **shared across the switch group** (`coalesce(switch_of, id)`), ordered by `sort_order`

Because the view is `security_invoker`, the underlying tables' RLS policies still apply to the caller.

## Triggers

| Trigger | Table | Timing | Action |
|---------|-------|--------|--------|
| `figures_updated_at` | `figures` | BEFORE UPDATE | sets `updated_at = now()` via `set_updated_at()` |
| `compositions_rate_limit` | `compositions` | BEFORE INSERT | global rate limit (20/min) via `compositions_rate_limit()` |

## Indexes

| Index | Target | Purpose |
|-------|--------|---------|
| `figures_search_idx` | GIN on `to_tsvector('french', immutable_unaccent(name‖description))` | French full-text search |
| `videos_figure_id_idx` | `videos(figure_id) WHERE takedown_requested = false` | video aggregation in the view |
| `figures_switch_of_idx` | `figures(switch_of)` | switch-group resolution |
| `figures_category_id_idx` | `figures(category_id)` | figure → category join |
| `prerequisites_requires_id_idx` | `prerequisites(requires_id)` | prerequisites sub-query |

## Extensions

- `unaccent` (in the `extensions` schema), wrapped by `public.immutable_unaccent(text)` so it can be used inside the GIN index expression and search function.

## Row-Level Security summary

RLS is enabled on every table. Policies (defined in `wakeref_post_restore.sql`):

- **Public SELECT:** `categories` (all), `figures` (`published = true`), `prerequisites` (all), `videos` (`takedown_requested = false`).
- **Admin (authenticated) full access:** `figures`, `categories`, `prerequisites`, `videos` — `for all using ((select auth.role()) = 'authenticated')`. The `auth.role()` call is wrapped in a sub-select so PostgreSQL evaluates it once per query (initplan) instead of once per row.
- **Public INSERT only:** `takedown_requests`, `video_submissions`, `compositions`. Admin gets SELECT (+ UPDATE on submissions, DELETE on compositions).
- **Storage** (`videos` bucket): public SELECT; INSERT/DELETE restricted to `authenticated`.

## How schema changes are managed

There is **no migration tool**. To change the schema:
1. Apply the change in the Supabase SQL Editor.
2. Update `scripts/wakeref_schema.sql` (the reference dump — context only, not executed).
3. Update `scripts/wakeref_post_restore.sql` if it touches the view, functions, RLS, grants, indexes, triggers, or the bucket.
4. Keep `src/data/categories.js` / `src/data/contexts.js` in sync if you added a category/context.

Backups: the GitHub Action `.github/workflows/backup.yml` runs `pg_dump` daily at 03:00 UTC and uploads to the `backups` Storage bucket (30-day retention).
