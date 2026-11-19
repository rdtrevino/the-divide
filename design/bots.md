# Bots: strong, fast and human-like

November 19, 2026. Robert asked whether testing and play bots could be both strong and fast, instead of choosing one. The answer is three layers. Layers 1 and 2 are done; layer 3 is the plan.

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
| **Learned** | **1.62 ± 0.07** | **0.81 vs 1.19** | **0.15–0.2** |
| Hybrid, top 2 × 2 playouts | 1.69 ± 0.08 | 1.07 vs 0.93 | 3.9 |
| **Hybrid, top 2 × 4 (`HYBRID`)** | **1.76 ± 0.08** | **1.12 vs 0.88** | **6.9** |
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

## Layer 3: human-like play (after)

Strength and human-likeness are separate settings.
- **Close-call mistakes, not blunders:** choose among the best options with probabilities weighted by the search's values. Difficulty becomes a sharpness setting.
- **Real reads:** guess rival tokens with the lab's trained reader instead of "+8% per Choir card of a color".
- **Deliberate bluffing:** a small cost on moves that give your side away to the reader (vision principle 2: make the table read the message wrong). The reader numbers would then measure bots that hide on purpose.
- **Personalities:** the loyalist, the token hoarder, the builder, the gambler. Tables feel different, and we learn whether the game holds up against different styles (principle 9).
- **Pacing:** think longer on close decisions.
- **Later:** tune the bots to real games from the site, which records every move.

**What no layer gives:** talk. Bots still cannot negotiate, promise or betray (principle 7). Only people can test that.
