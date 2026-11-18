// Card balance by "held at the end of any Day" (fair to cards that are discarded when used, like stores).
// Usage: npx tsx held.ts GAMES OFFSET out.json variant[+variant...]
import { writeFileSync } from 'node:fs';
import { Game, botAnswer } from '@divide/engine';
const [GAMES, OFFSET, OUT, V] = process.argv.slice(2);
const variants = V.split('+').filter(Boolean);
const win: Record<string, [number, number, number]> = {};
for (let i = 0; i < Number(GAMES); i++) {
  const n = 3 + (i % 2);
  const g = new Game({ seed: 300000 + Number(OFFSET) + i, mode: 'open', variants, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  const held = g.state.players.map(() => new Set<string>());
  let day = g.state.day;
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
    if (g.state.day !== day || g.over) { day = g.state.day; for (const p of g.state.players) for (const c of p.choir) if (!c.facedown) held[p.seat].add(c.id); }
  }
  const res = g.state.result!;
  for (const p of g.state.players) {
    const w = res.winners.includes(p.seat) ? 1 / res.winners.length : 0;
    for (const k of held[p.seat]) { const a = (win[k] ??= [0, 0, 0]); a[0] += w; a[1] += 1 / n; a[2]++; }
  }
}
writeFileSync(OUT, JSON.stringify({ variant: V, games: Number(GAMES), win }));
