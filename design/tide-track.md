# The Tide track: allegiance tokens made simple

November 19, 2026. A proposal, not adopted. **Current recommendation: option H** (the Tide track with Choirs paying 2), from Round 39 below. It refines `allegiance-tokens.md` after Robert's feedback that the scoring there ("Light bank × Light tokens + Dark bank × Dark tokens") was confusing, even for him. Measured in `game/tools/lab`, Round 38 (`results/r38.jsonl`, `r38b.jsonl`, `r38-reader.txt`). Choirs stay face up, and anonymous First Fruits and the anonymous reveal stay.

## Why the bank version was hard to grasp

| What a new player had to track | Bank version | Tide track |
|---|---|---|
| Numbers that change during the game | 2 banks per player (6–8 on the table) | 1 Glory per player, plus 2 shared Day counts |
| Rule for how they grow | "1, plus your Choir cards of the Tide's color, into that color's bank" | "The Tide's color gets a Day; Choirs score 1 per card of that color" |
| Final arithmetic | two multiplications of numbers up to 20 (e.g. 14 × 4 + 9 × 2) | single-digit multiplication on two numbers everyone shares (e.g. 4 × 4 + 2 × 2) |
| Who your score depends on | your private banks | everyone's shared Days, so everyone can see what a Day is worth to a Light token |

The banks were doing two jobs at once: connecting your Choir to the Tide, and setting what your tokens are worth. The Tide track splits those jobs into two simple rules.

## The idea: tokens are shares in a side

This is how stock games teach a hidden stake in a shared outcome (*Acquire*, *Modern Art*, *Imperial*, *Chicago Express*): **you own shares, and every share of a company is worth the same public price.** Here, the companies are Light and Dark, and the price is how many Days that side has won. Robert's first sketch already said it: "counting the tides and which everyone had the most tides."

**Your Choir pays when its color wins, and your tokens pay for every Day their color won.**

## Ideas considered and tested

All are measured with strong (Monte Carlo) bots: 400 games at 3 players and 300 at 4 per row. "Reader" means a perfect card-counter's accuracy at naming each player's leaning, against guessing (1.00 is a fair share of wins).

| # | Idea | Reader at 3p (guessing) | Win rate by token mix: 3p / 4p | Verdict |
|---|---|---|---|---|
| — | *Bank version (the previous proposal)* | 64% (34%) | 0.93–1.04 / — | Works, hard to teach |
| **A** | **Tide track: each token scores 1 per Day its color won; your Choir scores 1 per matching card each Evening** | **64% (35%)** | **0.99–1.02 / 0.95–1.05** | **Recommended** |
| B | Choir as public shares: no Evening payout; at the end, Choir cards score like tokens of their color | 65% (35%) | 0.97–1.03 / 0.98–1.03 | Just as good; one rule, but no running score during the game |
| C | "The world": only tokens of the color that won more Days score (4 each) | 67% (34%) | 0.96–1.04 / **0.72–1.22** | Out: the even mix loses at 4p, and once a color is out of reach the last Days stop mattering |
| D | 4 tokens each instead of 6 | 63% (38%) | 0.99–1.01 / 0.87–1.17 | Out: unbalanced at 4p |
| E | Tokens fixed (cannot be Offered) | 61% (40%) | 0.95–1.04 / 0.78–1.12 | Out as the main rule: it loses the token dilemma and the even mix suffers at 4p. Possible for a first teaching game |
| F | No Miser's Rule | 66% (38%) | 0.91–1.04 / 0.86–1.09 | Out: **Offers fall from about 57% of actions to 25%**. The Miser's Rule is what keeps the public good alive |
| G | Choir pays 0 (tokens only) | 69% (35%) | 0.78–1.25 / 0.94–1.05 | Out: the even mix is favored at 3p and allegiance is easier to read |
| H | Choir pays 2 | **51%** (35%) | 0.94–1.04 / 0.88–1.06 | A tuning lever: it hides allegiance much better, because the stake weighs less. Keep it in reserve |

### A finding about turn order (core, not patch)

With 7 Days at 3 players, the same seat goes last three times, including on the final Day, and wins 1.25 times its share. The fix is in the structure, not a catch-up: **play a number of Days that gives every seat the same turns**, 6 at 3 players (2 rounds) and 8 at 4.

| Option A | 3 players, 6 Days | 4 players, 8 Days |
|---|---|---|
| Win rate by seat | 0.95–1.03 | 0.92–1.06 |
| Win rate by token mix | 0.95–1.03 | 0.89–1.09 |
| Reader (guessing) | 66% (34%), confident and right 33% | (4p readers were lower in every earlier round) |
| Length | about 23 minutes | about 37 minutes |
| Tokens Offered a game | 2.9 | 3.7 |

**Strong play against simple play** (one strong bot among three simple ones, 4 players): 3.49× (the bank version was 3.37×). **Fixed strategies all lose** (4 players, 1.00 = fair share): always Offer 0.10, never Offer 0.02, never change sides 0.10.

The simplification costs nothing that we can measure.

## Round 39: the three finalists compared

Robert asked for a head-to-head comparison of A (the Tide track), B (Choir cards as public shares) and H (Choir pays 2). All three were run under the same conditions:
- 6 Days at 3 players and 8 at 4;
- 500 games at 3 players and 400 at 4, plus the reader, skill and exploit tests.

Two in-between versions were added: M (the Choir weighs 1.5 times a token-Day; numbers doubled to stay whole) and B2 (B with each Choir card worth two shares). Files: `results/r39.jsonl`, `r39-reader.txt`.

**Two new measures** separate *hiding* your side from *not acting on* it:
- **Token share**: how much of a final score comes from tokens.
- **Win rate by side of the world**: players whose tokens lean toward the color that won more Days ("with"), against it ("against"), or neither ("mixed").

| | A: Choir pays 1 | B: Choir as shares | **H: Choir pays 2** | M: 1.5 | B2: shares ×2 |
|---|---|---|---|---|---|
| Reader at 3p (guessing 35%) | 66% | 66% | **52%** | 59% | 51% |
| Reader at 4p (guessing 36%) | 66% | 64% | **53%** | 60% | 54% |
| Confident and right (3p / 4p) | 33% / 33% | 34% / 30% | **17% / 17%** | 27% / 24% | 14% / 17% |
| Human-style tally reader | 27% | 27% | 26% | 26% | 26% |
| Tokens' share of the score | 63% | 62% | 44% | 51% | 43% |
| Win rate "with" / "against" the world, 3p | 1.79 / 0.29 | 1.82 / 0.26 | **1.48 / 0.54** | 1.49 / 0.49 | 1.39 / 0.59 |
| Same, 4p | 1.95 / 0.19 | 1.80 / 0.24 | **1.65 / 0.37** | 1.80 / 0.36 | 1.43 / 0.63 |
| Offers (share of actions), 3p / 4p | 60% / 55% | 56% / 53% | 51% / 47% | 44% / 42% | 49% / 46% |
| Tokens Offered a game, 3p / 4p | 2.9 / 3.7 | 2.7 / 3.5 | 2.5 / 3.1 | 2.2 / 3.0 | 2.2 / 2.9 |
| Win rate by token mix, 3p | 0.98–1.02 | 0.95–1.05 | 0.94–1.09 | 0.96–1.06 | 0.92–1.04 |
| Same, 4p | 0.92–1.12 | 0.96–1.06 | **0.98–1.03** | 0.92–1.08 | 0.93–1.10 |
| Win rate by seat, 3p | 0.91–1.07 | 0.84–1.18 | 0.88–1.07 | 0.94–1.12 | 0.83–1.25 |
| Same, 4p | 0.91–1.07 | **0.77–1.32** | 0.89–1.12 | 0.86–1.17 | 0.82–1.19 |
| Strong vs simple play (4p) | 3.46× | 3.21× | **3.66×** | 3.43× | 3.34× |
| Always Offer / never Offer / never switch (4p) | 0.01 / 0.00 / 0.06 | 0.02 / 0.00 / 0.04 | 0.00 / 0.03 / 0.04 | 0.00 / 0.11 / 0.08 | 0.00 / 0.00 / 0.04 |
| Winner's score, 3p / 4p | 23 / 32 | 23 / 33 | 31 / 44 | 53 / 76 | 32 / 45 |
| Running score during the game | yes | **no** | yes | yes | no |

### What the numbers say

**Why H is harder to read.** A reader fails for one of two reasons: players act on their side but the table can't see it, or players act on their side less.
- H is partly the second. Tokens fall from 63% of a score to 44%, so players play for their Choir more often, and the Choir is public and says little about the tokens.
- **But the side still matters a great deal.** Ending with the world on your side still makes you about three times more likely to win than ending against it (1.48 against 0.54 at 3 players).

**That is the vision's own balance.** The first rulebook: "Faction victory makes you eligible. Glory makes you the winner. Neither is enough on its own, and that gap is where the game lives."
- **In A, the side is nearly enough.** Ending against the world is close to a certain loss (0.19 at 4 players), so the game is mostly "be on the right side".
- **In H, both halves count:** the side you back and the Choir you build. That is principle 1 (self versus side) at its most even.

H also has:
- the highest skill gap of anything measured (3.66×);
- the most even 4-player token mixes (0.98–1.03).

**The cost of H** is a little less public good. Offers fall from 60% to 51% of actions at 3 players, and token Offers from 2.9 to 2.5 a game. Both are still healthy, and the Miser's Rule still holds the floor.

**B is out.**
- **It has no running score.** Nobody's Glory moves until the reveal, so the table has no signal of who is ahead.
- **A card added on the last Day scores as much as one from the first.** That breaks principle 5 (an engine "should matter more the longer you invest").
- **The last seat gains the most of any version** (up to 1.32 at 4 players). Gathering a Choir card on the final Day is worth that color's whole Day count.

B2 shows that doubling B's Choir has the same hiding effect as H, with all of B's problems.

**M sits between A and H** and needs bigger numbers (winners score 53–76), which costs simplicity for no gain.

### Recommendation: H, the Tide track with the Choir paying 2

The rules are those of option A with one number changed: **in the Evening, your Choir scores 2 Glory for each card of the winning color.** It costs nothing to teach and gains on almost every measure:
- harder to read (52–53%; confident and right only 17%);
- the most skill;
- the fairest at 4 players;
- the self-versus-side balance the vision asks for.

What only people can show:
- **Whether a less readable table makes talk better or vaguer.** At 52%, a careful reader is still right half the time, well above guessing, so claims can be checked against play, but no one is ever sure.
- Whether players feel their tokens matter enough. They are 44% of a score; if playtests say tokens feel like an afterthought, M (1.5) is the measured step back toward A.

## Rules sketch (option H; option A is identical with Choirs paying 1)

**Components.** The Host deck. Allegiance tokens: 9 Light and 9 Dark for 3 players, 12 and 12 for 4. A **Tide track** with a space for each Day (6 or 8) and a Day marker that is Light on one side and Dark on the other. A Glory track.

**Setup.** Shuffle the tokens facedown and deal 6 to each player. Look at yours and keep them hidden. Hand of 3, Choir of 2 face up.

**Each Day:**

1. **Morning: First Fruits.** Everyone puts a card facedown; shuffle them and turn them face up onto the Altar.
2. **Noon: one action each.**
   - **Offer** a card facedown, or **Offer a token facedown: it counts 2 for its color.**
   - **Gather** a card or token from the Altar. A card goes to your Choir, and a token joins your hidden tokens.
   - **Exalt** a card from your hand into your Choir.
3. **Evening.**
   - Shuffle the facedown Offers and turn them face up. The heavier side wins the Day: **mark it on the Tide track.**
   - **Choirs score:** 2 Glory for each card of the winning color in your Choir.
   - **Tokens left on the Altar** are shuffled facedown and dealt out, one at a time, to whoever holds the fewest tokens.
   - Clear the Altar and draw back to 3.

**End.** Everyone reveals their tokens.
- **Each token scores 1 for every Day its color won.**
- The player who Offered the fewest times loses 3.
- Most Glory wins.

> Example: Light won 4 Days and Dark won 2. You hold 4 Light and 2 Dark: 4 × 4 + 2 × 2 = 20, added to the Glory your Choir earned (2 per matching card each Evening).

## Teaching it in one minute

> "Everyone has six secret tokens, some Light and some Dark. Each Day, the Altar decides which side wins; we mark it here. At the end, every token is worth a point for each Day its side won. So you want your side to win, but you never quite know who else is on it.
>
> Each turn, do one thing. Offer a card to push the Altar your way, Gather a card off the Altar into your Choir, or Exalt a card from your hand into your Choir. Your Choir scores 2 for each card every time its color wins.
>
> You can also Offer one of your tokens: it counts double. But then it's gone, and so is your share in that side. And whoever Offers the least loses 3."

The whole game is in those three paragraphs: the public good (Offer), self-interest (Choir), and the hidden stake (tokens).

## Against the vision's test

1. **Self vs side.** Offering a card helps the side and costs your Choir. Offering a token is the strongest push (+2) and costs your own share in that side. Gathering keeps both of its edges.
2. **Uncertain allegiance.** Everyone holds a stake in both sides. A perfect card-counter is right about two times in three and rarely confident (33%).
3. **The Altar as a contest.** Tokens are Offered facedown, can be taken, and circulate to whoever holds the fewest.
4. **Allies as rivals.** A Day won for Light pays every Light token, yours and your rivals'. Who wins comes down to who paid for that Day and who kept their tokens and built their Choir.
5. **Checkable on the table.** Two shared Day counts, single-digit arithmetic, one reveal. This is the main gain over the bank version.
6. **The engine is public** (principle 5). Choirs are face up and score with the Tide.

## What the simulations cannot show

- Whether the reveal feels exciting. It should: everyone already knows what a token of each color is worth, so the drama is only in what people hold.
- **Talk.** Because the Day counts are shared, the table can argue in plain terms ("Light is up 3–1; whoever holds Light should be paying now"). Two zero-cost rules to try with people:
  - Anyone may show a token at any time. One token proves little when you hold six.
  - Tokens may be traded facedown by agreement, with no way to check what you got.
- Whether people Offer tokens as readily as the bots (about 3 a game) or hoard them.
- Whether 8 Days at 4 players feels long. The time estimate (about 37 minutes) comes from the decision-time model, not from people.

## Next

1. A print-and-play: a Tide track, tokens, a one-page rules sheet and a player aid.
2. A playable table on the site, so your group can try it online.
3. The engine layer (a Pantheon of the 69 cards) on top of option A.
