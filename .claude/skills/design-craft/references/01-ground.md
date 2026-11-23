# 0. Ground: decide what is already true

Before any design decision, read what the project has already decided, so you extend it instead of overwriting it.

## Read, in this order

1. **The north star**: `VISION.md` (or the owner's equivalent). It outranks everything except brand guidelines.
2. **Brand guidelines** (`brand/guidelines.md` or a PDF): the mark, its geometry and misuse rules, colours, faces.
3. **Product truth**: `PRODUCT.md` (who it's for, the jobs, the rule every change is judged by, voice, never-do list).
4. **The visual system**: `DESIGN.md`, the token file (CSS custom properties, Tailwind theme), and the components.
5. **Copy**: content files (`content/`, CMS exports). Approved words are used verbatim.
6. **The render**: run the project and capture the current state (`scripts/shoot.mjs`). The code describes intent;
   the render shows what visitors see.

If a doc and the render disagree, report the drift; don't silently pick one.

## Classify the job

- **Established world, new surface or section:** inherit the world. Decide only purpose, content, hierarchy, states
  and how it joins the page. No new identity.
- **Refinement:** touch only the target, in the existing vocabulary. If the system can't express what's needed, ask
  for the one addition by name; don't expand the system on your own.
- **Redesign / replacement world:** keep product truth, content, function, constraints and brand commitments. Treat
  the old look as evidence of what the subject is, not authority over what it becomes. Go to `02-direction.md`.
- **No visual authority yet:** create a world with the person (`02-direction.md`), after product truth exists. If
  `PRODUCT.md` is missing, write it first from a short interview: users, jobs, voice, never-do list.

## Name the mode (per surface)

Persuade, Experience, Operate or Read (see SKILL.md). A tool's landing page is Persuade; a fashion house's docs are
Read. The mode sets how much the world may carry the page.

## Ask what will change the work (2–3 questions, never more)

Ask only what you cannot infer, and never about CSS values or "which style do you like". Per mode:
- **Persuade:** who must act, what they should believe, which real proof or assets earn that belief.
- **Experience:** what leads, how exploration unfolds, which transition or interaction matters.
- **Operate:** the task, its frequency, the important states, the constraints.
- **Read:** the reader's question, the source material, how they find their way.

Always: what success looks like, what must not change, what would make a polished result feel wrong.
Put questions as short multiple choice with your recommendation first and one line on the trade-off; build to the
recommendation while you wait, so flipping is cheap.

## Write down

A three-line ground note (in the PR or a surface brief): the job class, the mode, the answers or assumptions.
