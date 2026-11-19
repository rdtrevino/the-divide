// How readable is each player's side from what the table sees? (vision principle 2; the lab's reader for the engine.)
// At every Evening, for every player whose tokens are not evenly split: public facts only (their Choir's Light and
// Dark cards, the Light and Dark cards they have put in it all game, tokens they have Offered and Gathered, the Day),
// and the truth (more Light or more Dark tokens). A logistic model is fitted on half the games and scored on the
// other half. Guessing the more common side scores about 50%.
// Usage: [TABLE=heuristic|strong] npx tsx reader.ts <games> [persona for one seat: a LEVELS or STYLES name; the rest Expert]
//   TABLE: every seat plays the heuristic or the strong (Monte Carlo) bot instead of the Expert learned bot.
import { Game, HOST, LEVELS, STYLES, botAnswer, personaAnswer, strongAnswer, type GameState } from '@divide/engine';
import { pmap } from '../par';
const G = Number(process.argv[2] ?? 1000), who = process.argv[3];
const tested = who ? { ...LEVELS, ...STYLES }[who] : undefined;
const TABLE = process.env.TABLE;
export const READER_FEATURES = ['choir Light', 'choir Dark', 'put in Light', 'put in Dark', 'tokens Offered', 'tokens Gathered', 'Day'];

const color = (id?: string) => (id && HOST[id]?.alignment === 'dark' ? -1 : id && HOST[id] ? 1 : 0);
function publicFacts(s: GameState, seat: number, put: number[][]) {
  let off = 0, got = 0;
  for (const e of s.stats) if (e.seat === seat && e.type === 'action') { if (e.source === 'offer' && e.data?.token) off++; if (e.source === 'gather' && e.data?.token) got++; }
  const c = s.players[seat].choir.filter((x) => !x.facedown);
  return [c.filter((x) => color(x.id) > 0).length, c.filter((x) => color(x.id) < 0).length, put[seat][0], put[seat][1], off, got, s.day];
}

const games = await pmap(G, (i) => {
  const n = i % 2 ? 3 : 4;
  const ps = Array.from({ length: n }, (_, k) => (tested && k === i % n ? tested : LEVELS.expert));
  const g = new Game({ seed: 120000 + i, mode: 'open', players: ps.map((p, k) => ({ name: p.name + k, isBot: true })) });
  const put = Array.from({ length: n }, () => [0, 0]), rows: number[][] = [];
  let day = 1, seen = 0;
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, TABLE === 'heuristic' ? botAnswer(g.state, d) : TABLE === 'strong' ? strongAnswer(g, d) : personaAnswer(g.state, d, ps[d.seat]));
    const s = g.state;
    for (; seen < s.stats.length; seen++) { const e = s.stats[seen]; if (e.type === 'action' && (e.source === 'exalt' || e.source === 'gather') && e.card) { const c = color(e.card); if (c) put[e.seat!][c > 0 ? 0 : 1]++; } }
    if (s.day !== day || g.over) {
      for (const p of s.players) { const l = p.tokens.filter((t) => t === 'light').length, dk = p.tokens.length - l; if (l !== dk) rows.push([...publicFacts(s, p.seat, put), l > dk ? 1 : 0, ps[p.seat] === tested && tested ? 1 : 0]); }
      day = s.day;
    }
  }
  return rows;
});
// Fit on even games, score on odd ones.
const F = READER_FEATURES.length;
const train = games.filter((_, i) => i % 2 === 0).flat(), test = games.filter((_, i) => i % 2 === 1).flat();
const mu = Array.from({ length: F }, (_, j) => train.reduce((t, r) => t + r[j], 0) / train.length);
const sd = Array.from({ length: F }, (_, j) => Math.sqrt(train.reduce((t, r) => t + (r[j] - mu[j]) ** 2, 0) / train.length) || 1);
const z = (r: number[]) => r.slice(0, F).map((x, j) => (x - mu[j]) / sd[j]);
let w = new Array(F).fill(0), b = 0;
for (let it = 0; it < 300; it++) {
  const gw = new Array(F).fill(0); let gb = 0;
  for (const r of train) { const x = z(r), p = 1 / (1 + Math.exp(-(b + x.reduce((t, v, j) => t + v * w[j], 0)))); const e = p - r[F]; gb += e; x.forEach((v, j) => (gw[j] += e * v)); }
  w = w.map((v, j) => v - (0.5 * gw[j]) / train.length); b -= (0.5 * gb) / train.length;
}
const acc = (rows: number[][]) => rows.length ? rows.filter((r) => (b + z(r).reduce((t, v, j) => t + v * w[j], 0) > 0 ? 1 : 0) === r[F]).length / rows.length : NaN;
const base = (rows: number[][]) => { const l = rows.filter((r) => r[F] === 1).length / rows.length; return Math.max(l, 1 - l); };
const late = (rows: number[][]) => rows.filter((r) => r[F - 1] >= 5);
const out: Record<string, unknown> = { table: TABLE ?? 'expert', games: G, rows: test.length, readerAccuracy: +acc(test).toFixed(3), guessing: +base(test).toFixed(3), fromDay5: +acc(late(test)).toFixed(3),
  weights: Object.fromEntries(READER_FEATURES.map((k, j) => [k, +(w[j] / sd[j]).toFixed(3)])), bias: +(b - w.reduce((t, v, j) => t + (v * mu[j]) / sd[j], 0)).toFixed(3) };
if (tested) { const t = test.filter((r) => r[F + 1] === 1), o = test.filter((r) => r[F + 1] === 0); Object.assign(out, { [`${tested.name} read`]: +acc(t).toFixed(3), 'Experts read': +acc(o).toFixed(3) }); }
console.log(JSON.stringify(out, null, 1));
