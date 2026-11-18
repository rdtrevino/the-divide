// Advanced game balance: Celestial win ratios and what each Event does to a Day.
// Usage: npx tsx advanced.ts <games> [offset] [out.json] [variants...]
import { writeFileSync } from 'node:fs';
import { CELESTIALS, EVENTS, cardName, playBotGame } from '@divide/engine';

const [gamesArg, offArg, outArg, ...VARIANTS] = process.argv.slice(2);
const GAMES = Number(gamesArg ?? 4000);
const OFF = Number(offArg ?? 0);
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee'];

type Agg = { seats: number; wins: number; expected: number; glory: number; celGlory: number };
const cel: Record<string, Agg> = {};
const celN: Record<string, Agg> = {}; // by player count: '<id>|<n>'
// Per Event: Days it was the Event, total Glory gained and lost across the table, Reaping Glory, Days the Tide was Neutral.
type Ev = { days: number; gained: number; lost: number; reapG: number; reapL: number; neutral: number; leaderGain: number; trailGain: number };
const ev: Record<string, Ev> = {};
let days = 0;
const len = { 3: [] as number[], 4: [] as number[] };
for (let g = 0; g < GAMES; g++) {
  const n = g % 2 ? 4 : 3;
  const s = playBotGame({ seed: 700000 + OFF + g, mode: 'open', advanced: true, variants: VARIANTS, players: NAMES.slice(0, n).map((name) => ({ name, isBot: true })) }).state;
  const res = s.result!;
  (len as any)[n].push(s.day);
  const share = 1 / res.winners.length;
  for (const p of s.players) {
    const a = (cel[p.celestial] ??= { seats: 0, wins: 0, expected: 0, glory: 0, celGlory: 0 });
    a.seats++; a.wins += res.winners.includes(p.seat) ? share : 0; a.expected += 1 / n; a.glory += p.glory;
    const b = (celN[p.celestial + '|' + n] ??= { seats: 0, wins: 0, expected: 0, glory: 0, celGlory: 0 });
    b.seats++; b.wins += res.winners.includes(p.seat) ? share : 0; b.expected += 1 / n; b.glory += p.glory;
  }
  // Glory by Day, to read each Event's effect.
  const evOf: Record<number, string> = {};
  for (const e of s.stats) if (e.type === 'event' && e.card) evOf[e.day] = e.card;
  const tideOf: Record<number, string> = {};
  for (const e of s.stats) if (e.type === 'tide') tideOf[e.day] = (e.data as any).dir;
  const glory: number[] = s.players.map(() => 0);
  let curDay = 0;
  let startOfDay = glory.slice();
  const flush = (d: number) => {
    const id = evOf[d];
    if (!id) return;
    const x = (ev[id] ??= { days: 0, gained: 0, lost: 0, reapG: 0, reapL: 0, neutral: 0, leaderGain: 0, trailGain: 0 });
    x.days++;
    if (tideOf[d] === 'neutral') x.neutral++;
    const mx = Math.max(...startOfDay), mn = Math.min(...startOfDay);
    const delta = glory.map((v, i) => v - startOfDay[i]);
    const lead = delta.filter((_, i) => startOfDay[i] === mx);
    const trail = delta.filter((_, i) => startOfDay[i] === mn);
    x.leaderGain += lead.reduce((a, b) => a + b, 0) / lead.length;
    x.trailGain += trail.reduce((a, b) => a + b, 0) / trail.length;
  };
  for (const e of s.stats) {
    if (e.day !== curDay) { flush(curDay); curDay = e.day; startOfDay = glory.slice(); days++; }
    if (e.type === 'glory' && e.seat !== undefined) {
      glory[e.seat] += e.amount ?? 0;
      const id = evOf[e.day];
      if (id) {
        const x = (ev[id] ??= { days: 0, gained: 0, lost: 0, reapG: 0, reapL: 0, neutral: 0, leaderGain: 0, trailGain: 0 });
        if ((e.amount ?? 0) > 0) x.gained += e.amount!; else x.lost -= e.amount!;
        if (e.source === 'reaping') { if ((e.amount ?? 0) > 0) x.reapG += e.amount!; else x.reapL -= e.amount!; }
      }
      if (e.source?.startsWith('celestial-')) {
        const p = s.players[e.seat];
        if (p.celestial === e.source) cel[p.celestial].celGlory += e.amount ?? 0;
      }
    }
  }
  flush(curDay);
}
const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)] ?? 0; };
const ratio = (a: Agg) => a.wins / a.expected;
console.log(`${GAMES} Advanced games (half 3 players, half 4). Median Days: ${med(len[3])} at 3, ${med(len[4])} at 4. Variants: ${VARIANTS.join(', ') || 'none'}`);
console.log('\nCelestial            seats   win ratio  avg Glory   3 players  4 players');
for (const [id, a] of Object.entries(cel).sort((x, y) => ratio(y[1]) - ratio(x[1]))) console.log(`${cardName(id).padEnd(20)} ${String(a.seats).padStart(6)}   ${ratio(a).toFixed(2).padStart(8)}  ${(a.glory / a.seats).toFixed(1).padStart(8)}   ${ratio(celN[id + '|3']).toFixed(2).padStart(8)}   ${ratio(celN[id + '|4']).toFixed(2).padStart(8)}`);
console.log('\nEvent                 days  Glory+/day  Glory-/day  Reap+/day  Reap-/day  Neutral%  leader Δ  trailer Δ');
const all = Object.values(ev).reduce((t, x) => ({ d: t.d + x.days, g: t.g + x.gained, l: t.l + x.lost }), { d: 0, g: 0, l: 0 });
for (const [id, x] of Object.entries(ev).sort((a, b) => b[1].gained / b[1].days - a[1].gained / a[1].days)) {
  const f = (v: number) => (v / x.days).toFixed(2).padStart(9);
  console.log(`${cardName(id).padEnd(20)} ${String(x.days).padStart(5)} ${f(x.gained)}  ${f(x.lost)}  ${f(x.reapG)}  ${f(x.reapL)}  ${((100 * x.neutral) / x.days).toFixed(0).padStart(7)}%  ${f(x.leaderGain)} ${f(x.trailGain)}`);
}
console.log(`All Days: ${(all.g / all.d).toFixed(2)} gained, ${(all.l / all.d).toFixed(2)} lost per Day`);
if (outArg && outArg !== '-') writeFileSync(outArg, JSON.stringify({ games: GAMES, off: OFF, variants: VARIANTS, cel, celN, ev, len }, null, 1));
void CELESTIALS; void EVENTS;
