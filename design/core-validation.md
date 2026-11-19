# The core under strong play: validation and reworks

November 19, 2026. Robert asked to finalize and validate the core structure before any card changes: validate V45 with the new bots, and test changes and reworks that keep the vision and make the game deep without making it heavy.

**Outcome: V45 stands as it is. Devotion is held until playtesting**, because it adds a rule to fix a problem that only consistently strong players show (Section 4). The measurements are in `game/tools/sim/results/` (`core-r1` to `core-r3`, `core-confirm`, `exploits-r3`). The engine keeps switches only for the open questions (Devotion and the number of tokens, `rules.ts`); the switches for the rejected variants were removed once decided, as with earlier reworks, and are in the git history.

## Method

- **Players:** the engine's strong (Monte Carlo) bot in every seat, with the real 69 cards. It reads the rules from the game, so it plays any variant. The learned bot has the current rules built in, so it cannot test variants. The lab cannot either: its bots barely hedge (Choir-to-side correlation −0.2, a reader at 53%), so it misses the problem found here.
- **Games:** 300 per variant at 4 players and 300 at 3 for screening; 1,200 of each for the finalists. Win shares: 1.00 is fair; noise is about ±0.1 at 300 games and ±0.05 at 1,200.
- **Measures, by vision principle:**
  - *Uncertain allegiance (2):* a reader that names each player's side from public facts only (`readerlib.ts`: their Choir's colors, the cards they have put in it, tokens Offered and Gathered, the Day), fitted on half the games and scored on the other half. Guessing scores 50%. Also an alignment index: +1 if Choirs always match their owner's tokens, −1 if always the other color (hedging).
  - *Self versus side (1):* win share when the side you were dealt more of won more Days, against when it lost.
  - *Fair (9):* by seat, and by token mix (3-3, 4-2, 5-1 or more).
  - *Every fixed strategy loses:* one strong bot leaning hard into a strategy, among three plain ones (`exploits.ts`).
  - *Tension and texture:* the action mix, close Days (won by 1), Days nobody wins, how often the final reveal changes the winner, where the winner's Glory comes from.
  - *Skill:* one strong bot among three heuristic bots. The heuristic bot does not know variant rules, so variants that change play a lot inflate this; it is not used to rank them.

## 1. The current core (V45) under strong play

| | 4 players | 3 players |
|---|---|---|
| **Reader names a player's side** (guessing 50%) | **70%** | **72%** |
| Alignment (+1 matched, −1 hedged) | **−0.49** | −0.52 |
| Win share when your side won / lost | 1.35 / 0.65 | 1.42 / 0.60 |
| Seats | 0.92–1.08 | 0.96–1.07 |
| Token mixes | 0.91–1.04 | 0.94–1.03 |
| Offer / Gather / Exalt | 60% / 24% / 16% | 59% / 25% / 17% |
| Close Days / Days nobody wins | 24% / 19% | 28% / 22% |
| The reveal changes the winner | 38% | 37% |
| Winner's Glory from tokens / Choir | 48% / 40% | |
| Skill (strong among heuristic) | 1.98× | |

**What holds:** seats and token mixes are fair; your side matters; every fixed strategy loses (below); the end is tense.

**What strong play exposes: hedging.**
- Strong players hold tokens of one color and build a Choir of the other, so they are paid whichever side wins the Day.
- No offering, no harvest makes everyone Offer, toward the side of their tokens; a Choir of the other color insures that Offer. Without the rule, hedging disappears (alignment −0.08), but Offers halve to 31%.
- **Half of this is the vision working.** With hedged stakes, every Offer for your side costs your Choir: principle 1's dilemma, on every turn.
- **Half is the vision failing.** The hedge is so regular that a Choir reads as the opposite side: 70–72%, where principle 2 wants a side you can never be sure of. Rounds 22–30 met the same trade-off: plain Fates hid sides (38–50%) but hedging emptied the dilemma; multiplied Fates fixed the dilemma but were readable (61–66%).

**Standing decisions, re-checked with strong bots** (300 games each; Section 2's table):
- **No offering, no harvest: keep.** Without it, Offers fall from 60% to 31%: the public good collapses. Half a harvest without an Offer sits between.
- **Judgment Day: keep.** Without it, seats spread from 0.97–1.04 to 0.86–1.16 at 4 players (0.82–1.13 at 3).
- **Leftovers to whoever holds the fewest: keep.** If leftovers are lost, players almost stop Offering tokens (0.47 a game, from 1.67) and skill drops to 1.36×.

## 2. The reworks tested

Twenty variants in three rounds, each aimed at a vision principle, mostly at the hedge.

| Variant (300 games each) | Rule | Serves | Reader 4p / 3p | Alignment | Side won / lost (4p) | Offers | Verdict |
|---|---|---|---|---|---|---|---|
| Current | | | 0.68 / 0.72 | −0.51 | 1.18 / 0.70 | 60% | baseline |
| **Devotion 1** | at the end, each Choir card of the color you hold more tokens of scores 1 | 1, 2, 5 | **0.57 / 0.50** | **0.01** | 1.29 / 0.56 | 59% | **finalist** |
| Devotion 2 | the same, scoring 2 | | 0.68 / 0.59 | +0.33 | 1.35 / 0.68 | 56% | over-corrects into readable alignment |
| Faith | at the end, tokens of a color score only if your Choir holds that color | 2, 5 | 0.65 / 0.65 | −0.42 | 1.36 / 0.56 | 60% | small gain |
| The Fall | after each Reaping, discard a Choir card of the losing color | 2 | 0.66 / 0.65 | −0.38 | 1.40 / 0.69 | **44%** | Offers fall |
| Choir vote | each Choir adds 1 to the Tide for its majority color | 3, 5 | 0.59 / 0.57 | −0.22 | 1.37 / 0.53 | 63% | skill drops (1.55×) |
| Pass a token left each Evening | random, facedown | 2 | 0.59 / 0.59 | −0.27 | 1.02 / 0.98 | 59% | the dealt side stops mattering |
| Hidden bag (+2 tokens of each color) | | 2 | 0.69 / 0.68 | −0.42 | 1.31 / 0.62 | 60% | no gain |
| Choir pays 1 | | 1 | 0.70 / 0.72 | −0.42 | 1.42 / 0.54 | 53% | no gain |
| Tokens score 2 a Day | | 1 | 0.73 / 0.76 | −0.42 | 1.63 / 0.40 | 61% | more readable |
| Choir pays 1 + 1 on any won Day | | 5 | 0.68 / 0.69 | −0.44 | 1.25 / 0.68 | 66% | no gain |
| Colorless Choir (2 on any won Day) | contrast | | 0.65 / 0.70 | −0.23 | 1.18 / 0.61 | 68% | the cards' abilities still give sides away |
| 4 tokens each | | | 0.71 / 0.69 | −0.52 | 1.22 / 0.68 | 60% | no gain |
| 8 tokens each | | 9 | 0.67 / 0.71 | −0.44 | 1.26 / 0.71 | 60% | fairest mixes (0.97–1.01) |
| **Devotion 1 + 8 tokens** | | 1, 2, 9 | **0.56 / 0.48** | 0.09 | **1.53 / 0.44** | 57% | **finalist** |
| Devotion 1 + pass a token | | 2 | **0.52 / 0.50** | 0.05 | 1.10 / 0.71 | 58% | two new rules |
| Devotion 1 + the Fall | | | 0.56 / 0.51 | 0.10 | 1.57 / 0.35 | **40%** | Offers fall |
| Harvest always / half (standing decision) | | | 0.62 / 0.64, 0.64 / 0.67 | −0.08, −0.36 | 1.55 / 0.45, 1.28 / 0.70 | 31%, 51% | see Section 1 |
| No Judgment Day; leftovers lost (standing decisions) | | | 0.69 / 0.72, 0.67 / 0.72 | | | | see Section 1 |

**Why Devotion works.** It does not ban the hedge; it gives the opposite plan an equal reward.
- *Hedging* still insures every Day.
- *Devotion* pays aligned players at the end.
- With 1 Glory a card, strong players use both about equally (alignment 0.00), so a Choir says little about its owner's side; with 2, everyone aligns and the Choir gives sides away again.
- Each card that enters a Choir becomes a real choice between insurance now and devotion at the end, and a statement the table cannot trust.

## 3. The finalists, confirmed (1,200 games each)

| | Current | **Devotion 1** | **Devotion 1 + 8 tokens** |
|---|---|---|---|
| Reader 4p / 3p (guessing 50%) | 0.70 / 0.72 | **0.58 / 0.50** | **0.55 / 0.52** |
| Alignment 4p / 3p | −0.49 / −0.52 | 0.00 / −0.07 | 0.03 / −0.07 |
| Win share when your side won / lost, 4p / 3p | 1.35 / 0.65, 1.42 / 0.60 | 1.41 / 0.57, 1.40 / 0.57 | **1.50 / 0.52**, 1.35 / 0.58 |
| Seats 4p / 3p | 0.92–1.08 / 0.96–1.07 | 0.87–1.07 / 0.94–1.08 | **0.95–1.04 / 0.98–1.02** |
| Token mixes 4p / 3p | 0.91–1.04 / 0.94–1.03 | 0.93–1.02 / 0.99–1.01 | 0.98–1.05 / 0.87–1.05 |
| Offer / Gather / Exalt (4p) | 60 / 24 / 16% | 58 / 24 / 17% | 58 / 25 / 18% |
| The reveal changes the winner, 4p / 3p | 38% / 37% | 46% / 38% | 42% / 38% |
| Winner's Glory from tokens / Choir (4p) | 48% / 40% | 46% / 37% | 53% / 32% |
| Skill | 1.98× | 1.90× | 1.81× |

**Fixed strategies** (one strong bot among three, 4 players, 300 games, ±0.09). Every one should lose:

| | Current | Devotion 1 | Devotion 1 + 8 tokens |
|---|---|---|---|
| Always align the Choir | 0.86 | 0.80 | 0.67 |
| Always hedge the Choir | 0.89 | 0.81 | 0.80 |
| Never Offer a token | 1.18 | 1.25 | **0.98** |
| Always Offer | 0.10 | 0.07 | 0.12 |
| Never Gather | 0.73 | 0.86 | 0.66 |

- **"Never Offer a token" beats the bots,** as it beat the learned bot (`design/bots.md`): both overspend tokens, a flaw of their token estimates rather than of the rules. With 8 tokens, each one matters less and the edge is gone.
- Under Devotion, aligning and hedging tie (0.80 against 0.81): two real plans, neither dominant.

## Recommendation

*(Section 4 revises this: hold Devotion until playtesting.)*

**Adopt Devotion** (one rule), and consider **8 tokens each** (a number, not a rule).

> At the end, after the tokens score: **each card in your Choir of the color you hold more tokens of scores 1 Glory.**

Measured against `vision.md`:
- **1. Self versus side:** sharper. Every card you build is now a choice between insurance (the other color pays on Days your side loses) and devotion (your color pays at the end), and your side matters more (1.41 against 0.57, from 1.35 against 0.65).
- **2. Uncertain allegiance:** restored. The reader falls from 70–72% to 50–58%, close to guessing, because both plans are played.
- **3. The Altar as a contest:** unchanged. Offers stay at 58%.
- **4. Allies are rivals:** unchanged.
- **5. Checkable on the table:** yes. One sentence, checked once, at the reveal, against public Choirs and revealed tokens.
- **Engine versus Tide:** the vision's open tension asked for the engine's payoff to depend on your secret side. Devotion does that, and only that.
- **Cost:** one rule and one count at the reveal, at most 4 Glory a player. A tie (3-3) earns nothing.

**8 tokens each** makes it fairer still, especially by seat (0.95–1.04 and 0.98–1.02), makes your side matter most (1.50 against 0.52), and removes the bots' token exploit. **Costs:**
- 32 tokens at 4 players instead of 24, and 24 at 3 instead of 18.
- Token scoring weighs a little more against the Choir (53% of the winner's Glory).
- Lopsided deals at 3 players measured 0.87, within the noise but worth watching.

**Rejected:**
- *The Fall:* Offers fall to 40–44%, weakening the public good.
- *Passing tokens:* a second rule, and the dealt side stops mattering.
- *Choir vote:* skill drops.
- *Tokens score 2:* more readable.
- *Devotion 2:* over-corrects.
- *Faith, the hidden bag, other Choir payouts, 4 tokens:* little or no gain.

**Not tested here:**
- A neutral (Forsaken) token: it touches every part of the engine that assumes two sides.
- The Choir limit and the hand size: card-level tuning, after the core is settled.

## What bots cannot show

- **Whether people hedge.** Devotion's point is that strong players should; people may align by instinct, in which case Devotion's main job is to reward them rather than to hide them.
- **Whether Devotion feels natural.** It fits the theme (devotion to your side), but whether players plan for it or forget it until the reveal needs a table.
- **Reads and bluffs.** The reader is a statistical model; people also read faces and talk. Bots never act on reads, so the value of hiding a side against people is unmeasured.
- **The reveal.** More end swings (the reveal changes the winner in 46% of 4-player games with Devotion) could feel exciting or arbitrary.

## If adopted

- The rulebook, Quick Guide and engine default (`rules.ts`: `devotion: 1`, and `tokensEach: 8` if chosen).
- Retrain the learned bot on the new rules (`game/tools/distill/README.md`, about 15 minutes); the site's bots use it.
- Then the card work: re-measure the cards under the final core with the retrained bot (`exp45.ts`, `card-value.ts`).

## 4. Revised: hold Devotion until people have played (Robert's review)

Robert asked whether the game is still digestible. Counted honestly, the core a new player learns grew from about 10 rule points (V44) to about 16 (V45), even though scoring got simpler. Most of the growth is five small fixes, each of which earns its place in the measurements:
- a token counts 2;
- leftover tokens go to whoever holds the fewest;
- no offering, no harvest;
- Judgment Day;
- the anonymous shuffles.

The bigger weight, though, is the 69 card texts, not the core.

Devotion would be a 17th rule, fixing a problem that appears only when every player is a strong, consistent hedger, which a first playtest group is unlikely to be. So:
- **V45 is the game to playtest, unchanged.**
- **Devotion stays ready** (one switch in `rules.ts`), to adopt only if real players read sides from Choirs.
- **8 tokens each** (no new rule) stays an option.
- **Next:** a first-game setup with fewer card texts; possibly a subtraction study (do First Fruits, the anonymous shuffles and a token counting 2 still earn their place?); then the cards.

