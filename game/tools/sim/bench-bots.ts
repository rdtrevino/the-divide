// Speed and determinism check for the engine's strong bot: plays games with Monte Carlo seats and prints a
// fingerprint of every move, so a faster implementation can be checked to make exactly the same choices.
// Games run on every core (../par.ts); WORKERS=1 runs them on one.
// Usage: npx tsx bench-bots.ts <games> [players] [strongSeats: all|one] [advanced]
import { createHash } from 'node:crypto';
import { playBotGame } from '@divide/engine';
import { pmap, workerCount } from '../par';
const G = Number(process.argv[2] ?? 6), n = Number(process.argv[3] ?? 4), mode = process.argv[4] ?? 'all', advanced = process.argv[5] === 'advanced';
const t0 = performance.now();
const games = await pmap(G, (i) => {
  const strong = mode === 'all' ? Array.from({ length: n }, (_, k) => k) : [i % n];
  const g = playBotGame({ seed: 5000 + i, mode: 'open', advanced, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) }, 20000, strong);
  return JSON.stringify(g.inputs.map((x) => [x.seat, x.id, x.choice])) + JSON.stringify(g.state.players.map((p) => p.glory));
});
const h = createHash('sha256');
for (const s of games) h.update(s);
console.log(JSON.stringify({ games: G, players: n, strong: mode, advanced, workers: Math.min(G, workerCount()), secondsPerGame: +((performance.now() - t0) / 1000 / G).toFixed(3), fingerprint: h.digest('hex').slice(0, 16) }));
