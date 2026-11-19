// Skill check for the engine's bots: one strong (Monte Carlo) seat among heuristic bots. 1.00 is a fair share.
// Usage: npx tsx skill45.ts <games> [players] [advanced]
import { STRONG, playBotGame } from '@divide/engine';
if (process.env.ROLLOUTS) STRONG.rollouts = Number(process.env.ROLLOUTS);
const G = Number(process.argv[2] ?? 100), n = Number(process.argv[3] ?? 4), advanced = process.argv[4] === 'advanced';
let wins = 0, offers = 0, acts = 0, toks = 0;
const t0 = performance.now();
for (let i = 0; i < G; i++) {
  const seat = i % n;
  const s = playBotGame({ seed: 4000 + i, mode: 'open', advanced, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) }, 20000, [seat]).state;
  if (s.result!.winners.includes(seat)) wins += 1 / s.result!.winners.length;
  for (const e of s.stats) if (e.seat === seat && e.type === 'action' && e.source !== 'fruits' && e.source !== 'offer.card') { acts++; if (e.source === 'offer') { offers++; if (e.data?.token) toks++; } }
}
console.log(JSON.stringify({ games: G, players: n, advanced, strongWinRatio: +((wins / G) * n).toFixed(2), strongOfferShare: +(offers / acts).toFixed(2), strongTokenOffers: +(toks / G).toFixed(2), secondsPerGame: +((performance.now() - t0) / 1000 / G).toFixed(2) }));
