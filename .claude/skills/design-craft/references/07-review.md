# 5 and 6. Review: a separate reviewer, a fixed verdict, a bounded fix

The builder can't review their own work: they inherit their framing and their optimism. Every non-trivial design
change gets judged by a **fresh reviewer** (a separate agent with no access to the build conversation) against the
direction contract and the screenshots.

## The evidence gate (first)

The reviewer checks the captures before judging anything. Missing, blank, half-loaded, wrong-region or mid-animation
captures → disposition **recapture**, and nothing else in that review binds. Never turn missing evidence into a pass;
mark what wasn't inspected as "not inspected".

## The reviewer's packet

Send: the original request in the person's words; the ground note and direction contract; the screenshot paths (every
width, theme and scripts on/off state captured; at 2× for anything a person will see); the paths to `05-craft-floor.md`
and `06-tells.md`; DESIGN.md / brand rules / VISION; known gaps (assets not yet supplied). The reviewer inventories the
screenshots in its own words **before** reading the contract.

## What the reviewer judges, in order

1. **Specificity verdict** (start here): authored for this product, or category-interchangeable? Run the tests in
   `06-tells.md`. Name the one thing per view only this product has, or say there isn't one.
2. **Fidelity to the direction**: for each FIRST VIEWPORT and SIGNATURE promise, an element-by-element matrix: match /
   acceptable adaptation (with its reason) / missing / contradicted / added without approval. An uncited deviation is a
   defect.
3. **Craft floor**: every hard floor, with evidence from the screenshots or source.
4. **Heuristics**: Nielsen's ten, 0–4 each (0 failing … 4 genuinely excellent; most real interfaces score 20–32 of
   40). Mark H7 (flexibility) and H10 (help) n/a on Persuade and Experience surfaces and renormalise.
5. **Personas**: walk the primary action as two or three of: the impatient expert, the confused first-timer, the
   accessibility-dependent user (keyboard, screen reader, 200% zoom), the stress tester (long text, empty, slow), the
   distracted phone user. Report specific breakages, not impressions.
6. **The ceiling**: which native devices of this world went unused (scale, the grid's own geometry, colour fields,
   motion, real content)? This is how "correct but bland" gets caught.

## Severity

P0 blocks the task (fix now) · P1 significant difficulty or a WCAG AA failure (before release) · P2 annoyance with a
workaround · P3 polish. Tiebreak: would someone contact support about it? Then it's at least P1.

## The return (fixed shape)

- **Disposition**, exactly one word: **ship** (no material fixes) · **fix** (a list of material fixes) · **rebuild**
  (fidelity failed wholesale: re-derive the named regions) · **recapture** (the evidence failed, not the build).
- **Specificity verdict** and the per-view "only this product" list.
- **Material fixes**: at most 8, ordered fidelity before craft, each with what / why / the concrete change.
- **Keep**: what is working and must not be diluted by the fixes.
- **Not inspected**: anything the evidence couldn't show.

The disposition is derived from the findings, not felt; the builder may not soften it.

## The fix round

Apply all material fixes in one batch, recapture the same views, and send them back to the same reviewer for a
**verdict pass** that scores each fix resolved / partial / unresolved and names at most three regressions. The
builder's narration of what was fixed is not evidence. **Two rounds maximum**; stop the moment a round resolves
nothing, and put the open findings to the person to decide.

## Critique (without a build)

When asked to critique existing work: overall impression (the single biggest opportunity), what's working (2–3),
priority issues (3–5, each P-rated with a fix and the refine verb that applies), persona red flags, and two to four
pointed questions with concrete options. Then recommend a command order ending in `polish`. Direct and specific; cut
"consider exploring".
