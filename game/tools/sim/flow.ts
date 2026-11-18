// Card flow and starting Choir: compare dealing rules on identical seeds.
// Usage: npx tsx flow.ts <games> <players> <out.json> <config> [config...]
// A config is variants joined by '+', or 'B' for the current rules. Dealing variants:
//   choir-N   deal N random Choir cards (the rule is 2)
//   pick-K    deal K extra hand cards and choose K of them as the Choir (not a rule; tested in V40)
// The V40 report (reports/v40-dealing-2026-11-17.md) was measured with since-removed variants for the
// Offer draw, the First Fruits draw and a hand of 4; check out commit history to rerun those.
import { writeFileSync } from 'node:fs';
import { Game, alignment, botAnswer, type Decision, type GameState } from '@divide/engine';

const N = Number(process.argv[2] ?? 3000);
const P = Number(process.argv[3] ?? 3);
const OUT = process.argv[4] ?? 'flow.json';
const CONFIGS = process.argv.slice(5);
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee'];
const CORE = new Set(['action', 'offer.card', 'offer.second', 'gather.source', 'exalt.card', 'firstFruits', 'offer.reward', 'choir.pick', 'choir.discard', 'activate', 'upkeep.discard']);

function rnd(seed: number) { let t = (seed + 0x6d2b79f5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function randomAnswer(d: Decision, salt: number) {
  const opts = [...d.options];
  const k = d.min + Math.floor(rnd(d.id * 31 + salt) * (d.max - d.min + 1));
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rnd(d.id * 97 + i + salt) * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return opts.slice(0, k).map((o) => o.id);
}
type Policy = 'smart' | 'random';
interface Probe { core: number; actions: Record<string, number>; handAtAction: number; actionCount: number; rewards: Record<string, number>; startNet: number[] | null; choirAtAction: number }
function play(seed: number, policies: Policy[], variants: string[], probe?: Probe) {
  const g = new Game({ seed, mode: 'open', variants, players: policies.map((_, i) => ({ name: NAMES[i], isBot: true })) });
  let guard = 0;
  while (!g.over) {
    for (const d of [...g.pending]) {
      if (!g.pending.includes(d)) continue;
      const ans = policies[d.seat] === 'smart' ? botAnswer(g.state, d) : randomAnswer(d, seed);
      if (probe) {
        if (CORE.has(d.tag)) probe.core++;
        if (d.tag === 'firstFruits' && !probe.startNet) probe.startNet = g.state.players.map((p) => alignment(g.state, p.seat));
        if (d.tag === 'action') { probe.actions[ans[0]] = (probe.actions[ans[0]] ?? 0) + 1; probe.handAtAction += g.state.players[d.seat].hand.length; probe.choirAtAction += g.state.players[d.seat].choir.length; probe.actionCount++; }
        if (d.tag === 'offer.reward') probe.rewards[ans[0]] = (probe.rewards[ans[0]] ?? 0) + 1;
      }
      g.answer(d.seat, d.id, ans);
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
const soleLeader = (g: number[]) => { const m = Math.max(...g); const l = g.flatMap((x, k) => (x === m ? [k] : [])); return l.length === 1 ? l[0] : -1; };

const results: any[] = [];
for (const code of CONFIGS) {
  const variants = code === 'B' ? [] : code.split('+');
  const n = P;
  const t0 = Date.now();
  let days = 0, winG = 0, margin = 0, lead1 = 0, lead1g = 0, lead3 = 0, lead3g = 0, comeback = 0, startLuck = 0, startLuckG = 0, day1Swing = 0, reapAbs = 0, reapCount = 0, cappedReap = 0, offerG = 0, bonusG = 0;
  const probe: Probe = { core: 0, actions: {}, handAtAction: 0, actionCount: 0, rewards: {}, startNet: null, choirAtAction: 0 };
  const cel: Record<string, { w: number; e: number }> = {};
  const celRatio = (id: string) => (cel[id] ? +(cel[id].w / cel[id].e).toFixed(2) : null);
  for (let i = 0; i < N; i++) {
    probe.startNet = null;
    const s = play(900000 + i, Array(n).fill('smart'), variants, probe);
    days += s.day;
    const fin = s.players.map((p) => p.glory).sort((a, b) => b - a);
    winG += fin[0]; margin += fin[0] - fin[1];
    const l1 = soleLeader(gloryAfterDay(s, 1)); if (l1 >= 0) { lead1g++; if (s.result!.winners.includes(l1)) lead1++; }
    const l3 = soleLeader(gloryAfterDay(s, 3)); if (l3 >= 0) { lead3g++; if (s.result!.winners.includes(l3)) lead3++; }
    const pre = gloryAfterDay(s, s.day - 1); const m = Math.max(...pre);
    if (!s.result!.winners.some((w) => pre[w] === m)) comeback++;
    // Starting-deal luck: does the player dealt the strongest-leaning starting Choir win more often?
    const startNet = probe.startNet as number[] | null; // set by play()
    if (startNet) {
      const mags = startNet.map((x) => Math.min(3, Math.abs(x)));
      const k = soleLeader(mags);
      if (k >= 0) { startLuckG++; startLuck += share(s, k) * n; }
    }
    for (const e of s.stats) {
      if (e.type === 'reaping' && e.seat !== undefined) { const a = Math.abs(e.amount ?? 0); reapAbs += a; reapCount++; if (a >= 3) cappedReap++; if (e.day === 1) day1Swing += a; }
      if (e.type === 'glory' && e.source === 'offer') offerG += e.amount ?? 0;
      if (e.type === 'glory' && e.source === 'bonus') bonusG += e.amount ?? 0;
    }
    for (const p of s.players) { const c = (cel[p.celestial] ??= { w: 0, e: 0 }); c.w += share(s, p.seat); c.e += 1 / n; }
  }
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
  const acts = Object.values(probe.actions).reduce((a, b) => a + b, 0);
  const rw = Object.values(probe.rewards).reduce((a, b) => a + b, 0);
  const row = {
    config: code,
    players: n,
    avgDays: +(days / N).toFixed(2),
    coreDecisionsPerPlayer: +(probe.core / (N * n)).toFixed(1),
    skillEdge: +((smart / N) * n).toFixed(2),
    randomVsSmart: +((rand / N) * n).toFixed(2),
    day1LeaderWinsPct: +((lead1 / lead1g) * 100).toFixed(0),
    day3LeaderWinsPct: +((lead3 / lead3g) * 100).toFixed(0),
    finalDayComebackPct: +((comeback / N) * 100).toFixed(0),
    startLuckRatio: +(startLuck / startLuckG).toFixed(2),
    day1ReapingSwing: +(day1Swing / (N * n)).toFixed(2),
    avgReapingSize: +(reapAbs / reapCount).toFixed(2),
    reapingsAtCapPct: +((cappedReap / reapCount) * 100).toFixed(0),
    offerGloryPerPlayer: +(offerG / (N * n)).toFixed(2),
    bonusPerPlayer: +(bonusG / (N * n)).toFixed(2),
    winningGlory: +(winG / N).toFixed(1),
    margin: +(margin / N).toFixed(1),
    handAtAction: +(probe.handAtAction / probe.actionCount).toFixed(2),
    choirAtAction: +(probe.choirAtAction / probe.actionCount).toFixed(2),
    actionMix: Object.fromEntries(Object.entries(probe.actions).map(([k, v]) => [k, +((v / acts) * 100).toFixed(0)])),
    offerDrawPct: rw ? +(((probe.rewards.card ?? 0) / rw) * 100).toFixed(1) : 0,
    celestialSpread: +sd.toFixed(3),
    // Win ratios of two Celestials (null in the Base game, which has none).
    dominion: celRatio('celestial-the-dominion'),
    cantor: celRatio('celestial-the-cantor'),
    secPerGame: +((Date.now() - t0) / 1000 / (3 * N)).toFixed(3),
  };
  results.push(row);
  console.log(JSON.stringify(row));
  writeFileSync(OUT, JSON.stringify(results, null, 1));
}
