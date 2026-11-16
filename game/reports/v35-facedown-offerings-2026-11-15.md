# V35: First Fruits and Facedown Offerings

Date: 2026-11-15. Open Game, 3 and 4 players.

## What changed

Every Morning, after the Seed, each player secretly picks one card from hand. Everyone reveals at once and places it face up on the Altar as First Fruits, then draws 1 card. First Fruits is a tithe: it earns no Glory, it is not the Offer action, and it triggers no Offer abilities.

During turns, every Offer goes on the Altar facedown. The Offer reward is a choice: gain 1 Glory or draw 1 card. The whole Altar is revealed as the first step of the Evening, before any "In the Evening" ability, so Providence, Eternity, Zealot, Moderation and the rest act on full information. A facedown card can still be Gathered, blind.

The Open Game is now 3 or 4 players only. Hidden Roles covers 5 and 6.

The face-up row and "draw 2, keep 1" are gone from the rules.

## Card changes

| Card | New text | Why |
|---|---|---|
| Mirage | Your facedown Offerings cannot be flipped, looked at, exchanged, or destroyed before the Evening. | Every Offer is facedown now, so its old effect did nothing. It becomes the counter to the new peek cards. |
| Raphael | When you Offer a Light Host card, you may turn it face up and forgo its reward to destroy 1 face-up Dark card on the Altar. | Destroying shows your hand, so the price is revealing your Offering. Facedown cards cannot be targeted. |
| Azazel | Mirror of Raphael for Dark. | Kept as Raphael's opposite. |
| Hymn | You may Offer up to 2 Light Host cards. If you Offer 2, place them face up. You gain only one reward. | The color restriction has to be checkable, so a pair goes face up. |
| Lamentation | Mirror of Hymn for Dark. | Kept as Hymn's opposite. |
| Vessel | Adds the top card of the Host deck to the Altar facedown, without looking at it. | Fits the new Altar and stays blind for everyone. |
| The Cantor | Two Offers per turn, a reward for each. | Wording for the reward choice. |
| Pandemonium | The Seed and First Fruits are placed facedown, and no card on the Altar may be flipped or looked at before the Evening. | Its old effect (facedown Seed) is now the normal case for Offers, so it now blacks out the whole Altar. |
| Snare | Unchanged text. Only pays on a real Offer, not First Fruits or the Seed. | Facedown Offers make it a true bait card. |

Three new cards keep the Light and Dark totals equal (25 each in the Open deck, which is now 66 Host cards):

| Card | Alignment | Text |
|---|---|---|
| Ithuriel | Light +1 | On your turn: Flip one facedown card on the Altar face up. |
| Urim | Neutral | On your turn: Secretly look at up to 2 facedown cards on the Altar. |
| Asmadai | Dark +1 | On your turn: Look at one facedown card on the Altar. You may exchange it with a card from your hand. The new card stays facedown. |

Ithuriel and Asmadai are a mirrored pair: Light exposes the truth to everyone, Dark learns it privately and corrupts it.

## The hand-size problem, and the fix

The first version had no draw after First Fruits. It starved hands: the average hand at action time fell from 3.2 cards to 2.2, bots took the "draw a card" reward half the time, Offer Glory fell from 4.4 to 1.7 per player, winning Glory fell from 12.3 to 9.7, and the Dominion (the 4-card hand Celestial) jumped to a 1.38 win ratio. Skill also fell: one random player against smart bots won 0.26 of a fair share instead of 0.12.

I tested two fixes: draw 1 after First Fruits, and a 4-card hand limit for everyone. Both restored the economy. Drawing 1 tested slightly better on skill and Celestial spread and leaves every other rule alone, so it is now the rule.

## Results

Each line is 3,000 games of smart bots, plus 3,000 of one smart bot against random players and 3,000 of one random player against smart bots, on the same seeds as the V34 report. 3-player results shown, 4-player in brackets.

| Measure | V34 | V34 + Offer choice | V35 |
|---|---|---|---|
| Core decisions per player | 21.8 (21.9) | 26.5 (26.6) | **33.2 (33.4)** |
| Skill edge (smart bot vs random, 1.00 is chance) | 2.37 (2.80) | 2.51 (3.09) | 2.46 (2.95) |
| Random player vs smart bots | 0.19 (0.17) | 0.12 (0.13) | 0.14 (0.12) |
| Day 3 leader wins | 65% (59%) | 66% (57%) | **62% (55%)** |
| Final-Day comebacks | 17% (24%) | 17% (23%) | 19% (23%) |
| Winning Glory | 12.3 (12.5) | 12.0 (12.4) | 12.4 (12.4) |
| Celestial spread (lower is fairer) | 0.13 (0.16) | 0.13 (0.16) | **0.12 (0.16)** |

V35 gives about 50% more real decisions than V34, keeps the skill edge, slightly loosens the early-lead problem, and keeps Glory totals where they were. With the Long Game (two rounds of turns each Day) on top, core decisions reach 54.8 and the skill edge rises to 2.67 (3.35).

An important caveat: the bots do not bluff, and they read facedown cards only crudely (they assume a hidden Offering leans toward the player's own Choir). Real players will get more out of the hidden Altar than the bots do, so these skill numbers are a floor.

## Card balance

From 20,000 bot games. Win ratio is wins divided by wins expected by chance.

The new cards land in normal ranges: Ithuriel 0.98, Asmadai 0.92, and Urim 0.78, which matches the other Neutral cards (Neutral cards cost alignment and cluster between 0.68 and 0.84). Mirage (0.73) and Vessel (0.74) are unchanged in strength. Snare dipped from 0.96 to 0.87.

Celestials tightened a little: the Patron rose from 0.80 to 0.86 and the Tempest from 0.88 to 0.95, the Eclipse (1.26) and Arbiter (1.21) remain the strongest, and the Dominion is back to 1.03 after the hand fix.

The watch list is the same as before: Leviathan (1.54), Michael (1.33), Scapegoat (1.30) and Tree of Life (1.28).

Full data: `v35-variants-2026-11-15.json`, `sim-2026-11-15-v35-open-3-4p.md`.
