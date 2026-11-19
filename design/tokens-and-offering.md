# Tokens and the Offer: Robert's questions, tested (Rounds 44–45)

November 19, 2026. Robert asked three things about the V45 core:
1. Spending a whole action on a token might make players always do it or never do it.
2. Where should tokens left on the Altar go? Is "to the fewest" right?
3. "Whoever Offered the fewest times loses 3" means tracking. Is there something more elegant?

The lab played every idea with its strong (Monte Carlo) bots, using the current rules: 7 Days with Judgment Day, every card Light or Dark, Choirs paying 2. That meant 400 games at 3 players, 300 at 4, and a reader trained on 200 games. Results are in `game/tools/lab/results/r44.jsonl` and `r45.jsonl`.

**Reading the tables:**
- Win rates by seat and by token mix: 1.00 is fair; with this many games, about ±0.1 is noise.
- "Never use a token" is the share of players who go a whole game without playing one.
- "Reader" is how often a careful card-counter names your side (guessing: about 37%).

## 1. The Miser's Rule: replaced by "no offering, no harvest"

| Rule | Offers (share of actions) | Seats 3p / 4p | Token mixes 3p / 4p |
|---|---|---|---|
| The Miser's Rule (fewest Offers lose 3 at the end) | 52% / 47% | 0.95–1.06 / 0.86–1.11 | 0.96–1.04 / 0.96–1.05 |
| No rule | **28% / 25%** | 0.84–1.17 / 0.82–1.11 | 0.86–1.08 / 0.89–1.09 |
| **No offering, no harvest** (your Choir scores only on a Day you Offered) | **67% / 68%** | **0.95–1.03 / 0.92–1.12** | **0.97–1.06 / 0.95–1.06** |
| Half harvest without an Offer | 60% / 61% | 0.84–1.16 / 0.91–1.06 | 0.97–1.01 / 0.92–1.07 |
| A round in which everyone must Offer, then a free action | 58% / 58% | 0.82–1.16 / 0.82–1.31 | fair, but 43–53 minutes |

**"No offering, no harvest"** is better than the Miser's Rule on every measure:
- **More contribution:** Offers rise to 67–68% of actions.
- **Fair:** seats and token mixes stay within the noise band.
- **The most skill of anything measured:** strong play beats simple play 3.91×.
- **Simple strategies all lose:** never Offer 0.00, always Offer 0.01, never switch sides 0.03.
- **Nothing to track:** everyone has just watched today's turns.

It also keeps the dilemma, and sharpens it. Building is still worth doing, but a Day you build is a Day your Choir earns nothing, so you choose those Days when your Choir's color is likely to lose anyway. That is principle 1 (self versus side) on every turn.

## 2. How tokens are played

| Idea | Tokens played per player | Never use a token | Seats 3p / 4p | Token mixes 4p | Reader |
|---|---|---|---|---|---|
| **As an Offer (current)** | 1.14 / 0.80 | 23% / 32% | 0.95–1.03 / 0.92–1.12 | 0.95–1.06 | 52% |
| Also as First Fruits (anonymous, no action) | 1.66 / 1.22 | 15% / 23% | 0.87–1.23 / 0.79–1.18 | **0.81–1.14** | 50% |
| Only as First Fruits | 1.20 / 0.98 | 18% / 22% | 0.81–1.12 / 0.79–1.17 | 0.93–1.10 | 50% |
| A free pledge once a Day, alongside any action | 1.54 / 1.14 | 19% / 31% | 0.83–1.17 / 0.83–1.18 | **0.84–1.19** | 56% |
| Two actions a turn (7 Days, or 5) | 1.07 / 0.83 | 27% / 35% | up to 1.22 | 0.93–1.10 | 54–55% |

*(Rows 2–4 combine with "no offering, no harvest"; row 5 was tested before it.)*

- **Nobody plays only tokens.** The most a single player plays is about 1.4 to 1.8 a game, out of 7 actions.
- **About a quarter of players never play one in a game.** That's a choice the bots make when their side is ahead without it, not a dead rule.
- **Every way of making tokens cheaper to play gets them used more, but costs fairness.** Pledging at dawn or for free with an action makes the uneven token mixes matter more (4p mixes 0.81–1.19).
- **Two actions a turn** makes the game 43–53 minutes and gains nothing.
- **Tokens shaped like cards** (Robert) changes nothing the bots can measure (reader 53%). The bots don't read faces, but people would: a facedown Offer could be a card or a token. **Recommended as a component**, since it costs no rule.

**Keep tokens as an Offer**, the strongest Offer there is. Make them card-shaped.

## 3. Where leftover tokens go

| Rule | Tokens played per player | Never use a token | Seats 3p / 4p |
|---|---|---|---|
| **To whoever holds the fewest (current)** | 0.91 / 0.66 | 31% / 41% | 0.95–1.06 / 0.86–1.11 |
| Back to its owner if its color won, else to the fewest | 0.91 / 0.65 | 31% / 41% | 0.96–1.06 / 0.86–1.11 |
| Back to its owner if its color won, else lost | 0.69 / 0.46 | 46% / 57% | 0.93–1.08 / 0.87–1.17 |
| Lost | **0.28 / 0.18** | **76% / 83%** | 0.78–1.14 / 0.89–1.20 |
| Drafted by the Evening's top scorers | 0.47 / 0.26 | 62% / 76% | 0.90–1.07 / 0.91–1.13 |
| Drafted by the Evening's lowest scorers | 0.30 / 0.21 | 74% / 81% | 0.89–1.10 / 0.85–1.13 |

*(Measured before "no offering, no harvest", which raises token play across the board.)*

**"To the fewest" works because it is a refund in disguise.** The player who just Offered a token usually now holds the fewest, so it often comes back to them, but not always, and nobody can be sure. Every rule that lets the token be lost, or hands it to someone else, makes players hoard.

"Back to its owner if its color won" plays the same in the numbers, but it needs everyone to know whose token was whose. That is exactly what the anonymous reveal hides, and card-shaped tokens would hide too. **Keep "to the fewest".**

## Against the vision

- **Self versus side:** "no offering, no harvest" puts the choice on every turn: build for yourself, and skip tonight's harvest, or Offer for the side, and keep it.
- **Uncertain allegiance:** unchanged (reader 52%). Card-shaped tokens should help people further.
- **Checkable on the table:** no counting across the game; the rule is checked each Evening against what everyone just saw.
- **What only people can show:** whether "no harvest" feels harsh or natural; whether people hoard tokens more than the bots; and whether card-shaped tokens make the reads richer.
