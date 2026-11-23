# 3. Principles, with numbers

Defaults, not laws: a pinned brand or the committed world overrides any of these except the floors in
`05-craft-floor.md`. Where sources disagree, this file picks one value.

## Typography

- **Fewest roles that make hierarchy unmistakable.** Usually one display voice and one text face; a second family needs
  a job only it can do. Combine size, weight, space and tone, not size alone.
- **Body** 16px minimum on the web (17–18px for long reading); line-height 1.5–1.7 for body, 1.0–1.2 for display.
  Light text on dark: a touch more leading and tracking, one step more weight.
- **Measure** 60–75 characters for reading; never past ~80.
- **Scale**: product UI steps of 1.125–1.2 in fixed rem, with at least one strong jump (≥1.25×) somewhere. Persuade and
  Experience surfaces earn **extreme contrast**: display at 6–12× the body size, fluid with `clamp()`. A flat ramp
  (every step under 1.25×) is the most common reason a page reads bland.
- **Tracking**: display −0.01 to −0.03em for most faces (never past −0.04em); uppercase labels +0.08 to +0.25em; body
  0. Wide-tracked uppercase only for short labels, never runs over ~40 characters.
- **Breaks**: `text-wrap: balance` on headings, `pretty` on paragraphs; hand-break headlines only between phrases, and
  check the break at every width.
- **Optical alignment**: trim leading off display type (`text-box: trim-both cap alphabetic`) so a headline's cap
  height aligns to the grid, not its line box.
- **Numerals** that line up (times, prices, scores, track numbers) use `tabular-nums`.
- **Delivery**: self-host, subset, only the weights used, `font-display: swap`, size-adjusted fallbacks so nothing
  shifts. Never fake bold or italic (`font-synthesis: none`).
- **Refuse**: display faces in labels, buttons or data; monospace as a "technical" costume; system fonts as an
  own-world display voice; the training-data default faces for display (Inter, Space Grotesk, DM Sans, Plus Jakarta,
  Fraunces, Playfair, Cormorant) unless the brief pins them.

## Layout and space

- **Frame first**: choose the page's structure (the grid, the axis, the regions) before content. Content-first layouts
  drift into a padded column of cards.
- **Proximity before containers.** Group with space and alignment; with every border removed you should still name the
  groups. Cards are the lazy container; never nest them.
- **Rhythm is contrast**: tight inside groups, generous between them, more space above a heading than below it. One
  repeated gap everywhere flattens the page.
- **A named spacing ladder** on a 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192). Persuade pages need the top of
  the ladder: sections separated by 128–192px on desktop, not a uniform 96.
- **One content line per region**: everything aligns to it; only hover fills cross it. One lead and one primary action
  per region.
- **Asymmetry earns attention**; symmetry earns calm. Decide which each section needs.
- **Pace the scroll like a studio**: vary density, scale, image and quiet inside one grammar; a dense passage earns a
  quiet one; end on a real close.
- **Responsive is a contract per region** (divide, reveal, resize, swap), not shrinking. Phones get a single column,
  44px targets, 16px inputs and no sideways scroll at 320px.
- **Squint test**: blur the page; the primary, the secondary and the groups must still read in order.

## Colour

- Strategy first (`02-direction.md` §6), then **roles, not swatches**: page, raised, ink (3 steps), line (2 steps),
  accent, focus, selection, danger.
- The strongest colour owns a region or a role; never spend the action colour on decoration.
- **Never grey text on a coloured surface**: tint secondary text from the surface's own hue. Avoid alpha text (its
  contrast depends on what's behind).
- **Dark mode is composed, not inverted**: re-derive elevation and contrast; raised surfaces get lighter in dark.
- Ramps: vary lightness, reduce chroma near white and black; OKLCH for new palettes.
- Data and state: never colour alone (add shape, label, position).

## Motion

- **Motion must mean something**: acknowledge an action, show a change of state or place, keep continuity, direct
  attention once, or embody the world. A fade-up on every section is not a thesis.
- **One authored moment** per page, orchestrated, plus small consistent feedback. Never one identical entrance per
  section.
- **Durations**: 100–150ms feedback · 150–300ms state change · 300–500ms layout and view transitions · 500–800ms one
  authored entrance. Exits faster than entrances. A brand tempo (e.g. a beat in ms) can set these; keep the bands.
- **Easing**: decelerate in (`cubic-bezier(0.2, 0, 0, 1)` or `(0.16, 1, 0.3, 1)`); no reflex bounce. Scroll-linked
  motion is linear.
- **Materials**: continuity → view transitions / shared elements; reveal → clip-path or mask; focus → bounded blur or
  shadow; energy → colour. Reach past opacity and transform when it stays smooth.
- **Hover**: the hovered element stays put and a child moves; hover is never the only way to reach something.
- **Content is visible at rest**: animation starts from a visible state, so failed scripts never hide the page.
  Gate motion behind `prefers-reduced-motion: no-preference` and `@supports`.
- **Reduced motion** means fewer and gentler, not a global 0.01ms kill: keep opacity and colour feedback, cut travel.

## Imagery and iconography

- Real, specific, decisive: one great photograph of the actual object beats five mediocre ones. Never stock, never
  AI-generated images presented as real. Author the assets the design needs; never substitute chrome (gradients,
  glass, icon tiles) where an asset belongs.
- Images get explicit dimensions or `aspect-ratio`, AVIF/WebP, lazy below the fold only.
- Icons: one real library or authored set, one stroke weight, only where a word won't do. Never emoji or Unicode
  glyphs as icons.
- Decorative geometry is `aria-hidden`; every meaningful image has alt text written for someone who can't see it.

## Copy as design material

- Controls name their action (verb + object); errors say what happened and how to recover; empty states say what will
  be here and how to start; loading names the real operation.
- As short as possible without losing meaning. Active voice. The same word for the same thing everywhere.
- Personality is rationed: one wry line per view, in the place a person would smile, never on loss, money or errors.
- Refuse: buzzwords (elevate, unlock, seamless, empower, cutting-edge, world-class), "where X meets Y", "not just X",
  slogans in threes, em-dash chains, hedging (might, could, consider), and anything the product hasn't earned
  ("award-winning", "beloved").

## Performance as design

LCP < 2.5s (aim < 1.5s), INP < 200ms, CLS < 0.1 (aim 0). Ship the least JavaScript that does the job; a static page
that reads with scripts off is the most robust design there is. Set budgets as ratchets that may only improve.
