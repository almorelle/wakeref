# Review 2 — Edge Case Hunter

Scope: `_bmad-output/implementation-artifacts/review-diff.patch` (extraction of the competitions feed into
`CompetitionRibbon`, new `/competitions/circuit/:slug` page, sitemap tour routes, `tourPath`, `tourLink` on the
detail page). Reference: `63898a4`. Lint baseline (9 errors / 7 warnings) unchanged — excluded.

Method: path enumeration. Only unhandled branches and boundaries are listed. No praise, no restatement of what works.

---

## Part A — Verification of the "renders identically" claim for `/competitions`

**Source comparison (mechanical, not by eye):**

- CSS: `git show 63898a4:src/pages/Competitions.module.css | sed -n '33,400p'` vs
  `tail -n +5 src/components/CompetitionRibbon.module.css` → **byte-identical, zero diff**.
- JSX: the `<ol className={styles.ribbon}>…</ol>` block, de-indented, diffs against `63898a4` on
  **nothing but** the `{suggest && ( … )}` wrapper and the resulting indentation shift. Every attribute,
  every class expression, every conditional inside `rows.map` is unchanged.
- `Competitions.jsx` still mounts the ribbon under `{!loading && !failed && …}` and still renders the
  `<ol>` (containing only the "?" row) when `rows.length === 0`, side by side with the `none` message —
  same as `63898a4`.
- `styles.suggestItem` resolves to `undefined` in both revisions (`.suggestItem` exists in no CSS file),
  so the literal string `"undefined"` lands in the class attribute in both. Not a regression. See F11.

**Two rendered differences do exist:**

1. **Every ribbon class attribute value changes.** Vite's CSS-Modules scoped name is
   `_${local}_${hash(fileContents).toString(36).slice(0,5)}_${lineNumberOfSelector}`
   (`node_modules/vite/dist/node/chunks/build.js:5278`). Moving the rules into a new file **both** changes the
   content hash (4-line header comment added, ~32 lines of page-level rules removed) **and** shifts every
   selector's line number. So `class="_ribbon_ab12c_38"` becomes something like `_ribbon_x9k4p_10` for every
   ribbon class. Visual output is identical; anything pinned to those strings breaks. I grepped the repo: no
   test, stylesheet, or script references them, and there is no test runner, so nothing in-tree is affected.
2. **CSS chunking moves.** The ribbon's rules now ship with the chunk emitted for `CompetitionRibbon`
   (shared by two lazy routes) instead of the `Competitions` route chunk. The rule set and cascade are
   unaffected — the only class names shared between `Competitions.module.css` and
   `CompetitionRibbon.module.css` are `.page`, `.masthead`, `.title`, `.empty`, which are separately hashed
   and never co-apply to the same element.

Beyond that, `/competitions` renders identically. One **behavioural** divergence remains, on the failed-fetch
path only — F12.

---

## Part B — Findings

### F1 — HIGH — Year-boundary round is invisible on its own tour page for the whole preceding year
`src/pages/TourCompetitions.jsx:68`

```js
const thisYear = tourRows.filter(c => String(c.date_end || c.date_start).slice(0, 4) === year)
```

The filter keys on the **end** year only. A round running 2026-12-28 → 2027-01-02 has attach-year `2027`.

Failure scenario: it is 2026-11-01. The tour's last announced round of the season starts 2026-12-28 and
ends 2027-01-02. `/competitions` shows it as `upcoming` in full form (the ribbon's own attach-year rule puts
it under the 2027 separator, but it is still on screen). `/competitions/circuit/<slug>` filters it out and,
if it was the tour's only remaining round, prints
*"Aucune étape annoncée pour 2026 — les dates arrivent en général au printemps."* The page actively denies a
round that is a month away.

Fix — match on either bound:
```js
const inYear = c => String(c.date_start).slice(0, 4) === year
              || String(c.date_end || c.date_start).slice(0, 4) === year
const thisYear = tourRows.filter(inYear)
```

---

### F2 — HIGH — `slugify` collapses two distinct tours onto one page with a non-deterministic identity
`src/lib/competitionDates.js:96` (`.slice(0, 60)`) · `src/pages/TourCompetitions.jsx:66, 74, 75, 88`

`tour_name` is free text capped at 160 chars by the DB CHECK (`scripts/wakeref_schema.sql:147`); `slugify`
truncates at 60 and strips everything outside `[a-z0-9]`. Two names collide whenever they share a 60-char slug
prefix, **or** differ only by punctuation/accents.

Failure scenario A (truncation): `"Coupe de France de Wakeboard et Wakeskate en Téléski Nautique — Élite"`
and `"… — Espoirs"` both slugify to the same 60 characters. `/competitions/circuit/<that-slug>` then lists
**both** tours' rounds interleaved; `tourName = tourRows[0]?.tour_name` (line 74) picks whichever row sorts
first under `date_start desc, id desc` — so the page's `<h1>`, its `<title>`, its OG description and
`tourLogoPath()` all flip to the other tour the moment a new round is published on the other side.
`tourUrl = tourRows.find(c => c.tour_url)` (line 75) can independently resolve to the *other* tour's website.
From an Espoirs competition, "Voir les compétitions du circuit" lands on a page headed "… Élite".

Failure scenario B (punctuation): `"Wake Pro Tour"` and `"Wake-Pro-Tour"` (a typo in one admin entry) →
identical slug, silently merged, no signal anywhere.

Also: `.slice(0, 60)` runs *after* the `replace(/^-+|-+$/g, '')` trim, so a cut landing on a separator leaves
a trailing hyphen in the public URL (`/competitions/circuit/coupe-de-france-…-teleski-nau-`). It round-trips
(the same function produces the comparison key), so it is cosmetic — but changing `slugify` to fix it would
detach every existing `competitions/tours/<slug>.png` logo file and break already-shared tour URLs, so scope
any fix to a post-step in `tourPath`/`tourLogoPath` or leave it.

Fix — refuse to guess when the slug is ambiguous:
```js
const names = [...new Set(tourRows.map(c => c.tour_name))]
if (names.length > 1) { /* render both, or pick by exact-length match, and log */ }
```
plus a uniqueness check on `slugify(tour_name)` in `src/pages/admin/CompetitionForm.jsx` before save.

---

### F3 — MEDIUM — A capitalized tour URL 404s
`src/pages/TourCompetitions.jsx:20, 66`

React Router matches the *static* segments (`/competitions/circuit/`) case-insensitively, so
`/competitions/circuit/Pro-Tour` reaches `TourCompetitions` — but `slugify()` always lowercases, so the strict
`slugify(c.tour_name) === slug` on line 66 never matches and the visitor gets `NotFound`.

Failure scenario: someone pastes the URL into a client that title-cases it, or types it from a printed
programme; a real tour page returns 404. `CLAUDE.md` records this exact hazard for the legacy redirects
("le router matche sans tenir compte de la casse, donc `/Compo/x` doit rediriger comme `/compo/x`"); the new
route does not honour it.

Fix — normalise the param, not the row:
```js
const { slug: rawSlug } = useParams()
const slug = slugify(rawSlug)          // idempotent on a real slug, lowercases the rest
```
(and keep `path={`/competitions/circuit/${slug}`}` on line 84 so the canonical stays the normalised form).

---

### F4 — MEDIUM — `tourPath()` can return `null` and the `<Link>` guard doesn't check it
`src/pages/CompetitionDetail.jsx:183` · `src/lib/competitionAssets.js:26`

The guard is `{comp.tour_name && (<Link to={tourPath(comp.tour_name)}>…)}` — it tests the raw field, not the
computed path. `tourPath` returns `null` whenever the slug is empty. The admin form normalises
whitespace-only strings to `null` (`CompetitionForm.jsx:146`), which closes the `"   "` case, but any name
made entirely of non-`[a-z0-9]` characters survives: `"Кубок"`, `"日本ツアー"`, `"—"`, `"★"`, `"&"`.

Failure scenario: `tour_name = "Кубок"`. React Router 7's `resolveTo` does `to = { ...toArg }` on `null` →
`{}` → `toPathname` is `undefined` → `from = locationPathname`
(`node_modules/react-router/dist/development/chunk-4N6VE7H7.mjs:899-918`). No crash: the link's href resolves
to the **current** competition page, so "Voir les compétitions du circuit" silently reloads the page the user
is already on. Dead control, no error, no clue.

Fix:
```js
const tp = comp.tour_name ? tourPath(comp.tour_name) : null
…
{tp && <Link className={styles.tourLink} to={tp}>…</Link>}
```

---

### F5 — MEDIUM — `.limit(2000)` turns a real tour into a 404, and every view downloads the whole tour table
`src/pages/TourCompetitions.jsx:41-50`

The query is not narrowed by slug **at all** — it cannot be, since `slugify` is JS. It pulls every published
competition that has a `tour_name`, across all years, ordered `date_start desc`, capped at 2000, then filters
in JS on line 66.

Failure scenario: the agenda's seed-by-the-past strategy grows the archive past 2000 tour-bearing rows. DESC
order means the cap drops the **oldest**, so a defunct tour whose rounds are all old yields
`tourRows.length === 0` → `NotFound` — for a URL that `scripts/generate-sitemap.js` is still publishing. The
failure is silent: `data.length === 2000` is never checked (the sitemap script does warn at its own ceiling,
`generate-sitemap.js:33-36`; this page does not). Secondary cost: every tour page view transfers up to 2000
rows × 11 columns to render at most a handful.

Note the copied comment on lines 48-49 ("la troncature couperait par la fin, donc par les compétitions à
venir") is wrong here — with DESC ordering the truncation cuts the past, which is exactly the data this page
loads all of history for.

Fix — resolve the slug server-side: add a stored/generated `tour_slug` column (or a `security definer`
`competitions_by_tour_slug(slug)` RPC) and `.eq('tour_slug', slug)`. Short of that, at minimum
`if (data?.length === 2000) console.warn(...)` so the ceiling is not crossed silently.

---

### F6 — MEDIUM — "AUJOURD'HUI" marker renders *above* the year separator, and the tour page makes it reachable half the year
`src/components/CompetitionRibbon.jsx:140-143`

```jsx
{firstPast && (<p className={styles.todayMark}>…</p>)}
{newYear && <p className={styles.year}><span>{year}</span></p>}
```

`firstPast` is emitted before `newYear`. When `i === 0` is already `past`, the today marker is the first thing
in the `<ol>`, sitting above the year label.

Failure scenario: on `/competitions` this required the entire agenda to be past, so it never showed. On a tour
page the rows are restricted to the current year, so "every round of the season already happened" is the
**normal** state from the end of the season until the next January. A visitor opening
`/competitions/circuit/<slug>` in November sees: `AUJOURD'HUI` / `2026` / the rounds — the marker claims the
top of a list where nothing is upcoming. The extraction did not introduce the ordering, but it made a
previously unreachable branch the common case.

Fix — emit the year first, and suppress the marker when it would open the list:
```jsx
{newYear && <p className={styles.year}><span>{year}</span></p>}
{firstPast && i > 0 && (<p className={styles.todayMark}>…</p>)}
```

---

### F7 — MEDIUM — Masthead logo ignores the ≤620px breakpoint and overflows its box
`src/pages/TourCompetitions.jsx:88` · `src/pages/TourCompetitions.module.css` (`.logo` + `@media (max-width: 620px)`)

```jsx
<RemoteLogo path={tourLogoPath(tourName)} className={styles.logo} alt="" height={54} />
```

`RemoteLogo` (`src/components/RemoteLogo.jsx:38`) puts `className` on the **wrapping `<span>`** and gives the
`<img>` `className={imgClassName}` — which is not passed here, so the image carries no class at all. Its size
comes from the inline `style={{ height: 54, width: 'auto', maxWidth: '100%', objectFit: 'contain', display:
'block' }}`.

Consequences: `object-fit: contain` and `width: auto` in `.logo` are inert (they are on a `<span>`), and
`@media (max-width: 620px) { .logo { max-height: 42px } }` caps the **span** at 42px while the image stays
hard-wired at 54px. `overflow` is visible, so on any phone the logo spills 12px out of its box, overlapping
the `.headings` column or the `.links` row below it. The breakpoint rule the author wrote never fires.

Fix:
```jsx
<RemoteLogo path={tourLogoPath(tourName)} className={styles.logoBox} imgClassName={styles.logo} alt="" />
```
with `.logo { max-height: 54px; width: auto; object-fit: contain; }` and the 620px override on `.logo`
(dropping the `height` prop so CSS owns the size).

---

### F8 — LOW — A tour that has already announced next year's edition is told it has announced nothing
`src/pages/TourCompetitions.jsx:110-111`

A year-precision 2027 round is stored as `2027-12-31` (`competitions_year_is_dec31`), attach-year 2027, so the
current-year filter drops it.

Failure scenario: in autumn 2026 the tour publishes "2027 — dates à venir". `/competitions` shows it as
upcoming. `/competitions/circuit/<slug>` shows *"Aucune étape annoncée pour 2026 — les dates arrivent en
général au printemps"* — factually contradicted by the row that is on screen one click away, and the wrong
advice (the dates are already announced, for the following season).

Fix — when `thisYear` is empty but `tourRows` holds a future round, say which year instead:
```js
const nextYear = tourRows.find(c => String(c.date_end || c.date_start).slice(0, 4) > year)
```
and swap in a "prochaine édition annoncée pour {year}" string, or fall back to rendering that year's rounds.

---

### F9 — LOW — Sitemap comment contradicts the code, and dead tours stay in the index
`scripts/generate-sitemap.js:83-95`

The comment states *"leur contenu tourne chaque janvier, d'où `daily` plutôt qu'un `changefreq` figé"*; the
emitted value on line 94 is `changefreq: 'weekly'`. One of the two is wrong; a reader trusting the comment
will assume a crawl cadence the sitemap does not declare.

Second, `tourSlugs` is built from every published competition of every year, so a tour whose last round was
2019 gets a permanent sitemap entry pointing at a page that renders nothing but the "no round this year"
sentence — thin content submitted for indexing, forever.

Fix: make the value match the comment (or vice versa), and skip slugs with no round whose attach-year is the
current one.

---

### F10 — LOW — The tour page's loading state drops the spinner's a11y annotation and the page frame
`src/pages/TourCompetitions.jsx:59`

```jsx
if (loading) return <span className="spinner" />
```

Its sibling `src/pages/CompetitionDetail.jsx:96` returns
`<span className="spinner" role="status" aria-label={tr.competitions.loading} />`. A screen reader gets no
announcement that the page is loading. The spinner is also outside `styles.page`, so the masthead and links
pop in after the fetch instead of the frame being present throughout.

Fix: mirror the detail page — `role="status" aria-label={tr.competitions.loading}`, inside
`<div className={styles.page}>`.

---

### F11 — LOW — `styles.suggestItem` is undefined; the literal string `"undefined"` reaches the DOM
`src/components/CompetitionRibbon.jsx:86`

```jsx
<li className={[styles.item, styles.right, styles.suggestItem].join(' ')}>
```

`.suggestItem` is defined in no CSS file (grep: the only occurrence in `src/` is this line). The `<li>` on
`/competitions` renders `class="_item_… _right_… undefined"`. Carried over verbatim from `63898a4`, so not a
regression — but 40 lines below, the competition `<li>` uses `.filter(Boolean).join(' ')` with a comment
explaining precisely why ("`styles.upcoming` n'existe pas … et interpolait la chaîne « undefined » dans le
DOM"). The component now contradicts its own documented rule.

Fix: `.filter(Boolean).join(' ')`, and drop `styles.suggestItem` or add the rule.

---

### F12 — LOW — `mountedOnce` is no longer set on the failed-fetch path, so a later Back re-anchors
`src/components/CompetitionRibbon.jsx:65-73` vs `63898a4:src/pages/Competitions.jsx`

In `63898a4` the effect lived on the page with deps `[loading, navType]` and guarded on `if (loading) return`
— so on a **failed** fetch (`loading` false, `failed` true) it still ran and set `mountedOnce = true`. The
ribbon is now mounted only under `{!loading && !failed && …}`, so a first visit that fails to load leaves the
flag `false`.

Failure scenario: offline/flaky first visit to `/competitions` → error message, flag stays false. Connection
returns, user navigates to `/figures`, then Back (POP) to `/competitions` → `mountedOnce` is still false →
`isBackNavigation` false → `scrollIntoView` fires and overwrites the scroll position the browser restored —
exactly what the flag exists to prevent. `ScrollToTop` correctly abstains on POP, so the ribbon is the only
thing moving the viewport.

**Related observation on the shared flag** (not itself a defect today): `mountedOnce` is module-level and now
shared by two pages. It stays safe *only* because `if (!anchorToToday) return` on line 66 precedes
`mountedOnce = true` on line 68 — the tour page therefore never touches it. Reverse those two lines, or add a
third consumer that passes `anchorToToday`, and one page's mount permanently suppresses the other page's
anchoring for the rest of the JS session. Worth a comment on line 66 stating the ordering is load-bearing.

Fix (for the failed path): set the flag from the page, or key the "already seen this location" state on
`useLocation().key` instead of a module boolean.

---

### F13 — LOW — The current year is printed twice on a tour page
`src/pages/TourCompetitions.jsx:92` · `src/components/CompetitionRibbon.jsx:112, 143`

The masthead renders `<p className={styles.year}>{year}</p>` in accent. Every row handed to the ribbon is
already restricted to that same year, so `newYear` is true at `i === 0` and only there — producing a second
year label, in `--c-faint`, immediately below. The `.item:first-child .year { margin-top: .25rem }` rule
(written for the agenda, where the suggest row was always first-child) now applies and tightens it right up
under the masthead's copy of the same number.

Fix: a `showYearSeparators={false}` prop on the ribbon, or drop the masthead's `.year` since the ribbon
already carries it.

---

## Paths walked and found handled (not findings — listed so the gaps above are read as exhaustive)

- Tour slug → tour slug navigation without unmount: `rows` is fetched once (`[]` deps) but every derived
  value (`tourRows`, `thisYear`, `tourName`, `tourUrl`, SEO props) is computed at render from `useParams()`,
  so the new slug resolves correctly with no refetch and no stale render. `ScrollToTop` keys on `pathname`
  and resets the viewport on the PUSH.
- Tour A → nonexistent tour B → Back: `NotFound` is returned *from* `TourCompetitions`, so the component
  stays mounted and its `rows` survive the round trip.
- All-unpublished tour: `.eq('published', true)` → `tourRows` empty → `NotFound`, indistinguishable from an
  invented slug. Matches the stated intent (no draft leak).
- All-cancelled tour: `tourRows` non-empty → page renders; `competitionState` already excludes cancelled from
  `live`, rows render struck through with the `past` tone.
- Empty / whitespace-only `tour_name`: `CompetitionForm.jsx:146` normalises whitespace-only strings to `null`;
  `.not('tour_name','is',null)` and the sitemap's `if (slug && …)` both hold. Only the non-ASCII case escapes
  — F4.
- Ribbon with zero rows: `anchorIdx` falls through to `0`, `anchorRef.current` is `null`, the effect returns.
  `Competitions` mounts it with `rows=[]` beside the `none` message — identical to `63898a4`.
- `tour_url` null on the first row: `tourRows.find(c => c.tour_url)` scans the whole list, and since rows are
  `date_start desc` it picks the most recent row that has one.
- `date_start` is `NOT NULL` in the schema, so the `String(c.date_end || c.date_start)` chain cannot yield
  `"null"` and the DESC ordering has no NULLS-FIRST surprise.
- `todayISO()` is Europe/Paris on both the page (line 27) and the ribbon (line 41), so the New Year window
  where the browser clock and the venue clock disagree cannot split the year filter from the compact-form
  rule.
- Year-precision rows: `competitions_year_is_dec31` forces `date_end IS NULL`, so attach-year is the stored
  year; `competitionState` keeps them `upcoming` until 1 January; the ribbon leaves them uncompacted and
  appends `dateTbd`. The fictitious 31 December never reaches the screen.
- `externalUrl(tourUrl, { ref: true })` with `rel="noopener noreferrer"` matches the house pattern used at
  `VideoCards.jsx:75`, `Quiz.jsx:263`, `FigureDetail.jsx:481,487`, `Home.jsx:481,594`. Not a new deviation.
- `Icon name="arrow-left"` / `"arrow-right"` / `"external-link"` all exist in `src/components/Icon.jsx:78,79`
  and the `external-link` entry.
- `tr.competitions.tourNoneThisYear` contains exactly one `{year}` token in both locales, so the single
  `.replace()` is sufficient.
- SEO canonical: because line 66 requires an exact slug match, `path` on line 84 can only ever be the
  canonical form (`useParams` already percent-decodes). No duplicate-canonical risk — subject to F3.
- `.limit(2000)` on `/competitions` itself is unchanged from `63898a4`.
- `npm run lint`: 9 errors / 7 warnings — baseline, nothing new.

---

## JSON

```json
[
  {"location":"src/pages/TourCompetitions.jsx:68","trigger_condition":"Round ends in the year after it starts","guard_snippet":"const inYear = c => String(c.date_start).slice(0,4) === year || String(c.date_end || c.date_start).slice(0,4) === year","potential_consequence":"Upcoming December round hidden; page claims no round announced"},
  {"location":"src/pages/TourCompetitions.jsx:66,74,75,88","trigger_condition":"Two tour names share a 60-char slug or differ only by punctuation","guard_snippet":"const names = [...new Set(tourRows.map(c => c.tour_name))]; if (names.length > 1) { /* do not guess */ }","potential_consequence":"Two tours merged; heading, logo and website resolve to the wrong one"},
  {"location":"src/pages/TourCompetitions.jsx:20,66","trigger_condition":"Tour URL typed or pasted with any uppercase letter","guard_snippet":"const slug = slugify(useParams().slug)","potential_consequence":"Real tour page returns 404 for a capitalized shared link"},
  {"location":"src/pages/CompetitionDetail.jsx:183","trigger_condition":"tour_name contains no ASCII alphanumerics at all","guard_snippet":"const tp = comp.tour_name ? tourPath(comp.tour_name) : null; {tp && <Link to={tp}>…</Link>}","potential_consequence":"Tour link silently resolves to the current page; dead control"},
  {"location":"src/pages/TourCompetitions.jsx:41-50","trigger_condition":"More than 2000 published competitions carry a tour_name","guard_snippet":".eq('tour_slug', slug) on a generated column; else if (data?.length === 2000) console.warn(...)","potential_consequence":"Older tours 404 silently; whole tour table shipped per view"},
  {"location":"src/components/CompetitionRibbon.jsx:140-143","trigger_condition":"First row of the ribbon is already past","guard_snippet":"{newYear && <p className={styles.year}>…</p>}{firstPast && i > 0 && <p className={styles.todayMark}>…</p>}","potential_consequence":"Today marker opens the list above the year label, off-season"},
  {"location":"src/pages/TourCompetitions.jsx:88","trigger_condition":"Viewport at or below 620px with a tour logo present","guard_snippet":"<RemoteLogo className={styles.logoBox} imgClassName={styles.logo} alt=\"\" /> and drop the height prop","potential_consequence":"Logo overflows its 42px box and overlaps the heading"},
  {"location":"src/pages/TourCompetitions.jsx:110-111","trigger_condition":"Tour has announced next year but nothing this year","guard_snippet":"const nextYear = tourRows.find(c => String(c.date_end || c.date_start).slice(0,4) > year)","potential_consequence":"Page denies an announced edition that is visible on the agenda"},
  {"location":"scripts/generate-sitemap.js:83-95","trigger_condition":"Comment says daily, code emits weekly; dead tours always listed","guard_snippet":"changefreq: 'daily' (or fix the comment); skip slugs with no round in the current year","potential_consequence":"Misleading comment; thin empty pages submitted for indexing"},
  {"location":"src/pages/TourCompetitions.jsx:59","trigger_condition":"Page is loading with a screen reader active","guard_snippet":"<span className=\"spinner\" role=\"status\" aria-label={tr.competitions.loading} /> inside styles.page","potential_consequence":"No loading announcement; masthead pops in after fetch"},
  {"location":"src/components/CompetitionRibbon.jsx:86","trigger_condition":"Suggest row always; styles.suggestItem is undefined","guard_snippet":"[styles.item, styles.right, styles.suggestItem].filter(Boolean).join(' ')","potential_consequence":"Literal 'undefined' in the class attribute, against the file's own rule"},
  {"location":"src/components/CompetitionRibbon.jsx:65-73","trigger_condition":"First agenda visit fails to fetch, then a later Back to it","guard_snippet":"key the seen-state on useLocation().key, or set the flag from the page on the failed path too","potential_consequence":"Restored scroll position overwritten by scrollIntoView on Back"},
  {"location":"src/pages/TourCompetitions.jsx:92","trigger_condition":"Any tour page with at least one round this year","guard_snippet":"showYearSeparators={false} on the ribbon, or drop the masthead .year","potential_consequence":"Current year printed twice, one line apart"}
]
```
