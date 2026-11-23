# Refine verbs

Every verb follows the same template: name the mode → judge first, then scan (so a checker can't anchor taste) → write
the thesis → apply inside the existing world → verify with rendered evidence → hand off to `polish`. Scope is
sovereign: touch only the target; add no colour, face, radius or shadow the system lacks without asking.

## bolder: amplify what the system already owns
- A flat section usually opts out of the system's own strongest moves: the display type at full strength, the
  structural device, the signature motif, density and pacing. Raise it to what its neighbours already do.
- Reject "more effects" first. **Commit, then clarify**: one decisive move made completely, everything around it
  quieter. If every element got louder, the section got flatter. Busy is louder, not bolder.
- Give it its own rhythm: a peak in scale or density, not more of the same.
- Skeleton test before shipping. It should look more like the same brand, not less.

## quieter: lower intensity, keep the point of view
- Diagnose the source: saturation, contrast extremes, weight, motion, complexity, uniform scale.
- Moves: saturation down to 70–85%; fewer colours; accent ≈ 10%; weights 900→600, 700→500; hierarchy by space and size
  over colour; thinner or no borders; travel 10–20px.
- Guard: generic quiet (grey text on white, one sans at one weight, a grid of cards) is a failure too.

## distill: remove obstacles, not features
- One primary goal per view; the 20% that does 80% of the work. Cut repetition, decorative borders and shadows,
  containers the layout doesn't need, steps the task doesn't need.
- Mystery is not minimalism: keep hierarchy, labels and access to what was removed (say where it went).

## delight: one considered moment
- A one-sentence thesis for the feeling; the smallest system that delivers it; derived from the product's mechanism and
  world, never a stock trick. Intensity matches frequency and stakes (milestones expand; routine actions just feel
  certain). Never delays a task, fakes progress, jokes about loss, or plays sound unasked. Neighbour test.

## overdrive: one extraordinary technique
- Propose 2–3 directions with their cost (support, performance, complexity) and get a pick first.
- Toolkit (progressively enhanced, static fallback first): scroll-driven animations (`animation-timeline`), View
  Transitions (cross-document for static sites), `@property` animated custom properties, `@starting-style`,
  clip-path/mask reveals, anchor positioning, container queries, canvas or WebGL lazily initialised near the viewport.
- One extraordinary moment per page; never jank on a mid-range phone; removal test.

## typeset · layout · colorize · animate
State the thesis in the domain's terms before editing, then apply `04-principles.md`:
- **typeset**: roles, contrast between them, measure, the one strong scale jump, tracking, breaks, optical alignment.
- **layout**: the primary path, grouping, lead vs support, density, the frame and its axis, adaptation per region.
- **colorize**: emotional temperature, the dominant relationship, contrast range, dosage; strategy before hues.
- **animate**: the focal moment, continuity, feedback, the budget; one material idea.

## clarify · harden · adapt
- **clarify**: per state, the one fact needed now, the next action, the tone for the moment; the same words for the
  same things; errors with recovery; whole translatable messages.
- **harden**: every state; extreme inputs (empty, one character, 100+ characters, emoji, RTL, CJK, millions);
  overflow handling (`min-width: 0`, wrapping, clamping); preserved input on error; 30–40% translation headroom.
- **adapt**: adaptation is not scaling. Map the context (input, screen, connection, glance vs focus); mobile-first with
  `min-width`; detect `pointer` and `hover`, never size alone; safe areas; art-directed images.

## polish: always last
Work through the last review's open P0/P1 items as the backlog, then the craft floor's verify list, then the browser
surfaces. Polish is refinement, never a concealed redesign.
