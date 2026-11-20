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

Next: exploits on turnover, the swap and five tokens, and round 2 combinations built around turnover (`results/fix-exploits.jsonl`, `results/fix-r2.jsonl`).
