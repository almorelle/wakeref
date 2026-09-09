---
title: 'Unify the video cards between competitions and tricks'
type: 'refactor'
created: '2026-09-09'
status: 'done'
baseline_commit: 'e69d9ce'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The same job — turn a video URL into a clickable thumbnail that opens at the host — is implemented twice. `VideoCards.jsx` parses URLs with `videoSourceFromUrl()`; `FigureDetail.jsx` re-implements the same detection with two weaker regexes, its own maxres→hq fallback and its own Instagram-thumbnail lookup, on the site's most visited page.

**Approach:** One `VideoCard` component owns the logic (typing, thumbnail resolution, deferred mounting, outbound link). Presentation stays per-surface: a `variant` prop selects the existing skin, so **no pixel moves on either surface**. The uploaded-video player is not a thumbnail card and stays where it is.

## Boundaries & Constraints

**Always:**
- **Zero visual change on both surfaces.** Tricks: YouTube = play button only, Instagram = play + author + CTA, shorts capped at 320px. Competitions: play + title + CTA.
- No embedded player except `source_type='upload'` (`CLAUDE.md`, `videos`). Outbound links via `externalUrl(url, { ref: true })`, `target="_blank"`, `rel="noopener noreferrer"`.
- Declared `source_type` stays the fallback when the URL does not parse — today's rendering of a malformed row must survive.
- Deferred mounting (`rootMargin: 300px`, mount immediately when `IntersectionObserver` is absent) applies to **both** surfaces.

**Ask First:**
- Any change to what a card displays, on either surface.
- Moving, renaming or deleting `UploadVideo`.

**Never:**
- Do not touch `videoSource.js` behaviour, the takedown flow, `videoMeta` (title/creator/caption/takedown below the thumbnail), or anything else in `FigureDetail.jsx` outside the three video components and `renderVideoMedia`.
- Do not introduce a CSS framework, a new dependency, or a shared "mega-component" with more than the one `variant` axis.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| YouTube | `watch?v=`, `youtu.be/`, `/live/`, `?app=…&v=` | `maxresdefault`, link out | 404 → `hqdefault` → skin fallback tile |
| YouTube short | `/shorts/<id>` | `vertical: true` → figure skin: `9/16`, max 320px | as above |
| Instagram | `/p/`, `/reel/`, `/reels/`, `/tv/` | bucket `thumbnails/<shortcode>.jpg` | missing → branded tile, author + CTA kept |
| URL unparseable | `source_type='instagram'`, URL is a profile | declared type wins → Instagram fallback tile (today's rendering) | N/A |
| Neither parses nor declared | `https://vimeo.com/…`, or spoof `other.example/?u=youtu.be/X` | generic card; never treated as YouTube | N/A |
| Upload | `source_type='upload'` + `file_path` | `UploadVideo` untouched: hover preview, click plays with sound | N/A |

</frozen-after-approval>

## Code Map

- `src/components/VideoCards.jsx` -- becomes the single card. Gains `variant`, `creatorName`, `sourceType`, deferred mounting.
- `src/components/VideoCards.module.css` -- receives the figure skin classes moved out of `FigureDetail.module.css`.
- `src/hooks/useInView.js` -- new; extracted verbatim from `FigureDetail.jsx:57-73`, now used by both surfaces.
- `src/pages/FigureDetail.jsx` -- deletes `InstagramCard`, `YouTubeCard`, `useInView` and the regexes in `renderVideoMedia`; keeps `UploadVideo`, which imports the shared frame classes.
- `src/pages/FigureDetail.module.css` -- loses the moved classes; keeps `videoCard`, `videoMeta`, `videosGrid`, `videoPlaceholder`, `video` and everything below the thumbnail.
- `src/pages/CompetitionDetail.jsx` -- call site gains `variant="competition"`; otherwise untouched.
- `src/lib/videoSource.js` -- read-only reference; already returns `vertical` and is strictly more robust than the regexes it replaces.

## Tasks & Acceptance

**Execution:**
- [x] `src/hooks/useInView.js` -- extract the hook verbatim from `FigureDetail.jsx` -- both surfaces need it, and a hook exported from a page file cannot be imported without dragging the page in
- [x] `src/components/VideoCards.jsx` -- add `variant` ('competition' | 'figure'), `creatorName`, `sourceType` fallback, and deferred mounting; render each skin's existing markup -- one place decides what a video is
- [x] `src/components/VideoCards.module.css` -- move in `instaCard/instaImg/instaScrim/instaFallback/instaInfo/instaAuthor/instaCta`, `mediaWrap/mediaVertical/mediaScrim`, `ytThumb/ytThumbVertical`, and the shared `play` frame -- the skin must travel with the component
- [x] `src/pages/FigureDetail.jsx` -- delete the two card components and the regexes; `renderVideoMedia` routes upload → `UploadVideo`, everything else → `VideoCard variant="figure"`; `UploadVideo` imports the shared module for its frame -- the page stops owning video logic
- [x] `src/pages/FigureDetail.module.css` -- delete the moved rules -- no dead CSS left behind
- [x] `src/pages/CompetitionDetail.jsx` -- pass `variant="competition"` -- explicit at the call site rather than defaulted
- [x] `CLAUDE.md` -- one line under `videos`: `VideoCards.jsx` is the single card, `variant` selects the skin -- the next agent must not re-derive it

**Acceptance Criteria:**
- Given a trick page with a YouTube, an Instagram and an uploaded video, when it renders before and after, then the two screenshots are indistinguishable.
- Given a competition page with videos, when it renders before and after, then the two screenshots are indistinguishable.
- Given `FigureDetail.jsx`, when the change lands, then it contains no `i.ytimg.com`, no `instagram.com` regex and no `IntersectionObserver`.
- Given `npm run lint`, when it runs, then the baseline of 9 errors / 7 warnings is unchanged.

## Spec Change Log

### 2026-09-09 — suites de la revue adverse

- **Deux régressions fermées sur la surface figure.** L'aiguillage était devenu un
  fourre-tout `if (v.source_url)`. Il rendait un lien là où l'ancien code posait
  un bloc inerte : (a) une ligne typée `youtube` dont l'URL ne livre pas
  d'identifiant — `AdminVideos.deriveSourceType` estampille `youtube` sur toute
  URL contenant « youtube.com », page de chaîne ou playlist comprise — menait
  vers une page sans vidéo ; (b) une ligne `upload` ayant perdu son fichier
  faisait de sa `source_url` d'attribution la vignette principale, en doublon du
  lien « voir la source originale » rendu dessous (cas réel, `videos.id = 221`).
  `videoPlaceholder` rejoint donc le module partagé : c'est au composant, pas à
  la page, de savoir dire « je n'ai rien à montrer ».
- **URL sans schéma.** `videos.source_url` n'a pas de CHECK `^https?://`, à la
  différence de `competition_videos.url`, et l'ancien code s'en accommodait
  (regex sur la chaîne brute). `new URL()` aurait levé, et la miniature aurait
  disparu sans bruit. L'URL passe désormais par `externalUrl()` avant analyse.
- **Nom accessible.** Les ancres des cartes figure portent un `aria-label` ; sans
  titre, une carte YouTube n'avait aucun nom — trou antérieur au lot.
- **État de miniature** remis à zéro quand l'`url` change, pour qu'une carte
  recyclée ne reste pas dégradée.
- **`inView` n'est pas posé sur la carte Instagram figure**, et son observateur
  n'est plus créé pour rien. Son cadre ne réserve aucune hauteur (`instaImg` en
  `height: auto`), donc la différer ferait sauter la maçonnerie du fil ;
  `loading="lazy"` retient déjà l'octet. Écart assumé au « différé sur les deux
  surfaces », consigné plutôt que masqué.

**Écarts sanctionnés, conservés :** un double 404 de miniature YouTube rend
désormais un bloc au bon format au lieu d'une image cassée (ligne 1 de la
matrice) ; une ligne YouTube dont l'ancienne regex ignorait la forme — `/live/`,
`/embed/`, `?app=…&v=` — affiche maintenant sa vraie miniature au lieu du bloc
inerte, ce qui est l'objet même du lot. Deux règles CSS mortes,
`.mediaVerticalEl` et `.platformThumb`, ont été supprimées au passage.

## Design Notes

`UploadVideo` stays in `FigureDetail.jsx` (owner's call) but shares `.mediaWrap`, `.mediaScrim` and the play button with the moved cards. Rather than duplicate those rules, the page imports both modules — `import videoStyles from '../components/VideoCards.module.css'` alongside its own. Unusual enough to deserve a comment; duplicating the frame would defeat the lot.

`sourceType` is a **fallback, not the router**: `videoSourceFromUrl()` decides, and the declared column speaks only when the URL yields `type: 'link'`. Without it, a row whose URL stopped parsing would silently downgrade — an Instagram row pointing at a profile renders the branded tile today and must keep doing so.

## Verification

**Commands:**
- `npm run lint` -- expected: 9 errors / 7 warnings, unchanged
- `npm run build` -- expected: succeeds
- `grep -c "ytimg\|IntersectionObserver" src/pages/FigureDetail.jsx` -- expected: 0

**Manual checks:**
- Screenshot a trick page carrying all three video kinds (YouTube standard, YouTube short, Instagram, upload) before and after; compare.
- Same for a competition page with at least one YouTube and one Instagram video.
- Hover an uploaded video: the muted loop preview must still start, and the click must still play it with sound.
