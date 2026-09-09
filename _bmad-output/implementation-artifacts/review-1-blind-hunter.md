# Review 1 — Blind Hunter (adversarial, diff-only)

Scope: `_bmad-output/implementation-artifacts/review-diff.patch` only. No other project file read.
Claim under test: one `VideoCard` serves both surfaces, `variant` picks the skin, **zero visual change on either surface**.
Line references are to the patch; `pN` = patch line number.

---

## HIGH

### H1 — `src.vertical` is almost certainly undefined: YouTube Shorts lose their vertical layout on figure pages
`src/components/VideoCards.jsx`, `const vertical = src.vertical` (p158).

The old `FigureDetail` computed verticality itself: `const isShort = v.source_url.includes('/shorts/')` (p536), and passed it as `vertical` to `YouTubeCard`. The new code reads `src.vertical` off `videoSourceFromUrl()`. That function was written for the competition card, which **never consumed a `vertical` field** — nothing in the old `VideoCard` (p67–107) touches it. If the field doesn't exist, `vertical` is `undefined` for every video, `styles.mediaVertical` and `styles.ytThumbVertical` are never applied, and every Short renders 16/9, cropped, full page width — exactly the "mur vidéo sur desktop" the retained CSS comment (p251-252) says it exists to prevent.

Failure scenario: a figure with a `/shorts/` video. Before: 9/16 thumbnail capped at 320px, centered. After: a full-width 16/9 box with the middle band of a portrait thumbnail.

Fix: verify `videoSourceFromUrl` actually returns `vertical` for `/shorts/`. If it doesn't, either add it there (and cover Instagram reels consistently) or keep the derivation in the component: `const vertical = type === 'youtube' && /\/shorts\//.test(url)`. This is not optional — it is the single most likely silent visual regression in the change.

### H2 — Competition cards are now lazy-mounted; nothing reserves their height, so the deferral degenerates and shifts layout
`src/components/VideoCards.jsx`, competition branch `{inView && (thumb ? <img…> : <span className={styles.fallback}/>)}` (p192–205); previously `<Thumb …>` rendered unconditionally (p190).

The competition surface had **no** `useInView` before. Now, before intersection, the `<a className={styles.card}>` contains only `styles.scrim` — which, given `.mediaScrim`/`.instaScrim` are all `position:absolute; inset:0` in this codebase, is out-of-flow. The anchor therefore has **zero height** until `inView` flips. Consequences, all new:
- Every card in the list collapses to the same y-position, so all of them are inside the 300px root margin simultaneously → they all mount at once → the deferral buys nothing and only adds N IntersectionObservers.
- The list then expands from 0 to full height in one frame → cumulative layout shift on `/competitions/:idSlug`, on a page that previously had none.
This directly contradicts "zero visual change on either surface".

Fix: either don't gate the competition variant on `inView` (restore the old unconditional render — the img already has `loading="lazy"`), or give `.card`/`.fallback` a reserved `aspect-ratio` that applies while the tile is empty, the way the figure branch deliberately does with `ytThumb` (see its own comment at p155-157, which identifies precisely this hazard and then doesn't apply the lesson to the competition skin).

### H3 — `.mediaVerticalEl` was deleted and never recreated
`src/pages/FigureDetail.module.css` (p594-595) removed `.mediaVertical, .mediaVerticalEl { max-width: 320px; margin-inline: auto; }`. `VideoCards.module.css` (p253) re-declares **only** `.mediaVertical`.

`mediaVerticalEl` (`El` = the `<video>` element) was in the same rule as `mediaVertical` and belongs to `UploadVideo`, which stays in `FigureDetail`. The diff shows `UploadVideo` only partially (p497–516) — the `<video>` element's `className` line is inside an unshown context region. If it still says `styles.mediaVerticalEl`, that class now resolves to a CSS-Modules identifier with **no rule behind it**: a vertical uploaded clip loses its 320px cap and centering and renders full-bleed.

Failure scenario: a portrait file hosted by WakeRef on a figure page — full-width portrait video on desktop.

Fix: grep `mediaVerticalEl` in `FigureDetail.jsx`. If used, re-add the rule to `FigureDetail.module.css`; if genuinely dead, say so in the commit rather than deleting it as collateral of an unrelated move.

### H4 — Very likely ESLint failure: imports orphaned by the deletions in `FigureDetail.jsx`
`src/pages/FigureDetail.jsx` — the removed `InstagramCard` (p399–438), local `useInView` (p442–457) and `YouTubeCard` (p465–492) were the consumers of `externalUrl` (p415, p473) and, together with the Instagram thumbnail lookup (p403), of `supabase`. Both are imported above the first hunk (which starts at line 6), so the diff can't show whether they're still referenced. `useEffect` is in the same position: the only `useEffect` visible in the removed code was inside the local `useInView`.

ESLint is the only automated check in this repo; `no-unused-vars` on these would fail it.

Fix: run `npm run lint` and drop whatever is now unused from the import block (do not blanket-remove — `supabase` may still back `getVideoUrl`, `useRef`/`useState` still back `UploadVideo`).

---

## MEDIUM

### M1 — A non-YouTube/non-Instagram video on a figure page went from an inert placeholder to an anonymous outbound link with no accessible name
`src/pages/FigureDetail.jsx`, `if (v.source_url) return <VideoCard variant="figure" …>` (p543–553), replacing three type-guarded branches that all fell through to `<div className={styles.videoPlaceholder}>` (p558).

Old behaviour for a Vimeo/other row: a static placeholder tile, not clickable. New behaviour: the figure variant's non-Instagram branch renders `<a>` → empty `aria-hidden` span + a play `<span>` containing an icon. `labels` from `FigureDetail` is `{ instagram: … }` only, and the figure branch never reads `labels.generic` anyway — so there is **no text anywhere inside the link**. Screen readers announce a link whose only name candidate is the icon (and if `Icon` renders `<i>`, nothing at all). Sighted users get an unlabelled black frame that navigates off-site.

Fix: keep the placeholder for `type === 'link'` in the figure variant, or render a visible + accessible label there (`labels.generic`, and pass it from `FigureDetail`). At minimum add `aria-label` to the `<a>` in every figure branch.

### M2 — `thumbFailed` / `ytHiRes` never reset when `url` changes
`src/components/VideoCards.jsx` (p78–80).

Both states are initialised once and only ever move in the "worse" direction. Nothing keys them to `url`. If React reuses a `VideoCard` instance across a prop change — figure→figure navigation while `FigureDetail` stays mounted, a video list re-ordered, an admin edit changing a row's URL — a card that failed for video A stays permanently degraded for video B: `thumbFailed=true` suppresses a perfectly good thumbnail forever, and `ytHiRes=false` pins B to `hqdefault`. The refactor makes this worse than before: previously the failure state was split across three short-lived components (`InstagramCard.errored`, `YouTubeCard.hiRes`, `VideoCard.thumbFailed`); now one instance carries all of it across both skins.

Fix: `key={url}` on `<VideoCard>` at both call sites (cheapest and unambiguous), or derive from a `useEffect`/`useState` reset on `url`. Note `CompetitionDetail` keys the `<li>` (p373) by `v.id`, not by url — an admin editing a video's URL in place keeps the same id and the same component instance.

### M3 — An `upload` row whose storage URL doesn't resolve now emits an outbound link
`src/pages/FigureDetail.jsx` (p524 vs p543).

Old: `if (v.source_type === 'upload' && url)` → falls through both remaining `source_type` guards → placeholder. New: the upload guard still requires `url`, but the next branch is `if (v.source_url)` with **no type guard at all**. An upload row that also carries a `source_url` (a staging path, an internal reference, an empty-ish string) now renders a card whose `href` is `externalUrl(that_value)` — a link to something that was never meant to be a public destination.

Fix: `if (v.source_type !== 'upload' && v.source_url)`, or gate on `type !== 'link'` before rendering the outbound card.

### M4 — Second-level YouTube thumbnail failure changed shape (visual change on the figure page)
Old `YouTubeCard`: `onError={() => hiRes && setHiRes(false)}` (p484) — after falling back to `hqdefault`, a further 404 did nothing; the `<img>` stayed in the DOM with its `alt`. New: the shared `onThumbError` (p110–114) sets `thumbFailed` → `thumb = null` → the `aria-hidden` empty span renders instead.

That is a deliberate improvement, but it *is* a rendering difference on the figure surface, and it is not called out anywhere. It also means the `alt` text (the only accessible name that branch ever had) disappears exactly when the image fails — see M1.

Fix: acknowledge it in the change description, and pair it with an accessible name that survives the fallback.

### M5 — The Instagram figure branch ignores `inView`; the observer runs for nothing
`src/components/VideoCards.jsx` (p136–151). The other two branches gate their media on `inView`; this one renders `<img>` immediately. `useInView` is still called and still attaches an IntersectionObserver via the spread `ref`, so every Instagram card on a long figure page pays for an observer that changes no output.

This matches the old `InstagramCard` (which had no deferral), so it's not a regression — but the docstring sells "différer le montage" as one of the four things now shared, and for a third of the cases it isn't. Either gate it (with a reserved-ratio placeholder, cf. H2) or stop pretending it's unified.

### M6 — The change silently swaps two hand-written regexes for `videoSourceFromUrl`, and the diff proves nothing about the substitution
Removed: `instagram\.com\/(?:p|reels?|tv)\/([^/?#]+)` (p401) and `(?:v=|youtu\.be\/|shorts\/)([^&?\s]+)` (p535). Both are now replaced by `src.shortcode` / `src.id` from an **unmodified** `lib/videoSource.js`.

If that module's Instagram pattern doesn't cover `/tv/` or singular `/reel/`, or its YouTube pattern misses `youtu.be/` or `/embed/`, the corresponding figure-page thumbnails silently vanish (the new `&& src.shortcode` / `&& src.id` guards turn a miss into "no thumbnail", not into an error). The whole correctness of the refactor rests on a file the diff doesn't touch and doesn't quote.

Fix: diff the two regex sets against `videoSourceFromUrl` explicitly and record the comparison; add the missing cases there before this lands.

### M7 — `data-source` now reports the `sourceType` fallback instead of the parsed URL
`src/components/VideoCards.jsx` (p200): `data-source={type}`, previously `data-source={src.type}` (p190).

`data-source` exists to be styled — the untouched top half of `VideoCards.module.css` presumably keys `.img[data-source="instagram"]` / `="youtube"` on it. For a row whose URL doesn't parse but whose `source_type` column says `youtube`/`instagram`, the attribute now flips from `link` to the platform value, changing which rule applies. `CompetitionDetail` doesn't pass `sourceType` today so the competition surface is unaffected *right now* — meaning this is a landmine that detonates the first time someone passes `sourceType` there (which the new prop invites).

Fix: decide which one drives styling and state it. If the CSS is about the *thumbnail's* provenance, keep `src.type`; the fallback `type` is about the *destination*, not the image — and when the fallback fires there is no image at all.

---

## LOW

### L1 — `variant = 'competition'` and `labels = {}` defaults hide caller mistakes
p74-75. A caller that forgets `variant` silently gets the competition skin instead of failing; a caller that forgets a label renders `<Icon/> undefined` → icon followed by nothing, no warning. Given there are exactly two call sites, make `variant` required (no default) and let a missing label be visible in dev.

### L2 — `.platformThumb` deleted with no evidence it was dead
`src/pages/FigureDetail.module.css` (p716–732). Nothing in the *shown* code referenced it, but the diff never demonstrates that, and it's removed in a commit about moving the Instagram/YouTube skins. If some other branch of `FigureDetail` still uses `styles.platformThumb`, that element loses its ratio, background and centering. Verify, or split the dead-CSS removal out.

### L3 — Class naming: `instaPlay` now dresses the YouTube frame and the uploaded-file player
p173 (`play(styles.instaPlay)` in the YouTube branch) and p513 (`videoStyles.instaPlay` in `UploadVideo`). Carried over from the old code, but the move to a shared module was the moment to rename it `playButton` — as it stands, `FigureDetail` imports a module and reaches for an Instagram-named class to skin a hosted MP4.

### L4 — `ref` passed through an object spread
p116–121, `const link = { ref, href, target, rel }` then `<a {...link}>`. It works, but it hides a ref inside what reads as a bag of attributes; a future contributor adding a fourth branch that spreads `link` into a non-element context, or one who spreads `link` twice, gets a silent breakage. Spell `ref={ref}` out at each of the three anchors.

### L5 — `FigureDetail` now imports two CSS modules whose source order is bundler-determined
p389/p393. Fine today because the class sets are disjoint, but nothing enforces that. If either module later styles the same element via a shared global/element selector, which one wins depends on import order, not intent. Worth a note in the file comment (which currently only justifies *why* there are two).

### L6 — Doc/naming drift
`CLAUDE.md` (p9) says "`components/VideoCards.jsx` **is the single card**" — plural filename, singular default export `VideoCard`, and the same doc line then explains that `FigureDetail` still owns a second renderer. If this is now the one card, rename the file to `VideoCard.jsx`/`VideoCard.module.css` while the call sites are already being touched.

### L7 — Trailing whitespace/blank-line noise at the end of `VideoCards.module.css`
p366 leaves a trailing blank after `.instaCta i`, on top of the two blank lines already at p218-219. Cosmetic, but it's the kind of thing that makes the next diff on this file noisier than it needs to be.

---

## Verification checklist before this lands
1. `videoSourceFromUrl` returns `vertical` (H1), and its Instagram/YouTube patterns cover everything the two deleted regexes did (M6).
2. `grep -rn "mediaVerticalEl\|platformThumb" src/` (H3, L2).
3. `npm run lint` (H4).
4. Visual A/B on: a figure with a `/shorts/` video, a figure with an Instagram video whose bucket thumbnail is missing, a figure with a non-YT/non-IG link, a competition page with 6+ videos scrolled from the top (watch for the collapse-then-expand of H2), and a vertical uploaded file.
