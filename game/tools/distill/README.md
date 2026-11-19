# Distilling the strong bot

Layer 2 of the bot plan (`design/bots.md`): the learned bot (`packages/engine/src/learned.ts`) is a small neural network
trained on the strong Monte Carlo bot's (`mc.ts`) estimate of every option it tries. It plays in well under a
millisecond a decision, so it can run on the site, and it sees only what its seat may see (it reads `viewFor`; a
test re-deals everything hidden and checks that its inputs do not change).

It has the current rules built in. After a rule or card change, regenerate the data and retrain; new rule ideas are
tested with the search bots, not this one.

```bash
npx tsx gen.ts 1000 data/r5a 500000         # games, out dir, first seed (about 5 minutes on 4 cores)
npx tsx gen.ts 1000 data/r5b 501000         # write in chunks: a run saves only when it ends, and train.py joins folders
python3 train.py data/r5a data/r5b --hidden 128,64 --epochs 15 --temp 0.5 --wd 1e-4 --out w.json   # numpy only, ~2 min
npx tsx eval.ts w.json 400 skill4           # one learned seat among heuristic bots (1.00 is a fair share)
npx tsx eval.ts w.json 400 vs4              # learned against strong, two seats each
cp w.json ../../packages/engine/src/learned.weights.json   # adopt it (packed: base64 float32)
npx tsx eval.ts w.json 400 hyvs4            # the hybrid (engine HYBRID) with these weights, against the strong bot
```

- **gen.ts** plays games with the teacher in every seat (in every fourth game, half the seats are heuristic bots), and
  writes, for every searched decision, the learned bot's inputs and the teacher's estimate of each option it tried.
  The teacher tries up to 10 options with 8 reshuffled worlds each, and plays a random one of them 10% of the time so
  the data covers more than its own best line. Every third game is advanced (Celestials and Events).
- **train.py** learns to rank a decision's options as the teacher does: its softmax over the options should match
  softmax(teacher's estimate / temp), so every decision counts about the same (Judgment Day's estimates swing by
  about 100, others by about 1). Games numbered …0 are held out. *Regret* is the teacher's estimate of its best option minus that
  of the option chosen, in its utility units (roughly Glory).
- **eval.ts** plays real games: the only measure that counts.
