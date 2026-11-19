# No offering, no harvest; hand and Choir sizes; token exposure

November 19, 2026. Robert's questions, after reading the V45 rules:
1. Does "no offering, no harvest" take away the choice to Exalt or Gather, and make a player's side more obvious? What would be better: a punishment at the end, something else, or nothing?
2. The 3-card hand and 4-card Choir date from early versions. Are they still the best?
3. At 3 or 4 players, often only one or two players Offer a token on a Day. Is that a big exposure?

**A recommendation, not adopted.**

**Method:**
- **Players:** the strong (Monte Carlo) bot in every seat, real cards, current rules otherwise (`game/tools/sim/core.ts`).
- **Games:** 300 per variant at 3 and at 4 players; 1,200 for the finalists. The token study (`exposure.ts`) also used the Expert learned bot.
- **Fixed strategies** (`exploits.ts`): one strong bot leaning hard into a strategy among three plain ones, 300 games.
- **Results:** `game/tools/sim/results/` (`harvest-r1`, `harvest-confirm`, `harvest-exploits`, `sizes-r1`).
- **Two new measures of "is the choice real":**
  - *close choices:* how often the bot's two best actions were within 1 Glory of each other;
  - *entropy:* how evenly Offer, Gather and Exalt are used; 1.58 is all three equally.

## 1. No offering, no harvest

**Robert is right on both counts, and it matters more than it looked.**
- **It takes the balance out of the action choice.** Offer, Gather and Exalt run 60 / 24 / 16%; without the rule, 30 / 39 / 32%. Building is still chosen, but Offering dominates.
- **It causes the hedging that makes sides readable.** Everyone must Offer to harvest, so strong players build a Choir opposite their tokens to insure that forced Offer, and their Choir gives their side away (70–72%). This is the problem `core-validation.md` blamed on strong play and proposed Devotion for. The root is this rule.

**But removing it outright lets players free-ride.** With no rule, a player who never Offers (only First Fruits) wins 1.11 ± 0.10, a fair share or better, so contributing to the side stops being worth it.

| 1,200 games each | Current (no offering, no harvest) | No rule | **Miser 3** (fewest Offers lose 3 at the end) |
|---|---|---|---|
| Offer / Gather / Exalt (4p) | 60 / 24 / 16% | 30 / 39 / 32% | 45 / 30 / 25% |
| Even use of the actions (max 1.58) | 1.36 | **1.58** | 1.54 |
| Close-call choices | 38% | **46%** | 41% |
| Reader 4p / 3p (guessing 50%) | 70 / 72% | 64 / 66% | **60 / 63%** |
| Alignment (+1 Choir matches tokens, −1 hedged) | −0.49 | +0.07 | **+0.01** |
| Win share when your side won / lost (4p) | 1.35 / 0.65 | 1.56 / 0.44 | **1.61 / 0.47** |
| Seats 4p / 3p | 0.92–1.08 / 0.96–1.07 | 0.88–1.09 / 0.91–1.09 | 0.85–1.10 / 0.95–1.05 |
| Token mixes (4p) | 0.91–1.04 | 0.97–1.01 | 0.95–1.06 |
| Days nobody wins | **19%** | 32% | 29% |
| The reveal changes the winner (4p) | 38% | 18% | 29% |
| Skill (strong among heuristic) | 1.98× | 1.94× | **2.23×** |

| Fixed strategies (4p, 300 games, ±0.1) | Current | No rule | Miser 3 |
|---|---|---|---|
| **Never Offer** | 0.28 | **1.11** | 0.40 |
| Always Offer | 0.10 | 0.04 | 0.11 |
| Always align / always hedge | 0.86 / 0.89 | 0.77 / 0.93 | 0.76 / 1.15 |
| Never Offer a token / never Gather | 1.18 / 0.73 | 1.07 / 0.77 | 0.98 / 0.94 |

Also screened (300 games):
- **Half a harvest without an Offer:** skill fell to 1.37×.
- **Miser 5:** Offers 53%, but close choices fell to 34%.
- **Generous 3** (the most Offers gain 3): seats 0.78–1.28.

**Recommendation: replace "no offering, no harvest" with the Miser** (Robert's idea of a punishment at the end):

> **At the end, whoever Offered the fewest times loses 3 Glory** (nobody, if all are tied). Your Choir scores every Day its color wins.

- **The choice is real again.** The three actions are close to even (1.54), and building no longer costs tonight's harvest.
- **No hedging, so sides are the hardest to read of anything measured** (60–63%), without adding Devotion. Devotion becomes unnecessary.
- **Contributing still matters.** Never Offering loses (0.40), and your side matters most (1.61 against 0.47). That is principle 1, the public good, kept by a cost at the end rather than every Evening.
- **Fair** (seats and mixes within noise), with **the most skill** of the three.

**Costs, honestly:**
- **Tracking.** Players must count Offers. That is why the Miser was replaced in Round 45. On a table it is one bead (or marker) taken with each Offer, public and checkable; on the site, a number by each name.
- **More Days nobody wins:** 29% against 19%. With fewer Offers, the Altar ties more often.
- **The reveal decides less:** it changes the winner in 29% of games, against 38%.

Against `vision.md`'s test:
- **1. Self versus side:** the dilemma moves from every Evening to the whole game: "Offer now, or build and risk being the Miser". Building is a real choice again, and your side matters more.
- **2. Uncertain allegiance:** better (no forced Offer means no hedge).
- **3. The Altar:** still contested (45% Offers, plus First Fruits).
- **5. Checkable:** yes, with a bead per Offer.
- **Rule count:** unchanged (one rule replaces another), and Devotion is no longer needed.

**Why Round 45 chose the other way:** the lab's bots barely hedge, so it measured no offering, no harvest as the better rule (more Offers, more skill) and could not see the hedge it causes. The engine's strong bots do.

## 2. Hand and Choir sizes: 3 and 4 still hold

Each size was tried under the current harvest rule and under none (300 games each):

| | Hand 2 | **Hand 3** | Hand 4 | Choir 3 | **Choir 4** | Choir 5 | Choir 6 |
|---|---|---|---|---|---|---|---|
| Current rule: Offers / close choices | 59% / 39% | 60% / 39% | 61% / 38% | **70% / 33%** | 60% / 39% | 57% / 43% | 56% / 43% |
| Current rule: reader 4p / 3p | 68 / 73% | 68 / 72% | 69 / 71% | 68 / 68% | 68 / 72% | 70 / 74% | 71 / 72% |
| No rule: close choices / reader 4p | 48% / 66% | 46% / 62% | 45% / 65% | **52%** / 66% (alignment +0.35) | 46% / 62% | 43% / 62% | 39% / 63% |
| No rule: Offers / Days nobody wins | 29% / 33% | 29% / 30% | 31% / 33% | 37% / 28% | 29% / 30% | 24% / 35% | 20% / 35% |
| Seats 4p / 3p (no rule) | 0.86–1.09 / **0.75–1.14** | 0.91–1.08 / 0.95–1.03 | 0.92–1.14 / 0.94–1.06 | 0.83–1.16 / 0.89–1.08 | | 0.87–1.20 / 0.89–1.10 | 0.91–1.13 / 0.85–1.14 |

- **A Choir of 3** squeezes the engine: with the harvest rule, Offers jump to 70% and choices thin out; without it, choices are richest, but players align their small Choirs, so sides read again.
- **A Choir of 5 or 6** lets building swallow the Altar: Offers fall to 20–24% without a harvest rule, and a third of Days end with nobody winning.
- **A hand of 2 or 4** changes little: 2 is a touch sharper but less fair at 3 players; 4 adds cards to hold for no gain.
- **Keep a hand of 3 and a Choir of 4.** No other size does better on more than one measure without losing on another.

## 3. Token exposure: real, but it tells little

**Who Offers a token is public** (and token counts are), and the Evening reveal shows the tokens' colors. A lone token's color is exposed.

| | Expert bots 3p / 4p (1,000 games each) | Strong bots 3p / 4p (200 games each) |
|---|---|---|
| Days with one token Offer / two or more | 32 / 8%, 31 / 7% | 44 / 15%, 36 / 25% |
| Token Offers fully exposed at the reveal | 50%, 52% | 46%, 35% |
| …whose color is the Offerer's side | **36%, 50%** | **51%, 51%** |
| Reader without / with the exposed colors | 83.3 / 83.5%, 82.9 / 83.9% | 70.9 / 74.9%, 65.5 / 68.9% |

- **Exposure is common, but the color is a coin flip about the Offerer's side.** Strong players Offer whichever token helps that Day, often their minority color, so a revealed Light token says little about a Light player.
- **It adds 0–4 points to the reader,** against 15–20 for the Choir hedge.
- **A minor concern, not a rule problem.** It bites only players who always Offer their majority color, and reading "a Light token, so a Light player" is the kind of misread the vision wants players to exploit.
- **Hiding who Offered a token would mean hiding token counts,** which the leftover rule needs. **Card-shaped tokens** (already recommended for print) hide the moment of the Offer at no cost.

## What only people can show

- Whether counting Offers with beads feels light or fiddly.
- Whether a third of Days ending with nobody winning feels tense (ties are a real outcome) or flat.
- Whether people Offer tokens of their own side by habit, which would make exposure bite.

## If adopted

- The rulebook and Quick Guide: the Miser replaces no offering, no harvest; Offer beads become a component.
- The engine default (`rules.ts`: `harvest: 'always'`, `miser: 3`), the site (an Offer count by each name), and the learned bot retrained (about 15 minutes).
- Devotion's switch can go: the hedge it fixed came from no offering, no harvest.
