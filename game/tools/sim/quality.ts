// Game-quality measurements: skill expression, snowballing, final-Day drama.
import { Game, type Decision, type GameState } from '@divide/engine';
import { answer } from './bot';

const N = Number(process.argv[2] ?? 6000);
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fin'];

function rnd(seed: number) { let t = (seed + 0x6d2b79f5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function randomAnswer(d: Decision, salt: number) {
  const opts = [...d.options];
  const k = d.min + Math.floor(rnd(d.id * 31 + salt) * (d.max - d.min + 1));
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rnd(d.id * 97 + i + salt) * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return opts.slice(0, k).map((o) => o.id);
}
type Policy = 'smart' | 'random';
function play(seed: number, policies: Policy[]): GameState {
  const g = new Game({ seed, mode: 'open', players: policies.map((_, i) => ({ name: NAMES[i], isBot: true })) });
  let guard = 0;
  while (!g.over) {
    for (const d of [...g.pending]) {
      if (!g.pending.includes(d)) continue;
      g.answer(d.seat, d.id, policies[d.seat] === 'smart' ? answer(g.state, d) : randomAnswer(d, seed));
    }
    if (++guard > 20000) throw new Error('stall');
  }
  return g.state;
}
const share = (s: GameState, seat: number) => (s.result!.winners.includes(seat) ? 1 / s.result!.winners.length : 0);
function gloryAfterDay(s: GameState, day: number) {
  const g = s.players.map(() => 0);
  for (const e of s.stats) if (e.type === 'glory' && e.seat !== undefined && e.day <= day) g[e.seat] += e.amount ?? 0;
  return g;
}

for (const n of [3, 4]) {
  // 1. Skill: one smart bot among random players, and one random player among smart bots.
  let smartWins = 0, randWins = 0;
  for (let i = 0; i < N; i++) {
    const seat = i % n;
    const p1: Policy[] = Array(n).fill('random'); p1[seat] = 'smart';
    smartWins += share(play(500000 + i, p1), seat);
    const p2: Policy[] = Array(n).fill('smart'); p2[seat] = 'random';
    randWins += share(play(700000 + i, p2), seat);
  }
  // 2. Snowball and drama among equal smart bots.
  let leadD3 = 0, leadD3Games = 0, leadBefore6 = 0, comeback = 0, margins = 0;
  for (let i = 0; i < N; i++) {
    const s = play(900000 + i, Array(n).fill('smart'));
    const d3 = gloryAfterDay(s, 3), d5 = gloryAfterDay(s, 5);
    const top3 = Math.max(...d3), top5 = Math.max(...d5);
    const l3 = d3.map((g, k) => (g === top3 ? k : -1)).filter((k) => k >= 0);
    const l5 = d5.map((g, k) => (g === top5 ? k : -1)).filter((k) => k >= 0);
    if (l3.length === 1) { leadD3Games++; if (s.result!.winners.includes(l3[0])) leadD3++; }
    if (l5.length === 1 && s.result!.winners.includes(l5[0])) leadBefore6++;
    if (!s.result!.winners.some((w) => l5.includes(w))) comeback++;
    const fin = s.players.map((p) => p.glory).sort((a, b) => b - a);
    margins += fin[0] - fin[1];
  }
  console.log(`\n=== ${n} players (${N} games per test) ===`);
  console.log(`Smart bot among random players: win ratio ${((smartWins / N) * n).toFixed(2)}  (1.00 = no skill edge)`);
  console.log(`Random player among smart bots: win ratio ${((randWins / N) * n).toFixed(2)}`);
  console.log(`Sole leader after Day 3 goes on to win: ${((leadD3 / leadD3Games) * 100).toFixed(0)}%  (chance would be ${(100 / n).toFixed(0)}%)`);
  console.log(`Winner was NOT leading entering Day 6: ${((comeback / N) * 100).toFixed(0)}%`);
  console.log(`Average margin between 1st and 2nd: ${(margins / N).toFixed(1)} Glory`);
}
