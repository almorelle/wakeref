# Review 2 — Edge Case Hunter

**Feature:** `/competitions/proposer` (public 3-field form) → `competition_submissions` → `/admin/competition-submissions`, rate-limit trigger, `notify-competition-submission` Edge Function.
**Nominal input:** `_bmad-output/implementation-artifacts/review-diff.patch` (generated 18:12).
**Important:** the working tree has moved since that patch was generated (source files touched 18:17–18:19). Every finding below was **re-verified against the working tree** and is open there; patch-era gaps already closed in the tree are listed at the end so nobody re-fixes them.
**Baseline:** `npm run lint` = 9 errors / 7 warnings, unchanged.
**Method:** path enumeration. Handled paths discarded silently.

---

## HIGH

### H1 — `created_at` and `status` are client-writable, so the rate limit is bypassed by one JSON field
`scripts/migrations/0019-competition-submissions.sql:83` · `scripts/wakeref_post_restore.sql:749` · policy `migration:78`

`grant insert on <table> to anon` grants insert on **every column**, and the policy is `with check (true)`. Only `id` is protected (`generated always as identity`). The trigger counts `where created_at > now() - interval '1 minute'`.

**Failure scenario:** `POST /rest/v1/competition_submissions` with `{"name":"x","date_text":"y","created_at":"2000-01-01T00:00:00Z"}`. The row is stored with a fake timestamp, so the *next* insert's trigger never counts it. The 10/min ceiling never fires — unlimited rows, unlimited e-mails, from a URL advertised in the footer and above the agenda. The same hole lets an attacker pin rows to the top of the admin queue permanently (`order('created_at', desc)` with a year-3000 timestamp) or land them pre-`handled` so they fall out of the "à traiter" counter.

**Fix** (mirror in both SQL files):
```sql
revoke insert on public.competition_submissions from anon;
grant insert (name, date_text, url) on public.competition_submissions to anon;
```
Keep the table-wide grant for `authenticated`. Belt and braces on the policy: `with check (status = 'pending')`.

---

### H2 — a single multi-row INSERT bypasses the ceiling entirely
`scripts/migrations/0019-competition-submissions.sql:39-64` · `scripts/wakeref_post_restore.sql:296-576`

The guard is `BEFORE INSERT … FOR EACH ROW`. Rows inserted by the *same* command are invisible to a query running inside that command's trigger (their `cmin` equals the current command id), so for `INSERT INTO … VALUES (…),(…),…` the count returns the same pre-statement value for every row.

**Failure scenario:** PostgREST accepts arrays — `supabase.from('competition_submissions').insert([...1000 rows])` is **one** statement. 1000 rows land, the ceiling never trips, and the Supabase webhook (a per-row AFTER trigger) fires 1000 e-mails. Works without H1, and repeating it once a second is unbounded. `compositions_rate_limit` shares the hole, but compositions are only ever inserted one at a time by the app; this table is the one a public URL invites people to POST to.

**Fix:** add a statement-level guard that also counts the incoming batch:
```sql
create trigger competition_submissions_rate_limit_stmt
  after insert on public.competition_submissions
  referencing new table as inserted
  for each statement execute procedure public.competition_submissions_rate_limit_stmt();
```
with the function raising `PT429` when `(select count(*) from inserted) + (select count(*) from competition_submissions where created_at > now() - interval '1 minute') > 10`. Simplest alternative: refuse any statement inserting more than one row.

---

### H3 — the Edge Function is an unauthenticated mail relay into the admin's inbox
`supabase/functions/notify-competition-submission/index.ts:14-42`

Nothing verifies the caller is the DB webhook. Supabase's default `verify_jwt` is satisfied by a JWT signed with the **anon key, which ships in `dist/assets/*.js`**. The body is taken at face value: `payload.record.{name,date_text,url}` go straight into the mail.

**Failure scenario:** anyone who opens the JS bundle POSTs to the function URL in a loop and sends arbitrary content from `notifications@wakeref.app` to `NOTIFY_EMAIL` — **bypassing the rate-limit trigger, the CHECK constraints and the moderation queue at once**. Content is HTML-escaped (that part is done right), but volume and text are unconstrained. Sustained, this burns the Resend quota and can get the sending domain flagged.

**Fix:** have the webhook send a secret header and reject anything else, before any work:
```ts
if (req.headers.get('x-wakeref-hook') !== Deno.env.get('HOOK_SECRET')) return new Response('no', { status: 401 })
```
(Same shape as `notify-video-submission`, so it is a pre-existing pattern — but this is the function that gets one call per public form submission.)

---

## MEDIUM

### M1 — `externalUrl()` makes the URL validation unfalsifiable: any free text becomes a valid `https://…`
`src/pages/SubmitCompetition.jsx:29-31`

```js
const url = externalUrl(form.url.trim())
if (url && !/^https?:\/\//i.test(url)) { setStatus('badUrl'); return }
```
`externalUrl` prepends `https://` to anything without `://` (`src/lib/url.js:9-11`). So the regex it is then tested against **can never fail** for text that lacks a scheme.

**Failure scenario:** the visitor types `pas de lien`, `n/a`, `@wakepark_officiel` or `Instagram: wakepark` in the optional field. Result: `https://pas de lien` — passes the client check, passes the DB `url ~* '^https?://'` CHECK, is stored, and shows up in the admin queue and in the alert e-mail as a clickable link that goes nowhere. The `badUrl` string is now only reachable for input that already has a non-http scheme (`ftp://…`), i.e. the rarest case. The field also lost `type="url"`, so the browser no longer catches it either.

**Fix:** validate the **raw** input before normalising:
```js
const raw = form.url.trim()
if (raw && !/^(https?:\/\/)?[^\s/?#]+\.[a-z]{2,}([/?#]|$)/i.test(raw)) { setStatus('badUrl'); return }
const url = externalUrl(raw)
```

### M2 — the Edge Function throws on any payload that is not a well-formed INSERT record
`supabase/functions/notify-competition-submission/index.ts:15-18`

`await req.json()` is unguarded (malformed body → unhandled rejection). `payload.record` is dereferenced without a check at `:18` (`esc(sub.url)`).

**Failure scenario:** the webhook is mis-created on UPDATE or DELETE (payload carries `old_record`), a platform health check sends a GET, or a retry arrives with a different envelope → `TypeError: Cannot read properties of undefined` → 500, no e-mail, and nothing in the response says why. The submission still sits in the queue — but the entire point of the function is that the admin does not have to poll it.

**Fix:**
```ts
let sub; try { sub = (await req.json())?.record } catch { sub = null }
if (!sub?.name || !sub?.date_text) return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
```

### M3 — a missing env var loses every notification silently and permanently
`supabase/functions/notify-competition-submission/index.ts:3-4, 38-41`

`Deno.env.get(...)!` is a compile-time assertion only. Unset `RESEND_API_KEY` → header `Bearer undefined` → Resend 401 → `res.ok` false → the function returns 500 and **never reads `res.status` or `res.text()`**, so nothing is logged. `net.http_post` does not retry.

**Failure scenario:** the function is deployed before the secret is set, or the key is rotated. Submissions accumulate correctly in the queue and no alert ever arrives, with no symptom anywhere. Found weeks later, by accident.

**Fix:** `if (!res.ok) console.error('resend', res.status, await res.text())`, plus a boot-time guard that throws if either env var is absent.

### M4 — in the admin queue a failed load is indistinguishable from an empty queue
`src/pages/admin/AdminCompetitionSubmissions.jsx:32, 59-68`

On error the handler toasts and sets `loading = false` while `rows` stays `[]`. The toast self-dismisses after 3.5 s (`useToast` default). What remains: "**0 à traiter · 0 au total**" and "Aucune proposition pour l'instant."

**Failure scenario:** a transient network blip, an expired session, or a future RLS regression makes the queue read "no submissions". The admin closes the tab and the real pending rows are never processed. `Competitions.jsx` already models the correct shape with its `failed` state; the new page dropped it.

**Fix:** add `const [failed, setFailed] = useState(false)`, set it in the error branch, and render an explicit "Chargement impossible" + retry instead of the empty state *and* instead of the 0/0 counter.

### M5 — "Créer la fiche" leaves the submission `pending`, and nothing prevents doing it twice
`src/pages/admin/AdminCompetitionSubmissions.jsx:91-96`

The primary action only navigates to `/admin/competitions/new?nom=…&quand=…&lien=…`. The row stays `pending`, nothing on it records that a competition was created, and `competitions.name` has no unique constraint (`scripts/wakeref_schema.sql:141`).

**Failure scenario (second use):** the admin creates the fiche, gets distracted, comes back the next day. The row still reads "À traiter" and looks untouched → they create the competition again. Two identical entries appear in the public agenda, each with its own id and share URL. Nothing in the app detects it.

**Fix:** await `setStatus(r, 'handled')` inside the "Créer la fiche" handler before navigating (the "Rouvrir" button already exists as the escape hatch if the creation is abandoned).

### M6 — the ceiling caps bursts, not volume, and it has no per-caller dimension
`scripts/migrations/0019-competition-submissions.sql:39-64`

Even with H1 and H2 closed: 10 rows/minute sustained = 600/hour = **14 400 e-mails/day**, and the count is table-wide with no IP, session or fingerprint dimension.

**Failure (a):** a bot that simply paces itself at 9/min mail-bombs the admin indefinitely and floods the queue, never once triggering the guard.
**Failure (b):** the mirror image — while any bot sits at the ceiling, every genuine organiser gets "Trop de propositions envoyées à l'instant. Réessaie dans une minute." for as long as the bot runs. The public form is a denial-of-service target for the price of one loop, and the person locked out is exactly the person the feature exists for.

**Fix:** the ceiling is three orders of magnitude too generous for a table that will see a handful of rows per *month* — `compositions` at 20/min is a different traffic profile and should not have been copied verbatim. Lower it, and/or batch the alert (one digest e-mail per N minutes) so volume is capped independently of insert rate.

---

## LOW

### L1 — `?quand=` and `?lien=` are display-only, so the data still gets retyped
`src/pages/admin/CompetitionForm.jsx:42-47, 204-213`
The banner shows them but they never reach a field, and there is no copy button. Navigating away (or a failed save followed by a reload) loses them — the admin must go back to the queue. Deliberate per the code comment, but the round trip is exactly what the prefill was meant to remove; consider parsing a bare 4-digit year in `quand` into `date_precision='year'` + `year`, which covers the most common submission shape.

### L2 — `?nom=` is read once, in a lazy initializer
`src/pages/admin/CompetitionForm.jsx:51`
`useState(() => …search.get('nom')…)` runs at mount only. `/admin/competitions/new?nom=A` → `/admin/competitions/new?nom=B` matches the same route, so React Router does not remount and the form keeps name A (and the banner would show B's date next to A's name). No current UI reaches that path — every route back to the queue unmounts the form — so this is latent until someone adds a "proposition suivante" link. Guard with `key={search.get('nom')}` on the route element or an effect keyed on the param.

### L3 — `slice(0, 160)` can split a surrogate pair
`src/pages/admin/CompetitionForm.jsx:51`
`slice` counts UTF-16 units, the `competitions.name` CHECK counts code points. A `?nom=` of ≥160 units ending on a pair boundary leaves a lone surrogate, which `fetch` encodes as `�` in the saved name. Not reachable from the queue button (submission names are already ≤160 code points), only from a hand-typed URL. `[...s].slice(0,160).join('')` if it matters.

### L4 — no "propose another" path after success
`src/pages/SubmitCompetition.jsx:59-65`
`setForm(EMPTY)` runs, but the form is unmounted and the only exit is the link to `/competitions`. An organiser announcing three stops of a tour re-navigates to the form each time. A second link calling `setStatus('idle')` is one line.

### L5 — no pagination and no refresh in the queue
`src/pages/admin/AdminCompetitionSubmissions.jsx:27-30`
No `range()`: PostgREST truncates the response (1000 rows by default) with no indication, so after a flood the admin sees a silently clipped list. `sortPendingFirst` also runs once at mount — rows arriving while the tab stays open never appear and the "à traiter" counter goes stale.

### L6 — `/competitions/proposer` is absent from the sitemap
`scripts/generate-sitemap.js:14-20`
`staticRoutes` lists `/`, `/figures`, `/quiz`, `/contact`, `/competitions`. The new page is the only discovery surface for organisers who do not already visit the site. `/submit` is missing too, so this may be deliberate — confirm rather than inherit.

### L7 — unrelated CSS deletion bundled into this change
`src/pages/Competitions.module.css` (removal of `.compact .card::after { display: none; }`)
Nothing in this feature touches the ribbon. Removing it re-enables the connector line (`.card::after`) on compact cards, whose geometry (`--gap`, `--node`) was retuned for the compact variant further down the file. Either an intentional visual fix that belongs in another commit, or a stray revert. The mobile media query still hides it, so the effect is desktop-only and easy to miss in review.

### L8 — the webhook itself is captured nowhere
`scripts/migrations/0019-competition-submissions.sql`, `scripts/wakeref_post_restore.sql`
Neither file creates the `supabase_functions.http_request` trigger that fires the Edge Function; only `CLAUDE.md` prose says it exists. A restore rebuilds the table, the RLS and the rate limit, and produces a queue that notifies nobody. Pre-existing for `video_submissions` — now two silent notification paths instead of one. A comment naming the webhook config in the post-restore file would close it.

### L9 — the flood path now depends entirely on PostgREST honouring `PT429`
`scripts/migrations/0019-competition-submissions.sql:56` · `src/pages/SubmitCompetition.jsx:40`
Distinguishing the trigger from the table CHECKs by SQLSTATE is the right call, but the previous `/réessaie/i.test(error.message)` fallback was removed, so `setStatus(httpStatus === 429 || error.code === 'PT429' ? 'flood' : 'error')` is the only detection left. If the deployed PostgREST does not map the `PT` class (support landed in v7), the visitor gets the generic "L'envoi a échoué" and no reason to wait. Worth one manual check after the migration is applied: insert 11 rows in a minute and confirm the HTTP status is 429.

### L10 — nothing purges the table, and the banner params are unbounded
`scripts/migrations/0019-competition-submissions.sql` (no retention) · `src/pages/admin/CompetitionForm.jsx:206-209`
Rows accumulate forever, including rejected spam, and the rate-limit count scans against them each insert (the unconditional `created_at` index keeps this cheap, so this is only a storage/queue-noise concern). Separately, `search.get('quand')` / `search.get('lien')` are rendered without a length cap — harmless from the queue button, ugly from a hand-crafted URL.

---

## Closed since the patch was generated (do not re-fix)

Re-verified in the working tree at 18:20 — these were real in `review-diff.patch` and are now fixed:

- **Trigger created before the table in `wakeref_post_restore.sql`** — the block sat in section 2 (`:316`) while the table is created in section 3 (`:545`), so a from-scratch restore aborted the whole (single-transaction) script with `relation "competition_submissions" does not exist`. Now correctly at `:573`, in section 4 with the other triggers.
- **`23514` conflation** — a whitespace-only name passed `minLength={2}` and trimmed to `''`, hitting the table CHECK and being reported as "flood, retry in a minute" forever. Fixed twice over: a client-side `tooShort` guard on the trimmed values, and a distinct `PT429` errcode on the trigger.
- **Terminal `handled`/`rejected`** — a misclick on "Écarter" was irreversible from the UI. "Rouvrir" now exists.
- **Success state a11y** — no focus move and no live region; now `role="status" tabIndex={-1}` plus a focusing effect.
- **`delete` granted with no DELETE policy** — the grant is gone.
- **Partial index unusable by the rate-limit count** — replaced by an unconditional `competition_submissions_created_idx (created_at desc)`.
- **Dead/duplicated CSS and undefined class names** — `styles.name` / `styles.actions` had no rule at all (the name in the queue rendered unstyled); now `rowName` / `rowActions`, and the copied-over `.badges`/`.badge`/`.unpub`/`.consent`/`.row`/`.textarea`/`.submitBtn` and the duplicated `.error`/`.empty` blocks are gone.

## Verified handled (not findings)

- `generated always as identity` needs no sequence grant for `anon`, unlike `video_submissions`. Correctly omitted.
- `esc()` in the Edge Function escapes `&` first then `<>"'`; `href="${url}"` is safe against attribute breakout. `javascript:` cannot reach the mail or the admin `<a>` because of the `~* '^https?://'` CHECK (and the admin href now goes through `externalUrl`).
- Anon `select` is closed: no policy, no grant, and `.insert()` without `.select()` sends `Prefer: return=minimal`, so nothing is echoed back.
- Route ordering: `/competitions/proposer` before `/competitions/:idSlug` (React Router v7 ranks static over dynamic anyway), and no `vercel.json` redirect captures it — `/competition` and `/competition/:code` are enumerated, not prefixed.
- `toast` is `useCallback`-stable, so `[toast]` in the queue's effect does not loop.
- i18n: all 17 `submitComp.*` keys (incl. the new `tooShort`) and `competitions.suggest` exist in both `fr` and `en`. The admin page being French-only matches every other admin surface.
- Icons used (`inbox`, `external-link`, `plus`, `check`, `x`, `arrow-left`) all exist in `src/components/Icon.jsx`; CSS tokens (`--font-hand`, `--c-faint`, `--c-accent-ink`, `--page-max`, `--c-success`, `--c-danger`) all exist in both themes; `.fromSubmission` is defined in `CompetitionForm.module.css`.
- `npm run lint` → 9 errors / 7 warnings, baseline unchanged.
