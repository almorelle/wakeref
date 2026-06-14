---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: 'Challenge WakeRef direction & next features; rethink the home page'
session_goals: 'Diverge on candidate features and home-page directions before prioritizing'
selected_approach: 'ai-recommended'
techniques_used: ['Question Storming', 'What If Scenarios', 'Role Playing']
ideas_generated: 41
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Alexis
**Date:** 2026-06-13

## Session Overview

**Topic:** Challenge WakeRef's product direction and next features — and rethink the home page.

**Goals:** Generate a wide field of candidate features and home-page directions before trancher / prioritizing. Stay in divergent mode; quantity first.

### Context

WakeRef — PWA de référentiel de figures wakeboard/wakeskate (React 19 + Supabase). Existant : catalogue de tricks bilingue, vidéos, prérequis, arbre built-on, quiz, builder de compo/run partageable, admin.

### Session Setup

**Approach:** AI-Recommended Techniques

**Sequence:**
1. **Question Storming** (deep) — reframe the space: only questions about direction & the home.
2. **What If Scenarios** (creative) — break constraints; bold home/feature directions.
3. **Role Playing** (collaborative) — ideate from rider personas (beginner, progressing intermediate, coach, video creator, competitor).
4. **Cross-Pollination** (creative, if energy holds) — transfer patterns from Strava / Duolingo / Spotify / skate & climbing apps.

---

## Ideas Generated

### Phase 1 — Question Storming (question map)

Question clusters generated (no answers — problem-space mapping):

- **Home usage / direction:** the single-use moment & what the rider leaves with; what WakeRef knows that no one else does; "remove the home — what would be missed?"
- **Progression / learning:** progress = faster / safer / braver?; the gap between *knowing the trick's name* and *landing it*.
- **Audience:** beginner / expert / occasional / pro rider / industry pro; "tool for coaches/schools" vs "companion for the everyday rider"; what makes the occasional rider come back every session.
- **Usage context:** wet hands, full sun, on a phone, between two runs.
- **Data loop:** let a rider mark what they've landed — what does it unlock (for them, the community, the project)?
- **Economy / sustainability:** must it have a business model?; who funds it; what makes it deserve to exist in 5 years.
- **Culture:** capture the crews / spots / vibe beyond the cold trick data.
- **Ecosystem / unification:** federation reuse/merge; value for competition — judges as much as riders; content governance (who evolves it); cable vs boat vs kite specifics; why existing spot/trick sites don't break through; what would make WakeRef *incontournable*; bridging "federal" riders and "pro & chill" riders; unifying promoters, brands, spots, rival federations, communities, coaching, independent circuits.
- **Legitimacy / authority:** be believed by all camps; what if a federation contests the nomenclature; risk of a single standard (losing local nomenclatures / crew slang).
- **Values / inclusivity (militant core):** more inclusive sport; gender parity (promote & reward women at least as much as men); integrate handiwake as first-class; common tricks across wakeboard / wakeskate / handiwake without duplication; show disciplines without hierarchy; don't feed egos / strong individualities; confront federations' close-mindedness & leaders' egos; respond to a ski-nautique-dominated federation that marginalizes cable wakeboard.
- **Representation:** who is shown by default (home, example videos)?
- **Independence as strength:** make *not* being tied to a federation the core legitimacy argument.
- **⭐ Pivot question:** how to fill a gap / add a reference *without* becoming one more stone in an already scattered, fragmented universe?

**Emerged thesis:** WakeRef = the common, **independent, values-driven** language that unifies a fragmented sport — radically inclusive (gender, handiwake, all disciplines equal) and explicitly counter to federal gatekeeping and ego. The existing data model (switch groups + built-on tree) already serves the "shared trick across practices, no duplication" goal.

### Phase 2 — What If Scenarios

**[Positionnement #1] WakeRef as plumbing, not a destination** — open common nomenclature + stable trick IDs others link to. _Rejected by Alexis:_ depends on others integrating; infeasible in a poor, non-technical milieu with no continuity.

**[Contrainte fondatrice #2] Designed for a poor, non-technical, discontinuous milieu** — must have value depending on NO ONE else (no fed, no integration, no network effect, not even Alexis in 10 years). Network effects / collective governance = traps. Self-sufficient, useful alone from day 1.

**[Positionnement #3] Designed to survive abandonment** — assume a one-person, zero-budget project that may go dormant for years. Becomes the reference by *gravity* (cleanest, most complete, most neutral resource people link to spontaneously), not by ecosystem adoption. A reference doesn't rot like a social network. The anti-startup. _Validated by Alexis as his original instinct._

**[Core validé #4] Proven value = reference + quiz, no auth, free, self-service** — Alexis's original build. The little feedback he got: people like the trick info and the quiz. No account, free, libre-service is a deliberate stance.

**[Veine d'origine #5] WakeRef was born from a JUDGE's need** — as a federal judge: quick lookup to verify a trick, learn/recognize tricks, not lose the skill, and score runs. This is the most concrete, defensible, and underexploited audience.

**[Insight #6] The quiz IS judge/recognition training in disguise** — the existing quiz already trains trick recognition, which is exactly what judges (and riders) need. Latent killer angle not yet framed as such.

**[Tension #7] Reduce scoring subjectivity WITHOUT killing freestyle creativity** — 100% subjective scoring is a barrier to the sport's adoption/recognition (e.g. toward the Olympics), but a rigid frame would crush a freestyle culture where modules are homemade ("a skatepark on water") and riders thrive on hacking them and inventing their own style. AI auto-recognition is currently impractical (video dataset: angles, POV, edit formats).

**[Problème dur #8] Jib is hard to catalog exhaustively** — unlike air tricks / kicker (easy to enumerate), jib is combinatorial and hack-driven. A completeness/representation challenge for the reference.

**[Compétition #9] WakeRef as the judge's COPILOT, not the judge** — tools human judgment (faster, more consistent, teachable): recognition training, 2-sec poolside lookup, run note-taking — while leaving style/amplitude/creativity 100% to the judge. Validated as the right direction.

**[Traction #10] Real early traction** — project just created; ~300 videos added; ~60% of tricks covered; deliberately gender-balanced video curation (as many women as men). Quiz already works well; more video content would extend its quality → reason the public video-submission feature exists.

**[Compétition #11] Compo scoring, tested at the French championships (2024)** — used the compo grid (tick boxes), scored /80 + a compo note instead of /100. Now WakeRef can score ALL tricks of a run and auto-derive the compo note — matches what judges do on their sheet. Alexis is pushing to test it at the next competition.

**[Entraînement #12] Judge self-training on real runs** — play a run video, pre-fill the expected tricks as recorded on WakeRef, then compare your read to the answer. Trains scoring, not just recognition.

**[Certification #13] Support judge certification** — today: a /100 theory QCM + a practical part (text-only, manually verified). WakeRef could power/modernize this.

**[Run #14] "Quick win" run suggestions** — beyond showing what's missing in a run (already exists), suggest high-value additions / improvements.

**[Profil #15] Rider profile: track landed tricks** — but requires account/auth (friction Alexis is wary of).

**[Coaching #16] Blind-spot practice suggestions** — suggest how a rider could improve by filling gaps in their practice.

**[Écosystème #17] Free coach showcase (vitrine)** — let any coach add their link. Concern: getting coaches to come (without hand-recruiting), and detecting obsolescence of the info — maintenance pain.

**⚡ Cross-cutting tension A — personalization vs no-auth:** the best ideas (#15 profile, #16 blind-spots, tracking landed tricks) seem to need accounts, which conflicts with the no-auth / free / self-service / survive-abandonment stance.

**⚡ Cross-cutting tension B — freshness vs survive-abandonment:** anything needing ongoing curation (coach links #17, obsolescence) fights the "useful even if dormant" principle.

**[Profil #18→#19] Account-free profile, Compo-style** — local-first profile (track landed tricks, blind spots, quick wins), optionally saved/shared via link like a saved run (snapshot + id), zero auth/maintenance. _Refinement:_ prefer **custom / memorable links** (easier to retrieve) over random ids; tradeoff = anyone with the link can view (acceptable). **Resolves tension A** by reusing the existing Compo pattern.

**⚡ Blocker #21 — no-auth profile has two real flaws:** (a) nobody has time to sit and list ALL their tricks upfront (onboarding too long); (b) to come back and update (newly learned tricks), without auth *anyone with the link could edit someone else's profile*.

**[Profil #22 — resolution] Effortless + safely-editable account-free profile:**
- _Editability without accounts:_ public **view link** (by id) + a separate secret **edit link** (`?key=…` token) the owner keeps/bookmarks + stores locally. Sharing the view link never grants edit. (Same family as excalidraw/pastebin "edit token" links.)
- _No upfront listing:_ the profile **accretes passively** — one-tap "I can do this" while browsing or in the quiz, or "what did you land today?" after a session. Zero onboarding.
- _Infer from the trick tree:_ mark a few **keystone / hardest tricks**, and WakeRef infers the easier ones via the existing **prerequisites + built-on** graph. The data model already supports this.
- _Novelty:_ turns the chore ("list everything") into a 3-tap action by exploiting the trick graph; solves cross-device edit without auth via an edit-token link.

**[Coaching #20] Affinity-based, non-exhaustive coach section** — link friends + anyone who asks, no ambition to be a complete directory. Helps young riders and gives visibility to those trying to make a living from the sport. **Dissolves tension B** by dropping exhaustiveness (no recruiting, no obsolescence-detection burden).

**[Détail résolu] Cross-device edit without accounts** — edit-token link must physically travel to the new device (copy/email-to-self/QR/synced bookmark). Real but minor UX seam; acceptable to start. Deferred arbitrage: if seamless cross-device becomes a must, fall back to a magic-link / passkey (auth-light, ~95% of the no-account philosophy preserved).

**[Home #23 — validated insight] Discoverability problem** — users found the tricks page but did NOT realize the quiz and compo exist. The best features are hidden. Home redesign = a feature launchpad (big buttons per feature), and no need to list all categories on the home (the tricks page already does). _Not a deep topic — defer to the UX skill (`bmad-ux`)._

---

### Phase 3 — Role Playing (personas → concrete features)

Goal of this pass: turn the militant / inclusivity dimension into concrete features. Three personas: young female rider (Lina), handi-rider (Karim), judge (Sophie).

**[Inclusivité #24] Representation is an editorial posture, not personalization** — don't show "women to women." Show *everyone*, men first, that the sport is for women as much as for them. Lever = default display order (manually curated; 200 tricks, names known) + organic pool parity that "shows" on fiches & quiz. No auth, no gender guessing. Representation is *felt, never labeled* (no "female rider" badge); it targets the male gaze, not the comfort of women riders. _Alexis's correction — stronger than the personalized-default idea, which is rejected._

**[Inclusivité #25] Guaranteed parity per quiz session (not just on average)** — controlled sampling forces gender balance within the N questions of a game, instead of relying on random draw over the global pool. Representation becomes a guaranteed *experience*, not a statistic.

**[Modèle #26] Handiwake = full third discipline in the `sport` enum** — different gear (like wakeskate), so `sport` → `wakeboard | wakeskate | handiwake`. Not a checkbox on standing tricks. Genuinely shared tricks stay shared via switch-groups / built-on; sit-wake-specific tricks exist in their own right. "First-class, not duplication" becomes a schema decision.

**[Inclusivité #27] Parity-per-session generalizes to discipline** — quiz can be filtered by discipline and/or guarantee wakeskate + sit-wake representation (same controlled-sampling engine as gender parity #25). One sampling engine, two inclusion axes (gender × discipline), composable.

**[UX #28] No discipline silos: everyone reaches everything easily** — sit-wakers also enjoy watching standing wake (and vice versa). Discipline is a filter/focus, never a wall. Inclusion juxtaposes without hierarchy.

**[Architecture #29→#34] The faceted fiche, localized version** — *one* trick entity (slug, name, place in the built-on tree = the common language intact). Initial idea (#29): facets per discipline for `tips`/`description`/`difficulty`/`videos`. _Refined by Alexis (#34):_ keep the fiche unified (identity, breakdown, progression shared); facets only where they pay off — **tips section with "tips sit-wake / tips standing" tabs** + **videos section filterable by the 3 disciplines**. No heavy facet table on the whole fiche / schema. If tips differ *too* much → make them distinct tricks instead.

**[UX #30] Default facet = last facet opened (localStorage)** — no auth; remember the last discipline viewed (like `wakeref_lang`) and open it by default on other tricks.

**[Contenu #31] Tips are not the core — description (breakdown + progression) + videos are** — feedback shows people are happy with description + videos. `tips` are Claude-generated, often imprecise (worse for sit-wake). Don't over-invest per-discipline tips; possibly revisit their status. Real need going forward = *more content* (videos), curated to keep parity & cover under-filmed disciplines.

**[Direction #32] The discipline axis lives mainly in the QUIZ and COMPO, not the fiche** — fiche stays largely shared; real per-discipline differentiation is in quiz (by category *or* mixed global) and compo (run typed wake / wakeskate / sit-wake). Moves "discipline" complexity off the costly object (fiche + schema) onto the two features where it adds value.

**[Compétition #33] Inclusion as a lever of *sporting legitimacy*, not cosmetic** — a discipline-aware compo makes sit-wake (and wakeskate) judgeable as seriously as standing wake. WakeRef could be the first tool to do so. Inclusion goes from gesture (video parity) to competitive recognition — links the militant core to the judge's-copilot killer angle.

**[Compétition #35] Live capture by voice dictation, easy correction after** — the real pain of the paper sheet is *writing while keeping your head up*. Dictate tricks aloud during the run (head up, focused), correct mis-captures after. Need: the *exact* tricks, not just a marker. Vocabulary is *closed* (~200 known tricks) → grammar-constrained recognition is far more feasible than open dictation.

**[Compétition #36] Two-phase judging, made explicit** — (1) live capture, head up, during the run (~1 min, 8–12 tricks); (2) post-run window of a few minutes to evaluate, discuss between judges, position the note vs the pool's other notes. The judge starts the next run, so phase 2 has no time pressure. Hard constraint: **no video replay** of a trick allowed.

**[Recadrage #37] Note-spacing is a human act — NOT WakeRef's job** — pool = max 6 riders; the 1st's note is the reference, set by the chef juge in agreement; judges deliberately leave margin (don't pack the top two; keep room for an in-between rider or an improved 2nd run) and adapt gaps from known rider level. Crucially: notes are **not comparable** — 65 in one pool ≠ 65 in another / another age category; each pool/round resets. ⇒ No suggested note, no cross-pool note comparator. (My "objective comparator" provocation largely falls.)

**[Direction #38→#41] Public Compo vs Judge usage — auth need shrank** — initial idea (#38): judge *mode* behind an account (like admin) to save judged runs (not notes; the fed has its own tool, with 3–5 judges + 1 scorer). _Walked back by Alexis (#40, #41):_ judge **training stays public & no-auth like the rest**; official fed adoption as input tool is unrealistic (politically very closed, little leverage); in-competition use = unofficial *personal* convenience — a judge can capture on WakeRef then recopy to paper if comfier. Zero fed dependency, zero network effect — honors the survive-abandonment law.

**[Compétition #39] WakeRef = digital successor to the handwritten sheet** — today, end of an age category → chef juge collects all paper sheets, fed archives them. WakeRef captures the *tricks* of each run (not the note); potentially the chef juge consolidates a category's runs digitally. Replaces a concrete paper ritual without touching the fed's note tool.

---

## ⏸ Session paused — RESUME HERE

**Where we stopped:** Phase 3 (Role Playing) done and rich — all 3 personas explored. ~41 ideas captured above.

**Live thesis:** WakeRef = an **independent, values-driven trick reference + judge's copilot**, self-sufficient and account-free, designed to survive abandonment. Born from a federal judge's real need (recognize tricks, score runs). Already has traction (~300 videos, ~60% coverage, gender-balanced; quiz works; compo tested at the 2024 French championships).

**Pending decision (next step):**
- **[organize]** — go to idea organization & prioritization (themes / quick wins / horizon) and produce a plan.
- **[cross-pollination]** — last planned technique, untapped (Strava / Duolingo / skate / climbing) if more divergence wanted.

**Deferred to other skills/sessions:** home redesign → `bmad-ux`; cross-device profile auth arbitrage (magic-link/passkey) → later.

**Untapped veins if more divergence wanted:** culture/community, the jib cataloging hard-problem, Cross-Pollination (Strava/Duolingo/skate/climbing apps).
