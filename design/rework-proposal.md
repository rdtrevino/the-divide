# The Divide: rework proposal (revision 2)

November 18, 2026. A proposal, not yet adopted. Goal set by Robert: a 25-to-35-minute bluff-and-alliance game whose core is the Tide, with a light engine-building layer for competitive play, and a Reaping that feels rewarding at 4 players.

Everything below was measured in `game/tools/lab`, a simulator with Monte Carlo players (they re-deal every card they cannot see, play out the rest of the Day for each option, and keep the best). Unlike the old bots, they separate good play from bad: a random player essentially never beats them. Round numbers match the files in `game/tools/lab/results/`.

## What changed in revision 2 (Robert's feedback)

| Robert's point | Measured | Decision |
|---|---|---|
| Likes the bet scoring | — | **Kept.** And now a wrong bet costs 1 (below). |
| "Why no losses? No punishment for leaning heavily" | Losses for every Choir against the Tide, or only for heavy leans, or for Neutral Choirs, all bring back herding: 3+ Choirs on one side on 44–57% of Days (from 22%), 2-vs-2 alliances fall from 71% to 30–42%, games grow to 37–47 minutes (Round 16). A −1 only for a Choir alone against the Tide works at 4 players but breaks at 3 (there, the minority is always alone; Days with every Choir on one side rise from 10% to 25%, Round 17). | **Stakes go on the bet instead: an Offer that opposes the Tide costs 1.** It keeps the alliance game intact (2-vs-2 73%, crowding 21%, Round 18). And the wrong side is already a real penalty in a race: on the Tide's side a player averages **+2.7** Glory per Evening, against it **+0.6** (Round 18). |
| Unsure about 2 Glory each for a pair | 3 / 1 / 0 plays well structurally (2-vs-2 70%), but the Reaping falls from about 40% to 23–27% of the winner's Glory, so the Choir's side matters less than the bets and cards. It also cannot be combined with the soft Crown: a leader in a pair would gain 0, and leaders gain at only 1% of Reapings (Round 17). | **Keep 3 / 2 / 0.** If solo play should stand out more, 4 / 2 / 0 measured best for alliances (2-vs-2 79%, crowding 16%), but early leaders win 53% at 3 players (Round 18). |
| The Crown feels overpowered, especially at 3 | Confirmed. The Crown holder gained at the Reaping on **5%** of Days at 4 players (everyone else 34%), and 20% vs 44% at 3 (Round 16). | **Soft Crown: the sole leader gains 1 less at the Reaping.** Holder 30–41% vs others 39–45%, and still a brake on runaway leaders (Rounds 17–20). |
| Likes the Omen; is the Altar crowded? | The Altar averages **6.0 cards** at the reveal at 4 players (5.0 without the Omen) and 4.6 at 3 (3.7). Without it, the side with fewer Choirs wins 18% of Tides instead of 27%, and Days with no gain double at 3 players (Round 16). | **Kept.** One card, not a crowd. |
| Likes the tied Tide | — | **Kept.** |
| Which of the 44 cards would I remove? I liked all of them | 36 of the original cards were implemented in the lab. Random selections of them play **better** than the curated 44: skill 1.54–1.91 against 1.43, early leaders 31–39% against 40–43% (Rounds 19–20). | **Remove nothing.** Every game uses a **Pantheon** of 18 of the 69 cards, shuffled with 26 plain cards (section 3). |

## 1. The game in one page

**Components.** The 69 Host cards, 24 new plain cards, Glory markers, a Crown token.

**Setup.** Build the deck: the 24 plain cards, Hymn, Lamentation, and a Pantheon of 18 (7 Light, 7 Dark, 4 Neutral, chosen or dealt at random; section 3). Shuffle. Each player takes a hand of 3 and a Choir of 2 face-up cards (room for 4).

**Each Day:**

1. **Morning.**
   - **The Omen:** put the top card of the deck facedown on the Altar.
   - In the Morning abilities (Prophecy, Council, Bounty).
   - **First Fruits:** everyone reveals 1 card from hand at once, face up on the Altar, then draws 1.
2. **Noon.** In turn order, each player takes one action:
   - **Offer:** put a card from your hand facedown on the Altar in front of you. It is your vote and your **wager**.
   - **Gather:** take any Altar card into your Choir (a facedown one blind).
   - **Exalt:** put a card from your hand into your Choir.

   Gather and Exalt are free. A full Choir discards a card to make room. Then use your Choir's "On your turn" abilities.
3. **Evening.**
   - Reveal the Altar. The heavier side is the **Tide**. **A tie keeps yesterday's Tide** (on Day 1, no Tide).
   - **The Reaping:** count the Choirs leaning with the Tide.

     | Choirs with the Tide | Each of them gains |
     |---|---|
     | One | 3 |
     | Two | 2 |
     | Three or more | nothing |

     Choirs against the Tide gain nothing. **The Crown:** if one player alone has the most Glory, they gain 1 less at the Reaping.
   - **Wagers:** each of your Offers that matches the Tide gains you 1; each that opposes it costs you 1. Neutral cards neither win nor lose.
   - Resolve "at the end of the Day" abilities.
   - Clear the Altar and draw to 3.

**End.** After a Reaping at which anyone has **12 Glory**, the most Glory wins (ties share).

## 2. The numbers (recommended rules)

All-Monte-Carlo games, 400 per line (Round 20), with the current V44 rules under the same players for comparison (Round 13).

| | Starter Pantheon, 4p | Random Pantheon, 4p | V44, 4p | Starter Pantheon, 3p | Random Pantheon, 3p | V44, 3p |
|---|---|---|---|---|---|---|
| Length | **6.5 Days, ~30 min** | 7.4 Days, ~34 min | 13.8 Days, ~64 min | **6.4 Days, ~25 min** | 6.9 Days, ~26 min | 14.1 Days, ~54 min |
| Winner's Glory tied to the Tide | 70% | 72% | 19% | 77% | 78% | 28% |
| Player-Days that gain at the Evening | 68% | 65% | 23% | 65% | 65% | 26% |
| Days nobody gains | 4% | 3% | 47% | 7% | 6% | 55% |
| Choirs hiding at Neutral | 3% | 3% | 32% | 3% | 3% | 15% |
| 2-vs-2 Days (4p) / crowded Days | 69% / 21% | 68% / 21% | 5% / 24% | — / 14% | — / 15% | — / 28% |
| Sole Day-3 leader wins (chance 25% / 33%) | 38% | **31%** | 33% | 49% | **39%** | 44% |
| Crown holder vs others, Reaping gain rate | 30% vs 39% | 29% vs 40% | — | 41% vs 45% | 40% vs 45% | — |
| Win ratio by seat | 0.94–1.05 | 0.79–1.09 | 0.92–1.11 | 0.94–1.08 | 0.94–1.11 | 0.96–1.02 |

"Tied to the Tide" counts the Reaping, wagers, and abilities that pay only on a Tide result. The rest comes from abilities that pay on other conditions (Martyr, Apple, Outcast, Hubris…).

**Skill and exploits** (one tested player; win ratio, 1.00 = fair share):

| | Starter Pantheon | Random Pantheon | V44 |
|---|---|---|---|
| Monte Carlo player among heuristic players | **1.62** (4p), **1.58** (3p) | **1.91** (4p, race to 13), 1.54 (3p) | 1.44 |
| Always Offer, never build (among Monte Carlo players) | 0.15 (curated deck) | 0.13 | 0.80 |
| Never change sides | 0.60 | — | 0.63 |

**Why plain cards are still needed.** Shuffling all 36 implemented original cards with no plain cards drops the Tide to 53% of the winner's Glory, raises crowding to 36%, and makes abilities 55% of the score (Round 19, `rec_all`). The plain cards are what keep the Tide the centre.

## 3. Pantheons: keep every card

The box holds all 69 cards plus 24 new plain cards. A game uses 44:

| Always | Count |
|---|---|
| Faithful (Light +1, no ability, new) | 10 |
| Fallen (Dark +1, no ability, new) | 10 |
| Pilgrim (Neutral, no ability, new; an empty vote for bluff Offers) | 4 |
| Hymn (Light +2), Lamentation (Dark +2) | 2 |
| **The Pantheon:** 7 Light, 7 Dark and 4 Neutral cards from the 69 | 18 |

Players learn only the 18 abilities in play, and every game is a different Heaven. This is the model Dominion uses (10 kingdom cards per game from a large pool), and it is what keeps a 69-card collection light to play. The plain cards can share one illustration per alignment.

**The Starter Pantheon** (first games; mirrored pairs, so 18 cards teach about 12 texts):

| Light | Dark | Neutral |
|---|---|---|
| Tree of Life, Providence, Raphael, Seraphim, Uriel, Mercy, Morning Star | Leviathan, Mammon, Azazel, Legion, Beelzebub, Defiance, Scapegoat | Firmament, Council, Prophecy, Vessel |

**Other ways to choose a Pantheon:** named sets by theme ("War in Heaven": Michael, Anathema, Winnowing, Envy…; "Covenants": Council, Raguel, Covenant, Bounty…); a draft (each player picks cards in turn before the game); or random.

### Every card under the new rules

**Works as written (54).** Michael, Wisdom, Providence, Confession, Tree of Life, Free Will, Seraphim, Hymn, Raphael, Sanctuary, Martyr, Covenant, Tribute, Revelation, Cherubim, Morning Star, Absolution, Knowledge, Deliverance, Vessel, Eternity, Acolyte, Nephilim, Firmament, Flaming Sword, Outcast, Heresy, Council, Mirage, Veil, Prophecy, Watchers, Apple, Forger, Jubilee, Anathema, Serpent, Temptation, Legion, Lamentation, Azazel, Moloch, Leviathan, Hubris, Belial, Mammon, Envy, Lilith, Winnowing, Silence, Scapegoat, Defiance, Abaddon, Snare. (Vessel is already a wager; Prophecy already wins 1 or loses 1.)

**Needs a reword (they mention losing Glory, or pay without the Tide):**

| Card | Proposed text | Measured |
|---|---|---|
| Mercy | At the end of the Day: If you gained nothing at the Reaping, gain 1 Glory, then discard this card. | spent card* |
| Uriel / Beelzebub | When you gain at the Reaping: if your Choir has 3 or more other Light (Dark) cards, gain 2 more. | 0.84 / 0.85 |
| Remnant | When you gain at the Reaping: if 2 or more places in your Choir are empty, gain 1 more. | 0.82 / 0.75 |
| Favor | At the end of the Day: If 2 or more other players gained nothing at the Reaping, gain 1 Glory. | 1.66 / 0.94 (consider 3 or more at 4 players) |
| Bounty | In the Morning: name a player. At the end of the Day, if they gained nothing at the Reaping, gain 1; if they gained, lose 1. | 0.98 / 1.13 |
| Ordeal | On your turn: You may invoke this card. Double the Glory you gain at this Reaping. | 1.21 / 1.24 |
| Gabriel | In the Morning: name another player and Light or Dark. If they Offer a card of that alignment this Day, gain 1. (Drops the look at a hand, which undercut the bluffing.) | not tested |
| Raguel | At the end of the Day: If the Bound player gained at the Reaping, gain 1 Glory. | not tested |
| Parasite | At the end of each Day, if its holder gained nothing at the Reaping, you gain 1; if they gained, discard this card. | not tested |
| Zealot | When you gain at the Reaping: if every other card in your Choir (at least 2) shares one alignment, gain 1 more. | a close version 0.82–1.05 |

**Needs a new idea (they reward hiding at Neutral, which the new rules remove):**

| Card | Proposed text | Measured |
|---|---|---|
| Stillness | At the end of the Day: If the Altar was tied (the Tide held from yesterday), gain 2 Glory. | "+1 if the Tide matches yesterday's" measured 1.69 / 1.45, too strong; this version not tested |
| Moderation | If your Choir leans neither way, each of your Offers that matches the Tide gains 1 more. (A lane for pure gamblers.) | 0.60 / 0.95, weak; try +2 |
| Twilight | In the Evening, before the reveal: choose Light or Dark. This card counts as that alignment +1 for this Day. | not tested |
| Fig Leaves | In the Evening, before the reveal: your Offers that oppose the Tide this Day cost you nothing. | not tested |

\* Michael, Mercy and Abaddon discard themselves when used, so "held at the end" win ratios mean little for them.

**Measured inside random Pantheons** (win ratio of the card's holders, 4p / 3p, 400 games; each card appears in about half of them, so expect about ±0.2 of noise):

| Card | 4p | 3p | Card | 4p | 3p |
|---|---|---|---|---|---|
| Martyr | 1.32 | 1.10 | Firmament | 0.92 | 1.19 |
| Apple | 1.30 | 1.16 | Scapegoat | 0.87 | 0.85 |
| Leviathan | 1.25 | 1.10 | Providence / Mammon | 0.87 | 0.56 |
| Anathema | 1.21 | 0.94 | Hubris | 0.84 | 0.95 |
| Ordeal | 1.21 | 1.24 | Uriel / Beelzebub | 0.84 | 0.85 |
| Seraphim / Legion | 1.17 | 0.88 | Defiance | 0.82 | 0.81 |
| Envy | 1.16 | 1.05 | Council | 0.77 | 1.00 |
| Prophecy | 1.04 | 0.97 | Snare | 0.71 | 1.06 |
| Vessel | 1.01 | 1.42 | Outcast | 0.64 | 0.86 |
| Raphael / Azazel | 0.95 | 0.95 | Mirage | 0.61 | 1.12 |
| Morning Star | 0.94 | 1.35 | Acolyte | 0.57 | 0.81 |
| Tree of Life | 0.93 | 1.36 | Winnowing | 0.55 | 1.18 |

The low ones (Winnowing, Acolyte, Mirage, Outcast) are mostly cards the bots play crudely; watch them with people before changing them. Providence and Mammon cash in and leave the Choir, so their figure understates them (they produced 2.4 Glory a game).

**Not yet implemented in the lab (31):** Wisdom, Gabriel, Confession, Free Will, Sanctuary, Covenant, Tribute, Revelation, Cherubim, Absolution, Knowledge, Deliverance, Eternity, Raguel, Twilight, Zealot, Nephilim, Fig Leaves, Flaming Sword, Heresy, Veil, Watchers, Forger, Jubilee, Serpent, Temptation, Moloch, Belial, Lilith, Parasite, Silence. Most are information, protection or card-flow tools whose value depends on people; they should be safe in a Pantheon of 18 because each game has only a few of them.

## 4. Why each rule

**Offers are wagers.** With a flat 1 Glory per Offer, 77–81% of the winner's Glory came from simply taking the Offer action, whatever the Tide did (Round 1). A wager puts the score on the Tide, and it is the game's best bluff: lean Light in public, bet Dark in secret. 35–45% of Offers do exactly that when a player expects their own side to lose. Making a wrong wager cost 1 gives every Offer stakes without touching the alliance structure (Round 18).

**No Reaping losses; three or more on a side gain nothing.** Under V44, strong players avoid losses by hiding at Neutral (32% of Choirs), so the Tide pays nobody on 47% of Days. With no Reaping losses, hiding disappears and the table forms **two alliances of two** on about 70% of Days. Any table that pays a trio brings herding back (3-vs-1 on 55–62% of Days, Round 2), and so does any broad loss (Round 16): when losing costs, everyone piles onto the likelier side. "Three or more gain nothing" is the rule that keeps alliances small. It is also the conversation the game is built for: "If you join us, none of us scores."

**The soft Crown.** Without a Crown, the sole Day-3 leader wins 52–54% (Round 16). The first Crown (the leader counts as two Choirs) fixed that by locking the leader out of the Reaping. The soft Crown takes 1 from the leader's Reaping gain instead. It is visible, it creates a reason to catch the leader, and it is never a lockout.

**The Omen.** Borrowed from Battlestar Galactica's Destiny cards: a little noise on a hidden vote means a surprising Tide might be bad luck or might be betrayal. It raises upsets and cuts dead Days at the cost of one card on the Altar.

**A tied Tide keeps yesterday's Tide.** 15–19% of Tides were ties that paid nobody. Holding the Tide cut Days with no gain from 16% to 5% and raised the skill edge (Rounds 14–15).

**Race to 12.** About 30 minutes at 4 players and 25 at 3 with the Starter Pantheon.

**Measured and rejected** (all rounds):
- Two turns per player each Day (57 minutes).
- Removing First Fruits (dead Days rise to 41%).
- First Fruits paying wagers.
- A Choir limit of 3; a hand of 4; replaced cards returning to hand.
- Turn order with the trailing player last.
- The hard Crown.
- Losses for every Choir against the Tide; for heavy leans; for Neutral Choirs; for a lone loser.
- A trio gaining 1.
- My first curated 44-card deck (it worked, but Pantheons of the original cards measured better and keep every card).

## 5. What the simulations cannot tell you

The bots do not talk. Everything social needs people:

- Do people actually bet against their own side, and does a lost wager feel like a fair sting or a punishment?
- Do 2-vs-2 alliances form by talk, and are they ever broken on purpose?
- Does the soft Crown feel like a handicap or a target?
- **3 players** is 2-vs-1 on about 80% of Days, and early leaders win 39–49% (chance 33%). Is the lone player's position fun?
- Teaching time: target under 5 minutes to the first First Fruits with the Starter Pantheon.

## 6. Playtest plan

1. **Print-and-play:** the Starter Pantheon (18 existing cards), Hymn and Lamentation, 24 plain cards, a Crown token. One evening of work.
2. **Five sessions, at least two groups,** 3 and 4 players, two games each. Record:
   - teach time and game time;
   - side changes per player;
   - wagers against the Offerer's own side;
   - who held the Crown each Day;
   - each player's best and worst moment;
   - **who asks to play again.**
3. Then try a random Pantheon, and change one thing at a time.
4. **Online:** a new card version with these rules, the Pantheon setup in the lobby, and the lab's Monte Carlo player (`game/tools/lab/bots.ts`) in place of the current bots.

## Revision 3 candidate: the lean core (Round 21)

Robert's rule: the most strategy and nuance for the least complexity, with real game theory and negotiation tension meeting engine building. Revision 2 had picked up three rules that patch symptoms (the Crown, the Omen, the held Tide), and the Choir's strength never mattered, so building did not touch the alliances. Round 21 tested removing the patches and adding one rule that links them: **the senior partner.**

| Starter Pantheon, race to 12 | Skill | Day-3 leader wins 4p / 3p | Crowded Days 4p / 3p | Outnumbered side wins 4p | Days nobody gains 4p |
|---|---|---|---|---|---|
| Revision 2 (soft Crown, Omen, held Tide) | 1.59 | 40% / 45% | 22% / 12% | 26% | 3% |
| No Crown | 1.47 | 38% / 51% | 21% / 12% | 26% | 3% |
| No Crown, no Omen | 1.83 | 39% / 51% | 27% / 19% | 19% | 4% |
| No Crown, no Omen, no held Tide | 1.67 | 41% / 44% | 24% / 19% | 17% | 10% |
| **Senior partner, no Crown, no Omen** | **2.08** | **37%** / 50% | 23% / 16% | 20% | 4% |
| Senior partner with Crown and Omen | 1.79 | 39% / 46% | 19% / 9% | 34% | 3% |

**The senior partner:** when exactly two Choirs share the Tide, the one leaning more strongly gains 3 and the other gains 1 (equal strength: 2 each). Alone still gains 3; three or more gain nothing.

It does three things at once:

- **It links the engine to the alliance.** Choir strength now decides who leads a partnership.
- **It answers "no punishment for leaning heavily"** from the reward side: heavy leaning pays.
- **It makes every ally a rival**, the coopetition at the heart of games like Cosmic Encounter.

The Crown and the Omen matter only at 3 players (about 5 points of early-leader advantage), so the lean core drops them. The held Tide stays: without it, Days with no gain double.

**The lean core, complete:**

1. Three actions: Offer (a facedown wager), Gather, Exalt.
2. Wagers: +1 if the card matches the Tide, −1 if it opposes it.
3. The Reaping: alone 3; a pair, stronger 3 and weaker 1 (equal 2 each); three or more nothing.
4. A tied Altar keeps yesterday's Tide.
5. First to 12 after a Reaping; most Glory wins.
6. A Pantheon of 12–18 of the 69 cards with the plain cards.

The Crown and the Omen remain optional modules (the Crown for 3 players).

**Still open, and only people can answer it:**

- **Negotiation has nothing to trade.** Promises are unenforceable and nothing changes hands. Suggested playtest A/B: *players may trade cards from hand by mutual agreement at any time.* It turns votes into currency ("my Lamentation if you stay Dark") and makes broken deals possible (the card you sold me might come back as a wager against me).
- **3 players stays the weak count:** it is always two against one, and early leaders win 44–51% (chance 33%). The game is at its best at 4.
- **About 13 decisions per player per game**, which is inherent to a 30-minute game in turns. Each now carries more weight (side, strength, wager).
- **Caveat:** part of the senior partner's skill edge may come from the heuristic bots not valuing lean strength. Monte Carlo players among themselves measured fine on balance (seats, crowding, length), but its real value is how pairs feel to people.

## 7. Reproducing

```bash
cd game/tools/lab
../../node_modules/.bin/tsx exp.ts rec12_starter mc4 400 11000
../../node_modules/.bin/tsx exp.ts rec12_pantheon mc4 400 11000
python3 show.py results/r20.jsonl
```

`game/tools/lab/README.md` explains every mode and column. Rounds 1–15 (revision 1: the curated 44-card deck and the hard Crown) are in `results/r1.jsonl` to `r15.jsonl`; revision 2 is Rounds 16–20; the lean core is Round 21 (`results/r21.jsonl`, variants `r21_*`).
