// The Divide rework lab: a small, fast model of the Open Game for testing rule reworks.
// It is not the real engine. It keeps only what the experiments need: the Altar, the Tide,
// Choirs, First Fruits, the three actions, and a short list of switchable abilities.

export type Dir = 1 | -1 | 0; // Light, Dark, Neutral

// ---------------------------------------------------------------- cards

export interface CardDef { id: number; name: string; v: number; ab: string | null }

export interface DeckSpec { [key: string]: number } // "L1:herald" -> copies; key = value code + ':' + ability (or '' for vanilla)

/** Build a deck from a spec such as { 'L1': 14, 'D1': 14, 'L2': 2, 'D2': 2, 'N': 8, 'L1:herald': 2 }. */
export function buildDeck(spec: DeckSpec): CardDef[] {
  const out: CardDef[] = [];
  for (const [key, copies] of Object.entries(spec)) {
    const [vc, ab] = key.split(':');
    const v = vc === 'N' ? 0 : (vc[0] === 'L' ? 1 : -1) * Number(vc.slice(1));
    for (let i = 0; i < copies; i++) out.push({ id: out.length, name: key, v, ab: ab || null });
  }
  return out;
}

// ---------------------------------------------------------------- rules

export type ScoreTable = { win: number[]; lose: number[] }; // index = number of Choirs on that side (1-based, index 0 unused)

export interface Rules {
  n: number;
  hand: number;
  choirStart: number;
  choirMax: number;
  turns: number; // turns per player each Day
  target: number;
  maxDays: number;
  fruits: boolean; // First Fruits each Morning (face up, then draw 1)
  fruitsBet: boolean; // First Fruits also pay the match reward
  omens: number; // facedown cards from the deck added to the Altar each Morning (noise)
  anonymous: boolean; // Offers are unattributed (shuffled facedown pile)
  offerReward: 'flat' | 'match' | 'none' | 'matchPlus'; // matchPlus: +1 now, +1 more if it matches the Tide
  score: ScoreTable | ((s: State, tide: Dir, margin: number) => number[]);
  leanStrength: boolean; // if true a Choir's lean is its sum, else only its sign matters for side
  order: 'rotate' | 'catchup'; // catchup: fewest Glory acts last
  gatherBlind: boolean; // may Gather facedown cards
  deck: DeckSpec;
  /** How many cards a Choir card discarded by Exalt/Gather returns: 'discard' or 'hand'. */
  replaced: 'discard' | 'hand';
  /** The Crown: the sole Glory leader's Choir counts as this many Choirs when sides are counted (1 = off). */
  crown: number;
  /** A tied Altar: 'none' (Neutral Tide) or 'yesterday' (the Tide stays as it was). */
  tieBreak: 'none' | 'yesterday';
  /** Ties at the end: shared. */
  label?: string;
}

export const TABLES: Record<string, ScoreTable> = {
  // V44: with the Tide alone 3, two 1 each, three+ 0; against alone -3, else -1.
  current: { win: [0, 3, 1, 0, 0, 0], lose: [0, -3, -1, -1, -1, -1] },
  // Spoils: alone 3, two 2 each, three 1 each, four 0; against nothing.
  spoils: { win: [0, 3, 2, 1, 0, 0], lose: [0, 0, 0, 0, 0, 0] },
  spoilsLone: { win: [0, 3, 2, 1, 0, 0], lose: [0, -1, 0, 0, 0, 0] },
  spoils42: { win: [0, 4, 2, 1, 0, 0], lose: [0, 0, 0, 0, 0, 0] },
  spoils421L: { win: [0, 4, 2, 1, 0, 0], lose: [0, -1, 0, 0, 0, 0] },
  flat2: { win: [0, 2, 2, 1, 0, 0], lose: [0, 0, 0, 0, 0, 0] },
  mirror1: { win: [0, 3, 1, 0, 0, 0], lose: [0, -1, 0, 0, 0, 0] },
  pair: { win: [0, 2, 2, 0, 0, 0], lose: [0, 0, 0, 0, 0, 0] },
  sym: { win: [0, 2, 1, 1, 0, 0], lose: [0, -1, -1, -1, -1, -1] },
};

export const BASE_DECK: DeckSpec = { L1: 16, D1: 16, L2: 3, D2: 3, N: 10 };

export function rules(over: Partial<Rules> = {}): Rules {
  return {
    n: 4, hand: 3, choirStart: 2, choirMax: 4, turns: 1, target: 12, maxDays: 30,
    fruits: true, fruitsBet: false, omens: 0, anonymous: false, offerReward: 'flat',
    score: TABLES.current, leanStrength: false, order: 'rotate', gatherBlind: true,
    deck: BASE_DECK, replaced: 'discard', crown: 1, tieBreak: 'none', ...over,
  };
}

// ---------------------------------------------------------------- state

export interface AltarCard { c: number; up: boolean; by: number; kind: 0 | 1 | 2; seen: number } // kind 0 fruits, 1 offer, 2 omen; seen = bitmask of seats
export interface ChoirCard { c: number; store: number; flip: boolean }

export interface DayLog { day: number; tide: Dir; margin: number; leans: number[]; reap: number[]; lastFlip: boolean; light: number; dark: number }

export interface State {
  R: Rules;
  cards: CardDef[];
  rng: number;
  day: number;
  first: number;
  glory: number[];
  hand: number[][];
  choir: ChoirCard[][];
  altar: AltarCard[];
  deck: number[];
  discard: number[];
  tides: Dir[];
  order: number[]; // turn order this Day
  step: number; // index into the Noon sequence (order repeated R.turns times)
  phase: 'fruits' | 'noon' | 'evening' | 'over';
  // per-Day flags
  used: number[]; // bitmask of once-per-Day abilities used per seat
  // bookkeeping (not needed for play; for metrics)
  src: Record<string, number>[];
  logs: DayLog[];
  decisions: number[];
  switches: number[];
  winners: number[];
  preLastNet: number | null;
  gloryByDay: number[][];
  offerStats: number[]; // [Offers, Offers against own lean]
  calls: number[]; // Prophet: each player's named Tide this Day (0 = none)
}

// mulberry32
export function rnd(s: State): number {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function shuffle<T>(s: State, a: T[]) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

export function newGame(R: Rules, seed: number): State {
  const cards = buildDeck(R.deck);
  const s: State = {
    R, cards, rng: seed | 0, day: 0, first: 0, glory: Array(R.n).fill(0), hand: [], choir: [], altar: [],
    deck: cards.map((c) => c.id), discard: [], tides: [], order: [], step: 0, phase: 'fruits', used: Array(R.n).fill(0),
    src: Array.from({ length: R.n }, () => ({})), logs: [], decisions: Array(R.n).fill(0), switches: Array(R.n).fill(0), winners: [],
    preLastNet: null, gloryByDay: [], offerStats: [0, 0], calls: Array(R.n).fill(0),
  };
  shuffle(s, s.deck);
  s.first = Math.floor(rnd(s) * R.n);
  for (let p = 0; p < R.n; p++) {
    s.hand.push([]);
    s.choir.push([]);
    for (let i = 0; i < R.choirStart; i++) s.choir[p].push({ c: draw(s)!, store: 0, flip: false });
    for (let i = 0; i < R.hand; i++) s.hand[p].push(draw(s)!);
  }
  startDay(s);
  return s;
}

export function clone(s: State): State {
  return {
    ...s,
    glory: s.glory.slice(), hand: s.hand.map((h) => h.slice()), choir: s.choir.map((c) => c.map((x) => ({ ...x }))),
    altar: s.altar.map((a) => ({ ...a })), deck: s.deck.slice(), discard: s.discard.slice(), tides: s.tides.slice(),
    order: s.order.slice(), used: s.used.slice(),
    // metrics are not cloned deeply: rollouts must not rely on them
    src: s.src.map(() => ({})), logs: [], decisions: s.decisions.slice(), switches: s.switches.slice(), winners: [], gloryByDay: [], offerStats: [0, 0], calls: s.calls.slice(),
  };
}

export function draw(s: State): number | undefined {
  if (!s.deck.length) {
    if (!s.discard.length) return undefined;
    s.deck = s.discard;
    s.discard = [];
    shuffle(s, s.deck);
  }
  return s.deck.pop();
}

export const val = (s: State, c: number) => s.cards[c].v;
export const ab = (s: State, c: number) => s.cards[c].ab;
export const sgn = (x: number): Dir => (x > 0 ? 1 : x < 0 ? -1 : 0);

export function choirHas(s: State, p: number, a: string) {
  for (const x of s.choir[p]) if (s.cards[x.c].ab === a) return true;
  return false;
}
export function choirCount(s: State, p: number, a: string) {
  let k = 0;
  for (const x of s.choir[p]) if (s.cards[x.c].ab === a) k++;
  return k;
}

/** Signed lean of a Choir (Light positive). */
export function leanSum(s: State, p: number) {
  let t = 0;
  for (const x of s.choir[p]) t += x.flip ? -val(s, x.c) : val(s, x.c);
  return t;
}
export const lean = (s: State, p: number): Dir => sgn(leanSum(s, p));

/** The Tide contribution of an Altar card, including ability modifiers. */
export function altarWeight(s: State, a: AltarCard) {
  let v = val(s, a.c);
  // Trumpet: your Offers count 1 more when they match your Choir's lean.
  if (a.by >= 0 && a.kind === 1 && v !== 0 && choirHas(s, a.by, 'trumpet') && sgn(v) === lean(s, a.by)) v += sgn(v);
  // Horn: all your Offers count 1 more.
  if (a.by >= 0 && a.kind === 1 && v !== 0 && (choirHas(s, a.by, 'horn') || choirHas(s, a.by, 'trumpet2'))) v += sgn(v);
  // Voice: your First Fruits count double.
  if (a.by >= 0 && a.kind === 0 && v !== 0 && choirHas(s, a.by, 'voice')) v *= 2;
  return v;
}
export function altarNet(s: State) {
  let t = 0;
  for (const a of s.altar) t += altarWeight(s, a);
  return t;
}

// ---------------------------------------------------------------- the Day

export function startDay(s: State) {
  s.day++;
  s.altar = [];
  s.used = Array(s.R.n).fill(0);
  s.calls = Array(s.R.n).fill(0);
  for (const ch of s.choir) for (const x of ch) x.flip = false;
  for (let k = 0; k < s.R.omens; k++) { const c = draw(s); if (c !== undefined) s.altar.push({ c, up: false, by: -1, kind: 2, seen: 0 }); }
  // Turn order
  const rot = Array.from({ length: s.R.n }, (_, i) => (s.first + i) % s.R.n);
  if (s.R.order === 'catchup') rot.sort((a, b) => s.glory[b] - s.glory[a] || rot.indexOf(a) - rot.indexOf(b));
  s.order = rot;
  s.step = 0;
  s.phase = s.R.fruits ? 'fruits' : 'noon';
  s.preLastNet = null;
  // Prophet: name the Tide in the Morning, before First Fruits (+1 at the Evening if right).
  for (let p = 0; p < s.R.n; p++) if (choirHas(s, p, 'prophet')) {
    let t = 0;
    for (let q = 0; q < s.R.n; q++) t += lean(s, q);
    for (const c of s.hand[p]) t += 0.5 * val(s, c);
    s.calls[p] = sgn(t) || lean(s, p) || 1;
  }
}

/** Simultaneous First Fruits: picks[p] = index into hand. */
export function applyFruits(s: State, picks: number[]) {
  for (let p = 0; p < s.R.n; p++) {
    if (!s.hand[p].length) continue;
    const [c] = s.hand[p].splice(picks[p], 1);
    s.altar.push({ c, up: true, by: p, kind: 0, seen: 0 });
    s.decisions[p]++;
  }
  for (let p = 0; p < s.R.n; p++) { const c = draw(s); if (c !== undefined) s.hand[p].push(c); }
  s.phase = 'noon';
}

export type Action =
  | { t: 'offer'; i: number }
  | { t: 'exalt'; i: number; r: number } // r = Choir index to replace, -1 if room
  | { t: 'gather'; k: number; r: number };

export const active = (s: State) => s.order[s.step % s.R.n];

export function legal(s: State, p: number): Action[] {
  const out: Action[] = [];
  const full = s.choir[p].length >= s.R.choirMax;
  const rs = full ? s.choir[p].map((_, j) => j) : [-1];
  for (let i = 0; i < s.hand[p].length; i++) out.push({ t: 'offer', i });
  for (let i = 0; i < s.hand[p].length; i++) for (const r of rs) out.push({ t: 'exalt', i, r });
  for (let k = 0; k < s.altar.length; k++) {
    const a = s.altar[k];
    if (!a.up && !s.R.gatherBlind && a.by !== p) continue;
    if (a.by >= 0 && a.by !== p && (choirHas(s, a.by, 'sanctuary') || choirHas(s, a.by, 'trumpet2')) && a.kind === 1) continue;
    for (const r of rs) out.push({ t: 'gather', k, r });
  }
  return out;
}

function credit(s: State, p: number, key: string, n: number) {
  s.src[p][key] = (s.src[p][key] ?? 0) + n;
}
export function gain(s: State, p: number, n: number, key: string) {
  if (n === 0) return;
  const before = s.glory[p];
  s.glory[p] = Math.max(0, s.glory[p] + n);
  credit(s, p, key, s.glory[p] - before);
}

function replaceAt(s: State, p: number, r: number) {
  if (r < 0) return;
  const [x] = s.choir[p].splice(r, 1);
  if (s.R.replaced === 'hand') s.hand[p].push(x.c);
  else s.discard.push(x.c);
  // Martyr-like: gain when a card leaves your Choir
  if (choirHas(s, p, 'martyr')) gain(s, p, 1, 'ab:martyr');
}

function enter(s: State, p: number, c: number) {
  s.choir[p].push({ c, store: 0, flip: false });
}

export function act(s: State, a: Action) {
  const p = active(s);
  const lastSeat = s.order[s.R.n - 1];
  if (p === lastSeat && s.step >= s.R.n * (s.R.turns - 1) && s.preLastNet === null) s.preLastNet = altarNet(s);
  const before = lean(s, p);
  s.decisions[p]++;
  if (a.t === 'offer') {
    const [c] = s.hand[p].splice(a.i, 1);
    s.offerStats[0]++;
    if (val(s, c) !== 0 && sgn(val(s, c)) === -lean(s, p)) s.offerStats[1]++;
    const hymn = Math.abs(val(s, c)) >= 2 && s.cards[c].ab === 'loud';
    s.altar.push({ c, up: hymn, by: p, kind: 1, seen: 1 << p });
    if (s.R.offerReward === 'flat' || s.R.offerReward === 'matchPlus') gain(s, p, 1, 'offer');
    if (choirHas(s, p, 'scribe')) { const d = draw(s); if (d !== undefined) s.hand[p].push(d); }
  } else if (a.t === 'exalt') {
    const [c] = s.hand[p].splice(a.i, 1);
    replaceAt(s, p, a.r);
    enter(s, p, c);
    if (choirHas(s, p, 'patron') && val(s, c) !== 0) gain(s, p, 1, 'ab:patron');
  } else {
    const [x] = s.altar.splice(a.k, 1);
    replaceAt(s, p, a.r);
    enter(s, p, x.c);
    if (x.by >= 0 && x.by !== p && choirHas(s, x.by, 'snare')) gain(s, x.by, 1, 'ab:snare');
    if (choirHas(s, p, 'pilgrim')) gain(s, p, 1, 'ab:pilgrim');
  }
  if (lean(s, p) !== before && s.phase === 'noon') s.switches[p]++;
  afterAction(s, p);
  s.step++;
  if (s.step >= s.R.n * s.R.turns) s.phase = 'evening';
}

/** Automatic "On your turn" abilities, decided by a simple fixed rule so they cost no decisions in the lab. */
function afterAction(s: State, p: number) {
  // Prophet (end-of-turn version, 'prophetT'): name the Tide at the end of your turn.
  if (choirHas(s, p, 'prophetT') && !s.calls[p]) {
    let m = 0;
    for (const a of s.altar) {
      if (a.up || a.by === p || (a.seen & (1 << p))) m += altarWeight(s, a);
      else if (!s.R.anonymous && a.by >= 0) m += 0.5 * lean(s, a.by);
    }
    const total = s.R.n * s.R.turns;
    for (let st = s.step + 1; st < total; st++) m += 0.45 * lean(s, s.order[st % s.R.n]);
    s.calls[p] = sgn(m) || lean(s, p) || 1;
  }
  // Seer: look at up to 2 facedown Altar cards.
  if (choirHas(s, p, 'seer')) {
    let k = 0;
    for (const a of s.altar) if (!a.up && !(a.seen & (1 << p)) && k < 2) { a.seen |= 1 << p; k++; }
  }
  // Store (Providence/Mammon): cash in when the store holds 3, or someone is near the target.
  for (let j = s.choir[p].length - 1; j >= 0; j--) {
    const x = s.choir[p][j];
    if (ab(s, x.c) === 'store' && x.store > 0 && (x.store >= 3 || Math.max(...s.glory) >= s.R.target - 3)) {
      gain(s, p, x.store, 'ab:store');
      x.store = 0;
      s.choir[p].splice(j, 1);
      s.discard.push(x.c);
    }
  }
}

/** Morning Star style flip, decided by the policy: flip Choir card j to the opposite alignment for this Day. */
export function flip(s: State, p: number, j: number) {
  s.choir[p][j].flip = true;
  s.used[p] |= 1;
  s.decisions[p]++;
}

// ---------------------------------------------------------------- Evening

/** How many Choirs each player's Choir counts as when sides are counted (the Crown). */
export function sideWeights(s: State): number[] {
  const out = Array(s.R.n).fill(1);
  if (s.R.crown > 1) {
    const top = Math.max(...s.glory);
    const leaders = s.glory.map((g, p) => (g === top ? p : -1)).filter((p) => p >= 0);
    if (leaders.length === 1 && top > 0) out[leaders[0]] = s.R.crown;
  }
  return out;
}

export function scoreTable(t: ScoreTable) {
  return (s: State, tide: Dir): number[] => {
    const n = s.R.n;
    const out = Array(n).fill(0);
    if (tide === 0) return out;
    const leans = Array.from({ length: n }, (_, p) => lean(s, p));
    const wt = sideWeights(s);
    let w = 0, l = 0;
    for (let p = 0; p < n; p++) { if (leans[p] === tide) w += wt[p]; else if (leans[p] === -tide) l += wt[p]; }
    for (let p = 0; p < n; p++) {
      if (leans[p] === tide) out[p] = t.win[w] ?? 0;
      else if (leans[p] === -tide) out[p] = t.lose[l] ?? t.lose[t.lose.length - 1];
    }
    return out;
  };
}

export function evening(s: State) {
  const n = s.R.n;
  const net = altarNet(s);
  let tide = sgn(net);
  if (tide === 0 && s.R.tieBreak === 'yesterday' && s.altar.length) tide = s.tides[s.tides.length - 1] ?? 0;
  for (const a of s.altar) a.up = true;
  const leans = Array.from({ length: n }, (_, p) => lean(s, p));
  const f = typeof s.R.score === 'function' ? s.R.score : scoreTable(s.R.score);
  const reap = f(s, tide, Math.abs(net));
  const before = s.glory.slice();
  for (let p = 0; p < n; p++) gain(s, p, reap[p], 'reaping');
  // Offer bets
  if (s.R.offerReward === 'match' || s.R.offerReward === 'matchPlus') {
    for (const a of s.altar) if (a.by >= 0 && (a.kind === 1 || (a.kind === 0 && s.R.fruitsBet)) && tide !== 0 && sgn(val(s, a.c)) === tide) gain(s, a.by, 1, a.kind === 1 ? 'bet' : 'fruitbet');
  }
  for (let p = 0; p < n; p++) if (s.calls[p] && tide !== 0 && s.calls[p] === tide) gain(s, p, 1, 'ab:prophet');
  endOfDayAbilities(s, tide, leans, reap);
  const lastFlip = s.preLastNet !== null && sgn(s.preLastNet) !== tide;
  let light = 0, dark = 0;
  for (const a of s.altar) { const v = altarWeight(s, a); if (v > 0) light += v; else dark -= v; }
  s.logs.push({ day: s.day, tide, margin: Math.abs(net), leans, reap: s.glory.map((g, p) => g - before[p]), lastFlip, light, dark });
  s.tides.push(tide);
  s.gloryByDay.push(s.glory.slice());
  for (const a of s.altar) s.discard.push(a.c);
  s.altar = [];
  if (s.glory.some((g) => g >= s.R.target) || s.day >= s.R.maxDays) {
    const top = Math.max(...s.glory);
    s.winners = s.glory.map((g, p) => (g === top ? p : -1)).filter((p) => p >= 0);
    s.phase = 'over';
    return;
  }
  for (let p = 0; p < n; p++) {
    while (s.hand[p].length < s.R.hand) { const c = draw(s); if (c === undefined) break; s.hand[p].push(c); }
  }
  s.first = (s.first + 1) % n;
  startDay(s);
}

function endOfDayAbilities(s: State, tide: Dir, leans: Dir[], reap: number[]) {
  const n = s.R.n;
  const withTide = leans.filter((l) => tide !== 0 && l === tide).length;
  const minG = Math.min(...s.glory);
  for (let p = 0; p < n; p++) {
    for (const x of s.choir[p]) {
      const a = ab(s, x.c);
      if (!a) continue;
      const v = x.flip ? -val(s, x.c) : val(s, x.c);
      switch (a) {
        case 'herald': // +1 if the Tide matches this card's alignment, whatever your Choir leans
          if (tide !== 0 && sgn(v) === tide) gain(s, p, 1, 'ab:herald');
          break;
        case 'banner': // +1 more if yours is the only Choir with the Tide
          if (tide !== 0 && leans[p] === tide && withTide === 1) gain(s, p, 1, 'ab:banner');
          break;
        case 'bond': // +1 if exactly two Choirs share the Tide and yours is one
          if (tide !== 0 && leans[p] === tide && withTide === 2) gain(s, p, 1, 'ab:bond');
          break;
        case 'banner2': // amplifier: +1 whenever you gain at the Reaping
          if (reap[p] > 0) gain(s, p, 1, 'ab:banner2');
          break;
        case 'hedge': // insurance: +1 if the Tide matches this card and the Reaping gave you nothing
          if (tide !== 0 && sgn(v) === tide && reap[p] <= 0) gain(s, p, 1, 'ab:hedge');
          break;
        case 'store3': // Reliquary: 1 on it each Day you gain at the Reaping; at 3, take them
          if (reap[p] > 0) { x.store++; if (x.store >= 3) { gain(s, p, 3, 'ab:store3'); x.store = 0; } }
          break;
        case 'store': // put 1 on it each Day you lean with the Tide
          if (tide !== 0 && leans[p] === tide) x.store++;
          break;
        case 'outcast':
          if (s.glory[p] === minG && reap[p] <= 0) gain(s, p, 1, 'ab:outcast');
          break;
        case 'stillness':
          if (tide === 0) gain(s, p, 2, 'ab:stillness');
          break;
        case 'tithe': { // +1 more for each of your Offers that matches the Tide
          if (tide === 0) break;
          let k = 0;
          for (const al of s.altar) if (al.by === p && al.kind === 1 && sgn(val(s, al.c)) === tide) k++;
          if (k) gain(s, p, Math.min(k, 1), 'ab:tithe');
          break;
        }
        case 'traitor': { // +1 if one of your Offers that opposed your own Choir's lean matches the Tide
          if (tide === 0) break;
          if (s.altar.some((al) => al.by === p && al.kind === 1 && sgn(val(s, al.c)) === tide && leans[p] === -tide)) gain(s, p, 1, 'ab:traitor');
          break;
        }
        case 'zealot1': {
          if (reap[p] <= 0 || v === 0) break;
          if (s.choir[p].some((y) => y !== x && sgn(y.flip ? -val(s, y.c) : val(s, y.c)) === sgn(v))) gain(s, p, 1, 'ab:zealot1');
          break;
        }
        case 'zealot2': { // when you gain at the Reaping, +1 more if 2 or more other cards share this card's alignment
          if (reap[p] <= 0 || v === 0) break;
          const k = s.choir[p].filter((y) => y !== x && sgn(y.flip ? -val(s, y.c) : val(s, y.c)) === sgn(v)).length;
          if (k >= 2) gain(s, p, 1, 'ab:zealot2');
          break;
        }
        case 'zealot': { // +1 if every other card in your Choir (at least 2) matches this card's alignment
          const others = s.choir[p].filter((y) => y !== x);
          if (others.length >= 2 && v !== 0 && others.every((y) => sgn(y.flip ? -val(s, y.c) : val(s, y.c)) === sgn(v))) gain(s, p, 1, 'ab:zealot');
          break;
        }
        case 'twilight': { // +1 if the other cards hold at least one Light and one Dark card
          const others = s.choir[p].filter((y) => y !== x).map((y) => sgn(y.flip ? -val(s, y.c) : val(s, y.c)));
          if (others.includes(1) && others.includes(-1)) gain(s, p, 1, 'ab:twilight');
          break;
        }
      }
    }
  }
}

export function isOver(s: State) {
  return s.phase === 'over';
}
