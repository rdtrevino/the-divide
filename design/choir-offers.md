# Choir Offers: getting players to Offer from the Choir

November 20, 2026. Robert adopted turnover with Gather into the hand or the Choir (`flow-fixes.md`) "for now", and asked to fix the remaining problem: **players almost never Offer from their Choir** (0.3–0.4 a game each). He asked to test going back to Offering from the hand, a Glory reward for Offering, and anything else.

**Base:** the current core (engine defaults), rMajGH plus turnover and Gather into either:
- spoils to the Offerers;
- Offer only from your Choir (face up) or a token (facedown);
- First Fruits facedown, a card or a token;
- a Gathered card goes into your hand or your Choir;
- after the Reaping, a full Choir loses its oldest card;
- only your majority color's tokens score.

**Why it matters for the vision.** The face-up Choir Offer is where principle 1 is most visible: you give up your own engine, in public, for a side. If nobody makes it, the flow's "Offer from your Choir" is a rule that does nothing; the token does all the work.

**Why players do not do it** (the bots' arithmetic): a Choir card scores 2 Glory on each Day its color wins, for as long as it stays. A token pushes 2 and is easy to get back (spoils). Nearly every Choir card pushes only 1 (69 of 72 cards), half a token, and costs tonight's Reaping and its later Days. So the token is almost always the cheaper Offer.

**A bot fix first.** The bots valued a Choir card as if it stayed to the end of the game, ignoring turnover, which made them Offer from the Choir too rarely. They now count only the Days it has left before turnover takes it (`choirLife` in `bots.ts`). Every result below uses the fixed bots, including the new base.

## 1. The ideas

| Switch | Idea | Serves (`vision.md`) | Builds on / risks |
|---|---|---|---|
| `offerFrom: 'hand'` | **Back to Offering from the hand** (facedown), or a token | 3: hidden Offers are what make the Altar readable, fakeable, doubtable | The flow study: with hand Offers, never Offering a token won (1.21–1.23), so tokens stopped moving. Turnover may change that |
| `offerFrom: 'both'` | Offer from the hand or the Choir, or a token | Choice | Rejected in the flow study (a token never Offered won). Retested on the new core |
| `offerTokens: false` | **Tokens cannot be Offered**; they reach the Altar only as First Fruits | 1: the only Offer is a card from your Choir, face up | Tokens move less; never Offering may win |
| `choirOfferGlory: 1, 2` | **Glory at once for Offering a Choir card** (Robert's idea) | 1: pays for the sacrifice | A patch (a reward); risk that Offering becomes automatic |
| `offerGlory: 1` | Glory at once for any Offer | 1 | Rewards token Offers equally: may not help the Choir |
| `choirOfferDraw: 1` | Draw a card for Offering a Choir card | 1 and 5: the sacrifice refills the hand, which feeds Exalt and First Fruits | Smaller than the swap (which broke the tokens) |
| `choirOfferReaps` | **The Offered card still scores for you tonight**, as if it were in your Choir | 1: the sacrifice costs only the future, not tonight | Makes the timing matter: Offer the card that is about to turn over |
| `choirOfferWeight: 2` | A Choir card counts double on the Altar | 3: a Choir Offer can swing a Day | Rejected in the flow study (still rare: 0.4–0.6). Retested with turnover |
| `tokenWeight: 1` | Tokens count 1 instead of 2 | 1: the card becomes the stronger push | Tokens matter less on the Altar |
| `choirSpoils: 'first'`, `'only'` | Spoils go first, or only, to whoever Offered a Choir card | 3: the Choir Offer buys the Altar | `'only'`: a token Offer earns nothing |
| `oldestFree` | **After your action, a full Choir may also Offer its oldest card** (the one turnover will take tonight) | 1 and 6: turnover's loss becomes a choice: let the card go, or give it to a side, in public | New. Risk: an extra Offer every Day makes Days lopsided |

Results: `tools/sim/results/offers-r1.jsonl` (300 games a mode), exploits in `results/offers-exploits.jsonl`, which add two strategies: never Offer a Choir card (`noChoir`) and always Offer a Choir card when Offering (`choirFirst`).

## 2. Round 1: each idea alone (300 games a mode, strong bot)

Noise is about ±0.1 on the ratios. "Choir Offers" is per player per game; "Choir flips" is how often a Choir's lean changes.

| Idea | Choir Offers | Token Offers | Choir flips | Side flips | Seats 4p / 3p | Mixes 4p | With / against 4p | Reader 4p / 3p | Skill |
|---|---|---|---|---|---|---|---|---|---|
| current (base) | 0.40 | 2.79 | 0.38 | 0.25 | 0.90–1.10 / 0.88–1.09 | 0.95–1.04 | 1.34 / 0.80 | 0.64 / 0.64 | 1.97 |
| `oldestFree` | **0.91** | 2.55 | 0.39 | 0.20 | 0.90–1.14 / **0.99–1.01** | 0.96–1.16 | 1.35 / 0.65 | 0.61 / 0.63 | 1.96 |
| `choirOfferGlory: 1` | **0.89** | 2.39 | 0.38 | 0.24 | 0.84–1.09 / 0.96–1.03 | 0.94–1.07 | **1.21 / 0.89** | 0.67 / 0.65 | 2.01 |
| `choirOfferGlory: 2` | **1.74** | 1.67 | 0.41 | 0.21 | 0.88–1.07 / 0.85–1.13 | 0.97–1.05 | **1.10 / 0.85** | 0.66 / **0.71** | 1.68 |
| `choirOfferReaps` | **0.81** | 2.39 | 0.39 | 0.24 | 0.82–1.08 / 0.96–1.08 | 0.93–1.06 | 1.23 / 0.82 | 0.65 / 0.64 | 2.01 |
| `choirOfferDraw: 1` | 0.69 | 2.32 | 0.41 | 0.25 | 0.83–1.13 / 0.97–1.02 | 0.92–1.16 | 1.44 / 0.63 | 0.66 / 0.64 | 1.95 |
| `offerGlory: 1` (any Offer) | 0.57 | **3.58** | 0.26 | 0.24 | **0.90–1.05 / 0.96–1.04** | 0.92–1.08 | 1.36 / 0.70 | 0.63 / 0.67 | **2.69** |
| `choirSpoils: 'first'` | 0.76 | 2.39 | 0.39 | 0.22 | 0.82–1.07 / **0.80–1.20** | 0.91–1.04 | 1.30 / 0.76 | 0.66 / 0.67 | 2.10 |
| `choirSpoils: 'only'` | 1.02 | **0.39** | 0.59 | 0.27 | 0.89–1.07 / 0.89–1.20 | 0.93–1.08 | 1.39 / 0.61 | 0.62 / 0.66 | 1.61 |
| `offerTokens: false` | 1.53 | 0 | **0.68** | 0.18 | 0.89–1.06 / **0.83–1.20** | 0.92–1.16 | 1.43 / 0.71 | 0.67 / 0.66 | **1.42** |
| `choirOfferWeight: 2` | 0.38 | 2.82 | 0.38 | 0.26 | 0.90–1.12 / 0.92–1.08 | 0.97–1.14 | 1.29 / 0.75 | 0.65 / 0.67 | 2.05 |
| `tokenWeight: 1` | 0.35 | 2.47 | 0.45 | 0.21 | 0.89–1.08 / 0.87–1.17 | 0.91–1.17 | 1.42 / **0.49** | 0.60 / 0.61 | 2.12 |
| `offerFrom: 'hand'` | 0 | 1.62 | 0.33 | 0.17 | **0.80–1.22** / 0.91–1.05 | 0.95–1.03 | 1.44 / 0.65 | 0.64 / 0.68 | 1.90 |
| `offerFrom: 'both'` | 0.16 | 0.71 | 0.32 | 0.12 | **0.76–1.17** / 0.97–1.03 | 0.96–1.13 | 1.52 / 0.56 | 0.65 / 0.69 | 1.89 |
| `'both'`, no token Offers | 0.23 | 0 | 0.35 | 0.12 | 0.85–1.15 / 0.93–1.14 | 0.93–1.09 | 1.41 / 0.56 | 0.64 / 0.68 | 1.80 |

**What it says:**
- **Going back to the hand does not help.** From the hand, nobody Offers a Choir card (0). Even when both are allowed, almost nobody does (0.16), and the 4-player seats spread (to 0.76–1.22). The hidden hand Offer is simply the cheaper card. Offering only from the Choir should stay.
- **Four ideas roughly double Choir Offers (0.8–0.9) without hurting much:**
  - the free oldest-card Offer;
  - +1 Glory for a Choir Offer;
  - the Offered card still reaps tonight;
  - spoils first to Choir Offerers.

  Among them, the Glory reward also makes the dealt side matter less (1.21 / 0.89). The free oldest-card Offer gives perfect 3-player seats. Spoils first spreads the 3-player seats.
- **+2 Glory quadruples Choir Offers** (1.74) and makes the dealt side matter least of anything tested (1.10 / 0.85). But sides become easier to read (up to 71%) and skill drops (1.68): Offering from the Choir becomes the automatic move.
- **Taking token Offers away moves Choirs most** (0.68 flips) but costs skill (1.42) and the 3-player seats. With no tokens on the Altar, Days come down to the draw. Spoils only to Choir Offerers has the same effect in a milder form (tokens Offered 0.39).
- **+1 Glory for any Offer** mostly makes players Offer tokens (3.6 a game), so Choirs change less (0.26). It gives the highest skill measured (2.69) and very even seats, which is worth noting for balance, but it does not answer the Choir question.
- **Making a Choir card count double, or a token count 1, changes nothing:** the push was never the problem. The cost is: tonight's Reaping and the card's future Days.


## 3. Exploits: free-riding comes back

300 games a strategy, ±0.1. Above 1, the fixed strategy beats the strong bots.

| Variant | Never a Choir card | Always a Choir card | Never a token | **Never Offer** | Always Offer |
|---|---|---|---|---|---|
| current (base) | 0.92 | 0.56 | 0.62 | 1.07 | 0.21 |
| `oldestFree` | 1.02 | 0.55 | 0.71 | **1.24** | 0.20 |
| `choirOfferGlory: 1` | 0.98 | 0.70 | 0.66 | **1.26** | 0.17 |
| `choirOfferGlory: 2` | 0.77 | 0.90 | 0.90 | **1.24** | 0.10 |
| `choirOfferReaps` | 0.84 | 0.63 | 0.61 | 1.09 | 0.20 |
| `choirOfferDraw: 1` | 1.02 | 0.63 | 0.62 | **1.28** | 0.15 |
| `offerGlory: 1` (any Offer) | 1.00 | 0.48 | 0.46 | **0.81** | 0.51 |

- **Never Offering wins as soon as the others Offer more.**
  - A player who never Offers keeps every token for the end and spends each turn Gathering or Exalting, often taking what the others put on the Altar.
  - Every idea that makes Choir Offers more common feeds that player.
  - This is free-riding on the public good, the one thing principle 1 must not let win.
- **The base itself is at the edge** (1.07, within noise). It was 0.88 before the bots learned turnover: the fixed bots Offer Choir cards a little more, which feeds the free-rider. The 1,200-game finals will settle it.
- **Only a reward for every Offer pushes free-riding down** (`offerGlory: 1`, never Offering 0.81). It pays the act of contributing, whatever is given. Alone it moves Choir Offers only a little (0.57).
- **The Glory reward makes Choir Offers a real option** (always Offering a Choir card: 0.90 with +2, from 0.56).

So the fix has two jobs: make the Choir Offer worth making, and keep never Offering a losing line. Round 2 pairs `offerGlory: 1` with each Choir Offer idea (`results/offers-r2.jsonl`).

## 4. Round 2: a reward for every Offer, plus one for the Choir

`offerGlory: 1` with each Choir Offer idea (300 games a mode; `results/offers-r2.jsonl`):

| `offerGlory: 1` plus | Choir Offers | Token Offers | Choir flips | Seats 4p / 3p | Mixes 4p | With / against 4p | Reader 4p / 3p | Skill |
|---|---|---|---|---|---|---|---|---|
| (base, neither) | 0.40 | 2.79 | 0.38 | 0.90–1.10 / 0.88–1.09 | 0.95–1.04 | 1.34 / 0.80 | 0.64 / 0.64 | 1.97 |
| `choirOfferGlory: 1` (a Choir Offer pays 2 in all) | **1.27** | 2.97 | 0.30 | **0.93–1.06** / 0.86–1.09 | 0.86–1.08 | 1.36 / 0.68 | 0.66 / 0.66 | 2.62 |
| `choirOfferReaps` | 1.20 | 3.03 | 0.33 | 0.90–1.12 / **0.97–1.04** | 0.83–1.08 | 1.28 / 0.60 | 0.66 / 0.67 | 2.51 |
| `choirSpoils: 'first'` | 1.04 | 2.95 | 0.33 | 0.87–1.08 / 0.91–1.07 | **0.98–1.07** | **1.26 / 0.82** | 0.64 / 0.67 | **2.63** |
| `oldestFree` | 1.38 | 3.11 | 0.36 | **0.79–1.23** / 0.95–1.05 | 0.96–1.23 | 1.47 / 0.61 | 0.62 / 0.66 | 1.90 |

Exploits (300 games, ±0.1):

| Variant | Align | Hedge | No token | Always Offer | **Never Offer** | Never Gather | Never a Choir card | Always a Choir card |
|---|---|---|---|---|---|---|---|---|
| + `choirOfferGlory: 1` | 0.93 | 1.04 | 0.69 | 0.31 | **0.91** | 0.67 | 0.91 | 0.68 |
| + `choirOfferReaps` | 0.90 | 0.78 | 0.51 | 0.34 | 1.00 | 0.94 | 0.85 | 0.51 |
| + `choirSpoils: 'first'` | 1.01 | 1.02 | 0.42 | 0.45 | 0.99 | 0.90 | 1.08 | 0.44 |

- **Choir Offers triple** (1.0–1.4 a game, from 0.40) in every pairing, and skill rises to 2.5–2.6. The point for every Offer seems to reward reading the Day.
- **Choir colors change a little less** (0.30–0.36 against 0.38). Players now Offer from the Choir and refill it from the Altar or the hand, often with the same color, so the mix holds.
- **The free oldest-card Offer drops out:** a seat at 1.23 and skill back at 1.90.
- **The Glory pairing is the leader.** Every fixed strategy is at or below even within noise (hedge 1.04, never Offer 0.91), and the 4-player seats are the tightest (0.93–1.06).
  - The pairing with the card still reaping tonight is close, with the best 3-player seats, but never Offering sits at 1.00.
  - Spoils first gives the fairest deal, but never Offering a Choir card wins (1.08): the Choir Offer is still optional there.

**Finalists** at 1,200 games: `offerGlory: 1` + `choirOfferGlory: 1`, and the base, whose never-Offer result (1.07) needs confirming (`results/offers-final.jsonl`).

## 5. Finals (1,200 games; exploits at 600)

| | Current core | **`offerGlory: 1` + `choirOfferGlory: 1`** |
|---|---|---|
| Choir Offers / player | 0.40 | **1.27** |
| Choir flips / side flips | 0.37 / 0.24 | 0.30 / 0.24 |
| Seats 4p / 3p | 0.91–1.09 / 0.94–1.05 | 0.93–1.11 / 0.88–1.09 |
| Mixes 4p | 0.98–1.03 | 0.97–1.09 |
| With / against | 1.22 / 0.71 | 1.30 / 0.73 |
| Reader 4p / 3p | 0.65 / 0.65 | 0.66 / 0.65 |
| Skill | 2.03 | **2.45** |
| Exploits | never Offer **1.02**, never a Choir card **1.04**, hedge 0.94, align 0.89 | all ≤ 0.96 (align 0.96, never a Choir card 0.96, never Offer 0.94, hedge 0.91, never Gather 0.71, never a token 0.59, always a Choir card 0.57, always Offer 0.36) |

- **The base confirms the problem:** never Offering breaks even, and never Offering a Choir card does slightly better than strong play. "Offer only from the Choir" is a rule players can ignore.
- **The finalist holds:** Choir Offers triple, skill rises, and every fixed strategy loses.
- Without spoils, the reward does not hold (skill 1.41; never a Choir card 1.03, align 1.06), so spoils stay.

Whether this reward is faithful to the vision, given that V45 removed a Glory reward for Offering, is argued in `the-world.md` (Section 6), which compares it with every other route.
