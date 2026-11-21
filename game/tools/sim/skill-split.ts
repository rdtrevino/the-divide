// Where skill comes from (design/the-world.md): in skill games (one strong bot among three heuristic bots, 4 players), how
// often each ends on the world's side (its token majority won more Days), how often it wins from there, and its Glory.
// Usage: npx tsx skill-split.ts <variant> [games]
import { Game, STRONG, botAnswer, strongAnswer } from '@divide/engine';
const tokenScore = (_m: string, tl: number, td: number, wl: number, wd: number) => (Math.sign(tl - td) === Math.sign(wl - wd) ? 1 : 0);
import { pmap } from '../par';
import { variant } from './variants';
const [name, gStr = '200'] = process.argv.slice(2);
const rules = variant(name), G = Number(gStr);
const res = await pmap(G, (i) => {
  const seat = i % 4;
  const g = new Game({ seed: 200000 + i, mode: 'open', rules, players: [0, 1, 2, 3].map((x) => ({ name: 'P' + x, isBot: true })) });
  while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, d.seat === seat ? strongAnswer(g, d, STRONG) : botAnswer(g.state, d));
  const r = g.state.result!, w = r.daysWon;
  const elig = g.state.players.map((p) => tokenScore('eligible', p.tokens.filter((t) => t === 'light').length, p.tokens.filter((t) => t === 'dark').length, w.light, w.dark));
  return { seat, elig, winners: r.winners, glory: g.state.players.map((p) => p.glory) };
});
let se = 0, he = 0, sw = 0, hw = 0, swe = 0, hwe = 0, sg = 0, hg = 0;
for (const x of res) for (let k = 0; k < 4; k++) {
  const strong = k === x.seat, e = x.elig[k], win = x.winners.includes(k) ? 1 / x.winners.length : 0;
  if (strong) { se += e; sw += win; if (e) swe += win; sg += x.glory[k]; } else { he += e / 3; hw += win / 3; if (e) hwe += win / 3; hg += x.glory[k] / 3; }
}
console.log(JSON.stringify({ variant: name, games: G, strongEligible: +(se / G).toFixed(2), heurEligible: +(he / G).toFixed(2), strongWinIfEligible: +(swe / Math.max(1, se)).toFixed(2), heurWinIfEligible: +(hwe / Math.max(1e-9, he)).toFixed(2), strongGlory: +(sg / G).toFixed(1), heurGlory: +(hg / G).toFixed(1), skill: +(4 * sw / G).toFixed(2) }));
