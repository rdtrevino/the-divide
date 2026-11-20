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

Next: exploit checks on the leaders (`results/offers-exploits.jsonl`), with the strategies that matter here: never Offer a Choir card, always Offer one, never Offer a token, never Offer, always Offer.
