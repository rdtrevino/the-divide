// Card balance on fixed seeds, for checking every card against a target range.
// Usage: npx tsx ab3.ts GAMES SEED_OFFSET out.json variant[+variant...]   ('base' = no variants)
// Writes raw win/expected counts so several runs (different offsets) can be merged.
import { writeFileSync } from 'node:fs';
import { playBotGame } from '@divide/engine';
const [GAMES, OFFSET, OUT, V] = process.argv.slice(2);
const variants = V === 'base' ? [] : V.split('+');
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee'];
const win: Record<string, [number, number, number]> = {};
let days = 0;
for (let g = 0; g < Number(GAMES); g++) {
  const n = g % 2 ? 4 : 3;
  const s = playBotGame({ seed: 100000 + Number(OFFSET) + g, mode: 'open', variants, players: NAMES.slice(0, n).map((name) => ({ name, isBot: true })) }).state;
  days += s.day;
  const res = s.result!;
  for (const p of s.players) {
    const w = res.winners.includes(p.seat) ? 1 / res.winners.length : 0;
    for (const k of [p.celestial, ...p.choir.filter((c) => !c.facedown).map((c) => c.id)]) { const a = (win[k] ??= [0, 0, 0]); a[0] += w; a[1] += 1 / n; a[2]++; }
  }
}
writeFileSync(OUT, JSON.stringify({ variant: V, games: Number(GAMES), days, win }));
