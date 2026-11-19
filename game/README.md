# The Divide: game code

The online version of The Divide. Everything here is TypeScript.

| Folder | What it is |
|---|---|
| `packages/engine` | The rules engine. Three computer players: the fast heuristic (`bots.ts`); the strong Monte Carlo bot (`mc.ts`), which copies the game, reshuffles what it cannot see, and plays each option forward, as the design lab's bots do; and the learned bot (`learned.ts`), a small network trained on the strong bot that plays the site's bot seats (`design/bots.md`). Deterministic: a game is its config (with a seed) plus the ordered list of player inputs, so any game can be replayed exactly. Every Host, Celestial, and Event ability is implemented here. |
| `tools/sim` | The balance simulator. Plays thousands of all-bot games and reports win rates by Celestial and card. |
| `tools/distill` | Trains the learned bot from the strong bot's choices (`README.md` there). |
| `tools/lab` | The rework lab: a fast abstract model for testing core rules with strong bots. |
| `tools/par.ts` | Runs a script's games on every core, with the same results as one core. |
| `packages/protocol` | The messages between the browser and a game table, and the shapes of the stats API. |
| `apps/server` | The Cloudflare Worker: live game tables (one Durable Object each), bots and the turn timer, and the stats database (D1 `divide-stats`, schema in `migrations/`). |
| `apps/web` | The website, drawn after the printed cards: lobby, game table, cards, rules, stats and game records. |

**The site is live at https://thedivide.pages.dev.** How to play, how it works, what the stats record, and how to publish changes: `SITE.md`.

## Commands

```
npm install
npm test                                   # engine tests (110, including hundreds of bot games) and server tests (11)
# Simulations play the learned bot by default; BOT=heuristic for the fast heuristic (tools/sim/bot.ts).
npm run dev                                # the whole site locally at http://127.0.0.1:8787
npm run deploy                             # publish (see SITE.md)
npm run sim -- --games 20000 --players 3,4 # balance report: every Celestial and Host card
cd tools/sim && npx tsx advanced.ts 20000 0 out.json      # Advanced game: Celestial win ratios, what each Event does
cd tools/sim && npx tsx quality.ts 6000    # skill expression and comeback measurements
cd tools/sim && npx tsx baseline.ts 20000  # the bot column on the Stats page (after a rules change)
cd tools/sim && npx tsx exp45.ts 16000     # V45 health check: Days nobody wins, Offers, card groups, seats, cards and Celestials out of range
cd tools/sim && npx tsx skill45.ts 200 4   # one strong (Monte Carlo) bot among heuristic bots: its win ratio
cd tools/sim && npx tsx card-value.ts 2500 0 1 out.json  # what each card is worth in hand, against a plain card of its color (STRONG=1: a strong player)
cd tools/sim && npx tsx bench-bots.ts 24 4 all            # strong-bot speed, and a fingerprint of every move (a speed-up must not change it)
cd tools/distill && npx tsx eval.ts builtin 400 skill4    # the learned bot (the site's bots) among heuristic bots; retraining: tools/distill/README.md
cd tools/sim && npx tsx personas.ts 600 levels            # bot levels (and `styles`, `sweep`): win shares
cd tools/sim && npx tsx reader.ts 2000 [bluffer]          # how readable sides are from public facts (TABLE=heuristic|strong)
cd tools/sim && ./core.sh results/out.jsonl 300 current devotion1   # core rule variants with strong bots (variants.ts); python3 core_table.py results/out.jsonl
cd tools/sim && npx tsx exploits.ts devotion1 300          # fixed strategies under a variant: every one should lose
```

## Testing a rule change

The engine plays only the current rules. To measure a change, make it on a branch and run the same simulator commands there and on `main`: the seeds are fixed, so the two reports compare like for like. The rules measured and rejected along the way are recorded in `../CHANGELOG.md`.

## Engine rulings

The calls the engine makes where card text leaves room were confirmed or decided on November 16, 2026, and are recorded in `../design/design-decisions.md` (Card rulings) and the rulebook's Rulings section. Three changed the engine: The Flood and Let There Be Light switch off every ability of their color (automatic ones included), a facedown card seen with Knowledge or Belial (Urim and Asmadai before V42) is shown once and then hidden again, and Hubris takes 1 Glory in total (its holder chooses among tied leaders).
