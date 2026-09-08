---
title: 'Competitions: public submission form (lot C)'
type: 'feature'
created: '2026-09-08'
status: 'done'
baseline_commit: 'fa2964f4f9648cb5c1b7bffa651390f46d1e7b04'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The agenda is fed by one person. An organiser who notices their competition is missing has no way to say so — and organisers are the only source that scales beyond Alexis's own attention.

**Approach:** A deliberately tiny public form (name, date, link) writing to a moderation queue, reusing the `video_submissions` pattern end to end: public insert, admin-only read, e-mail alert via an Edge Function fired by a Supabase webhook. Nothing is ever published automatically.

## Boundaries & Constraints

**Always:**
- **Three fields, no account.** The submitter's motivation is weak; the cost must be weaker still. Anything beyond name / date / link would not get filled in.
- **Upstream moderation, no exception.** Nothing on screen distinguishes a submission from an admin entry, so everything displayed is deemed vetted by Alexis. There is no "publish now, fix later" variant.
- **Rate-limit the insert.** A public inbox with no account and no captcha is reachable by bots, and each row also triggers an e-mail. Copy the `compositions_rate_limit` trigger (`security definer`, global ceiling per minute) — the pattern already exists in this schema.
- Reuse, don't build: the admin queue lives with the other submissions, the alert is an Edge Function on a DB webhook, exactly like `notify-video-submission`.
- FR/EN via `useT()`, both languages complete.

**Ask First:**
- Any field beyond the three, and anything asking who the submitter is.
- Turning a submission into a published competition automatically.

**Never:**
- Do not let `anon` read the submissions table — an open inbox that is also readable is a spam board.
- Do not touch the public ribbon or detail page beyond adding the entry point.
- Do not deploy the Edge Function or create the webhook — that is Alexis's to run, like the migration.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Nominal | Name + date + link | Row inserted `pending`, confirmation shown, form cleared | N/A |
| Minimal | Name + date, no link | Accepted — the link is optional, the name and date are not | N/A |
| Date unknown | Submitter has no date | Accepted: a year is enough, mirroring `date_precision` | N/A |
| Bad link | `ftp://…` or free text | Refused client-side and by a DB CHECK (`^https?://`) | Field-level message |
| Flood | 20+ inserts in a minute | Trigger raises; visitor sees a "try again shortly" message | Explicit, not a silent failure |
| Anon read | `select` on the table as `anon` | Nothing returned | RLS: insert-only for `anon` |
| Admin | Opens the queue | Sees pending submissions, can mark handled | N/A |

</frozen-after-approval>

## Code Map

- `scripts/migrations/0019-competition-submissions.sql` -- NEW: table, CHECKs, RLS (insert `anon`, read/update `authenticated`), grants, rate-limit trigger. Run by hand, then mirrored into `wakeref_post_restore.sql` + `wakeref_schema.sql`
- `supabase/functions/notify-competition-submission/index.ts` -- NEW, modelled on `notify-video-submission/index.ts` (43 l., Resend, `RESEND_API_KEY` + `NOTIFY_EMAIL` already configured). Deployed by Alexis
- `src/pages/SubmitVideo.jsx` -- the public form to model (validation, toast, insert)
- `src/pages/admin/AdminSubmissions.jsx` -- the queue page to model
- `src/pages/SubmitCompetition.jsx` + `.module.css` -- NEW public form
- `src/pages/admin/AdminCompetitionSubmissions.jsx` + `.module.css` -- NEW queue
- `src/App.jsx` -- one public route, one admin route (both lazy)
- `src/pages/Competitions.jsx` -- entry point **above** the feed (people come to add an upcoming competition, and the future is at the top)
- `src/components/Footer.jsx` -- second entry point, beside "Soumettre une vidéo"
- `src/i18n/translations.js`, `src/pages/admin/AdminLayout.jsx` -- strings and sidebar

## Tasks & Acceptance

**Execution:**
- [ ] `scripts/migrations/0019-competition-submissions.sql` -- `competition_submissions` (name, date_text, url, status, created_at), CHECKs incl. the URL scheme, RLS, grants, rate-limit trigger -- the whole foundation, runnable in one go
- [ ] `scripts/wakeref_post_restore.sql` + `scripts/wakeref_schema.sql` -- mirror it -- a restore must rebuild the same security state
- [ ] `supabase/functions/notify-competition-submission/index.ts` -- alert e-mail, modelled on the video one -- Alexis deploys it and wires the webhook
- [ ] `src/pages/SubmitCompetition.jsx` + `.module.css` -- three fields, client validation, confirmation, error on flood -- the form itself
- [ ] `src/pages/admin/AdminCompetitionSubmissions.jsx` + `.module.css` -- list pending first, mark handled, link to create the competition -- where a submission becomes a listing
- [ ] `src/App.jsx`, `src/pages/admin/AdminLayout.jsx` -- routes + sidebar entry -- reachable
- [ ] `src/pages/Competitions.jsx`, `src/components/Footer.jsx` -- both entry points -- discoverable at the moment of intent and from the footer
- [ ] `src/i18n/translations.js` -- all strings in `fr` + `en` -- no untranslated label ships
- [ ] `CLAUDE.md` + `_bmad-output/project-context.md` -- document the table and its rate limit -- the next agent must not re-derive them

**Acceptance Criteria:**
- Given a submission with only a name and a date, when it is sent, then it is accepted and appears as `pending` in the admin queue.
- Given the table is read as `anon`, when the query runs, then it returns nothing, whatever the status.
- Given more inserts than the per-minute ceiling, when the next one is attempted, then the visitor gets an explicit "try again shortly", not a silent failure.
- Given a submitted link that is not `http(s)`, when the form is sent, then it is refused before reaching the database.
- Given the language is EN, when both new pages render, then no French UI label remains.
- Given `npm run lint`, then no new error or warning outside the judging module (baseline 9/7).

## Spec Change Log

### 2026-09-08 — deux correctifs du lot B embarqués dans la branche

Demandés par Alexis dans le même message que le lancement du lot C, donc absents
du périmètre écrit ici. Consignés pour que la revue ne les lise pas comme des
dérives : (1) restauration du trait `.compact .card::after` reliant la pastille
au nom sur les lignes compactes du ruban — il manquait ; (2) sous-titre de
`/competitions` raccourci à « Le calendrier du cable en France : dates, lieux,
live et vidéos. », la phrase « On référence, on ne diffuse pas. » étant retirée
**par décision d'Alexis**. La promesse qu'elle portait (idées #30 et #62) reste
tenue par le code — aucun lecteur embarqué nulle part sur le site.

### 2026-09-08 — `CompetitionForm.jsx` ajouté au Code Map

Non prévu initialement. « Créer la fiche » ouvrait un formulaire vide : le nom
se préremplit désormais via `?nom=`, et la date libre et le lien de la
proposition — que la fiche n'a aucun champ pour recevoir — s'affichent en
bandeau. Sans ça, l'admin fait l'aller-retour vers la file pour les relire.

### 2026-09-08 — suites de la revue adverse

- Le trigger de plafond lève un `PT429` et non un `check_violation` : les deux
  arrivaient au client sous le même code `23514`, et un nom trop court
  s'affichait donc en « trop de propositions, réessaie dans une minute ».
- Le back-office reste en français ; la convention, jusque-là seulement
  pratiquée, est écrite dans `CLAUDE.md` et `project-context.md`.
- Le plafond global reste tel quel — c'est le patron de `compositions`, et
  faire mieux demanderait une brique d'infrastructure que le lot s'interdit.
  Le compromis est consigné dans `deferred-work.md`.

## Verification

**Commands:**
- `npm run lint` -- expected: baseline unchanged
- `npm run dev` -- expected: the form submits, the queue lists it

**Manual checks:**
- Alexis runs `scripts/migrations/0019-competition-submissions.sql`, then deploys the function and creates the webhook — the agent does neither. Le webhook n'est capturé par aucune migration : après un restore, la file existe mais ne prévient personne.
- Le webhook doit envoyer l'en-tête `x-wakeref-hook: <WAKEREF_HOOK_SECRET>`, et ce secret être posé dans les variables de la fonction. Sans lui la fonction répond 403 — c'est ce qui la sépare d'un relais de mail ouvert, la clé anon étant publique.
- Vérifier une fois le plafond en conditions réelles : PostgREST doit rendre le `PT429` du trigger en HTTP 429, sur lequel repose l'affichage « réessaie ».
- Vérifier que le grant par colonne tient : un `insert` anon portant `status` ou `created_at` doit être refusé.
- Read the table as `anon` from a private window: it must return nothing. This is the one check the logged-in admin cannot perform.
