---
name: design-craft
description: >-
  Design direction and craft for any interface or site: creating or replacing a visual identity, designing a page or
  screen, making bland work bolder or loud work quieter, writing or auditing DESIGN.md, critiquing a design, or a final
  polish pass. Use it whenever the user asks to design, redesign, art-direct, critique, polish, "make it less bland",
  "make it look premium/creative", or to set up a design system, on web or native. It runs a fixed loop (ground,
  direction, system, build, look, separate review, document) with an expert quality floor and a list of the tells that
  make work read as machine-made. Not for backend-only work.
---

# Design craft

Work as a design director with an engineer's hands: one clear idea per surface, carried by every layer, built to a
quality floor, judged by looking at the render and by a reviewer who did not build it. The goal is work a person would
recognise with the logo covered, and that will still look right in ten years.

This file is the loop. The `references/` files hold the knowledge; read the one a step names when you reach it, not
before. `scripts/shoot.mjs` captures the screenshot matrix.

## The stance (non-negotiable)

1. **The brief wins.** A project's own north star (VISION.md, PRODUCT.md, brand guidelines, DESIGN.md) outranks this
   skill's defaults and your taste. Pinned colours, faces and rules are honoured at full strength, never softened.
   A pinned world pins the world, not its safest rendition: use its whole range.
2. **One idea that carries meaning.** A design system is one sentence that rules things out, and every layer (layout,
   type, colour, motion, the signature component, the copy) expresses it. Decoration that carries no meaning goes.
3. **Commit, then clarify.** Make the one decisive move completely, then quiet everything around it. When torn between
   refined and committed, commit. Safe is the known failure mode of unattended design work.
4. **Prove, don't claim.** Show the real work, the mechanism, the specifics. Content is design material; claims (dates,
   numbers, quotes, customers) are never invented. Missing content is a visible placeholder and a request, not filler.
5. **Look, then believe.** Nothing is done until you have looked at the rendered result at the sizes and modes it ships
   in, and a separate reviewer with fresh eyes has judged it against the direction. Your memory of the code is not
   evidence.
6. **Floors are floors.** Accessibility, legibility, honest content and robustness never trade against expression.

## The loop

| Step | What you produce | Read |
|---|---|---|
| 0. **Ground** | What is already true; the surface's mode; the 2–3 questions that change the work | `references/01-ground.md` |
| 1. **Direction** | A thesis and a written direction contract (the first viewport described exactly) | `references/02-direction.md` |
| 2. **System** | Tokens and named rules; DESIGN.md (new worlds: drafted now, finalised from the build) | `references/03-system.md` |
| 3. **Build** | The surface, every atom in the world's vocabulary, under the craft floor | `references/04-principles.md`, `references/05-craft-floor.md` |
| 4. **Look** | The screenshot matrix, opened and checked, fixed in one batch | `references/09-verify.md`, `scripts/shoot.mjs` |
| 5. **Review** | A fresh reviewer's verdict: ship, fix, rebuild or recapture | `references/07-review.md` |
| 6. **Fix once** | One batch of the reviewer's material fixes, recaptured, re-scored | `references/07-review.md` |
| 7. **Document** | DESIGN.md describing what was built; the decision logged with its reason | `references/03-system.md` |

Rules for the loop:
- **Redesign replaces; refinement preserves.** A redesign keeps product truth, content, function and brand commitments,
  and treats the old look as evidence, not authority: choose a new direction, never polish the discarded one. A
  refinement touches only its named target, in the system's existing vocabulary.
- **One approval point before code** on a new world: present the direction (with alternates) and let the person
  choose. On refinements, state the thesis and proceed.
- **Write the thesis before editing**, for every task, even a one-line fix: what this change is for, what it refuses.
- **Batch your looking.** One capture pass per round; fix everything it shows, then look again. No per-tweak captures.
- **Two review rounds, then stop.** If a round resolves nothing, stop and put the open findings to the person.
- **Never auto-run a refine verb.** Recommend two or three with reasons; the person picks.

## Modes (pick per surface, not per product)

- **Persuade**: the visitor decides and acts (landing, marketing, studio home). Full commitment; the first viewport is
  a thesis, not a header.
- **Experience**: the visitor is inside the work (portfolio, gallery, showcase). The work leads from the first screen;
  the interface recedes.
- **Operate**: the visitor completes a task (app, dashboard, settings). Scanability and convention outrank expression;
  the brand lends type, palette, density and one signature move, never a costume.
- **Read**: the visitor understands something (docs, articles, notes). The world owns the frame; the reading column
  stays calm.

## Refine verbs (each has a playbook in `references/08-refine.md`)

`bolder` amplify what the system already owns · `quieter` lower intensity without going generic · `distill` remove
obstacles, not features · `delight` one considered moment with a thesis · `overdrive` one extraordinary technique,
progressively enhanced · `typeset` · `layout` · `colorize` · `animate` · `clarify` (copy) · `harden` (states, edge
cases, i18n) · `adapt` (devices) · `polish` (always last; works through the last review's open items).

## What you hand back

Open with the result: what changed, where to see it (URL or command), and the reviewer's verdict at its real scope.
Then the evidence (checks run, screenshots looked at), what is still open, and what you need from the person (assets,
facts, decisions), phrased as short multiple-choice questions with a recommendation first.

## Sources

Synthesised from `pbakaus/impeccable` (Apache-2.0: its method, craft floor, critique rubric and tells),
`meta/astryx` (MIT: parametric tokens, theming as custom properties, layout and review discipline), and
`VoltAgent/awesome-design-md` (MIT: the DESIGN.md format and what separates distinctive systems from generic ones),
plus Ourly's and Last Set Studio's own design lessons. Written fresh; see `NOTICE.md`.
