---
name: Judge Training — Experience Spec
status: final
updated: 2026-06-19
design: ./DESIGN.md
form_factor: web — desktop-first, mobile degraded
ui_system: WakeRef internal design system (CSS Modules + src/index.css tokens, [data-theme])
---

# Judge Training — Experience

A practice tool where a judge captures the tricks of a recorded full run, then checks her saisie against the single fixed reference solution for that run. The aim is **accuracy of capture** — did she catch every trick, in the right order, with the right attributes — not a score. Cross-references DESIGN.md tokens by `{name}`.

## Foundation

- **Form-factor: desktop-first web** (departure from WakeRef's mobile-first norm — see DESIGN.md Layout). Mobile is supported but degraded (stacked panes).
- **UI system**: inherits the WakeRef design system. This spec carries only the behavioral delta; visual identity is DESIGN.md.
- **No score**: the Compo /20 calculator is neither shown nor computed here. Reuse only the saisie sub-component of `Compo.jsx`, decoupled from `GRIDS` scoring.
- **Stateless / anonymous**: no per-user progress storage (consistent with WakeRef's single-admin auth, no public sign-up). Each session is self-contained.
- **Data dependency**: each reference run is an admin-authored fixed solution (Compo snapshot format: `entries` + `jibPasses`, plus `gridKey`), linked to a video, tagged with a competition category that rolls up to easy / medium / hard. Reference content must NOT be readable by the public client before evaluation (RLS concern — defer exact mechanism to architecture).

## Information Architecture

New **top-level nav item** alongside Quiz (e.g. "Entraînement juge" / "Judge training"). Three surfaces:

1. **Selection** — pick difficulty (easy / medium / hard) + discipline (wakeboard / wakeskate / seated). Resolves to a run.
2. **Judging** — video + saisie, ending in "Évaluer mon run".
3. **Correction** — revealed reference solution diffed against the judge's saisie; video stays available; "Recommencer" returns to Selection.

Surface closure: every stated need (choose a run → capture it → see what she got wrong → go again) maps to a surface, and every surface lands a journey step (D9).

Open: run-selection mechanism within a (difficulty × discipline) bucket — single curated run, a small list to pick from, or random "next run". Lockable later; a filterable picker is the through-line.

## Voice and Tone

Coaching, neutral, never punitive. Correction copy states facts, not judgement: "Trick oublié", "En trop", "Mauvaise approche (attendu : toeside)", "Bon trick, mauvaise position". The CTA is action-framed: "Évaluer mon run". Restart is "Recommencer". Bilingual fr/en via `useT()` — add all new strings to both languages.

## Component Patterns (behavioral)

- **difficulty-card** — selecting one and a discipline-chip enables "Commencer". The category mapping (U11/MP1–3 etc.) is shown for orientation, not separately selectable.
- **saisie-panel** — behaves exactly like Compo saisie (add modes per grid, left/right side, approach axis per discipline, jib passes) MINUS the score panel. The active `gridKey` is fixed by the chosen run's discipline/grid, not user-switchable here.
- **video-player** — standard controls; pause and scrub are allowed (the spec accepts non-live-faithful practice). Persists into the Correction surface.
- **diff-two-pane** — aligns judge entries to reference entries by run position; each row carries one diff state (see State Patterns). Legend always visible.

## State Patterns

**Per-element diff states** (the core of the correction screen):

| State | Meaning | Token | Pairing (non-color) |
|---|---|---|---|
| Correct | matches trick + all attributes + position | `{colors.diff-correct}` | check icon |
| Missing | in reference, absent from saisie | `{colors.diff-missing}` | minus / gap on judge side |
| Extra | in saisie, absent from reference | `{colors.diff-extra}` | plus icon, muted/strike |
| Wrong attribute | right trick & position, wrong approach/side/rotation | `{colors.diff-attr}` | amber badge on the offending attribute only |
| Wrong order | right trick present, wrong position | `{colors.diff-order}` | swap icon |

- **Matching rule**: an element is Correct only on exact trick + approach + side + rotation + position (D8). The free-text "autre" field is excluded — never Missing/Extra/Wrong.
- **Summary**: the correction shows a plain-language tally ("3 corrects · 1 oublié · 1 mauvaise approche") — no /20.

**Screen states:**
- Selection: default; loading (resolving a run); empty (no reference run exists for that difficulty × discipline → honest message, suggest another combo); error.
- Judging: video loading / load error (video unavailable or under takedown); saisie empty (evaluate-cta disabled); saisie in progress.
- Correction: rendered diff; video re-watch active.

## Interaction Primitives

- Enter tricks while the video plays/pauses; reorder/remove as in Compo.
- "Évaluer mon run" — disabled until ≥1 element entered; on click, locks the saisie and reveals the reference + diff. (No in-place re-edit loop — restart is the path back.)
- On the correction screen, scrub the video to any moment to inspect an error.
- "Recommencer" → returns to Selection (fresh difficulty/discipline choice), discarding the session.

## Accessibility Floor

- Inherit WakeRef's `:focus-visible` ring and contrast floor (WCAG 2.4.7 already in `index.css`).
- **Diff color is never the sole signal** — every state pairs color with an icon and a text label (covers color-blind users; see Do's and Don'ts).
- Video player keyboard-operable; provide text alternative for "video unavailable".
- Saisie controls keyboard-reachable (inherited from Compo; verify the extraction preserves it).

## Key Flows

Key-screen mocks: judging/saisie — [`mockups/judging-screen.html`](./mockups/judging-screen.html); the climax (correction/diff) — [`mockups/correction-screen.html`](./mockups/correction-screen.html). Spines win on conflict with the mocks.

**Flow — Léa checks her eye before a comp (the climax: the reveal).**

Léa, trainee judge at her club, opens WakeRef on her laptop the evening before a competition.

1. She opens **Judge training** from the nav and picks **medium** + **wakeboard**.
2. A run video loads beside the saisie panel. She plays it, pausing to jot, then enters the tricks she saw — she's allowed to scrub back to re-check a rotation.
3. The run ends; she re-watches the third hit, unsure of the approach, and tweaks her entry.
4. She clicks **"Évaluer mon run"**.
5. **Climax** — the reference solution unfolds on the right, diffed against her saisie. Her eye lands first on a **red row**: she missed the toeside backside 360 on the last kicker entirely. Then an **amber badge**: she had the railey but called it heelside when the run was toeside. One **blue swap** icon: she logged the two rail tricks in the wrong order. The greens reassure her the rest was clean. A one-line tally sits on top — no score, just counts.
6. She scrubs the video back to the last kicker, watches the move she missed, and nods.
7. She clicks **"Recommencer"**, picks **medium + wakeskate**, and goes again.

## Responsive & Platform

- **Desktop (primary)**: two-pane judging (`{spacing.module-max}`), two-column diff.
- **Mobile (degraded)**: panes stack; video sticky-collapsible; diff collapses to one column where each row fuses judge + reference for that position. All states and the matching rule are identical — only layout changes.
