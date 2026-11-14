# Decision density: variant tests (November 14, 2026)

**Question:** can The Divide give players more meaningful decisions per game while keeping skill high and the rules light?

**Method:** each setup was played on the same seeds with V34 cards, at 3 and 4 players: 3,000 games of rule-following bots, plus 3,000 games of one rule-following bot against random players and 3,000 of one random player against rule-following bots. That is 18,000 games per setup and roughly 360,000 in all.

## The rules tested

| Code | Rule | Rules cost |
|---|---|---|
| R | **Two rounds per Day.** The table takes turns twice before the Evening. Each Choir card and Celestial power still activates at most once per Day. | Small |
| S | **Secret Offering.** Before turns, every player places 1 card from hand facedown on the Altar; revealed in the Evening. No Glory. | Small |
| F | **Face-up row.** Three Host cards lie face up; Gather may take one (it refills from the deck). Blind deck Gathers remain. | Small |
| D | **Draw 2, keep 1.** At Upkeep, draw one extra card and discard one of the new cards. | Tiny |
| O | **Offer reward choice.** Each Offer gains 1 Glory or draws 1 card. | Tiny |
| C | **Celestial draft.** Each player is offered two Celestials and keeps one. | Tiny |
| K | **Catch-up order.** Each Day, the player with the least Glory acts last. | Tiny |

## How to read the measures

- **Core decisions:** choices per player per game about actions, cards, Gathers, activations, and discards (forced choices excluded). Total decisions add every yes/no and target prompt.
- **Skill edge:** win ratio of one rule-following bot among random players (1.00 = no edge). **Random penalty:** win ratio of one random player among rule-following bots (lower = skill matters more).
- **Day 3 leader wins:** how often the sole Glory leader after Day 3 wins (chance is 33% at 3 players, 25% at 4). **Comebacks:** winner was not leading entering Day 6.
- **Celestial spread:** standard deviation of the nine Celestials' win ratios (lower = better balanced).

## Results: 3 players

| Setup | Core decisions | Total | Skill edge | Random penalty | Day 3 leader wins | Comebacks | Margin | Winning Glory | Celestial spread |
|---|---|---|---|---|---|---|---|---|---|
| Baseline (V34) | 21.8 | 34.3 | 2.37 | 0.19 | 65% | 17% | 3.1 | 12.3 | 0.13 |
| R | 38.9 | 53.3 | 2.76 | 0.05 | 65% | 17% | 3.1 | 17.3 | 0.17 |
| S | 28.9 | 41.2 | 2.17 | 0.23 | 61% | 21% | 3.0 | 11.0 | 0.14 |
| F | 21.8 | 34.3 | 2.35 | 0.18 | 63% | 18% | 3.1 | 12.4 | 0.11 |
| D | 25.4 | 38.0 | 2.42 | 0.15 | 65% | 19% | 3.2 | 13.3 | 0.10 |
| O | 26.5 | 39.1 | 2.51 | 0.12 | 66% | 17% | 3.0 | 12.0 | 0.13 |
| C | 21.8 | 32.5 | 2.41 | 0.20 | 65% | 18% | 2.9 | 12.3 | 0.16 |
| K | 21.7 | 34.3 | 2.37 | 0.20 | 63% | 18% | 2.8 | 11.9 | 0.14 |
| **F + D + O** | **30.4** | 43.0 | 2.57 | 0.11 | 66% | 18% | 3.2 | 13.3 | **0.12** |
| R + F | 39.1 | 53.5 | 2.76 | 0.04 | 65% | 16% | 2.9 | 17.7 | 0.16 |
| **R + F + D** | **43.1** | 57.5 | **2.84** | **0.03** | 66% | 17% | 2.9 | 19.4 | 0.17 |
| R + F + O | 47.9 | 62.3 | 2.79 | 0.05 | 67% | 17% | 2.8 | 16.0 | 0.20 |
| S + F | 29.0 | 41.3 | 2.17 | 0.23 | 61% | 20% | 3.1 | 11.2 | 0.13 |
| S + F + D | 33.4 | 45.7 | 2.35 | 0.16 | 65% | 19% | 3.3 | 12.7 | 0.13 |
| R + S | 45.5 | 59.5 | 2.54 | 0.11 | 62% | 18% | 3.3 | 14.0 | 0.17 |
| R + S + F | 45.8 | 59.7 | 2.52 | 0.11 | 62% | 18% | 3.4 | 14.1 | 0.15 |
| R + F + C | 39.2 | 51.6 | 2.77 | 0.05 | 65% | 17% | 2.9 | 17.6 | 0.15 |
| F + D + O + K | 30.4 | n/a | 2.56 | 0.10 | 64% | 19% | 3.0 | 13.0 | 0.13 |
| R + F + D + K | 43.1 | n/a | 2.83 | 0.03 | 65% | 17% | 2.8 | 19.1 | 0.16 |
| All six (R S F D O C) | 58.0 | 70.2 | 2.58 | 0.10 | 63% | 18% | 2.9 | 12.8 | 0.20 |

## Results: 4 players

| Setup | Core decisions | Skill edge | Random penalty | Day 3 leader wins | Comebacks | Margin | Winning Glory | Celestial spread |
|---|---|---|---|---|---|---|---|---|
| Baseline (V34) | 21.9 | 2.80 | 0.17 | 59% | 24% | 2.5 | 12.5 | 0.16 |
| R | 38.8 | 3.41 | 0.06 | 57% | 23% | 2.4 | 17.2 | 0.17 |
| S | 28.8 | 2.49 | 0.25 | 54% | 26% | 2.6 | 11.4 | 0.16 |
| F | 21.9 | 2.87 | 0.14 | 57% | 23% | 2.6 | 12.8 | 0.15 |
| D | 25.5 | 2.93 | 0.15 | 59% | 22% | 2.6 | 13.5 | 0.14 |
| O | 26.6 | 3.09 | 0.13 | 57% | 23% | 2.4 | 12.4 | 0.16 |
| C | 21.8 | 2.90 | 0.18 | 56% | 25% | 2.4 | 12.5 | 0.15 |
| K | 21.9 | 2.78 | 0.16 | 55% | 25% | 2.4 | 12.1 | 0.16 |
| **F + D + O** | **30.5** | 3.12 | 0.09 | 58% | 23% | 2.6 | 13.7 | **0.14** |
| **R + F + D** | **43.0** | **3.65** | **0.03** | 59% | 22% | 2.3 | 19.4 | 0.20 |
| R + F + O | 47.8 | 3.54 | 0.03 | 57% | 21% | 2.4 | 16.0 | 0.23 |
| R + S + F | 45.4 | 3.08 | 0.09 | 55% | 24% | 2.7 | 14.3 | 0.21 |
| All six | 57.9 | 3.10 | 0.10 | 53% | 26% | 2.4 | 12.6 | 0.22 |

## What the numbers say

**Two rounds per Day is the strongest single lever.** It adds about 17 core decisions per player (up 78%) and makes skill matter clearly more: a random player's win ratio among rule-following bots falls from 0.19 to 0.05. Tension is unchanged. The costs are a longer game (two trips around the table each Day), Glory inflation (winning totals rise from about 12 to 17, because Offer income doubles while the Reaping cap stays at 3), and slightly wider Celestial imbalance.

**The face-up row, draw 2 keep 1, and the Offer reward choice are a light package.** Together they add about 9 core decisions (up 40%), raise the skill edge, keep the Glory economy close to today's, and are the only combination that tightens Celestial balance. None of them lengthens a turn meaningfully. The face-up row adds no new decision points by count, because Gather was already a choice; what it changes is that the choice is informed instead of blind, which shows up as better balance and slightly higher skill.

**The secret Offering adds decisions but measures as more luck.** Skill edge drops (2.37 to 2.17) and comebacks rise. That is partly a limit of the test: bots cannot bluff or read intentions, which is exactly what this rule is for. It is the only option that brings hidden information back into the Open Game, so it deserves human playtesting before a verdict.

**The Celestial draft is not ready.** Drafting amplifies whatever imbalance the Celestials have, because players pick the strong ones. Revisit it once the Celestials are tighter.

**Stacking everything has diminishing returns.** All six rules give the most decisions (58) but worse balance than either recommended package and a lower skill edge than two rounds alone.

## Mechanics worth noting

- **The early lead is structural.** In every setup, the sole leader after Day 3 wins about 61 to 67% of 3-player games. A Choir that is aligned with the Tide keeps paying, and Choirs change slowly. Turn order is not the cause: giving the trailing player the last seat (K) moved this only 2 to 4 points. If this matters in human play, the lever is in scoring (for example, a smaller Reaping cap for the leader, or catch-up Glory), not in turn order.
- **Many activations are not real decisions.** Abilities like Wisdom, Watchers, and Ordeal are almost always correct to use, so the activation prompts inflate the total decision count without adding much choice. The core decision counts above are the better measure.
- **Blind draws were the clearest non-decisions in the base game:** Gathering from the top of the deck and drawing at Upkeep. The face-up row and draw 2 keep 1 replace both with choices.
- **Two rounds per Day changes the Glory economy.** If adopted, consider either Offers gaining Glory only in the first round, or raising the Reaping cap, so Choir building stays as valuable relative to Offering as it is today.

## Recommendation

1. **Adopt the light package (face-up row, draw 2 keep 1, Offer reward choice) as the next playtest rules.** It is the best value: 40% more core decisions, more skill, better balance, almost no added length or rules.
2. **Test two rounds per Day as a separate "long game" option** with human players, together with the face-up row and draw 2 keep 1. It is the biggest jump in depth, but its length and Glory economy need to be felt at a real table.
3. **Playtest the secret Offering with people,** since the bots cannot measure what it adds.
4. **Hold the Celestial draft and catch-up order.**

## Caveats

Bots are rule-following, not expert, and they do not negotiate, bluff, or feel downtime. These numbers show how much the rules reward good decisions and how close games stay; they cannot show whether the decisions are fun or how long a turn feels. Every rule here is available as an engine variant, so each can be switched on in a real game room for human testing.

To rerun: `cd game/tools/sim && npx tsx variants.ts 3000 out.json B FDO RFD` (codes: R, S, F, D, O, C, K).
