// The V45 health check on the real deck: Days nobody wins, Offers, card groups, every card and Celestial outside
// 0.75-1.25, and win ratio by seat (from the Day 1 first player). Heuristic bots; games run on every core (../par.ts).
// Usage: npx tsx exp45.ts <games>
import { DAYS, HOST, playBotGame } from '@divide/engine';
import { BOT } from './bot';
import { pmap } from '../par';
const G = Number(process.argv[2] ?? 4000);
type Tally = Record<string, { w: number; e: number }>;
const games = await pmap(G, (g) => {
  const n = g % 2 ? 4 : 3, advanced = g % 4 >= 2;
  const s = playBotGame({ seed: 900000 + g, mode: 'open', advanced, players: ['A', 'B', 'C', 'D'].slice(0, n).map((name) => ({ name, isBot: true })) }, 20000, [], BOT).state;
  let offers = 0, acts = 0, tokOff = 0;
  for (const e of s.stats) if (e.type === 'action' && e.source !== 'fruits' && e.source !== 'offer.card') { acts++; if (e.source === 'offer') { offers++; if (e.data?.token) tokOff++; } }
  const first = (((s.firstPlayer - DAYS) % n) + n) % n; // the marker passes once each Evening
  const players = s.players.map((p) => ({
    won: s.result!.winners.includes(p.seat) ? 1 / s.result!.winners.length : 0, seat: (p.seat - first + n) % n, celestial: p.celestial,
    cards: p.choir.filter((c) => !c.facedown).map((c) => c.id),
  }));
  return { n, days: s.tides.length, neutral: s.tides.filter((t) => t.dir === 'neutral').length, offers, acts, tokOff, players };
});
const add = (t: Tally, k: string, w: number, n: number) => { const a = (t[k] ??= { w: 0, e: 0 }); a.w += w; a.e += 1 / n; };
const cards: Tally = {}, cel: Tally = {}, group: Tally = {}, seats: Tally = {};
let days = 0, neutral = 0, offers = 0, acts = 0, tokOff = 0;
for (const g of games) {
  days += g.days; neutral += g.neutral; offers += g.offers; acts += g.acts; tokOff += g.tokOff;
  for (const p of g.players) {
    add(seats, `${g.n}p seat ${p.seat + 1}`, p.won, g.n);
    if (p.celestial) add(cel, p.celestial.slice(10), p.won, g.n);
    for (const c of p.cards) { add(cards, c.slice(5), p.won, g.n); add(group, HOST[c]?.alignment === 'dark' ? 'dark' : 'light', p.won, g.n); }
  }
}
const r = (t: Tally) => Object.fromEntries(Object.entries(t).sort().map(([k, v]) => [k, +(v.w / v.e).toFixed(2)]));
const all = Object.entries(r(cards)).sort((a, b) => a[1] - b[1]);
console.log(JSON.stringify({ games: G, days: days / G, neutralDays: +(neutral / days).toFixed(2), offerShare: +(offers / acts).toFixed(2), tokenOffers: +(tokOff / G).toFixed(2),
  groups: r(group), seats: r(seats), out: all.filter(([, v]) => v < 0.75 || v > 1.25), celestials: r(cel) }));
