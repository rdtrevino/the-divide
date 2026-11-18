# The Divide: game code

The online version of The Divide. Everything here is TypeScript.

| Folder | What it is |
|---|---|
| `packages/engine` | The rules engine. Deterministic: a game is its config (with a seed) plus the ordered list of player inputs, so any game can be replayed exactly. Every Host, Celestial, and Event ability is implemented here. |
| `tools/sim` | The balance simulator. Plays thousands of all-bot games and reports win rates by Celestial and card. |
| `reports/` | Saved simulator reports. |
| `packages/protocol` | The messages between the browser and a game table, and the shapes of the stats API. |
| `apps/server` | The Cloudflare Worker: live game tables (one Durable Object each), bots and the turn timer, and the stats database (D1 `divide-stats`, schema in `migrations/`). |
| `apps/web` | The website, drawn after the printed cards: lobby, game table, cards, rules, stats and game records. |

**The site is live at https://thedivide.pages.dev.** How to play, how it works, what the stats record, and how to publish changes: `SITE.md`.

## Commands

```
npm install
npm test                                   # engine tests (101, including about 1,500 bot games) and server tests (11)
npm run dev                                # the whole site locally at http://127.0.0.1:8787
npm run deploy                             # publish (see SITE.md)
cd tools/sim && npx tsx quality.ts 6000    # skill expression and comeback measurements
npm run sim -- --games 20000 --players 3,4 # balance report
cd tools/sim && npx tsx ab.ts --games 20000 --variants my-variant  # A/B test a rule variant
cd tools/sim && npx tsx advanced.ts 20000 0 out.json [switches]  # Advanced game: Celestial win ratios, what each Event does
```

## Rule switches

The engine's game config takes a list of `variants`, used by the simulator and the tests, never in real games:

- **Adopted rules are on by default.** Each rework from V42 to V44 was measured as a switch first; the adopted ones are listed in `V42_RULES`, `V43_RULES` and `V44_RULES` in `packages/engine/src/core.ts`. `-name` turns one off, and `v41-rules` turns them all off.
- **Test switches** are the alternatives measured and not adopted. Each is named and explained beside the code it changes (search for `variant(s, '`); `../design/parked-abilities.md` lists the ones worth reviving.
- **Numbers:** `target-N` (the race to N Glory), `limit-N` (Choir size), `choir-N` (starting Choir cards) and `pick-K` (choose the starting Choir from K extra cards).

Measure a switch against the current rules on identical seeds with `cd tools/sim && npx tsx ab.ts --games 20000 --variants my-switch`, or every card with `npx tsx ab3.ts 20000 0 out.json base` (run several offsets in parallel and merge the counts). What each version changed, and the reports behind it, are in `../CHANGELOG.md` and `reports/`.

## Engine rulings

The calls the engine makes where card text leaves room were confirmed or decided on November 16, 2026, and are recorded in `../design/design-decisions.md` (Card rulings) and the rulebook's Rulings section. Three changed the engine: The Flood and Let There Be Light switch off every ability of their color (automatic ones included), a facedown card seen with Knowledge or Belial (Urim and Asmadai before V42) is shown once and then hidden again, and Hubris takes 1 Glory in total (its holder chooses among tied leaders).
