# The World: the game most faithful to the vision

November 21, 2026. Robert asked me not to follow his recommendations. Instead, he asked me to go back through all the research, decide which version of The Divide is most faithful to `vision.md` (no patches, nothing that overcompensates), and propose something new.

**A study and a proposal, not adopted.** The engine has a new switch (`endScore: 'eligible'`); nothing else in the rules, the cards or the site has changed.

## 1. What all the research says, in six lessons

From V44 through 45 core studies, the token rounds, spoils, the flow, the flow fixes and Choir Offers:

1. **Secret mixed tokens are the right way to hide a side behind a public Choir.** Only the token versions made every simple strategy lose (championship, `the-game-now.md`), and they hide sides best with Choirs face up.

2. **Every way of paying a player for contributing turns the public good private.** This happened three times:
   - V44's +1 Glory per Offer;
   - the wagers of the rework;
   - and this week's leader, +1 Glory per Offer and 2 from the Choir (`choir-offers.md`), which is V44's rule back again.

   V45 removed exactly that "because paying for Offers made them private goods". It measures well, but it is the vision going backwards.

3. **Free-riding comes back whenever the score is smooth.** "Each token × the Days its side won" pays every holder a little for every Day. One Offer moves your own score by only a share of what it gives the table: the textbook public-goods trap. Every fix since has been a patch on that payoff:
   - a penalty: the Miser, or no offering, no harvest, which forced hedging and made sides 70% readable;
   - a share: spoils, which made the game less skillful (1.65);
   - or a payment (lesson 2).

4. **Hedging comes from paying the Choir by its color, whatever your side.** A Choir of the other color is insurance. The vision names this tension itself ("Engine versus Tide: ... its payoff should depend on your side winning. Otherwise it becomes a separate game beside the Altar"), and Devotion was a patch for it.

5. **A secret side moves only if tokens move and the side is decided by which color you hold more of** (the flow study, 0.00 changes before).

6. **The flow and its fixes drifted from three load-bearing pieces:**
   - **The Offer is a hidden contribution.** Offering from the Choir, face up, makes it watched, not trusted. That is why nobody does it: a card in the Choir is worth more than a push of 1, so the token does all the work.
   - **First Fruits are "the one honest card, the read that starts every bluff".** Facedown, they are noise.
   - **Gather is double-edged.** Into the hand, taking the enemy's card costs nothing.

## 2. What is missing: rank within the side

The vision lists two load-bearing pieces as *missing*. The secret side came back with the tokens. **Rank within the side never did.**

> "Faction victory makes you eligible. Glory makes you the winner. Neither is enough on its own, and **that gap is where the game lives**." (first rulebook)

Every token version replaced that gap with a smooth sum. Lessons 3, 4 and 5 are all symptoms of the same loss:
- **Free-riding:** with a sum, one Offer is a small share; with a gap, it can decide whether you can win at all.
- **Hedging:** with a sum, a Choir of the other color is insurance; with a gap, every Day it pays you pushes the world away from you.
- **A side that never moves:** with a sum, a token is a point; with a gap, one token can change which side you are on.

## 3. The proposal: the World

The V45 turn, with one rule changed at the end and two rules removed:

**Setup:** as V45. Deal 6 allegiance tokens each, a hand of 3 and a starting Choir of 2. The game lasts 7 Days, the last one Judgment Day.

**Each Day:**
1. **First Fruits:** everyone puts a card facedown; shuffle them and turn them face up on the Altar; everyone draws 1. This is the honest card.
2. **One action each:**
   - **Offer** a card from your hand facedown, or a token facedown (it counts 2);
   - **Gather** a card from the Altar into your Choir, or a token into your tokens;
   - **Exalt** a card from your hand into your Choir.
3. **Evening:**
   - shuffle the Offers and reveal them; the heavier side wins the Day;
   - **every Choir card of the winning color scores 2 Glory**;
   - leftover tokens go to whoever holds the fewest;
   - draw back to 3.

**The end: the world, then the Glory.**
- The side that won more Days is **the world's**.
- **Only players who hold more tokens of that side may win**; among them, most Glory wins.
- **If the Days are tied, the world is in balance:** only players with tied tokens may win (the Forsaken, back from the first rulebook without a single extra component).
- If nobody qualifies, most Glory wins.

**Removed:**
- tokens scoring points (no "tokens × Days" arithmetic);
- no offering, no harvest;
- spoils, Offering from the Choir, facedown First Fruits, Gather into the hand, turnover.

**Why each piece should work** (to be measured below):
- **Self versus side (principle 1), without a penalty or a payment.** The world is a threshold public good: below it, everyone on the side loses; above it, the one who gave least wins. Offering is rational exactly when the race is close, and free-riding exactly when it is not. That is the vision's "the best players are the ones who know when to switch".
- **The engine plugs into the side (principle 5).** Your Choir earns the Glory, but Glory counts only if your side takes the world. A Choir of the enemy color still pays, but only on Days that push the world away from you. Insurance now costs eligibility, so hedging becomes the dilemma rather than an escape from it.
- **Allies are rivals (principle 1, test 4).** This is literal: you need your allies to win the world, then you must beat them.
- **Allegiance shifts (principle 2).** Your side is the color you hold more of. Gathering a token off the Altar, or Offering one, can change it. That is the Turn, built into the core: a player stuck behind an ally can switch sides and work against them (the Pax Pamir quality Robert admires).
- **The Forsaken (dormant idea, kept).** Tied tokens are a third interest that profits from a balanced world, with no extra rule.
- **The least complexity (principle 6).** The end score becomes one comparison and a Glory count. There is no token arithmetic, no harvest rule and no spoils draft.

**The risks to measure:**
- players who know they cannot qualify become spoilers (kingmaking);
- the deal may matter more, because of the cliff;
- hedging may survive;
- seat fairness.

Variants tested alongside (`tools/sim/variants.ts`):
- `worldH`: with no offering, no harvest;
- `world7`: 7 tokens each, so nobody starts tied;
- `worldFT`: a token may be First Fruits, so tokens move more;
- `worldTurn`: with turnover;
- `worldSpoils`: with spoils to the Offerers.

The comparisons are V45 and the current branch core (the flow with turnover and Gather into either).

Results: `tools/sim/results/world-r1.jsonl` (200 games a mode, ±0.12).

## 4. Results: the World hides sides best, but it does not hold

200 games a mode (±0.12), strong bots in every seat. Skill is one strong bot among three heuristic bots. "With / against" is your win share when the side you were dealt more of won more Days, and when it lost.

| | Reader 4p / 3p | Seats 4p / 3p | Mixes 4p | With / against | Side flips | Skill |
|---|---|---|---|---|---|---|
| Current core (1,200 games) | 0.65 / 0.65 | 0.91–1.09 / 0.94–1.05 | 0.98–1.03 | 1.22 / 0.71 | 0.24 | 2.03 |
| V45 | 0.69 / 0.72 | 0.97–1.05 / 0.96–1.04 | 0.73–1.05 | 1.22 / 0.75 | 0.05 | 1.73 |
| **World** | 0.59 / 0.63 | 0.82–1.28 / 0.88–1.22 | 0.88–1.08 | **1.84 / 0.24** | 0.07 | **1.11** |
| World, no offering, no harvest | 0.60 / 0.66 | 0.83–1.24 / 0.89–1.19 | 0.77–1.13 | 1.60 / 0.45 | 0.09 | 1.09 |
| World, 7 tokens | 0.65 / 0.69 | 0.81–1.21 / 0.73–1.16 | 0.55–1.14 | 1.55 / 0.36 | 0.21 | 1.33 |
| **World, tokens as First Fruits** | **0.53 / 0.49** | 0.88–1.14 / 0.98–1.04 | 0.96–1.14 | 1.26 / 0.78 | 0.25 | 1.12 |
| World, turnover | 0.55 / 0.57 | 0.84–1.35 / 0.89–1.16 | 0.78–1.10 | 1.67 / 0.33 | 0.06 | 1.53 |
| World, spoils | 0.60 / 0.58 | 0.95–1.10 / 0.83–1.10 | 0.92–1.02 | 1.45 / 0.27 | 0.14 | 0.89 |
| The world's gate on majority scoring (V45 turn, tokens as First Fruits) | 0.56 / 0.51 | 0.82–1.16 / 0.89–1.13 | 0.89–1.07 | 1.09 / 0.99 | 0.33 | 1.27 |
| The same, without First Fruits tokens | 0.78 / 0.77 | 0.85–1.12 / 0.78–1.33 | 0.81–1.08 | 2.09 / 0.11 | 0.05 | 1.25 |
| The gate on V45 scoring (tokens as First Fruits) | 0.54 / 0.58 | 0.84–1.15 / 0.75–1.32 | 0.94–1.03 | 1.24 / 0.84 | 0.38 | 1.43 |
| The current core with the gate | 0.54 / 0.50 | 0.85–1.16 / 0.79–1.15 | 0.89–1.07 | 1.47 / 0.76 | 0.53 | 1.76 |

Exploits (200 games, ±0.12): World: never Offer **1.16**. World with tokens as First Fruits: never Gather **1.25** (a blind token can flip your side, so staying off the Altar is safe), hedge 1.07. The gate on V45 scoring: never Offer 1.07, hedge 1.09.

**Where the skill went** (`tools/sim/skill-split.ts`: how often a strong bot ends on the world's side, against heuristic bots, and its Glory):

| 160 skill games | On the world's side, strong / heuristic | Glory, strong / heuristic | Skill (rollouts to the end of the Day) | Skill (rollouts to the end of the game) |
|---|---|---|---|---|
| Current core | **60% / 33%** | 44 / 38 | 2.00 | 1.86 |
| V45 | 41% / 32% | 39 / 36 | 1.76 | **2.06** |
| World | — | — | 1.11 | 1.22 |
| World, tokens as First Fruits | 38% / 35% | 23 / 24 | 1.16 | 1.06 |
| Gate on V45 scoring | 59% / 45% | 40 / 40 | 1.43 | 1.27 |
| Gate on majority scoring | 56% / 37% | 36 / 36 | 1.35 | 1.19 |
| Current core with the gate | 66% / 39% | 37 / 35 | 1.69 | 1.48 |

**What it says:**
- **The World hides sides better than anything measured in the engine** (49–58%, where guessing is 50%), when tokens can be First Fruits. The gap does what the vision says about secrecy.
- **But it turns the game toward luck.**
  - Being on the world's side is all or nothing, and one Day can swing it.
  - With fixed sides, the deal decides (1.84 / 0.24).
  - With moving sides, skill collapses (1.1–1.4): the strong bot cannot steer onto the winning side much better than a simple one, and Choir Glory takes little skill.
- **It is not the bot's short sight.** Given rollouts to the end of the game, the strong bot gains skill in V45 (2.06) but not in any World variant (1.06–1.48).
- **Free-riding is not solved either** (never Offering 1.07–1.16 without First Fruits tokens), and the 3-player seats spread.

**Verdict: the World is rejected.** The vision's sentence is right about the gap, but a hard gate puts the gap in the wrong place: it makes the side decide too much, or chance decide too much. The first rulebook had 4–6 players and hidden Fates, where a side is a team of several; at 3–4 players, with tokens, the smooth score was right all along. What carries over is the evidence that **moving tokens (tokens as First Fruits) hide sides best**.
