---
title: 'Rename public & admin routes to free the "competitions" namespace'
type: 'refactor'
created: '2026-09-07'
status: 'done'
baseline_commit: '4fcf66c84744437834bf9014b49aa80b6b7b9cee'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/competition*` and `/admin/competitions*` are occupied by the judging module (which serves *parcours*, not competitions), and the upcoming public "competitions agenda" feature needs that namespace. Several current paths also describe their page poorly (`/compo-old`, `/composition-simple`, `/judge` for a training surface).

**Approach:** Rename the affected public, chromeless and admin routes to an exact French vocabulary, keep already-shared URLs alive through permanent client-side redirects, and rename the two admin components that would otherwise collide by name with the future feature.

## Boundaries & Constraints

**Always:**
- Redirect the paths that circulate as shared links — `/compo/:id` is the saved-run share URL, `/competition/:code` the code judges pass around. Use `<Route element={<Navigate to=… replace />} />`, not `vercel.json`.
- Update the `path` prop of `<SEO>` on every moved page (it builds the canonical URL).
- Rename only: no content, copy, styling or behaviour change. Judging surfaces stay FR-only.

**Ask First:**
- Renaming the `lib/`, `components/` or `pages/competition/` directories (out of scope: that module legitimately models a sporting competition; only the two *admin* files collide by name).
- Changing any user-visible label (e.g. the Navbar "Compo" wording) — paths move, wording does not.

**Never:**
- Do not redirect `/compo-old` or `/composition-simple` — explicitly waived by the human.
- Do not touch `scripts/generate-sitemap.js`: no renamed route appears in it (`/`, `/figures`, `/quiz`, `/contact` only).
- Do not start the competitions agenda feature (lots A/B/C in `deferred-work.md`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Shared run link | GET `/compo/aB3xY` | Redirect to `/composition/aB3xY`, run loads | N/A |
| Shared parcours code | GET `/competition/ABCD1234` | Redirect to `/juge/ABCD1234`, parcours loads | Unknown code → existing not-found handling, unchanged |
| Bare old paths | GET `/competition`, `/judge`, `/judge/voix` | Redirect to `/juge`, `/entrainement-juge`, `/entrainement-juge/voix`; canonical is the new URL | N/A |
| Waived legacy paths | GET `/compo-old` or `/composition-simple` | 404 (NotFound) — no redirect, by decision | N/A |
| Namespace freed | GET `/competitions` | 404 today; the path is unclaimed for the future feature | N/A |

</frozen-after-approval>

## Code Map

**Path mapping:** `/compo`→`/composition` · `/compo/:id`→`/composition/:id` · `/compo-old`→`/grille-composition-old` · `/composition-simple`→`/grille-composition` · `/judge`→`/entrainement-juge` · `/judge/voix`→`/entrainement-juge/voix` · `/competition`→`/juge` · `/competition/:code`→`/juge/:code` · `/admin/competitions*`→`/admin/parcours*` · `/admin/judge-runs*`→`/admin/runs-entrainement-juge*`

- `src/App.jsx` -- every route declaration + the two lazy imports; where redirects are added
- Internal links: `Navbar.jsx`, `Footer.jsx`, `Home.jsx` · `<SEO path>` only: `JudgeTraining.jsx`, `JudgeVoice.jsx`, `CompositionSimple.jsx`, `France2026.jsx`
- `Compo.jsx` (`<SEO path>` + `shareUrl`) · `competition/CompetitionView.jsx` (two `navigate()`)
- `pages/admin/`: `AdminCompetitions.jsx`+css and `CompetitionSetup.jsx`+css (renamed; `ParcoursSetup` also builds a `shareUrl`), plus links in `AdminLayout.jsx`, `AdminJudgeRuns.jsx`, `JudgeRunForm.jsx`, `AdminCompositions.jsx`
- Stale comments only: `lib/competition/voice.js`, `vite.config.js`, `scripts/competition_parcours.sql`

## Tasks & Acceptance

**Execution:**
- [x] `src/pages/admin/AdminCompetitions.jsx`+css, `src/pages/admin/CompetitionSetup.jsx`+css -- rename files and components to `AdminParcours` / `ParcoursSetup`, update their links, `navigate()` and `shareUrl` (`/juge/<code>`) -- frees the names for the future competitions admin
- [x] `src/App.jsx` -- apply the full path mapping, rename the two lazy imports, add redirect routes for `/compo`, `/compo/:id`, `/judge`, `/judge/voix`, `/competition`, `/competition/:code` -- single source of routing truth
- [x] `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `src/pages/Home.jsx` -- retarget nav links -- otherwise every internal link bounces through a redirect
- [x] `src/pages/Compo.jsx` -- `<SEO path>` + `shareUrl` -- newly saved runs must share the new URL
- [x] `src/pages/JudgeTraining.jsx`, `src/pages/JudgeVoice.jsx`, `src/pages/CompositionSimple.jsx`, `src/pages/France2026.jsx` -- `<SEO path>` -- canonical must match the served URL
- [x] `src/pages/competition/CompetitionView.jsx` -- `navigate()` calls -- "enter another code" must stay in the new namespace
- [x] `src/pages/admin/AdminLayout.jsx`, `AdminJudgeRuns.jsx`, `JudgeRunForm.jsx`, `AdminCompositions.jsx` -- sidebar entries, `navigate()`, preview link -- admin must not 404 on itself
- [x] `src/lib/competition/voice.js`, `vite.config.js`, `scripts/competition_parcours.sql` -- refresh stale path mentions in comments -- cosmetic, keeps comments truthful

**Acceptance Criteria:**
- Given a link shared before the rename, when opened, then the user lands on the new path with the same content and no flash of a not-found page.
- Given the Navbar, Footer, Home tiles and admin sidebar, when every entry is clicked, then no link resolves through a redirect and none 404s.
- Given `npm run lint`, when it runs, then it reports no more errors/warnings than the pre-change baseline (9 errors / 7 warnings, all in the judging module).
- Given the future feature claims `/competitions` and `/admin/competitions`, then no existing route, component or file name collides.

## Spec Change Log

**2026-09-07 — review iteration 1 (patches only, no re-derivation).**
- *Finding (all three reviewers): `LegacyRedirect` served a blank page on a miscased legacy path.* React Router matches case-insensitively while `String.replace` is case-sensitive, so `/Compo/x` rewrote to itself and `<Navigate>` re-navigated to the same URL, leaving the component mounted rendering `null`. Amended the implementation, not the spec: the three splat routes were replaced by six explicit routes (`/compo`, `/compo/:rest`, `/judge`, `/judge/voix`, `/competition`, `/competition/:rest`) and the target is now rebuilt from `useParams()`.
- *Finding (edge-case hunter): the splat was broader than the closed legacy suffix set.* `/compo/a/b/c` was rewritten to `/composition/a/b/c` — a path that never existed — and `<Navigate replace>` erased the real URL from history, hiding the broken link from the user and from analytics. The explicit routes above fix this too: unknown deep paths now 404 at their real URL.
- *Finding (auditor): `CLAUDE.md` and `project-context.md` still declared the old route table.* Fixed in-change. These are the normative files every future agent reads; leaving them stale would have invited the next session to re-claim `/admin/competitions`, the namespace this work exists to free. A "reserved paths" note was added to `CLAUDE.md`.
- *Finding (auditor): task 8 was marked done with two stale comments left* (`CompetitionView.module.css:33`, `CableMinimap.module.css:1`). Fixed.
- *Known-bad state avoided:* shipping a redirect layer that turns a clean 404 into a blank page or into a fabricated URL — strictly worse than not redirecting at all.
- **KEEP on any re-derivation:** the closed-suffix routing (never a splat); rebuilding targets from route params rather than string substitution on `pathname`; `search` + `hash` preservation; and the deliberate absence of any `/admin/competitions` redirect.
**2026-09-07 — post-review, human-directed (outside the original scope).**
- *Server-side redirects added* in `vercel.json` (`permanent: true` → 308) for the same six closed suffixes. Amends the spec's "Always" rule that mandated Router-only redirects: two reviewers independently showed a client-side `<Navigate>` returns HTTP 200 + the generic shell, so crawlers don't consolidate and Slack/WhatsApp unfurls of shared `/compo/:id` links show default metadata. **Both layers are kept on purpose** — the edge redirect can't help a returning PWA user whose service worker serves the cached shell without hitting the network.
- *Labels renamed* (the "Ask First" item, decided by the human): admin sidebar `Compétition` → `Parcours` for `/admin/parcours`, and the gate heading on `/juge` `WakeRef · Compétition` → `WakeRef · Juge`. Both would have collided with the competitions agenda's own vocabulary at lot A.

- *Noted, not fixed (frozen block, human's call):* the I/O matrix row claiming "canonical is the new URL" overreaches — `CompetitionView` renders no `<SEO>`, so `/juge` inherits `index.html`'s site-wide canonical. Pre-existing, not a regression, but the row states more than the code can deliver.

## Verification

**Commands:**
- `npm run lint` -- expected: no new errors/warnings versus the pre-change baseline
- `npm run dev` -- expected: app boots; the routes below behave as specified

**Manual checks:**
- `/compo/<saved run id>` and `/competition/<parcours code>` redirect and load their content; `/compo-old` and `/composition-simple` serve NotFound.
- `/juge`, `/entrainement-juge`, `/entrainement-juge/voix`, `/composition`, `/grille-composition`, `/grille-composition-old` each render their page.
- In `/admin/parcours`, saving a parcours yields a share URL reading `/juge/<code>`.

## Suggested Review Order

**The redirect mechanism (the only non-mechanical part)**

- Entry point: the closed set of legacy suffixes, declared one by one rather than by splat.
  [`App.jsx:102`](../../src/App.jsx#L102)

- Target rebuilt from the route param — never by substring surgery on `pathname`, which is case-sensitive while the router is not.
  [`App.jsx:137`](../../src/App.jsx#L137)

**The new routing table**

- Public, admin and chromeless groups after the rename.
  [`App.jsx:58`](../../src/App.jsx#L58)

**Shared URLs written by the app (the ones that outlive a deploy)**

- Saved-run share link.
  [`Compo.jsx:162`](../../src/pages/Compo.jsx#L162)

- Parcours share link handed to judges.
  [`ParcoursSetup.jsx:145`](../../src/pages/admin/ParcoursSetup.jsx#L145)

**Internal navigation (no link should resolve through a redirect)**

- Navbar entries.
  [`Navbar.jsx:118`](../../src/components/Navbar.jsx#L118)

- Admin sidebar; the "Compétition" label was deliberately left alone (Ask First).
  [`AdminLayout.jsx:44`](../../src/pages/admin/AdminLayout.jsx#L44)

- Footer entries.
  [`Footer.jsx:28`](../../src/components/Footer.jsx#L28)

**Canonical URLs**

- `<SEO path>` on each moved page; representative stop.
  [`JudgeTraining.jsx:179`](../../src/pages/JudgeTraining.jsx#L179)

**Agent-normative docs (stale docs are the real regression risk here)**

- Route table plus a new "reserved paths" note for `/competitions`.
  [`CLAUDE.md:90`](../../../CLAUDE.md#L90)

- Lint baseline referenced the two renamed admin files.
  [`project-context.md:41`](../../project-context.md#L41)
