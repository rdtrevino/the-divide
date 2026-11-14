# Balance proposals (November 14, 2026)

**Status: all five adopted as permanent card changes in V34.** Re-measured together on V34: the Arbiter 1.19, Confession 1.18, Covenant 1.00, Heresy 0.94, Raguel 0.75. The variant flags below were retired once the changes became the default rules.

Each proposal was tested against the current V33 rules on the same 20,000 bot games (Open Game, 3 and 4 players). **Win ratio** is actual wins divided by wins expected by chance; 1.00 is fair. Bots are heuristic, so these are leads for playtesting, not verdicts. Every proposal is available as an engine variant, so it can be switched on for real games without editing the cards.

| Card | Today | Proposal | Tested result | Variant flag |
|---|---|---|---|---|
| **The Arbiter** | 1.84 | Only Reaping Glory routes through rivals, and only 1 point of it: "At the Reaping, if you gain Glory, take 1 of it from a player of your choice. If you lose Glory, give 1 of it to a player of your choice." | **1.13** | `arbiter-reaping-only` + `arbiter-cap1` |
| **Confession** | 1.61 (1.02 Glory per game) | Gain the Glory only if your revealed hand holds no Dark card. | **1.15** (0.37 Glory per game) | `confession-pure` |
| **Covenant** | 1.22 (1.67 Glory per game) | Forbid only Offer or Gather (not Exalt), and name a player who has not yet taken their turn this Day. | **1.00** (0.73 Glory per game) | `covenant-strict` |
| **Heresy** | 0.59 | "At the Reaping: You may score your Alignment in reverse." (chosen after the Tide is known) | **1.04** | `heresy-optional` |
| **Raguel** | 0.61 | Only your losses are shared: "At each Reaping, if you lose Glory, your Bound player loses the same amount." | **0.76** | `raguel-oneway` |

## Options tested and rejected

- **Arbiter, catch-up only** (take only from richer players, give only to poorer): 1.84 to 1.71. Too small.
- **Arbiter, Reaping only** (all Reaping Glory routed, Offers from the Pot): 1.30. Better, still the strongest Celestial.
- **Arbiter, 1 point per gain** (all sources): 1.63.
- **Heresy shield** (Heresy losses capped at 1): 0.59 to 0.62. No real effect.

## Still worth watching

- **Leviathan** sits at 1.43: it pays 1 Glory for each rival who loses at the Reaping, which in a three-way race rarely misses.
- **The Patron** (0.74) and **the Oracle** (0.82) may be undervalued by the bots rather than weak; confirm with human games.
- **Heresy as an optional reversal** overlaps with Fig Leaves (both protect against a bad Tide). If adopted, watch whether Fig Leaves becomes the weaker choice.

## How to rerun

```
cd game/tools/sim
npx tsx ab.ts --games 20000 --variants arbiter-reaping-only+arbiter-cap1,confession-pure
```
