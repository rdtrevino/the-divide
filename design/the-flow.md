# Robert's flow: Offer from the Choir, facedown First Fruits, spoils, and how to score

November 20, 2026. Robert's idea, which combines many things tested before:

> The First Fruits are placed downward. You can place a card or a token. You can only Offer from your Choir: this is where it becomes very costly to Offer, and it introduces Choir changing. Offering also becomes more costly because it would be face up, or you can still Offer a token facedown. You could also Gather a card from the Altar (face up or facedown) and play it to your Choir (or maybe to your hand). Or you can Exalt from your hand to your Choir. There is never a card that goes from your hand to the Altar (unless that's its ability). Spoils go back to the people who Offered that Day, one by one by some metric (who went first, lowest score…). The Altar scoring: 1 or 2 for every card of the winning alignment, the difference of your Choir, or 3/1 by whether you match alone or with others. At the end, the bonus of each token × the Days its side won, and variations of it.
>
> Test as many as you can and get back to me on the best combination. (The Turn as a card ability: later, once the core is solid.)

**A study and a recommendation, not adopted.** Nothing in the rules, the site or the cards has changed.

## 1. The pieces

Base for everything: **spoils to the Offerers** (Robert's assumed direction, `spoils-and-economy.md`): no harvest rule; after a won Day, everyone who Offered takes the Altar's cards (into hand, limit 5) and tokens, one at a time in turn order.

| # | Piece | Serves (`vision.md`) | Builds on | Risks repeating |
|---|---|---|---|---|
| A | **Offer only from your Choir**, face up (the card is public: everyone saw it leave) | 1. Self vs side made literal: every push costs your own engine. 5. The engine plugs into the tension. Choirs change | Offer from the Choir *as an option* (`spoils-and-economy.md` §4): Choirs barely moved (0.29 flips), token Offers vanished | 2 and 3: a face-up, attributable Offer is "watched, not trusted"; the facedown Offer was adopted (V35) so a contribution could be doubted. And any rule that rewards keeping your engine over contributing let never Offering win (turnover 1.16, withering 1.46) |
| B | **First Fruits facedown** until the Evening reveal | 2, 3: the whole Altar is hidden while people act | Pandemonium (an Event that already does this) | 4: First Fruits face up are "the one honest card, the read that starts every bluff". Facedown, Gathering becomes partly blind: luck, not reads |
| C | **A token may be given as First Fruits** (anonymous) | 2: tokens move more, so allegiance could shift (the root cause found last time) | Tokens as First Fruits in the lab (`tokens-and-offering.md` §2) | Cheaper token play made uneven token mixes matter more (4p mixes 0.81–1.14) |
| D | **Gather into the Choir or into the hand** | 3: the Altar as a commodity | The market (`spoils-and-economy.md`): Gathering into hand with 1 draw a Day spread seats (0.87–1.24) | With a full refill instead, unknown |
| E | **Exalt** hand to Choir | 5 | unchanged | |
| F | **Spoils to that Day's Offerers**, in an order: turn order, reverse, lowest Glory first | 1: contributing earns a share | Spoils to Offerers stopped free-riding (0.96) in turn order; reverse spread seats (0.71–1.50 with turnover) | Lowest Glory first is a catch-up, which the vision calls a last resort |
| G | **The Reaping**: 2 or 1 a card (now 2); the difference of your Choir (`net`); 3 alone / 1 shared by Choir lean (`crowd`) | `net`: 1 and 2 (a mixed Choir earns nothing, so no hedge). `crowd`: 4 (allies are rivals) | Choir pays 1: no gain (`core-validation.md`). V44's Reaping by lean | `crowd` is V44's coalition crowding, listed in the vision as a patch; it caused herding |
| H | **The end score**: each token × the Days its side won (now); only your majority color (`majority`); only the side that won more Days (`winner`); (your Light − Dark tokens) × (Light − Dark Days) (`net`, can sink) | `majority`: 2, a single side that can change when tokens move. `winner`: the original "faction victory makes you eligible". `net`: the vision's "hidden stake that can sink" | Tokens scoring 2: more readable | `net` puts losses back (Robert wants rewarding, not punishing) |

Two **better versions** were added, from the risks above:
- **A Choir Offer counts 2** (like a token), so the cost buys a real push (`rWeight2`).
- **Offer from the hand (facedown) or the Choir (face up)** (`rBoth`), keeping the trusted-not-watched Offer while adding the costly one.

How it was tested: every piece is a switch in the engine's `rules.ts` (`offerFrom`, `choirOfferWeight`, `fruits`, `fruitsToken`, `gatherTo`, `spoilsOrder`, `reap`, `endScore`); the strong (Monte Carlo) bot plays every seat (`tools/sim/core.ts`, the same 300 deals for every variant; noise about ±0.1 on a seat or a win rate); fixed strategies are checked with `exploits.ts`. The bots' value functions were taught each new scoring (`bots.ts`: `tokensValue`, `choirStake`), and the strong bot treats a First Fruits token as a coin flip, since no one knows who gave it. Results: `tools/sim/results/flow-r1.jsonl` to `flow-r3.jsonl`, `flow-final.jsonl`, `flow-exploits.jsonl`, `flow-final-exploits.jsonl`.

## 2. The answer in short

**Recommended for a playtest: the Choir Offer + First Fruits tokens + tokens scoring only for your majority color** (`rMajUp`), on spoils to the Offerers. Or, if Robert wants every part of his flow, the same with **First Fruits facedown and Gathering into the hand** (`rMajGH`). Both are confirmed at 1,200 games (Section 6).

- **It is the first rule set in this whole study that makes secret sides move**: a player's majority color changes 0.21–0.25 times a game (0.00 in every earlier version), while the table still reads sides only 60–65% of the time.
- **It is fair**: seats 0.96–1.03 (4p) and 0.94–1.04 (3p) for `rMajUp`. The luck of the deal matters less (holding the side that wins: 1.24 against 0.61, from 1.60 against 0.47).
- **Every fixed strategy loses**, including never Offering (0.97) and never Offering a token (0.71).
- **What makes it work is not what it looked like.** The three pieces only work together: First Fruits tokens make tokens move; Offering only from the Choir makes the token the usual Offer, so tokens keep moving; scoring only your majority color makes a moving token change your side, and removes the 4-player seat skew the tokens caused.
- **Pushback, with data:** strong players almost never Offer a Choir card (0.4–0.6 a game each). "Offer from the Choir" in practice means "Offer a token". Choirs do not change more (0.17–0.27 flips, as before). The pieces that did not earn a place: the spoils order (turn order is best), the Reaping variants (keep 2 a card), the "net" and "winner" end scores, a Choir Offer counting 2, and Offering from the hand or the Choir.

## 3. Round 1: the full idea, each piece left out, each piece alone, the variations

300 games each, strong bots in every seat. S = spoils to the Offerers (the base, `offererSpoils`); R = S + Offers only from the Choir + First Fruits facedown + a token allowed as First Fruits (`rFull`).

What the columns say, against the vision: **reader** = how often a fitted reader names a player's side from public facts (50% is guessing; principle 2 wants it low); **seats** = win rate by seat, 1.00 is fair (principle 9); **skill** = how much a strong bot beats heuristic bots (principle 4, though biased for variants: it partly measures how much the heuristic misreads a new rule); **side flips** = how often a player's majority token color changes during the game (principle 2, "allegiance shifts"); **Choir flips** = how often a Choir's lean changes (Robert's "Choir changing"); **with/against the world** = win rate when your dealt tokens match the side that won more Days, and when they do not (the luck of the deal; principle 4).

| Variant | Reader 4p/3p | Seats 4p / 3p | Skill | Side flips | Choir flips | Offer/Gather/Exalt 4p | Per player: token Offers / Choir Offers / First Fruits tokens | With/against the world |
|---|---|---|---|---|---|---|---|---|
| S (`offererSpoils`) | 0.59 / 0.62 | 0.84–1.09 / 0.93–1.05 | 1.65 | 0.00 | 0.26 | 42/35/23% | 0.6 / 0.0 / 0.0 | 1.60/0.47 |
| **R, the full idea** (`rFull`) | 0.60 / 0.62 | **0.69–1.40** / 0.98–1.02 | 1.95 | 0.11 | 0.25 | 35/40/25% | 1.9 / 0.5 / 1.8 | 1.37/0.62 |
| *Left out:* Offers from the hand (`rHandOffer`) | 0.59 / 0.60 | 0.85–1.07 / 0.95–1.05 | 1.80 | 0.07 | 0.21 | 47/35/18% | 0.8 / 0.0 / 1.7 | 1.18/0.65 |
| First Fruits face up (`rFruitsUp`) | 0.61 / 0.62 | 0.73–1.23 / 0.88–1.09 | 2.32 | 0.12 | 0.26 | 35/41/24% | 1.9 / 0.5 / 1.7 | 1.18/0.63 |
| No First Fruits token (`rNoFruitToken`) | 0.54 / 0.54 | 0.92–1.09 / 0.96–1.06 | 1.47 | 0.01 | 0.27 | 29/41/29% | 1.5 / 0.6 / 0.0 | 1.54/0.49 |
| No spoils (`rNoSpoils`) | 0.58 / 0.56 | 0.85–1.31 / 0.91–1.15 | 1.99 | 0.07 | 0.23 | **16**/43/41% | 0.8 / 0.3 / 2.1 | 1.34/0.63 |
| *Alone on S:* Offers only from the Choir (`sChoirOnly`) | 0.61 / 0.63 | 0.93–1.06 / 0.97–1.02 | 1.87 | 0.01 | 0.30 | 30/44/26% | 1.6 / 0.5 / 0.0 | 1.48/0.50 |
| First Fruits facedown (`sFruitsDown`) | 0.55 / 0.56 | 0.80–1.24 / 0.86–1.16 | 1.33 | 0.00 | 0.21 | 47/30/23% | 0.6 / 0.0 / 0.0 | 1.39/0.46 |
| A token as First Fruits (`sFruitToken`) | 0.60 / 0.64 | 0.75–1.28 / 0.83–1.11 | 2.14 | 0.09 | 0.20 | 45/37/18% | 0.7 / 0.0 / 1.7 | 1.36/0.68 |
| Gather into the hand (`sGatherHand`) | 0.56 / 0.62 | 0.95–1.05 / 0.92–1.09 | 2.05 | 0.01 | 0.16 | 36/29/35% | 0.6 / 0.0 / 0.0 | 1.34/0.56 |
| *Variations on R:* Gather into the hand (`rGatherHand`) | 0.59 / 0.68 | 0.92–1.10 / 0.82–1.09 | 2.34 | 0.12 | 0.15 | 38/28/34% | 2.3 / 0.4 / 1.8 | 1.16/0.76 |
| Spoils in reverse order (`rRev`) | 0.59 / 0.64 | 0.60–1.57 / 0.81–1.34 | 2.06 | 0.13 | 0.24 | 42/38/20% | 2.4 / 0.6 / 1.8 | 1.23/0.68 |
| Spoils lowest Glory first (`rGlory`) | 0.58 / 0.62 | 0.68–1.22 / 0.89–1.16 | 1.99 | 0.14 | 0.24 | 37/39/24% | 2.0 / 0.6 / 1.8 | 1.22/0.60 |
| Choir pays 1 a card (`rPay1`) | 0.57 / 0.58 | 0.87–1.12 / 0.87–1.21 | 1.71 | 0.02 | **0.33** | 26/46/28% | 1.0 / 0.9 / 0.6 | 1.48/0.49 |
| Reaping: the difference of your Choir (`rNet`) | 0.64 / 0.69 | 0.86–1.37 / 0.80–1.24 | 2.06 | 0.16 | 0.17 | 40/34/26% | 1.9 / 0.8 / 1.9 | 1.20/0.71 |
| Reaping: 3 alone, 1 shared (`rCrowd`) | 0.63 / 0.68 | 0.91–1.09 / 0.88–1.11 | 1.98 | 0.12 | 0.17 | 39/37/24% | 1.9 / 0.8 / 1.8 | 1.31/0.69 |
| **End: majority color only** (`rMajority`) | 0.58 / 0.64 | **0.92–1.04** / 0.82–1.15 | 1.78 | **0.19** | 0.24 | 38/39/23% | 2.2 / 0.5 / 2.4 | 1.42/0.54 |
| End: the side that won more Days only (`rWinner`) | 0.59 / 0.65 | 0.70–1.12 / 0.97–1.06 | 1.71 | 0.17 | 0.27 | 36/40/24% | 2.0 / 0.5 / 2.1 | 1.42/0.48 |
| End: (Light − Dark tokens) × (Light − Dark Days) (`rEndNet`) | 0.65 / 0.67 | 0.87–1.09 / 0.89–1.06 | **1.30** | **0.34** | 0.20 | 51/20/29% | 3.3 / 0.3 / 3.7 | 1.13/0.85 |
| A Choir Offer counts 2 (`rWeight2`) | 0.59 / 0.62 | 0.74–1.34 / 0.98–1.02 | 2.02 | 0.10 | 0.26 | 35/39/26% | 1.9 / 0.6 / 1.8 | 1.20/0.63 |
| Offer from the hand or the Choir (`rBoth`) | 0.60 / 0.61 | 0.87–1.27 / 0.87–1.11 | 1.86 | 0.05 | 0.19 | 47/34/19% | 0.2 / 0.1 / 1.7 | 1.30/0.62 |

## 4. What each piece does

**A. Offer only from the Choir.** Strong players Offer a Choir card about once every two games each, in every variant. A Choir card brings about 1 Glory for each Day left, and a push of 1 is rarely worth that; even counting 2 (`rWeight2`) it stays at 0.6 a game and seats spread. Given the choice (`rBoth`), Choir Offers vanish (0.1) and token Offers with them (0.2). So the piece does not make Choirs change (flips 0.25, as before). **What it does do:** with no cards to Offer from the hand, the token becomes the usual Offer (0.6 → 1.9–2.4 a game each), and that keeps tokens moving. Round 3 proves it is needed: with Offers from the hand again, never Offering a token wins (1.21–1.23, Section 5). **Keep**, but for a different reason than expected. The worry from earlier results (a face-up Offer is "watched, not trusted") is real but small, because the token, the usual Offer, is still facedown.

**B. First Fruits facedown.** Alone it hurts: skill falls (1.33) and seats spread (0.80–1.24), because Gathering blind is luck. In the finalists it is a close call (Section 6): face up is fairer and gives the "one honest card" read; facedown makes never Offering lose by more (0.88 against 0.97–1.01). **Optional; face up recommended** (principle 4, and one less change to the game people know).

**C. A token as First Fruits.** The piece that makes sides move: side flips 0.00 → 0.09 alone, and 0.11 in R; take it out of R and they fall to 0.01. It also cuts the luck of the deal (against the world 0.47 → 0.62–0.68). But with tokens scoring as now, it makes 4 players unfair (first seat 1.40, last 0.69 in R): the early seats end with more tokens (6.5 against 5.1, from the spoils draft and Gathering). Changing the spoils order does not fix it (reverse 0.60–1.57; lowest Glory first 0.68–1.22). **Keep, with H's majority scoring**, which fixes the seats.

**D. Gather into the hand** (the draw still refills to 3). Evens the seats on its own (0.95–1.05) and cuts the luck of the deal most (1.16/0.76 in R). More Exalting (34%), less Gathering (28%). But Choirs change less (0.15–0.17 flips), since nothing enters a Choir but an Exalt. **Optional** (in `rMajGH`).

**E. Exalt:** unchanged.

**F. The spoils order.** Turn order is best. Reverse and lowest-Glory-first both spread the seats; lowest-Glory-first is also a catch-up. **Keep turn order.**

**G. The Reaping.** Choir pays 1: Choirs change most (0.33), but sides do not move (0.02) and Offers fall to 26%. The difference of your Choir: sides more readable (0.64/0.69), seats spread (0.86–1.37). 3 alone / 1 shared: readable (0.63/0.68), and the mixes spread (0.66–1.11), the V44 problem. **Keep 2 per card.**

**H. The end score.** *Majority only* (only the tokens of the color you hold more of score; on a tie, the better of the two): sides move (0.19), and the 4-player seats even out (0.92–1.04). On its own, without First Fruits tokens, it is bad: sides readable (0.68) and no movement (0.02), because only token flow can change a majority. *Winner only* (the original "faction victory"): last seat 0.70. *Net*, a stake that can sink: the most movement (0.34) but tokens stop mattering (2% of the winner's Glory, against 39–48%), skill falls to 1.30 and Gathering to 20%. **Majority.**

## 5. Rounds 2 and 3: combining the best pieces

| Variant (on R unless said; all with majority scoring) | Reader 4p/3p | Seats 4p / 3p | Skill | Side flips | Choir flips | Offer/Gather/Exalt 4p | Per player: token / Choir Offers / First Fruits tokens | With/against |
|---|---|---|---|---|---|---|---|---|
| Majority on S alone (`sMajority`) | 0.68 / 0.69 | 0.67–1.27 / 0.96–1.02 | 1.54 | 0.02 | 0.26 | 43/35/21% | 1.3 / 0.0 / 0.0 | 1.83/0.32 |
| R without First Fruits tokens (`rMajNoFT`) | 0.60 / 0.63 | 0.78–1.22 / 0.87–1.11 | 1.36 | 0.02 | 0.31 | 36/38/26% | 1.9 / 0.6 / 0.0 | 1.99/0.31 |
| R (`rMajority`) | 0.58 / 0.64 | 0.92–1.04 / 0.82–1.15 | 1.78 | 0.19 | 0.24 | 38/39/23% | 2.2 / 0.5 / 2.4 | 1.42/0.54 |
| **R, First Fruits face up (`rMajUp`)** | 0.61 / 0.65 | **0.96–1.03 / 0.94–1.04** | 1.88 | 0.21 | 0.27 | 38/38/23% | 2.2 / 0.5 / 2.5 | 1.24/0.61 |
| **R, Gather into the hand (`rMajGH`)** | 0.62 / 0.60 | 0.93–1.06 / 0.92–1.09 | 1.94 | **0.25** | 0.17 | 39/28/32% | 2.4 / 0.4 / 2.5 | 1.25/0.66 |
| R, face up and Gather into the hand (`rMajUpGH`) | 0.65 / 0.64 | 0.88–1.08 / 0.90–1.16 | 2.54 | 0.23 | 0.17 | 40/28/32% | 2.4 / 0.4 / 2.3 | 1.18/0.64 |
| R, a Choir Offer counts 2 (`rMajW2`) | 0.61 / 0.65 | 0.83–1.18 / 0.90–1.11 | 1.78 | 0.19 | 0.23 | 38/38/24% | 2.1 / 0.6 / 2.4 | 1.41/0.56 |
| R, Offer from the hand or the Choir (`rMajBoth`) | 0.62 / 0.65 | 0.92–1.20 / 0.86–1.07 | 1.54 | 0.15 | 0.20 | 46/35/20% | 0.7 / 0.2 / 2.4 | 1.36/0.51 |
| R, Choir pays 1 (`rMajPay1`) | 0.59 / 0.60 | 0.88–1.17 / 0.97–1.02 | 2.21 | 0.18 | 0.28 | 38/41/21% | 2.0 / 0.7 / 2.2 | 1.34/0.53 |
| R, winner only, Gather into the hand (`rWinGH`) | 0.61 / 0.65 | 0.79–1.14 / 0.92–1.05 | 1.88 | 0.22 | 0.18 | 39/27/34% | 2.3 / 0.4 / 2.1 | 1.30/0.82 |
| Offers from the hand, facedown First Fruits, Gather into the hand (`hMajGH`) | 0.62 / 0.67 | 0.90–1.09 / 0.90–1.18 | 1.81 | 0.20 | 0.13 | 49/21/30% | 1.4 / 0.0 / 2.4 | 1.38/0.57 |
| The same, First Fruits face up (`hMajUpGH`) | 0.63 / 0.65 | 0.88–1.08 / 0.87–1.08 | 2.46 | 0.20 | 0.14 | 46/23/30% | 1.4 / 0.0 / 2.2 | 1.18/0.68 |

**Fixed strategies** (one strong bot leaning hard one way among three plain strong bots, 4 players, 300 games each; 1.00 is a fair share, the vision wants every one below):

| Variant | Align (Choir = tokens) | Hedge (Choir ≠ tokens) | Never Offer a token | Always Offer | Never Offer | Never Gather |
|---|---|---|---|---|---|---|
| S (`offererSpoils`) | 0.75 | 0.80 | **1.09** | 0.05 | 0.96 | 0.69 |
| R, the full idea (`rFull`) | 0.77 | 0.90 | 0.74 | 0.05 | 0.64 | 0.62 |
| R, majority (`rMajority`) | 0.91 | **1.14** | 0.66 | 0.15 | **1.04** | 0.82 |
| R, majority, face up (`rMajUp`) | 0.73 | 0.93 | 0.71 | 0.20 | 0.97 | 0.75 |
| R, majority, Gather into the hand (`rMajGH`) | 0.97 | 0.82 | 0.62 | 0.23 | 0.88 | 0.84 |
| R, majority, face up, Gather into the hand (`rMajUpGH`) | 0.97 | 0.62 | 0.53 | 0.17 | 1.01 | 1.03 |
| Offers from the hand (`hMajGH`) | 0.98 | 0.84 | **1.23** | 0.39 | 0.91 | 0.96 |
| Offers from the hand, face up (`hMajUpGH`) | 0.83 | 0.82 | **1.21** | 0.31 | 1.02 | 1.00 |

Each ±0.09–0.10. Two findings: with Offers from the hand, hoarding tokens wins again (the reason to keep the Choir Offer); and `rMajority` alone lets hedging and never Offering break even, which `rMajUp` and `rMajGH` do not.
