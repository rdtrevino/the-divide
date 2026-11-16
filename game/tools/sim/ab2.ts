// A/B for the Nov 16 strongest/weakest proposals. Usage: npx tsx ab2.ts GAMES out.json v1 v2 ...
import { writeFileSync } from 'node:fs';
import { playBotGame } from '@divide/engine';
const [GAMES, OUT, ...VARS] = process.argv.slice(2);
const N = Number(GAMES);
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee'];
function run(variants: string[]) {
  const win: Record<string, { w: number; e: number; n: number }> = {};
  const src: Record<string, number> = {};
  let days = 0, winG = 0;
  for (let g = 0; g < N; g++) {
    const n = g % 2 ? 4 : 3;
    const s = playBotGame({ seed: 100000 + g, mode: 'open', variants, players: NAMES.slice(0, n).map((name) => ({ name, isBot: true })) }).state;
    const res = s.result!;
    days += s.day;
    winG += Math.max(...s.players.map((p) => p.glory));
    for (const p of s.players) {
      const w = res.winners.includes(p.seat) ? 1 / res.winners.length : 0;
      const keys = [p.celestial, ...p.choir.filter((c) => !c.facedown).map((c) => c.id)];
      for (const k of keys) { const a = (win[k] ??= { w: 0, e: 0, n: 0 }); a.w += w; a.e += 1 / n; a.n++; }
    }
    for (const e of s.stats) if (e.type === 'glory' && e.source && (e.amount ?? 0) > 0 && e.source.startsWith('host-')) src[e.source] = (src[e.source] ?? 0) + e.amount!;
  }
  const ratio: Record<string, number> = {}; const seen: Record<string, number> = {};
  for (const [k, v] of Object.entries(win)) { ratio[k] = +(v.w / v.e).toFixed(3); seen[k] = v.n; }
  return { ratio, seen, src, days: days / N, winGlory: winG / N };
}
const out: Record<string, any> = {};
for (const v of VARS) {
  const t = Date.now();
  out[v] = run(v === 'base' ? [] : v.split('+'));
  console.log(v, ((Date.now() - t) / 1000).toFixed(0) + 's', 'days', out[v].days.toFixed(2));
  writeFileSync(OUT, JSON.stringify(out));
}
