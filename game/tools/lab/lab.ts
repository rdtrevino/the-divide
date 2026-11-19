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
  abilities: Record<string, { wr: number; held: number; glory: number }>;
  altarSize: number; facedownAtReveal: number; // cards on the Altar at the reveal
  crownGain: number; othersGain: number; crownPartnered: number; // Reaping gain rate of the sole leader vs everyone else; leader shared a winning side
  leadChanges: number; // times per game the sole leader changes
  lossDays: number; // share of player-Days with a Reaping loss (Reaping only)
  sideGain: number[];
  spread: Record<string, number[]>;
  dominance: number; // share of Days with a dominant Tide (dominance scoring)
  freeRide: number[]; // Offers per dominant Day by the top-ranked and the second-ranked member of the dominant side
  gathers: number[]; // share of Gathers that took a card of your own side (selfish), of the other side (altruistic), Neutral
  offerRate: number; // share of Noon actions that are Offers
  fate?: { share: number; leanShowsFate: number; offersForFate: number; offersForChoir: number; whenSplit: number[]; fateSideWins: number; winRatioByFate?: Record<string, number> };
  oath?: number[]; // per game: Oaths Offered, stolen (Gathered from another player's Offer), Exalted
  stake?: { winRatioByType: Record<string, number>; tokens: number[] }; // tokens Offered, taken, lost per game
  miserBlocked?: number; // share of games in which the Miser's Rule changed the winner // 10th and 90th percentile across games: days, winner's ability share, winner's Glory // mean Evening Glory change for Choirs [with the Tide, against it, Neutral], and the table mean // win ratio and play rate of each ability in final Choirs; Glory it produced per game
}

const TIDE_KEYS = new Set(['reaping', 'bet', 'fruitbet', 'ab:herald', 'ab:banner', 'ab:bond', 'ab:store', 'ab:tithe', 'ab:stillness', 'ab:banner2', 'ab:hedge', 'ab:store3', 'ab:prophet', 'ab:zealot2', 'ab:zealot1', 'ab:traitor']);

export function measure(states: State[], tested?: { seat: (i: number) => number }): Metrics {
  const n = states[0].R.n;
  let days = 0, dec = 0, tide = 0, offer = 0, abil = 0, tot = 0, reapSum = 0, pd = 0, gainN = 0, lossN = 0, zero = 0, close = 0, neu = 0,
    lastF = 0, crowd = 0, same = 0, sw = 0, l3 = 0, l3n = 0, marg = 0, wg = 0, testedWins = 0, reapG = 0, cross = 0, offs = 0, bet = 0, und = 0, undN = 0, neuC = 0;
  const split: Record<string, number> = {};
  const sg = [0, 0, 0, 0], sn = [0, 0, 0, 0];
  const px = [0, 0, 0, 0, 0, 0], gt = [0, 0, 0]; let acts = 0;
  const os = [0, 0, 0, 0];
  const sk = [0, 0, 0]; const stC: Record<string, number> = {}, stW: Record<string, number> = {};
  const fs = [0, 0, 0, 0, 0, 0, 0]; let fateG = 0, fateTot = 0, fateTeamWin = 0, miserB = 0;
  const fCount: Record<string, number> = {}, fWin: Record<string, number> = {};
  const gDays: number[] = [], gAbil: number[] = [], gWin: number[] = [];
  let alt = 0, fdn = 0, cg = 0, cn = 0, og = 0, on = 0, cp = 0, lc = 0, rl = 0;
  const abH: Record<string, number> = {}, abW: Record<string, number> = {}, abG: Record<string, number> = {};
  const seat = Array(n).fill(0);
  states.forEach((s, gi) => {
    days += s.day;
    dec += s.decisions.reduce((a, b) => a + b, 0) / n;
    sw += s.switches.reduce((a, b) => a + b, 0) / n;
    cross += s.offerStats[1]; offs += s.offerStats[0];
    s.fateStats.forEach((x, i) => (fs[i] += x));
    if (s.R.stake) { s.stakeStats.forEach((x, i) => (sk[i] += x)); for (let p = 0; p < n; p++) { const k = s.stakeType[p]; stC[k] = (stC[k] ?? 0) + 1; if (s.winners.includes(p)) stW[k] = (stW[k] ?? 0) + 1 / s.winners.length; } }
    s.oathStats.forEach((x, i) => (os[i] += x));
    if (s.R.fate) for (let p = 0; p < n; p++) { const k = String(s.fate[p]); fCount[k] = (fCount[k] ?? 0) + 1; if (s.winners.includes(p)) fWin[k] = (fWin[k] ?? 0) + 1 / s.winners.length; }
    if (s.R.miser) { const top = Math.max(...s.glory); if (!s.winners.some((w) => s.glory[w] === top)) miserB++; }
    if (s.R.fate) { for (const w of s.winners) { fateG += (s.src[w]['fate'] ?? 0) / s.winners.length; fateTot += Object.values(s.src[w]).filter((v) => v > 0).reduce((a, b) => a + b, 0) / s.winners.length; } const lt = s.tides.filter((t) => t === 1).length, dt = s.tides.filter((t) => t === -1).length; const wf = s.fate[s.winners[0]]; if ((wf === 1 && lt > dt) || (wf === -1 && dt > lt)) fateTeamWin++; }
    s.paxStats.forEach((x, i) => (px[i] += x)); s.gatherStats.forEach((x, i) => (gt[i] += x)); acts += s.decisions.reduce((a, b) => a + b, 0) - s.day * n;
    for (let p = 0; p < n; p++) {
      const seen = new Set<string>();
      for (const x of s.choir[p]) { const a = s.cards[x.c].ab; if (a && !seen.has(a)) { seen.add(a); abH[a] = (abH[a] ?? 0) + 1; if (s.winners.includes(p)) abW[a] = (abW[a] ?? 0) + 1 / s.winners.length; } }
      for (const [k, v] of Object.entries(s.src[p])) if (k.startsWith('ab:')) abG[k.slice(3)] = (abG[k.slice(3)] ?? 0) + v;
    }
    const share = 1 / s.winners.length;
    { let a = 0, t = 0; for (const w of s.winners) for (const [k, v] of Object.entries(s.src[w])) { if (v <= 0) continue; t += v; if (k.startsWith('ab:')) a += v; } gAbil.push(t ? a / t : 0); gDays.push(s.day); gWin.push(Math.max(...s.glory)); }
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
      alt += d.altarSize; fdn += d.facedown;
      for (let p = 0; p < n; p++) {
        if (d.reapOnly[p] < 0) rl++;
        const k = d.tide === 0 ? -1 : d.leans[p] === d.tide ? 0 : d.leans[p] === -d.tide ? 1 : 2;
        if (k >= 0) { sg[k] += d.reap[p]; sn[k]++; }
        sg[3] += d.reap[p]; sn[3]++;
        if (p === d.crown) { cn++; if (d.reapOnly[p] > 0) cg++; if (d.reapOnly[p] > 0 && d.leans.filter((l) => l === d.leans[p]).length >= 2) cp++; }
        else { on++; if (d.reapOnly[p] > 0) og++; }
      }
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
    let prev = -1;
    for (const d of s.logs) { if (d.leader >= 0 && prev >= 0 && d.leader !== prev) lc++; if (d.leader >= 0) prev = d.leader; }
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
    altarSize: alt / D, facedownAtReveal: fdn / D, crownGain: cg / Math.max(1, cn), othersGain: og / Math.max(1, on), crownPartnered: cp / Math.max(1, cg), leadChanges: lc / G, lossDays: rl / (D * n), dominance: px[0] / Math.max(1, px[0] + px[1]), freeRide: [+(px[2] / Math.max(1, px[4])).toFixed(2), +(px[3] / Math.max(1, px[4])).toFixed(2)], gathers: gt.map((x) => +(x / Math.max(1, gt[0] + gt[1] + gt[2])).toFixed(2)), offerRate: offs / Math.max(1, acts),
    fate: states[0].R.fate ? { share: fateG / Math.max(1, fateTot), leanShowsFate: fs[0] / Math.max(1, fs[1]), offersForFate: fs[3] / Math.max(1, fs[2]), offersForChoir: fs[4] / Math.max(1, fs[2]), whenSplit: [fs[5], fs[6]], fateSideWins: fateTeamWin / G, winRatioByFate: Object.fromEntries(Object.keys(fCount).map((k) => [k === '1' ? 'Light' : k === '-1' ? 'Dark' : 'Forsaken', +(((fWin[k] ?? 0) / fCount[k]) * n).toFixed(2)])) } : undefined,
    miserBlocked: states[0].R.miser ? miserB / G : undefined,
    stake: states[0].R.stake ? { winRatioByType: Object.fromEntries(Object.keys(stC).sort().map((k) => [k, +(((stW[k] ?? 0) / stC[k]) * n).toFixed(2)])), tokens: sk.map((x) => +(x / G).toFixed(2)) } : undefined,
    oath: states[0].R.fate?.oath ? os.slice(0, 3).map((x) => +(x / G).toFixed(2)) : undefined, spread: Object.fromEntries(([['days', gDays], ['abil', gAbil], ['winGlory', gWin]] as [string, number[]][]).map(([k, a]) => { const b = a.slice().sort((x, y) => x - y); return [k, [+b[Math.floor(b.length * 0.1)].toFixed(2), +b[Math.floor(b.length * 0.9)].toFixed(2)]]; })), sideGain: sg.map((x, i) => +(x / Math.max(1, sn[i])).toFixed(2)),
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
