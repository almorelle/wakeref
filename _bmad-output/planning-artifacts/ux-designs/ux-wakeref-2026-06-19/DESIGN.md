---
name: Judge Training — Visual Identity Delta
status: final
updated: 2026-06-19
inherits: WakeRef design system (src/index.css global tokens + CSS Modules, [data-theme] dark/light)
colors:
  # Inherited (do not redefine — reference by name from src/index.css)
  bg: var(--c-bg)
  surface: var(--c-surface)
  surface2: var(--c-surface2)
  surface3: var(--c-surface3)
  border: var(--c-border)
  text: var(--c-text)
  muted: var(--c-muted)
  accent: var(--c-accent)
  wake: var(--c-wake)        # wakeboard discipline
  ws: var(--c-ws)            # wakeskate discipline
  seated: var(--c-seated)    # seated discipline
  # Diff semantics (NEW — map onto existing status tokens, no new hex)
  diff-correct: var(--c-success)   # element matches reference exactly
  diff-missing: var(--c-danger)    # in reference, absent from judge saisie (false negative)
  diff-extra: var(--c-faint)       # in judge saisie, absent from reference (false positive) — de-emphasised
  diff-attr: var(--c-ws)           # right trick, wrong attribute (approach/side/rotation) — amber warning
  diff-order: var(--c-accent2)     # right trick present but at wrong position
typography:
  display: var(--font-display)   # Syne — headings, buttons, labels
  body: var(--font-body)         # DM Sans
rounded:
  sm: var(--r-sm)   # 6px
  md: var(--r-md)   # 10px — buttons, chips
  lg: var(--r-lg)   # 16px — cards, video frame
  xl: var(--r-xl)   # 24px
spacing:
  page-max: 900px         # inherited .page-container; WIDENED for this module (see Layout)
  module-max: 1280px      # two-pane judging needs more width than the public 900px
components:
  - difficulty-card
  - discipline-chip
  - video-player
  - saisie-panel        # reused Compo saisie, score calculator REMOVED
  - evaluate-cta
  - diff-row
  - diff-two-pane
---

# Judge Training — Visual Identity

This is a **delta** on the existing WakeRef design system. All base tokens (colors, type, radius, theming) come from `src/index.css`. Do not introduce a CSS framework or new hex values — extend via CSS Modules + global tokens, honoring `[data-theme]` dark/light. (See `_bmad-output/project-context.md`.)

## Brand & Style

WakeRef is a dense, dark-first, editorial reference tool for cable wakeboard/wakeskate/seated tricks. Confident, technical, uncluttered. The judge-training module inherits that voice but leans **focused and tool-like** — this is a practice instrument, not a marketing surface. No decorative flourish competes with the video or the diff. Discipline color (`{colors.wake}` / `{colors.ws}` / `{colors.seated}`) is the only chromatic accent during selection and saisie; status color owns the correction screen.

## Colors

Base palette inherited. The module adds a **diff semantic set** that reuses existing status tokens so it inherits theming for free:

- **Correct** → `{colors.diff-correct}` (green): the element matches the reference on every defining attribute and position.
- **Missing** → `{colors.diff-missing}` (red): present in the reference run, absent from the judge's saisie. The costliest judging error — most salient.
- **Extra** → `{colors.diff-extra}` (faint/muted, often with str/strike): the judge entered something not in the run. An error, but visually quieter than "missing" so the eye lands on omissions first.
- **Wrong attribute** → `{colors.diff-attr}` (amber): correct trick at the correct position, but wrong approach / side / rotation. Pedagogically the most interesting near-miss.
- **Wrong order** → `{colors.diff-order}` (blue accent): the right trick exists in the run but the judge placed it at the wrong position.

The free-text "autre" field is **never colored as an error** (excluded from correctness — see EXPERIENCE.md). Render it neutral.

## Typography

Inherited. `{typography.display}` (Syne) for the difficulty/discipline labels, the "Évaluer mon run" CTA, and diff legends; `{typography.body}` (DM Sans) for trick names and the run list.

## Layout & Spacing

**Departure from the WakeRef norm: this module is desktop-first.** The public app is mobile-first and capped at `{spacing.page-max}` (900px). Judging needs a wide two-pane layout, so this module uses `{spacing.module-max}` (1280px).

- **Saisie screen** (desktop): two panes — **video left, saisie-panel right** — both visible at once. Video is sticky so it stays in view while the judge scrolls the entered list.
- **Correction screen** (desktop): the video persists (collapsible) above or beside a **`diff-two-pane`**: judge's saisie on the left, revealed reference solution on the right, rows aligned by position.
- **Mobile (degraded, not primary)**: panes stack — video on top (sticky/collapsible), saisie below; the diff becomes a single column of `diff-row`s that fuse both sides per position rather than two columns.

## Shapes

Inherited radii. Video frame and cards use `{rounded.lg}`; chips and buttons `{rounded.md}`.

## Components

Visual specs only here; behavior lives in EXPERIENCE.md.

- **difficulty-card** — three cards: easy / medium / hard. Each shows the bucket label and the competition categories it covers (easy = U11 · MP1–3; medium = U14 · MP3–5 · O40; hard = U18 · open · O30) as muted sub-text.
- **discipline-chip** — toggle chips tinted by discipline token (`{colors.wake}` / `{colors.ws}` / `{colors.seated}`).
- **video-player** — standard HTML5 controls (play/pause/scrub/seek). No custom timeline scoring. `{rounded.lg}` frame, `{colors.surface}` letterbox.
- **saisie-panel** — the reused Compo saisie. **The /20 score calculator panel is removed** in this mode; the freed width goes to the video. Add modes (jib / kicker / air_trick / flat) follow the active grid as in Compo.
- **evaluate-cta** — primary button, `{typography.display}`, label "Évaluer mon run". Disabled until at least one element is entered.
- **diff-row** — one run position. Left cell = judge entry, right cell = reference entry; row tint by diff semantic. Shows trick name + attribute badges (approach/side/rotation), badge tinted amber when that specific attribute is the miss.
- **diff-two-pane** — the side-by-side correction container with a sticky legend of the five diff colors.

## Do's and Don'ts

- **Do** keep the video reachable on the correction screen — the judge reviews her errors against the footage.
- **Do** make "missing" the loudest state and "extra" the quietest.
- **Don't** show or compute the Compo /20 score anywhere in this module.
- **Don't** reveal the reference solution before the judge clicks "Évaluer mon run".
- **Don't** color the free-text "autre" field as right or wrong.
- **Don't** drop below the existing WCAG focus-ring / contrast floor when adding diff colors — pair color with an icon/label (color is never the sole signal).
