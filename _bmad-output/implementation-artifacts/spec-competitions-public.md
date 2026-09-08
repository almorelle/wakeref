---
title: 'Competitions: public ribbon + detail page (lot B)'
type: 'feature'
created: '2026-09-08'
status: 'done'
baseline_commit: '4099ec6ca2eeae4966187ad1ac643f6db41ae989'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ten real competitions sit in the database and nobody can see them — lot A built the admin, not the surface. The agenda has no public existence.

**Approach:** A vertical ribbon anchored on today (down = future, up = past) plus a self-contained detail page reachable by direct link, wired into the menu and home like any other section.

## Boundaries & Constraints

**Always:**
- Sort chronologically, period. **No filters, no search, no recommendation, no "smart" ordering** — "Léo n'est pas dans un moteur de recommandation". Same-day comps take `id` as a tiebreaker so the order is stable between loads.
- An empty link renders as **"à venir" / "coming"**, never as nothing: an announced void brings people back, a silent one sends them away. (The third state, "there won't be one", was deliberately dropped — `NULL` means "no info yet", full stop.)
- Every link is **outbound**: WakeRef points, it never embeds or re-hosts. Cancelled comps stay listed, struck through — informing, not hiding.
- Reuse `src/lib/competitionDates.js` for every date rendering, and always `select` `date_precision` with it (a dev-only guard warns otherwise).
- UI strings via `useT()` in both `fr` and `en`. DB text is proper nouns — rendered as-is, never translated.

**Ask First:**
- Any schema change. Lot A's shape is fixed and deployed.
- Adding a filter, a search field, a "similar competitions" ranking, or anything that sorts by something other than the date.

**Never:**
- Do not touch the admin, and do not import an `admin/*` module here.
- Do not paginate or archive by year — deliberately deferred until the volume is a real problem (a rich man's problem; the exit is a per-season page).
- Do not show a "live" badge on a `date_precision='year'` comp: its date is unknown, so it cannot be in progress.
- No `_en` DB column, no free-text authoring in this feature.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Landing | `/competitions` | Ribbon renders; the view is anchored on the running comp, else the nearest upcoming one | Empty DB → a plain "rien pour l'instant" |
| Running today | `date_precision='day'`, today ∈ [start, coalesce(end,start)] | "Live" badge | N/A |
| Year-only comp | `date_precision='year'` | Renders as the year alone, **never** a live badge, sorted after that year's dated comps (stored Dec 31) | N/A |
| Year-only, year running | e.g. 2026 seen in Sept 2026 | Sits on the **future** side of the anchor; flips to past on Jan 1st | N/A |
| Cancelled | `cancelled=true` | Struck through, still listed, still reachable | N/A |
| Missing link | e.g. `live_video_url` is NULL | Renders the label with "à venir", not hidden | N/A |
| Direct link | `/competitions/10-championnat-de-france-2026` | Detail page renders standalone, no ribbon visit needed | Unknown/invalid id → NotFound |
| Stale slug | `/competitions/10-vieux-nom` | Same page: only the leading id is parsed, the slug is decorative | N/A |
| Unpublished | `published=false` | Absent from both ribbon and detail (RLS), and absent from the sitemap | N/A |

</frozen-after-approval>

## Code Map

- `src/pages/Competitions.jsx` + `.module.css` -- NEW: the ribbon. Model: `src/pages/Figures.jsx` (218 l.) for the public list shape
- `src/pages/CompetitionDetail.jsx` + `.module.css` -- NEW: the standalone listing. Model: `src/pages/FigureDetail.jsx` for structure and `<SEO>` usage
- `src/lib/competitionDates.js` -- existing formatter; extend with the `isLive` / past-future derivation (React-free, so lot C can reuse it)
- `src/App.jsx` -- two lazy public routes under `PublicLayout`
- `src/components/Navbar.jsx:114`, `src/components/Footer.jsx:28`, `src/pages/Home.jsx:356` -- section entries (home tiles pull `MODULE_IMAGE_DIR/<img>.jpg` from Storage — **a `Competitions.jpg` must be uploaded**, else the tile shows a broken image)
- `src/i18n/translations.js` -- new keys in `fr` and `en`
- `scripts/generate-sitemap.js:11` -- add `/competitions` and one entry per published comp

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/competitionDates.js` -- add `competitionState(comp, now)` → `live` | `past` | `upcoming` and a `competitionPath(comp)` building `/competitions/<id>-<slugified name>` -- one place owns the temporal rules and the URL shape
- [x] `src/pages/Competitions.jsx` + `.module.css` -- fetch all published comps ordered by `date_start` then `id`, render the ribbon, anchor the initial scroll on the live/nearest-upcoming entry -- the page itself
- [x] `src/pages/CompetitionDetail.jsx` + `.module.css` -- parse the leading id, fetch the comp + its videos, render links (absent ones as "à venir"), the tour link, and same-typology/same-year suggestions -- the shareable unit
- [x] `src/App.jsx` -- lazy routes `/competitions` and `/competitions/:idSlug` inside `PublicLayout` -- reachable
- [x] `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `src/pages/Home.jsx` -- add the section entry -- discoverable
- [x] **Owner action, done:** `Competitions.jpg` uploaded to Storage under `MODULE_IMAGE_DIR` -- verified HTTP 200 alongside the four others
- [x] `src/i18n/translations.js` -- all new strings in `fr` + `en` -- no untranslated label ships
- [x] `scripts/generate-sitemap.js` -- add the index and published detail pages -- Sylvie's link should be findable

**Acceptance Criteria:**
- Given a comp running today, when the ribbon loads, then it carries a live badge and the initial scroll position shows it without user action.
- Given a `date_precision='year'` comp, when it renders anywhere, then only the year appears, no live badge, and it sits after that year's dated comps.
- Given a detail URL whose slug no longer matches the name, when it is opened, then the correct comp renders.
- Given a competition with no `live_video_url`, when its listing renders, then the label appears with "à venir" rather than being omitted.
- Given the language is switched to EN, when the ribbon and a detail page render, then no French UI label remains (DB proper nouns excepted).
- Given `npm run lint`, when it runs, then no new error or warning outside the judging module (baseline 9/7).

## Spec Change Log

**2026-09-08 — review iteration 2**, after a large owner-requested visual pass (timeline redesign, detail page, shared video cards, two images, affiliation logos, tape treatment). Three reviewers.
- *Scope exceptions, recorded after the fact:* the visual pass required a **schema change** (`0018`: `logo_path` → `poster_path`, plus a new `logo_path`) and **admin changes** (two upload fields) — an "Ask First" and a "Never" in the frozen block, both requested by the owner in conversation. Mirrored into `wakeref_post_restore.sql` and `wakeref_schema.sql`, applied in production, every reference updated. The frozen Boundaries are stale on these two points and only the human can amend them.
- *`RemoteLogo` existed to prevent broken images and was not used where it mattered.* The ribbon and the poster rendered raw `<img>`: a file missing from Storage left a row with no visual marker at all, and an empty bordered box at the top of the detail page. Both now go through it, and the component takes a `fallback` (the initials) instead of only vanishing. Its failure state is now keyed on `path`, so reuse with a different image is no longer latched off by one earlier 404.
- *`thisYear` read the browser's timezone* while every other day computation is pinned to Europe/Paris. Around New Year the two disagreed for hours: a viewer abroad saw the whole running season collapse into compact form — including a live competition, which is also the scroll anchor.
- *The "today" marker was emitted after the year separator*, so at every January the badge read under the previous year's heading, asserting today was in 2025. Order swapped. It was also absent entirely from a list with no past competition (a fresh season) — a tail variant now closes the feed.
- *A competition spanning New Year* was filed under its start year and forced compact while live. Year attachment now follows `date_end`.
- *`youtube.com/live/<id>` was not recognised* — the canonical URL of a stream and its archive, i.e. the likeliest link on this page. Detection rewritten around `URL` parsing with an explicit host check: `watch?app=…&v=`, `?list=…&v=`, mixed case and `youtube-nocookie` now work, and `other.example/?u=youtu.be/X` is no longer treated as a YouTube video.
- *The venue name vanished when `wakepark_url` was NULL.* The visual pass moved it onto the link's tape, which only renders in the link branch — so the page named the venue in its meta description but nowhere on screen.
- *"à venir" was shown on finished competitions* ("Inscription — à venir" on a 2019 event). Past competitions now read "non communiqué". Same for the siblings heading, which claimed "cette saison" while listing the viewed competition's year.
- *`--tape-shadow` was defined only in the light palette*, casting near-black on near-black ground in the night edition, where the tapes stay white by design.
- Also fixed: the connector stroke stopped 18px short of the card and ran under the opaque node; compact rows' nodes sat 13px off the timeline on mobile (`--node` redefined on the row while the rule is positioned from the ribbon's value); `styles.upcoming` interpolated the literal string `undefined` into every future row's class; the date rendered "12–14&nbsp;&nbsp;&nbsp;juin" (a flex gap added on top of segments that already carry their spaces); an out-of-range id showed "try again later" instead of a 404; the poster reserved no space above the fold; `#fff` on the accent failed AA at 10px; the links section had no heading while its i18n key sat unused.
- *Rejected after verification:* `Competitions.jpg` missing (uploaded since — the spec's BLOCKED task is stale), `javascript:` in a link column (the `competitions_urls_http` CHECK forbids it), the admin list's thumbnail (it renders no image), `externalUrl` + `noreferrer` (a pre-existing project-wide pattern, not introduced here), the `home` icon on the organiser link (owner's explicit request — the link is no longer Instagram-specific).
- *The YouTube façade mounted an in-page `<iframe>`*, contradicting the frozen "Always" ("WakeRef points, it never embeds or re-hosts"), the page's own subtitle ("On référence, on ne diffuse pas") and the product invariant behind both ("ne pas vampiriser" the organiser). **Resolved by the owner: no embed.** Playback always happens at the host, in a new tab; the thumbnail stays, for Instagram *and* YouTube. This removed the `playing` state, the `useInView` observer and the iframe entirely — and with them three other findings: focus lost when the button was replaced by the iframe, a `/shorts/` card doubling in height on play, and the compositing layer a `filter`ed façade forced on the page. The distinction that settles it: a trick video is content the owner curates, a competition video belongs to the organiser whose traffic the feature exists to send onward.

**2026-09-08 — review iteration 1 (patches only, no re-derivation).** Three reviewers. Rejected after verification: `timestamptz` columns (they are `date`), `date_end < date_start` (blocked by a CHECK), null `date_start`/`affiliation` (both NOT NULL), a global `scroll-behavior: smooth` (absent), hardcoded `<SEO>` copy (the project's own pattern).
- *A cancelled competition running today was badged "En ce moment" and stole the scroll anchor.* `competitionState` never looked at `cancelled`, so the page's only colour accent pointed at an event that isn't happening. Cancellation is now folded into the temporal derivation, not just the presentation.
- *The viewer's timezone decided a French calendar day.* `todayISO` built the browser's local day and compared it to a `date` column meaning a day in Paris — at 16:00 in Los Angeles a running competition read "upcoming". Now pinned to `Europe/Paris` via `Intl.DateTimeFormat`.
- *The anchor overrode browser scroll restoration on Back*, defeating the abstention `ScrollToTop.jsx:12-17` documents as a project convention. **First fix was wrong and broke anchoring entirely**: `useNavigationType()` returns `POP` on a first direct load too, so the guard disabled the page's central behaviour. Fixed with a module-level "already mounted once" flag, then verified in the browser both ways.
- *A network error rendered a hard 404 with `noindex`* on a URL that is in the sitemap. `PGRST116` (no row) is now distinguished from transport failures.
- *Video and sibling fetch errors were discarded*, so a failed load claimed "no videos" — on a past competition, the very reason the page exists. Errors surface, and a past competition with no video now says so rather than hiding the section.
- *`live` was a blacklist of `'year'` rather than a whitelist of `'day'`*, so any coarser precision added later would inherit a live badge on its storage-artefact day.
- Also fixed: missing `.eq('published', true)` (an admin with a session saw unpublished rows on the *public* page), the missing `id` tiebreaker on two queries, three serial round-trips before first paint (now `Promise.all` after the listing renders), `select('*')` on a public page, a French date interpolated into the English meta description, `slugify` duplicated in the sitemap instead of importing `competitionPath`, raw combining marks in a regex class, `idFromParam` matching `10anything`, missing `role="list"`, an empty `<ol>` rendered during loading, a strike-through with no textual equivalent for screen readers, and a section title claiming "the season" while filtering by typology.
- **KEEP on any re-derivation:** the venue timezone pinning; cancellation inside `competitionState`; the anchor's two abstentions (back-navigation, anchor already first); one owner for the URL shape; explicit column lists on public queries.

## Verification

**Commands:**
- `npm run lint` -- expected: baseline unchanged
- `npm run dev` -- expected: `/competitions` and a detail page render against the 10 real rows

**Manual checks:**
- Browse as `anon` (private window): the unpublished comp appears in neither the ribbon nor the sitemap.
- Check the ribbon around today's date — the anchor is the one behaviour a unit test cannot cover.

## Suggested Review Order

**The temporal rules (one module owns them)**

- Pinned to the venue's timezone, not the viewer's — the competitions happen in France.
  [`competitionDates.js:59`](../../src/lib/competitionDates.js#L59)

- `live` is a whitelist of `day`, and a cancelled competition is never live.
  [`competitionDates.js:80`](../../src/lib/competitionDates.js#L80)

**The anchor (the page's whole point, and the subtlest code here)**

- Two abstentions: a back-navigation, and an anchor that is already the first row.
  [`Competitions.jsx:52`](../../src/pages/Competitions.jsx#L52)

- The flag distinguishing a first direct load from a genuine Back — `useNavigationType()` reports `POP` for both.
  [`Competitions.jsx:11`](../../src/pages/Competitions.jsx#L11)

**Fetching and failure modes**

- Explicit columns, `published` filter, explicit ceiling — truncation would drop the future.
  [`Competitions.jsx:30`](../../src/pages/Competitions.jsx#L30)

- "Not found" separated from "could not load": a 5xx must not emit `noindex` on a sitemap URL.
  [`CompetitionDetail.jsx:52`](../../src/pages/CompetitionDetail.jsx#L52)

- The listing paints before the two secondary queries, which run in parallel.
  [`CompetitionDetail.jsx:60`](../../src/pages/CompetitionDetail.jsx#L60)

**The announced void**

- An absent link says "à venir"; a past competition with no recap says so rather than hiding the section.
  [`CompetitionDetail.jsx:143`](../../src/pages/CompetitionDetail.jsx#L143)

**One owner for the URL shape**

- The sitemap imports `competitionPath` instead of re-implementing the slug.
  [`generate-sitemap.js:4`](../../scripts/generate-sitemap.js#L4)
