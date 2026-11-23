# 3. The craft floor

Read this immediately before any UI edit, including small ones. The floor holds the mechanics; it never picks the
direction. With every check green, spend the page on the committed world.

## Hard floors (no brief overrides these)

- **Contrast**: body and placeholder text ≥ 4.5:1; large text (≥ 24px, or ≥ 19px bold) ≥ 3:1; control edges, icons
  and focus rings ≥ 3:1. Check every state (hover, disabled, selected), both themes, text on images.
- **Focus**: visible on every interactive element, ≥ 2px, offset from the element, keyboard-only (`:focus-visible`).
  Logical tab order matches visual order at every breakpoint.
- **Targets**: ≥ 44×44px by default (WCAG AA floor is 24×24 with spacing). Form fields 16px on touch screens.
- **Reduced motion and no scripts**: every page is complete and readable with scripts off and motion reduced; content
  is visible at rest.
- **Semantics**: landmarks, one `h1`, no skipped heading levels, labelled controls (placeholders are examples, not
  labels), alt text, `lang`, a skip link.
- **No overflow or occlusion** at 320px and up; long words, long names and 30–40% longer translations fit.
- **Honest content**: no invented claims, figures, quotes or progress; demonstration data is labelled synthetic.
- **States**: default, hover, focus, active, disabled, loading, error, empty, success, for every interactive part.

## Verify on the render (one batched look per round)

- **Spacing**: tight groups, generous separation, more space above headings than below. Read computed values.
- **Type**: body measure 60–75ch; display ≤ 12× body only where the mode earns it; balanced headings; obvious scale
  and weight steps; real copy at every breakpoint.
- **Depth**: one elevation per object (border or shadow, not both); shadows have offset and soft blur; no halos.
- **Motion**: one authored moment; decelerating ease from a visible default; nothing loops while idle.
- **Browser surfaces**: selection, caret, scrollbars (colour only, never behaviour), focus rings, underline offset and
  thickness, tabular numerals, `accent-color` on form controls, theme-color meta. The parts you didn't draw still carry
  the design; this is the cheapest signal that a page was built rather than assembled.
- **Copy**: the product's own language; controls name their action; errors name the recovery.
- **Coverage**: every requirement in the brief is present and findable within seconds.

## Refuse (category defaults: a brief may earn any of these back, except where marked)

Page scaffolds:
- Same-size cards of icon + heading + text as page structure. Nested cards (always wrong).
- The hero-metric template: big number, small label, supporting stats, accent.
- **A kicker or eyebrow label above a heading** (treat as a ban: delete it and let the heading carry itself; labels are
  for data such as status, date, price, never ornament).
- Section numbers (01 / 02 / 03) unless the sequence is information the reader needs.
- The default hero: centred headline, grey subline, two buttons, a blob or gradient behind. A split hero over a row of
  cards.
- A modal for a task that needs neither interruption nor protected focus.

Surfaces:
- Gradient text; decorative glass and blur; coloured glows and radial halos; a bar down one side of a rounded box.
- Hard offset shadows (`4px 4px 0`) outside a genuinely neobrutalist world; a hairline border plus a wide soft shadow.
- Sparklines, progress rings and soft rounded rectangles standing in for content.
- Stripes, grid backgrounds and noise/grain overlays without a real canvas, map or material under them.
- SVG "illustrations" assembled from primitives (clip art); geometric masks faking an organic edge.
- Monospace as costume; system fonts as display voice; emoji or Unicode as icons.
- Light or dark chosen by category instead of by use scene.
- In-between radii: pick a vocabulary (e.g. square + pill, or one radius) and forbid the middle.

Motion:
- Fade-up on every section; bounce/elastic by reflex; pulsing dots on non-live data; marquees; fake typing cursors;
  scroll-jacking; cursor followers.

Copy:
- See `04-principles.md` → Copy. Plus repeated text in one container, and headings that restate the intro.
