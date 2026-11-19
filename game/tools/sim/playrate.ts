// Play rate of every Host card: how often it is held, and how it gets played (Offered, Exalted, Gathered, ability used).
// Usage: npx tsx playrate.ts GAMES
import { Game, HOSTS } from '@divide/engine';
import { answer } from './bot';
const N = Number(process.argv[2] ?? 2000);
const z = () => Object.fromEntries(HOSTS.map((h: any) => [h.id, 0])) as Record<string, number>;
const heldGames = z(), heldSeats = z(), heldDays = z(), offered = z(), exalted = z(), gathered = z(), fired = z();
const byName = new Map(HOSTS.map((h: any) => [h.name, h.id]));
let seats = 0;
for (let i = 0; i < N; i++) {
  const n = 3 + (i % 2); seats += n;
  const g = new Game({ seed: 990000 + i, mode: 'open', players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  const held = g.state.players.map(() => new Set<string>());
  let day = g.state.day;
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, answer(g.state, d));
    if (g.state.day !== day || g.over) { day = g.state.day; for (const p of g.state.players) for (const c of p.choir) if (!c.facedown) { held[p.seat].add(c.id); heldDays[c.id] = (heldDays[c.id] ?? 0) + 1; } }
  }
  const any = new Set<string>();
  for (const h of held) for (const id of h) { heldSeats[id]++; any.add(id); }
  for (const id of any) heldGames[id]++;
  for (const e of g.state.stats as any[]) {
    if (e.type !== 'action' || !e.card) continue;
    if (e.source === 'offer.card') offered[e.card]++; else if (e.source === 'exalt') exalted[e.card]++; else if (e.source === 'gather') gathered[e.card]++;
  }
  const seen = new Set<number>();
  for (const l of g.state.log as any[]) {
    if (seen.has(l.seq) || l.kind === 'turn' || l.kind === 'offer' || l.kind === 'exalt' || l.kind === 'gather' || l.kind === 'discard' || l.kind === 'fruits') continue; seen.add(l.seq);
    for (const [name, id] of byName) if (l.text.includes(`(${name})`) || l.text.includes(`activated ${name}`)) fired[id]++;
  }
}
const out: Record<string, any> = {};
for (const h of HOSTS as any[]) out[h.id.slice(5)] = { name: h.name, heldGames: heldGames[h.id] / N, heldSeats: heldSeats[h.id] / seats, offered: offered[h.id] / N, exalted: exalted[h.id] / N, gathered: gathered[h.id] / N, firedPerGame: fired[h.id] / N, firedPerDayHeld: heldDays[h.id] ? fired[h.id] / heldDays[h.id] : 0 };
console.log(JSON.stringify(out));
