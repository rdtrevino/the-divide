// The learned computer player (design/bots.md, layer 2). A small neural network, trained on the strong Monte Carlo
// bot's own estimates (mc.ts, searchScores), scores every option of a decision; the bot plays the best. It sees only
// what its seat may see: every input is read from viewFor(state, seat), the same view the site sends to a player.
// It answers the decisions the strong bot searches; everything else goes to the heuristic, as in mc.ts.
// Training: game/tools/distill (README there). The weights live in learned.weights.json.
import { botAnswer } from './bots';
import { CHOIR_LIMIT, baseValue } from './core';
import { CELESTIALS, EVENTS, HOSTS } from './data';
import { TOKEN_WEIGHT, daysWon } from './engine';
import { isSearched } from './mc';
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
export const DECISION_FEATURES = 30 + TAGS.length + HOSTS.length + EVENTS.length + 1 + CELESTIALS.length + 1;
export const OPTION_FEATURES = KINDS.length + 10 + HOSTS.length + 1;

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
function decisionFeatures(v: GameView, d: Decision): number[] {
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
  ];
  oneHot(f, TAGS.length, TAGS.indexOf(d.tag));
  const choir = new Set(me.choir.map((c) => c.id && HOST_IDX.get(c.id)));
  for (let k = 0; k < HOSTS.length; k++) f.push(choir.has(k) ? 1 : 0);
  oneHot(f, EVENTS.length + 1, v.event ? EVENT_IDX.get(v.event) ?? EVENTS.length : EVENTS.length);
  oneHot(f, CELESTIALS.length + 1, CEL_IDX.get(me.celestial) ?? CELESTIALS.length);
  return f;
}

/** What an option is: its kind, the card or token it moves, and what that does to the Altar. */
function optionFeatures(v: GameView, d: Decision, o: Option, heuristicPick: string): number[] {
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
  const myL = me.tokens!.filter((t) => t === 'light').length, myD = me.tokens!.length - myL;
  const alt = altarRead(v), after = alt.known + alt.guess + push;
  const f: number[] = [];
  oneHot(f, KINDS.length, KINDS.indexOf(kind));
  f.push(value / 2, Math.abs(value) / 2, push / 2, Math.tanh(after / 2), sgn(value) * sgn(myL - myD), sgn(value) * sgn(me.colors.light - me.colors.dark), tokenSide, mine, o.id === heuristicPick ? 1 : 0, card ? 1 : 0);
  oneHot(f, HOSTS.length + 1, card ? HOST_IDX.get(card) ?? HOSTS.length : HOSTS.length);
  return f;
}

/** The inputs for one decision: shared decision features, and one row per option. */
export function encode(s: GameState, d: Decision, heuristicPick = botAnswer(s, d)[0]) {
  const v = viewFor(s, d.seat);
  return { decision: decisionFeatures(v, d), options: d.options.map((o) => optionFeatures(v, d, o, heuristicPick)) };
}

interface Layer { W: number[][]; b: number[] }
interface Weights { mean: number[]; scale: number[]; layers: Layer[] }
const NET = WEIGHTS as unknown as Partial<Weights>;
export const hasLearnedWeights = () => !!NET.layers?.length;

/** The network, prepared for speed: flat rows, the input scaling folded into the first layer. */
interface Ready { first: Float64Array[]; firstBias: Float64Array; rest: { W: Float64Array[]; b: Float64Array }[] }
const prepared = new WeakMap<object, Ready>();
function prepare(net: Weights): Ready {
  let r = prepared.get(net);
  if (r) return r;
  // (x - mean) * scale, then W: fold the scale into W and the mean into the bias.
  const L0 = net.layers[0];
  const first = L0.W.map((row) => Float64Array.from(row, (w, i) => w * net.scale[i]));
  const firstBias = Float64Array.from(L0.b, (b, k) => b - first[k].reduce((t, w, i) => t + w * net.mean[i], 0));
  r = { first, firstBias, rest: net.layers.slice(1).map((L) => ({ W: L.W.map((row) => Float64Array.from(row)), b: Float64Array.from(L.b) })) };
  prepared.set(net, r);
  return r;
}

/** The network's score for each option (higher is better). The decision's part of the first layer is computed once. */
export function learnedScores(s: GameState, d: Decision, heuristicPick = botAnswer(s, d)[0], net: Partial<Weights> = NET): number[] {
  const { decision, options } = encode(s, d, heuristicPick);
  const { first, firstBias, rest } = prepare(net as Weights);
  const nd = decision.length, H = first.length;
  const shared = new Float64Array(H);
  for (let k = 0; k < H; k++) { const w = first[k]; let t = firstBias[k]; for (let i = 0; i < nd; i++) t += w[i] * decision[i]; shared[k] = t; }
  return options.map((o) => {
    let x = new Float64Array(H);
    for (let k = 0; k < H; k++) { const w = first[k]; let t = shared[k]; for (let i = 0; i < o.length; i++) if (o[i] !== 0) t += w[nd + i] * o[i]; x[k] = t > 0 ? t : 0; }
    rest.forEach((L, j) => {
      const y = new Float64Array(L.b.length);
      for (let r = 0; r < y.length; r++) { const w = L.W[r]; let t = L.b[r]; for (let i = 0; i < x.length; i++) t += w[i] * x[i]; y[r] = j < rest.length - 1 && t < 0 ? 0 : t; }
      x = y;
    });
    return x[0];
  });
}

/** The learned bot's answer: the best-scored option on searched decisions, the heuristic's elsewhere. */
export function learnedAnswer(s: GameState, d: Decision, net: Partial<Weights> = NET): Answer {
  const quick = botAnswer(s, d);
  if (!isSearched(d) || !net.layers?.length) return quick;
  const sc = learnedScores(s, d, quick[0], net);
  let b = 0;
  for (let i = 1; i < sc.length; i++) if (sc[i] > sc[b]) b = i;
  return [d.options[b].id];
}
