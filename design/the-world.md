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

## 5. The vision's own turn, with what the studies proved

The V45 turn (Offers from the hand facedown, First Fruits face up, Gather into the Choir), plus the two pieces proven to move and hide sides: a token may be First Fruits (everyone draws, so nobody is spotted), and majority scoring. Three answers to free-riding (200 games a mode):

| | Reader 4p / 3p | Seats 4p / 3p | With / against | Side flips | Skill |
|---|---|---|---|---|---|
| with no offering, no harvest | 0.64 / 0.63 | 0.86–1.19 / 0.95–1.03 | 1.09 / 0.77 | 0.24 | 1.62 |
| with no rule | 0.59 / 0.67 | 0.79–1.12 / 0.78–1.14 | 1.36 / 0.64 | 0.16 | 1.44 |
| with spoils to the Offerers | 0.64 / 0.65 | 0.86–1.14 / 0.94–1.07 | 1.42 / 0.51 | 0.21 | 1.88 |
| with Devotion | 0.57 / 0.55 | 0.85–1.17 / 0.93–1.08 | 1.09 / 0.95 | 0.30 | 1.42 |

None beats the current core (skill 2.03, seats 0.91–1.09 / 0.94–1.05).
- **Going back to hidden Offers from the hand costs skill and fairness** every time it has been tried: here, in `choir-offers.md` (seats to 0.76–1.22) and in the flow study.
- In the current core the hidden contribution survives anyway: it is the token, Offered facedown about 3 times a game each.

## 6. The answer

After every route above, the evidence points to **the current core with one change: every Offer earns 1 Glory, and an Offer from your Choir earns 2** (`offerGlory: 1`, `choirOfferGlory: 1`; `choir-offers.md`).

At 1,200 games, with exploits at 600:

| | Current core | **With the Offer reward** |
|---|---|---|
| Choir Offers / player | 0.40 | **1.27** |
| Sides move (side flips) | 0.24 | 0.24 |
| Reader 4p / 3p (guessing 50%; the vision's target 60–75%) | 0.65 / 0.65 | 0.66 / 0.65 |
| Seats 4p / 3p | 0.91–1.09 / 0.94–1.05 | 0.93–1.11 / 0.88–1.09 |
| Mixes 4p | 0.98–1.03 | 0.97–1.09 |
| With / against the world | 1.22 / 0.71 | 1.30 / 0.73 |
| **Skill** | 2.03 | **2.45** |
| Never Offer | **1.02** | **0.94** |
| Never Offer a Choir card | **1.04** | 0.96 |
| Always Offer | 0.21 | 0.36 |
| Best fixed strategy | 1.04 | 0.96 (align, never a Choir card) |

**Why this is faithful, and not the V44 mistake I first took it for:**
- **V44 paid +1 Glory for an Offer from the hand,** where cards refill for free, so Offering cost almost nothing and always Offering came close to a fair share (0.83). The dilemma was gone.
- **Here an Offer costs something real:** a token (part of your side and your score) or a Choir card (part of your engine, in public). The point repays part of that price, but not all of it: always Offering loses (0.36), and so does never Offering (0.94). The decision is *when*, which is principle 1's "the best players are the ones who know when to switch".
- The reward sets the price of contributing; it does not turn the contribution into a private good.
- **The Choir Offer becomes the act the flow wanted:** a public, provable sacrifice, made more than once a game, beside the hidden token Offer.

**What I tried and rejected on the way** (all in this file or `choir-offers.md`):
- the World and its gate (luck);
- the vision's turn with hidden hand Offers (less skill, less fair);
- First Fruits face up: the honest card gives the fairest seats (0.94–1.06 / 0.95–1.03) and more skill (2.63), but it brings hedging back (alignment −0.55), makes sides easier to read (0.68) and lets lopsided deals pay (1.25);
- the reward without spoils (skill 1.41; never a Choir card 1.03, align 1.06);
- the swap, the free oldest-card Offer, the card that still reaps, spoils first to Choir Offerers, a drawn card, no token Offers, weights.

### Against the vision

- **1. Self versus side:** sharper.
  - An Offer gives up a piece of your side (a token) or your engine (a Choir card) for the Day.
  - The point makes the trade close, not free.
  - Every simple plan loses.
- **2. Uncertain allegiance:**
  - sides move (0.24 a game per player, against 0.00 before the flow);
  - the reader is at 65–66%, inside the target, though not as low as the World (50%).
- **3. The Altar as a contest:**
  - tokens Offered facedown and drafted as spoils;
  - Choir cards Offered face up, provable and open to doubt ("I gave my Hymn for Light: was it the card turnover would have taken anyway?").
- **4. Allies are rivals:** spoils go to every Offerer, whatever they gave, so your ally's token may go home with your rival.
- **5. Checkable:** the Glory is taken the moment you Offer.
- **Core or patch?** It changes the payoff of the core action, not a cap, a catch-up or a tiebreak. It is a reward, the kind the vision warns about, and the case for it rests on the measured fact that the dilemma survives it.

**Rules a new player learns:** about 22 points, one more than the current core ("an Offer earns 1 Glory, 2 from your Choir").

### What the bots cannot show

- **Whether people feel the point as "paid to vote".** The numbers say the dilemma survives; the feeling is a question for a table.
- **Talk around face-up sacrifices.** A Choir Offer is now common and provable: does it become a currency for deals, or a bluff ("I gave a card that was leaving anyway")?
- **Reading sides by eye.** The reader is a card-counter; people read faces and draft choices.
- **The World at 5–6 players.** The gate failed at 3–4, where a side is one or two people. With 5–6 players and teams of three, the first rulebook's gate might be right again. That is worth a test if the game grows.
- **Skill numbers are biased for variants:** the heuristic bots learn each new rule imperfectly.
