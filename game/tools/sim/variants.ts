// Measure decision density, skill, tension, economy, and balance for rule variants and mixtures.
// Usage: npx tsx variants.ts <gamesPerTest> <outFile> [configCodes...]
import { writeFileSync } from 'node:fs';
import { Game, botAnswer, type Decision, type GameState } from '@divide/engine';

const N = Number(process.argv[2] ?? 3000);
const OUT = process.argv[3] ?? 'variants.json';
const CODES: Record<string, string> = { K: 'catchup-order', R: 'two-rounds', C: 'celestial-draft', N: 'snake-rounds' };
const CONFIGS = process.argv.slice(4).length ? process.argv.slice(4) : ['B', 'R', 'K', 'C', 'RC'];
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fin'];
const CORE = new Set(['action', 'offer.card', 'offer.second', 'gather.source', 'exalt.card', 'firstFruits', 'offer.reward', 'ithuriel', 'urim', 'asmadai', 'asmadai.swap', 'upkeep.keep', 'choir.discard', 'activate', 'celestial.pick']);

function rnd(seed: number) { let t = (seed + 0x6d2b79f5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function randomAnswer(d: Decision, salt: number) {
  const opts = [...d.options];
  const k = d.min + Math.floor(rnd(d.id * 31 + salt) * (d.max - d.min + 1));
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rnd(d.id * 97 + i + salt) * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return opts.slice(0, k).map((o) => o.id);
}
type Policy = 'smart' | 'random';
function play(seed: number, policies: Policy[], variants: string[], counts?: { all: number[]; core: number[] }, firsts?: number[]) {
  const g = new Game({ seed, mode: 'open', variants, players: policies.map((_, i) => ({ name: NAMES[i], isBot: true })) });
  let guard = 0;
  while (!g.over) {
    if (firsts && firsts[g.state.day] === undefined) firsts[g.state.day] = g.state.firstPlayer;
    for (const d of [...g.pending]) {
      if (!g.pending.includes(d)) continue;
      if (counts) { counts.all[d.seat]++; if (CORE.has(d.tag)) counts.core[d.seat]++; }
      g.answer(d.seat, d.id, policies[d.seat] === 'smart' ? botAnswer(g.state, d) : randomAnswer(d, seed));
    }
    if (++guard > 50000) throw new Error('stall');
  }
  return g.state;
}
const share = (s: GameState, seat: number) => (s.result!.winners.includes(seat) ? 1 / s.result!.winners.length : 0);
function gloryAfterDay(s: GameState, day: number) {
  const g = s.players.map(() => 0);
  for (const e of s.stats) if (e.type === 'glory' && e.seat !== undefined && e.day <= day) g[e.seat] += e.amount ?? 0;
  return g;
}

const results: any[] = [];
for (const code of CONFIGS) {
  const variants = code.split('+').flatMap((t) => (t === 'B' ? [] : /^T\d+$/.test(t) ? ['target-' + t.slice(1)] : /^M\d+$/.test(t) ? ['maxdays-' + t.slice(1)] : t.split('').map((c) => CODES[c])));
  const row: any = { code, variants: variants.join('+') || 'baseline (V35)' };
  for (const n of [3, 4]) {
    const t0 = Date.now();
    const counts = { all: Array(n).fill(0), core: Array(n).fill(0) };
    let lead3 = 0, lead3g = 0, comeback = 0, margin = 0, winG = 0, avgG = 0, days = 0, capped = 0;
    const dayHist: Record<number, number> = {};
    const cel: Record<string, { w: number; e: number }> = {};
    const posGlory = Array(n).fill(0);
    for (let i = 0; i < N; i++) {
      const firsts: number[] = [];
      const s = play(900000 + i, Array(n).fill('smart'), variants, counts, firsts);
      for (const e of s.stats) if (e.type === 'glory' && e.seat !== undefined && firsts[e.day] !== undefined) posGlory[(e.seat - firsts[e.day] + n) % n] += e.amount ?? 0;
      days += s.day; dayHist[s.day] = (dayHist[s.day] ?? 0) + 1; if (s.day >= Number(variants.find((v) => v.startsWith('maxdays-'))?.slice(8) ?? 12) && !s.players.some((p) => p.glory - 0 >= Number(variants.find((v) => v.startsWith('target-'))?.slice(7) ?? 99))) capped++;
      const d3 = gloryAfterDay(s, 3), d5 = gloryAfterDay(s, s.day - 1);
      const t3 = Math.max(...d3), t5 = Math.max(...d5);
      const l3 = d3.flatMap((g, k) => (g === t3 ? [k] : []));
      const l5 = d5.flatMap((g, k) => (g === t5 ? [k] : []));
      if (l3.length === 1) { lead3g++; if (s.result!.winners.includes(l3[0])) lead3++; }
      if (!s.result!.winners.some((w) => l5.includes(w))) comeback++;
      const fin = s.players.map((p) => p.glory).sort((a, b) => b - a);
      margin += fin[0] - fin[1]; winG += fin[0]; avgG += fin.reduce((a, b) => a + b, 0) / n;
      for (const p of s.players) { const c = (cel[p.celestial] ??= { w: 0, e: 0 }); c.w += share(s, p.seat); c.e += 1 / n; }
    }
    const ms = (Date.now() - t0) / N;
    let smart = 0, rand = 0;
    for (let i = 0; i < N; i++) {
      const seat = i % n;
      const p1: Policy[] = Array(n).fill('random'); p1[seat] = 'smart';
      smart += share(play(500000 + i, p1, variants), seat);
      const p2: Policy[] = Array(n).fill('smart'); p2[seat] = 'random';
      rand += share(play(700000 + i, p2, variants), seat);
    }
    const ratios = Object.values(cel).map((c) => c.w / c.e);
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const sd = Math.sqrt(ratios.reduce((a, b) => a + (b - mean) ** 2, 0) / ratios.length);
    row[`p${n}`] = {
      decisions: +(counts.all.reduce((a, b) => a + b, 0) / (N * n)).toFixed(1),
      core: +(counts.core.reduce((a, b) => a + b, 0) / (N * n)).toFixed(1),
      smartVsRandom: +((smart / N) * n).toFixed(2),
      randomVsSmart: +((rand / N) * n).toFixed(2),
      day3LeaderWins: +((lead3 / lead3g) * 100).toFixed(0),
      finalDayComeback: +((comeback / N) * 100).toFixed(0),
      margin: +(margin / N).toFixed(1),
      winningGlory: +(winG / N).toFixed(1),
      avgGlory: +(avgG / N).toFixed(1),
      celestialSpread: +sd.toFixed(2),
      celestialRange: [+Math.min(...ratios).toFixed(2), +Math.max(...ratios).toFixed(2)],
      celestials: Object.fromEntries(Object.entries(cel).map(([k, c]) => [k.replace('celestial-', ''), +(c.w / c.e).toFixed(2)])),
      avgDays: +(days / N).toFixed(2),
      dayLengths: Object.fromEntries(Object.entries(dayHist).map(([k, v]) => [k, +((v / N) * 100).toFixed(0)])),
      cappedPct: +((capped / N) * 100).toFixed(1),
      dayGloryByPosition: posGlory.map((g) => +(g / days).toFixed(2)),
      msPerGame: +ms.toFixed(1),
    };
  }
  results.push(row);
  console.log(JSON.stringify(row));
  writeFileSync(OUT, JSON.stringify(results, null, 1));
}
