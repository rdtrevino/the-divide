// Human-like players (engine persona.ts): calibrate sharpness, and check that no playing style dominates.
// Usage: npx tsx personas.ts <games per line> <mode>
//   sweep:  one player at each temperature among three Expert players (the learned bot). 1.00 is a fair share.
//   levels: each named level among three heuristic bots, and among three Experts.
//   styles: four of the styles at each 4-player table, rotating; then each style alone among three Experts.
import { Game, LEVELS, STYLES, botAnswer, personaAnswer, type Persona } from '@divide/engine';
import { pmap } from '../par';
const G = Number(process.argv[2] ?? 400), mode = process.argv[3] ?? 'sweep';

const HEUR: Persona = { name: 'Heuristic', temperature: 0 }; // a seat played by the heuristic bot
const expert = LEVELS.expert;
const one = (p: Persona, rest: Persona) => (i: number) => { const a = [rest, rest, rest, rest]; a[i % 4] = p; return a; };
// Each line: a label, the persona measured, and the table for game i.
const lines: { label: string; measure: string; seats: (i: number) => Persona[] }[] = [];
if (mode === 'sweep') for (const t of [0.25, 0.5, 1, 1.5, 2, 4, 8]) lines.push({ label: `T=${t} among Experts`, measure: `T${t}`, seats: one({ name: `T${t}`, temperature: t }, expert) });
if (mode === 'levels') for (const l of Object.values(LEVELS)) {
  lines.push({ label: `${l.name} among heuristic bots`, measure: l.name, seats: one(l, HEUR) });
  if (l !== expert) lines.push({ label: `${l.name} among Experts`, measure: l.name, seats: one(l, expert) });
}
if (mode === 'styles') {
  const st = Object.values(STYLES);
  for (const s of st) lines.push({ label: `${s.name}, among other styles`, measure: s.name, seats: (i) => [0, 1, 2, 3].map((k) => st[(k + i) % st.length]) });
  for (const s of st) lines.push({ label: `${s.name} among Experts`, measure: s.name, seats: one(s, expert) });
}

const res = await pmap(lines.length * G, (j) => {
  const line = lines[Math.floor(j / G)], i = j % G, ps = line.seats(i), n = ps.length;
  const g = new Game({ seed: 60000 + i, mode: 'open', players: ps.map((p, k) => ({ name: p.name + k, isBot: true })) });
  while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, ps[d.seat] === HEUR ? botAnswer(g.state, d) : personaAnswer(g.state, d, ps[d.seat]));
  const w = g.state.result!.winners;
  const mine = ps.filter((p) => p.name === line.measure).length;
  return mine ? ps.map((p, k) => (p.name === line.measure && w.includes(k) ? n / w.length : 0)).reduce((a, b) => a + b, 0) / mine : null;
});
const out: Record<string, string> = {};
lines.forEach((l, k) => {
  const xs = res.slice(k * G, (k + 1) * G).filter((x): x is number => x !== null), N = xs.length, m = xs.reduce((a, b) => a + b, 0) / N;
  const se = Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / (N - 1) / N);
  out[l.label] = `${m.toFixed(2)} ± ${se.toFixed(2)}`;
});
console.log(JSON.stringify(out, null, 1));
