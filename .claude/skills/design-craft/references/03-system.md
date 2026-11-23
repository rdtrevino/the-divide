# 2 and 7. The system: tokens, named rules, DESIGN.md

## Token architecture (three layers, one source)

1. **Primitives**: the raw ramps (colour steps, the type scale, the spacing ladder, radii, durations, easings). Never
   used directly in components.
2. **Semantic tokens**: roles (`page`, `raised`, `ink`, `ink-2`, `line`, `accent`, `focus`, `danger`), each one value
   per theme (`light-dark()` or a dark-mode override block). Components use only these names.
3. **Component tokens**: only where a component needs its own knob (a button's height), pointing at semantic tokens.

Rules:
- **One canonical file** declares every token (e.g. `globals.css` or `tokens.css`). Docs are generated from it or
  checked against it in CI. No raw hex, px sizes or ms durations outside it.
- **A theme is a set of custom-property overrides**, not forked components. Derive scales from a few parameters (a type
  base and ratio, a spacing base, a radius base, a tempo) so one change re-proportions everything.
- **Role names, not value names**: `ink-2`, not `grey-600`. Hover and press are small tints over the surface they sit
  on (≈5% and ≈10%), not new colours.
- **Contrast is a property of the pair**, measured after blending translucent colours over their real ground, in every
  theme.
- **Extract only what repeats 3+ times with the same intent.** Premature abstraction is worse than duplication.
- **Never canonise a defect.** A value recorded to silence a finding, or a rule banning a device the world needs, is a
  bug in the system.

## Named rules beat bullets

Give the system's laws names an agent can cite: "The One Voice Rule: the accent covers ≤10% of any view", "Gold Is
Jewelry: the accent never carries body text and never fills a panel". One to three per section. Pair each with the
value and the scope it applies to. Add **tie-breakers** for ambiguous calls: "when in doubt, more space before more
chrome", "bigger work before bigger type".

## DESIGN.md: the template

Write it from the built world, not before it: a rulebook written ahead of the build gets defended against reality.
Draft the idea and the hard rules up front; finalise every number from what shipped.

Front matter (optional but useful for tools): `name`, a one-paragraph `description` (thesis + 3 signature facts),
`colors` (light and dark), `typography`, `rounded` (only allowed values), `spacing` (named ladder), `motion`
(durations, easings), `components` (states as separate keys).

Sections:
1. **The idea**: one sentence that excludes things; 3–5 moves that follow; 6–9 key characteristics with values.
2. **Voice → layout**: where personality lives on the page and where it doesn't; the rationing rule.
3. **Colour**: role table (token, light, dark, role, contrast figure, where banned); proportion; "one X per view".
4. **Typography**: the role split (which face does what, absolutely); table of token, size/clamp, weight, line-height,
   **tracking**, use; the weight ceiling; fallbacks with metric fixes; OpenType features (tabular numerals).
5. **Layout**: base unit, the named spacing ladder (< ~12 steps), grid per breakpoint, max widths, section rhythm.
6. **Page rhythm**: the band/surface sequence per page type, and which surfaces may not repeat back to back.
7. **Shapes**: the allowed radii and the forbidden middle; image ratios and crop rules.
8. **Elevation**: exact values, what carries depth instead, the single exception.
9. **Motion**: tempo tokens, easing, choreography (who moves first), what never moves, hover/press policy,
   reduced-motion and no-script behaviour.
10. **Imagery and icons**: subject, light, treatment, banned sources, alt-text rule, icon set and stroke.
11. **Components**: per component anatomy, values, every state, mobile behaviour. Signature components first.
12. **Do / Don't**: 7–10 each, each with a value and a scope. Ban the model's defaults by name.
13. **Not a template**: the never-lists (layout, visual, words) and the specificity test (`06-tells.md`).
14. **Responsive**: breakpoints, display sizes per breakpoint, touch targets, collapse order, art-directed crops.
15. **Accessibility floor**: contrast pairs, focus, reduced motion, minimum sizes, widths tested.
16. **Agent guide**: read order, tie-breakers, 3–5 example prompts with full values, an audit checklist.
17. **Known gaps**: what isn't decided or proven yet.

## Quality checklist (a DESIGN.md passes if…)

- [ ] The thesis fits one sentence and rules out at least three common choices.
- [ ] **Swap test:** with the name and logo removed, at least five rules would be wrong for a competitor.
- [ ] Every colour has a role, a value per mode, a place it's banned, and a contrast figure when it carries text.
- [ ] The accent is rationed by a number (per view, per band, or % of screen).
- [ ] Every type style has size, weight, line-height and tracking; there's a weight ceiling; the role split is absolute.
- [ ] The spacing ladder is named and short; radii forbid their middle values; elevation names exact values.
- [ ] Motion has durations, easing, order and reduced-motion and no-script behaviour.
- [ ] Every component lists its values and all states; signature components are named.
- [ ] Do's and don'ts are 7+ each with values; responsive gives sizes per breakpoint.
- [ ] The agent guide has tie-breakers and example prompts; known gaps are honest.
- [ ] No boilerplate (generic pricing/cart/toast examples, filler like "X IS the brand").
