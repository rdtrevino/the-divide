# Bots: strong, fast and human-like

November 19, 2026. Robert asked whether testing and play bots could be both strong and fast, instead of choosing one. The answer is three layers. All three are done (layer 3 except pacing and the site's level picker).

## Where the bots stood

| Bot | Speed | Strength | Used by |
|---|---|---|---|
| Fast heuristic (`game/packages/engine/src/bots.ts`) | about 4 ms for a whole game | the yardstick (Offers about 33% of actions) | the live site, and inside the strong bot's searches |
| Monte Carlo (`mc.ts`) | about 33 ms a decision; 1.6 s for a game where all 4 players use it | wins about 2× its share among heuristic bots | simulations only |
| Lab Monte Carlo (`game/tools/lab/bots.ts`) | 0.45 s for a 4-player game | the lab's strong player | rule experiments |

The site cannot run the Monte Carlo bot: Cloudflare's free plan gives a request about 10 ms of CPU.

## Layer 1: the same bots, faster (done)

Nothing about how the bots choose has changed. Every game was checked to play exactly the same moves and scores as before, by a fingerprint of all its moves (`game/tools/sim/bench-bots.ts`).

1. **Copies from the start of the Day, not replays from the deal.** The strong bot tries each option on copies of the game. Each copy used to be rebuilt by replaying every move since the deal. Now the engine saves the state at the start of every Day, and a copy (`Game.fork`) replays only today's moves. The log and stats, nine tenths of a late-game state, are shared rather than copied, because nothing changes an entry once it's written. A test (`packages/engine/test/fork.test.ts`) checks that a copy always matches a full replay.
2. **Every core.** `game/tools/par.ts` spreads a script's games over worker threads. Each game is still seeded by its number, so the result is identical to a single-core run. The lab's main modes (`exp.ts`: mc3, mc4, skill, dumb, rows) and `skill45.ts` use it; `WORKERS=1` runs on one core.
3. **A bug found on the way.** The Judgment Day choice being carried out was kept in a module-wide variable instead of in the game state. Two games running at once in the same process (a live game and the search's copies, or two rooms on the server sharing a worker) could take or clear each other's choice. It is now in the state. It did not change any of the games measured here.

| Seconds per game | Before | After, 1 core | After, all 4 cores | Speed-up |
|---|---|---|---|---|
| Engine, all 4 players strong (24 games) | 1.58 | 0.93 | **0.53** | **3.0×** |
| Engine, all 3 players strong (24 games) | 0.83 | 0.47 | **0.30** | **2.7×** |
| Engine skill check, `skill45.ts` (100 games) | 0.38 | 0.23 | **0.13** | **2.9×** |
| Lab, one variant, 100 all-Monte-Carlo 4-player games | 0.40 | 0.40 | **0.13** | **3.1×** |

What limits it:
- **4 cores give about 2× in the engine, not 4×.** Copying states makes a lot of memory garbage, and Node's garbage collector already keeps about half an extra core busy per process. Plain arithmetic scales to 4×; these games don't. The lab copies less and scales better (3.1×).
- **Making the engine skip its log in copies saved only 5%,** so it was not kept: not worth a special case in the rules code.
- **Duplicate deals don't reduce the noise of a skill test.** Each deal played from every seat gave ±0.09 at 400 games, the same as independent deals: what happens during a game outweighs the deal. Paired games still help when two variants are compared on the same seeds, as `card-value.ts` does. `skill45.ts` now prints a standard error (`se`); ±2 se is the noise band.

## Layer 2: a learned bot, and a hybrid (done)

**The learned bot** (`game/packages/engine/src/learned.ts`) is a small neural network (243 inputs, 128 and 64 hidden units) that scores the options of the six decisions the strong bot searches. Minor decisions go to the heuristic, as in the strong bot.
- **What it reads:** only what its seat may see, read from `viewFor`, the same view the site sends a player. A test re-deals everything hidden (other hands and token colors, facedown Altar cards, the deck) and checks the inputs do not change; it was shown to catch a planted leak.
- **Its inputs:**
  - the table: the Day, the Tide track, Glory, Choirs, token counts, the Altar as read, the hand;
  - each option's card and kind;
  - the arithmetic a careful player does: the chance each side wins today before and after the option, what it is worth tonight, what lasts.
- **Its teacher:** the strong bot's estimate of every option it tried, over 5,000 games (`game/tools/distill`).
- **Its training:** a ranking loss, so each decision counts the same whatever its scale. With squared error, Judgment Day's 100-point swings drowned the rest, and the bot reached only 1.09×.
- **The site's bots now use it** (`roomCore.ts`), with a warm-up when the Worker starts. Not yet deployed.

**The hybrid** (`HYBRID` in `learned.ts`) is the strong bot's search, but only over the network's top 2 options, each played out 4 times by the learned bot.

| Bot | Among 3 heuristic bots (600–800 games) | Against the strong bot, 2 seats each (400–600 games) | ms a decision, averaged over all decisions |
|---|---|---|---|
| Heuristic | 1.00 | — | 0.03 |
| **Learned** (since the token correction: 1.55 and 0.99 vs 1.01, layer 3) | **1.62 ± 0.07** | **0.81 vs 1.19** | **0.15–0.2** |
| Hybrid, top 2 × 2 playouts | 1.69 ± 0.08 | 1.07 vs 0.93 | 3.9 |
| **Hybrid, top 2 × 4 (`HYBRID`)** (since the token correction: 1.09 vs 0.91) | **1.76 ± 0.08** | **1.12 vs 0.88** | **6.9** |
| Strong (Monte Carlo) | 1.98 ± 0.09 | 1.00 | 6.7 (33 on the decisions it searches) |

- **The learned bot** keeps over half the strong bot's edge over the heuristic, at about 1/35 of its cost. It is the bot for the site: after warm-up, a decision takes a median 0.15 ms and at most about 3.7 ms (the first few). The free plan allows 10 ms a request. The weights are 206 KB, packed as base64 float32. The website bundle does not include them.
- **The hybrid** beats the strong bot head-to-head at the same cost. Use it where simulations want strong players.
  - It scores less against heuristic bots because the plain strong bot simulates its opponents as exactly those bots: an advantage only in that test.
  - Like the learned bot, it has the current rules built in, so new rule ideas still go to the plain strong bot and the lab.

**What did not help**, each measured in play:
- **More data and DAgger** (training on positions the learned bot itself reaches): 1.56–1.62, no gain.
- **A stronger teacher:** the strong bot with learned playouts beats the plain one 1.13 to 0.87, but a student trained on it was no better (0.79–0.80 against the strong bot).
- **The smaller network** (64 and 32 hidden units): 1.56 against 1.62, at 0.15 ms against 0.22.

The single-glance network looks like it has reached its ceiling. More strength comes from adding search (the hybrid), not from more imitation.

**Retraining** after a rule or card change takes about 15 minutes (`game/tools/distill/README.md`): generate data, train, test, copy the weights.

## Layer 3: human-like play, on the learned bot (done, except pacing)

Everything here is built on the learned bot, which is cheap enough for heavy testing: a 4-player game takes about 14 ms (heuristic bots: 3; the strong bot: about 2,000). **The simulations now play it by default** (`game/tools/sim/bot.ts`; `BOT=heuristic` for the old bot): 16,000 games take about a minute on 4 cores.

**A correction first.** The style tests showed the learned bot Offered tokens too freely (8.7 a game at a 4-player table):
- An Expert that rarely Offered tokens beat it 1.16 to 1.
- Its own token spending lost even at a table of such players (0.81).
- The teacher's estimate of a held token is rough.

A token Offer now costs the learned bot a little extra (`TOKEN_OFFER_COST` in `learned.ts`). With it, **the learned bot plays the strong bot even (0.99 to 1.01, from 0.81)** and still beats heuristic bots 1.55×; token Offers fall to 3.4 a game. Retraining with a better token estimate should replace the correction.

**Levels** (`LEVELS` in `game/packages/engine/src/persona.ts`): the learned bot's scores, sampled with a temperature, so a weaker player's mistakes are close calls, not blunders. 600 games each (`tools/sim/personas.ts`):

| Level | Temperature | Among 3 heuristic bots | Among 3 Experts |
|---|---|---|---|
| Novice | 2 | 0.35 | 0.21 |
| Casual | 1 | 0.77 | 0.43 |
| Skilled | 0.5 | 1.13 | 0.71 |
| Expert | 0 | 1.51 | 1.00 |

**Styles** (`STYLES`): small bonuses for kinds of move, at Expert sharpness. 800 games each:

| Style | Plays | Among other styles | Among 3 Experts |
|---|---|---|---|
| Loyalist | pushes toward its own token majority | 0.97 | 0.71 |
| Builder | favors Exalt and Gather | 0.90 | 0.83 |
| Hoarder | rarely Offers a token | 1.35 | 1.01 |
| Gambler | Offers tokens freely | 0.61 | 0.60 |
| Bluffer | avoids Choir cards that give its side away (below) | 1.18 | 0.71 |

**No style beats balanced play** among Experts (principle 9): predictable loyalty and free token spending lose.

**Reads, and a finding about the game** (`tools/sim/reader.ts`):
- **The reader:** a logistic model of each player's side from public facts only: their Choir's colors, the cards they have put in it, the tokens they have Offered and Gathered, and the Day. It is fitted on half the games and scored on the other half.

| Table | The reader names a player's side | Guessing |
|---|---|---|
| Heuristic bots | 57% | 51% |
| Strong (Monte Carlo) bots, 400 games | **73%** | 50% |
| Expert learned bots, 2,000 games | **83%** | 51% |

- **Strong players hedge:** they hold tokens of one color and build a Choir of the other, so they are paid whichever side wins. A Light card going into a strong player's Choir reads as Dark tokens.
- **That makes sides readable under strong play.** It cuts against principle 2 (a side you can never be sure of) and is the vision's "engine versus Tide" tension. The lab measured 52%, with a different model and bots that hedge less. Tested in `core-validation.md`: one end-of-game rule, Devotion, brings it to 50–58% (proposed, not adopted).
- **The Bluffer** avoids Choir cards that move this reader toward its true side. The reader names its side only 38% of the time, worse than guessing, against 82% for the Experts. It gives up the hedge's income (0.71 among Experts), and bots never act on reads, so what a bluff earns against people who do cannot be measured here.

**Not done:**
- **Pacing:** thinking longer on close decisions, a server and UI change.
- **Choosing a level or style when seating a bot on the site:** the server plays the Expert. It needs a room option and UI.
- **Fitting the bots to real games from the site:** not yet.

**What no layer gives:** talk. Bots still cannot negotiate, promise or betray (principle 7). Only people can test that.
