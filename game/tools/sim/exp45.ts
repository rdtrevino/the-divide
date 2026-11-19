// V45 check on the real deck: Days nobody wins, Offers, card groups, and every card and Celestial outside 0.75-1.25.
// Usage: npx tsx exp45.ts <games>
import { HOST, playBotGame } from '@divide/engine';
// Rounds 42-43 used COLOR=1 here to try Robert's all-colored deck before it went into the card data (V45).
const G = Number(process.argv[2] ?? 4000);
let days = 0, neutral = 0, offers = 0, acts = 0, tokOff = 0;
const cards: Record<string, { w: number; e: number }> = {}, cel: Record<string, { w: number; e: number }> = {};
const group = { light: { w: 0, e: 0 }, dark: { w: 0, e: 0 }, neutral: { w: 0, e: 0 } };
for (let g = 0; g < G; g++) {
  const n = g % 2 ? 4 : 3, advanced = g % 4 >= 2;
  const s = playBotGame({ seed: 900000 + g, mode: 'open', advanced, players: ['A', 'B', 'C', 'D'].slice(0, n).map((name) => ({ name, isBot: true })) }).state;
  days += s.tides.length; neutral += s.tides.filter((t) => t.dir === 'neutral').length;
  for (const e of s.stats) if (e.type === 'action' && e.source !== 'fruits' && e.source !== 'offer.card') { acts++; if (e.source === 'offer') { offers++; if (e.data?.token) tokOff++; } }
  for (const p of s.players) {
    const won = s.result!.winners.includes(p.seat) ? 1 / s.result!.winners.length : 0;
    if (p.celestial) { const a = (cel[p.celestial] ??= { w: 0, e: 0 }); a.w += won; a.e += 1 / n; }
    for (const c of p.choir) { if (c.facedown) continue; const a = (cards[c.id] ??= { w: 0, e: 0 }); a.w += won; a.e += 1 / n;
      const al = HOST[c.id]?.alignment; const k = al === 'light' ? 'light' : al === 'dark' ? 'dark' : 'neutral'; group[k].w += won; group[k].e += 1 / n; }
  }
}
const r = (a: { w: number; e: number }) => +(a.w / a.e).toFixed(2);
const all = Object.entries(cards).map(([k, v]) => [k.slice(5), r(v)] as const).sort((a, b) => a[1] - b[1]);
console.log(JSON.stringify({ days: days / G, neutralDays: +(neutral / days).toFixed(2), offerShare: +(offers / acts).toFixed(2), tokenOffers: +(tokOff / G).toFixed(2),
  groups: { light: r(group.light), dark: r(group.dark), neutral: r(group.neutral) },
  out: all.filter(([, v]) => v < 0.75 || v > 1.25), celestials: Object.fromEntries(Object.entries(cel).map(([k, v]) => [k.slice(10), r(v)])) }));
