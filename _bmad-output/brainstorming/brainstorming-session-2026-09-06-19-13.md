---
stepsCompleted: [1, 2, 3, 4]
session_active: false
workflow_completed: true
inputDocuments: []
session_topic: 'Competitions feature: a public timeline of upcoming & past cable wakeboard competitions'
session_goals: 'Explore the design before coding: how an always-incomplete agenda behaves, what "live" means, how the past stays useful, and how visitor submissions flow in'
selected_approach: 'ai-recommended'
techniques_used: ['Question Storming', 'Persona Journey', 'Morphological Analysis', 'Chaos Engineering']
ideas_generated: 68
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Alexis
**Date:** 2026-09-06


## Session Overview

**Topic:** A public **Competitions** page for WakeRef — a scrollable time-based feed of cable wakeboard competitions, upcoming and past. Unrelated to the existing `/competition` judging surface.

**Goals:** Diverge on the design before any code. Central questions: how does an agenda behave when its data is *always partially missing*? What does "live" mean concretely? What makes the past worth keeping? How does a visitor submission become a listing?

### Raw intent (Alexis, 2026-09-06)

Per-competition data wanted: name, dates, location, wakepark, link for more info, Instagram of the organiser / the competition / the wakepark, link to the live stream. For past editions: one or more video links. Typology: federal (FFSNW-affiliated), independent, or part of a circuit (e.g. Pro Tour).

Shape imagined: a "Compétitions" page with a feed you scroll through time; probably a detail page per competition; a **live** sticker when the current date falls inside a competition's date range.

Visitors can submit a missing competition easily (name, date, link if available) — organisers included, for self-referencing.

**Accepted realities:** info is often unavailable at first; competitions get cancelled.

### Context Guidance

Filtered against the WakeRef product thesis and its 6 invariants. Two were raised and resolved up front:

- **Invariant 2 — survive abandonment.** Acknowledged and accepted: this is the first WakeRef feature that *rots* if unfed. Alexis's stance: it serves now, and dying is fine. Mitigations: (a) submissions are open so organisers feed it themselves, (b) a stale listing with sparse info is still not "lost", (c) an **admin feature flag** to cut public access to the whole feature at will.
- **Invariant 3 — anti-ego / anti-perf.** No tension: the feature is purely informational — pointers outward (event site, live stream, videos), never standings, results or podiums.

### Session Setup

**Approach selected:** [2] AI-Recommended Techniques.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis context:** an agenda feature whose shape Alexis has already half-designed (feed, detail page, live sticker) — so the techniques are chosen to *destabilise* that draft rather than confirm it. Note: the June 2026 session already burned Question Storming, What If Scenarios, Role Playing and Cross-Pollination; three of the four below are new.

**Recommended sequence:**

- **Phase 1 — Question Storming** (deep, 15-20 min): only questions, no answers. Surfaces everything the brief takes for granted before the drawn solution locks in.
- **Phase 2 — Persona Journey** (theatrical, 20-25 min): embody archetypes and follow their trajectory *through time*, not just their point of view — the Thursday-night rider, the website-less indie organiser, the Sunday-2pm live stumbler, the 2024-final video hunter, Alexis facing six dubious submissions. Distinct from June's Role Playing: journey, not stance.
- **Phase 3 — Morphological Analysis** (deep, 25-30 min): the core. Listing state = temporality × completeness × status × typology × source. Walk the matrix to find the cells never imagined (a *past cancelled* comp; an *in-progress* comp with only a name; a submission for an event three years old).
- **Phase 4 (optional) — Chaos Engineering** (wild, 15-20 min): break it on purpose. Since degradation is *accepted*, decide in advance what it looks like.

**Rationale:** cadrer → incarner → systématiser → casser. Total 60-75 min (phases 1-3), ~95 min with phase 4.

## Technique Execution Results

### Phase 1 — Question Storming (19 questions, partial: axis 4 not answered)

**Rule applied:** questions only, zero answers.

**Axis 1 — the object itself** (facilitator seed: does an internal wakepark contest count? a party with a contest module? do wakeskate/handiwake have their own events?)

Alexis's questions:
1. Does a cancelled comp stay in the feed?
2. How far back in time can we go?
3. Can comps be added 40 years ahead?
4. What happens if a user adds lots of false information?
5. How many comps can run at the same time?
6. Is it limited to competitions in France?
7. How does moderation work?

> **Facilitation note:** every one of these is an *administrator's* question — bounds, volume, fake content, moderation. Alexis looked at his feature from the back office. He also *dodged* the seeded axis: asked about **perimeter** (how far, which country), never about **nature** (what counts as a competition). Left open deliberately.

**Axis 2 — the visitor** (domain pivot)

8. Does the visitor already know the comp exists?
9. Is the visitor after a specific comp, or checking whether "something is happening"?
10. What info does the visitor come looking for about comps?
11. Is there one particular piece of info they want?
12. Are users more interested in past or future comps?
13. Do organisers have an interest in being listed on the site?
14. Who is this feature for — competitors, competitors' families wanting the live stream, or enthusiasts wanting to see what's on now/soon?

> **Breakthrough (Q14):** three publics that share almost nothing — the **competitor** (who attends), the **family** (who watches the stream), the **enthusiast** (who follows the scene). Three needs, three time horizons, potentially three different surfaces. Carried into Phase 2.

**Axis 3 — time as physical matter** (domain pivot; seeded on the May–September French cable season, i.e. the page is empty half the year)

15. Should it be browsable season by season?
16. Will a user want to filter by country, year, place, typology…?
17. Is the main content always the in-progress + very-soon comps?
18. How often does this feature actually get fed?
19. How do we surface past competitions?

> **Facilitation note:** Q16 is a feature wearing a question's costume — the classic sign the interrogative mode is running out. Called out, then moved on.

**Axis 4 — the right to exist** (seeded, not answered — Alexis chose to move to Phase 2)

Left on the table for later: what does WakeRef add that a well-followed Instagram account doesn't? Why would an organiser submit here as well as post their poster? How many cable comps per year in France — does the volume justify a navigation tool? Is the real value the *agenda* or the **archive** (videos nobody can find two years later)? Who loses something if this page doesn't exist?

### Phase 2 — Persona Journey (in progress)

Rule: embody the persona, narrate in the present tense, no product vocabulary. Follow the trajectory *before* and *after* WakeRef, not just the on-site moment.

#### Persona 1 — Léo, 19, intermediate cable rider, Lyon area

Seeded as a *discovery* journey (Thursday night, free weekend, looking for "something to do"). Alexis played him as a **verification** journey instead — Léo already saw the comp on Instagram and comes to confirm. Total journey: ~15 seconds, exits to Instagram.

**[Journey #20] The bounce page** — WakeRef is the junction, not the destination. Success is measured by *how fast Léo gets out toward the right link*, not by time on page. Inverts the implicit metric of a scrollable timeline.

**[Journey #21] The "anything this weekend?" yes/no** — Léo's real question is binary and was answered before he read anything ("I see straight away there's 1 event this weekend"). That's a *state*, not a list. Suggests the top of the page is an **answer** — which can legitimately be "nothing this weekend".

**[Data #22] The entry list** — Léo wants to "see who's signed up". Social content, absent from the brief, and probably the only thing that brings someone back *repeatedly before* the event.

Sunday 2pm, comp running. Léo goes to YouTube first, Instagram second, WakeRef only when both fail. Key quote: **"I don't specifically need WakeRef but as a backup it's handy."**

**[Positioning #23] The safety net** — WakeRef is never the first intent. It catches what Instagram does badly: direct, scroll-free access to a precise URL. It is a *directory of unfindable links*, not a discovery agenda.

**[Data #24] Live scoring ≠ live video** — Alexis spontaneously separates the video stream from the live results page (Liveheats-style). Two links, two natures, two usage moments. Absent from the brief, and the single hardest link to find alone.

**[Positioning #25] The link that dies on Instagram** — the common pattern: the info exists but only in *ephemeral or non-indexable* form (a 24h story, a link in bio, a YouTube channel whose name nobody remembers). Gives a sharp inclusion criterion: store what is **hard to find**, not what is important. The poster is beautiful and easy to find; the live-scoring URL is ugly and unfindable.

**Facilitator provocation:** a backup that fails once is not a half-backup, it's not a backup at all — one disappointment at 2:05pm kills the reflex. Alexis refused the drama and produced three mechanisms instead:

**[Content #26] Lateral bounce into the archive** — a missing link doesn't eject Léo, it slides him into the past ("maybe it'll make me want to watch another comp's recap"). Inverts the brief's hierarchy: the future is the *attractive* content, the past is the *reliable* one — always complete, never cancelled.

**[States #27] "Coming soon" as information in its own right** — a declared absence (`live link: coming`) creates an **appointment** ("I'll come back later"); a silent absence creates doubt ("dead, or just not filled in?"). Turns the feature's main constraint (info is always missing) into an engagement mechanic. Most structural idea so far.

**[Emotion #28] Frustration as an engine** — not being able to attend, not sharing the atmosphere, makes you organise for the next one. The person watching a comp they're not at is statistically the most receptive to "the next one is in 3 weeks at Sévrier".

#### Persona 2 — Karim, 34, volunteer organiser, small independent comp in Burgundy, no website

**[Ecosystem #29] The Instagram arm** — Karim knows the feature because he "saw WakeRef's posts go by". The acquisition channel is WakeRef's own Instagram, not the page. Real loop: I list → I post → the organiser sees me post → he submits the next one. The most effective part of the feature happens **off-product** — never mentioned in the brief.

**[Contract #30] Don't vampirise** — "the site really redirects to my content and doesn't vampirise me". Karim trades his event for referred traffic, on condition WakeRef stays an **arrow, not a reservoir**. Sharp design rule for dozens of later micro-decisions: an embedded stream is already capture; a copied entry list maybe too.

**[Quality #31] Care as the price of entry** — "the content is quality, nice, well presented". Karim joins a place whose appearance *flatters his event*. A shabby listing devalues him and he won't come. Visual quality is an acquisition lever aimed at organisers, not a comfort for readers.

**[Bootstrap #32] Proof by volume** — "I see there are lots of comps listed, so why not mine". Nobody signs the first page of an empty guestbook.

**Facilitator provocation:** the brief treats submissions as the *engine* that removes the maintenance burden; Karim says submissions are only a *late accelerator*. The startup engine is Alexis, alone, hand-entering a full season — probably two — before anyone contributes.

**[Contribution #33] The holed listing that begs to be filled** — the real trigger isn't the "add a missing competition" form, it's **seeing your own comp already there, badly filled in**. Exact inverse of the brief: the powerful flow is *"complete the one that's there"*, not *"submit the one that's absent"*. The first needs intent and typing effort; the second exploits a reflex — fixing something about yourself that's done badly.

**[Contribution #34] Zero cost beats strong benefit** — "it costs me nothing to push the info". Karim's motivation is weak and that's fine, provided the effort is weaker still. Condemns any ten-field form: over ~30 seconds, his marginal motivation no longer covers the spend.

**[Bootstrap #35] Start with the past** — Alexis would spontaneously seed season 2026 "even though it's nearly over, that's fine". The initial base is the *archive of the current season*: easier (data is settled, nothing moves, nothing can be cancelled) and it produces exactly the density Karim needs to trust the list. The past is the feature's **starting capital**.

#### Persona 3 — Sylvie, 52, mother of a 16-year-old rider at her first federal comp, no wake culture, arrives cold on a listing via a WhatsApp link

**[States #36] Three states per link, not two** — Sylvie doesn't just want the stream link, she wants to **know there won't be one**. Every field has three states: *present* · *announced but not yet available* · **confirmed non-existent**. For an insider an empty field means "I'll look elsewhere"; for an outsider it means anxiety. "No broadcast" carries as much value as a URL and costs nothing to produce.

**[Data #37] Running order / start list** — the #1 family datum (when does my daughter ride). Third missing field after live scoring and entry list. Often only exists on the morning itself, in a story or on a wall by the water: ultra-perishable, ultra-wanted, unfindable — the exact profile of #25.

**[Public #38] Arrival without context** — Sylvie has never seen the timeline and may never see it. The **listing must stand alone**, not be the "detail" child of a "list" page. The timeline is one path in, not *the* path.

#### Typology defended (Alexis, out of persona)

**[Navigation #39] A circuit is an entity, not an attribute** — a circuit groups several comps across several dates. As a badge it's a dead word; as a clickable object it becomes a second axis of travel, perpendicular to time ("these 5 events are one story spread across the season"). The only mechanism so far that makes someone *stay* rather than bounce out.

**[Semantics #40] "Federal" means eligibility, not administration** — for the rider considering entry it signals licence required? age categories? level? selection? For Sylvie and spectator-Léo it means nothing. The typology serves exactly **one** of the four publics — so it belongs in the "I want to enter" context, not as a universal badge on every card.

**[Public #41] The fourth public — the one who wants to enter** — Léo spectates, Karim organises, Sylvie accompanies. The rider *looking for a comp to enter* is a distinct public, the only one whose needs genuinely justify a timeline and filters, and the only one with a **deadline** (entries close).

#### Persona 4 — Manon, 24, experienced rider, Bordeaux. Licensed, limited petrol budget, every other weekend free. It is 3 March; she is booking her year's leave.

> **Breakthrough — Alexis answered the dodged Axis 4 while in character.** The competitor is **not Instagram, it's the federation's website**: "the navigation and search are truly vile, all the comps mixed together, from every country, every discipline — boat, slalom — it's not cable-focused like WakeRef."

**[Positioning #42] The filter, not the database** — the value isn't holding the info (the federation already does), it's having **removed everything else**: a cable calendar, in France, no boat, no slalom, none of the 40 irrelevant countries. Reframes the feature as an act of **subtraction** — the value added is what is *not* displayed.

**[Model #43] A competition is an edition, not an event** — "every year there's the Coupe de la Ligue and the Championnat de France". These recur. The 2026 edition is an instance of a series with a history and a future. Consequences: the 2025 and 2026 listings aren't two independent feed entries but two editions of one object; Manon waiting for 2026 can watch the 2025 videos on the same page; **an empty future edition inherits context from the past one** — likely venue, atmosphere, last year's video.

**[Rhythm #44] The recurring visitor** — Manon is the only public who returns *regularly with no external trigger*. Léo returns on need, Sylvie never returns, Karim returns once a year. She alone justifies a chronological feed. She also makes geography central — "geographically accessible" on a petrol budget is a *distance from home*, not a region filter.

**[States #45] The empty shell as an appointment** — "if I see the comps are already created but the info is marked as coming, I'll come back later". Creating listings **early and empty** is therefore productive, not an admission of weakness. Third independent confirmation of #27, this time with a concrete practice: the **season skeleton** — in February, create the 15 recurring comps with zero info, all marked "coming". The page is full, honest, and makes an appointment.

**Phase 2 close:** 4 personas embodied. Alexis-as-admin deliberately held back for Phase 4 (Chaos Engineering).

### Phase 3 — Morphological Analysis

Five candidate axes were put up (temporality, completeness, status, source, nature) — **three died**. Alexis was explicitly asked to *cut* rather than add, given the additive bias observed twice in Phase 1 and 2.

**[Architecture #46] Only two real axes** — temporality and status aren't fields, they're **computed from the date**. What remains: the **date** (with variable precision) and the **affiliation**. Everything else is content, displayed if present. Kills the whole state machine and its maintenance: a stored status must be updated, a date must not. Consistent with "curate ≠ maintain".

**[Model #47] The fuzzy date** — a comp may carry only a **year or a season**, no day. "There will be a French championship in 2027" is valid, publishable information. Date *precision* carries the uncertainty; no separate status needed.

**[Model #48] No automatic recurrence** — Alexis refuses to let a recurring event project itself thirty years ahead, even when it factually will happen. Each edition is created by hand or not at all. Rules out #43's strong form: an uncreated edition does not exist; silence is not a promise.

**[Content #49] The pre-comp teaser** — videos aren't the past's property: teasers and promo edits are published *before* the event. Breaks the brief's structuring dichotomy (future = practical info, past = video). Video is **transverse to time**.

**[Moderation #50] Source is never displayed** — no "verified by the organiser" badge; Alexis refuses the certification treadmill of chasing organisers for confirmation. Structural consequence: **if nothing on screen distinguishes a submission from an admin entry, then everything displayed is deemed validated by him.** Moderation is therefore necessarily upstream and invisible — the existing `/admin/submissions` queue pattern. There is no "publish now, fix later" variant.

**[Navigation #51] The circuit as a plain link** — an outbound link to the circuit's site is enough; no need to make it a WakeRef object. Refuses #39's strong form, consistent with #30 (don't vampirise): the circuit belongs to its organiser.

#### Matrix walk 1 — absence (no date × chronological feed; cancelled × deletion)

**[Form #52] The ribbon anchored on now** — not a calendar: a vertical feed **anchored on the present**, descending into the future, ascending into the past, landing the visitor on the running or nearest-upcoming comp. Entry point is neither top nor bottom but **today**. Answers Léo's "anything this weekend?" (#21) with no action from him, and gives the bidirectional scroll its meaning: down = I plan, up = I re-watch.

**[Sort #53] The fog zone at the tail** — dated comps sort normally; season-only comps are pushed **after them, in indifferent order**. Date precision becomes a ranking criterion. The feed isn't a homogeneous timeline, it has a **depth of field** — sharp in front, blurred at the back. That blurred tail is exactly where the season skeleton (#45) lives: full, honest, promising no date.

**[Status #54] One flag, and it's editorial** — `cancelled`, set by an admin button, rendered greyed or struck through. The status axis was killed wholesale and reintroduced only where it carries information the date cannot deduce. **A status only deserves to exist if it is underivable.**

**[Rule #55] Delete only what contains nothing** — a cancelled comp reduced to a name gets deleted; one carrying content is kept, struck through. Deletion is never automatic — always an admin choice. General rule beyond cancellation: **destroy only what loses nothing by being destroyed.** Testable: is there a link, a video, anything someone might search for?

#### Matrix walk 2 — past × incompleteness (the ungrateful-enrichment corner)

**[Scope #56] A rich man's problem** — a massive archive implies the site lived five more years. Alexis refuses to design today for a problem that only arises if everything goes well. A design decision in itself, not a deferral: no pagination, no archiving, no purge. **The feed can stay dumb while it is short.**

**[Exit #57] The fallback year page** — if volume ever bites, the exit is known and simple: one page per past season, a flat list, no feed. Knowing the exit removes the need to guard against the risk now.

**[Clarity #58] The enricher is Alexis — and that's owned** — "for now it's me. It breaks the site-survives-alone angle, but I don't have the users to think about it otherwise." The strongest position of the session: designing contribution mechanics for a community you don't have builds infrastructure for imaginary traffic. Karim (#33) is a **hypothesis to test**, not a foundation. The feature must work with exactly one contributor.

**[Past #59] "It existed" is enough** — an empty past listing still says a comp happened, that day, in that place. Not waste — a trace. Removes all pressure on enrichment: a thin listing is an acceptable final state, not a debt.

#### Matrix walk 3 — discipline (the axis neither party had touched)

**[Invariant #60] Silence on discipline is a position** — discipline is not modelled at all. The implicit default is *"all disciplines are represented"*. When that's false it's the organiser's doing, not the reference's, and not WakeRef's job to document. The finest application of invariant 5 the session produced: printing "wakeboard only" on a card would **record the exclusion and propagate it**. Displaying nothing sets inclusion as the norm and leaves responsibility where it belongs.

**[Model #61] Model poverty as protection** — "we only give name, date and links, so a missing discipline won't be very visible". Thinness isn't only economy: it **limits what the site can assert**. Test for any future field: each one is a claim WakeRef makes about an event it does not run. Fewer fields = fewer chances to be wrong, to offend, or to freeze a reality that has moved. #30 extended from content to data.

### Phase 4 — Chaos Engineering

Four scenarios fired; three were dismissed by Alexis in a line or two each — the correct diagnosis being that **the feature is robust because it is poor**. There is almost nothing to break.

**Scenario 1 — moderation lands after the comp has happened.** Karim submits on Tuesday for Saturday; Alexis opens the queue twelve days later. Dated content has an expiry; a solo moderation queue has no guaranteed rhythm.

**[Best effort #62] Content has two lives** — the comp gets added whenever, and if it's past, so be it: it becomes an archive listing. A submission that misses the future feeds the past. This is what makes the queue non-urgent — nothing is ever lost, only **demoted from one tense to the other**. The "best effort" invariant finds its concrete mechanic, and its implicit promise: *we reference, we don't broadcast live.*

**Scenario 2 — the congested weekend** (three comps at once, one of them a three-day federal event "live" at 3am Saturday). Dismissed:

**[Simplicity #63] Day granularity, full stop** — "live" = *today falls inside the date range*. Nothing finer. "People don't come to see whether it ends in five minutes." Eliminates times, sessions, slots, time zones — and the need for data nobody would ever enter. The sticker is a **day marker**, not a real-time feed.

**[Simplicity #64] Three comps is three comps** — no arbitration, no grouping, no clever anchor choice. Start-date order, then indifferent. The real volume of the French cable scene makes the problem non-existent. Quote worth keeping as a design rule: **"Léo is not in a recommendation engine."** The feed does not editorialise, it lines things up.

**Scenario 3 — publishing a start list containing minors' names (GDPR).** Facilitator over-extrapolated: Alexis had said the *visitor looks for* entry lists and running orders, never that WakeRef would store them. Scenario void — but it produced the definitive field list:

**[Model #65] The full listing, at maximum** — name · date · place (a wakepark name) · entry link · organiser's Instagram · wakepark account or site · one or more video links (Instagram/YouTube) · optionally a logo. That is the **ceiling**, not the floor. The entry link wasn't in the opening brief — it arrived with Manon (#41), the only public with a deadline. Everything else is a link *elsewhere*: the listing holds no data produced by WakeRef.

**[Posture #66] "That's not the pretension"** — "I'm not building a game-changer feature that will change people's lives." People may pass through WakeRef to find entry lists — via the organiser's link — but the site doesn't claim to serve them. This is the guard rail for the whole feature: every idea in this session that later wants to grow (aggregating start lists, tracking circuits, notifying, recommending) is cut by this sentence. **Owned modesty is what keeps the feature sustainable by one person.**

**Scenario 4 — form spam, dead links at three years, four months of absence.** All dismissed:

**[Reuse #67] The submission pattern already exists** — same mechanic as "suggest a video" and "contact me": an alert on submission, an admin queue, nothing new. The feature adds **no infrastructure brick** — it reuses the submission queue, the alert pattern, the admin layout, the video system. Which is why a feature that generated 87 elements stays small to build.

**[Principle #68] Nobody's life depends on it** — four months away breaks nothing. No service commitment, no on-call, no freshness obligation. #66 taken through to operations: it licenses *not* building the things one usually builds to hold a availability promise — link monitoring, reminders, staleness alerts, scheduled jobs. **Non-criticality is an architecture decision**, and it removes more work than any optimisation.

## Idea Organization and Prioritization

### The feature that came out is not the one that came in

| | Opening brief | After the session |
|---|---|---|
| Shape | a scrollable timeline | a ribbon anchored on *today*, whose listing is the autonomous unit |
| Focus | the future; the past as a bonus | the past is the capital, the future is the draw |
| Engine | submissions feed it | Alexis feeds it; submissions are a hypothesis |
| Competitor | *(never posed)* | the federation's website, not Instagram |
| Role | an agenda | a directory of unfindable links, used as a second recourse |
| Fields | ~12 imagined | 2 real axes + a link list, treated as a ceiling |

### Themes

**1 · Positioning — a junction, not a destination** — #20, #23, #25, #30, #42, #61, #66, #68. The value is not in what the site holds but in what it removes and where it points.

**2 · Declared absence — the core mechanic** — #27, #36, #45, #47, #53, #54, #55, #59, #62. The #1 constraint (info is always missing) became the feature's engine: announced emptiness brings people back, silent emptiness sends them away.

**3 · Shape — the ribbon anchored on now** — #21, #38, #52, #53, #63, #64. A shape that does not editorialise. *"Léo is not in a recommendation engine."*

**4 · The reversal of the past** — #26, #35, #43, #49, #56, #57. The future is fragile and attractive; the past is solid and credibility-building. The bootstrap lives there.

**5 · Contribution — hypothesis, not foundation** — #29, #31, #32, #33, #34, #50, #58, #67. Most counter-intuitive finding: the strong flow is not "add a missing comp" but "fix mine, badly filled in".

**6 · The model** — #46, #48, #51, #60, #65. Five axes in, two out. Each field is an assertion about an event WakeRef does not run.

**7 · The publics** — #22, #24, #28, #37, #41, #44. Four disjoint publics: Léo verifies · Karim wants visibility · Sylvie arrives with no context · Manon plans.

### Prioritisation (Alexis's calls)

**Breakthroughs kept as pillars:**
- **#27 + #45 — declared absence + the season skeleton.** Confirmed independently by three personas. Retained in full.
- **#35 — start with the past.** The 2026 archive is the bootstrap capital.
- **#42 — the filter, not the database.** Reformulated by Alexis as *"my content is curated"* — invariant 6 applied to a calendar.

**Modified:**
- **#33 — the holed listing.** Toned down: no dedicated completion form. The **existing contact form** absorbs info additions. The holed listing stays a call to action, but through the channel that already exists.

**Rejected:**
- **#23 — the safety net.** The usage observation holds (people arrive as a second recourse) but it does *not* drive field selection. The field list of #65 is the reference.

### Open points — all closed by Alexis

1. **Link between editions** → only for **tours**. On a listing, related content is suggested by **typology and year**, not by a named recurring series.
2. **The Instagram arm (#29)** → out of scope.
3. **Geography** → the wakepark name is enough (the audience knows the parks). No distance, no region filter. Possibly a map later.
4. **Live scoring (#24)** → kept, as a link field alongside entry, info, live video.
5. **Admin feature flag** → dropped.
6. **Entry point** → menu + home, like the other sub-sections.
7. **Submission** → a dedicated lightweight form (name, date, link) feeding the `/admin` queue, exactly like video submissions. The contact form handles *completing* an existing listing.

### Action plan

**Lot 1 — Model & admin** (no visible surface)
`competitions` table: `name` · `date_start` / `date_end` · `date_precision` (day | season | year) · `wakepark` · `affiliation` (federal | independent) · `tour` (name + link) · `cancelled` (bool) · links (info, entry, live video, live scoring, organiser Instagram, wakepark) · `logo` · videos (n, reusing the `videos` pattern) · `published`. Admin CRUD plus a "cancel" button. **No status, no source, no discipline.**

**Lot 2 — The season skeleton** (bootstrap, before any public UI)
Hand-entry of the past 2026 season — the credibility capital (#35) — then listings for **actually announced** upcoming comps, even with no details, carrying a fuzzy date (#47) and "coming" fields (#27). **No automatic recurrence and no series notion in the model**: the fact that a comp returns yearly is neither stored nor a reason to create a listing. Longest lot in human time, shortest in code.

**Lot 3 — The public surface**
The ribbon anchored on today (#52), cards carrying declared states (#27, #36), the fog zone at the tail (#53), the autonomous listing (#38), the day-granular live sticker (#63), menu + home entry, the lightweight submission form, and the contact link for completing a listing.

## Session Summary and Insights

**Key achievements**
- 87 elements: 19 questions + 68 developed ideas, across 4 techniques, ~2h.
- A data model that halved: five candidate axes reduced to two real ones (date with variable precision, affiliation) plus one editorial flag (cancelled).
- The feature's main constraint — permanently incomplete data — converted from a liability into its engagement mechanic.
- Three of four Chaos Engineering scenarios dismissed as non-problems, correctly: the feature is robust because it is poor.

**Breakthrough moments**
- **Léo played as verification, not discovery** — Alexis broke the facilitator's staging on the first persona, and the 15-second bounce journey reframed the whole page.
- **Answering the dodged Axis 4 while in character** — playing Manon, Alexis found the feature's reason to exist (the federation's site is unusable *because* it mixes everything) without noticing he was answering the question he had avoided in Phase 1.
- **"That's not the pretension"** — the guard rail that cuts every future growth of this feature.
- **Silence on discipline (#60)** — the session's finest application of invariant 5: displaying "wakeboard only" would record an exclusion and propagate it.

**Facilitation notes**
- **Consistent additive bias**: Alexis dodged every question framed as removal (what counts / what doesn't; what means nothing to Sylvie) and answered by adding. Named twice out loud. The one moment he was explicitly asked to cut — Phase 3's axes — he cut three of five in a single pass. *Ask him what to remove, in those words.*
- **Converges fast and well.** From the second half of Phase 3 he switched to decision mode, dismissing scenarios in one line each and correcting the facilitator twice (the extrapolated start list, the "recurring" skeleton). Both corrections were right.
- The common thread of all five breakthroughs: **every source of value comes from a removal or an owned absence** — removing other disciplines, accepting empty fields, publishing empty shells, not claiming to serve everyone. The exact inverse of the reflex that produced the opening brief.
