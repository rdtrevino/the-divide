# The flow: fixes for balance and Choir changing

November 20, 2026. Robert adopted the flow as `rMajGH` (`the-flow.md`) and asked for fixes that make it more balanced and get players to change their Choirs more.

**Base:** the adopted core (engine defaults):
- spoils to the Offerers;
- Offer only from your Choir (face up) or a token (facedown);
- First Fruits facedown, a card or a token;
- Gather into the hand;
- only your majority color's tokens score.

**What it does less well** (1,200 games, `the-flow.md` Section 6):
- **Choirs change least of any version:** 0.17 lean changes a game per player, against 0.24 before. The only way into a Choir is now Exalt, and Choir Offers are rare (0.4 a game).
- **Balance:**
  - 3-player seats 0.89–1.10 (4 players: 0.95–1.08);
  - a lopsided deal is worth a little more (4p, 5–1 or more: 1.14);
  - the side you are dealt still matters (1.29 against 0.69);
  - fewer close Days (0.22) and wider margins (4.4).
- **A leak:** whoever gives a token as First Fruits draws no card, so the table sees who gave one.

## 1. The ideas

| Switch | Idea | Serves (`vision.md`) | Builds on / risks |
|---|---|---|---|
| `offerSwap` | **Offer a Choir card and put a card from your hand in its place** (a free Exalt) | 1 and 5: the Choir Offer becomes a trade, not only a loss; Robert's "Choir changing" | New. Risk: Choir Offers become cheap, so the face-up Offer is less of a sacrifice |
| `gatherTo: 'either'` | **A Gathered card goes into your hand or your Choir** | 3: the Altar feeds Choirs again | Gather into the Choir was the V45 rule; into the hand evened the seats. Risk: undoes that |
| `devotion: 1` | At the end, each Choir card of your majority color scores 1 | 2: now that sides move, a Choir has a reason to follow | Held in V45 (a 17th rule; made sides readable at 2). Risk: readability |
| `choirLimit: 3` | A Choir of 3 | Each card is a larger share of the lean | Kept at 4 in V45 (no gain) |
| `replacedToHand` | A card that leaves a full Choir to make room goes to your hand | Cheaper to change: the old card is not lost | Tested on spoils: no gain |
| `decay` | Turnover: after the Reaping, a full Choir loses its oldest card | Choirs must change | Rejected on V45 and on spoils: never Offering won (1.16, 1.50). Risk: same |
| `witherIdle` | On a Day you did not Offer, a full Choir loses its oldest card | Choirs change for those who sit out | Rejected on spoils. Risk: a penalty |
| `fruitsDraw: 'all'` | Everyone draws 1 after First Fruits, whatever they gave | 2: closes the leak; a token as First Fruits becomes a little cheaper | New |
| `tokensEach: 5, 7, 8` | Odd counts make a majority certain; more tokens make each one a smaller share | 2 and 9: fewer ties, less luck in the deal | 8 gave the fairest seats in V45 |
| `spoilsEach: 1` | Each Offerer takes one spoil; the rest go to whoever holds the fewest tokens (cards are discarded) | 9: the first in turn order no longer takes extra | Tested on spoils: no gain |

Results: `tools/sim/results/fix-r1.jsonl`.

## 2. Round 1: each fix alone (300 games a mode, strong bot)

Noise is about ±0.1 on the ratios at 300 games. The base is `current` (rMajGH). Bold marks what changed the most.

| Fix | Choir flips | Choir Offers / pl | Side flips | Seats 4p / 3p | Mixes 4p | With / against 4p | Reader 4p / 3p | Skill |
|---|---|---|---|---|---|---|---|---|
| current (base) | 0.17 | 0.39 | 0.25 | 0.93–1.06 / 0.92–1.09 | 0.94–1.08 | 1.25 / 0.66 | 0.62 / 0.60 | 1.94 |
| `offerSwap` | **0.28** | **1.84** | 0.21 | 0.91–1.10 / **0.84–1.18** | 0.92–1.05 | **1.58 / 0.51** | 0.65 / 0.66 | 2.21 |
| `gatherTo: 'either'` | 0.23 | 0.43 | 0.20 | **0.87–1.15 / 0.85–1.20** | 0.87–1.04 | 1.30 / 0.68 | 0.60 / 0.62 | 1.90 |
| `devotion: 1` | 0.22 | 0.31 | 0.23 | 0.96–1.05 / 0.85–1.09 | 0.94–1.10 | 1.41 / 0.57 | **0.55 / 0.53** | 2.15 |
| `choirLimit: 3` | 0.23 | 0.35 | 0.16 | 0.85–1.12 / 0.94–1.06 | **0.94–1.36** | 1.53 / 0.59 | 0.56 / 0.61 | 1.83 |
| `replacedToHand` | 0.18 | 0.41 | 0.24 | 0.90–1.17 / 0.96–1.07 | 0.94–1.09 | 1.24 / 0.63 | 0.62 / 0.60 | 1.89 |
| `decay` (turnover) | **0.29** | 0.28 | **0.30** | 0.92–1.10 / **0.93–1.04** | **0.95–1.01** | **1.26 / 0.77** | 0.64 / 0.63 | **2.37** |
| `witherIdle` | **0.30** | 0.28 | **0.30** | 0.92–1.10 / 0.93–1.04 | 0.96–1.01 | 1.28 / 0.76 | 0.64 / 0.62 | 2.37 |
| `fruitsDraw: 'all'` | 0.16 | 0.39 | 0.23 | 0.88–1.15 / 0.95–1.06 | 0.93–1.08 | 1.29 / 0.66 | 0.62 / 0.64 | 2.10 |
| `tokensEach: 5` | 0.20 | 0.44 | 0.17 | 0.96–1.05 / 0.89–1.07 | 0.97–1.11 | 1.24 / **0.76** | 0.63 / 0.61 | 1.77 |
| `tokensEach: 7` | 0.19 | 0.46 | 0.18 | 0.94–1.06 / 0.93–1.12 | 0.92–1.14 | 1.40 / 0.62 | 0.61 / 0.60 | 2.27 |
| `tokensEach: 8` | 0.17 | 0.43 | 0.20 | 0.89–1.11 / 0.92–1.13 | 0.97–1.02 | 1.52 / 0.48 | 0.55 / 0.59 | 1.79 |
| `spoilsEach: 1` | 0.20 | 0.39 | 0.13 | 0.87–1.12 / **0.77–1.16** | 0.95–1.07 | 1.41 / 0.72 | 0.61 / 0.64 | 1.62 |

**What it says:**
- **Turnover (`decay`) is the one fix that helps everywhere at once:**
  - Choirs change 70% more (0.29 against 0.17), and sides move more too (0.30).
  - 3-player seats are the fairest yet (0.93–1.04).
  - Lopsided deals no longer pay (mixes 0.95–1.01).
  - The side you are dealt matters less (1.26 against 0.77, from 0.66).
  - Skill rises (2.37).
  - It was rejected twice before because never Offering won. Under Choir-only Offers that may no longer hold, so the exploit check decides it.
- **`witherIdle` gives the same numbers as turnover.** A Choir that Offered a card is no longer full, so in practice the same Choirs lose a card. Turnover is the simpler rule to say, and it reads as a rhythm rather than a penalty.
- **The swap makes Choir Offers common** (1.84 a game against 0.39), which is exactly Robert's aim. But it costs balance:
  - the 3-player seats spread (0.84–1.18);
  - the dealt side matters more (1.58 / 0.51).
  - A free Exalt each time makes the Choir Offer cheap; the player who swaps first gains most.
- **Five tokens each** evens the deal (against 0.76) with a little less skill.
- **Seven and eight tokens** do not help.
- **The rest do not earn a rule:**
  - Gather into either spreads the seats (the reason Gather moved to the hand).
  - Devotion lowers the reader.
  - A Choir of 3 makes lopsided deals pay (1.36).
  - A replaced card to the hand changes nothing.
  - One spoil each spreads the 3-player seats.
  - Draw-for-all has no clear effect on balance. It still closes the leak (Section 4 weighs that).


## 3. Exploits and round 2

**Exploits** (300 games; a fixed strategy against strong bots, above 1 means it wins; ±0.1):

| Variant | Align | Hedge | No token | Always Offer | Never Offer | Never Gather |
|---|---|---|---|---|---|---|
| base (rMajGH, 600 games) | 0.84 | 0.81 | 0.52 | 0.22 | 0.89 | 0.79 |
| `decay` | 0.98 | 0.87 | 0.55 | 0.29 | 0.91 | 1.08 |
| `offerSwap` | 0.91 | 0.81 | **1.27** | 0.35 | 0.82 | 0.90 |
| `tokensEach: 5` | 0.91 | 0.94 | 0.54 | 0.19 | 0.76 | 0.99 |
| `decay` + `gatherTo: 'either'` | 0.81 | 0.93 | 0.52 | 0.26 | 0.83 | 0.87 |
| `decay` + `offerSwap` + 5 tokens | 0.95 | 0.87 | **1.27** | 0.54 | 0.65 | 1.04 |
| `decay` + 5 tokens | 1.03 | 0.85 | 0.56 | 0.26 | 0.97 | 0.91 |
| `decay` + `offerSwap` | 0.89 | 0.89 | **1.40** | 0.64 | 0.80 | 1.02 |

- **Turnover no longer rewards sitting out** (never Offering 0.91). It was rejected twice because never Offering won. The Choir-only Offer fixed that: a Choir that will lose its oldest card anyway is cheap to Offer from.
- **The swap breaks the tokens.** With a free Exalt attached, a Choir Offer beats a token Offer, so never Offering a token wins (1.27–1.40) in every combination. A core that runs on tokens changing hands cannot have that.

**Round 2** (300 games a mode):

| Combination | Choir flips | Choir Offers / pl | Side flips | Seats 4p / 3p | Mixes 4p | With / against 4p | Reader 4p / 3p | Skill |
|---|---|---|---|---|---|---|---|---|
| `decay` + `gatherTo: 'either'` | **0.48** | 0.31 | 0.30 | 0.93–1.03 / 0.93–1.13 | 0.93–1.02 | 1.37 / 0.70 | 0.63 / 0.65 | 2.16 |
| `decay` + `offerSwap` | 0.45 | 1.69 | 0.26 | 0.80–1.12 / 0.93–1.10 | 0.79–1.09 | 1.11 / 0.81 | 0.66 / 0.70 | 2.45 |
| `decay` + `offerSwap` + 5 tokens | 0.43 | 1.78 | 0.21 | 0.92–1.13 / 0.86–1.12 | 0.95–1.10 | 1.10 / 0.90 | 0.66 / 0.64 | 2.58 |
| `decay` + 5 tokens | 0.31 | 0.29 | 0.22 | 0.88–1.25 / 0.85–1.14 | 0.98–1.26 | 1.11 / 0.89 | 0.67 / 0.64 | 2.30 |
| `decay` + `fruitsDraw: 'all'` | 0.30 | 0.26 | 0.27 | 0.88–1.18 / 0.92–1.05 | 0.93–1.04 | 1.21 / 0.78 | 0.64 / 0.68 | 2.30 |
| `offerSwap` + 5 tokens | 0.31 | 1.95 | 0.15 | 0.83–1.08 / 0.95–1.03 | 0.95–1.01 | 1.25 / 0.73 | 0.65 / 0.65 | 2.07 |

- **Turnover with Gather into either nearly triples Choir changes** (0.48 against 0.17) and passes every exploit. Gather into either spread the seats on its own; with turnover the 4-player seats are the tightest of the study (0.93–1.03). The likely reason: a Choir that loses a card each Day needs refilling, and the Altar now refills it, so Gathering a card into your Choir is no longer a lead that compounds.
- **Five tokens with turnover** evens the dealt side best but spreads the seats (1.25) and lets always aligning reach 1.03. Not taken further.
- **Draw-for-all with turnover** adds nothing measurable. It stays a question for people (Section 5): the leak is about reads, which bots do not make.

**Finalists** at 1,200 games: `decay` and `decay` + `gatherTo: 'either'` (`results/fix-final.jsonl`).

## 4. Finalists at 1,200 games

Noise is about ±0.05 on the ratios. Exploits at 600 games.

| | Base (rMajGH) | `decay` | **`decay` + `gatherTo: 'either'`** |
|---|---|---|---|
| Choir flips (lean changes a game per player) | 0.17 | 0.28 | **0.46** |
| Side flips | 0.23 | 0.30 | 0.29 |
| Choir Offers / player | 0.4 | 0.3 | 0.3 |
| Seats 4p | 0.95–1.08 | **0.85–1.18** | 0.90–1.05 |
| Seats 3p | 0.89–1.10 | 0.90–1.10 | **0.94–1.04** |
| Mixes 4p (lopsided deals) | 0.96–1.14 | 0.98–1.03 | **0.99–1.00** |
| With / against the world 4p | 1.29 / 0.69 | 1.23 / 0.74 | 1.28 / 0.74 |
| Reader 4p / 3p | 0.61 / 0.61 | 0.65 / 0.65 | 0.63 / 0.65 |
| Skill (strong against heuristic) | 1.88 | 2.24 | 2.15 |
| Close Days 4p | 0.22 | 0.19 | 0.19 |
| Margin 4p | 4.35 | 4.59 | 4.13 |
| Best fixed strategy (exploits) | 0.89 | 1.08 (300 games) | **0.90** (hedge) |

Exploits for the finalist, 600 games: align 0.81, hedge 0.90, no token 0.53, always Offer 0.28, never Offer 0.88, never Gather 0.78.

- **Turnover alone fails the 1,200-game check.** The first 4-player seat wins too often (1.18) and the third too rarely (0.85).
- **Turnover with Gather into either is the finalist:**
  - Choirs change nearly three times as often.
  - Sides move a little more.
  - 3-player seats and lopsided deals are the fairest of any version.
  - Skill rises.
  - Every fixed strategy loses.
  - Costs: the weakest 4-player seat drops a little (0.90 from 0.95); the side you are dealt still matters as much (1.28 / 0.74); sides are a little easier to read (63–65%, from 61%).
- **Why the pair works.** Turnover empties a Choir slot every Day, and Gather into the Choir refills it from the Altar.
  - Alone, turnover makes Choirs shrink and leaves the first player's early Exalts ahead.
  - Alone, Gather into the Choir lets an early lead compound (the reason Gather moved to the hand).
  - Together, a Choir is a lineup that turns over, refilled from the Altar.
- **What it does not do: Choir Offers stay rare** (0.3 a game). Choirs now change through turnover and Gathering, not through Offering. The swap was the one fix that made Choir Offers common, and it broke the tokens. If Robert wants the face-up Choir Offer itself to be common, it needs a reward that does not beat a token Offer. That is a new idea to test, not something here.

## 5. Against the vision

**The test for any new rule** (`vision.md`), for turnover with Gather into either:
- **Self against side: a little sharper.**
  - The card about to leave your Choir is the cheapest one to Offer face up for your side. Strong bots still rarely do it, but the choice exists every Day.
  - Gathering is now a choice: into your Choir (Glory for you tonight, and your Choir's colors) or your hand (a future First Fruits, Exalt or ability).
- **Allegiance stays uncertain, and Choirs stop pinning it down.**
  - A Choir that changes every Day shows less of where you stand for good.
  - Sides move a little more (0.29).
  - Readers move from 61% to 63–65%, still far from certain. That is the main cost against principle 2, and it is small.
- **The Altar is still the contest, and more so.** The Altar now feeds Choirs again: what one player Offers, another can Gather straight into their Choir.
- **An ally is still a rival.** Unchanged.
- **Checkable on the table: yes,** if Choirs are laid out in a row with new cards added on the right. The leftmost card leaves after the Reaping. No memory is needed.

**Core change or patch?** Both are core changes to what a Choir is: a lineup that turns over and is refilled from the Altar, instead of an engine that sits. Neither is a cap, a catch-up or a tiebreak.

**Rules a new player learns** (rMajGH about 20 points):
- one more rule: "after the Reaping, a full Choir loses its leftmost card";
- one rule changed: "a Gathered card goes into your hand or your Choir (making room)", which brings back "make room";
- **about 21 points.**

## 6. What the bots cannot show, and what needs people

- **Whether losing a card each Day feels like loss or like rhythm.** The bots count Glory; people may resent watching their best card leave, or enjoy the churn. Either way, the leftmost card is known in advance, so people can plan for it.
- **Cards built to stay.** Some cards' value comes from sitting in a Choir for many Days. Under turnover they last at most four Days unless Offered first. The cards need a pass (`cards/changes/*.json`) once the core settles, with `card-value.ts` to show which lose most.
- **Reading a moving Choir.** The bots read colors by number. People may read a Choir that changes for forced reasons as less meaningful, or may read the Gather choice ("they put a Dark card into their Choir") as a strong tell.
- **Whether the face-up Choir Offer matters to people.** Robert's aim was Choir switching through Offers. People may value the dramatic public Offer more than the bots do, and make it more often than 0.3 a game.
- **The dealt side.** Neither finalist changes how much the side you are dealt matters (1.28 / 0.74). Bots cannot bluff or bargain their way out of a bad deal; people might, so this may matter less at a table.
- **Skill numbers are biased for variants:** the heuristic bots misread every new rule a little, so 2.15 overstates the gain against people who learn it.
- **The First Fruits leak is still open.** Draw-for-all closes it at no measurable cost to bots; whether people use the leak needs a table.

## 7. Recommendation and next steps

1. **Robert to decide:** adopt turnover with Gather into either (`decay: true, gatherTo: 'either'`) on rMajGH, or not.
2. If yes: make them the engine defaults; then the rulebook, Quick Guide and Learn page; the card pass; retrain the learned bot (`game/tools/distill/README.md`). Then the merge to main.
3. Open questions for later:
   - a reward for the face-up Choir Offer that does not beat a token Offer;
   - the dealt side (1.28 / 0.74);
   - draw-for-all, at a table.

Removed with this study (definitions in the git history): `offerSwap`, `replacedToHand`, `witherIdle`, `spoilsEach`. The default bots' moves are unchanged (bench fingerprints `5e0f30a8b72ccf9c`, `d8aa8a9ee120ebed`).
