// Skill check for the engine's bots: one strong (Monte Carlo) seat among heuristic bots. 1.00 is a fair share.
// Games run on every core (../par.ts; WORKERS=1 for one) and give the same result either way.
// Every game has its own deal and the strong seat rotates. `se` is the standard error of the win ratio: ±2 se is the
// noise band. (Playing each deal once from every seat was tried: it did not reduce the noise, 0.09 either way at 400.)
// Usage: npx tsx skill45.ts <games> [players] [advanced]
import { STRONG, playBotGame } from '@divide/engine';
import { pmap } from '../par';
if (process.env.ROLLOUTS) STRONG.rollouts = Number(process.env.ROLLOUTS);
const G = Number(process.argv[2] ?? 100), n = Number(process.argv[3] ?? 4), advanced = process.argv[4] === 'advanced';
const t0 = performance.now();
const games = await pmap(G, (i) => {
  const seat = i % n, seed = 4000 + i;
  const s = playBotGame({ seed, mode: 'open', advanced, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) }, 20000, [seat]).state;
  let acts = 0, offers = 0, toks = 0;
  for (const e of s.stats) if (e.seat === seat && e.type === 'action' && e.source !== 'fruits' && e.source !== 'offer.card') { acts++; if (e.source === 'offer') { offers++; if (e.data?.token) toks++; } }
  return { win: s.result!.winners.includes(seat) ? 1 / s.result!.winners.length : 0, acts, offers, toks };
});
const sum = (k: 'win' | 'acts' | 'offers' | 'toks') => games.reduce((t, g) => t + g[k], 0);
const ratios = games.map((g) => g.win * n), mean = ratios.reduce((a, b) => a + b, 0) / G;
const se = Math.sqrt(ratios.reduce((t, x) => t + (x - mean) ** 2, 0) / (G - 1) / G);
console.log(JSON.stringify({ games: G, players: n, advanced, strongWinRatio: +((sum('win') / G) * n).toFixed(2), se: +se.toFixed(2), strongOfferShare: +(sum('offers') / sum('acts')).toFixed(2), strongTokenOffers: +(sum('toks') / G).toFixed(2), secondsPerGame: +((performance.now() - t0) / 1000 / G).toFixed(2) }));
