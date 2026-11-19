// Play-test the learned bot (learned.ts) with a weights file.
// Usage: npx tsx eval.ts <weights.json | builtin> <games> <mode>
//   skill4, skill3: one learned seat among heuristic bots (the same seeds as tools/sim/skill45.ts). 1.00 is a fair share.
//   vs4, vs3:       the learned bot against the strong (Monte Carlo) bot: half the seats each, alternating by game.
//   (The strong bot's own skill on the same seeds: tools/sim/skill45.ts.)
//   mclskill4:      the strong bot with the learned bot playing its playouts (expert iteration), among heuristic bots.
//   mclvs4:         that bot against the plain strong bot, two seats each.
import { readFileSync } from 'node:fs';
import { Game, STRONG, botAnswer, learnedAnswer, strongAnswer, type Decision, type GameState } from '@divide/engine';
import { pmap } from '../par';

const [file, gStr, mode = 'skill4'] = process.argv.slice(2);
const net = file === 'builtin' ? undefined : JSON.parse(readFileSync(file, 'utf8'));
const G = Number(gStr ?? 200), n = Number(mode.slice(-1));
const LEARNED_PLAYOUTS = { ...STRONG, policy: (s: GameState, d: Decision) => learnedAnswer(s, d, net) };

const t0 = performance.now();
const res = await pmap(G, (i) => {
  const g = new Game({ seed: 4000 + i, mode: 'open', players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  // Which bot plays each seat; `tested` are the seats measured.
  const kind = Array.from({ length: n }, (_, k) => {
    if (mode.startsWith('skill')) return k === i % n ? 'learned' : 'heur';
    if (mode.startsWith('mclskill')) return k === i % n ? 'learned' : 'heur';
    if (mode.startsWith('mclvs')) return (k + i) % 2 === 0 ? 'learned' : 'mc';
    return (k + i) % 2 === 0 ? 'learned' : 'mc';
  });
  let ms = 0, calls = 0, acts = 0, offers = 0;
  const answer = (d: Decision) => {
    const k = kind[d.seat];
    if (k === 'learned') { const t = performance.now(); const a = mode.startsWith('mcl') ? strongAnswer(g, d, LEARNED_PLAYOUTS) : learnedAnswer(g.state, d, net); ms += performance.now() - t; calls++; return a; }
    if (k === 'mc') return strongAnswer(g, d);
    return botAnswer(g.state, d);
  };
  while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, answer(d));
  const s = g.state, tested = kind[0] === 'heur' ? kind.findIndex((x) => x !== 'heur') : -1;
  for (const e of s.stats) if (kind[e.seat!] === 'learned' && e.type === 'action' && e.source !== 'fruits' && e.source !== 'offer.card') { acts++; if (e.source === 'offer') offers++; }
  const share = (who: string) => s.players.filter((p) => kind[p.seat] === who).reduce((t, p) => t + (s.result!.winners.includes(p.seat) ? 1 / s.result!.winners.length : 0), 0);
  void tested;
  return { learned: share('learned'), mc: share('mc'), seatsL: kind.filter((x) => x === 'learned').length, seatsM: kind.filter((x) => x === 'mc').length, ms, calls, acts, offers };
});
const sum = (f: (r: (typeof res)[number]) => number) => res.reduce((t, r) => t + f(r), 0);
const ratio = (who: 'learned' | 'mc') => {
  // Win share relative to the share of seats: 1.00 is fair. Standard error over games.
  const xs = res.map((r) => (who === 'learned' ? r.learned / r.seatsL : r.mc / r.seatsM) * n).filter((x) => Number.isFinite(x));
  const m = xs.reduce((a, b) => a + b, 0) / xs.length, se = Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / (xs.length - 1) / xs.length);
  return { ratio: +m.toFixed(2), se: +se.toFixed(2) };
};
const out: Record<string, unknown> = { mode, games: G };
if (sum((r) => r.seatsL)) Object.assign(out, { learned: ratio('learned'), learnedOfferShare: +(sum((r) => r.offers) / Math.max(1, sum((r) => r.acts))).toFixed(2), msPerLearnedDecision: +(sum((r) => r.ms) / Math.max(1, sum((r) => r.calls))).toFixed(3) });
if (sum((r) => r.seatsM)) out.mc = ratio('mc');
out.secondsPerGame = +((performance.now() - t0) / 1000 / G).toFixed(2);
console.log(JSON.stringify(out));
