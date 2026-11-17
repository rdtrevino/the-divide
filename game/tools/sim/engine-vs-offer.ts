// Offer now vs build the Choir for later: where Glory comes from, early and late, under rule variants.
// Usage: npx tsx engine-vs-offer.ts <games> <players> <config> [config...]   (a config is variants joined by '+', or 'B')
import { playBotGame } from '@divide/engine';
const N = Number(process.argv[2]); const P = Number(process.argv[3]);
for (const code of process.argv.slice(4)) {
  const v = code === 'B' ? [] : code.split('+');
  let days = 0, lead3 = 0, lead3n = 0, allGain = 0, reapN = 0, choirEnd = 0;
  const mix: Record<string, number> = {}; let acts = 0;
  const early = { offer: 0, reap: 0, n: 0 }, late = { offer: 0, reap: 0, n: 0 };
  let winOffer = 0, winTotal = 0;
  const withTide = [0, 0, 0, 0];
  for (let g = 0; g < N; g++) {
    const s = playBotGame({ seed: 333000 + g, mode: 'open', variants: v, players: ['A', 'B', 'C', 'D'].slice(0, P).map((name) => ({ name, isBot: true })) }).state;
    days += s.day;
    const w = s.result!.winners[0];
    const by: Record<number, number[]> = {};
    const g3 = s.players.map(() => 0);
    for (const e of s.stats) {
      if (e.type === 'action' && ['offer', 'gather', 'exalt'].includes(e.source ?? '')) { mix[e.source!] = (mix[e.source!] ?? 0) + 1; acts++; }
      if (e.type === 'reaping') (by[e.day] ??= []).push(e.amount ?? 0);
      if (e.type === 'tide') { const t = (e.data as any).dir; if (t !== 'neutral') { const k = s.stats.filter((x) => x.type === 'reaping' && x.day === e.day && (x.data as any)?.net && Math.sign((x.data as any).net) === (t === 'light' ? 1 : -1)).length; withTide[Math.min(3, k)]++; } }
      if (e.type === 'glory' && e.seat !== undefined) {
        const a = e.amount ?? 0;
        if (e.day <= 3) g3[e.seat] += a;
        const bucket = e.day <= 2 ? early : e.day >= 5 ? late : null;
        if (bucket && e.source === 'offer') bucket.offer += a;
        if (bucket && e.source === 'reaping') bucket.reap += a;
        if (e.seat === w && a > 0) { winTotal += a; if (e.source === 'offer') winOffer += a; }
      }
    }
    for (const d of Object.keys(by).map(Number)) { if (d <= 2) early.n += P; if (d >= 5) late.n += P; }
    for (const a of Object.values(by)) { reapN++; if (a.every((x) => x > 0)) allGain++; }
    const m = Math.max(...g3); const l = g3.flatMap((x, k) => (x === m ? [k] : []));
    if (l.length === 1 && s.day > 3) { lead3n++; if (s.result!.winners.includes(l[0])) lead3++; }
    choirEnd += s.players.reduce((a, p) => a + p.choir.length, 0) / P;
  }
  const f = (x: number) => x.toFixed(2);
  console.log(JSON.stringify({ config: code, players: P, days: +(days / N).toFixed(1),
    mix: Object.fromEntries(Object.entries(mix).map(([k, x]) => [k, Math.round(x / acts * 100)])),
    perPlayerDay_early: `offer ${f(early.offer / early.n)} reap ${f(early.reap / early.n)}`,
    perPlayerDay_late: `offer ${f(late.offer / Math.max(1, late.n))} reap ${f(late.reap / Math.max(1, late.n))}`,
    winnerFromOffersPct: Math.round(winOffer / winTotal * 100), day3LeaderWins: Math.round(lead3 / lead3n * 100),
    everyoneGainsPct: Math.round(allGain / reapN * 100), choirAtEnd: +(choirEnd / N).toFixed(1), withTide0123: withTide.map((x) => Math.round(x / withTide.reduce((a, b) => a + b, 0) * 100)) }));
}
