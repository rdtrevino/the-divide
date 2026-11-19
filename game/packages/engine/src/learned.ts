// The learned computer player (design/bots.md, layer 2). A small neural network, trained on the strong Monte Carlo
// bot's own estimates (mc.ts, searchScores), scores every option of a decision; the bot plays the best. It sees only
// what its seat may see: every input is read from viewFor(state, seat), the same view the site sends to a player.
// It answers the decisions the strong bot searches; everything else goes to the heuristic, as in mc.ts.
// Training: game/tools/distill (README there). The weights live in learned.weights.json.
import { botAnswer } from './bots';
import { CHOIR_LIMIT, baseValue } from './core';
import { CELESTIALS, EVENTS, HOSTS } from './data';
import { TOKEN_WEIGHT, daysWon } from './engine';
import { type Strength, isSearched } from './mc';
import type { Answer, Decision, GameState, Option } from './types';
import { type GameView, viewFor } from './view';
import WEIGHTS from './learned.weights.json';

const HOST_IDX = new Map(HOSTS.map((h, i) => [h.id, i]));
const EVENT_IDX = new Map(EVENTS.map((e, i) => [e.id, i]));
const CEL_IDX = new Map(CELESTIALS.map((c, i) => [c.id, i]));
const TAGS = ['action', 'offer.card', 'gather.source', 'exalt.card', 'firstFruits', 'judgment'];
const KINDS = ['offerCard', 'offerToken', 'gatherCard', 'gatherHidden', 'gatherToken', 'gatherDiscard', 'exaltCard', 'fruitsCard', 'actOffer', 'actGather', 'actExalt', 'pass'] as const;
type Kind = (typeof KINDS)[number];

/** Sizes of the two parts of the input: the decision (shared by its options) and each option. */
export const DECISION_FEATURES = 34 + TAGS.length + HOSTS.length + EVENTS.length + 1 + CELESTIALS.length + 1;
export const OPTION_FEATURES = KINDS.length + 15 + HOSTS.length + 1;

const sgn = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
const signedValue = (v: GameView, id: string | null | undefined) => { if (!id) return 0; const b = baseValue({ day: v.day, tides: v.tides }, id); return b.light - b.dark; };
const lean = (v: GameView, seat: number) => v.players[seat].colors.light - v.players[seat].colors.dark;
const oneHot = (out: number[], size: number, i: number | undefined) => { for (let k = 0; k < size; k++) out.push(k === i ? 1 : 0); };

/** The table as this seat can read it: known Altar weight, and a guess for facedown cards and tokens from their owners' Choirs. */
function altarRead(v: GameView) {
  let known = 0, guess = 0, hidden = 0;
  for (const a of v.altar) {
    if (a.id) known += signedValue(v, a.id);
    else { hidden++; if (a.offeredBy !== null && a.offeredBy >= 0) guess += 0.6 * sgn(lean(v, a.offeredBy)); }
  }
  let tokens = 0;
  for (const t of v.altarTokens) {
    if (t.side) known += t.side === 'light' ? TOKEN_WEIGHT : -TOKEN_WEIGHT;
    else { tokens++; guess += 0.8 * sgn(lean(v, t.by)); }
  }
  return { known, guess, hidden, tokens };
}

/** What the decision looks like to its seat. */
function decisionFeatures(v: GameView, d: Decision, t: Table): number[] {
  const me = v.players[v.you!], n = v.players.length, others = v.players.filter((p) => p.seat !== me.seat);
  const won = daysWon(v), pos = (me.seat - v.firstPlayer + n) % n;
  const myL = me.tokens!.filter((t) => t === 'light').length, myD = me.tokens!.length - myL;
  const hand = me.hand ?? [], hv = hand.map((c) => signedValue(v, c));
  const leans = others.map((p) => lean(v, p.seat));
  const glory = others.map((p) => p.glory), alt = altarRead(v);
  const f = [
    v.day / v.days, (v.days - v.day + 1) / v.days, v.day === v.days ? 1 : 0, n === 4 ? 1 : 0,
    won.light / 7, won.dark / 7, (won.light - won.dark) / 7,
    pos / (n - 1), (n - 1 - pos) / (n - 1),
    myL / 6, myD / 6, (myL - myD) / 6, me.tokens!.length / 6, others.reduce((t, p) => t + p.tokenCount, 0) / (6 * (n - 1)),
    (me.glory - Math.max(...glory)) / 20, (me.glory - glory.reduce((a, b) => a + b, 0) / glory.length) / 20, me.glory / 40,
    me.colors.light / 4, me.colors.dark / 4, me.choir.length / CHOIR_LIMIT, me.choir.length >= CHOIR_LIMIT ? 1 : 0,
    Math.max(...leans) / 4, Math.min(...leans) / 4, leans.reduce((a, b) => a + b, 0) / 8,
    me.offeredToday ? 1 : 0, others.filter((p) => p.offeredToday).length / (n - 1),
    alt.known / 5, alt.guess / 5, alt.hidden / 4, hv.reduce((a, b) => a + b, 0) / 4,
    pLight(t, t.est), (2 * t.cL * t.h + t.tL - 2 * t.cD * t.h - t.tD) / 10, t.worthL / 7, t.worthD / 7,
  ];
  oneHot(f, TAGS.length, TAGS.indexOf(d.tag));
  const choir = new Set(me.choir.map((c) => c.id && HOST_IDX.get(c.id)));
  for (let k = 0; k < HOSTS.length; k++) f.push(choir.has(k) ? 1 : 0);
  oneHot(f, EVENTS.length + 1, v.event ? EVENT_IDX.get(v.event) ?? EVENTS.length : EVENTS.length);
  oneHot(f, CELESTIALS.length + 1, CEL_IDX.get(me.celestial) ?? CELESTIALS.length);
  return f;
}

/** An option, reduced to what it moves. */
interface Move { kind: Kind; card?: string; value: number; push: number; tokenSide: number; mine: number }

function describe(v: GameView, d: Decision, o: Option): Move {
  const me = v.players[v.you!];
  let id = o.id, tag = d.tag;
  if (tag === 'judgment') {
    if (id === 'pass') tag = 'pass';
    else { const a = id.slice(0, id.indexOf('|')); tag = a === 'offer' ? 'offer.card' : a === 'exalt' ? 'exalt.card' : 'gather.source'; id = id.slice(a.length + 1); }
  }
  let kind: Kind = 'pass', card: string | undefined, value = 0, push = 0, tokenSide = 0, mine = 0;
  if (tag === 'action') kind = id === 'offer' ? 'actOffer' : id === 'gather' ? 'actGather' : 'actExalt';
  else if (tag === 'offer.card' || tag === 'firstFruits') {
    if (id.startsWith('token:')) { kind = 'offerToken'; tokenSide = id.slice(6) === 'light' ? 1 : -1; value = tokenSide * TOKEN_WEIGHT; }
    else { kind = tag === 'firstFruits' ? 'fruitsCard' : 'offerCard'; card = o.card; value = signedValue(v, card); }
    push = value;
  } else if (tag === 'exalt.card') { kind = 'exaltCard'; card = o.card; value = signedValue(v, card); }
  else if (tag === 'gather.source') {
    if (id.startsWith('token:')) {
      const t = v.altarTokens[Number(id.slice(6))];
      kind = 'gatherToken'; mine = t.by === me.seat ? 1 : 0;
      tokenSide = t.side ? (t.side === 'light' ? 1 : -1) : 0;
      value = t.side ? tokenSide * TOKEN_WEIGHT : 0.8 * sgn(lean(v, t.by));
    } else if (id.startsWith('discard:')) { kind = 'gatherDiscard'; card = o.card; value = signedValue(v, card); }
    else {
      const a = id.startsWith('card:') ? v.altar.find((x) => x.id === id.slice(5)) : v.altar[Number(id.slice(6))];
      card = o.card ?? (a?.id ?? undefined);
      if (card) { kind = 'gatherCard'; value = signedValue(v, card); }
      else { kind = 'gatherHidden'; value = a && a.offeredBy !== null && a.offeredBy >= 0 ? 0.6 * sgn(lean(v, a.offeredBy)) : 0; }
      if (a?.offeredBy === me.seat) mine = 1;
    }
    push = -value;
  }
  return { kind, card, value, push, tokenSide, mine };
}

/**
 * Rough worth of a move, the arithmetic a careful player (and the heuristic bot) does: the chance each side wins today
 * from the Altar as read, what today's win is worth to me (Choir cards if I have Offered, plus my tokens), and what
 * lasts (a Choir card scores on about half the Days left; a token is worth the Days its side has won and half of those
 * to come).
 */
function table(v: GameView) {
  const me = v.players[v.you!], n = v.players.length;
  const later = n - 1 - ((me.seat - v.firstPlayer + n) % n);
  const w = later === 0 ? 1 : later === 1 ? 0.75 : 0.55;
  const alt = altarRead(v), won = daysWon(v), after = v.days - v.day;
  const tL = me.tokens!.filter((t) => t === 'light').length, tD = me.tokens!.length - tL;
  return { w, est: alt.known + alt.guess, tL, tD, cL: me.colors.light, cD: me.colors.dark, h: me.offeredToday ? 1 : 0, worthL: won.light + 0.5 * after, worthD: won.dark + 0.5 * after, after };
}
type Table = ReturnType<typeof table>;
const pLight = (t: Table, est: number) => 1 / (1 + Math.exp(-1.2 * est * t.w));
const today = (t: Table, est: number, cL: number, cD: number, tL: number, tD: number, h: number) => { const p = pLight(t, est); return p * (2 * cL * h + tL) + (1 - p) * (2 * cD * h + tD); };

function worth(t: Table, m: Move): { day: number; lasting: number; p: number } {
  const base = today(t, t.est, t.cL, t.cD, t.tL, t.tD, t.h);
  const colored = (x: number) => (x > 0 ? [1, 0] : x < 0 ? [0, 1] : [0, 0]);
  const cardLasting = (x: number) => (x !== 0 ? 2 * 0.5 * t.after : 0);
  let est = t.est, cL = t.cL, cD = t.cD, tL = t.tL, tD = t.tD, h = t.h, lasting = 0;
  switch (m.kind) {
    case 'offerCard': est += m.value; h = 1; lasting = -0.15 * cardLasting(m.value); break;
    case 'fruitsCard': est += m.value; lasting = -0.15 * cardLasting(m.value); break;
    case 'offerToken': est += m.value; h = 1; if (m.tokenSide > 0) { tL--; lasting = -t.worthL; } else { tD--; lasting = -t.worthD; } break;
    case 'exaltCard': case 'gatherDiscard': case 'gatherCard': case 'gatherHidden': {
      if (m.kind === 'gatherCard' || m.kind === 'gatherHidden') est -= m.value;
      const [l, d] = m.kind === 'gatherHidden' ? [0, 0] : colored(m.value);
      cL += l; cD += d; lasting = m.kind === 'gatherHidden' ? 2 * 0.4 * t.after : cardLasting(m.value);
      break;
    }
    case 'gatherToken': est -= m.value; if (m.tokenSide > 0) { tL++; lasting = t.worthL; } else if (m.tokenSide < 0) { tD++; lasting = t.worthD; } else lasting = 0.5 * (t.worthL + t.worthD); break;
    default: break;
  }
  return { day: today(t, est, cL, cD, tL, tD, h) - base, lasting, p: pLight(t, est) };
}

/** The moves an action could lead to, as this seat sees them (for valuing a bare Offer, Gather or Exalt). */
function movesOf(v: GameView, d: Decision, action: Kind): Move[] {
  const me = v.players[v.you!], hand = me.hand ?? [];
  const sub = (tag: string, o: Option) => describe(v, { ...d, tag }, o);
  if (action === 'actOffer') return [...hand.map((c) => sub('offer.card', { id: c, label: '', card: c })), ...(['light', 'dark'] as const).filter((k) => me.tokens!.includes(k)).map((k) => sub('offer.card', { id: 'token:' + k, label: '' }))];
  if (action === 'actExalt') return hand.map((c) => sub('exalt.card', { id: c, label: '', card: c }));
  return [...v.altar.map((a, i) => sub('gather.source', { id: 'altar:' + i, label: '', card: a.id ?? undefined })), ...v.altarTokens.map((_, i) => sub('gather.source', { id: 'token:' + i, label: '' }))];
}

/** What an option is: its kind, the card or token it moves, what that does to the Altar, and what it is roughly worth. */
function optionFeatures(v: GameView, d: Decision, o: Option, heuristicPick: string, t: Table): number[] {
  const me = v.players[v.you!];
  const m = describe(v, d, o);
  const { kind, card, value, push, tokenSide, mine } = m;
  let est = worth(t, m);
  if (kind === 'actOffer' || kind === 'actGather' || kind === 'actExalt') {
    const all = movesOf(v, d, kind).map((x) => worth(t, x));
    est = all.length ? all.reduce((b, x) => (x.day + x.lasting > b.day + b.lasting ? x : b)) : { day: 0, lasting: 0, p: pLight(t, t.est) };
  }
  const myL = t.tL, myD = t.tD;
  const alt = altarRead(v), after = alt.known + alt.guess + push;
  const f: number[] = [];
  oneHot(f, KINDS.length, KINDS.indexOf(kind));
  f.push(value / 2, Math.abs(value) / 2, push / 2, Math.tanh(after / 2), sgn(value) * sgn(myL - myD), sgn(value) * sgn(me.colors.light - me.colors.dark), tokenSide, mine, o.id === heuristicPick ? 1 : 0, card ? 1 : 0);
  f.push(est.day / 5, est.lasting / 5, (est.day + est.lasting) / 5, est.p, (kind === 'offerCard' || kind === 'offerToken' || kind === 'actOffer') && !me.offeredToday ? 1 : 0);
  oneHot(f, HOSTS.length + 1, card ? HOST_IDX.get(card) ?? HOSTS.length : HOSTS.length);
  return f;
}

/** The inputs for one decision: shared decision features, and one row per option. */
export function encode(s: GameState, d: Decision, heuristicPick = botAnswer(s, d)[0]) {
  const v = viewFor(s, d.seat), t = table(v);
  return { decision: decisionFeatures(v, d, t), options: d.options.map((o) => optionFeatures(v, d, o, heuristicPick, t)) };
}

/**
 * Weights as tools/distill/pack.py writes them: each layer's matrix (rows x cols, row-major) and bias as base64
 * float32, with the input scaling already folded into the first layer.
 */
interface Packed { format: 2; layers: { rows: number; cols: number; w: string; b: string }[] }
export type Weights = Partial<Packed>;
const NET = WEIGHTS as unknown as Weights;

/** Weights fit this encoder only if their input size matches (they must be retrained when the inputs change). */
const fits = (net: Weights) => net.format === 2 && !!net.layers?.length && net.layers[0].cols === DECISION_FEATURES + OPTION_FEATURES;
export const hasLearnedWeights = () => fits(NET);

// Available in browsers, Workers and Node 16+; the ES2022 lib does not declare it.
declare function atob(data: string): string;

function floats(b64: string): Float32Array {
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}
interface Ready { layers: { rows: number; cols: number; w: Float32Array; b: Float32Array }[] }
const prepared = new WeakMap<object, Ready>();
const prepare = (net: Packed): Ready => {
  let r = prepared.get(net);
  if (!r) { r = { layers: net.layers.map((L) => ({ rows: L.rows, cols: L.cols, w: floats(L.w), b: floats(L.b) })) }; prepared.set(net, r); }
  return r;
};

/** The network's score for each option row (decision features shared; the first layer's share is computed once). */
function forward(ready: Ready, decision: number[], options: number[][]): number[] {
  const [L0, ...rest] = ready.layers;
  const nd = decision.length, H = L0.rows, C = L0.cols;
  const shared = new Float64Array(H);
  for (let k = 0, row = 0; k < H; k++, row += C) { let t = L0.b[k]; for (let i = 0; i < nd; i++) t += L0.w[row + i] * decision[i]; shared[k] = t; }
  return options.map((o) => {
    // Option features are mostly zeros (one-hot kinds and cards): only the nonzero ones are multiplied.
    const nz: number[] = [];
    for (let i = 0; i < o.length; i++) if (o[i] !== 0) nz.push(i);
    let x = new Float64Array(H);
    for (let k = 0, row = nd; k < H; k++, row += C) { let t = shared[k]; for (const i of nz) t += L0.w[row + i] * o[i]; x[k] = t > 0 ? t : 0; }
    for (let j = 0; j < rest.length; j++) {
      const L = rest[j], y = new Float64Array(L.rows), last = j === rest.length - 1;
      for (let r = 0, row = 0; r < L.rows; r++, row += L.cols) { let t = L.b[r]; for (let i = 0; i < L.cols; i++) t += L.w[row + i] * x[i]; y[r] = !last && t < 0 ? 0 : t; }
      x = y;
    }
    return x[0];
  });
}

/** The network's score for each option of a decision (higher is better). */
export function learnedScores(s: GameState, d: Decision, heuristicPick = botAnswer(s, d)[0], net: Weights = NET): number[] {
  const { decision, options } = encode(s, d, heuristicPick);
  return forward(prepare(net as Packed), decision, options);
}

/**
 * Decode the weights and run the network a few times, so the first real decision is already fast (the JavaScript
 * engine optimizes code once it has run). The server calls this at startup, which Workers do not count against a
 * request's CPU time. Not run on import, so pages that never use the learned bot do not carry its weights.
 */
export function warmLearnedBot(times = 30, net: Weights = NET): void {
  if (!fits(net)) return;
  const ready = prepare(net as Packed), dec = new Array<number>(DECISION_FEATURES).fill(0.5), opt = new Array<number>(OPTION_FEATURES).fill(0);
  opt[0] = 1; opt[KINDS.length] = 0.5;
  for (let k = 0; k < times; k++) forward(ready, dec, [opt, opt, opt, opt]);
}

/** A decision's options, best first by the network (for a search that tries only the most promising few). */
export function learnedRanking(s: GameState, d: Decision, net: Weights = NET): string[] {
  if (!fits(net)) return d.options.map((o) => o.id);
  const sc = learnedScores(s, d, botAnswer(s, d)[0], net);
  return d.options.map((o, i) => ({ id: o.id, v: sc[i] })).sort((a, b) => b.v - a.v).map((x) => x.id);
}

/** The learned bot's answer: the best-scored option on searched decisions, the heuristic's elsewhere. */
export function learnedAnswer(s: GameState, d: Decision, net: Weights = NET): Answer {
  const quick = botAnswer(s, d);
  if (!isSearched(d) || !fits(net)) return quick;
  const sc = learnedScores(s, d, quick[0], net);
  let b = 0;
  for (let i = 1; i < sc.length; i++) if (sc[i] > sc[b]) b = i;
  return [d.options[b].id];
}

/**
 * The hybrid strong bot (design/bots.md): the strong bot's search, but only over the network's top 2 options, each
 * played out 4 times by the learned bot. It beats the plain strong bot head-to-head (1.12 to 0.88) at about the same
 * cost; use it in simulations that want strong play. Like the learned bot, it has the current rules built in.
 */
export const HYBRID: Strength = { rollouts: 4, maxOptions: 2, policy: (s, d) => learnedAnswer(s, d), rank: (s, d) => learnedRanking(s, d) };
