// How much Glory players make in a Day, from every source, and how long games run.
// Usage: npx tsx glory-per-day.ts <games>
import { playBotGame } from '@divide/engine';
const N = Number(process.argv[2] ?? 2000);
for (const n of [3, 4]) {
  const hist = [0, 0, 0, 0, 0, 0]; // net Glory in a Day: 0 or less, 1, 2, 3, 4, 5+
  const win = [0, 0, 0, 0, 0, 0];
  let days = 0, dayN = 0, winDays = 0, winGlory = 0;
  const lens: number[] = [];
  const bySource: Record<string, number> = {};
  for (let g = 0; g < N; g++) {
    const s = playBotGame({ seed: 222000 + g, mode: 'open', players: ['A', 'B', 'C', 'D'].slice(0, n).map((name) => ({ name, isBot: true })) }).state;
    days += s.day; lens.push(s.day);
    const w = s.result!.winners[0];
    const per: Record<string, number> = {};
    for (const e of s.stats) if (e.type === 'glory' && e.seat !== undefined) {
      const k = `${e.seat}:${e.day}`; per[k] = (per[k] ?? 0) + (e.amount ?? 0);
      if ((e.amount ?? 0) > 0) { const src = ['offer', 'reaping'].includes(e.source!) ? e.source! : e.source!.startsWith('host-') ? 'cards' : 'other'; bySource[src] = (bySource[src] ?? 0) + e.amount!; }
    }
    for (let d = 1; d <= s.day; d++) for (let seat = 0; seat < n; seat++) {
      const x = per[`${seat}:${d}`] ?? 0; const b = x <= 0 ? 0 : Math.min(5, x);
      hist[b]++; dayN++;
      if (seat === w) { win[b]++; winDays++; winGlory += x; }
    }
  }
  lens.sort((a, b) => a - b);
  const pct = (h: number[], t: number) => h.map((x) => Math.round((x / t) * 100) + '%').join(' / ');
  const tot = Object.values(bySource).reduce((a, b) => a + b, 0);
  console.log(`${n} players: ${(days / N).toFixed(1)} Days on average (median ${lens[N >> 1]}, 90% within ${lens[Math.floor(N * 0.9)]})`);
  console.log(`  every player-Day, Glory <=0 / 1 / 2 / 3 / 4 / 5+: ${pct(hist, dayN)}`);
  console.log(`  the winner's Days:                              ${pct(win, winDays)}  (average ${(winGlory / winDays).toFixed(2)} a Day)`);
  console.log(`  Glory gained from: ${Object.entries(bySource).map(([k, v]) => `${k} ${Math.round((v / tot) * 100)}%`).join(', ')}`);
}
