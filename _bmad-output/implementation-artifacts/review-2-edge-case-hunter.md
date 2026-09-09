# Review 2 — Edge Case Hunter

Scope: `_bmad-output/implementation-artifacts/review-diff.patch`
Behavioural reference: `git show e69d9ce:src/pages/FigureDetail.jsx` and the pre-change `VideoCards.jsx` in the diff.
Requirement under test: **zero visual and behavioural change on both surfaces**.

Findings only. Lint on the four touched JS files is clean (no new errors above the 9/7 baseline).

---

## H1 — Schemeless `source_url` silently loses its thumbnail (figure page)

**Severity:** High
**Location:** `src/lib/videoSource.js:11` (`new URL(String(url))`), reached from `src/components/VideoCards.jsx:41`

`videos.source_url` has **no `^https?://` CHECK** (`scripts/wakeref_schema.sql:62` — unlike `competition_videos.url`, line 169, which does), and the admin gate accepts a schemeless link: `deriveSourceType` (`src/pages/admin/AdminVideos.jsx:17-24`) only substring-tests `instagram\.com` / `youtube\.com|youtu\.be`. So `instagram.com/p/XYZ` or `youtu.be/dQw4w9WgXcQ` are storable, and `src/lib/url.js:11` exists precisely because such values are expected (`url.includes('://') ? url : 'https://' + url`).

**Failure scenario.** A row with `source_url = "youtu.be/dQw4w9WgXcQ"`, `source_type = 'youtube'`:
- Old: `v.source_url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?\s]+)/)` is a substring match on the raw string → `videoId = "dQw4w9WgXcQ"` → real maxres thumbnail.
- New: `new URL("youtu.be/…")` throws → `{ type: 'link' }` → the `sourceType` fallback (`VideoCards.jsx:45-47`) restores the *skin* but `src.id` is `undefined`, so `VideoCards.jsx:50` never builds a thumb → `thumb` stays `null` → an **empty grey 16:9 block**.

Same for Instagram (`instagram.com/p/XYZ` → the ink `instaFallback` tile instead of the bucket thumbnail). The href still works because `externalUrl` repairs the scheme — only the picture disappears, silently and permanently.

**Sub-case:** `src.vertical` is only ever set on the URL-parsed YouTube path. When `type` comes from the fallback, `vertical` is `undefined` (`VideoCards.jsx:107`), so a schemeless **Shorts** URL also loses `mediaVertical` / `ytThumbVertical` and renders as a full-width 16:9 frame instead of a centred 9:16 one. Old code did `v.source_url.includes('/shorts/')` on the raw string and got it right.

**Fix:** normalise before parsing, the same way `externalUrl` does.
```js
export function videoSourceFromUrl(url = '') {
  const raw = String(url)
  let u
  try { u = new URL(raw.includes('://') ? raw : `https://${raw}`) } catch { return { type: 'link' } }
```

---

## H2 — `source_type='upload'` with a null `file_path` now renders an outbound card

**Severity:** Medium-High
**Location:** `src/pages/FigureDetail.jsx:158-184`

`source_type` is `NOT NULL DEFAULT 'upload'` (`scripts/wakeref_schema.sql:61`), `file_path` is nullable, and there is **no CHECK** tying them together. Upload rows routinely carry a `source_url` — that is exactly what the "Source originale" link at `FigureDetail.jsx:481` (`v.source_type === 'upload' && v.source_url`) is for.

**Failure scenario.** A row with `source_type='upload'`, `file_path=null`, `source_url='https://instagram.com/p/XYZ'` (default-typed insert, a storage upload that half-failed, or any legacy/manual row):
- Old: `v.source_type === 'upload' && url` → false (url null); the Instagram branch required `source_type === 'instagram'`, the YouTube branch `=== 'youtube'` → **grey `videoPlaceholder`**.
- New: both remaining branches are gone; the row falls straight through to `if (v.source_url)` → a full-size Instagram card with the creator name burned into the overlay, plus the "Source originale" link repeated directly under it.

The old code's platform branches were guarded on `source_type`; the new one only guards on `source_url`, so the "upload" arm no longer terminates the routing.

**Fix:**
```js
if (v.source_type === 'upload') return <div className={styles.videoPlaceholder}><Icon name="player-play" /></div>
```
placed right after the `UploadVideo` return (or gate the card with `v.source_type !== 'upload' && v.source_url`).

---

## M3 — The `ytThumb` placeholder sits inside the `inView` guard, so the frame is still crushed to zero

**Severity:** Medium
**Location:** `src/components/VideoCards.jsx:104-121`

The comment on lines 104-106 states the intent: *"Sans miniature, un bloc vide au bon format plutôt qu'un cadre écrasé à zéro — `ytThumb` porte déjà le ratio et le fond."* But **both** the `<img>` and the fallback `<span>` are behind `{inView && …}`. While `inView` is false the `<a class=mediaWrap>` contains nothing in flow (`.mediaScrim` is `position:absolute; inset:0`), so its height is **0** — precisely the crushed frame the comment says it avoids.

**Failure scenario.** `.videosGrid { columns: 2 }` with `.videoCard { break-inside: avoid }` (`FigureDetail.module.css:366-375`). Every card mounts at ~`videoMeta` height and jumps to `videoMeta + 16:9` when the observer fires. In a CSS multi-column container each growth re-balances **both** columns, so cards migrate across the column boundary under the user's reading position while they scroll.

This also now hits **more rows than before**: an unparseable / unknown-platform link previously rendered `.videoPlaceholder` at a stable 9/16 height with no deferral; it now goes through the collapsing `mediaWrap`.

**Fix:** move the reserved block out of the guard.
```jsx
{inView && thumb
  ? <img src={thumb} alt={title || ''} className={cx(styles.ytThumb, vertical && styles.ytThumbVertical)} loading="lazy" onError={onThumbError} />
  : <span className={cx(styles.ytThumb, vertical && styles.ytThumbVertical)} aria-hidden="true" />}
```

---

## M4 — Rows that used to be inert placeholders are now links with no accessible name

**Severity:** Medium
**Location:** `src/components/VideoCards.jsx:109-123`, reached from `src/pages/FigureDetail.jsx:170-181`

For `type === 'link'` the anchor's entire content is (a) an `aria-hidden` span and (b) the play `Icon`, which is `aria-hidden`/`focusable=false` by default (`src/components/Icon.jsx:149-151`). When a thumbnail does render, `alt={title || ''}` is empty for the very common `v.title === null` row. Net: **an `<a>` with an empty accessible name and an empty tab stop.**

Old code returned a non-interactive `<div className={styles.videoPlaceholder}>` for exactly these rows, so no tab stop existed. (The YouTube card had the same empty-name problem before, so this is a *widening*, not a new class of defect.)

**Fix:** `<a {...link} aria-label={title || creatorName || labels.generic || 'Voir la vidéo'} …>` on the figure-variant anchor.

---

## M5 — The competition card's thumbnail *and* its fallback tile are now deferred; they were not before

**Severity:** Low-Medium
**Location:** `src/components/VideoCards.jsx:36`, `139-152`

The pre-change competition card had **no `useInView`** — `<Thumb>` rendered on first paint, and the `<img>` already carried `loading="lazy"`, so the network fetch was deferred by the browser anyway. The guard therefore buys nothing on this surface and costs a blank frame.

**Failure scenario.** `.card` paints `background: var(--c-bg)` = `#dcd2de` in light theme (`src/index.css:11`), `.play` is a white glyph with an `rgba(255,255,255,.85)` border, and `.scrim`'s gradient is `transparent` at the top. Between first paint and the first IntersectionObserver callback, an above-the-fold competition card renders as a **blank paper rectangle with an invisible play button**. The `.fallback` ink gradient is also behind the guard, so a card with no bucket thumbnail flashes light-on-light too.

**Fix:** either drop the guard for `variant === 'competition'` (`.card` already reserves 16/9), or keep `<span className={styles.fallback} />` unconditional and gate only the `<img>`.

---

## M6 — Exact host matching drops YouTube subdomains that the old regex caught

**Severity:** Low
**Location:** `src/lib/videoSource.js:20`

`host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com'`. A `https://music.youtube.com/watch?v=ID` link (a plausible paste) falls to `{ type: 'link' }`. Old FigureDetail matched `v=` anywhere in the string and produced a correct thumbnail.

**Fix:** `host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com'`.

---

## L7 — `thumbFailed` / `ytHiRes` are never reset when `url` changes

**Severity:** Low (latent — not reachable today)
**Location:** `src/components/VideoCards.jsx:38-39`

Both are plain `useState` with no dependence on `url`. Not triggered right now only because both call sites key by row id (`FigureDetail.jsx:471` `<div key={v.id}>`, `CompetitionDetail.jsx:250` `<li key={v.id}>`), which forces a remount. The first caller that reuses the component at a stable position with a rotating `url` (carousel, "next video" stepper) inherits the previous card's failed-thumbnail state and shows a blank frame for a perfectly good video.

**Fix:** `useEffect(() => { setYtHiRes(true); setThumbFailed(false) }, [url])`, or state in the JSDoc that `key={url}` is required.

---

## L8 — The end of the maxres → hqdefault chain behaves differently from before

**Severity:** Low (divergence, arguably an improvement — flagged because the brief is "zero behavioural change")
**Location:** `src/components/VideoCards.jsx:60-63`

Old figure card: `onError={() => hiRes && setHiRes(false)}` — there was **no failed state**, so a dead id left the browser's broken-image glyph on screen. New: the second error sets `thumbFailed` → blank `ytThumb`.

Note the chain has a hole in **both** versions: `i.ytimg.com` answers **HTTP 200 with a 120×90 grey filler** for a deleted/private video rather than a 404, so `onError` never fires and that filler is `object-fit: cover`-stretched across the frame. No guard exists for it (would need an `onLoad` `naturalWidth <= 120` check).

---

## L9 — `useInView` is instantiated on the Instagram figure branch, which never reads it

**Severity:** Low
**Location:** `src/components/VideoCards.jsx:36` with `78-101`

Every Instagram figure card creates and observes an IntersectionObserver, then re-renders once when `inView` flips — for markup that is byte-identical either way (the `<img>` at line 82 is *not* gated, matching the old `InstagramCard`).

Observer cleanup itself is correct: deps `[inView, rootMargin]`; the re-run after the flip early-returns at `if (!el || inView) return`, and the prior cleanup calls `io.disconnect()` on an already-disconnected observer (no-op). StrictMode's double-mount also disconnects and re-observes cleanly.

**Fix:** compute `type` before the hook and pass a `disabled` flag, or return `[ref, true]` early.

---

## L10 — `data-source` changed meaning and has no consumer

**Severity:** Informational
**Location:** `src/components/VideoCards.jsx:147`

Was `src.type` (URL-derived, so `'link'` for anything unparseable); is now the fallback-resolved `type`. `grep -rn "data-source" src/` returns exactly one hit — the attribute itself. No CSS rule, no test. Either drop it or keep it deliberately.

---

## L11 — Dead CSS carried over verbatim; no cross-module collisions

**Severity:** Informational
**Location:** `src/components/VideoCards.module.css` (`.instaCta i`)

- `.instaCta i { font-size: 14px }` has never matched: `Icon` renders a tabler `<svg>` (`Icon.jsx:152`), never an `<i>`. Moved across unchanged.
- **No collision risk** between the two modules — CSS Modules hash per file. Verified that the split works: `UploadVideo` takes `mediaWrap` / `mediaScrim` / `instaPlay` all from `videoStyles`, so the descendant selectors `.mediaWrap:hover .mediaScrim` and `.mediaWrap:hover .instaPlay` still resolve; `<video className={styles.video}>` from the page module is only a leaf class and is unaffected.
- `.mediaVerticalEl` and `.platformThumb` were correctly deleted — `grep -rn "mediaVerticalEl\|platformThumb" src/` returns nothing.
- `.mediaScrim:hover` is redundant with `.mediaWrap:hover .mediaScrim` for the anchor variants, but still load-bearing for the `<button>` in `UploadVideo`. Keep.

---

## Machine-readable summary

```json
[
  {"location":"src/lib/videoSource.js:11","trigger_condition":"source_url stored without a scheme (no DB CHECK, admin allows it)","guard_snippet":"new URL(raw.includes('://') ? raw : `https://${raw}`)","potential_consequence":"YouTube/Instagram thumbnail and Shorts vertical layout silently lost"},
  {"location":"src/pages/FigureDetail.jsx:158-184","trigger_condition":"source_type='upload' with null file_path but non-null source_url","guard_snippet":"if (v.source_type === 'upload') return <div className={styles.videoPlaceholder}><Icon name=\"player-play\" /></div>","potential_consequence":"Placeholder becomes an outbound card duplicating the source link below"},
  {"location":"src/components/VideoCards.jsx:110-121","trigger_condition":"Figure card not yet in view; ratio placeholder is behind the guard","guard_snippet":"{inView && thumb ? <img .../> : <span className={styles.ytThumb} aria-hidden=\"true\" />}","potential_consequence":"Zero-height frame reflows the columns:2 masonry under the reader"},
  {"location":"src/components/VideoCards.jsx:109-123","trigger_condition":"type==='link' with null title; every child is aria-hidden","guard_snippet":"aria-label={title || creatorName || labels.generic || 'Voir la vidéo'}","potential_consequence":"Unlabeled keyboard tab stop where an inert placeholder used to be"},
  {"location":"src/components/VideoCards.jsx:139-152","trigger_condition":"Competition card first paint before the IntersectionObserver fires","guard_snippet":"Render <span className={styles.fallback}/> unconditionally; gate only the <img>","potential_consequence":"Blank paper card with an invisible white play button flashes"},
  {"location":"src/lib/videoSource.js:20","trigger_condition":"URL host is a YouTube subdomain such as music.youtube.com","guard_snippet":"host === 'youtube.com' || host.endsWith('.youtube.com')","potential_consequence":"Valid YouTube link falls back to the generic unthumbnailed card"},
  {"location":"src/components/VideoCards.jsx:38-39","trigger_condition":"Same component instance re-rendered with a different url prop","guard_snippet":"useEffect(() => { setYtHiRes(true); setThumbFailed(false) }, [url])","potential_consequence":"Second video inherits the first one's failed-thumbnail blank frame"},
  {"location":"src/components/VideoCards.jsx:60-63","trigger_condition":"i.ytimg.com returns HTTP 200 grey filler for a deleted video","guard_snippet":"onLoad={e => { if (e.target.naturalWidth <= 120) setThumbFailed(true) }}","potential_consequence":"120x90 grey filler stretched by object-fit across the 16:9 frame"},
  {"location":"src/components/VideoCards.jsx:36","trigger_condition":"Instagram figure branch never reads inView but still observes","guard_snippet":"Compute type first, skip the observer when the branch does not defer","potential_consequence":"Wasted observer plus a no-op second render per Instagram card"},
  {"location":"src/components/VideoCards.jsx:147","trigger_condition":"data-source now carries the sourceType-resolved value, not src.type","guard_snippet":"Remove data-source, or document that it reflects the resolved type","potential_consequence":"Attribute with no consumer and changed semantics drifts unnoticed"},
  {"location":"src/components/VideoCards.module.css (.instaCta i)","trigger_condition":"Icon renders <svg>, never <i>, so the rule cannot match","guard_snippet":"Delete the .instaCta i rule or retarget it to svg","potential_consequence":"Dead rule preserved across the move, misleading future edits"}
]
```
