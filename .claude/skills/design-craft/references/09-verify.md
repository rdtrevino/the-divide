# 4. Look: the screenshot matrix

You have not seen the design until you've looked at it at the sizes and in the modes it ships in.

## The matrix

- **Widths**: 320 (the floor), 390 (the reference phone), 768 (tablet), 1440 (the reference desktop). Add 1920 for
  wide layouts and any width the person reports using.
- **Themes**: light and dark when the product supports both (emulate `prefers-color-scheme`).
- **Scripts**: on and off (`javaScriptEnabled: false`): the off state is what crawlers, failed loads and cautious
  readers get.
- **Motion**: capture with `reducedMotion: 'reduce'` so the frame shows final positions, then separately check the
  motion itself (sample frames, or step a paused animation's `currentTime`).
- **Pixel density**: 2× for screenshots a person will see; 1× for checks only you read.

Run it with `scripts/shoot.mjs`:

```bash
node .claude/skills/design-craft/scripts/shoot.mjs --base http://localhost:3000 --routes /,/about --out shots
```

It writes full-page PNGs named `<route>-<width>-<theme>-<js|nojs>.png` and `report.json` (sideways overflow per
capture, the page's `h1`, console errors).

## Capture validity (check before judging or sending)

- Wait for fonts (`document.fonts.ready`) and let entrance motion settle (or reduce it); an element hidden by
  animation timing reads as missing and gets "fixed" into a regression.
- Capture full pages from the document top.
- Open every file once and confirm it shows what its name claims: no blank or black regions, no wrong page, no
  half-loaded state, the right theme.

## What to check on each capture

The craft floor's verify list (`05-craft-floor.md`) plus: no sideways scroll; headline breaks at each width; the first
viewport shows what the direction promised; the page gets where it's going (rhythm, the close); both themes are
composed, not inverted.

## Automated checks worth wiring into CI (any stack)

- **axe** (via Playwright) on every page in light and dark: serious or critical violations fail.
- **Scripts off**: every page renders its heading, navigation and primary content.
- **Floor at widths** 320–1920: no sideways scroll; visible focus on the first tab stops; no running animations under
  reduced motion.
- **Brand rules** as tests where they're mechanical: minimum sizes for the display face, the accent never on body text,
  approved copy matches its source file, logo paths match the brand files.
- **Budgets as ratchets**: JS, CSS+HTML per page, fonts, LCP and CLS; ceilings may only go down.
- **Banned words** in content and rendered text (`04-principles.md` → Copy).
