// Play lab games and measure them.
import { type Rules, type State, applyFruits, act, active, evening, newGame, rnd } from './core';
import { type Policy, chooseAction, chooseFlip, chooseFruit } from './bots';

export function play(R: Rules, pols: Policy[], seed: number): State {
  const s = newGame(R, seed);
  let guard = 0;
  while (s.phase !== 'over') {
    if (s.phase === 'fruits') {
      const picks = pols.map((pol, p) => chooseFruit(s, p, pol));
      applyFruits(s, picks);
    } else if (s.phase === 'noon') {
      const p = active(s);
      act(s, chooseAction(s, p, pols[p]));
      const f = chooseFlip(s, p, pols[p]);
      if (f >= 0) { s.choir[p][f].flip = true; s.used[p] |= 1; s.decisions[p]++; }
    } else if (s.phase === 'evening') evening(s);
    if (++guard > 5000) throw new Error('stall');
  }
  return s;
}

export interface Metrics {
  games: number;
  days: number;
  decisions: number; // per player per game
  minutes: number; // estimated table time
  tideShare: number; // share of the winner's Glory that comes from the Tide (Reaping, bets, Tide abilities)
  offerShare: number;
  abilityShare: number;
  reapPerPlayerDay: number; // mean Reaping result per player per Day
  gainPct: number; // share of player-Days with a Reaping gain
  lossPct: number; // share of player-Days with a Reaping loss
  zeroDays: number; // share of Days on which nobody gains at the Reaping
  closeTides: number; // margin <= 1
  neutralTides: number;
  lastFlip: number; // share of Days the last player to act changed the Tide's direction
  crowded: number; // share of Days with 3+ Choirs on one side
  allSame: number; // share of Days with every Choir on one side
  switches: number; // side changes per player per game
  leaderD3: number; // sole leader after Day 3 wins
  margin: number; // 1st minus 2nd
  winnerGlory: number;
  seat: number[]; // win share by position in the first Day's turn order
  winRatio?: number; // for a tested seat
  reapShare: number;
  crossBets: number; // share of Offers whose card opposes the Offerer's own lean
  betShare: number; // share of the winner's Glory from Offer bets
  split: Record<string, number>; // share of Days by side split, e.g. '2v2', '3v1', '2v1n'
  underdog: number; // share of decided Tides won by the side with fewer Choirs
  neutralChoir: number; // share of player-Days with a Neutral Choir
  abilities: Record<string, { wr: number; held: number; glory: number }>; // win ratio and play rate of each ability in final Choirs; Glory it produced per game
}

const TIDE_KEYS = new Set(['reaping', 'bet', 'fruitbet', 'ab:herald', 'ab:banner', 'ab:bond', 'ab:store', 'ab:tithe', 'ab:stillness', 'ab:banner2', 'ab:hedge', 'ab:store3', 'ab:prophet', 'ab:zealot2', 'ab:zealot1', 'ab:traitor']);

export function measure(states: State[], tested?: { seat: (i: number) => number }): Metrics {
  const n = states[0].R.n;
  let days = 0, dec = 0, tide = 0, offer = 0, abil = 0, tot = 0, reapSum = 0, pd = 0, gainN = 0, lossN = 0, zero = 0, close = 0, neu = 0,
    lastF = 0, crowd = 0, same = 0, sw = 0, l3 = 0, l3n = 0, marg = 0, wg = 0, testedWins = 0, reapG = 0, cross = 0, offs = 0, bet = 0, und = 0, undN = 0, neuC = 0;
  const split: Record<string, number> = {};
  const abH: Record<string, number> = {}, abW: Record<string, number> = {}, abG: Record<string, number> = {};
  const seat = Array(n).fill(0);
  states.forEach((s, gi) => {
    days += s.day;
    dec += s.decisions.reduce((a, b) => a + b, 0) / n;
    sw += s.switches.reduce((a, b) => a + b, 0) / n;
    cross += s.offerStats[1]; offs += s.offerStats[0];
    for (let p = 0; p < n; p++) {
      const seen = new Set<string>();
      for (const x of s.choir[p]) { const a = s.cards[x.c].ab; if (a && !seen.has(a)) { seen.add(a); abH[a] = (abH[a] ?? 0) + 1; if (s.winners.includes(p)) abW[a] = (abW[a] ?? 0) + 1 / s.winners.length; } }
      for (const [k, v] of Object.entries(s.src[p])) if (k.startsWith('ab:')) abG[k.slice(3)] = (abG[k.slice(3)] ?? 0) + v;
    }
    const share = 1 / s.winners.length;
    for (const w of s.winners) {
      for (const [k, v] of Object.entries(s.src[w])) {
        if (v <= 0) continue;
        tot += v * share;
        if (k === 'bet' || k === 'fruitbet') bet += v * share;
        if (k === 'reaping') reapG += v * share;
        if (TIDE_KEYS.has(k)) tide += v * share;
        if (k === 'offer') offer += v * share;
        else if (k.startsWith('ab:')) abil += v * share;
      }
      wg += s.glory[w] * share;
      // seat by position in Day 1's turn order: first player is position 0
      const firstDay1 = (s.first - (s.day - 1) % n + n * 100) % n;
      seat[(w - firstDay1 + n) % n] += share;
    }
    for (const d of s.logs) {
      for (let p = 0; p < n; p++) {
        reapSum += d.reap[p];
        pd++;
        if (d.reap[p] > 0) gainN++;
        if (d.reap[p] < 0) lossN++;
      }
      if (!d.reap.some((x) => x > 0)) zero++;
      if (d.margin <= 1) close++;
      if (d.tide === 0) neu++;
      if (d.lastFlip) lastF++;
      const L = d.leans.filter((x) => x > 0).length, D = d.leans.filter((x) => x < 0).length;
      if (Math.max(L, D) >= 3) crowd++;
      if (Math.max(L, D) === n) same++;
      const N0 = n - L - D; neuC += N0;
      const key = `${Math.max(L, D)}v${Math.min(L, D)}${N0 ? 'n'.repeat(N0) : ''}`; split[key] = (split[key] ?? 0) + 1;
      if (d.tide !== 0 && L !== D && L > 0 && D > 0) { undN++; if ((d.tide > 0 ? L : D) < (d.tide > 0 ? D : L)) und++; }
    }
    if (s.gloryByDay.length >= 3) {
      const g = s.gloryByDay[2];
      const top = Math.max(...g);
      const leaders = g.map((x, p) => (x === top ? p : -1)).filter((p) => p >= 0);
      if (leaders.length === 1) { l3n++; if (s.winners.includes(leaders[0])) l3 += share; }
    }
    const fin = s.glory.slice().sort((a, b) => b - a);
    marg += fin[0] - fin[1];
    if (tested) { const t = tested.seat(gi); if (s.winners.includes(t)) testedWins += share; }
  });
  const G = states.length;
  const D = days;
  // Table time: First Fruits 0.6 min, each turn 0.75 min (including talk), Evening 1 min.
  const minutes = (days / G) * (0.6 + n * states[0].R.turns * 0.75 + 1.0);
  return {
    games: G, days: days / G, decisions: dec / G, minutes, tideShare: tide / tot, offerShare: offer / tot, abilityShare: abil / tot,
    reapPerPlayerDay: reapSum / pd, gainPct: gainN / pd, lossPct: lossN / pd, zeroDays: zero / D, closeTides: close / D, neutralTides: neu / D,
    lastFlip: lastF / D, crowded: crowd / D, allSame: same / D, switches: sw / G, leaderD3: l3 / Math.max(1, l3n), margin: marg / G,
    winnerGlory: wg / G, seat: seat.map((x) => (x / G) * n), winRatio: tested ? (testedWins / G) * n : undefined,
    reapShare: reapG / tot, crossBets: cross / Math.max(1, offs), betShare: bet / tot, split: Object.fromEntries(Object.entries(split).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +(v / D).toFixed(3)])), underdog: und / Math.max(1, undN), neutralChoir: neuC / (D * n),
    abilities: Object.fromEntries([...new Set([...Object.keys(abH), ...Object.keys(abG)])].sort().map((a) => [a, { wr: +(((abW[a] ?? 0) / Math.max(1, abH[a] ?? 0)) * n).toFixed(2), held: +((abH[a] ?? 0) / G).toFixed(2), glory: +((abG[a] ?? 0) / G).toFixed(2) }])),
  };
}

export function runSet(R: Rules, pols: (i: number) => Policy[], N: number, seed0: number, tested?: (i: number) => number) {
  const out: State[] = [];
  for (let i = 0; i < N; i++) out.push(play(R, pols(i), seed0 + i * 7919));
  return measure(out, tested ? { seat: tested } : undefined);
}

export const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
export function fmt(name: string, m: Metrics) {
  return [
    name.padEnd(28),
    m.days.toFixed(1).padStart(5), m.decisions.toFixed(0).padStart(4), m.minutes.toFixed(0).padStart(4),
    pct(m.tideShare).padStart(5), pct(m.offerShare).padStart(5), pct(m.abilityShare).padStart(5),
    m.reapPerPlayerDay.toFixed(2).padStart(6), pct(m.gainPct).padStart(5), pct(m.lossPct).padStart(5), pct(m.zeroDays).padStart(5),
    pct(m.closeTides).padStart(5), pct(m.lastFlip).padStart(5), pct(m.crowded).padStart(5), m.switches.toFixed(1).padStart(5),
    pct(m.leaderD3).padStart(5), m.margin.toFixed(1).padStart(5), m.winRatio !== undefined ? m.winRatio.toFixed(2).padStart(6) : '',
  ].join(' ');
}
export const HEADER = [
  'variant'.padEnd(28), ' days', 'dec', ' min', 'tide', 'offr', ' abil', ' reap', 'gain', 'loss', 'zero', 'close', 'last', 'crowd', '  sw', 'ldD3', ' marg', ' WR',
].join(' ');
