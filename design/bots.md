# Bots: strong, fast and human-like

November 19, 2026. Robert asked whether testing and play bots could be both strong and fast, instead of choosing one. The answer is three layers. Layer 1 is done; layers 2 and 3 are the plan.

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

## Layer 2: search offline, play from what it learned (next)

The approach behind strong poker and Go programs. The Monte Carlo bot plays thousands of games. A small model learns to predict its choices, and how good a position is, from what a seat can see: the Tide track, the Choirs, its hand and tokens, the Day, and its guesses about rival tokens.
- The model chooses in microseconds: fast enough for the site's free plan, and near Monte Carlo strength.
- It also replaces the heuristic inside the search, which makes the search stronger with fewer rollouts. Repeat 2–3 times.
- **Caveat:** a learned bot has today's rules built in. It is right for card balance and live play under V45, but biased on a new rule until retrained. New rules keep going through the search (layer 1).

## Layer 3: human-like play (after)

Strength and human-likeness are separate settings.
- **Close-call mistakes, not blunders:** choose among the best options with probabilities weighted by the search's values. Difficulty becomes a sharpness setting.
- **Real reads:** guess rival tokens with the lab's trained reader instead of "+8% per Choir card of a color".
- **Deliberate bluffing:** a small cost on moves that give your side away to the reader (vision principle 2: make the table read the message wrong). The reader numbers would then measure bots that hide on purpose.
- **Personalities:** the loyalist, the token hoarder, the builder, the gambler. Tables feel different, and we learn whether the game holds up against different styles (principle 9).
- **Pacing:** think longer on close decisions.
- **Later:** tune the bots to real games from the site, which records every move.

**What no layer gives:** talk. Bots still cannot negotiate, promise or betray (principle 7). Only people can test that.
