# Allegiance: Robert's two ideas, tested

November 19, 2026. A proposal, not adopted. Robert's ideas from November 19, measured in `game/tools/lab` (Rounds 35–37, files in `results/`). Every test keeps **Choirs face up** (Robert's decision: the engine is public) and two of the hiding rules from `ground-up.md`: **anonymous First Fruits** and **anonymous reveal**. Games last 7 Days (about 27 minutes at 3 players, 32 at 4).

## The problem these ideas solve

At 3 players, a player's side leaked out because **every action leans toward their side**: if you are Light, nearly everything you do helps Light. With Choirs face up, hiding cards cannot fix that. Both ideas attack the cause instead: they make the same action come from different motives, so watching someone play no longer tells you their side (vision principle 2).

## The common base: two public banks

Every player keeps a **Light bank** and a **Dark bank**, in the open. Each Evening, add to the bank of the Tide's color **1, plus the cards of that color in your Choir**. Your engine and the Tide stay connected, and everyone can see the engine working. What is secret is only **how your banks score at the end**. Scoring is one piece of arithmetic on public numbers, so the game needs no hidden ledger and works in print.

## Idea 1: allegiances with a twist

A secret allegiance card says how your banks score:

| Card | Scores at the end |
|---|---|
| Faithful | your Light bank |
| Fallen | your Dark bank |
| Follower | your larger bank |
| Balancer | 1.5 × your smaller bank |
| Double agent | one bank, plus 1 for each card of the other color in your Choir |

**Measured (3 players; a perfect card-counter's accuracy at naming each player's card, against guessing):**

| Cards in the bag | Reader (guessing) | Win rates |
|---|---|---|
| Faithful and Fallen only | 95% (51%) | 0.97–1.03 |
| **+ Follower + Balancer** | **64% (36%)**, confident 34% | **0.96–1.10** at 3 players; at 4: Follower **1.57**, Balancer 0.71 |
| + Double agents | 66% (36%) | Double agents 1.20–1.55 (too strong even at +1; 1.9 at +2) |
| All of them | 46% (25%) | too opaque; Double agents strong |

**Verdict.** The Follower and Balancer work at 3 players: readable but not obvious, and balanced. At 4 the Follower is too strong (it simply takes whichever bank grew most) and needs its own tuning. Double agents as designed reward showing the other color too much; they need a different payoff or should be dropped. As in *Bang!*, whose solo Renegade is widely called close to an automatic loss, each twist has to be measured, not just designed.

## Idea 2: everyone holds a mix of allegiance tokens (recommended)

Allegiance tokens are a separate component: 9 Light and 9 Dark at 3 players (12 and 12 at 4), shuffled facedown and **dealt 6 to each player**, so mixes are uneven (4 and 2, 5 and 1, 3 and 3…) and nobody knows anyone else's.

**Score at the end = Light bank × Light tokens + Dark bank × Dark tokens.** Nobody is fully on one side: everyone has a stake in both, in hidden amounts.

Tested variations (3 players unless noted):

| Variation | Reader (guessing) | Confident | Win rate by mix | Tokens Offered a game |
|---|---|---|---|---|
| Even mix (3 and 3 each) | — | — | — | (everyone identical: no secret at all) |
| Random mix, tokens fixed | 62% (38%) | 29% | 0.93–1.11 | — |
| Random mix, tokens can be Offered (a token left on the Altar is lost) | 65% (37%); 4p 62% (34%) | 35%; 4p 24% | 0.87–1.20 (the even mix favored at 3) | 0.7 |
| **Random mix; a token left on the Altar goes to whoever holds the fewest** | **64% (34%)** | **35%** | **0.93–1.04** | **3.1** |
| "Winning color pays": only the color that won more Days scores | 64% (34%) | 32% | even mix 1.34 | 2.7 |
| Collecting bonus: +1 per token held | 63% (38%) | 31% | 0.89–1.08 | 0.3 (nobody gives tokens away) |
| Squared: tokens count squared (rewards committing to one color) | 65% (37%) | 34% | 0.83–1.23 (flips the favorite) | 0.5 |
| 4 tokens each | 65% (46%) | 32% | even mix 1.21 | 0.5 |
| Tokens as cards in the deck | 63% (38%) | 32% | 0.99–1.01 | Offers fall to 22% of actions; winning margins triple |

**The recommended version**, measured over 800 games at 3 players and 300 at 4:
- the reader is right 64% of the time (guessing: 34%), confident and right 35%;
- win rates by token mix 0.93–1.04;
- seats 0.90–1.10;
- tokens Offered about 3 times a game;
- strong play beats simple play by 3.47× at 4 players, the most of anything measured.

Simple strategies all lose: always Offer 0.12, never Offer 0.00, never change sides 0.11.

## Rules sketch (the recommended version)

**Components.** The Host deck; allegiance tokens (9 Light and 9 Dark for 3 players, 12 and 12 for 4); a Light and a Dark bank track for each player.

**Setup.** Shuffle the tokens facedown and deal 6 to each player. Look at yours and keep them hidden. Hand of 3, Choir of 2 face up.

**Each Day:**

1. **Morning.** First Fruits: everyone puts a card facedown; shuffle them together and turn them face up onto the Altar.
2. **Noon.** One action each:
   - **Offer** a card facedown, **or Offer one of your tokens facedown: it counts 2 for its color.**
   - **Gather** a card from the Altar into your Choir; a token you Gather joins your hidden tokens.
   - **Exalt** a card from your hand into your Choir.
3. **Evening.**
   - Shuffle the facedown Offers and tokens together, then turn them face up. The heavier side is the Tide.
   - **Banks:** everyone adds 1, plus their Choir cards of the Tide's color, to their bank of that color.
   - **Tokens left on the Altar** are set aside facedown; the player with the fewest tokens takes one, then the next fewest, until none are left.
   - Clear the Altar; draw to 3.

**End.** After 7 Days, reveal tokens. **Score = Light bank × Light tokens + Dark bank × Dark tokens.** The player who Offered the fewest times loses 9 (the soft Miser's Rule, at this scale). Most wins.

## Against the vision's test

1. **Self vs side: passes, more sharply than ever.**
   - Offering a card pushes your color but keeps it out of your Choir.
   - **Offering a token is the strongest push you have (+2), paid for with your own stake in that color: the public-goods dilemma in its purest form.**
   - Gathering keeps both of its edges.
2. **Uncertain allegiance: passes at 3 and 4 players with Choirs face up.** Everyone is partly on both sides. A perfect card-counter is right about two times in three and rarely confident.
3. **The Altar as a contest: passes.** The Altar now carries stakes: tokens are Offered, stolen by Gathering, and redistributed.
4. **Allies as rivals: passes.** Anyone leaning your way gains from the same Tide, but banks and stakes differ, and the player who sacrificed tokens to win it owns less of it.
5. **Checkable on the table: passes, the best of any core.** The banks are public tracks, the tokens are revealed once, and the end score is one sum per player.
6. **The engine is public: passes.** Choirs are face up and feed the banks.

## What the simulations cannot show

- Whether the end-of-game multiplication feels like a satisfying reveal or a chore. It is one multiplication per color per player; a score pad helps.
- Whether people Offer tokens as readily as the bots do (3 a game), or hoard them.
- **Trading tokens** by agreement (*Chinatown*, *Sidereal Confluence*) is the natural next step for negotiation, and only people can test it.
- Whether a twist card (Idea 1) layered on top of tokens adds fun or only confusion; untested together.

## Next

1. Tune Idea 1's Follower for 4 players and give the Double agent a smaller payoff, then try one twist card on top of tokens.
2. Rebuild the engine layer (the Pantheon) on banks and tokens.
3. Build it as a playable table on the site, and a print-and-play.
