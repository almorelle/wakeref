# Acceptance audit — `spec-unify-video-cards.md`

Baseline: `e69d9ce`. Working tree audited (diff artifact matches the tree).
Scope: compliance against the spec's Acceptance Criteria, I/O matrix, Boundaries, Code Map, and the project rules (`CLAUDE.md`, `_bmad-output/project-context.md`).

---

## 1. Acceptance Criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| AC1 | Trick page (YouTube + Instagram + upload) — before/after screenshots indistinguishable | **Partially met** | Not verifiable here (no screenshots in the artifact set, no test runner). Markup + CSS equivalence holds for the three nominal kinds (see §2/§3), but three row classes render differently than at `e69d9ce` — F1, F2, F3 below. |
| AC2 | Competition page — before/after indistinguishable | **Partially met** | Markup/CSS identical (`src/components/VideoCards.jsx:138-155` vs `git show e69d9ce:src/components/VideoCards.jsx:52-68`); `data-source` now carries the resolved `type` (`:147`) but `CompetitionDetail` passes no `sourceType`, so the value is unchanged, and no CSS selects on it (`grep data-source src/` → 1 hit, the attribute itself). **Deviation:** the thumbnail *and* the `.fallback` tile are now gated on `inView` (`:139`), where before both mounted synchronously. `.card` carries `aspect-ratio: 16/9` (`src/components/VideoCards.module.css:5-16`) so there is no layout shift, but a card already inside the viewport at mount paints empty for one frame before the `IntersectionObserver` callback fires. This is required by the "deferred mounting on both surfaces" boundary, so it is a sanctioned deviation from "zero visual change" — but it is a deviation, and the spec never reconciles the two rules. |
| AC3 | `FigureDetail.jsx` contains no `i.ytimg.com`, no `instagram.com` regex, no `IntersectionObserver` | **Met** | `grep -c "ytimg\|IntersectionObserver\|instagram\.com" src/pages/FigureDetail.jsx` → `0`. |
| AC4 | `npm run lint` baseline 9 errors / 7 warnings unchanged | **Met** | `npm run lint` → `✖ 16 problems (9 errors, 7 warnings)`, all in the judging/competition module. No unused import introduced: `externalUrl` still used at `src/pages/FigureDetail.jsx:476,482`, `supabase` at `:92,113,146,152`, `useRef/useState/useEffect` still used by `UploadVideo` and the page. |

Also verified from the spec's **Verification** block: `npm run build` succeeds (PWA `generateSW`, 97 precache entries, no new warnings).

---

## 2. I/O & Edge-Case Matrix

| Row | Verdict | Evidence |
|---|---|---|
| **YouTube** — `watch?v=`, `youtu.be/`, `/live/`, `?app=…&v=` → `maxresdefault`, link out; 404 → `hqdefault` → skin fallback tile | **Met, with a widening** | Parse delegated to `videoSourceFromUrl` (`src/lib/videoSource.js:17-31`), thumb at `VideoCards.jsx:50-51`, downgrade at `:60-63`. **Widening:** `/live/`, `/embed/`, `/v/` and `?app=…&v=` did **not** parse under the old `FigureDetail` regex (`git show e69d9ce:src/pages/FigureDetail.jsx:255` — `/(?:v=\|youtu\.be\/\|shorts\/)([^&?\s]+)/`), so on the *figure* surface such rows previously fell through to `styles.videoPlaceholder` (9/16, max 280 px, play glyph, no link). They now render a real 16/9 YouTube thumbnail linking out. Intended by the matrix, but it is a visible change on the trick page, i.e. AC1 cannot hold for these rows. |
| **YouTube short** — `/shorts/<id>` → `vertical: true`, 9/16, max 320 px | **Met** | `vertical` read at `VideoCards.jsx:107`, applied to `mediaVertical` (`:109`) and `ytThumbVertical` (`:114,117`); rules moved verbatim (`VideoCards.module.css:96-104`). |
| **Instagram** — `/p/`, `/reel/`, `/reels/`, `/tv/` → bucket `thumbnails/<shortcode>.jpg`; missing → branded tile, author + CTA kept | **Met** | `VideoCards.jsx:52-57`; fallback at `:98`, author/CTA built once at `:78-83` and used in both branches. Matches `git show e69d9ce:src/pages/FigureDetail.jsx:16-45` (shortcode-missing *and* `onError` both land on `instaFallback`). |
| **URL unparseable** — `source_type='instagram'`, URL is a profile → declared type wins → Instagram fallback tile | **Met for Instagram only** | Fallback at `VideoCards.jsx:45-47`; Instagram profile URL → `type='instagram'`, `src.shortcode` undefined → `thumb=null` → `instaFallback` (`:98`). Identical to `e69d9ce`. **The matrix does not state the symmetric YouTube case, and the implementation does not preserve it** — see **F1**. |
| **Neither parses nor declared** — `https://vimeo.com/…`, spoof `other.example/?u=youtu.be/X` → generic card, never treated as YouTube | **Met on competitions; changed on figures** | Host-anchored parsing (`videoSource.js:14,17,21,32`) kills the spoof. On the competition surface the generic card is unchanged. On the figure surface there is no "generic card" skin: the row now renders the `mediaWrap` frame with an empty 16/9 `ytThumb` block (`VideoCards.jsx:117`) where `e69d9ce` rendered `videoPlaceholder` — see **F2**. Note the case is largely unreachable in practice: `videos.source_type` is the `public.video_source` enum and `AdminVideos.deriveSourceType` (`src/pages/admin/AdminVideos.jsx:17-24`) only ever writes `upload`/`instagram`/`youtube`. |
| **Upload** — `source_type='upload'` + `file_path` → `UploadVideo` untouched | **Met** | `src/pages/FigureDetail.jsx:162-164`; `UploadVideo` logic byte-identical to `e69d9ce`, only three class references re-pointed to `videoStyles` (`:34,54,55`). Hover preview, `activate()` (unmute + `currentTime=0` + `play()`) and the `useInView` metadata gate all intact. |

---

## 3. Boundaries

### "Always"

- **Zero visual change on both surfaces** — **violated for three row classes** (F1, F2, F3) and knowingly relaxed by the deferred-mount requirement on competitions (AC2). The nominal cases (YouTube standard, YouTube short, Instagram with/without thumbnail, upload) are preserved: the moved CSS is byte-identical apart from the dropped `.mediaVerticalEl` selector (`diff` of `e69d9ce:FigureDetail.module.css:396-441,559-652` against `VideoCards.module.css:79-217` → one hunk, `.mediaVertical, .mediaVerticalEl` → `.mediaVertical`), rule order relative to `.instaPlay` is preserved, and the `<div className={instaPlay}>` → `<span>` swap is inert (`.instaPlay` is `display:flex`, `VideoCards.module.css:167-177`).
- **No embedded player except upload; outbound via `externalUrl(url, {ref:true})` + `_blank` + `noopener noreferrer`** — **met**, single `link` object at `VideoCards.jsx:65-70` used by all three branches.
- **Declared `source_type` stays the fallback when the URL does not parse; today's rendering of a malformed row must survive** — **partially met.** The fallback exists (`:45-47`) and preserves the Instagram case, but does **not** preserve today's rendering of a malformed *YouTube* row (F1).
- **Deferred mounting on both surfaces** — **partially met.** Competition variant: gated (`:139`). Figure YouTube/generic variant: gated (`:110`). **Figure Instagram variant: not gated** — `<img className={instaImg}>` renders unconditionally at `:88-94`. The `ref` is nonetheless attached via the spread at `:85`, so an `IntersectionObserver` is created, observed and disconnected, and forces one extra render per Instagram card, for no effect. Either gate the image or don't spread `ref` on that branch.

### "Never"

- `src/lib/videoSource.js` — **not modified** (absent from `git diff --stat e69d9ce`). ✔
- Takedown flow, `videoMeta`, anything in `FigureDetail.jsx` outside the three video components and `renderVideoMedia` — **respected.** The only hunks in `FigureDetail.jsx` are the import block (`:9,10,12-15`), the deletion of `InstagramCard`/`useInView`/`YouTubeCard`, three class references inside `UploadVideo`, and `renderVideoMedia`. `videoMeta`/`creator`/`sourceLink`/takedown markup untouched (`:473+`). ✔
- No CSS framework, no new dependency, no second variant axis — **respected.** `variant` is the only skin axis; `creatorName`/`sourceType` are data, not axes. ✔

### "Ask First"

- *"Any change to what a card displays, on either surface."* F1, F2 and F3 are each a change to what a card displays on the trick page. None is recorded in the spec (the Spec Change Log is empty, `spec-unify-video-cards.md:74`) and none is called out in the diff's comments. This gate was not honoured.

---

## 4. Findings

**F1 — `source_type='youtube'` with a non-parsing URL: `videoPlaceholder` → empty grey 16/9 frame. Unstated, reachable.**
`AdminVideos.deriveSourceType` (`src/pages/admin/AdminVideos.jsx:22`) stamps `youtube` on *any* URL containing `youtube.com` or `youtu.be`, including `/@channel`, `/playlist?list=…`, `/watch?feature=share`. At `e69d9ce` `renderVideoMedia` guarded on the parsed id (`git show e69d9ce:src/pages/FigureDetail.jsx:257` — `if (videoId)`) and such a row fell through to `<div className={styles.videoPlaceholder}>` (9/16, `max-height:280px`, centred play glyph, **not a link**). Now `VideoCards.jsx:45-47` resolves `type='youtube'` from the column, `:50` finds no `src.id`, `thumb` stays `null`, and `:117` renders an empty `ytThumb` span — a full-width 16/9 `--c-surface2` block with a play scrim, wrapped in an anchor to a page with no video. Different size, different aspect ratio, different affordance. The matrix's row 4 covers only the Instagram side of this fallback; the YouTube side was never specified and its pre-change rendering was not preserved, contradicting the "today's rendering of a malformed row must survive" boundary.

**F2 — non-YouTube/non-Instagram rows with a `source_url`: `videoPlaceholder` → empty grey 16/9 frame.**
`FigureDetail.jsx:170` now routes *every* row with a `source_url` to `VideoCard`, where `e69d9ce` routed only `source_type` `instagram`/`youtube` and dropped everything else to `videoPlaceholder`. Sanctioned in spirit by matrix row 5 ("generic card"), but the figure skin has no generic card — it reuses the YouTube frame. Low practical impact (enum + admin derivation make it near-unreachable), but it is a second, unstated way `videoPlaceholder` stops being reached. `videoPlaceholder` is now only reachable for a row with neither `file_path` nor `source_url` (`:183`).

**F3 — YouTube thumbnail double-404 on the figure surface: broken `<img>` → empty grey frame.**
`e69d9ce:src/pages/FigureDetail.jsx:284` used `onError={() => hiRes && setHiRes(false)}` — after the `hqdefault` retry also failed, the broken `<img>` stayed in the DOM. The shared handler (`VideoCards.jsx:60-63`) now sets `thumbFailed`, blanking `thumb` at `:58` and rendering the placeholder span. Explicitly sanctioned by matrix row 1 ("→ skin fallback tile") and a strict improvement, but it is nonetheless a rendering change on the trick page for that class of row, so AC1's "indistinguishable" cannot be asserted unconditionally.

**F4 — figure Instagram cards are not deferred, yet still pay for the observer.** `VideoCards.jsx:85` spreads `ref` onto the `instaCard` anchor; `:88-94` ignores `inView`. Boundary "deferred mounting … applies to both surfaces" is not satisfied for that card type, and the observer is pure overhead (one wasted state update + re-render per Instagram card on a trick page).

**F5 — CSS deleted beyond the declared move (harmless).** `.platformThumb` / `.platformThumb:hover` / `.platformThumb i` / `.platformThumb span` (`e69d9ce:src/pages/FigureDetail.module.css:653-670`) and `.mediaVerticalEl` (`:422`) were removed. Neither appears in the spec's move list (task 3) nor in the "keeps" list (Code Map, `spec:53`). Both were already dead at `e69d9ce` (`git show e69d9ce:src/pages/FigureDetail.jsx | grep` → no hits; `grep -rn "mediaVerticalEl\|platformThumb" src/` → none), so the deletion is safe and consistent with the task's "no dead CSS left behind" rationale — but it is an undeclared scope extension.

**F6 — CLAUDE.md bullet contradicts itself.** `CLAUDE.md:40` states the component "owns platform detection (`lib/videoSource.js`, from the URL — **never from a column**)" and, in the same bullet, "`sourceType` is a fallback consulted only when the URL won't parse." The second clause is the accurate one; the first will mislead the next agent into deleting the fallback the spec's Design Notes call load-bearing (`spec:80`). Task 7 asked for "one line under `videos`"; what landed is a ~7-line paragraph — acceptable, but the "never from a column" phrasing should go.

**Absent / not evidenced:** the spec's Manual checks (before/after screenshots on both surfaces, upload hover+click) produce no artifact in `_bmad-output/implementation-artifacts/`. AC1 and AC2 rest on code equivalence alone.

---

## 5. Code Map conformance

`git diff --stat e69d9ce` + untracked files, source only:

| File | Declared | Verdict |
|---|---|---|
| `src/components/VideoCards.jsx` | yes | modified ✔ |
| `src/components/VideoCards.module.css` | yes | +147, verbatim move ✔ |
| `src/hooks/useInView.js` | yes (new) | created; body byte-identical to `e69d9ce:src/pages/FigureDetail.jsx:58-73`, only `export` prepended ✔ |
| `src/pages/FigureDetail.jsx` | yes | modified within the allowed regions ✔ |
| `src/pages/FigureDetail.module.css` | yes | −158 ✔ (see F5) |
| `src/pages/CompetitionDetail.jsx` | yes | one line, `variant="competition"` at `:252` ✔ |
| `src/lib/videoSource.js` | read-only | untouched ✔ |
| `CLAUDE.md` | task 7 | modified ✔ (see F6) |

**Nothing outside the Code Map was modified.** No `.ts`/`.tsx` added, `src/hooks/` naming matches the existing `useAuth.js`/`useToast.js`/`useScrollDrive.js` convention (named export, like `useAuth`), no direct Tabler import, no Supabase client re-creation, no i18n string added on a French-only surface. Both call sites keep one component per file with its co-located module CSS.

**Uncommitted:** all of the above is in the working tree; nothing has been committed or pushed.
