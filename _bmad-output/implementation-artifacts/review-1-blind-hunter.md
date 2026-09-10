# Review 1 — Blind Hunter (adversarial, diff only)

Scope: `_bmad-output/implementation-artifacts/review-diff.patch`. No other project file was read.
Line numbers refer to the **post-patch** files. Items marked **[verify]** depend on a signature I could not see; they are flagged because the diff gives no evidence the contract holds.

---

## HIGH

### H1 — `RemoteLogo` is given the image class as its *wrapper* class; the tour logo is unconstrained
`src/pages/TourCompetitions.jsx:88`

```jsx
<RemoteLogo path={tourLogoPath(tourName)} className={styles.logo} alt="" height={54} />
```

Every other call site in this same diff establishes the contract: in `CompetitionRibbon.jsx:100-106`, `className` is the **container** (`.node`, the 64px box), `imgClassName` is the `<img>` (`.logo`), `emptyClassName` the empty-state box, `fallback` the text fallback. The tour page passes `.logo` — a rule written for an image (`max-height:54px; width:auto; object-fit:contain`) — to the container, and passes **no `imgClassName` at all**.

Failure: `object-fit` and `width:auto` are inert on a flex container, and the `<img>` inside receives no size rule. `TourCompetitions.module.css` `.logo` has no `overflow:hidden`. A tour logo whose intrinsic width is 800–1200px (the normal case for a `.png` dropped in a bucket) renders at full intrinsic size and blows the masthead apart, pushing `<h1>` off-screen on mobile. `.masthead` is `display:flex` with no `min-width:0` on the logo either.

Fix: `<RemoteLogo path={...} className={styles.logoBox} imgClassName={styles.logo} emptyClassName={styles.logoEmpty} fallback={null} />`, and add a `.logoBox { flex-shrink:0; width:auto; height:54px; overflow:hidden; display:flex; align-items:center }`, moving `max-height/object-fit` onto `.logo` where they belong.

### H2 — No `fallback` / `emptyClassName`: tours without a logo file get a broken or empty emblem
`src/pages/TourCompetitions.jsx:88`

`tourLogoPath(tourName)` (per `competitionAssets.js:14-19`) returns `competitions/tours/<slug>.png` for **any** non-empty tour name — it does not check that the object exists. A tour is free text; the overwhelming majority will have no uploaded PNG. The ribbon handles exactly this case (`CompetitionRibbon.jsx:100-106` passes `fallback={…initials…}` with the comment "un `<img>` brut laissait une case vide"). The tour page — the one page whose entire identity is that emblem — passes nothing.

Failure: a 404 image request on every view of every logoless tour, and either a broken-image glyph or a silent gap where the emblem should be, next to a title that is now vertically mis-centred because the flex row lost its first item's height.

Fix: pass a `fallback` (tour initials, mirroring the ribbon) and an `emptyClassName`, or don't render the `<RemoteLogo>` at all when `tourLogoPath()` is `null`.

### H3 — Slug collision merges two distinct tours into one page with the wrong heading
`src/pages/TourCompetitions.jsx:66,74,75`

```js
const tourRows = rows.filter(c => slugify(c.tour_name) === slug)
const tourName = tourRows[0]?.tour_name || ''
const tourUrl  = tourRows.find(c => c.tour_url)?.tour_url || null
```

`tour_name` is free text with no uniqueness constraint and no admin picker (CLAUDE.md, this diff, line 10). `slugify` is lossy by construction: `"Pro Tour"`, `"Pro-Tour"`, `"pro tour"`, `"Pro  Tour"` and (depending on the implementation) `"Prô Tour"` all collapse to `pro-tour`.

Failure scenario: an admin types `"Rider Cup"` in 2025 and `"Rider-Cup"` in 2026. `/competitions/circuit/rider-cup` lists **both** tours' rounds, and the `<h1>` is whichever row sorts first by `date_start DESC` — i.e. the 2026 spelling — while `tourUrl` is whichever row happens to be the first with a non-null `tour_url` in that same order, potentially the *other* tour's website. The heading, the outbound link and the list can each describe a different entity. This is the "misleading heading" case, and it is silent: nothing warns anyone.

Same collision hits `scripts/generate-sitemap.js:86-88`, which dedupes by slug and keeps the first name it saw — one sitemap URL for two tours.

Fix (cheapest that actually holds): pick the display name deterministically from the **current-year** rows, and detect the collision — if `new Set(tourRows.map(c => c.tour_name)).size > 1`, that is a data defect worth surfacing in dev (`console.warn`, same pattern as the `SCORING_SLUGS` guard in `Compo`). Longer term the owner's "no entity" call is fine, but it needs a normalized `tour_name` (trim + a canonical spelling enforced in the admin form) or the URL space is not stable.

### H4 — The URL slug is used raw; a legitimately-cased shared link 404s
`src/pages/TourCompetitions.jsx:66,82`

React Router matches paths **case-insensitively** by default — the project's own CLAUDE.md relies on this ("le router matche sans tenir compte de la casse, donc `/Compo/x` doit rediriger comme `/compo/x`"). So `/competitions/circuit/Pro-Tour` **matches the route**, `useParams().slug` is `"Pro-Tour"`, and the comparison `slugify(c.tour_name) === slug` fails against the lowercase `"pro-tour"`.

Failure: the page renders `<NotFound />` for a URL the router accepted. This is not theoretical — link shorteners, Outlook/Teams unfurlers and hand-typed URLs routinely change case, and the redirect precedent in this repo exists precisely because the owner already hit this class of bug once.

Secondary: `SEO path={`/competitions/circuit/${slug}`}` (line 82) echoes the raw param, so had the match succeeded, a mixed-case URL would emit a mixed-case canonical and split the page's ranking signal.

Fix: normalize once — `const slug = slugify(useParams().slug || '')` — and use that normalized value for both the comparison and the canonical. Better still, if the normalized slug differs from the raw param, `<Navigate replace to={tourPath(...)}/>` so the canonical form is the one in the address bar.

### H5 — `<Link to={tourPath(...)}>` can be built as `null`
`src/pages/CompetitionDetail.jsx:179-184`

```jsx
{comp.tour_name && (
  <Link className={styles.tourLink} to={tourPath(comp.tour_name)}>
```

The guard tests `comp.tour_name`, but `tourPath` returns `null` when `slugify()` yields an empty string (`competitionAssets.js:17-19` already anticipates this — it returns `null` on purpose). A `tour_name` of `"  "`, `"—"`, `"???"` or any punctuation-only value is **truthy** and slugifies to `""`. The guard therefore does not cover the case the helper was written to signal.

Failure: `<Link to={null}>` in react-router-dom 7 goes through `useHref(null)` → `TypeError` inside the router, which in a lazy route under `<Suspense>` takes down the whole competition detail page, not just the link. There is no error boundary shown around these routes in the diff.

Fix:
```jsx
const tp = tourPath(comp.tour_name)
…
{tp && <Link className={styles.tourLink} to={tp}>…</Link>}
```

---

## MEDIUM

### M1 — `mountedOnce` no longer means what its comment says; back-navigation scroll gets clobbered after a failed load
`src/components/CompetitionRibbon.jsx:14,65-73`

The flag was module-level in `Competitions.jsx`, where the effect lived on the **page** and ran on every post-load render — including when `failed` was true (`anchorRef.current` was `null`, so it bailed *after* setting `mountedOnce = true`). It is now module-level in a **component that is conditionally mounted**, and the new guard returns *before* the assignment:

```js
if (!anchorToToday) return
const isBackNavigation = mountedOnce && navType === 'POP'
mountedOnce = true
```

Two behaviour changes vs. the "renders exactly as before" requirement:

1. **Failed load.** Visitor opens `/competitions` on a flaky connection → `failed` → the ribbon never mounts → `mountedOnce` stays `false`. They retry, navigate to a competition, press Back → `navType === 'POP'` but `mountedOnce === false` → `isBackNavigation` is false → `scrollIntoView` fires and **overwrites the scroll position the browser just restored**. That is precisely the behaviour the flag exists to prevent, and it is a regression introduced by moving the effect behind the `!loading && !failed` gate.
2. **Tour page.** Its ribbon never arms the flag (early return), so the flag now means "the agenda mounted once and succeeded", not "the ribbon has mounted once" — which is what the comment at line 8-13 claims. A shared module-global whose meaning depends on which caller reached it first is a trap for the next reader.

Fix: hoist `mountedOnce = true` above the `anchorToToday` guard, and keep the ribbon mounted (render the `<ol>` even while `failed`, or move the flag/effect back to a `useFirstMount()`-style hook that both pages call unconditionally).

### M2 — Dead branch: the "anchor is already the first row" abstention can never fire
`src/components/CompetitionRibbon.jsx:71`

```js
if (!el || el === el.parentElement?.firstElementChild) return
```

The only call site that runs this effect is `/competitions`, which always passes `suggest` — so `<li className={…suggestItem}>` is unconditionally `firstElementChild` and the anchor `<li>` can never be it. The only caller that could satisfy the condition (`TourCompetitions`, no `suggest`) passes `anchorToToday={false}` and returns two lines earlier. The comment at line 62-64 documents behaviour that no longer exists.

Fix: either delete the check with its comment, or — better — make it do its job by comparing against the first *competition* row rather than the first DOM child, and let the tour page use `anchorToToday` honestly.

### M3 — `styles.suggestItem` has no rule; the literal string `undefined` lands in the DOM
`src/components/CompetitionRibbon.jsx:86` + `src/components/CompetitionRibbon.module.css` (no `.suggestItem` anywhere)

```jsx
<li className={[styles.item, styles.right, styles.suggestItem].join(' ')}>
```

`CompetitionRibbon.module.css` defines `.suggestMark`, `.suggestNode`, `.suggestRow` — there is no `.suggestItem`. CSS Modules return `undefined` for unknown keys, and this `join(' ')` has **no `.filter(Boolean)`**, unlike the sibling `className` array 30 lines below (line 116-124) whose comment explicitly warns about exactly this: *"Les classes absentes sont filtrées : `styles.upcoming` n'existe pas … et interpolait la chaîne « undefined » dans le DOM."*

Failure: `class="item right undefined"` ships on the agenda's first row. Harmless today, and a live landmine the day anyone writes a global `.undefined` or debugs by class name. The diff had the fix written down two blocks away and did not apply it here.

Fix: `.filter(Boolean).join(' ')`, and either add the `.suggestItem` rule or drop the reference.

### M4 — The ribbon's accessible name on the tour page is the agenda's title
`src/components/CompetitionRibbon.jsx:78`

```jsx
<ol className={styles.ribbon} role="list" aria-label={tr.competitions.title}>
```

`tr.competitions.title` is hard-coded inside the component. On `/competitions/circuit/x` a screen reader announces the list as "Compétitions, liste, 4 éléments" — the name of a *different* page — while the visible `<h1>` says the tour name. The component was extracted to serve two contexts and its only accessible name was not parameterized.

Fix: add a `label` prop (`label = tr.competitions.title` default), and pass `` label={`${tourName} ${year}`} `` from the tour page.

### M5 — Duplicate year separators when a competition straddles New Year
`src/components/CompetitionRibbon.jsx:110-113` (pre-existing logic, newly inherited by a second page)

The rows are ordered `date_start DESC` (`TourCompetitions.jsx:44`), but the year label is computed from the **end** date (line 110, with a comment defending that choice):

```js
const year = String(c.date_end || c.date_start).slice(0, 4)
const newYear = i === 0 || year !== String(rows[i-1].date_end || rows[i-1].date_start).slice(0, 4)
```

Concrete failure: comps A `2026-01-10`, B `2025-12-30 → 2025-12-31`, C `2025-12-28 → 2026-01-02`. Sorted by `date_start DESC`: A, B, C. Computed years: **2026, 2025, 2026**. The ribbon prints a "2026" separator, then "2025", then **"2026" again below it**, breaking the strictly-descending-years invariant the whole timeline reads on.

On `/competitions` this is rare-ish. On a tour page it is **not**: `thisYear` is filtered by end-year, so a straddling round is kept while its date-ordered neighbours are not, making the mis-ordering more visible in a 3-row list than in a 200-row one.

Fix: order by the same expression used for grouping — sort client-side on `date_end || date_start` before handing rows to the ribbon (the ribbon already documents that rows arrive "DÉJÀ triées", so the sort belongs to the callers), or add `.order('date_end', …)` as the primary key with `date_start` as tiebreaker.

### M6 — "Voir les compétitions du circuit" is a dead end from any past competition
`src/pages/CompetitionDetail.jsx:179-184` → `src/pages/TourCompetitions.jsx:111-120`

The link renders on every competition detail page with a `tour_name`, including comps from 2024 and 2025. The destination shows **the current year only**. A visitor reading the 2025 Rider Cup page clicks a link labelled *"See the tour's competitions"* and lands on a page that says *"Aucune étape annoncée pour 2026"* — with no list, no link back to the edition they came from, and no way to reach any other year of that tour. The page they were on is now two Back presses away.

The diff argues at length (lines 62-68 of `TourCompetitions.jsx`) that querying all years is what keeps "no such tour" distinguishable from "no round this year" — and then throws every one of those loaded rows away. The data to fix this is already in memory.

Fix: when `thisYear.length === 0`, render the ribbon with the most recent year that *does* have rounds, under a heading that states which year is shown; or at minimum append "Voir l'édition {lastYear}" to the empty message. Either way the loaded `tourRows` should not be discarded.

### M7 — The whole tour-bearing agenda is downloaded to render three rows
`src/pages/TourCompetitions.jsx:38-55`

The query is `published=true AND tour_name IS NOT NULL`, ordered, `.limit(2000)` — every column of every tour competition of every year, on every tour page view, to display the current year of one tour. The comment frames this as a feature ("passer d'un circuit à l'autre ne relance rien"), but the cost is paid by the 99% of visitors who open exactly one tour page, and it duplicates the agenda's payload with no shared cache.

Compounding: `.limit(2000)` truncates from the **oldest** end (order is `date_start DESC`). Once the archive exceeds 2000 tour rows, an old tour's entire row set falls off the tail and its page starts returning **404 instead of "no round this year"** — silently inverting the exact distinction this design was built to preserve.

Fix: keep the "all years" semantics but shrink the query — `.select('id, tour_name, date_start, date_end')` for the existence check plus a second narrow query for the current year, or add a lightweight `tour_slugs` RPC. If the wide query stays, at least justify the 2000 cap against the actual row count and log when `data.length === 2000`.

### M8 — `[verify]` `tr.competitions.loadError` and the `Icon` names are used without evidence they exist
`src/pages/TourCompetitions.jsx:62,98,102`; `src/pages/CompetitionDetail.jsx:181`

The diff **adds** five i18n keys (`tourKicker`, `tourSite`, `tourSeeAll`, `tourNoneThisYear`, `allCompetitions`) and all five are used. But `tr.competitions.loadError` (line 62) is used and **not added** — the surrounding hunk of `Competitions.jsx` where an error key would already live is not in the diff, so I cannot confirm it exists. If it does not, the failure branch renders an empty `<p>`: a blank page on every load error, with no console noise.

Same class: `Icon name="arrow-left"` and `name="arrow-right"` are new names in this diff (`external-link` at least has precedent in `CompetitionDetail`). An unregistered icon name typically renders nothing, leaving `"Toutes les compétitions"` with a leading space and no affordance — or throws, depending on the registry.

Fix: grep `translations.js` for `loadError` under `competitions` in both `fr` and `en`, and grep the `Icon` registry for `arrow-left` / `arrow-right`. Add whatever is missing. This is the one check ESLint will not do for you.

### M9 — `[verify]` `todayISO()` called with no argument
`src/pages/TourCompetitions.jsx:27`

```js
const year = todayISO().slice(0, 4)
```

Every other call in this diff passes an explicit date (`CompetitionRibbon.jsx:42`: `todayISO(now)`). If the helper's parameter has no default, this is `undefined.slice` → the tour page throws on first render, for every tour, always. If it does default, fine — but the diff gives no evidence either way, and the asymmetry with the sibling call is a smell.

Fix: confirm the signature; pass `todayISO(new Date())` for symmetry regardless.

---

## LOW

### L1 — The sitemap comment argues for `daily` and the code emits `weekly`
`scripts/generate-sitemap.js:83-95`

```js
// … leur contenu tourne chaque janvier, d'où `daily` plutôt qu'un `changefreq` figé.
const tourRoutes = [...tourSlugs.keys()].map(slug => ({
  url: `/competitions/circuit/${slug}`,
  priority: 0.5,
  changefreq: 'weekly',
}))
```

The justification and the value contradict each other outright. Whichever is right, one of them is now a lie that the next reader will trust.

Fix: pick one. (`weekly` is the defensible choice — the content is static for 11 months of the year, and `daily` on a page that rarely changes is the classic way to get `changefreq` ignored entirely. Then delete the comment's second half.)

### L2 — Dead code in the sitemap: a `Map` used as a `Set`
`scripts/generate-sitemap.js:86-89`

`tourSlugs.set(slug, c.tour_name)` stores a value that is never read — only `.keys()` is consumed. Either use `new Set()`, or keep the `Map` and actually use the name (e.g. to warn on the H3 collision: two different `tour_name`s claiming one slug is detectable here at build time, for free).

### L3 — Tour pages are put in the sitemap with no check that they have content
`scripts/generate-sitemap.js:86-95`

Every distinct `tour_name` ever recorded produces a sitemap entry, including tours that folded in 2023. Those URLs resolve to a page whose entire body is *"Aucune étape annoncée pour 2026"* — thin content, submitted deliberately to a crawler. Filter to tours with at least one round in the current year, or ship the M6 fix so the page always has a list.

### L4 — Dead CSS: the mobile compact-logo override is overridden by a later rule at equal specificity
`src/components/CompetitionRibbon.module.css:292` vs `:306`

```css
@media (max-width: 800px) { .compact .logo, .compact .logoFallback { max-height: 22px } }   /* line ~292 */
…
.compact .logo, .compact .logoFallback { max-height: 26px; }                                 /* line ~306 */
```

Same specificity, the unconditional rule comes **later**, so it wins at every viewport and the 22px mobile intent never applies. Carried over verbatim from `Competitions.module.css` — which is exactly why an "extraction" commit is the moment to catch it, since the file header claims the rules are the old ones "à l'octet près" and therefore invites nobody to read them.

Fix: move the two late `.compact .node/.logo/.logoFallback` rules (lines ~304-307) above the media block, or scope the mobile one with an extra selector.

### L5 — The year is printed twice, four lines apart
`src/pages/TourCompetitions.jsx:91` and `src/components/CompetitionRibbon.jsx:113`

The masthead renders `<p className={styles.year}>{year}</p>` in accent, and the ribbon immediately below renders its own `newYear` separator — which, on a single-year list, always fires at `i === 0` and always shows the same string. Two "2026" labels stacked with ~40px between them.

Fix: add a `showYearMarks` prop (default `true`) and pass `false` from the tour page, or drop the masthead's `<p>` and let the ribbon's separator carry it.

### L6 — Nothing on `/competitions` links to a tour page
`src/components/CompetitionRibbon.jsx:120-122`

The ribbon renders `{c.tour_name && <span>{c.tour_name}</span>}` as inert text. The only entry point to the new feature is a competition detail page, two clicks deep, below the fold. A public page that nothing links to is a page nobody finds; the sitemap will index it before a human reaches it.

Fix: make that meta span a `<Link to={tourPath(c.tour_name)}>` — guarding the `null` return per H5 — or accept the omission deliberately and say so in the CLAUDE.md paragraph this diff added.

### L7 — `.replace('{year}', year)` on a translation string
`src/pages/TourCompetitions.jsx:111`

`String.prototype.replace` with a string needle substitutes only the **first** occurrence. `tourNoneThisYear` uses `{year}` once today; a translator who writes it twice gets a half-interpolated sentence with a literal `{year}` in it, and nothing fails loudly. Also, this is the first ad-hoc placeholder in `translations.js` as far as the diff shows — a one-off convention that the next feature will copy or contradict.

Fix: `replaceAll`, or a two-line `interpolate(str, vars)` helper next to `useT`.

### L8 — `thisYear` names a year string in one file and an array of rows in the other
`src/components/CompetitionRibbon.jsx:42` (`const thisYear = todayISO(now).slice(0,4)`) vs `src/pages/TourCompetitions.jsx:68` (`const thisYear = tourRows.filter(…)`).

Two files read side by side, one identifier, opposite types. Rename the array to `currentYearRows`.

### L9 — Loading and error states render without the page chrome or an SEO tag
`src/pages/TourCompetitions.jsx:59-62`

`if (loading) return <span className="spinner" />` — no `styles.page` wrapper, no `<SEO>`, no `role="status"`/`aria-live`, so a screen reader is told nothing during a multi-second fetch and the layout jumps when content arrives. The `failed` branch gets `styles.page` but still no `<SEO>`. `Competitions.jsx` (line 43-58) renders `<SEO>` and the heading during loading; the new page does not match it.

Fix: render `<SEO>` + masthead skeleton in all three states, and give the spinner `role="status" aria-label`.

### L10 — No retry path after a failed fetch
`src/pages/TourCompetitions.jsx:38-55,62`

The effect has `[]` deps and there is no refetch affordance, so a single transient network error pins the page on the error message until a full reload. Cheap fix: a retry button that bumps a `nonce` in the dep array.

### L11 — `tourUrl` is picked from the newest row that has one, which may be a past edition's site
`src/pages/TourCompetitions.jsx:75`

`tourRows.find(c => c.tour_url)` scans in `date_start DESC` order across **all** years. If the 2026 rounds were entered without a `tour_url` and the 2024 ones carry the old `.com`, the header's "Site du circuit" points at a domain that may have lapsed. Prefer a current-year row's URL, falling back to the most recent.

### L12 — Decorative icons inside links are not hidden from assistive tech
`src/pages/CompetitionDetail.jsx:181`, `src/pages/TourCompetitions.jsx:98,102`

`<Icon name="arrow-right" size={13} />` etc. sit inside links that already have visible text. Unless `Icon` sets `aria-hidden="true"` internally (not shown in the diff), the `<svg>` is exposed and some screen readers announce a bare "graphic" after each link label. Pass `aria-hidden` explicitly, or confirm `Icon` does it.

### L13 — No focus styling on the two new link treatments
`src/pages/CompetitionDetail.module.css:317` (`.tourLink:hover`), `src/pages/TourCompetitions.module.css` (`.out:hover`)

Both define a hover state and nothing for `:focus-visible`. If the global stylesheet does not supply a visible focus ring, keyboard users get the browser default outline on top of an `inline-flex` element with a transparent bottom border — inconsistent with the deliberate hover affordance. Add `:focus-visible` alongside each `:hover`.

### L14 — `.not('tour_name','is',null)` does not exclude empty strings
`src/pages/TourCompetitions.jsx:44`

A `tour_name` of `''` or `'   '` passes the filter, is fetched, and is then discarded by the client-side slug comparison. Harmless output, wasted payload, and it makes the row count in the M7 cap less predictable. Either add `.neq('tour_name','')` or put a `check (tour_name is null or btrim(tour_name) <> '')` on the column — the latter also removes the H5 failure mode at the source.

---

## Requirement check: "`/competitions` renders exactly as before"

Not quite. The markup and CSS are a faithful move (I diffed the deleted block against the new module — the rules match), but two behavioural deltas slipped in:

- **M1**, the anchor-scroll flag now depends on the ribbon having mounted successfully; after a failed load, Back-navigation scroll restoration is overwritten.
- The anchor effect's dependency array changed from `[loading, navType]` to `[anchorToToday, navType]` and its `if (loading) return` guard was replaced by the conditional mount at `Competitions.jsx:61`. That happens to be equivalent **only because** the caller wraps the ribbon in `!loading && !failed`. Nothing in `CompetitionRibbon`'s signature or JSDoc states that contract, so the next caller that mounts the ribbon eagerly with `rows={[]}` will anchor to index 0 of an empty list. Document it or guard on `rows.length`.
