// The shape of a game: length, the winner's Glory per Day, where Glory comes from, and the action mix.
// Usage: npx tsx shape.ts GAMES variant[+variant...]
import { Game, botAnswer } from '@divide/engine';
const N = Number(process.argv[2] ?? 1000);
const V = (process.argv[3] ?? '').split('+').filter(Boolean);
for (const n of [3, 4]) {
  let days = 0, winPerDay = 0, lose3 = 0, reaps = 0; const gs: Record<string, number> = {}; const acts: Record<string, number> = {}; const src: Record<string, number> = {};
  for (let i = 0; i < N; i++) {
    const g = new Game({ seed: 515151 + i, mode: 'open', variants: V, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
    while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) { const a = botAnswer(g.state, d); if (d.tag === 'action') acts[a[0]] = (acts[a[0]] ?? 0) + 1; if (d.tag === 'gather.source') gs[a[0].split(':')[0]] = (gs[a[0].split(':')[0]] ?? 0) + 1; g.answer(d.seat, d.id, a); }
    const s = g.state as any; days += s.day;
    const w = s.result.winners[0]; winPerDay += s.players[w].glory / s.day;
    for (const e of s.stats) if (e.type === 'glory' && e.source === 'reaping') { reaps++; if ((e.amount ?? 0) <= -3) lose3++; }
    for (const e of s.stats) if (e.type === 'glory' && (e.amount ?? 0) > 0) { const k = e.source === 'offer' ? 'offer' : e.source === 'reaping' ? 'reaping' : 'cards'; src[k] = (src[k] ?? 0) + e.amount; }
  }
  const at = Object.values(acts).reduce((a, b) => a + b, 0), gt = Object.values(src).reduce((a, b) => a + b, 0);
  const pct = (o: Record<string, number>, t: number, ks: string[]) => ks.map((k) => `${k} ${Math.round(100 * (o[k] ?? 0) / t)}%`).join(', ');
  console.log(`${n}p: ${(days / N).toFixed(1)} Days, winner ${(winPerDay / N).toFixed(2)}/Day | actions ${pct(acts, at, ['offer', 'gather', 'exalt'])} | Glory from ${pct(src, gt, ['offer', 'reaping', 'cards'])} | lone loser -3 in ${Math.round(100 * lose3 / Math.max(1, reaps))}% of Reaping results | Gather from ${Object.entries(gs).map(([k, v]) => k + ' ' + Math.round(100 * v / Object.values(gs).reduce((a, b) => a + b, 0)) + '%').join(', ')}`);
}
