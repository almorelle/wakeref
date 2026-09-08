# Review 3 — Acceptance Auditor

**Spec:** `_bmad-output/implementation-artifacts/spec-competitions-submission.md` (lot C — public submission form)
**Diff:** `_bmad-output/implementation-artifacts/review-diff.patch` (verified against the working tree, `git status` matches)
**Date:** 2026-09-08

Spec frontmatter `context: []` — no companion documents to cross-read beyond the governing rules.

---

## 1. Acceptance criteria

### AC1 — "Given a submission with only a name and a date, when it is sent, then it is accepted and appears as `pending` in the admin queue." — **MET**

- `url` is nullable and unconstrained when null: `scripts/migrations/0019-competition-submissions.sql:23` (`check (url is null or (…))`).
- The client sends `url: url || null`: `src/pages/SubmitCompetition.jsx:27`.
- `status` defaults to `'pending'`: `scripts/migrations/0019-competition-submissions.sql:24-25`.
- The queue selects all rows and hoists pending: `src/pages/admin/AdminCompetitionSubmissions.jsx:12-15`, `:28-35`.
- `.insert()` is not chained with `.select()` (`SubmitCompetition.jsx:24-28`), so no SELECT policy is required for anon on the write path — correct.

### AC2 — "Given the table is read as `anon`, when the query runs, then it returns nothing, whatever the status." — **MET**

- Only an INSERT policy exists for the unqualified role: `0019-competition-submissions.sql:71-72`; SELECT is gated on `auth.role() = 'authenticated'` at `:73-74`.
- Grants match: `grant insert … to anon, authenticated` / `grant select, update, delete … to authenticated` (`:79-80`).
- Mirrored in `scripts/wakeref_post_restore.sql:676-683` (policies) and `:748-749` (grants).
- Not verifiable from disk (needs a private window against the live DB) — the spec's own "Manual checks" already carries that.

### AC3 — "Given more inserts than the per-minute ceiling, … the visitor gets an explicit 'try again shortly', not a silent failure." — **MET, with a false-positive on the same branch**

- Trigger raises with `errcode = 'check_violation'` (SQLSTATE 23514): `0019-competition-submissions.sql:37-56`, `:58-60`.
- Client maps it to a dedicated state and renders `tr.submitComp.flood`: `src/pages/SubmitCompetition.jsx:32`, `:84`.
- FR/EN strings present: `src/i18n/translations.js:212` / `:250`.

Caveat (see D-7): `error.code === '23514'` also matches every *column* CHECK on the table. A name of two spaces passes `required`/`minLength` in the browser, is `.trim()`ed to `''` at `SubmitCompetition.jsx:25`, fails `char_length(name) between 2 and 160`, and the visitor is told "Trop de propositions envoyées à l'instant. Réessaie dans une minute." The failure is explicit — so the AC's letter holds — but the message is wrong for that path.

### AC4 — "Given a submitted link that is not `http(s)`, when the form is sent, then it is refused before reaching the database." — **MET**

- `src/pages/SubmitCompetition.jsx:22` — `if (url && !/^https?:\/\//i.test(url)) { setStatus('badUrl'); return }`, before the `insert` at `:24`.
- Backstop CHECK in the DB: `0019-competition-submissions.sql:23` (`url ~* '^https?://'`).
- Note `type="url"` (`SubmitCompetition.jsx:75`) does *not* refuse `ftp://…` — the JS guard is the real client-side boundary, and it is present.

### AC5 — "Given the language is EN, when both new pages render, then no French UI label remains." — **PARTIALLY MET**

- `SubmitCompetition.jsx` is fully routed through `useT()` (`:53-92`), with complete FR (`translations.js:198-215`) and EN (`:585-602`) blocks. The only literal on screen is the placeholder `"https://…"` (`:76`), which is language-neutral. **Met.**
- `src/pages/admin/AdminCompetitionSubmissions.jsx` ships **hardcoded French only**: `STATUS_LABELS` (`:9`), `'Chargement impossible.'` (`:31`), `'Échec de la mise à jour.'` (`:44`), `'Propositions'` (`:56`), `"Aucune proposition pour l'instant."` (`:65`), `'Créer la fiche'` (`:91`), `'Traitée'` (`:96`), `'Écarter'` (`:100`), plus `toLocaleDateString('fr-FR', …)` (`:76`). The sidebar label is likewise a literal (`AdminLayout.jsx:47`). **Not met for this page.**

The AC says "both new pages", and the task line says "no untranslated label ships". The implementation follows the *existing admin precedent* (`AdminSubmissions.jsx:37`, `:44` etc. are literal FR), but that precedent is nowhere declared: `_bmad-output/project-context.md:88` lists **only** the judging surfaces as the French-only exception, and `CLAUDE.md` (i18n section) states the same. Either the AC is unmet, or the admin FR-only convention needed to be written down as part of the "document it" task. Neither happened.

### AC6 — "Given `npm run lint`, then no new error or warning outside the judging module (baseline 9/7)." — **MET**

`npm run lint` run at audit time: `✖ 16 problems (9 errors, 7 warnings)`, all in `admin/ParcoursSetup.jsx`, `admin/AdminParcours.jsx`, `JudgeVoice.jsx`, `CompositionSimple.jsx`, `France2026.jsx`, `competition/CompetitionView.jsx`, `competition/HeatTab.jsx`. Baseline unchanged; no new file appears in the output.

---

## 2. Task checklist

| Task | State | Evidence |
|---|---|---|
| `scripts/migrations/0019-competition-submissions.sql` | Done | file exists, `begin;`/`commit;` at `:17`/`:82`, table `:19`, index `:29`, trigger fn `:37`, trigger `:58`, RLS `:65-76`, grants `:79-80` |
| Mirror into `wakeref_post_restore.sql` + `wakeref_schema.sql` | **Done but broken** — see V-1 | `wakeref_post_restore.sql:294-320`, `:540-556`, `:612`, `:676-683`, `:748-749`; `wakeref_schema.sql:176-185` |
| `supabase/functions/notify-competition-submission/index.ts` | Done, not deployed (correct) | file exists, 45 l., mirrors `notify-video-submission/index.ts` |
| `SubmitCompetition.jsx` + `.module.css` | Done | three fields `:58-78`, client validation `:22`, confirmation `:50-55`, flood branch `:32`/`:84` |
| `AdminCompetitionSubmissions.jsx` + `.module.css` | Done, with defects (V-4, V-5) | pending-first `:12-15`, mark handled `:41-47`, create-listing link `:89-92` |
| `App.jsx` + `AdminLayout.jsx` routes/sidebar | Done | `App.jsx:66-69` (`/competitions/proposer` declared before `/competitions/:idSlug`), `:102`, `AdminLayout.jsx:47` |
| `Competitions.jsx` + `Footer.jsx` entry points | Done | `Competitions.jsx:107-110` (above the feed, under the masthead), `Footer.jsx:37` (beside `tr.ctaButton`) |
| `translations.js` fr + en | Done for the public page, N/A for admin (AC5) | `:198-215`, `:585-602`, `:226`, `:613` |
| `CLAUDE.md` + `project-context.md` documentation | Done, one dangling reference (V-7) | `CLAUDE.md:46`, `project-context.md:70`, `:71`, `:81` |

Nothing the spec required is entirely absent.

---

## 3. Violations and unstated deviations

### V-1 — `wakeref_post_restore.sql` cannot run from scratch: the trigger is created 229 lines before its table (**blocking**)

`scripts/wakeref_post_restore.sql:316-320` creates the rate-limit trigger inside **section 2 (FONCTIONS)**:

```
316  drop trigger if exists competition_submissions_rate_limit on competition_submissions;
317  create trigger competition_submissions_rate_limit
318    before insert on competition_submissions
```

but `create table if not exists public.competition_submissions` is at `:545`, and the file's own **section 4 "TRIGGER"** (`:558-590`) is where every other trigger lives — including the sibling this one was copied from, `compositions_rate_limit` at `:572-575`.

CLAUDE.md documents `wakeref_post_restore.sql` as the **from-scratch** path ("From scratch: 1. `scripts/wakeref_post_restore.sql` — full schema"). On that path line 317 aborts with `relation "competition_submissions" does not exist`, and everything after it — the table, the RLS enablement at `:612`, the three policies at `:676-683`, the storage bucket, the grants — never runs. This directly defeats the task's own stated purpose ("a restore must rebuild the same security state") and the hand-managed-schema mirroring rule (`project-context.md:67`). The trigger block belongs at `:590`, after `competitions_updated_at`.

### V-2 — The "Never: do not touch the public ribbon beyond adding the entry point" boundary was crossed twice

Both changes are unrelated to the entry point and unmentioned anywhere in the spec, the Code Map, or the Spec Change Log (which is empty).

**(a) A ribbon layout rule was deleted.** `src/pages/Competitions.module.css` lost `.compact .card::after { display: none; }` (old line 289; `git diff` confirms it is a pure deletion). `.card::after` is the connector stroke between a card and its timeline node (`Competitions.module.css:89-102`). `.compact` applies to every past competition and every non-current year (`Competitions.jsx:143`, `:156`) — i.e. to the majority of the feed, which the brainstorming calls the feature's bootstrap capital (#35). The stroke now renders on all of them at desktop widths (the `@media (max-width: 800px)` reset at `:268` still hides it on mobile, which is why the regression is width-dependent and easy to miss).

**(b) The page subtitle was rewritten in both languages.** `translations.js:198` drops "On référence, on ne diffuse pas."; `:585` drops "We list them, we don't broadcast them." That sentence is the on-screen expression of two frozen design calls in the brainstorming — **#30 "don't vampirise"** ("the site really redirects to my content and doesn't vampirise me") and **#62** ("its implicit promise: *we reference, we don't broadcast live*"). The brainstorming doc is declared non-reopenable (`deferred-work.md:14`: "Do not reopen the calls recorded there"). Removing the site's statement of that contract — in a lot whose entire purpose is to solicit content *from organisers*, the exact audience the sentence reassures — is a product decision made silently inside a submission-form lot.

### V-3 — i18n rule broken on the admin queue, and the exception was not declared

See AC5. `AdminCompetitionSubmissions.jsx` ships ~10 FR literals. `project-context.md:86` ("add new strings to **both** languages") and `:88` (exception list = judging surfaces only) do not cover admin pages. The change neither complies nor amends the rule.

### V-4 — Two CSS classes referenced by the admin queue do not exist (**defect, visible**)

`src/pages/admin/AdminCompetitionSubmissions.jsx:72` uses `styles.name` and `:86` uses `styles.actions`. `AdminCompetitionSubmissions.module.css` defines **`.rowName`** (`:44-56`) and **`.rowActions`** (`:93`) — never `.name` or `.actions`. Both resolve to `undefined`, so:

- the competition name renders with no typographic treatment (the `--font-title`, uppercase, 20px block at `:44-56` is dead);
- the action row loses `display:flex; align-items:center; gap:8px; flex-shrink:0`, so "Créer la fiche" / "Traitée" / "Écarter" fall back to inline-block flow inside a flex parent.

This is the copy-paste of `AdminCompetitions.module.css` half-renamed: the CSS kept the donor's class names, the JSX invented new ones.

### V-5 — Both new stylesheets ship dead copied rules and duplicate selectors

Against `project-context.md:90` ("One component per file with a co-located `*.module.css`. Reuse global classes/tokens … before adding new ones") and the spec's "Reuse, don't build".

`src/pages/admin/AdminCompetitionSubmissions.module.css` — unused by the JSX: `.rowName` (`:44`), `.badges` (`:58`), `.badge` (`:60`), `.badge + .badge::before` (`:71`), `.unpub` (`:79`), `.rowActions` (`:93`). `.unpub` also carries the comment "Brouillon : la seule étiquette qui garde une couleur — c'est un état." — a `competitions` concept (`published`) that has no meaning in a submissions queue, and it declares `color` and `font-weight` twice within the same block (`:85`+`:88`, `:81`+`:89`). `.empty` is declared twice (`:22-26` then `:27`), the second overriding the first's padding while the flex/gap/color of the first survive.

`src/pages/SubmitCompetition.module.css` — unused by the JSX: `.textarea` (`:37`), `.submitBtn` (`:38`), `.consent` (`:41`) and `.consent a` (`:49`), `.row` (`:87`) and its `@media (max-width: 480px)` override (`:92-94`). `.error` is declared twice, at `:55-66` and `:101-107`, with the second silently winning. The comment at `:79` ("Auteur·ice + lien : côte à côte") and at `:53` ("Erreur : filet en marge") describe `SubmitVideo`, not this page.

### V-6 — `src/pages/admin/CompetitionForm.jsx` was modified, and it is not in the Code Map

`CompetitionForm.jsx:41-43`, `:49` add a `?nom=` prefill. It serves the Code Map's "link to create the competition", so the intent is legitimate, but the Code Map enumerates files precisely and this one is absent, and the Spec Change Log was not updated. It also changes behaviour for a screen outside this lot: any `/admin/competitions/new?nom=…` now prefills, and `useState(() => …)` reads the search params **once**, so an in-SPA navigation from one submission to another while the form is already mounted would keep the first name. (Not reachable from the current queue UI, which only ever pushes from a list.)

### V-7 — `CLAUDE.md:46` points at documentation that does not exist

The new paragraph states that `video_submissions` and `takedown_requests` remaining unlimited is "pre-existing, tracked in `deferred-work.md`". `_bmad-output/implementation-artifacts/deferred-work.md` contains no such entry (grep for `video_submissions`, `takedown`, `rate`, `limit` returns only unrelated lines `:30`, `:34`, `:38`). `project-context.md:81` states the same fact without the false cross-reference. Either add the deferred item or drop the clause.

### V-8 — `delete` is granted on the table with no DELETE policy

`0019-competition-submissions.sql:80` and `wakeref_post_restore.sql:749` grant `delete` to `authenticated`, but only `insert` / `select` / `update` policies exist (`:71-76`). Under RLS a delete therefore silently affects 0 rows. The spec's Code Map specified "RLS (insert `anon`, read/update `authenticated`)" — the delete grant is beyond it, and is dead either way. Either drop the grant or add the policy; do not leave the two out of step (`project-context.md:68`: "A **new table** needs `enable row level security` + explicit policies + grants").

### V-9 — The admin queue renders an unvalidated `href` where the modelled page uses `externalUrl()`

`AdminCompetitionSubmissions.jsx:81` — `href={r.url}` raw. The page it was told to model, `admin/AdminSubmissions.jsx:63` and `:88`, routes every submitter-supplied URL through `externalUrl()` (`src/lib/url.js`). Here the DB CHECK (`url ~* '^https?://'`) makes it safe in practice, so this is a consistency deviation rather than a hole — worth noting only because the spec's instruction was "the queue page to model".

---

## 4. Notes that are not violations

- The Edge Function adds HTML escaping (`notify-competition-submission/index.ts:8-12`) that `notify-video-submission/index.ts` lacks. A deviation from "modelled on the video one", and the right one: the fields are public and unmoderated. Left unflagged, but it makes the video function the odd one out.
- `/competitions/proposer` is not added to `staticRoutes` in `scripts/generate-sitemap.js:14-20`. Consistent with `/submit`, which is also absent. Not a finding.
- `vercel.json` needs no change: the legacy redirects enumerate `/competition` and `/competition/:code` only (`:24`, `:29`), so `/competitions/proposer` is untouched. The `App.jsx` route order (`:66-69` before `:70`) matches the rule now written in `CLAUDE.md:98`.
- The rate-limit function pins `set search_path = public` (`0019:40`), as required by `project-context.md:77`.
- "Créer la fiche" is rendered on already-handled and rejected rows too (`AdminCompetitionSubmissions.jsx:89-92`, outside the `r.status === 'pending'` guard at `:93`), and creating a listing does not mark the submission handled. The spec asked only for "link to create the competition", so this is within scope — flagged as workflow friction, not non-compliance.
