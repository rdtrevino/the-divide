# Decisions

One line per decision, newest first: what was decided, why, and where the evidence is. The detail lives in the linked files; this is the index. Add a line whenever something is adopted, rejected or retired.

| Date | Decision | Why | Evidence |
|---|---|---|---|
| 2026-11-19 | **Removed redundant sim scripts:** `card-balance.ts` (same as `exp45.ts`), `shape.ts` (measured V44 quantities), `seats.ts` and `glory-per-day.ts` (unused; seats now in `exp45.ts`) | Keep the repo lean: one script per measurement | `game/README.md` (commands) |
| 2026-11-19 | **The site's bots use the learned bot** (`learnedAnswer`); the heuristic answers minor decisions and is the fallback. Not yet deployed | About 1.6× a fair share among heuristic bots at well under a millisecond a decision; the strong bot cannot run within the free plan's CPU limit | `design/bots.md` |
| 2026-11-19 | **Strength comes from the teacher, not more imitation:** DAgger and more data did not lift the learned bot; a teacher whose playouts use the learned bot beats the plain strong bot 1.13 to 0.87 | Next rounds train on that stronger teacher (expert iteration) | `design/bots.md` |
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
