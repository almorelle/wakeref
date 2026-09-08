# Review 1 — Blind Hunter (adversarial, diff-only)

Scope: `_bmad-output/implementation-artifacts/review-diff.patch` (competition submissions box, lot C).
Method: the change is judged on its own terms — no other project file was opened. Findings marked *(verify)* are ones a repo read would settle.

---

## BLOCKER

### B1 — `wakeref_post_restore.sql`: the trigger is created ~220 lines before the table exists → from-scratch restore aborts
`scripts/wakeref_post_restore.sql`, added block at `@@ -291,6 +291,33 @@` (function + trigger) vs. the table added at `@@ -510,6 +537,24 @@`.

The new hunk lands in the *functions* section (right before `home_stats`, i.e. around line 318 of the new file) and ends with:

```sql
drop trigger if exists competition_submissions_rate_limit on competition_submissions;
create trigger competition_submissions_rate_limit
  before insert on competition_submissions ...
```

`create table if not exists public.competition_submissions (...)` is only added later, around line 540, in the tables section.

Failure scenario: the documented "From scratch: run `scripts/wakeref_post_restore.sql`" path (CLAUDE.md § Database setup) dies at that `drop trigger`. `IF EXISTS` on `DROP TRIGGER` guards the *trigger*, not the *table* — Postgres raises `relation "competition_submissions" does not exist` (42P01). Even if it survived, the following `create trigger` would fail for the same reason. Since the whole script is normally run as one batch, everything after that point (home_stats, the remaining tables, all RLS, all grants) never executes. The restore procedure is broken by this diff, and nobody notices until the day it's needed.

Fix: move the `create table` + partial index into the tables section *above* the function/trigger block, or move the function+trigger block down to just after the `create table`. Then actually run the file against an empty database once — this class of bug is only ever caught by executing it.

---

## HIGH

### H2 — Edge Function has no caller authentication and no payload validation: an unauthenticated flood of arbitrary e-mail to the admin
`supabase/functions/notify-competition-submission/index.ts:1-30`

```ts
serve(async (req) => {
  const payload = await req.json()
  const sub = payload.record
  ...
```

Three separate holes in six lines:

1. **No shared secret / no signature check.** The function trusts anything that reaches it. Supabase's default `verify_jwt` is satisfied by the **anon key, which ships inside the public JS bundle** (`VITE_SUPABASE_ANON_KEY`). So anyone who has loaded wakeref.app can `POST` to the function URL directly, bypass the table entirely — and therefore bypass the rate-limit trigger that is the *only* stated defence — and send unlimited e-mail to `NOTIFY_EMAIL` with fully attacker-controlled subject-body content. The DB cap of 10/min is irrelevant to an attacker who never touches the DB.
2. **Attacker-controlled `href`.** `esc()` neutralises attribute breakout but not scheme: the `^https?://` CHECK lives in Postgres, and this path never goes through Postgres. `url: "javascript:…"` or a look-alike phishing URL is rendered as `<a href="…">` in the admin's mailbox, with a WakeRef `from:` and WakeRef branding. That is a phishing primitive aimed at the one account that can write to the site.
3. **No `try/catch` and no shape check.** `await req.json()` throws on a non-JSON body; `sub.url` throws `TypeError: Cannot read properties of undefined` when `payload.record` is absent (malformed body, or a webhook fired on `DELETE`, where Supabase sends `old_record`). Unhandled throw → the runtime returns a 500 with a Deno stack, and the webhook retries it.

Fix: require a shared secret header (`Deno.env.get('WEBHOOK_SECRET')`, compared in constant time) and reject otherwise; wrap the whole handler in `try/catch` returning 400 on bad input; validate `payload.record` is an object and that `sub.url` matches `^https?://` before emitting the `<a>` (otherwise render it as escaped text, not a link); cap field lengths server-side too. If the pre-existing `notify-video-submission` shares these holes, that is a reason to fix both, not a reason to copy them.

### H3 — The rate limit is **global**, so 10 inserts lock the box for everyone — and it never self-heals
`scripts/migrations/0019-competition-submissions.sql:38-56` and the same function in `wakeref_post_restore.sql`

```sql
select count(*) into recent_count from competition_submissions
where created_at > now() - interval '1 minute';
if recent_count >= 10 then raise exception ...
```

No IP, no session, no per-submitter dimension. A script looping one insert every 5 s keeps `recent_count >= 10` permanently, at zero cost, using the public anon key. Every real organiser then hits "Trop de propositions envoyées récemment" forever, and — because the front maps that to a friendly "réessaie dans une minute" — nobody reports a bug; the feature just silently stops receiving anything.

Secondary effect on the intended path: 10 rows/min that each fire a webhook is **14 400 e-mails/day** to `NOTIFY_EMAIL`. The cap does not make the e-mail fan-out survivable; it only makes it 14 400 instead of unbounded. And nothing ages out: rows are never deleted (see H4), so the table grows unbounded with spam that the admin cannot remove.

Fix: at minimum, add a per-payload dimension (hash of `name`+`date_text` — refuse an identical proposal within an hour) and a honeypot field the front leaves empty; better, capture a coarse client fingerprint and cap per-fingerprint. Debounce the e-mail (one digest per N minutes) rather than one per row. And give the admin a delete path so the table can be purged.

### H4 — `grant delete` is issued but no DELETE policy exists: deletion silently does nothing
`scripts/migrations/0019-competition-submissions.sql:76` and `wakeref_post_restore.sql:118` of the patch

```sql
grant select, update, delete on public.competition_submissions to authenticated;
```

Policies created: `for insert`, `for select`, `for update`. **No `for delete`.** With RLS enabled and no permissive DELETE policy, every `delete` matches zero rows — no error, `count: 0`, HTTP 204. The admin (or a future cleanup script) issues a delete, gets a success response, and the row is still there. Combined with H3 (unbounded spam accumulation) there is no way to empty this table from the app at all.

Fix: either add `create policy "Suppression admin competition_submissions" on competition_submissions for delete using ((select auth.role()) = 'authenticated');`, or drop `delete` from the grant so the intent is unambiguous. Do not leave grant and policy disagreeing.

### H5 — `errcode = 'check_violation'` collides with the table's own CHECK constraints → a validation error is shown as "too many submissions"
`src/pages/SubmitCompetition.jsx:32` + trigger `raise ... using errcode = 'check_violation'`

```js
setStatus(error.code === '23514' || /réessaie/i.test(error.message) ? 'flood' : 'error')
```

`23514` is *the generic CHECK-violation code*, which the table itself raises for `char_length(name) between 2 and 160`, `char_length(date_text) between 2 and 80`, and the `url ~* '^https?://'` check. Concrete reachable case: the user types `"  a  "` — 5 characters, so the browser's `minLength={2}` passes — and the client submits `form.name.trim()` = `"a"`, 1 character. Postgres rejects it with 23514, and the visitor is told "Trop de propositions envoyées à l'instant. Réessaie dans une minute." They wait, retry the same input, get the same message, and give up. The one submission channel for organisers reports a data problem as a server problem.

Fix: give the trigger a distinct code (`raise ... using errcode = 'P0001'` with a stable marker, or a reserved class such as `'53400'`) and branch on that; treat plain `23514` as a field-validation error with a specific message. Also mirror the `.trim()` in the client-side length check so the DB is never asked to validate what the form claims it already validated.

---

## MEDIUM

### M6 — Admin row layout is broken: `styles.name` and `styles.actions` do not exist
`src/pages/admin/AdminCompetitionSubmissions.jsx:72` (`<span className={styles.name}>`) and `:86` (`<div className={styles.actions}>`) vs. `AdminCompetitionSubmissions.module.css`, which defines `.rowName` and `.rowActions`.

CSS Modules resolves the missing keys to `undefined`, React emits the element with no class, and both rules are dead. Result on screen: the competition name renders at body size instead of the intended 20px uppercase title face, and the three action buttons lose `display:flex; gap:8px; flex-shrink:0` — they fall back to inline layout and, on a narrow admin viewport, wrap and squeeze the `.meta` column. Nothing errors, ESLint says nothing, and it ships looking merely "a bit off".

Fix: rename the CSS selectors to `.name` / `.actions`, or the JSX to `styles.rowName` / `styles.rowActions`.

### M7 — "Créer la fiche" leaves the submission `pending` and carries only the name
`src/pages/admin/AdminCompetitionSubmissions.jsx:87-90`

```jsx
onClick={() => navigate(`/admin/competitions/new?nom=${encodeURIComponent(r.name)}`)}
```

The stated purpose of the feature is a queue the admin drains. The button that performs the actual draining action does not mark the row handled — the admin creates the competition, navigates away, and the row is still "À traiter". Next session they process it again and create a **duplicate competition**, which is exactly the thing the agenda cannot tolerate. Worse, `date_text` and `url` are dropped: the admin lands on the form with only the name and must navigate back to read the date and the link — defeating the `?nom=` prefill's own justification ("plutôt que de le faire recopier à la main", `CompetitionForm.jsx:44-46`).

Fix: `await setStatus(row, 'handled')` before navigating (or on return), and pass `?nom=&url=` — plus surface `date_text` somewhere in the target form, since it cannot be auto-parsed. If auto-marking is judged too eager, at least render a visual "fiche créée" marker.

### M8 — No status is reversible, and there is no undo or delete
`src/pages/admin/AdminCompetitionSubmissions.jsx:81-91`

The `Traitée` / `Écarter` buttons render only `{r.status === 'pending' && …}`. One misclick on "Écarter" and the submission is unrecoverable from the UI: no way back to `pending`, no delete (H4 blocks it at the RLS layer anyway). The only recovery is the Supabase dashboard.

Fix: keep a "Rouvrir" action on non-pending rows (the UPDATE policy already allows it), or make the two actions a toggle.

### M9 — Webhook creation is nowhere in the migration; the feature ships silently e-mail-less
`scripts/migrations/0019-competition-submissions.sql` (whole file) vs. CLAUDE.md:9 ("a Supabase webhook calls the `notify-competition-submission` Edge Function")

The migration creates the table, index, trigger, policies and grants — but never the `supabase_functions.http_request` trigger that invokes the function, and the header comment ("À relire, puis appliquer dans l'éditeur SQL Supabase") lists no manual follow-up. Nor is there a `supabase/config.toml` / `deno.json` entry for the new function in the diff *(verify)*. Deploy exactly what is in this patch and submissions land in the table with no notification at all; since the admin has no reason to open a page that says "0 à traiter", proposals rot for weeks.

Fix: add the webhook trigger to the migration (or an explicit, numbered manual-steps block at the top listing: deploy the function, set `RESEND_API_KEY`/`NOTIFY_EMAIL`/the new webhook secret, create the webhook).

### M10 — `useEffect(..., [toast])` will loop forever if `toast` is not memoised
`src/pages/admin/AdminCompetitionSubmissions.jsx:23-39`

The fetch effect depends on `toast` from `useToast()`. If `useToast` returns a fresh function identity per render *(verify — the hook is outside the diff)*, every `setRows`/`setLoading` re-render produces a new `toast`, re-runs the effect, re-queries Supabase, and the page hammers the API in a tight loop. This is exactly the shape that ESLint's exhaustive-deps rule pushes people into and then does not protect them from.

Fix: confirm `toast` is wrapped in `useCallback` inside `useToast`; if it is not, either memoise it there or drop it from the deps with a targeted disable and a comment.

### M11 — Success state unmounts the form without moving focus or announcing itself
`src/pages/SubmitCompetition.jsx:50-56`

The diff reasons carefully about a11y for the *error* path ("l'échec arrive après un aller-retour réseau, hors du champ de vision de qui utilise un lecteur d'écran", `:70-71`) and then drops the same concern on the success path. On submit, the entire `<form>` — including the focused submit button — is removed from the DOM and replaced by `.success`, which is not a live region. Focus falls back to `<body>`; a screen-reader or keyboard user hears nothing, has no idea whether the submission worked, and has to re-navigate the page from the top to find out.

Fix: give the success block `role="status"` (or reuse the same always-mounted live region) and move focus to it with a `ref` + `tabIndex={-1}` on mount.

### M12 — `type="url"` contradicts the field's own hint, and makes the custom `badUrl` branch nearly dead code
`src/pages/SubmitCompetition.jsx:63-65` and the hint at `translations.js` `urlHint`

The hint invites "Page de l'événement, Instagram de l'orga, n'importe quoi qui permette d'en savoir plus" — i.e. exactly the `instagram.com/xyz` a submitter will paste. `type="url"` then blocks submission with an opaque native browser tooltip ("Enter a URL") that no message in `submitComp` explains, and the carefully-worded `badUrl` string never gets a chance to render because native validation fires first. The most likely real input is rejected by a rule the copy told the user to ignore.

Fix: pick one. Either drop `type="url"` and rely on the JS check (whose message you wrote), or keep `type="url"` and change the hint to say a full `https://…` address is required. Best: normalise a schemeless host to `https://` before validating.

---

## LOW

### L13 — `src/pages/Competitions.module.css`: unexplained deletion of `.compact .card::after { display: none; }`
`Competitions.module.css` `@@ -286,7 +286,6 @@`

Nothing else in this diff touches compact cards. Deleting this line re-enables whatever `::after` decoration the non-compact `.card` carries, inside the compact variant where it was deliberately suppressed — a visual regression on the competitions feed, in a change whose subject is a submission form. Either it is an accidental revert that slipped in, or it is an intentional design change with no note. Both are wrong in this patch.

Fix: restore the line, or split the change out with its own justification.

### L14 — Two stylesheets are copy-paste residue, one with a duplicated `.error`
`src/pages/SubmitCompetition.module.css` and `src/pages/admin/AdminCompetitionSubmissions.module.css`

- `SubmitCompetition.module.css` defines `.error` **twice** (`:594` and `:640`). The second wins for the shared properties and, critically, does *not* re-declare `background: none; border: 0; border-radius: 0` — so the first block's resets against a global `.error` style are silently dropped. It also ships dead `.textarea`, `.submitBtn`, `.consent`, `.consent a`, `.row` + its media query, none of which appear in the JSX; the comment "/* Erreur : filet en marge */" sits above `.consent`, which is not an error style — evidence the file was pasted from another page and not read.
- `AdminCompetitionSubmissions.module.css` ships dead `.rowName`, `.badges`, `.badge`, `.badge + .badge::before`, `.unpub` (whose comment talks about a "Brouillon" state this table does not have, and which declares `color` and `font-weight` twice), and defines `.empty` twice (`:782` and `:787`).

Fix: delete every unused rule, collapse the duplicates, and fix the mis-parented comments. Nothing here is caught by ESLint, which is precisely why it needs a human pass.

### L15 — The rate-limit trigger seq-scans on every insert
`0019-competition-submissions.sql:31-33` vs `:46-48`

The only index is `on (created_at desc) where status = 'pending'`. The trigger's `where created_at > now() - interval '1 minute'` carries no `status` predicate, so the planner cannot use the partial index and falls back to a sequential scan of the whole table for every single insert. Trivial today; with H3 (unbounded spam) and H4 (no delete path) the table has no ceiling, and the anti-spam mechanism becomes the thing that makes inserts slow.

Fix: add a plain `create index on competition_submissions (created_at desc)`, or add `and status = 'pending'` to the trigger's predicate if counting only pending rows is acceptable (it is not, for spam counting).

### L16 — `Deno.env.get(...)!` at module scope hides a missing-config failure
`supabase/functions/notify-competition-submission/index.ts:3-4`

The `!` is a compile-time assertion with no runtime effect. If `RESEND_API_KEY` is unset the function boots fine and sends `Authorization: Bearer undefined` on every call; Resend 401s, the handler returns `{ ok: false }` with a 500, and the actual cause appears nowhere — `res` is never inspected, the response body is never read or logged. A misconfigured secret looks identical to a Resend outage.

Fix: throw explicitly at boot if either var is missing, and log `await res.text()` when `!res.ok`.

### L17 — Doc claims a `deferred-work.md` entry the diff does not create
`CLAUDE.md:9` (new) and `CLAUDE.md:23` (rewritten)

The new bullet asserts that the unlimited `video_submissions` / `takedown_requests` rate limits are "pre-existing, tracked in `deferred-work.md`", and the rewritten redirects bullet *removes* the pointer that reserved `/competitions` in that same file. Neither `deferred-work.md` nor any other tracking file appears in this diff *(verify)*. Either the entry already exists — in which case fine — or CLAUDE.md now vouches for a follow-up nobody wrote down, which is how the two unlimited spam surfaces get forgotten.

Fix: confirm the `deferred-work.md` entry exists and, if not, add it in this change; remove the reserved-route line there now that both routes are claimed.

### L18 — Sort order silently breaks after the first status change
`src/pages/admin/AdminCompetitionSubmissions.jsx:14-17, 43`

`sortPendingFirst` is applied once, at load. `setStatus` mutates the row in place, so a row marked "Traitée" stays wedged in the pending block, greyed but occupying a top slot, and the ordering the comment promises ("Non traitées en tête") only holds until the first click — then differs from what a refresh shows. After a busy session, the top of the list is a mix of done and pending rows.

Fix: re-run `sortPendingFirst` in the `setRows` updater, or accept the in-place behaviour and delete the misleading comment.

### L19 — Footer now offers two adjacent, near-identical contribution links
`src/components/Footer.jsx:37`

`{tr.ctaButton}` → `/submit` and "Proposer une compétition" → `/competitions/proposer` sit on consecutive lines under "À propos". Whatever `ctaButton` reads as (a submit/contribute CTA), a visitor with a competition to report now has two plausible doors and no cue which one takes them. Expect competition reports arriving through the video-submission box.

Fix: label them by object ("Proposer une vidéo" / "Proposer une compétition") so the choice is decided by the noun, not by guessing.

### L20 — The migration is not re-runnable, unlike its own index statement
`0019-competition-submissions.sql:19-27`

`create table public.competition_submissions (...)` has no `if not exists`, while the index three lines below does. Inside `begin; … commit;` a second run aborts at statement one and rolls back the whole thing — which is arguably the safe outcome, but the inconsistency reads as an oversight and will prompt someone to "fix" it by adding `if not exists`, at which point a partially-applied migration silently skips the table and proceeds to alter policies on whatever is already there.

Fix: keep it non-idempotent deliberately and say so in the header comment, or make the whole file idempotent. Do not mix.
