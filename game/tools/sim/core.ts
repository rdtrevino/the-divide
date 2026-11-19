// Core validation (design/core-validation.md): a rule variant played by the strong (Monte Carlo) bot in every seat,
// measured against the vision. The strong bot reads the rules from the game, so any variant can be tested
// (engine rules.ts); the learned bot cannot, since it has the current rules built in.
// Usage: npx tsx core.ts <variant> <mode> <games>   (prints one JSON line)
//   modes: main3, main4 (strong bots in every seat), skill4 (one strong bot among three heuristic bots)
import { DAYS, Game, STRONG, botAnswer, choirColors, isSearched, searchScores, strongAnswer, type Decision, type GameState } from '@divide/engine';
import { pmap } from '../par';
import { ReaderLog, fitReader } from './readerlib';
import { VARIANTS } from './variants';


const [name, mode = 'main4', gStr = '300'] = process.argv.slice(2);
const rules = VARIANTS[name];
if (!rules) throw new Error(`unknown variant ${name}; one of ${Object.keys(VARIANTS).join(', ')}`);
const G = Number(gStr), n = mode === 'main3' ? 3 : 4;

const t0 = performance.now();
const games = await pmap(G, (i) => {
  const g = new Game({ seed: 200000 + i, mode: 'open', rules, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  const dealt = g.state.players.map((p) => p.tokens.filter((t) => t === 'light').length - p.tokens.filter((t) => t === 'dark').length);
  const strong = mode === 'skill4' ? new Set([i % n]) : new Set(Array.from({ length: n }, (_, k) => k));
  const reader = new ReaderLog(n);
  // How hard each Offer / Gather / Exalt choice is: the gap between the strong bot's two best estimates (the same
  // search strongAnswer runs, so play is unchanged).
  const gaps: number[] = [];
  const strongPlay = (d: Decision) => {
    if (d.tag !== 'action' || !isSearched(d)) return strongAnswer(g, d, STRONG);
    const { ids, scores } = searchScores(g, d, STRONG);
    let b = 0;
    for (let k = 1; k < ids.length; k++) if (scores[k] > scores[b]) b = k;
    const sorted = [...scores].sort((x, y) => y - x);
    gaps.push(sorted[0] - sorted[1]);
    return [ids[b]];
  };
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, strong.has(d.seat) ? strongPlay(d) : botAnswer(g.state, d));
    if (mode !== 'skill4') reader.update(g.state);
  }
  const s: GameState = g.state, r = s.result!;
  const first = (((s.firstPlayer - DAYS) % n) + n) % n;
  const won = r.daysWon;
  const players = s.players.map((p) => {
    const st = r.standings.find((x) => x.seat === p.seat)!;
    let acts = 0, offers = 0, gathers = 0, exalts = 0, tokOff = 0, reap = 0;
    for (const e of s.stats) {
      if (e.seat !== p.seat) continue;
      if (e.type === 'action' && e.source !== 'fruits' && e.source !== 'offer.card') { acts++; if (e.source === 'offer') { offers++; if (e.data?.token) tokOff++; } if (e.source === 'gather') gathers++; if (e.source === 'exalt') exalts++; }
      if (e.type === 'reaping') reap += e.amount ?? 0;
    }
    const tl = st.tokens.light - st.tokens.dark, cc = choirColors(s, p.seat);
    return {
      win: r.winners.includes(p.seat) ? n / r.winners.length : 0, pos: (p.seat - first + n) % n, mix: Math.abs(dealt[p.seat]),
      // With the world: the side the player was dealt more of won more Days.
      world: dealt[p.seat] === 0 || won.light === won.dark ? 0 : Math.sign(dealt[p.seat]) === Math.sign(won.light - won.dark) ? 1 : -1,
      tokenLean: Math.sign(tl), choirLean: Math.sign(cc.light - cc.dark), glory: p.glory, fromTokens: st.fromTokens, reap, before: st.before,
      acts, offers, gathers, exalts, tokOff,
    };
  });
  const leaderBefore = players.reduce((b, p, k) => (p.before > players[b].before ? k : b), 0);
  return {
    players, rows: reader.rows, tested: i % n, gaps,
    close: s.tides.filter((t) => t.dir !== 'neutral' && t.margin <= 1).length, neutral: s.tides.filter((t) => t.dir === 'neutral').length, days: s.tides.length,
    flip: !r.winners.includes(leaderBefore) ? 1 : 0,
  };
});

const entropy = (xs: number[]) => { const t = xs.reduce((a, b) => a + b, 0); return -xs.reduce((h, x) => (x ? h + (x / t) * Math.log2(x / t) : h), 0); };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const se = (xs: number[]) => { const m = mean(xs); return Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / Math.max(1, xs.length - 1) / Math.max(1, xs.length)); };
const r2 = (x: number) => +x.toFixed(2);
const all = games.flatMap((g) => g.players);
const out: Record<string, unknown> = { variant: name, mode, games: G };
if (mode === 'skill4') {
  const xs = games.map((g) => g.players[g.tested].win);
  Object.assign(out, { skill: r2(mean(xs)), skillSe: r2(se(xs)) });
} else {
  const by = (key: (p: (typeof all)[number]) => number | string) => {
    const m: Record<string, number[]> = {};
    for (const p of all) (m[String(key(p))] ??= []).push(p.win);
    return Object.fromEntries(Object.entries(m).sort().map(([k, v]) => [k, r2(mean(v))]));
  };
  const seats = by((p) => p.pos), mixes = by((p) => (p.mix >= 4 ? '4+' : p.mix)), world = by((p) => p.world);
  const pairs = all.filter((p) => p.tokenLean !== 0 && p.choirLean !== 0);
  const hedge = mean(pairs.map((p) => p.tokenLean * p.choirLean)); // +1: Choir matches tokens; -1: always the other color
  const fit = fitReader(games.filter((_, i) => i % 2 === 0).flatMap((g) => g.rows), games.filter((_, i) => i % 2 === 1).flatMap((g) => g.rows));
  const winners = all.filter((p) => p.win > 0);
  const acts = all.reduce((t, p) => t + p.acts, 0);
  Object.assign(out, {
    reader: r2(fit.accuracy), guessing: r2(fit.guessing), alignment: r2(hedge),
    seats: Object.values(seats), seatRange: [Math.min(...Object.values(seats)), Math.max(...Object.values(seats))],
    mixes, withWorld: world['1'], againstWorld: world['-1'],
    offers: r2(all.reduce((t, p) => t + p.offers, 0) / acts), gathers: r2(all.reduce((t, p) => t + p.gathers, 0) / acts), exalts: r2(all.reduce((t, p) => t + p.exalts, 0) / acts),
    tokenOffersPerPlayer: r2(mean(all.map((p) => p.tokOff))),
    closeDays: r2(mean(games.map((g) => g.close / g.days))), neutralDays: r2(mean(games.map((g) => g.neutral / g.days))),
    revealFlips: r2(mean(games.map((g) => g.flip))),
    winnerGloryFromTokens: r2(mean(winners.map((p) => p.fromTokens / Math.max(1, p.glory)))), winnerGloryFromChoir: r2(mean(winners.map((p) => p.reap / Math.max(1, p.glory)))),
    margin: r2(mean(games.map((g) => { const gl = g.players.map((p) => p.glory).sort((a, b) => b - a); return gl[0] - gl[1]; }))),
    // Real decisions: the share of action choices whose two best options were within 1 Glory, and how evenly the three
    // actions are used (entropy in bits; 1.58 is all three equally).
    closeChoices: r2(mean(games.flatMap((g) => g.gaps).map((x) => (x < 1 ? 1 : 0)))),
    actionEntropy: r2(entropy([all.reduce((t, p) => t + p.offers, 0), all.reduce((t, p) => t + p.gathers, 0), all.reduce((t, p) => t + p.exalts, 0)])),
  });
}
out.secondsPerGame = r2((performance.now() - t0) / 1000 / G);
console.log(JSON.stringify(out));
