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
  offerReward: 'flat' | 'match' | 'none' | 'matchPlus' | 'pari'; // matchPlus: +1 now, +1 more if it matches the Tide; pari: winners share a pot
  /** Collection plate: the pot is this base plus 1 per Offer on the losing side, shared evenly (rounded down) by the winning Offers. */
  pariBase?: number;
  /** Choir cards matching the Tide each earn this much at the Reaping (instead of a scoring table). */
  choirCardPay?: number;
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
  /** Against the Tide, a loss applies only to Choirs leaning by at least this much (0 = always). */
  loseHeavy: number;
  /** Glory a Neutral Choir loses when there is a Tide (the lukewarm rule). */
  neutralLoss: number;
  /** Soft Crown: the sole leader gains this much less at the Reaping (min 0). */
  crownTax: number;
  /** A bet that opposes the Tide costs this much (Neutral cards never bet). */
  betLoss: number;
  /** Senior partner: when exactly two Choirs share the Tide and one leans more strongly, it gains [hi] and the other [lo]. */
  pairSplit?: number[];
  /** Dominance scoring (Pax Pamir style). A Tide won by `margin` or more is dominant: that side's Choirs are ranked by strength
   *  (the size of their lean) and paid `dom[rank]`. Otherwise every Choir is ranked by strength, whatever its side, and paid `indiv[rank]`.
   *  Ties in strength go to the player with less Glory ('lowGlory'), or all tied players take the lower prize ('lower'). */
  pax?: { margin: number; dom: number[]; indiv: number[]; tie: 'lowGlory' | 'lower' };
  /** Fates: each player secretly draws a Fate (1 Light, -1 Dark) from `pool`. Every Evening each Choir card matching the Tide earns
   *  `choirPay`; every Day the Tide matches your Fate is worth `perDay`, scored only at the end (after maxDays). */
  fate?: { pool: number[]; perDay: number; choirPay: number; mult?: boolean; oath?: boolean; oathHand?: boolean; oathReturn?: 'owner' | 'shuffle'; anyColour?: boolean };
  /** Anonymous First Fruits: they are placed facedown, shuffled together, then turned face up, so nobody knows whose was whose. */
  anonFruits?: boolean;
  /** Anonymous reveal: facedown Offers are shuffled together before they are turned face up, so nobody learns whose card was whose. */
  anonReveal?: boolean;
  /** Veiled Exalt: you may Exalt a card facedown. It counts for you as usual; the table sees only a hidden card. */
  veiledExalt?: boolean;
  /** Soft Miser's Rule: at the end, the player(s) who Offered the fewest cards lose this much Glory (unless everyone is tied). */
  miserTax?: number;
  /** Stakes (Robert's ideas, November 19). Every player keeps two public banks: each Evening the bank of the Tide's color grows by
   *  1 + that color's cards in their Choir. What is secret is how the banks score at the end:
   *  'creed': a secret allegiance card (faithful: Light bank; fallen: Dark bank; follower: the larger bank; balancer: twice the smaller;
   *           doubleL / doubleD: one bank, plus 2 per card of the other color in your Choir at the end);
   *  'tokens': secret allegiance tokens; you score Light bank x Light tokens + Dark bank x Dark tokens (divided by perPlayer/2). */
  stake?: {
    kind: 'creed' | 'tokens';
    creeds?: string[];
    perPlayer?: number;
    mix?: 'even' | 'random';
    poolL?: number; poolD?: number;
    mobile?: boolean; // tokens can be Offered (Light/Dark +2) and Gathered; a token left on the Altar is lost
    score?: 'weighted' | 'winner' | 'collect' | 'concentrate' | 'days' | 'world'; // concentrate: tokens count squared (rewards committing to one color)
    // 'days' (the Tide track): no banks. Each token scores tokVal for every Day its color won; the Choir pays reap per matching card each Evening.
    // 'world': no banks. Tokens of the color that won more Days score tokVal each (a tie: half each); the Choir pays as in 'days'.
    tokVal?: number; reap?: number;
    shares?: boolean; choirShare?: number; // 'days' only: your Choir cards also score at the end like tokens of their color (public shares beside your hidden ones)
    onAltar?: 'lost' | 'fewest'; // a token left on the Altar is lost, or set aside for the players with the fewest tokens to draw
    collectBonus?: number;
    asCards?: boolean; // tokens are Host cards in the deck: drawn, held in hand, Offered like cards, Gathered to hand, never Exalted
  };
  /** The Miser's Rule: at the end, the player(s) who Offered the fewest cards cannot win (unless everyone is tied). */
  miser?: boolean;
  /** Pantheon: each game shuffles a random selection of the original cards (picks[i] from pools[i]) into a base deck. */
  pantheon?: { base: DeckSpec; pools: string[][]; picks: number[] };
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
    deck: BASE_DECK, replaced: 'discard', crown: 1, tieBreak: 'none', loseHeavy: 0, neutralLoss: 0, crownTax: 0, betLoss: 0, ...over,
  };
}

// ---------------------------------------------------------------- state

export interface AltarCard { c: number; up: boolean; by: number; kind: 0 | 1 | 2; seen: number } // kind 0 fruits, 1 offer, 2 omen; seen = bitmask of seats
export interface ChoirCard { c: number; store: number; flip: boolean; hid?: boolean }

export interface DayLog { day: number; tide: Dir; margin: number; leans: number[]; reap: number[]; lastFlip: boolean; light: number; dark: number; reapOnly: number[]; crown: number; altarSize: number; facedown: number; leader: number }

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
  dayOffers: number[]; paxStats: number[]; gatherStats: number[];
  fate: number[]; fateDays: number[]; fateStats: number[]; offersBy: number[]; oathStats: number[];
  oathPool: number[]; // Oaths set aside, facedown
  preReveal?: number[]; // Glory just before the end-of-game reveal (Fates, Oaths, stakes)
  banks: number[][]; creed: string[]; tok: number[][]; stakeType: string[]; stakeStats: number[];
  pub: number[][]; pubDay: number[][]; readerRows: number[][]; // what the table can see of each player (for the reader), and its log
  prevLean: number[]; prevWith: boolean[]; dayStart: number[]; council: number[]; bounty: number[]; anathema: number; ordeal: boolean[];
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
  let spec = R.deck;
  if (R.pantheon) {
    // A separate generator so the Pantheon does not disturb the game's own shuffle.
    let t0 = (seed ^ 0x5bd1e995) | 0;
    const r = () => { let t = (t0 = (t0 + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    spec = { ...R.pantheon.base };
    R.pantheon.pools.forEach((pool, i) => {
      const a = pool.slice();
      for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; }
      for (const key of a.slice(0, R.pantheon!.picks[i])) spec[key] = (spec[key] ?? 0) + 1;
    });
  }
  const cards = buildDeck(spec);
  const s: State = {
    R, cards, rng: seed | 0, day: 0, first: 0, glory: Array(R.n).fill(0), hand: [], choir: [], altar: [],
    deck: cards.map((c) => c.id), discard: [], tides: [], order: [], step: 0, phase: 'fruits', used: Array(R.n).fill(0),
    src: Array.from({ length: R.n }, () => ({})), logs: [], decisions: Array(R.n).fill(0), switches: Array(R.n).fill(0), winners: [],
    preLastNet: null, gloryByDay: [], offerStats: [0, 0], calls: Array(R.n).fill(0),
    dayOffers: Array(R.n).fill(0), paxStats: [0, 0, 0, 0, 0, 0], gatherStats: [0, 0, 0],
    fate: Array(R.n).fill(0), fateDays: Array(R.n).fill(0), fateStats: [0, 0, 0, 0, 0, 0, 0], offersBy: Array(R.n).fill(0), oathStats: [0, 0, 0, 0],
    oathPool: [], banks: Array.from({ length: R.n }, () => [0, 0]), creed: Array(R.n).fill(''), tok: Array.from({ length: R.n }, () => []), stakeType: Array(R.n).fill(''), stakeStats: [0, 0, 0],
    pub: Array.from({ length: R.n }, () => Array(PUB).fill(0)), pubDay: Array.from({ length: R.n }, () => Array(PUB).fill(0)), readerRows: [],
    prevLean: Array(R.n).fill(0), prevWith: Array(R.n).fill(false), dayStart: Array(R.n).fill(0), council: Array(R.n).fill(-1), bounty: Array(R.n).fill(-1), anathema: -1, ordeal: Array(R.n).fill(false),
  };
  shuffle(s, s.deck);
  s.first = Math.floor(rnd(s) * R.n);
  if (R.fate && !R.fate.oath) {
    let t0 = (seed ^ 0x2c1b3c6d) | 0;
    const r = () => { let t = (t0 = (t0 + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const bag = R.fate.pool.slice();
    for (let k = bag.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [bag[k], bag[j]] = [bag[j], bag[k]]; }
    s.fate = bag.slice(0, R.n);
  }
  for (let p = 0; p < R.n; p++) {
    s.hand.push([]);
    s.choir.push([]);
    for (let i = 0; i < R.choirStart; i++) s.choir[p].push({ c: draw(s)!, store: 0, flip: false });
    for (let i = 0; i < R.hand; i++) s.hand[p].push(draw(s)!);
  }
  if (R.fate?.oath) {
    // Oaths: allegiance is an Oath card in hand. Take every Oath out of the deal, give each player one, set the rest aside unseen.
    const isOath = (c: number) => s.cards[c].ab === 'oath';
    let oaths = s.cards.filter((c) => c.ab === 'oath').map((c) => c.id);
    s.deck = s.deck.filter((c) => !isOath(c));
    for (let p = 0; p < R.n; p++) {
      s.hand[p] = s.hand[p].filter((c) => !isOath(c));
      s.choir[p] = s.choir[p].filter((x) => !isOath(x.c));
      while (s.choir[p].length < R.choirStart) s.choir[p].push({ c: s.deck.pop()!, store: 0, flip: false });
      while (s.hand[p].length > R.hand - 1) s.deck.unshift(s.hand[p].pop()!);
      while (s.hand[p].length < R.hand - 1) s.hand[p].push(s.deck.pop()!);
    }
    shuffle(s, oaths);
    for (let p = 0; p < R.n; p++) s.hand[p].push(oaths[p]);
    s.oathPool = oaths.slice(R.n);
    syncOaths(s);
  }
  if (R.stake) dealStakes(s, seed);
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
    dayOffers: s.dayOffers.slice(), paxStats: [0, 0, 0, 0, 0, 0], gatherStats: [0, 0, 0],
    fate: s.fate.slice(), fateDays: s.fateDays.slice(), fateStats: [0, 0, 0, 0, 0, 0, 0], offersBy: s.offersBy.slice(), oathStats: [0, 0, 0, 0],
    oathPool: s.oathPool.slice(), banks: s.banks.map((b) => b.slice()), creed: s.creed.slice(), tok: s.tok.map((t) => t.slice()), stakeType: s.stakeType, stakeStats: [0, 0, 0],
    pub: s.pub.map(() => Array(PUB).fill(0)), pubDay: s.pubDay.map(() => Array(PUB).fill(0)), readerRows: [],
    prevLean: s.prevLean.slice(), prevWith: s.prevWith.slice(), dayStart: s.dayStart.slice(), council: s.council.slice(), bounty: s.bounty.slice(), ordeal: s.ordeal.slice(),
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

export const val = (s: State, c: number) => (s.cards[c].ab === 'acolyte' ? s.tides[s.tides.length - 1] ?? 0 : s.cards[c].v);
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

/** What p can see of the Altar, plus the expected pushes still to come today. */
export function quickEstimate(s: State, p: number) {
  let m = 0;
  for (const a of s.altar) {
    if (a.up || a.by === p || (a.seen & (1 << p))) m += altarWeight(s, a);
    else if (!s.R.anonymous && a.by >= 0) m += 0.5 * lean(s, a.by);
  }
  const total = s.R.n * s.R.turns;
  for (let st = s.step + 1; st < total; st++) m += 0.45 * lean(s, s.order[st % s.R.n]);
  return m;
}
function soleLeader(s: State, except = -1) {
  const top = Math.max(...s.glory);
  const ls = s.glory.map((g, p) => (g === top ? p : -1)).filter((p) => p >= 0);
  return ls.length === 1 && ls[0] !== except && top > 0 ? ls[0] : -1;
}

export function startDay(s: State) {
  s.day++;
  s.altar = [];
  s.used = Array(s.R.n).fill(0);
  s.calls = Array(s.R.n).fill(0);
  s.dayStart = s.glory.slice();
  s.dayOffers = Array(s.R.n).fill(0);
  s.ordeal = Array(s.R.n).fill(false);
  for (let p = 0; p < s.R.n; p++) {
    // Council: name a player who leans your way (not the leader if you can help it).
    s.council[p] = -1;
    if (choirHas(s, p, 'council') && lean(s, p) !== 0) {
      const lead = soleLeader(s);
      const c = [...Array(s.R.n).keys()].filter((q) => q !== p && lean(s, q) === lean(s, p)).sort((a, b) => (a === lead ? 1 : 0) - (b === lead ? 1 : 0));
      if (c.length) s.council[p] = c[0];
    }
    // Bounty: name the player most likely to gain nothing: someone alone on a side, else a rival on the other side.
    s.bounty[p] = -1;
    if (choirHas(s, p, 'bounty2')) {
      const others = [...Array(s.R.n).keys()].filter((q) => q !== p && lean(s, q) !== 0);
      const opp = others.filter((q) => lean(s, q) === -lean(s, p));
      s.bounty[p] = opp[0] ?? -1;
    }
  }
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
  for (let p = 0; p < s.R.n; p++) if (choirHas(s, p, 'prophet') || choirHas(s, p, 'prophecy')) {
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
    if (!s.R.anonFruits) {
      see(s, p, sgn(val(s, c)) > 0 ? P.ffL : sgn(val(s, c)) < 0 ? P.ffD : -1);
      if (s.cards[c].ab === 'oath') see(s, p, sgn(val(s, c)) > 0 ? P.oathL : P.oathD);
    }
  }
  for (let p = 0; p < s.R.n; p++) { const c = draw(s); if (c !== undefined) s.hand[p].push(c); }
  syncOaths(s);
  s.phase = 'noon';
}

export type Action =
  | { t: 'offer'; i: number }
  | { t: 'exalt'; i: number; r: number; h?: boolean } // r = Choir index to replace, -1 if room; h = Exalted facedown (veiled)
  | { t: 'gather'; k: number; r: number }
  | { t: 'tok'; col: number } // Offer one of your allegiance tokens of that color, facedown
  | { t: 'pass' };

export const active = (s: State) => s.order[s.step % s.R.n];

export function legal(s: State, p: number): Action[] {
  const out: Action[] = [];
  const full = s.choir[p].length >= s.R.choirMax;
  const rs = full ? s.choir[p].map((_, j) => j) : [-1];
  if (!(s.anathema >= 0 && s.anathema !== p)) for (let i = 0; i < s.hand[p].length; i++) out.push({ t: 'offer', i });
  for (let i = 0; i < s.hand[p].length; i++) { if (s.R.fate?.oathHand && s.cards[s.hand[p][i]].ab === 'oath') continue; if (isTok(s, s.hand[p][i])) continue; for (const r of rs) { out.push({ t: 'exalt', i, r }); if (s.R.veiledExalt) out.push({ t: 'exalt', i, r, h: true }); } }
  for (let k = 0; k < s.altar.length; k++) {
    const a = s.altar[k];
    if (!a.up && !s.R.gatherBlind && a.by !== p) continue;
    if (a.by >= 0 && a.by !== p && (choirHas(s, a.by, 'sanctuary') || choirHas(s, a.by, 'trumpet2')) && a.kind === 1) continue;
    if (a.by >= 0 && a.by !== p && choirHas(s, a.by, 'mirage')) continue;
    if ((s.R.fate?.oathHand && s.cards[a.c].ab === 'oath') || isTok(s, a.c)) { out.push({ t: 'gather', k, r: -1 }); continue; }
    for (const r of rs) out.push({ t: 'gather', k, r });
  }
  if (s.R.stake?.mobile && !s.R.stake.asCards && !(s.anathema >= 0 && s.anathema !== p)) {
    if (s.tok[p].some((c) => s.cards[c].v > 0)) out.push({ t: 'tok', col: 1 });
    if (s.tok[p].some((c) => s.cards[c].v < 0)) out.push({ t: 'tok', col: -1 });
  }
  if (!out.length) out.push({ t: 'pass' });
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
  if (s.anathema === p) s.anathema = -1;
  s.decisions[p]++;
  if (a.t === 'pass') {
    // nothing
  } else if (a.t === 'tok') {
    const j = s.tok[p].findIndex((c) => sgn(s.cards[c].v) === a.col);
    const [c] = s.tok[p].splice(j, 1);
    s.altar.push({ c, up: false, by: p, kind: 1, seen: 1 << p });
    s.offerStats[0]++; s.dayOffers[p]++; s.offersBy[p]++; s.stakeStats[0]++;
    see(s, p, P.offN); see(s, p, P.tokOff);
  } else if (a.t === 'offer') {
    const [c] = s.hand[p].splice(a.i, 1);
    s.offerStats[0]++;
    s.dayOffers[p]++;
    s.offersBy[p]++;
    see(s, p, P.offN);
    if (s.cards[c].ab === 'oath') s.oathStats[0]++;
    if (isTok(s, c)) { s.stakeStats[0]++; see(s, p, P.tokOff); }
    if (s.R.fate) {
      const cv = sgn(val(s, c)), f = s.fate[p], l = lean(s, p);
      s.fateStats[2]++;
      if (cv !== 0 && cv === f) s.fateStats[3]++;
      if (cv !== 0 && cv === l) s.fateStats[4]++;
      if (l !== 0 && l !== f) { if (cv === f) s.fateStats[5]++; else if (cv === l) s.fateStats[6]++; }
    }
    if (val(s, c) !== 0 && sgn(val(s, c)) === -lean(s, p)) s.offerStats[1]++;
    const hymn = Math.abs(val(s, c)) >= 2 && s.cards[c].ab === 'loud';
    s.altar.push({ c, up: hymn, by: p, kind: 1, seen: 1 << p });
    if (s.R.offerReward === 'flat' || s.R.offerReward === 'matchPlus') gain(s, p, 1, 'offer');
    if (choirHas(s, p, 'scribe')) { const d = draw(s); if (d !== undefined) s.hand[p].push(d); }
    // Raphael / Azazel: when you Offer a card of this card's alignment, turn it face up to destroy a face-up card of the other.
    for (const x of s.choir[p]) if (ab(s, x.c) === 'raphael' && sgn(val(s, c)) === sgn(val(s, x.c))) {
      let best = -1;
      for (let k = 0; k < s.altar.length; k++) { const al = s.altar[k]; if (al.up && al.by !== p && sgn(val(s, al.c)) === -sgn(val(s, c)) && (best < 0 || Math.abs(val(s, al.c)) > Math.abs(val(s, s.altar[best].c)))) best = k; }
      if (best >= 0) { s.altar[s.altar.length - 1].up = true; const [d] = s.altar.splice(best, 1); s.discard.push(d.c); }
      break;
    }
  } else if (a.t === 'exalt') {
    const [c] = s.hand[p].splice(a.i, 1);
    if (s.cards[c].ab === 'oath') s.oathStats[2]++;
    if (a.h) see(s, p, P.exHid);
    else see(s, p, sgn(val(s, c)) > 0 ? P.exL : sgn(val(s, c)) < 0 ? P.exD : -1);
    replaceAt(s, p, a.r);
    enter(s, p, c);
    if (a.h) s.choir[p][s.choir[p].length - 1].hid = true;
    if (choirHas(s, p, 'patron') && val(s, c) !== 0) gain(s, p, 1, 'ab:patron');
    for (const x of s.choir[p]) if (ab(s, x.c) === 'seraph' && x.c !== c && sgn(val(s, c)) !== 0 && sgn(val(s, c)) === sgn(val(s, x.c))) { gain(s, p, 1, 'ab:seraph'); break; }
  } else {
    const [x] = s.altar.splice(a.k, 1);
    if (s.cards[x.c].ab === 'oath') s.oathStats[x.by >= 0 && x.by !== p ? 1 : 3]++;
    if (isTok(s, x.c)) {
      if (s.R.stake?.asCards) s.hand[p].push(x.c); else s.tok[p].push(x.c);
      s.stakeStats[1]++;
      see(s, p, P.tokTook);
    } else if (s.R.fate?.oathHand && s.cards[x.c].ab === 'oath') {
      s.hand[p].push(x.c);
      see(s, p, P.toHand); // the table sees a card go to hand: it was an Oath
      if (x.up) see(s, p, sgn(val(s, x.c)) > 0 ? P.tookL : P.tookD);
      if (x.by >= 0 && x.by !== p) see(s, x.by, P.lostOath);
    } else {
    see(s, p, sgn(val(s, x.c)) > 0 ? P.gathL : sgn(val(s, x.c)) < 0 ? P.gathD : -1);
    { const gv = sgn(val(s, x.c)), l0 = lean(s, p); s.gatherStats[gv === 0 || l0 === 0 ? 2 : gv === l0 ? 0 : 1]++; }
    replaceAt(s, p, a.r);
    enter(s, p, x.c);
    if (x.by >= 0 && x.by !== p && choirHas(s, x.by, 'snare')) gain(s, x.by, 1, 'ab:snare');
    if (choirHas(s, p, 'pilgrim')) gain(s, p, 1, 'ab:pilgrim');
    }
  }
  if (lean(s, p) !== before && s.phase === 'noon') s.switches[p]++;
  afterAction(s, p);
  syncOaths(s);
  s.step++;
  if (s.step >= s.R.n * s.R.turns) s.phase = 'evening';
}

/** Automatic "On your turn" abilities, decided by a simple fixed rule so they cost no decisions in the lab. */
function spend(s: State, p: number, a: string) {
  const j = s.choir[p].findIndex((x) => ab(s, x.c) === a);
  if (j >= 0) { const [x] = s.choir[p].splice(j, 1); s.discard.push(x.c); }
}

function afterAction(s: State, p: number) {
  const my = lean(s, p);
  const est = quickEstimate(s, p);
  // Michael: discard the sole leader's most valuable Choir card, then discard Michael.
  if (choirHas(s, p, 'michael')) {
    const q = soleLeader(s, p);
    if (q >= 0 && s.choir[q].length) {
      let j = 0, bv = -Infinity;
      s.choir[q].forEach((x, k) => { const v = (ab(s, x.c) ? 1 : 0) + Math.abs(val(s, x.c)) * 0.5; if (v > bv) { bv = v; j = k; } });
      const [x] = s.choir[q].splice(j, 1);
      s.discard.push(x.c);
      if (choirHas(s, q, 'martyr')) gain(s, q, 1, 'ab:martyr');
      spend(s, p, 'michael');
    }
  }
  // Envy: while the leader is 3 or more ahead, every leader loses 1.
  if (choirHas(s, p, 'envy')) {
    const top = Math.max(...s.glory);
    if (top - s.glory[p] >= 3) for (let q = 0; q < s.R.n; q++) if (s.glory[q] === top) gain(s, q, -1, 'ab:envy-victim');
  }
  // Anathema: if the Altar is going my way, nobody else may Offer until my next turn.
  if (choirHas(s, p, 'anathema') && my !== 0 && sgn(est) === my) s.anathema = p;
  // Winnowing: discard up to 2 facedown cards Offered by players on the other side.
  if (choirHas(s, p, 'winnowing') && my !== 0) {
    let k = 0;
    for (let i = s.altar.length - 1; i >= 0 && k < 2; i--) { const al = s.altar[i]; if (!al.up && al.by >= 0 && al.by !== p && lean(s, al.by) === -my && !choirHas(s, al.by, 'mirage')) { s.altar.splice(i, 1); s.discard.push(al.c); k++; if (choirHas(s, al.by, 'snare')) gain(s, al.by, 1, 'ab:snare'); } }
  }
  // Abaddon: if the Altar is going against me, replace every card with the top of the deck, then discard Abaddon.
  if (choirHas(s, p, 'abaddon') && my !== 0 && sgn(est) === -my && s.altar.length >= 4) {
    s.altar = s.altar.map((al) => { s.discard.push(al.c); const c = draw(s); return c === undefined ? al : { c, up: true, by: -1, kind: 2 as const, seen: 0 }; });
    spend(s, p, 'abaddon');
  }
  // Ordeal: double this Reaping's gain, when the Altar looks safe late in the turn order.
  if (choirHas(s, p, 'ordeal') && my !== 0 && sgn(est) === my && s.step >= s.R.n * s.R.turns - 2) s.ordeal[p] = true;
  // Vessel: place a hand card of my side facedown as an extra bet (not an Offer).
  if (choirHas(s, p, 'vessel') && my !== 0) {
    const i = s.hand[p].findIndex((c) => sgn(val(s, c)) === my);
    if (i >= 0) { const [c] = s.hand[p].splice(i, 1); s.altar.push({ c, up: false, by: p, kind: 3 as any, seen: 1 << p }); }
  }
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

/** Rank players by strength (descending); returns each listed player's prize. */
export function rankPay(s: State, players: number[], prizes: number[]): Map<number, number> {
  const st = (p: number) => Math.abs(leanSum(s, p));
  const tie = s.R.pax?.tie ?? 'lowGlory';
  const sorted = players.slice().sort((a, b) => st(b) - st(a) || (tie === 'lowGlory' ? s.glory[a] - s.glory[b] : 0));
  const out = new Map<number, number>();
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    const same = (a: number, b: number) => st(a) === st(b) && (tie === 'lower' || s.glory[a] === s.glory[b]);
    while (j + 1 < sorted.length && same(sorted[j + 1], sorted[i])) j++;
    const prize = prizes[j] ?? 0; // tied players all take the lowest prize of the places they share
    for (let k = i; k <= j; k++) out.set(sorted[k], prize);
    i = j + 1;
  }
  return out;
}

export function paxScore(s: State, net: number): number[] {
  const P = s.R.pax!;
  const n = s.R.n;
  const out = Array(n).fill(0);
  const side = sgn(net);
  if (side !== 0 && Math.abs(net) >= P.margin) {
    const team = [...Array(n).keys()].filter((p) => lean(s, p) === side);
    for (const [p, v] of rankPay(s, team, P.dom)) out[p] = v;
    s.paxStats[0]++;
    // free-riding: Offers made today by the top-ranked and second-ranked member of the dominant side
    if (team.length >= 2) {
      const st = (p: number) => Math.abs(leanSum(s, p));
      const t = team.slice().sort((a, b) => st(b) - st(a) || s.glory[a] - s.glory[b]);
      s.paxStats[2] += s.dayOffers[t[0]]; s.paxStats[3] += s.dayOffers[t[1]]; s.paxStats[4]++;
    }
  } else {
    const all = [...Array(n).keys()].filter((p) => lean(s, p) !== 0);
    for (const [p, v] of rankPay(s, all, P.indiv)) out[p] = v;
    s.paxStats[1]++;
  }
  return out;
}

/** Fates: each Choir card matching the Tide earns choirPay; the Day is recorded for the matching Fates (scored at the end). */
/** Public observations of each player, for the reader. */
export const P = { ffL: 0, ffD: 1, offL: 2, offD: 3, oathL: 4, oathD: 5, gathL: 6, gathD: 7, exL: 8, exD: 9, toHand: 10, lostOath: 11, offN: 12, tookL: 13, tookD: 14, drew: 15, exHid: 16, tokOff: 17, tokTook: 18 };
export const PUB = 19;
function see(s: State, p: number, k: number) {
  if (k < 0) return;
  s.pub[p][k]++;
  s.pubDay[p][k]++;
}

// ---------------------------------------------------------------- stakes

export const isTok = (s: State, c: number) => { const a = s.cards[c]?.ab; return a === 'tokL' || a === 'tokD'; };
export function tokCounts(s: State, p: number): number[] {
  const held = s.R.stake?.asCards ? s.hand[p].filter((c) => isTok(s, c)) : s.tok[p];
  let L = 0, D = 0;
  for (const c of held) { if (s.cards[c].v > 0) L++; else D++; }
  return [L, D];
}
const CREED_LABEL: Record<string, number> = { faithful: 1, fallen: -1, follower: 2, balancer: 3, doubleL: 4, doubleD: 5, balancerH: 3, doubleL1: 4, doubleD1: 5 };
export function stakeLabel(s: State, p: number) {
  if (s.R.stake!.kind === 'creed') return CREED_LABEL[s.creed[p]] ?? 0;
  const [L, D] = tokCounts(s, p);
  return sgn(L - D);
}
/** End-of-game score from the public banks and the secret stake. */
export function stakeScore(s: State, p: number): number {
  const S = s.R.stake!;
  const [Lb, Db] = s.banks[p];
  if (S.kind === 'creed') {
    const cv = s.choir[p].map((x) => sgn(val(s, x.c)));
    switch (s.creed[p]) {
      case 'faithful': return Lb;
      case 'fallen': return Db;
      case 'follower': return Math.max(Lb, Db);
      case 'balancer': return 2 * Math.min(Lb, Db);
      case 'doubleL': return Lb + 2 * cv.filter((v) => v < 0).length;
      case 'doubleD': return Db + 2 * cv.filter((v) => v > 0).length;
      case 'balancerH': return 1.5 * Math.min(Lb, Db);
      case 'doubleL1': return Lb + cv.filter((v) => v < 0).length;
      case 'doubleD1': return Db + cv.filter((v) => v > 0).length;
    }
    return 0;
  }
  const [tL, tD] = tokCounts(s, p);
  const norm = S.asCards ? 1 : (S.perPlayer ?? 2) / 2;
  if (S.score === 'days' || S.score === 'world') {
    const lw = s.tides.filter((t) => t > 0).length, dw = s.tides.filter((t) => t < 0).length;
    const tv = S.tokVal ?? 1;
    if (S.score === 'days') {
      if (!S.shares) return tv * (tL * lw + tD * dw);
      let cL = 0, cD = 0;
      for (const x of s.choir[p]) { const v = sgn(x.flip ? -val(s, x.c) : val(s, x.c)); if (v > 0) cL++; else if (v < 0) cD++; }
      const cs = S.choirShare ?? 1; return tv * ((tL + cs * cL) * lw + (tD + cs * cD) * dw);
    }
    return lw > dw ? tv * tL : dw > lw ? tv * tD : (tv * (tL + tD)) / 2;
  }
  if (S.score === 'winner') {
    const lw = s.tides.filter((t) => t > 0).length, dw = s.tides.filter((t) => t < 0).length;
    if (lw > dw) return (Lb * tL) / norm;
    if (dw > lw) return (Db * tD) / norm;
    return (Lb * tL + Db * tD) / (2 * norm);
  }
  if (S.score === 'concentrate') return (Lb * tL * tL + Db * tD * tD) / (norm * norm * 2);
  return (Lb * tL + Db * tD) / norm + (S.score === 'collect' ? (S.collectBonus ?? 1) * (tL + tD) : 0);
}
function dealStakes(s: State, seed: number) {
  const S = s.R.stake!;
  const n = s.R.n;
  let t0 = (seed ^ 0x6b43a9b5) | 0;
  const r = () => { let t = (t0 = (t0 + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const shuf = <T>(a: T[]) => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  if (S.kind === 'creed') {
    const bag = shuf(S.creeds!.slice());
    for (let p = 0; p < n; p++) { s.creed[p] = bag[p]; s.stakeType[p] = bag[p]; }
    return;
  }
  if (S.asCards) {
    // Token cards are in the deck; each player also starts with one, at random.
    const toks = shuf(s.deck.filter((c) => isTok(s, c)));
    for (let p = 0; p < n; p++) {
      const c = toks[p];
      s.deck.splice(s.deck.indexOf(c), 1);
      s.deck.unshift(s.hand[p].pop()!);
      s.hand[p].push(c);
      s.stakeType[p] = s.cards[c].v > 0 ? 'L' : 'D';
    }
    return;
  }
  const per = S.perPlayer ?? 2;
  const nL = S.poolL ?? (per * n) / 2, nD = S.poolD ?? (per * n) / 2;
  const mk = (v: number) => { const id = s.cards.length; s.cards.push({ id, name: v > 0 ? 'tokL' : 'tokD', v, ab: v > 0 ? 'tokL' : 'tokD' }); return id; };
  const L = Array.from({ length: nL }, () => mk(2)), D = Array.from({ length: nD }, () => mk(-2));
  if (S.mix === 'even') {
    for (let p = 0; p < n; p++) s.tok[p] = [...L.splice(0, per / 2), ...D.splice(0, per / 2)];
  } else {
    const pool = shuf([...L, ...D]);
    for (let p = 0; p < n; p++) s.tok[p] = pool.splice(0, per);
  }
  for (let p = 0; p < n; p++) { const [a, b] = tokCounts(s, p); s.stakeType[p] = a > b ? 'L-heavy' : b > a ? 'D-heavy' : 'even'; }
}

/** Oaths: a player's allegiance is the side of the Oath cards they hold (hand and Choir); none, or both equally, is Forsaken (0). */
export function syncOaths(s: State) {
  if (!s.R.fate?.oath) return;
  for (let p = 0; p < s.R.n; p++) {
    let t = 0;
    for (const c of s.hand[p]) if (s.cards[c].ab === 'oath') t += sgn(s.cards[c].v);
    for (const x of s.choir[p]) if (s.cards[x.c].ab === 'oath') t += sgn(s.cards[x.c].v);
    s.fate[p] = sgn(t);
  }
}

export function fateScore(s: State, tide: Dir, net = 0): number[] {
  syncOaths(s);
  const F = s.R.fate!;
  const out = Array(s.R.n).fill(0);
  for (let p = 0; p < s.R.n; p++) {
    s.fateStats[1]++;
    if (lean(s, p) === s.fate[p]) s.fateStats[0]++;
    if (tide === 0) continue;
    if (F.mult && s.fate[p] === 0) {
      // The Forsaken: a narrow Day (the Altar within 1, or tied) scores 1 plus 1 per Neutral card in your Choir (paid at the end).
      if (Math.abs(net) <= 1 && s.altar.length) { let k = 1; for (const x of s.choir[p]) if (val(s, x.c) === 0) k++; s.fateDays[p] += k; }
      continue;
    }
    if (F.mult) {
      // Multiplied: a Day the Tide matches your Fate scores 1 plus 1 per Choir card of your Fate's alignment (paid at the end).
      if (s.fate[p] === tide) { let k = 1; for (const x of s.choir[p]) { const v = x.flip ? -val(s, x.c) : val(s, x.c); if (sgn(v) === tide || (F.anyColour && v !== 0)) k++; } s.fateDays[p] += k; }
      continue;
    }
    for (const x of s.choir[p]) { const v = x.flip ? -val(s, x.c) : val(s, x.c); if (sgn(v) === tide) out[p] += F.choirPay; }
    if (s.fate[p] === tide) s.fateDays[p]++;
  }
  return out;
}

export function cardPayN(s: State, tide: Dir, k: number): number[] {
  const out = Array(s.R.n).fill(0);
  if (tide === 0) return out;
  for (let p = 0; p < s.R.n; p++) for (const x of s.choir[p]) { const v = x.flip ? -val(s, x.c) : val(s, x.c); if (sgn(v) === tide) out[p] += k; }
  return out;
}
export function cardPay(s: State, tide: Dir): number[] {
  const out = Array(s.R.n).fill(0);
  if (tide === 0) return out;
  for (let p = 0; p < s.R.n; p++) for (const x of s.choir[p]) { const v = x.flip ? -val(s, x.c) : val(s, x.c); if (sgn(v) === tide) out[p] += s.R.choirCardPay!; }
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
    const top = Math.max(...s.glory);
    const leaders = s.glory.filter((g) => g === top).length;
    for (let p = 0; p < n; p++) {
      if (leans[p] === tide) out[p] = t.win[w] ?? 0;
      else if (leans[p] === -tide) out[p] = s.R.loseHeavy && Math.abs(leanSum(s, p)) < s.R.loseHeavy ? 0 : t.lose[l] ?? t.lose[t.lose.length - 1];
      else out[p] = -s.R.neutralLoss;
      if (s.R.pairSplit && leans[p] === tide && w === 2) {
        const q = [...Array(n).keys()].find((k) => k !== p && leans[k] === tide)!;
        const a = Math.abs(leanSum(s, p)), b = Math.abs(leanSum(s, q));
        if (a !== b) out[p] = a > b ? s.R.pairSplit[0] : s.R.pairSplit[1];
      }
      if (s.R.crownTax && out[p] > 0 && leaders === 1 && top > 0 && s.glory[p] === top) out[p] = Math.max(0, out[p] - s.R.crownTax);
    }
    return out;
  };
}

export function evening(s: State) {
  const n = s.R.n;
  const net = altarNet(s);
  let tide = sgn(net);
  if (tide === 0 && s.R.tieBreak === 'yesterday' && s.altar.length) tide = s.tides[s.tides.length - 1] ?? 0;
  const facedown = s.altar.filter((a) => !a.up).length;
  // The reveal: unless it is anonymous, everyone learns whose facedown Offer was which.
  if (!s.R.anonReveal) for (const a of s.altar) if (!a.up && a.by >= 0 && (a.kind === 1 || (a.kind as number) === 3)) {
    const v = sgn(val(s, a.c));
    if (s.cards[a.c].ab === 'oath') see(s, a.by, v > 0 ? P.oathL : P.oathD);
    else see(s, a.by, v > 0 ? P.offL : v < 0 ? P.offD : -1);
  }
  for (const a of s.altar) a.up = true;
  const leans = Array.from({ length: n }, (_, p) => lean(s, p));
  const top0 = Math.max(...s.glory);
  const lead0 = s.glory.filter((g) => g === top0).length === 1 && top0 > 0 ? s.glory.indexOf(top0) : -1;
  const f = typeof s.R.score === 'function' ? s.R.score : scoreTable(s.R.score);
  if (s.R.stake && tide !== 0) for (let p = 0; p < n; p++) {
    let k = 1;
    for (const x of s.choir[p]) if (sgn(x.flip ? -val(s, x.c) : val(s, x.c)) === tide) k++;
    s.banks[p][tide > 0 ? 0 : 1] += k;
  }
  const reap = s.R.stake ? (s.R.stake.score === 'days' || s.R.stake.score === 'world' ? cardPayN(s, tide, s.R.stake.reap ?? 1) : Array(n).fill(0)) : s.R.choirCardPay ? cardPay(s, tide) : s.R.fate ? fateScore(s, tide, net) : s.R.pax ? paxScore(s, net) : f(s, tide, Math.abs(net));
  for (let p = 0; p < n; p++) if (s.ordeal[p] && reap[p] > 0) reap[p] *= 2;
  for (let p = 0; p < n; p++) if (choirHas(s, p, 'scapegoat') && s.glory[p] >= 1) {
    const q = soleLeader(s, p);
    if (q >= 0 && reap[q] >= 2) { gain(s, p, -1, 'ab:scapegoat-cost'); reap[q] = 0; }
  }
  const before = s.glory.slice();
  for (let p = 0; p < n; p++) gain(s, p, reap[p], 'reaping');
  // Offer bets
  if (s.R.offerReward === 'match' || s.R.offerReward === 'matchPlus') {
    for (const a of s.altar) if (a.by >= 0 && (a.kind === 1 || (a.kind === 0 && s.R.fruitsBet)) && tide !== 0 && sgn(val(s, a.c)) === tide) gain(s, a.by, 1, a.kind === 1 ? 'bet' : 'fruitbet');
    for (const a of s.altar) if ((a.kind as number) === 3 && tide !== 0 && val(s, a.c) !== 0) gain(s, a.by, sgn(val(s, a.c)) === tide ? 1 : -1, 'ab:vessel');
    if (s.R.betLoss) for (const a of s.altar) if (a.by >= 0 && a.kind === 1 && tide !== 0 && sgn(val(s, a.c)) === -tide) gain(s, a.by, -s.R.betLoss, 'betloss');
  }
  if (s.R.offerReward === 'pari' && tide !== 0) {
    const win = s.altar.filter((a) => a.by >= 0 && a.kind === 1 && sgn(val(s, a.c)) === tide);
    const lose = s.altar.filter((a) => a.by >= 0 && a.kind === 1 && sgn(val(s, a.c)) === -tide).length;
    const share = win.length ? Math.floor(((s.R.pariBase ?? 2) + lose) / win.length) : 0;
    for (const a of win) gain(s, a.by, share, 'bet');
  }
  for (let p = 0; p < n; p++) if (s.calls[p] && tide !== 0 && s.calls[p] === tide) gain(s, p, 1, choirHas(s, p, 'prophecy') ? 'ab:prophecy' : 'ab:prophet');
  for (let p = 0; p < n; p++) if (s.calls[p] && choirHas(s, p, 'prophecy') && s.calls[p] !== tide) gain(s, p, -1, 'ab:prophecy');
  endOfDayAbilities(s, tide, leans, reap, Math.abs(net));
  for (let p = 0; p < n; p++) { const j = s.choir[p].findIndex((x) => x.store === -99); if (j >= 0) { const [x] = s.choir[p].splice(j, 1); s.discard.push(x.c); } }
  s.prevLean = leans.slice();
  s.prevWith = leans.map((l) => tide !== 0 && l === tide);
  const lastFlip = s.preLastNet !== null && sgn(s.preLastNet) !== tide;
  let light = 0, dark = 0;
  for (const a of s.altar) { const v = altarWeight(s, a); if (v > 0) light += v; else dark -= v; }
  const top1 = Math.max(...s.glory);
  const lead1 = s.glory.filter((g) => g === top1).length === 1 ? s.glory.indexOf(top1) : -1;
  s.logs.push({ day: s.day, tide, margin: Math.abs(net), leans, reap: s.glory.map((g, p) => g - before[p]), lastFlip, light, dark, reapOnly: reap, crown: lead0, altarSize: s.altar.length, facedown, leader: lead1 });
  // The reader's row for each player: what the table has seen of them, and their true allegiance tonight.
  if (s.R.fate || s.R.stake) for (let p = 0; p < n; p++) {
    const cv = s.choir[p].filter((x) => !x.hid).map((x) => sgn(x.flip ? -val(s, x.c) : val(s, x.c)));
    const label = s.R.stake ? stakeLabel(s, p) : s.fate[p];
    const tokCount = s.R.stake ? (s.R.stake.asCards ? s.hand[p].filter((c) => isTok(s, c)).length : s.tok[p].length) : 0;
    s.readerRows.push([s.day, p, cv.filter((v) => v > 0).length, cv.filter((v) => v < 0).length, ...s.pub[p], ...s.pubDay[p], s.banks[p][0], s.banks[p][1], tokCount, label]);
  }
  s.pubDay = s.pubDay.map(() => Array(PUB).fill(0));
  s.tides.push(tide);
  s.gloryByDay.push(s.glory.slice());
  for (const a of s.altar) {
    if (isTok(s, a.c)) { s.stakeStats[2]++; if (s.R.stake?.asCards) s.discard.push(a.c); else if (s.R.stake?.onAltar === 'fewest') s.oathPool.push(a.c); continue; }
    if (s.R.fate?.oath && s.cards[a.c].ab === 'oath') {
      if (s.R.fate.oathReturn === 'shuffle' || a.by < 0) s.oathPool.push(a.c); // set aside facedown with the others
      else s.hand[a.by].push(a.c);
    } else s.discard.push(a.c);
  }
  if (s.R.stake?.onAltar === 'fewest' && s.oathPool.length) {
    // Tokens left on the Altar are set aside facedown; the players with the fewest tokens draw them, one each, in turn.
    shuffle(s, s.oathPool);
    while (s.oathPool.length) {
      const lo = Math.min(...s.tok.map((t) => t.length));
      const who = [...Array(n).keys()].filter((p) => s.tok[p].length === lo);
      for (const p of who) { if (!s.oathPool.length) break; s.tok[p].push(s.oathPool.pop()!); see(s, p, P.drew); }
    }
  }
  if (s.R.fate?.oath && s.R.fate.oathReturn === 'shuffle') {
    // Anyone left without an Oath draws one at random from the set-aside Oaths: a new allegiance nobody else can see.
    shuffle(s, s.oathPool);
    for (let p = 0; p < n; p++) if (!s.hand[p].some((c) => s.cards[c].ab === 'oath') && s.oathPool.length) { s.hand[p].push(s.oathPool.pop()!); see(s, p, P.drew); }
    syncOaths(s);
  }
  s.altar = [];
  if ((s.R.fate || s.R.stake) && s.day >= s.R.maxDays) s.preReveal = s.glory.slice();
  if (s.R.fate && s.day >= s.R.maxDays) for (let p = 0; p < n; p++) gain(s, p, s.R.fate.perDay * s.fateDays[p], 'fate');
  if (s.R.stake && s.day >= s.R.maxDays) for (let p = 0; p < n; p++) gain(s, p, stakeScore(s, p), 'stake');
  if (s.glory.some((g) => g >= s.R.target) || s.day >= s.R.maxDays) {
    if (s.R.miserTax) {
      const lo = Math.min(...s.offersBy);
      if (s.offersBy.some((x) => x !== lo)) for (let p = 0; p < n; p++) if (s.offersBy[p] === lo) gain(s, p, -s.R.miserTax, 'miser');
    }
    let eligible = [...Array(n).keys()];
    if (s.R.miser) {
      const lo = Math.min(...s.offersBy);
      if (s.offersBy.some((x) => x !== lo)) eligible = eligible.filter((p) => s.offersBy[p] !== lo);
    }
    const top = Math.max(...eligible.map((p) => s.glory[p]));
    s.winners = eligible.filter((p) => s.glory[p] === top);
    s.phase = 'over';
    return;
  }
  for (let p = 0; p < n; p++) {
    while (s.hand[p].length < s.R.hand) { const c = draw(s); if (c === undefined) break; s.hand[p].push(c); }
  }
  s.first = (s.first + 1) % n;
  startDay(s);
}

function endOfDayAbilities(s: State, tide: Dir, leans: Dir[], reap: number[], margin = 0) {
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
        case 'treeOfLife': if (tide !== 0 && leans[p] === tide && s.prevWith[p]) gain(s, p, 1, 'ab:treeOfLife'); break;
        case 'firmament': if (tide !== 0 && leans[p] === tide && margin === 1) gain(s, p, 1, 'ab:firmament'); break;
        case 'leviathan': if (tide !== 0 && leans[p] === tide && margin >= 3) gain(s, p, 1, 'ab:leviathan'); break;
        case 'defiance': if (tide !== 0 && leans[p] === tide && leans.filter((l) => l === -tide).length > withTide) gain(s, p, 1, 'ab:defiance'); break;
        case 'uriel': { // when you gain at the Reaping, +2 if 3 or more other cards share this card's alignment
          if (reap[p] <= 0) break;
          const k = s.choir[p].filter((y) => y !== x && sgn(val(s, y.c)) === sgn(v)).length;
          if (k >= 3) gain(s, p, 2, 'ab:uriel');
          break;
        }
        case 'remnant2': if (reap[p] > 0 && s.R.choirMax - s.choir[p].length >= 2) gain(s, p, 1, 'ab:remnant2'); break;
        case 'outcastOld': if (s.glory[p] === Math.min(...s.glory)) gain(s, p, 1, 'ab:outcastOld'); break;
        case 'council': { const q = s.council[p]; if (q >= 0 && leans[p] !== 0 && leans[q] === leans[p]) { gain(s, p, 1, 'ab:council'); gain(s, q, 1, 'ab:council-partner'); } break; }
        case 'stillness2': if (tide !== 0 && s.tides.length && s.tides[s.tides.length - 1] === tide) gain(s, p, 1, 'ab:stillness2'); break;
        case 'apple': if (leans[p] !== 0 && s.prevLean[p] === -leans[p]) gain(s, p, 2, 'ab:apple'); break;
        case 'favor2': if (reap.filter((r, q) => q !== p && r <= 0).length >= 2) gain(s, p, 1, 'ab:favor2'); break;
        case 'hubris': {
          const top = Math.max(...s.glory);
          const q = s.glory.filter((g) => g === top).length === 1 ? s.glory.indexOf(top) : -1;
          if (q >= 0 && q !== p && s.glory[q] - s.dayStart[q] >= 4) { gain(s, q, -1, 'ab:hubris-victim'); gain(s, p, 1, 'ab:hubris'); }
          break;
        }
        case 'moderation2': if (leans[p] === 0 && tide !== 0) { for (const al of s.altar) if (al.by === p && al.kind === 1 && sgn(val(s, al.c)) === tide) gain(s, p, 1, 'ab:moderation2'); } break;
        case 'mercy2': if (reap[p] <= 0) { gain(s, p, 1, 'ab:mercy2'); x.store = -99; } break;
        case 'bounty2': { const q = s.bounty[p]; if (q >= 0) gain(s, p, reap[q] > 0 ? -1 : 1, 'ab:bounty2'); break; }
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
