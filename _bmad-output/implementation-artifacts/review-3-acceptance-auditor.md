# Acceptance audit — `spec-tour-page.md` (A public page per competition tour)

Baseline: `63898a4`. Audited against `review-diff.patch` (captured 17:21).
Scope: compliance with the spec and the project's stated rules. Not a bug hunt.

> **The working tree moved during this audit.** At 17:28 `src/pages/CompetitionDetail.jsx` and `src/pages/TourCompetitions.jsx` were edited by someone else (a parallel review pass, presumably), after the patch was captured. Findings **§4.6** (case-sensitive slug) and **§4.7** (`<Link to={null}>`) are **already fixed in the tree** — `TourCompetitions.jsx:24-25` now does `slugify(rawSlug)`, and `CompetitionDetail.jsx:187` now guards on `tourPath(comp.tour_name)`. They are kept below because they are real defects of the reviewed patch, marked as resolved. `tourNoneThisYear` also switched from `.replace` to `.split().join()`. All other citations still hold; line numbers in `TourCompetitions.jsx` after :24 and in `CompetitionDetail.jsx` after :180 have shifted by +5 and +6 in the live tree. `npm run lint` re-run after those edits: still 9 errors / 7 warnings.

Commands run for this audit: `npm run lint` → **9 errors / 7 warnings** (baseline, no new problem in any new/changed file); `npm run build` → **succeeds**; `public/sitemap.xml` (gitignored, regenerated 2026-09-10T15:20) contains exactly **2** `/competitions/circuit/…` URLs (`le-pro-tour`, `exo-tour`).

---

## 1. Acceptance criteria

### AC1 — "Given `/competitions` before and after, when both render, then the DOM/geometry fingerprint of every ribbon row is identical."

**Not met as an acceptance step — the verification was never performed or recorded.**

The string `fingerprint` appears nowhere in the repository except in the spec itself (`spec-tour-page.md:22`, `:76`, `:98`). There is no dev-notes/story file, no captured DOM dump, no diff output, no screenshot, and no note anywhere in `_bmad-output/` recording a before/after comparison of `/competitions`. The spec explicitly demands "verify by before/after fingerprint, **not by eye**"; nothing in the artifacts shows either was done. State this plainly to the owner: **AC1 is unverified.**

The *underlying claim* nevertheless holds under my own byte-level check, which is not the same thing as the required verification but is worth recording:

- CSS: `git show 63898a4:src/pages/Competitions.module.css` lines 34–337 are **byte-identical** to `src/components/CompetitionRibbon.module.css` lines 6–309 (`diff` → empty). Only difference in the move: one leading blank line dropped, and a 4-line header comment added (`CompetitionRibbon.module.css:1-4`).
- CSS remainder: `src/pages/Competitions.module.css` (32 lines) is **byte-identical** to lines 1–32 of the 63898a4 file.
- JSX: the `rows.map(…)` block through `</ol>` in `CompetitionRibbon.jsx:103-190` is identical (whitespace/comment-normalised `diff` → empty) to `Competitions.jsx:112-229` at 63898a4; the suggest `<li>` block is likewise verbatim, now behind `{suggest && …}` (`CompetitionRibbon.jsx:79`), and `/competitions` passes `suggest` (`Competitions.jsx:62`).
- `Competitions.jsx:41-64` reproduces the previous render tree exactly (SEO, masthead, spinner, error, empty) with only the `<ol>` replaced by `<CompetitionRibbon>`.

One caveat the fingerprint procedure must account for: the ribbon rules moved to a **new CSS module**, so the generated scoped class names (`_item_xxxxx`) change. A naive `outerHTML` diff will report a difference on every row. The fingerprint has to compare structure + computed geometry, not raw `class` attribute values.

Two behavioural residues of the move, neither pixel-affecting:
- `mountedOnce` moved from `Competitions.jsx` module scope to `CompetitionRibbon.jsx:11` and is now **shared across both surfaces**. The tour page cannot pollute it (`CompetitionRibbon.jsx:66` returns before `mountedOnce = true` when `anchorToToday` is false), so the behaviour is preserved — but the coupling is new and undocumented.
- The anchor effect's guard changed from `if (loading) return` / deps `[loading, navType]` to `if (!anchorToToday) return` / deps `[anchorToToday, navType]` (`CompetitionRibbon.jsx:65-72`). Equivalent on the happy path because the ribbon only mounts when `!loading && !failed`. Divergence exists only in the failed-fetch case (`mountedOnce` now stays `false`, so a later back-navigation would re-anchor where it previously would not).

### AC2 — "Given a competition with a `tour_name`, a link leads to that tour's page; given one without, no link appears."

**Met.** `CompetitionDetail.jsx:182-186` — the link is guarded by `comp.tour_name &&` and targets `tourPath(comp.tour_name)`. `tour_name` is in the page's select (`CompetitionDetail.jsx:18-20`).

Residual risk (see §4.6): the guard is on `tour_name`, not on `tourPath(...)`, which returns `null` for a name that slugifies to the empty string.

### AC3 — "Given a tour page, every listed competition belongs to that tour and to the current year."

**Met.** `TourCompetitions.jsx:66` filters by `slugify(c.tour_name) === slug`; `:68` filters to the venue-year (`todayISO()` → `Europe/Paris`, `competitionDates.js:60-64`) using `date_end || date_start`, i.e. the same "year of the end" rule the ribbon uses (`CompetitionRibbon.jsx:113`); `:119` passes only `thisYear` to the ribbon. The query itself is `published = true` (`TourCompetitions.jsx:44`).

### AC4 — "Given a slug matching no published tour, `NotFound` renders — not an empty ribbon."

**Met.** `TourCompetitions.jsx:72` — `if (tourRows.length === 0) return <NotFound />`, evaluated over rows from **all years** (`:66`), so the test is "no published competition anywhere bears this tour", which is the right predicate. `NotFound` is the same component `CompetitionDetail.jsx:98` uses, and it carries `noindex` (`NotFound.jsx:17`).

### AC5 — "`npm run lint`, 9 errors / 7 warnings baseline unchanged."

**Met.** Verified: 16 problems, 9 errors / 7 warnings, all in the pre-existing judging/competition files (`CompositionSimple`, `France2026`, `JudgeVoice`, `admin/AdminParcours`, `admin/ParcoursSetup`, `competition/CompetitionView`, `competition/HeatTab`). No new file appears in the lint output.

---

## 2. I/O & edge-case matrix

| # | Scenario | Verdict | Evidence |
|---|----------|---------|----------|
| 1 | Tour with rounds this year → ribbon, newest first, logo + name as heading | **Met** | `TourCompetitions.jsx:46-47` (`date_start desc`, `id desc` — same order as the agenda), `:119` ribbon; heading `:87-94` = `RemoteLogo(tourLogoPath(tourName))` + kicker + `<h1>{tourName}</h1>` + year. Spec Code Map also asked for the year in the heading — present (`:92`). |
| 2 | Tour with none this year → named empty state + link to the full agenda | **Met, with an unstated addition** | `TourCompetitions.jsx:110-112` renders `tourNoneThisYear`; the agenda link is permanently present at `:102-104`. See §4.5 — the FR/EN copy adds an editorial claim the spec did not ask for. |
| 3 | Unknown slug → `NotFound` | **Met** | `TourCompetitions.jsx:72`. Case-sensitivity caveat in §4.6. |
| 4 | Slug of an unpublished tour → indistinguishable from unknown | **Met** | See §3 for the full leak analysis. |
| 5 | Two names, one slug → both sets shown, heading takes the first row's `tour_name` | **Met** | `:66` slug-equality collects both spellings into `tourRows`; `:74` `tourRows[0]?.tour_name`. `tourRows` is sorted newest-first across all years, so "first row" = most recent bearer — a defensible reading of the matrix, but note it is not necessarily the first row *displayed* (that one comes from `thisYear`). Each ribbon row still shows its own spelling in `meta` (`CompetitionRibbon.jsx:135`). |
| 6 | Comp with no tour → no link | **Met** | `CompetitionDetail.jsx:182`. |

---

## 3. The 404-vs-empty distinction, and whether it can leak

**The distinction is implemented and does not leak.**

- The query at `TourCompetitions.jsx:42-50` is **independent of the slug** — it selects every published competition with a non-null `tour_name`, all years, and resolves the slug afterwards in JS (`:66`). There is therefore no server-side oracle at all: probing `/competitions/circuit/<guess>` issues byte-identical requests whatever the guess, so response size, timing and status cannot differentiate a real unpublished tour from a made-up name.
- `published = true` is applied both by the explicit filter (`:44`) and by RLS. An unpublished-only tour yields `tourRows.length === 0` → `NotFound` (`:72`), the same branch as a nonsense slug. Nothing on the 404 page varies by slug.
- The empty state (`:110`) can only be reached when `tourRows.length > 0`, i.e. when at least one **published** competition of that tour exists in another year — a tour the public already knows about. It cannot be triggered by a draft.
- The sitemap derives tour slugs from a `published = true` query (`generate-sitemap.js:70-72, 87-96`), so an unpublished tour is not enumerated there either.

The implementation achieves this by **fetching every year and filtering to the current one at render**, which contradicts the spec's own task line ("fetch published comps of the **current year**", `spec-tour-page.md:68`) and its Design Notes ("the page already fetches the current year's published competitions", `:88`). The task text, taken literally, would have collapsed rows 2 and 3 of the matrix into a single 404. The implementation correctly resolved the spec's internal contradiction in favour of the matrix, documented the reasoning in-code (`TourCompetitions.jsx:35-41`) and in `CLAUDE.md:47`. **But the deviation is not recorded in the spec's "Spec Change Log" section, which is empty (`spec-tour-page.md:82-83`).** That is the process gap: a reader of the spec alone would still believe the page fetches one year.

Cost of that choice, unstated anywhere: every visit to any tour page downloads the whole published-with-tour agenda (capped at 2000 rows, `TourCompetitions.jsx:50`). Acceptable at current volume; worth a line in deferred work.

---

## 4. Boundary and rule violations

### 4.1 "The URL shape has one definition" — violated (3 definitions)

`spec-tour-page.md:55` justifies adding `tourPath()` precisely "so the URL shape has one definition". The function exists (`competitionAssets.js:25-28`) but only **one** of the three call sites uses it:

- `CompetitionDetail.jsx:183` — uses `tourPath()`. ✅
- `scripts/generate-sitemap.js:93` — hand-built `` `/competitions/circuit/${slug}` ``. `competitionAssets.js` imports nothing but `slugify` from `competitionDates.js`, so it is importable from a Node script exactly as `competitionPath` already is (`generate-sitemap.js:5`). No reason not to.
- `TourCompetitions.jsx:84` — hand-built `` path={`/competitions/circuit/${slug}`} `` for the canonical URL.

This is the same failure mode the sitemap's own header comment warns about (`generate-sitemap.js:3-4`: "deux copies divergentes produiraient des URLs de sitemap différentes des canonical") — and here there are three copies, one of them *in that very file*.

### 4.2 File modified outside the declared Code Map

`src/pages/CompetitionDetail.module.css:307-320` (new `.tourLink` rules) is not in the Code Map (`spec-tour-page.md:56` lists only `CompetitionDetail.jsx`). Necessary and small, but undeclared.

Everything else changed is in the Code Map. `public/sitemap.xml` was also regenerated, but it is gitignored (`.gitignore:9`) and is a build output, not a source change.

Not updated (outside the Code Map, so not a violation — flagged as drift): `docs/component-inventory.md` still has no entry for `CompetitionRibbon`, and `docs/architecture.md` / `_bmad-output/project-context.md` still describe the ribbon as living in `Competitions.jsx`.

### 4.3 Ribbon props — undeclared third prop

Code Map (`spec-tour-page.md:51`) declares "Props: `rows`, `anchorToToday`", and task line `:66` says `/competitions` "keeps … the '?' suggest entry" (`:53`). The implementation instead moved the suggest row **into** the component behind a third prop (`CompetitionRibbon.jsx:31,79`). The reasoning is sound and documented (`CompetitionRibbon.jsx:23-25`, `CLAUDE.md:51`) — and it is what keeps `/competitions`' DOM byte-identical, which a page-level suggest row would not have — but it is a deviation from two Code Map lines with no Change Log entry.

### 4.4 Sitemap — comment contradicts code, and dead data

- `generate-sitemap.js:84-86` states "leur contenu tourne chaque janvier, **d'où `daily`** plutôt qu'un `changefreq` figé". The code at `:95` sets `changefreq: 'weekly'`. The comment is simply wrong about its own code; one of the two must change.
- `tourSlugs` is a `Map` whose values (`c.tour_name`, `:90`) are never read — only `.keys()` is used (`:92`). A `Set` is what is meant.
- "Respect `MAX_ROWS`" (`spec-tour-page.md:59`) is **met**: tours are derived from the already-capped `comps` query, which is covered by `avertirSiPlafondAtteint` (`:73`).

### 4.5 "Nothing on the page is produced by WakeRef — dates, names and links only" — partially breached

`spec-tour-page.md:24`. The matrix asks for an empty state reading "aucune étape en {année}". The shipped copy goes further:

- FR (`translations.js:234`): "Aucune étape annoncée pour {year} — **les dates arrivent en général au printemps.**"
- EN (`translations.js:628`): "No round announced for {year} yet — **dates usually land in spring.**"

That trailing clause is a WakeRef-authored editorial claim about an *arbitrary* tour's calendar, asserted for every tour with no per-tour knowledge behind it. It is exactly the kind of produced content the boundary excludes. The first half satisfies the matrix on its own; the second half was not asked for and is not defensible for a tour WakeRef does not run.

(The SEO description at `TourCompetitions.jsx:78-83` is also WakeRef prose, but it is `<meta>`, not on the page, and it mirrors the pattern already used on `/competitions` — I do not count it as a breach.)

### 4.6 Slug matching is case-sensitive while the router is not — FIXED IN TREE AFTER THE PATCH

`TourCompetitions.jsx:66` compares the raw route param against `slugify(tour_name)`. React Router matches path segments case-insensitively, so `/competitions/circuit/Le-Pro-Tour` **routes to the page and then renders `NotFound`** — a legitimate shared link (capitalised by a mail client, a CMS, or a person typing) 404s on a tour that exists. `CLAUDE.md:106` states the project's position on exactly this hazard ("the router matches case-insensitively, so `/Compo/x` must redirect like `/compo/x`"), so the convention is stated and not followed here. Fix is one call: compare `slugify(slug)`, which is idempotent on an already-valid slug.

Related: `TourCompetitions.jsx:84` emits the canonical from the **raw** param, so any non-canonical casing that did resolve would advertise itself as canonical.

### 4.7 `tourPath()` can return `null` into `<Link to=…>` — FIXED IN TREE AFTER THE PATCH

`CompetitionDetail.jsx:182-183` guards on `comp.tour_name` but links to `tourPath(comp.tour_name)`, which returns `null` when the name contains no `[a-z0-9]` after normalisation (`competitionAssets.js:26-27`, `competitionDates.js:95-97`). `tour_name` is free text with no DB constraint. The guard should be on the computed path, not the raw field.

### 4.8 Same `tour_url`, two different outbound URLs

`TourCompetitions.jsx:98` wraps the tour site in `externalUrl(tourUrl, { ref: true })` (adds `utm_source`/`utm_medium`), while `CompetitionDetail.jsx:163` links the same column raw (`href={comp.tour_url}`). The spec's boundary (`:24`) asks for `externalUrl`, so the new page is the compliant one and the detail page is pre-existing (untouched, correctly out of scope) — but the two surfaces now emit different URLs for the same value. Also note `url.js:6-8` says `{ ref: true }` is meant to be paired with dropping `rel="noreferrer"`; the spec mandates keeping `noopener noreferrer` (`:24`), which the page does (`:98`) — so the UTM params work but the Referer header is still stripped. Compliant with the spec, at odds with the helper's documented intent.

---

## 5. Boundaries confirmed clean

- **"Current year only"** — enforced at `TourCompetitions.jsx:68`, and enforced *at render*, not at query, for the reason in §3. The ribbon's own `compact` rule (`CompetitionRibbon.jsx:124`) therefore degenerates to `state === 'past'` on the tour page, and `newYear` fires exactly once, as the Design Notes predicted (`spec-tour-page.md:86`).
- **"The ribbon is one component"** — `Competitions.jsx` retains no list markup and no ribbon CSS; `TourCompetitions.jsx:119` uses the same component. No second visual language: the tour page's own CSS covers only masthead, links and empty state.
- **"No `tours` table / FK / admin field"** — no SQL touched, no `scripts/migrations/` entry, no admin file changed, no schema file changed. The tour remains derived from `tour_name` text (`competitionAssets.js:25`).
- **Routing rules** — `/competitions/proposer` still precedes `/competitions/:idSlug` (`App.jsx:71,75`); the new route is inserted between them (`:74`) and is two segments, so it cannot be read as an id. `vercel.json` untouched: its `redirects` enumerate `/competition` and `/competition/:code` only, neither of which matches `/competitions/circuit/…`. The `rewrites` catch-all already serves the SPA shell. `React.lazy` used (`App.jsx:26`), consistent with the every-route-but-`/` rule.
- **Anon-only reads** — `.eq('published', true)` at `TourCompetitions.jsx:44`; no `security definer` RPC added, no policy change needed. (The spec's manual check "as anon in a private window" (`:100`) is likewise **not recorded** anywhere — same gap as AC1, though the code-level guarantee is unambiguous here.)
- **FR/EN parity** — all five new keys exist in both maps with matching `{year}` placeholders: FR `translations.js:230-234` (`tourKicker`, `tourSite`, `tourSeeAll`, `tourNoneThisYear`, `allCompetitions`), EN `translations.js:624-628`. `tour_name` is rendered raw everywhere, never translated. Both SEO titles/descriptions are supplied in FR and EN (`TourCompetitions.jsx:78-83`).
- **Project conventions** — CSS Modules + co-located file, no new dependency, no TypeScript, `Icon` wrapper used for all three glyphs (`arrow-right`, `arrow-left`, `external-link`, all present in `Icon.jsx:78,79,99`), global `.spinner` reused (`TourCompetitions.jsx:59`), tokens from `index.css` only, `supabase` singleton used, no admin import from a public page. `npm run build` green, `node scripts/generate-sitemap.js` produced the two expected URLs.
- **CLAUDE.md documented** — `CLAUDE.md:47` (derived-tour convention + the all-years/one-year rationale), `:51` (the ribbon as the single feed rendering, with both props), `:103` (route table), `:106` (why the two-segment route cannot collide). Task line `:73` satisfied.

---

## 6. Summary of what must be answered before this ships

1. **AC1 was never performed or recorded.** Run the before/after fingerprint (comparing structure + computed geometry, ignoring hashed class names) and record the result, or have the owner accept the byte-level equivalence evidence in §1 as a substitute. Same for the "verify as anon" check.
2. Empty `Spec Change Log` despite three real deviations: all-years query (§3), `suggest` prop (§4.3), `CompetitionDetail.module.css` (§4.2).
3. `tourPath()` bypassed twice (§4.1) — the one thing the spec added it for.
4. Case-sensitive slug match 404s legitimate links (§4.6).
5. Empty-state copy asserts a schedule claim WakeRef cannot make (§4.5).
6. Sitemap comment contradicts its code, and `tourSlugs` values are dead (§4.4).
7. `<Link to={null}>` possible for a punctuation-only `tour_name` (§4.7).
