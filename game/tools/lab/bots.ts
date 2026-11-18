// Players for the lab: random, heuristic (fast, used inside rollouts) and Monte Carlo
// (samples the hidden cards, plays the rest of the Day for every option, keeps the best on average).
import {
  type Action, type Dir, type State, type ScoreTable, TABLES, act, active, altarWeight, applyFruits, choirHas, clone,
  evening, lean, leanSum, legal, rnd, sgn, shuffle, val, ab, sideWeights,
} from './core';

export type Policy = 'random' | 'heur' | 'mc' | 'offer' | 'build' | 'loyal' | 'follow';

// ---------------------------------------------------------------- helpers

const PHI = (x: number) => 1 / (1 + Math.exp(-1.702 * x));

function table(s: State): ScoreTable {
  return typeof s.R.score === 'function' ? ((s.R.score as any).proxy ?? TABLES.current) : s.R.score;
}
function payoff(s: State, side: Dir, tide: Dir, nSide: number, nOpp: number) {
  const t = table(s);
  if (side === 0 || tide === 0) return 0;
  return side === tide ? t.win[nSide] ?? 0 : t.lose[nOpp] ?? t.lose[t.lose.length - 1];
}

const knows = (s: State, p: number, k: number) => {
  const a = s.altar[k];
  return a.up || a.by === p || (a.seen & (1 << p)) !== 0;
};

/** Per-Day income of an ability in a Choir, roughly (used for building and for valuing positions). */
const RATE: Record<string, number> = {
  herald: 0.45, banner: 0.3, bond: 0.3, store: 0.5, trumpet: 0.25, voice: 0.2, seer: 0.15, outcast: 0.2, tithe: 0.3,
  zealot: 0.35, twilight: 0.35, sanctuary: 0.15, snare: 0.15, patron: 0.15, pilgrim: 0.2, martyr: 0.15, scribe: 0.25,
  stillness: 0.15, loud: 0, turncoat: 0.2, banner2: 0.5, hedge: 0.3, store3: 0.45, prophet: 0.35, horn: 0.3, zealot2: 0.3, zealot1: 0.4, traitor: 0.25, trumpet2: 0.4,
  treeOfLife: 0.3, firmament: 0.2, leviathan: 0.2, defiance: 0.2, uriel: 0.5, remnant2: 0.2, outcastOld: 0.25, council: 0.35,
  stillness2: 0.25, apple: 0.3, favor2: 0.3, hubris: 0.1, moderation2: 0.1, prophecy: 0.2, seraph: 0.2, mirage: 0.1, vessel: 0.4,
  ordeal: 0.3, acolyte: 0, michael: 0.3, envy: 0.2, anathema: 0.3, winnowing: 0.2, raphael: 0.2, abaddon: 0.1, scapegoat: 0.2,
  mercy2: 0.2, bounty2: 0.15,
};
const rate = (s: State, c: number) => RATE[ab(s, c) ?? ''] ?? 0;

export function daysLeft(s: State) {
  const lead = Math.max(...s.glory);
  return Math.max(1, Math.min(6, ((s.R.target - lead) / s.R.target) * 7));
}

/** Estimated Altar total (mean, variance) from p's point of view, including the turns still to come today. */
function estimate(s: State, p: number) {
  let m = 0, v = 0.0001;
  for (let k = 0; k < s.altar.length; k++) {
    const a = s.altar[k];
    if (knows(s, p, k)) m += altarWeight(s, a);
    else {
      if (!s.R.anonymous && a.by >= 0) m += 0.5 * lean(s, a.by);
      v += 1.1;
    }
  }
  const total = s.R.n * s.R.turns;
  for (let st = s.step + 1; st < total; st++) {
    const q = s.order[st % s.R.n];
    if (q === p) { m += 0.5 * (lean(s, p) || 0); v += 0.6; continue; }
    m += 0.45 * lean(s, q);
    v += 1.0;
  }
  return { m, v };
}

function counts(s: State, p: number, myLean: Dir) {
  let L = 0, D = 0;
  const wt = sideWeights(s);
  for (let q = 0; q < s.R.n; q++) {
    const l = q === p ? myLean : lean(s, q);
    if (l > 0) L += wt[q];
    else if (l < 0) D += wt[q];
  }
  return { L, D };
}

/** Expected Reaping for p with lean `myLean` when the Tide is Light with probability pl. */
function reapExp(s: State, p: number, myLean: Dir, pl: number) {
  if (myLean === 0) return -s.R.neutralLoss;
  const { L, D } = counts(s, p, myLean);
  const nSide = myLean > 0 ? L : D, nOpp = myLean > 0 ? D : L;
  return pl * payoff(s, myLean, 1, myLean > 0 ? nSide : nOpp, myLean > 0 ? nOpp : nSide) + (1 - pl) * payoff(s, myLean, -1, myLean < 0 ? nSide : nOpp, myLean < 0 ? nOpp : nSide);
}

/** Value of holding lean `l` on later Days, given the other Choirs' sides. */
export function posVal(s: State, p: number, l: Dir) {
  if (l === 0) return -s.R.neutralLoss;
  const { L, D } = counts(s, p, l);
  const pl = Math.max(0.2, Math.min(0.8, 0.5 + 0.08 * (L - D)));
  return pl * payoff(s, l, 1, l > 0 ? L : D, l > 0 ? D : L) + (1 - pl) * payoff(s, l, -1, l < 0 ? D : L, l < 0 ? L : D);
}

/** Dominance scoring: p's prize if the listed side dominates (or, side 0, if nobody does), with p's lean sum `mine`. */
function paxPrize(s: State, p: number, mine: number, side: number) {
  const P = s.R.pax!;
  const st = (q: number) => (q === p ? Math.abs(mine) : Math.abs(leanSum(s, q)));
  const ln = (q: number) => (q === p ? sgn(mine) : lean(s, q));
  if (mine === 0) return 0;
  if (side !== 0 && sgn(mine) !== side) return 0;
  const group = [...Array(s.R.n).keys()].filter((q) => ln(q) !== 0 && (side === 0 || ln(q) === side));
  // my rank: players strictly stronger, or equal with less Glory (when ties go to the poorer player), are ahead of me
  let ahead = 0, tied = 0;
  for (const q of group) {
    if (q === p) continue;
    if (st(q) > st(p)) ahead++;
    else if (st(q) === st(p)) {
      if (P.tie === 'lowGlory' && s.glory[q] < s.glory[p]) ahead++;
      else if (P.tie === 'lower' || s.glory[q] === s.glory[p]) tied++;
    }
  }
  const prizes = side === 0 ? P.indiv : P.dom;
  return prizes[ahead + tied] ?? 0;
}
/** Expected dominance prize today, given the Altar estimate (mean m, sd). */
function paxExp(s: State, p: number, mine: number, m: number, sd: number) {
  const D = s.R.pax!.margin;
  const pL = 1 - PHI((D - 0.5 - m) / sd);
  const pD = PHI((-D + 0.5 - m) / sd);
  const pN = Math.max(0, 1 - pL - pD);
  return pL * paxPrize(s, p, mine, 1) + pD * paxPrize(s, p, mine, -1) + pN * paxPrize(s, p, mine, 0);
}
/** Expected value of the position on later Days: who leans which way decides which side is likely to dominate. */
function paxLater(s: State, p: number, mine: number) {
  let m = 0;
  for (let q = 0; q < s.R.n; q++) m += 0.9 * (q === p ? sgn(mine) : lean(s, q));
  return paxExp(s, p, mine, m, 2.4);
}
/** Today's expected Reaping and the value of the position later, for either scoring system. */
function expNow(s: State, p: number, mine: number, m: number, sd: number) {
  return s.R.pax ? paxExp(s, p, mine, m, sd) : reapExp(s, p, sgn(mine), PHI(m / sd));
}
function expLater(s: State, p: number, mine: number) {
  return s.R.pax ? paxLater(s, p, mine) : posVal(s, p, sgn(mine));
}

function choirIncome(s: State, p: number, cards: number[]) {
  let t = 0;
  for (const c of cards) t += rate(s, c);
  return t;
}

// ---------------------------------------------------------------- heuristic

/** Score every legal action quickly. */
export function heurScores(s: State, p: number, acts: Action[], noise: number): number[] {
  const e = estimate(s, p);
  const sd = Math.sqrt(e.v);
  const curLean = lean(s, p);
  const dl = daysLeft(s);
  const H = Math.min(dl - 1, 2.5) * 0.5;
  const choirCards = s.choir[p].map((x) => x.c);
  const baseIncome = choirIncome(s, p, choirCards);
  const out: number[] = [];
  const reward = (c: number, m: number) => {
    const sv = sgn(val(s, c));
    const pm = sv === 0 ? 0 : sv > 0 ? PHI(m / sd) : 1 - PHI(m / sd);
    if (s.R.offerReward === 'flat') return 1;
    if (s.R.offerReward === 'match') return sv === 0 ? 0 : pm - s.R.betLoss * (1 - pm);
    if (s.R.offerReward === 'matchPlus') return 1 + pm;
    return 0;
  };
  for (const a of acts) {
    let sc = 0;
    if (a.t === 'pass') { out.push(-5); continue; }
    if (a.t === 'offer') {
      const c = s.hand[p][a.i];
      let w = val(s, c);
      if (w !== 0 && choirHas(s, p, 'trumpet') && sgn(w) === curLean) w += sgn(w);
      if (w !== 0 && (choirHas(s, p, 'horn') || choirHas(s, p, 'trumpet2'))) w += sgn(w);
      const m = e.m + w;
      sc = expNow(s, p, leanSum(s, p), m, sd) + reward(c, m) - 0.25 * rate(s, c) * dl + (choirHas(s, p, 'tithe') ? 0.5 * reward(c, m) : 0) + (choirHas(s, p, 'traitor') && sgn(val(s, c)) === -curLean ? 0.8 * reward(c, m) : 0);
    } else {
      let added: number, removedAltar = 0;
      if (a.t === 'exalt') added = s.hand[p][a.i];
      else {
        added = s.altar[a.k].c;
        const kn = knows(s, p, a.k);
        removedAltar = kn ? altarWeight(s, s.altar[a.k]) : !s.R.anonymous && s.altar[a.k].by >= 0 ? 0.5 * lean(s, s.altar[a.k].by) : 0;
      }
      const knownAdded = a.t === 'exalt' || knows(s, p, a.k);
      const addVal = knownAdded ? val(s, added) : removedAltar;
      const removed = a.r >= 0 ? s.choir[p][a.r].c : -1;
      const ns = leanSum(s, p) + addVal - (removed >= 0 ? val(s, removed) : 0);
      const m = e.m - removedAltar;
      const inc = baseIncome + (knownAdded ? rate(s, added) : 0.12) - (removed >= 0 ? rate(s, removed) : 0);
      sc = expNow(s, p, ns, m, sd) + H * expLater(s, p, ns) + inc * dl * 0.8 - H * expLater(s, p, leanSum(s, p)) - baseIncome * dl * 0.8;
      if (a.t === 'gather' && s.altar[a.k].by >= 0 && s.altar[a.k].by !== p && choirHas(s, s.altar[a.k].by, 'snare')) sc -= 0.5;
      if (a.t === 'gather' && choirHas(s, p, 'pilgrim')) sc += 1;
      if (a.t === 'exalt' && choirHas(s, p, 'patron') && val(s, added) !== 0) sc += 1;
      if (removed >= 0 && choirHas(s, p, 'martyr')) sc += 1;
    }
    out.push(sc + (noise ? rnd(s) * noise : 0));
  }
  return out;
}

export function heurAction(s: State, p: number, noise = 0.25): Action {
  const acts = legal(s, p);
  const sc = heurScores(s, p, acts, noise);
  let b = 0;
  for (let i = 1; i < acts.length; i++) if (sc[i] > sc[b]) b = i;
  return acts[b];
}

export function heurFruit(s: State, p: number, noise = 0.25): number {
  const h = s.hand[p];
  if (!h.length) return 0;
  const my = lean(s, p) || (sgn(h.reduce((t, c) => t + val(s, c), 0)) as Dir) || 1;
  const dl = daysLeft(s);
  let best = 0, bs = -Infinity;
  for (let i = 0; i < h.length; i++) {
    const v = val(s, h[i]);
    let sc = sgn(v) === my ? 0.5 * Math.abs(v) : v === 0 ? 0.15 : -0.45 * Math.abs(v);
    if (choirHas(s, p, 'voice') && sgn(v) === my) sc += 0.4;
    if (s.R.fruitsBet && sgn(v) === my) sc += 0.4;
    // keep the cards worth building or Offering
    sc -= 0.3 * rate(s, h[i]) * dl;
    if (s.R.offerReward !== 'flat' && sgn(v) === my) sc -= 0.25; // a matching card is also a good Offer later
    sc += noise ? rnd(s) * noise : 0;
    if (sc > bs) { bs = sc; best = i; }
  }
  return best;
}

/** Turncoat (Morning Star) at the end of p's turn: flip a card if it moves the lean to a better side today. */
export function heurFlip(s: State, p: number): number {
  if (s.used[p] & 1) return -1;
  const j = s.choir[p].findIndex((x) => ab(s, x.c) === 'turncoat');
  if (j < 0) return -1;
  const e = estimate(s, p);
  const sd = Math.sqrt(e.v);
  let best = -1, bv = expNow(s, p, leanSum(s, p), e.m, sd) + 0.15;
  for (let k = 0; k < s.choir[p].length; k++) {
    const v = expNow(s, p, leanSum(s, p) - 2 * val(s, s.choir[p][k].c), e.m, sd);
    if (v > bv) { bv = v; best = k; }
  }
  return best;
}

// ---------------------------------------------------------------- simple fixed strategies (for "is there a dumb dominant strategy?")

function fixedAction(s: State, p: number, pol: Policy): Action {
  const acts = legal(s, p);
  const sc = heurScores(s, p, acts, 0.1);
  const pick = (pred: (a: Action) => boolean) => {
    let b = -1;
    for (let i = 0; i < acts.length; i++) if (pred(acts[i]) && (b < 0 || sc[i] > sc[b])) b = i;
    return b >= 0 ? acts[b] : null;
  };
  if (pol === 'offer') return pick((a) => a.t === 'offer') ?? heurAction(s, p);
  if (pol === 'build') return pick((a) => a.t !== 'offer') ?? heurAction(s, p);
  if (pol === 'loyal') {
    // Never change sides: only consider actions that keep the current lean.
    const cur = lean(s, p);
    const keep = (a: Action) => {
      if (a.t === 'offer' || a.t === 'pass') return true;
      const c = a.t === 'exalt' ? s.hand[p][a.i] : s.altar[a.k].c;
      const r = a.r >= 0 ? val(s, s.choir[p][a.r].c) : 0;
      return cur === 0 || sgn(leanSum(s, p) + val(s, c) - r) === cur;
    };
    return pick(keep) ?? heurAction(s, p);
  }
  if (pol === 'follow') {
    // Always Offer toward the majority of Choirs, never think about crowding.
    let t = 0;
    for (let q = 0; q < s.R.n; q++) t += lean(s, q);
    const dir = sgn(t) || lean(s, p) || 1;
    return pick((a) => a.t === 'offer' && sgn(val(s, s.hand[p][a.i])) === dir) ?? pick((a) => a.t === 'offer') ?? heurAction(s, p);
  }
  return heurAction(s, p);
}

// ---------------------------------------------------------------- Monte Carlo

export interface MCOpts { samples: number; maxCands: number }
export const MC_DEFAULT: MCOpts = { samples: 16, maxCands: 9 };

/** A copy of s in which everything p cannot see is re-dealt at random (facedown Offers weighted toward their owner's lean). */
function determinize(s: State, p: number, salt: number): State {
  const d = clone(s);
  d.rng = (s.rng ^ Math.imul(salt + 1, 0x9e3779b1)) | 0;
  const pool: number[] = [...d.deck];
  for (let q = 0; q < d.R.n; q++) if (q !== p) pool.push(...d.hand[q]);
  const hidden: number[] = [];
  for (let k = 0; k < d.altar.length; k++) if (!knows(d, p, k)) { pool.push(d.altar[k].c); hidden.push(k); }
  shuffle(d, pool);
  for (const k of hidden) {
    const a = d.altar[k];
    const l = !d.R.anonymous && a.by >= 0 ? lean(d, a.by) : 0;
    // weighted pick
    let tot = 0;
    const ws = pool.map((c) => { const sv = sgn(val(d, c)); const w = l === 0 ? 1 : sv === l ? 2.2 : sv === 0 ? 1 : 0.55; tot += w; return w; });
    let r = rnd(d) * tot, i = 0;
    for (; i < ws.length - 1; i++) { r -= ws[i]; if (r <= 0) break; }
    a.c = pool[i];
    pool.splice(i, 1);
  }
  for (let q = 0; q < d.R.n; q++) if (q !== p) { const n = d.hand[q].length; d.hand[q] = pool.splice(0, n); }
  d.deck = pool;
  return d;
}

function value(s: State, q: number) {
  const dl = daysLeft(s);
  const H = Math.min(dl - 1, 2.5) * 0.5;
  return s.glory[q] + H * expLater(s, q, leanSum(s, q)) + choirIncome(s, q, s.choir[q].map((x) => x.c)) * dl * 0.7;
}
function utility(s: State, p: number) {
  if (s.phase === 'over') {
    if (s.winners.includes(p)) return 100 / s.winners.length + s.glory[p] * 0.01;
    return -50 + (s.glory[p] - Math.max(...s.glory)) * 0.5;
  }
  const me = value(s, p);
  let mx = -Infinity, sum = 0;
  for (let q = 0; q < s.R.n; q++) if (q !== p) { const v = value(s, q); sum += v; if (v > mx) mx = v; }
  return me - 0.6 * mx - 0.4 * (sum / (s.R.n - 1));
}

/** Play out the rest of the current Day with the heuristic for everyone (through the Evening). */
function rollDay(s: State) {
  let guard = 0;
  while (s.phase === 'noon') {
    const q = active(s);
    act(s, heurAction(s, q, 0.3));
    const f = heurFlip(s, q);
    if (f >= 0) { s.choir[q][f].flip = true; s.used[q] |= 1; }
    if (++guard > 200) throw new Error('rollout stall');
  }
  if (s.phase === 'evening') evening(s);
}

function prune(s: State, p: number, acts: Action[], max: number) {
  if (acts.length <= max) return acts;
  const sc = heurScores(s, p, acts, 0);
  const idx = acts.map((_, i) => i).sort((a, b) => sc[b] - sc[a]);
  const keep = new Set(idx.slice(0, max - 2));
  // make sure each action type is represented by its best option
  for (const t of ['offer', 'exalt', 'gather']) { const i = idx.find((j) => acts[j].t === t); if (i !== undefined) keep.add(i); }
  return [...keep].map((i) => acts[i]);
}

export function mcAction(s: State, p: number, o: MCOpts = MC_DEFAULT): Action {
  const acts = prune(s, p, legal(s, p), o.maxCands);
  const tot = acts.map(() => 0);
  for (let k = 0; k < o.samples; k++) {
    const d = determinize(s, p, k * 31 + p);
    for (let i = 0; i < acts.length; i++) {
      const c = clone(d);
      c.rng = (d.rng + k * 7919) | 0; // common random numbers across options
      act(c, acts[i]);
      const f = heurFlip(c, p);
      if (f >= 0) { c.choir[p][f].flip = true; c.used[p] |= 1; }
      rollDay(c);
      tot[i] += utility(c, p);
    }
  }
  let b = 0;
  for (let i = 1; i < acts.length; i++) if (tot[i] > tot[b]) b = i;
  return acts[b];
}

export function mcFruit(s: State, p: number, o: MCOpts = MC_DEFAULT): number {
  const h = s.hand[p];
  if (h.length <= 1) return 0;
  const tot = h.map(() => 0);
  for (let k = 0; k < o.samples; k++) {
    const d = determinize(s, p, k * 31 + p + 7);
    const others = Array.from({ length: d.R.n }, (_, q) => (q === p ? 0 : heurFruit(d, q)));
    for (let i = 0; i < h.length; i++) {
      const c = clone(d);
      c.rng = (d.rng + k * 7919) | 0;
      const picks = others.slice();
      picks[p] = i;
      applyFruits(c, picks);
      rollDay(c);
      tot[i] += utility(c, p);
    }
  }
  let b = 0;
  for (let i = 1; i < h.length; i++) if (tot[i] > tot[b]) b = i;
  return b;
}

// ---------------------------------------------------------------- dispatch

export function chooseFruit(s: State, p: number, pol: Policy): number {
  if (!s.hand[p].length) return 0;
  if (pol === 'random') return Math.floor(rnd(s) * s.hand[p].length);
  if (pol === 'mc') return mcFruit(s, p);
  return heurFruit(s, p);
}
export function chooseAction(s: State, p: number, pol: Policy): Action {
  if (pol === 'random') { const a = legal(s, p); return a[Math.floor(rnd(s) * a.length)]; }
  if (pol === 'mc') return mcAction(s, p);
  if (pol === 'heur') return heurAction(s, p);
  return fixedAction(s, p, pol);
}
export function chooseFlip(s: State, p: number, pol: Policy): number {
  if (pol === 'random') return -1;
  return heurFlip(s, p);
}
