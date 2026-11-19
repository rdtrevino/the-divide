# The rework lab

A small, fast model of The Divide's Open Game for testing rule reworks. It is **not** the real engine (`packages/engine`): it keeps only the Altar, the Tide, Choirs, First Fruits, the three actions, the Omen, the Crown, and a short list of switchable abilities. The proposal it produced is `design/rework-proposal.md`.

## Players

- `random`: any legal move.
- `heur`: a fast one-move heuristic. It estimates the Tide (reading facedown Offers by their owner's lean), counts who shares each side, and values Choir cards for the Days left. Used inside rollouts.
- `mc`: Monte Carlo. For every decision it re-deals everything it cannot see (other hands, unseen facedown Offers weighted toward their owner's lean, the deck), plays the rest of the Day for each option with the heuristic, and keeps the option that does best against the strongest rival on average (16 samples, up to 9 options).
- Fixed strategies for exploit checks: `offer` (always Offer), `build` (never Offer), `loyal` (never change sides), `follow` (always Offer toward the majority).

Check that the bots are ordered: `tsx smoke.ts 40` (random never wins among heuristics; Monte Carlo wins about 1.6x its share).

## Running experiments

Every variant is a named rule set in `variants.ts`. The main modes (mc3, mc4, mc5, mc6, h3, h4, skill, dumb, rows) spread one variant's games over every core (`../par.ts`) with the same result as one core (`WORKERS=1`); `run.sh` also runs several variants side by side, so give it fewer variants at a time, or `WORKERS=1`, to avoid oversubscribing.

```bash
./run.sh out.jsonl calib 0 <variants...>      # target for ~6.5 Days with heuristic bots
python3 merge-calib.py out.jsonl              # store targets in calib.json
./run.sh out.jsonl calibmc 0 <variants...>    # refine: target for 7 Days (4p) / 8 Days (3p) with Monte Carlo bots
./run.sh out.jsonl mc4 300 <variants...>      # 300 all-Monte-Carlo 4-player games per variant (mc3 for 3 players)
python3 show.py out.jsonl                     # the table
python3 abil.py out.jsonl                     # win ratio, play rate and Glory of each ability
```

Other modes: `skill4`/`skill3` (one Monte Carlo player among heuristics), `dumb4:<policy>` (one fixed-strategy player among Monte Carlo players).

## Columns in `show.py`

| Column | Meaning |
|---|---|
| days, dec, min | Days per game; decisions per player; estimated table minutes (First Fruits 0.6, each turn 0.75, Evening 1.0) |
| tide%, offr%, reap%, abil%, bet% | Share of the winners' Glory from Tide-linked sources (Reaping, bets, Tide abilities), flat Offer rewards, the Reaping alone, abilities, and Offer bets |
| reap, gain%, loss%, zero% | Mean Reaping result per player per Day; share of player-Days that gain / lose; share of Days nobody gains |
| close%, last%, undr% | Tides decided by 1 or less; Days the last player to act changed the Tide's direction; decided Tides won by the side with fewer Choirs |
| crowd%, neuC%, split | Days with 3+ Choirs on one side; player-Days with a Neutral Choir; how the table splits (2v2, 3v1, 2v1n...) |
| sw, x-bet | Side changes per player per game; share of Offers whose card opposes the Offerer's own lean |
| ldD3%, marg | Sole leader after Day 3 goes on to win (chance: 25% at 4p, 33% at 3p); 1st minus 2nd |
| WR | Win ratio of the tested seat (skill and exploit modes) |

All results from the proposal are in `results/` (round numbers match the proposal).

Rounds 38–42 (November 19): the Tide track (`DY` variants), the finalists (`A`, `B`, `H`, `M`), the championship of every milestone core (Round 40), 5 and 6 players (Round 41, modes `mc5`, `mc6`, `rows5`, `rows6`), and the deck's Neutral cards (Round 42: `HR`, `HN`, `HF`). Written up in `design/tide-track.md` and `design/the-game-now.md`.
