# The Divide, as it stands

November 19, 2026. One place for the whole current design: what the game is now, how it got here, and how it measures against the vision (`vision.md`) and every other version we tested. **Adopted by Robert as the version to build and playtest (V45):** it is now the rulebook (`rules/The_Divide_Rulebook_v15.md`), the card data and the online game. See "V45: building it" at the end for what changed on the way in.

## In one paragraph

Three or four players share one Altar. Every Day, each of you either **Offers** a card facedown to push the Altar toward Light or Dark, or takes a card into your **Choir** (your face-up engine). The heavier side wins the Day. Each of you secretly holds a handful of **allegiance tokens**, some Light and some Dark, and at the end every token is worth a point for each Day its side won. Pushing the Altar helps everyone who holds that side, maybe including you, maybe not. Building your Choir helps only you. **Every card you play is a choice between helping yourself and helping a side you can never be sure is yours.**

## The game on one page

**Components**
- The Host deck.
- 18 allegiance tokens (9 Light, 9 Dark) for 3 players; 24 (12 and 12) for 4.
- A **Tide track** with one space per Day, and Day markers that are Light on one side and Dark on the other.
- A Glory track.

**Setup**
1. Shuffle the tokens facedown and deal **6 to each player**. Look at yours and keep them hidden. Mixes are uneven (4 and 2, 5 and 1, 3 and 3…), and nobody knows anyone else's.
2. Deal each player a hand of 3 and a starting **Choir of 2 face-up cards** (room for 4).
3. Choose a first player. The game lasts **7 Days**; the seventh is **Judgment Day**, when everyone chooses their action in secret before anyone acts (adopted after Round 43, below).

**Each Day**

1. **Morning: First Fruits.** Everyone puts one card from hand facedown in the middle. Shuffle them and turn them face up onto the Altar (nobody knows who gave which), then everyone draws 1.
2. **Noon: one action each**, starting with the first player:
   - **Offer:** play a card from your hand facedown onto the Altar. **Or Offer one of your tokens facedown: it counts 2 for its color.**
   - **Gather:** take a card or token from the Altar. A card goes into your Choir (discard one first if it is full). A token joins your hidden tokens. You may take a facedown one without looking.
   - **Exalt:** play a card from your hand into your Choir.
3. **Evening.**
   1. Shuffle the facedown Offers (and tokens) together and turn them face up, so nobody can tell whose was whose.
   2. **The heavier side wins the Day:** place a Day marker on the Tide track, that side up. On a tie, place no marker.
   3. **Choirs score:** each player who **Offered this Day** gains **2 Glory for each card of the winning color in their Choir** (no offering, no harvest; Round 45).
   4. **Tokens left on the Altar** are shuffled facedown and handed out one at a time to whoever holds the fewest tokens.
   5. Discard the Altar, draw back to 3, and pass the first-player marker left.

**End of the game.** After the last Day, everyone reveals their tokens.
- **Each token scores 1 for every Day its color won.**
- Most Glory wins.

> Example: Light won 4 Days and Dark won 2. Ada holds 4 Light and 2 Dark tokens: 4 × 4 + 2 × 2 = 20, added to the Glory her Choir earned during the game.

### Teaching it in one minute

> "Everyone has six secret tokens, some Light and some Dark. Each Day, the Altar decides which side wins; we mark it here. At the end, every token is worth a point for each Day its side won. So you want your side to win, but you never quite know who else is on it.
>
> Each turn, do one thing. Offer a card to push the Altar your way, Gather a card off the Altar into your Choir, or Exalt a card from your hand into your Choir. Your Choir scores 2 for each card every time its color wins.
>
> You can also Offer one of your tokens: it counts double. But then it's gone, and so is your share in that side. And no offering, no harvest: your Choir only scores on a Day you Offered."

## What changed from the published game (V44)

| | V44 (rulebook v14) | Now | Why (vision principle) |
|---|---|---|---|
| Your side | Your Choir's lean, in public | **A secret mix of allegiance tokens** that can change hands | 2. Uncertain allegiance: lost when the 3-player variant became the core game in V33 |
| Scoring each Evening | The Reaping by lean: alone 3, a pair 1 each, three or more nothing; against the Tide −3 or −1 | **2 Glory per Choir card of the winning color**, no losses | 1. Self vs side; and Robert's "rewarding, not punishing" |
| End of the game | Race to 12 | **7 Days**, the last a secret-choice **Judgment Day**, then the token reveal | One number to learn; nobody acts last with the most knowledge on the deciding Day; a reveal at the end of every game |
| Offer | Facedown, +1 Glory now | Facedown, **no Glory**: the Offer is a pure public good | 1. The public-goods dilemma (paying for Offers made them private goods) |
| Who Offered what | Revealed card by card | **Shuffled before the reveal**; First Fruits shuffled too | 2. Reads, not certainties |
| Free-riding | Nothing stopped it | **No offering, no harvest**: your Choir scores only on a Day you Offered | 1. Without it, Offers halve; checked each Evening, nothing to track (Round 45) |
| Gather, Exalt, Choir of 4, hand of 3, First Fruits | — | Kept | 3, 5. Load-bearing |
| The 69 cards | All in one deck | Plain cards for now; the **Starter Pantheon** (18 ability cards) is tested below; full Pantheons are the next step | 5, 6. The engine layer |
| Celestials, Events, Hidden Roles (5–6p) | Optional | Untouched; not yet fitted to this core | — |

## How we got here

| Rounds | What was tried | What it taught |
|---|---|---|
| 1–21 | V44 and patches to it: wagers, 3/2/0 Reaping, the Crown, the Omen, tie rules, Pantheons, the senior partner | Strong bots found real gains (Pantheons, removing patches), but **paying for Offers turned the public good private**, and every patch made a new symptom |
| 22–30 | Whole new cores: Pax-style Dominance, a collection plate, secret Fates, multiplied Fates, Oaths | **A secret side is the missing core.** Paying only on your side's Days stops hedging; the Miser's Rule stops free-riding; Oaths (a side you can lose or steal) were the best fit |
| 31–34 | Measuring how readable sides are at 3 players | Under Oaths a card-counter read sides 98% of the time; anonymous First Fruits and an anonymous reveal help, and **hidden Choirs were rejected** (Robert: the engine stays public) |
| 35–37 | Robert's two ideas: allegiance twists (creeds), and a mix of tokens | **Mixed tokens solve readability with face-up Choirs** (about 64%). Follower and Balancer work at 3p only; double agents are too strong |
| 38 | Simpler scoring for tokens | **The Tide track**: one shared count replaces per-player banks, with no loss |
| 39 | The three finalists head to head | **Choir paying 2** hides sides best, measures the most skill, and balances self against side |
| 40 | The championship: every milestone core under the same tests | Below |

## Validation: the championship (Round 40)

Every milestone version was played under the same tests in one round (`game/tools/lab`, `results/r40.jsonl`, `r40-reader.txt`).
- **Main games:** 300 per version at 3 players and 300 at 4, all strong (Monte Carlo) bots.
- **Skill:** one strong bot among three simple ones, 300 games at 4 players.
- **Fixed strategies:** 150 games each at 4 players.
- **Reader:** a gradient-boosted model trained on everything the table can see.

A win rate of 1.00 is a fair share; with 300 games, differences under about ±0.1 are noise.

| | V44 (published) | Lean core (rev. 3) | Oaths | Creeds (Follower, Balancer) | Tokens with banks | Tide track, Choir pays 1 | **Tide track, Choir pays 2** | Choir pays 2 + Starter Pantheon |
|---|---|---|---|---|---|---|---|---|
| Your side | public (Choir lean) | public | secret Oath card | secret creed | secret tokens | secret tokens | **secret tokens** | secret tokens |
| **Reader, 3p / 4p** (guessing ≈ 35–40%) | 100% (public) | 100% (public) | 72% / 72% | 62% / 63% | 65% / 65% | 66% / 66% | **52% / 53%** | **49% / 49%** |
| **Skill**: strong vs simple play, 4p | 1.40× | 2.11× | 2.85× | 2.75× | 3.37× | 3.46× | **3.66×** | 3.10× |
| **Always Offer**, 4p | **0.83** | 0.35 | 0.66 | 0.36 | 0.11 | 0.01 | **0.00** | 0.01 |
| **Never Offer**, 4p | 0.00 | 0.20 | 0.46 | 0.05 | 0.05 | 0.00 | **0.04** | 0.00 |
| **Never switch sides**, 4p | **0.66** | 0.44 | **0.85** | 0.17 | 0.06 | 0.04 | **0.03** | 0.08 |
| Fair across secret sides, 4p | — | — | 0.94–**1.67** (Forsaken) | 0.84–**1.47** (Follower) | 0.86–1.07 | 0.89–1.09 | **0.87–1.08** (Round 39, 400 games: 0.98–1.03) | 0.88–1.18 |
| Fair across seats, 4p | 0.88–1.22 | 0.96–1.09 | 0.79–1.32 | 0.93–1.05 | 0.78–1.24 | 0.92–1.06 | **0.86–1.11** | 0.80–1.16 |
| Same with weaker players (all simple bots), 4p: sides | — | — | — | — | — | 0.81–1.30 | **0.90–1.12** | 0.91–1.05 |
| Length, 3p / 4p (strong bots) | **50 / 47 min** (13 and 10 Days) | 26 / 30 | 27 / 32 | 27 / 32 | 27 / 32 | 23 / 37 | **23 / 37** | 23 / 37 |
| Offers (share of actions), 3p / 4p | 63% / 68% (paid +1 Glory) | 35% / 37% | 54% / 53% | 56% / 53% | 57% / 52% | 59% / 55% | **50% / 48%** | 44% / 44% |
| Days decided by the last turn, 4p | 30% | 20% | 28% | 29% | 44% | 46% | **43%** | 45% |
| The reveal changes who wins, 3p / 4p | no reveal | no reveal | no running score | no running score | no running score | 19% / 24% | **15% / 21%** | 21% / 24% |
| Checkable on a real table | yes | yes | **no** (secret scoring) | yes | yes, two banks each | yes | **yes** | yes |

### What the championship shows

- **Only the token versions make every simple strategy lose.** In V44, always Offering wins 0.83 of a fair share and never changing sides 0.66; under Oaths, never switching wins 0.85. Those games can be played on autopilot. Under the Tide track, every fixed strategy wins 0–4%: every turn has to be read.
- **Choir paying 2 is the most skillful version measured (3.66×)** and the hardest to read (52–53%). It also holds up best with weaker players: sides stay within 0.90–1.12 when everyone plays simply, where Choir paying 1 drifts to 0.81–1.30.
- **The cards make it better still at hiding sides.** With the Starter Pantheon of 18 ability cards, the reader drops to 49% and the game stays fair (0.88–1.18 with strong players, 0.91–1.05 with weaker ones), though skill falls a little (3.10×). The bots value the old abilities with old estimates, so treat this as a first look, not a result.
- **V44 with strong players is too long.** Careful play stretches the race to 12 to 10–13 Days (47–50 minutes); fixed Days hold the new game to 23 and 37.
- **Where H does not win:**
  - The lean core is a little fairer by seat and shorter at 4 players.
  - Choir paying 1 has more Offers (55% against 48%).
  - V44 and the lean core have no hidden information to learn.

  None of those versions passes the vision's core (a side you can never be sure of).

## Against the vision

`vision.md`'s test, with the principles it serves:

| Test | V44 | Lean core | Oaths | Creeds | Tokens, banks | **Tide track (Choir pays 2)** |
|---|---|---|---|---|---|---|
| 1. Self vs side (principle 1) | weak: Offering paid you | weak: wagers paid you | yes | yes | yes | **yes, and evenly balanced:** your side ("with" 1.48–1.65 vs "against" 0.37–0.54) and your Choir both decide |
| 2. Uncertain allegiance (2) | no | no | partly (72%) | yes (62%) | yes (65%) | **yes, the most (52%)** |
| 3. The Altar as a contest (3) | yes | yes | yes: Oaths stolen | yes | yes: tokens | **yes: tokens Offered, taken and redistributed** |
| 4. Allies are rivals (1) | weakly (pairs) | yes (senior partner) | yes | yes | yes | **yes:** a Light Day pays every Light token, yours and your rivals' |
| 5. Checkable on the table (6) | yes | yes | **no** | yes | yes, but heavy | **yes, and light:** two shared counts, single-digit arithmetic |
| The engine is public (5) | yes | yes | yes | yes | yes | **yes:** Choirs face up and scoring every Evening |
| Every game different (8) | yes | yes | yes | yes | yes | **yes:** a random deal of tokens, plus the starting Choir |
| Talk (7) | cheap | cheap | yes | yes | yes | **yes, with shared numbers to argue over** (needs people) |

## Verdict: is this the most elegant, balanced and intriguing version?

**Of everything we have tested, yes.** That is more than 200 rule sets over 40 rounds, and on the measures that stand for those three words it is first or tied for first:

- **Elegant.** It has the fewest rules of any version with a secret side, and each rule is one sentence. Scoring is one shared number per color, and nothing needs a hidden ledger. It is the only secret-side version that is both checkable and light.
- **Balanced.** Token mixes, seats and sides are all within about ±0.1 with strong players, and it holds with weaker players too. No fixed strategy wins.
- **Intriguing.** It measures the most skill of any version, and sides are the hardest to read while Choirs stay public. Days are often decided on the last turn, and the final reveal changes the winner in about one game in five.

**What "yes" does not mean:**
1. **It is not proven fun.** Bots cannot negotiate, bluff or betray, and they do not feel the reveal. Those are the parts of the game the vision cares about most, and only people can test them.
2. **The engine layer is not finished.** It is tested with plain cards and the 18-card Starter Pantheon. Many of the 69 cards are written for V44 (lean, pairs, Glory for Offering) and need rewording for this core. That is the biggest piece of work left.
3. **Length:** 23 minutes at 3 players is a little under the target and 37 at 4 a little over, by the time model. People's real times will decide.
4. **Not yet fitted:** Celestials, Events and the 5–6 player Hidden Roles mode.
5. **It can still be beaten.** It is the best of what we tried, not a proof that nothing better exists. The next gains will come from playtests, not more simulation.

## Next

1. **A print-and-play** for your group: the Tide track, 24 tokens, the one-page rules above and a player aid.
2. **Rewrite the Starter Pantheon's 18 cards** for this core, then the rest of the 69.
3. **A playable table on the site**, to collect real games, times and reveals.

## V45: building it (Rounds 41–43)

**Every card is Light or Dark** (Robert's call while it was being built). In the engine, with the real 69 cards, the 23 Neutral cards never scored at the Reaping and measured 0.50 to 0.70: traps. Two fixes were measured:

| | 23 Neutral cards that never score | Neutral cards score 1 on any won Day | **Every card Light or Dark** |
|---|---|---|---|
| Card groups (engine bots) | Neutral 0.79 | 0.98–1.08 | **Light 1.04, Dark 0.94** |
| Days nobody wins (engine) | 29% | 29% | **20%** |
| Reader, 3p / 4p (lab) | 52% / 55% | 55% / 58% | **52% / 52%** |
| Skill, 4p (lab) | 3.63× | 3.54× | 3.56× |
| Extra rules | none, but traps | one, and a Neutral Offer satisfies the Miser's Rule while pushing nothing | **none** |

Coloring them serves principle 5 (synergy by alignment: every card is a side) and principle 6 (one fewer concept to teach). After the rewording pass in `CHANGELOG.md`, every Host card measures 0.75 to 1.25 and every Celestial 0.86 to 1.23 over 20,000 bot games (`balance.md`).

**Hidden Roles is retired.** The tokens do what it was for. At 5 and 6 players the token core still hides sides (a reader 53–57%), but a fair turn order needs a multiple of the player count in Days (5 or 10 at 5 players, 6 at 6), and seats measured 0.59 to 1.43 (lab Round 41, `results/r41.jsonl`). The game is for 3 and 4.

**What the engine bots cannot show** is the same as before: talk, bluffs, and how the reveal feels. The engine bots are also weaker than the lab's (they Offer about 33% of the time against the lab bots' 50%), so treat their card numbers as a floor check.

## Seven Days at every table? (Round 43, a proposal)

Robert asked whether every player count could play the same number of Days, 7, so there is one number to learn, including at 5 and 6 players. The difficulty is not the number. A fixed 7 gives some seats the last turn on the last Day, and that seat sees the most and decides the most. The fix tested is in the structure, not a catch-up: **Judgment Day**. On the last Day, everyone chooses their action in secret, and the choices are carried out together in turn order. A card chosen for Gathering that is already gone is simply not taken.

Strong lab bots, the current V45 rules with every card Light or Dark (600 games at 3 players, 500 at 4, 300 at 5, 250 at 6). Win rate by seat, 1.00 is fair:

| Players | 7 Days | 7 Days + Judgment Day | Length (time model) |
|---|---|---|---|
| 3 | 0.77–1.17 | **0.92–1.12** | 27 min |
| 4 | 0.84–1.24 | **0.89–1.16** | 32 min |
| 5 | 0.78–1.23 | **0.91–1.24** | 37 min |
| 6 | 0.63–1.29 | **0.85–1.13** | 43 min |

Token mixes stay fair throughout (0.89 to 1.09). For comparison, the current rule (6 Days at 3 players, 8 at 4) measured 0.95–1.03 and 0.92–1.06. With 300 games at 5 players, about ±0.12 is noise.

**What it means.** With Judgment Day, 7 Days works at every count from 3 to 6. It is a touch less even than 6 or 8 Days at 3 and 4 players, but it gives one number to teach, a climax that is itself a bluff (everyone commits blind), and a path back to 5 and 6 players. The cost is one rule. It passes the vision's test on the first and third questions: on the last Day, help-yourself and help-your-side are chosen blind, and the Altar becomes a contest nobody can watch. **Adopted by Robert (November 19):** in rulebook v15, the engine and the site. The game stays for 3 and 4 players for now; 5 and 6 are possible later on the same rule.

## Tokens and the Offer (Rounds 44–45)

Robert questioned three pieces: a token costing a whole action, where leftover tokens go, and a Miser's Rule that needs tracking. The full results are in `tokens-and-offering.md`. In short:
- **The Miser's Rule is replaced by "no offering, no harvest"**: your Choir scores only on a Day you Offered. Offers rise to 67–68% of actions, play stays fair, strong play beats simple play 3.91× (the most of any version), and there is nothing to track across the game.
- **Tokens stay an Offer**, and are best made card-shaped so a token Offer looks like any other. Making tokens cheaper to play (at dawn, or free alongside an action) gets them used more but makes the uneven mixes matter more.
- **Leftover tokens still go to whoever holds the fewest.** It works as a refund in disguise, and every alternative makes players hoard.
- **Cards reworked for the new rule:** Anathema (other players' Offers go face up, instead of being blocked), Temptation (turns a rival's card to the other color for the Day), Mercy (only if you Offered), Moloch (3), Ordeal (no penalty), Favor (your Choir outscored everyone else's).

## Under strong play (core validation, November 19)

The engine's strong bots validated the core: fair seats and token mixes, every fixed strategy loses, and no offering, no harvest, Judgment Day and the leftover rule all earn their place. One weakness showed:
- **Strong players hedge:** they hold tokens of one color and build a Choir of the other.
- **So sides are readable:** a reader names them 70–72% of the time (guessing: 50%).

**The fix, if it is ever needed, is one end-of-game rule, Devotion:** each Choir card of the color you hold more tokens of scores 1. It brings the reader to 50–58% and makes your side matter more. Optionally, deal 8 tokens each, which gives the fairest seats. **Held until playtesting:** it would add a rule for a problem only consistently strong players show. The evidence is in `core-validation.md`.

