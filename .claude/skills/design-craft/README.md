# design-craft

A repeatable design skill for Claude Code: one loop (ground → direction → system → build → look → separate review →
fix once → document), an expert quality floor, the tells of machine-made design, and a screenshot matrix. Project
truth always comes from the project's own files (VISION.md, PRODUCT.md, brand guidelines, DESIGN.md), so the skill
works unchanged in any repo.

## Use it in every project

Copy this folder to your user-level skills, where Claude Code finds it in every project:

```bash
mkdir -p ~/.claude/skills && cp -R .claude/skills/design-craft ~/.claude/skills/
```

Or keep it per project by copying the folder into that repo's `.claude/skills/`. Update by copying again.

## Using it

Ask for design work in plain words ("make the home page less bland", "critique the pricing page", "set up a
DESIGN.md", "polish the settings screen") or invoke `/design-craft`. Name a refine verb to run just that playbook:
`bolder`, `quieter`, `distill`, `delight`, `overdrive`, `typeset`, `layout`, `colorize`, `animate`, `clarify`,
`harden`, `adapt`, `polish`.

The screenshot matrix needs Playwright with Chromium in the project:
`node ~/.claude/skills/design-craft/scripts/shoot.mjs --base http://localhost:3000 --routes / --out shots`.

Credits and licences: `NOTICE.md`.
