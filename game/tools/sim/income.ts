// Engine income: Glory each Host card earns per Day it sits face up in a Choir (bot play).
// Usage: npx tsx income.ts GAMES variant[+variant...]
import { Game, botAnswer } from '@divide/engine';
const N = Number(process.argv[2] ?? 1000);
const V = (process.argv[3] ?? '').split('+').filter(Boolean);
const held: Record<string, number> = {}, earned: Record<string, number> = {}, lostG: Record<string, number> = {};
const src: Record<string, number> = {};
for (let i = 0; i < N; i++) {
  const n = 3 + (i % 2);
  const g = new Game({ seed: 424242 + i, mode: 'open', variants: V, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  let day = g.state.day;
  while (!g.over) {
    for (const d of [...g.pending]) { if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d)); }
    if (g.state.day !== day) { day = g.state.day; for (const p of g.state.players) for (const c of p.choir) if (!c.facedown) held[c.id] = (held[c.id] ?? 0) + 1; }
  }
  for (const e of g.state.stats as any[]) if (e.type === 'glory') {
    const k = e.source ?? 'none'; src[k] = (src[k] ?? 0) + (e.amount ?? 0);
    if (String(k).startsWith('host-')) { if ((e.amount ?? 0) > 0) earned[k] = (earned[k] ?? 0) + e.amount; else lostG[k] = (lostG[k] ?? 0) - e.amount; }
  }
}
const rows = Object.keys(held).filter((k) => held[k] > 200).map((k) => [k.slice(5), held[k], ((earned[k] ?? 0) - (lostG[k] ?? 0)) / held[k]] as const).sort((a, b) => b[2] - a[2]);
for (const [k, h, r] of rows) if (r !== 0) console.log(k.padEnd(14), r.toFixed(3), 'per Day held  (days held', h + ')');
console.log('sources', Object.entries(src).filter(([k]) => !k.startsWith('host-')).map(([k, v]) => k + ':' + v).join(' '));
