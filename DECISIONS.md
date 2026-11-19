# Decisions

One line per decision, newest first: what was decided, why, and where the evidence is. The detail lives in the linked files; this is the index. Add a line whenever something is adopted, rejected or retired.

| Date | Decision | Why | Evidence |
|---|---|---|---|
| 2026-11-19 | **The hybrid** (`HYBRID`: strong-bot search over the network's top 2 options, 4 learned playouts each) is the strong player for simulations under the current rules | Beats the strong bot 1.12 to 0.88 at about the same cost | `design/bots.md` (Layer 2) |
| 2026-11-19 | **Learned bot: round 3 weights kept** (128/64, ranking loss, 5,000 games) | Rejected after testing in play: DAgger, a stronger teacher (round 4) and the smaller 64/32 network; none beat it. Its ceiling is a single glance; strength now comes from search | `design/bots.md` (Layer 2) |
| 2026-11-19 | **The site's bots use the learned bot** (`learnedAnswer`); the heuristic answers minor decisions and is the fallback. Warmed at Worker startup. Not yet deployed | 1.62× a fair share among heuristic bots, 0.81 against the strong bot, median 0.15 ms a decision (max about 3.7); the strong bot cannot fit the free plan's 10 ms | `design/bots.md` (Layer 2) |
| 2026-11-19 | **Learned bot trained with a ranking loss** | Squared error let Judgment Day's 100-point swings drown everything else (1.09× against 1.49×) | `design/bots.md` (Layer 2) |
| 2026-11-19 | **Removed:** redundant sim scripts (`card-balance.ts` = `exp45.ts`; `shape.ts` measured V44; `seats.ts` and `glory-per-day.ts` unused, seats now in `exp45.ts`); DAgger and learned-teacher options in `gen.ts` | Keep the repo lean: one script per measurement, no tools that did not help | `game/README.md` (commands), git history |
| 2026-11-19 | **Rejected: duplicate deals for skill tests** (each deal from every seat) | Same noise as independent deals (±0.09 at 400 games) | `design/bots.md` |
| 2026-11-19 | **Strong bot copies games from the start of the Day** instead of replaying from the deal; scripts run on every core | About 3× faster with every move unchanged (fingerprints) | `design/bots.md` |
| 2026-11-19 | **Fixed:** the Judgment Day choice in progress lived outside the game state | Two games in one process could interfere | `CHANGELOG.md` (Faster bots) |
| 2026-11-19 | **No offering, no harvest** replaces the Miser's Rule | More Offers (67–68%), fair, most skill measured, nothing to track | `design/tokens-and-offering.md` |
| 2026-11-19 | **Tokens stay an Offer; leftovers go to whoever holds the fewest;** make tokens card-shaped | Cheaper token play hurts fairness; every other leftover rule makes players hoard | `design/tokens-and-offering.md` |
| 2026-11-19 | **7 Days at every table, the last a secret-choice Judgment Day** | One number to learn; no seat acts last with the most knowledge on the deciding Day | `design/the-game-now.md` (Seven Days) |
| 2026-11-19 | **Every card is Light or Dark** | The 23 Neutral cards were traps (0.50–0.70) | `design/the-game-now.md` (V45: building it) |
| 2026-11-19 | **Hidden Roles retired;** the game is for 3 and 4 players | Tokens do its job; 5–6 players need awkward Day counts | `design/design-decisions.md` (Modes) |
| 2026-11-19 | **Choirs stay face up** | The engine is public: players must understand each other's actions | `design/vision.md` (principle 5) |
| 2026-11-19 | **V45 core adopted:** secret allegiance tokens, the Tide track, Choirs pay 2 | Hides sides best (52%), the most skill, every fixed strategy loses | `design/the-game-now.md` |
