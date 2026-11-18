// How often each Host card's ability does something, per Day it is held face up in a Choir, and the Glory it earns.
// Usage: npx tsx usage.ts GAMES
import { Game, botAnswer, HOSTS } from '@divide/engine';
const N = Number(process.argv[2] ?? 1000);
const held: Record<string, number> = {}, fired: Record<string, number> = {}, earned: Record<string, number> = {};
const byName = new Map(HOSTS.map((h: any) => [h.name, h.id]));
for (let i = 0; i < N; i++) {
  const n = 3 + (i % 2);
  const g = new Game({ seed: 880000 + i, mode: 'open', players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  let day = g.state.day;
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
    if (g.state.day !== day) { day = g.state.day; for (const p of g.state.players) for (const c of p.choir) if (!c.facedown) held[c.id] = (held[c.id] ?? 0) + 1; }
  }
  const seen = new Set<number>();
  for (const l of g.state.log as any[]) {
    if (seen.has(l.seq)) continue; seen.add(l.seq);
    for (const [name, id] of byName) if (l.text.includes(`(${name})`) || l.text.includes(`activated ${name}`) || l.text.includes(`${name}:`) || l.text.includes(`${name}'s `) && l.kind !== 'turn') { fired[id] = (fired[id] ?? 0) + 1; }
  }
  for (const e of g.state.stats as any[]) if (e.type === 'glory' && String(e.source).startsWith('host-')) earned[e.source] = (earned[e.source] ?? 0) + (e.amount ?? 0);
}
const rows = HOSTS.filter((h: any) => held[h.id]).map((h: any) => [h.name, held[h.id], (fired[h.id] ?? 0) / held[h.id], (earned[h.id] ?? 0) / held[h.id]] as const);
console.log(JSON.stringify(Object.fromEntries(rows.map(([n, h, f, e]) => [n, { held: h, fire: +f.toFixed(3), glory: +e.toFixed(3) }]))));
