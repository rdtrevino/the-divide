# The Divide: rework proposal

November 18, 2026. A proposal, not yet adopted. Goal set by Robert: a 25-to-35-minute bluff-and-alliance game whose core is the Tide, with a light engine-building layer for competitive play, and a Reaping that feels rewarding at 4 players.

Everything below was measured in `game/tools/lab`, a new simulator with Monte Carlo players (they re-deal every card they cannot see, play out the rest of the Day for each option, and keep the best). Unlike the old bots, these separate good play from bad: a random player never beats them, and they beat a one-move heuristic at 1.3 to 1.6 times their fair share. Round numbers below match the files in `game/tools/lab/results/`.

## 1. The game in one page

**Components.** 44 Host cards (section 2), Glory markers, a **Crown** token.

**Setup.** Shuffle. Each player takes a hand of 3 and a Choir of 2 face-up cards (room for 4).

**Each Day:**

1. **Morning.**
   - **The Omen:** put the top card of the deck facedown on the Altar.
   - Anyone with **Prophecy** names Light or Dark aloud.
   - **First Fruits:** everyone reveals 1 card from hand at once, face up on the Altar, then draws 1.
2. **Noon.** In turn order, each player takes one action:
   - **Offer:** put a card from your hand **facedown** on the Altar in front of you. It is your vote and your **bet**.
   - **Gather:** take any Altar card into your Choir (a facedown one blind).
   - **Exalt:** put a card from your hand into your Choir.

   A full Choir discards a card to make room. Gather and Exalt are free.
3. **Evening.**
   - Reveal the Altar. The heavier side is the **Tide**. **A tie keeps yesterday's Tide** (on Day 1, no Tide).
   - **The Reaping:** count the Choirs leaning with the Tide; **the Crown's holder counts as two Choirs**.

     | Choirs with the Tide | Each of them gains |
     |---|---|
     | One | 3 |
     | Two | 2 |
     | Three or more | nothing |

     Choirs against the Tide gain nothing. Nobody ever loses Glory at the Reaping.
   - **Bets:** each Offer whose card matches the Tide earns its owner 1 Glory.
   - Resolve "at the end of the Day" abilities.
   - Give the **Crown** to the player with the most Glory; if tied, nobody holds it.
   - Clear the Altar and draw to 3.

**End.** After a Reaping at which anyone has **12 Glory**, the most Glory wins (ties share).

That is the whole game: three actions, one scoring table, one bet rule, the Crown, and nine abilities.

## 2. The deck (44 cards)

| Cards | Count | Value | Ability |
|---|---|---|---|
| Faithful | 10 | Light +1 | none |
| Fallen | 10 | Dark +1 | none |
| Hymn | 2 | Light +2 | none |
| Lamentation | 2 | Dark +2 | none |
| Pilgrim | 4 | Neutral | none (an empty vote: a bluff Offer that bets nothing) |
| **Seraphim** / **Legion** | 1 + 1 | Light / Dark +1 | When you gain at the Reaping, gain 1 more. |
| **Covenant** / **Belial** | 1 + 1 | Light / Dark +1 | When your Choir shares the Tide with exactly one other Choir, gain 1 more. |
| **Raphael** / **Azazel** | 1 + 1 | Light / Dark +1 | When you gain at the Reaping, gain 1 more if another card in your Choir shares this card's alignment. |
| **Mercy** / **Scapegoat** | 1 + 1 | Light / Dark +1 | At the end of the Day, if the Tide matches this card and you gained nothing at the Reaping, gain 1. |
| **Providence** / **Mammon** | 1 + 1 | Light / Dark +1 | Each Day you gain at the Reaping, put 1 Glory on this card. When it holds 3, take them. |
| **Gabriel** / **Leviathan** | 1 + 1 | Light / Dark +1 | Your Offers count 1 more toward the Tide, and other players cannot Gather them. |
| **Heresy** | 2 | Neutral | At the end of the Day, if one of your Offers opposed your Choir's lean and matched the Tide, gain 1. |
| **Prophecy** | 2 | Neutral | In the Morning, before First Fruits: name Light or Dark. If the Tide matches, gain 1. |
| **Twilight** | 2 | Neutral | Once per Day, on your turn: one card in your Choir counts as the opposite alignment until the end of the Day. |

Every ability is a **Tide amplifier**: it pays only when something happens at the Tide (you won it, you shared it, you called it, you bet against your own side and were right). Engines therefore never pull attention away from the Altar; they make the Tide worth more to you. The names reuse existing cards and art.

**Light engine lanes**, each findable from a random start:

| Lane | Cards | Plays as |
|---|---|---|
| Amplifier | Seraphim/Legion + Raphael/Azazel + Providence/Mammon | Commit to a side, win Tides, stack payoffs |
| Alliance | Covenant/Belial | Find one partner and keep the pair together |
| Hedge | Mercy/Scapegoat | Lean one way, hold the other side's card, profit either way |
| Vote | Gabriel/Leviathan | Swing the Altar; your bets can't be stolen |
| Seer | Prophecy | Read the table in the Morning, then make it come true |
| Betrayal | Heresy + Twilight | Lean in public, bet against it in private, flip at the last moment |

## 3. What the numbers say

All-Monte-Carlo games. The recommended rules (Round 14) against the current V44 rules under the same strong players (Round 13, 600 games each).

| | **Recommended, 4p** | V44, 4p | **Recommended, 3p** | V44, 3p |
|---|---|---|---|---|
| Length | **6.7 Days, ~31 min** | 13.8 Days, ~64 min | **6.1 Days, ~23 min** | 14.1 Days, ~54 min |
| Decisions per player | 14 | 28 | 13 | 28 |
| Winner's Glory tied to the Tide | **100%** | 19% | **100%** | 28% |
| … from the Reaping / abilities / bets | 36% / 43% / 20% | 19% / 0% / 0% (81% flat Offers) | 49% / 35% / 16% | 28% / 0% / 0% |
| Mean Reaping per player per Day | **+1.52** | +0.01 | **+1.73** | +0.05 |
| Player-Days that gain / lose | **65% / 0%** | 23% / 18% | **64% / 0%** | 26% / 18% |
| Days nobody gains | **5%** | 47% | **7%** | 55% |
| Choirs hiding at Neutral | **2%** | 32% | **2%** | 15% |
| Most common split | **2 vs 2 (69%)** | 2 vs 1 + Neutral (35%) | **2 vs 1 (88%)** | mixed |
| Offers that bet against the Offerer's own side | 41% | 11% | 33% | 18% |
| Sole Day-3 leader wins (chance 25% / 33%) | 40% | 33% | 45% | 44% |
| Win ratio by seat | 0.88–1.16 | 0.92–1.11 | 0.95–1.06 | 0.96–1.02 |

V44's length here (13.8 Days) is with strong players: they avoid losing by hiding at Neutral, so the Tide pays almost nothing and the race drags. The old bots played it in about 8 Days only because they played it badly.

**Skill and exploits** (one tested player among Monte Carlo players, win ratio; Round 15 for the recommended rules):

| | Recommended | Recommended rules with a plain deck, no tiebreak (Round 12) | V44 (Round 6) |
|---|---|---|---|
| Monte Carlo player among heuristic players (skill) | **1.42** (4p), **1.41** (3p) | 1.24 (4p), 1.39 (3p) | 1.44 |
| Always Offer, never build | **0.23** | 0.41 | 0.80 |
| Never Offer | 0.27 | 0.06 | 0.00 |
| Always Offer toward the majority | **0.17** | 0.36 | 0.64 |
| Never change sides | 0.62 | 0.51 | 0.63 |
| Random | 0.01 | — | 0.02 |

No one-dimensional plan comes close to strong play, and the engine is what punishes "just Offer" (0.41 to 0.23).

**Abilities** (win ratio of players holding the card in their final Choir; 600 games of the recommended deck without the tiebreak, Round 13):

| Ability | 4 players | 3 players |
|---|---|---|
| Covenant / Belial | 1.20 | 1.17 |
| Prophecy | 1.18 | 1.15 |
| Heresy | 1.13 | 0.94 |
| Seraphim / Legion | 1.12 | 1.03 |
| Mercy / Scapegoat | 1.11 | 0.92 |
| Gabriel / Leviathan | 1.07 | 1.05 |
| Raphael / Azazel | 1.05 | 0.97 |
| Providence / Mammon | 0.82 | 0.95 |
| Twilight | 0.74 | 1.14 |

Twilight is the one card the bots cannot play well (it is a last-moment bluff), so people should value it more than they do.

## 4. Why each change

**Offers pay only when they match the Tide (the bet).** This is the single biggest change. With a flat 1 Glory per Offer, 77–81% of the winner's Glory came from simply taking the Offer action, whatever the Tide did. Making the reward a bet puts 100% of scoring on the Tide (Round 1). It also creates the game's best bluff: you can lean Light in public and quietly bet Dark. 41% of Offers do exactly that when a player expects their own side to lose. Facedown Offers already hide the card; now they also hide intent.

**Nobody loses at the Reaping; three or more on a side gain nothing.** Losses are what made 4 players feel punishing. Under V44, strong players answer the threat of losing by hiding at Neutral (32% of Choirs), so the Tide pays nobody on 47% of Days. With no losses, Neutral hiding disappears (2%) and the table settles into **two alliances of two** (69% of Days at 4 players), the ideal shape for a coalition game. But any table that pays a trio (alone 3, two 2, three 1) brings herding back: 3-vs-1 becomes the norm (55–62%, Round 2). "Three or more gain nothing" is the rule that keeps alliances small. It is also the conversation the game is built for: "If you join us, none of us scores."

Tables tested (4 players, Round 2):

| Alone / two / three+ | Losers | Crowded Days | Gain% | Days nobody gains |
|---|---|---|---|---|
| 3 / 1 / 0 (V44) | −3 alone, −1 otherwise | 23% | 24% | 46% |
| 3 / 2 / 1 | 0 | 62% | 64% | 19% |
| 2 / 2 / 0 | 0 | 26% | 57% | 21% |
| **3 / 2 / 0** | **0** | **22%** | **59%** | **18%** |
| 3 / 1 / 0 | −1 alone | 14% | 66% | 14% |

3 / 2 / 0 keeps a reason to stand alone (3), makes a partner worth having (2 each), and never takes Glory away. A −1 for a lone loser measured about the same and was dropped for simplicity and feel.

**The Omen (one random facedown card each Morning).** Borrowed from Battlestar Galactica's Destiny cards: a little noise on a hidden vote means a surprising Tide might be bad luck or might be betrayal. It raised upsets (the side with fewer Choirs winning) from 20% to 29–32%, cut Days with no gain, and reduced crowding (Round 3). It costs nothing to teach.

**The Crown.** Without it, the sole Day-3 leader won 50–59% of 4-player games. Turn-order catch-up and starting with 3 Choir cards each helped a little; the Crown helped most (59% to 44% on the same rules, Round 5). It fits the alliance game: nobody wants the leader as a partner, because the leader plus one ally makes a crowded side. The table plays against the leader with no special rule. It is a token, so it is always visible.

**A tied Tide keeps yesterday's Tide.** 15–19% of Tides were ties, and a tie paid nobody. Keeping yesterday's Tide cut Days with no gain from 16% to 5% and raised the skill edge from 1.29 to 1.42 (Rounds 12 and 15). Thematically, the Tide keeps flowing until someone turns it.

**The engine.** 44 cards, 9 abilities in pairs, instead of 69 unique cards. The first engine deck paid points directly and took 50–61% of the winner's Glory, burying the Tide again (Round 7). Rebuilding every ability as a Tide amplifier fixed that (Rounds 8–11). The engine also had a side benefit: it cut snowballing (Day-3 leader 54% to 34–41%), because late-game income gives trailing players a way back, and it is what makes one-dimensional play lose.

**Race to 12, kept.** 12 gives about 7 Days at 4 players (31 minutes) and 6 at 3 (23 minutes). 3-player games could use 13 or 14 if they feel short.

**Measured and rejected:**
- Two turns per player each Day (57 minutes).
- Removing First Fruits (Days with no gain rose to 41%; decisions fell to 9).
- First Fruits paying bets too (bets swamp the Reaping).
- Anonymous, shuffled Offers (no effect the bots can see; worth trying with people).
- A Choir limit of 3.
- A hand of 4.
- Returning replaced cards to hand.
- Turn order with the trailing player last (worse at 3 players).
- The first engine designs: Herald (+1 if the Tide matches) and Twilight-as-diversity paid too freely; Seer, Scribe and Sanctuary were too weak; Prophecy at the end of your turn paid 6.9 Glory a game.

## 5. What the simulations cannot tell you

The bots do not talk. Everything social is untested:

- **Does the Crown create fun politics or a pile-on?** Watch whether the leader ever finds a partner, and whether leaders feel bullied.
- **Do people actually bet against their own side?** The bots do it 41% of the time. If people never do, the bluff layer is missing and Heresy is dead.
- **Do 2-vs-2 alliances form by talk** ("I'll stay Dark if you stay Light"), and are they ever broken on purpose?
- **Teaching time.** Target: under 5 minutes from opening the box to the first First Fruits.
- **Does Twilight's last-moment flip feel great or feel cheap?**
- **3-player games** are 2-vs-1 on 88% of Days. Is being the lone player fun or miserable?

## 6. Playtest plan

1. **Print-and-play first.** 44 cards from existing art, a Crown token, a Glory track. One evening of work.
2. **Five sessions, at least two different groups,** 3 and 4 players, two games each. Record:
   - teach time and game time;
   - how many times each player changed sides;
   - how many Offers bet against the Offerer's side (check at each reveal);
   - who held the Crown each Day;
   - one sentence from each player on the best and worst moment;
   - **who asks to play again.**
3. **Only then** change rules, and change one thing at a time.
4. **Online:** build these rules as the site's default for a new card version and replace the bots with the lab's Monte Carlo player (`game/tools/lab/bots.ts`), so solo players face real opponents.

## 7. Further ideas (not yet measured)

- **Teaching script (3 minutes):**
  1. "The Altar decides the Tide: Light or Dark, whichever is heavier tonight."
  2. "Your Choir is your side. If you're with the Tide alone, you get 3. With one partner, 2 each. Three or more on a side: nobody gets anything."
  3. "Each turn: Offer a card facedown — it's your vote and your bet, worth 1 if it matches — or put a card into your Choir."
  4. "Most Glory holds the Crown and counts as two Choirs. First to 12."
- **First game:** remove Heresy and Twilight (the betrayal cards) and play with 40 cards.
- **Physical design:** an Offering spot in front of each player at the Altar's edge, so bets are clearly attributed; a two-sided Tide marker that stays on yesterday's side (for the tiebreak).
- **Advanced modules, rebuilt on this core:**
  - Celestials as one Tide-bending power each, for example "your First Fruits counts double" or "you may Gather from yesterday's Altar".
  - Events as a face-up "Sky" card each Day that changes the Reaping table (for example "Eclipse: two Choirs with the Tide gain 3 each").
  - Hidden Roles keeps the Balance, moved by the same Tide.

  Each module should be measured in the lab before printing.
- **Hidden Glory?** Rejected for now: the Crown needs open scores, and open scores drive the politics.

## 8. Reproducing

```bash
cd game/tools/lab
../../node_modules/.bin/tsx exp.ts final_tb mc4 400 5000
../../node_modules/.bin/tsx exp.ts v44_ref mc4 600 5000
python3 show.py results/r14.jsonl results/r13.jsonl results/r15.jsonl
```

See `game/tools/lab/README.md` for every mode and column.
