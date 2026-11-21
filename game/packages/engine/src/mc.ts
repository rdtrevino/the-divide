// Strong computer players: determinized Monte Carlo, like the design lab's bots (game/tools/lab).
// For each real choice the bot tries every option: it copies the game at this moment (Game.fork), reshuffles everything it
// cannot see, plays the rest of the Day forward with the fast heuristic bots, and keeps the option that leaves it
// best placed against the strongest rival. Reads come from how it reshuffles: a player's secret tokens are dealt
// leaning toward their Choir's colors, as a careful person would guess. Bluffs come from the search itself: it learns
// what the other players read into Choirs and facedown Offers, and plays against that.
import { botAnswer, choirCardValue, eligibleChance, tokensValue } from './bots';
import { activeCards, choirColors } from './core';
import { Game } from './game';
import { rulesOf } from './rules';
import type { Answer, Decision, GameState, Seat, Side } from './types';

/** Decisions worth searching; everything else is answered by the heuristic. */
const SEARCHED = new Set(['action', 'offer.card', 'gather.source', 'exalt.card', 'firstFruits', 'judgment', 'gather.to', 'offer.oldest']);

/**
 * `policy` plays everyone's choices inside the playouts (default: the heuristic bot). `rank` orders the options to
 * try, best first (default: the heuristic's choice, then the options in order); the first `maxOptions` are searched.
 */
export interface Strength {
  rollouts: number; maxOptions: number; policy?: (s: GameState, d: Decision) => Answer; rank?: (s: GameState, d: Decision) => string[];
  /** A fixed lean added to each option's estimate (for testing fixed strategies played well otherwise). */
  bias?: (s: GameState, d: Decision, id: string) => number;
}
export const STRONG: Strength = { rollouts: 8, maxOptions: 6 };

let seq = 1;
const rand = () => { let t = (seq = (seq + 0x6d2b79f5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function shuffleInPlace<T>(a: T[]) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }

/**
 * Reshuffle what `seat` cannot see: other players' hands (unless revealed), the deck, facedown Altar cards it has not
 * seen, and other players' tokens (each player's count stays; colors lean toward their Choir's colors).
 */
function determinize(s: GameState, seat: Seat) {
  const revealed = new Set(s.confession.map((c) => c.seat));
  const hands = s.players.filter((p) => p.seat !== seat && !revealed.has(p.seat));
  const altar = s.altar.filter((a) => a.facedown && a.offeredBy !== seat && !a.seenBy?.includes(seat));
  const pool = [...s.hostDeck, ...hands.flatMap((p) => p.hand), ...altar.map((a) => a.id)];
  shuffleInPlace(pool);
  let k = 0;
  for (const p of hands) for (let i = 0; i < p.hand.length; i++) p.hand[i] = pool[k++];
  for (const a of altar) a.id = pool[k++];
  for (let i = 0; i < s.hostDeck.length; i++) s.hostDeck[i] = pool[k++];
  shuffleInPlace(s.eventDeck);
  // Tokens: the unseen ones are dealt back, one at a time, weighted by each holder's Choir lean.
  const holders = s.players.filter((p) => p.seat !== seat);
  const theirAltar = s.altarTokens.filter((t) => t.by !== seat);
  const sides: Side[] = [...holders.flatMap((p) => p.tokens), ...theirAltar.map((t) => t.side)];
  const lean = (x: Seat, anon?: boolean) => { if (anon) return 0.5; const c = choirColors(s, x); return Math.max(0.25, Math.min(0.75, 0.5 + 0.08 * (c.light - c.dark))); };
  const deal = (want: number) => {
    const L = sides.filter((x) => x === 'light').length;
    if (!L) return sides.splice(sides.indexOf('dark'), 1)[0];
    if (L === sides.length) return sides.splice(sides.indexOf('light'), 1)[0];
    const pL = (want * L) / (want * L + (1 - want) * (sides.length - L));
    return sides.splice(sides.indexOf(rand() < pL ? 'light' : 'dark'), 1)[0];
  };
  for (const p of holders) for (let i = 0; i < p.tokens.length; i++) p.tokens[i] = deal(lean(p.seat));
  for (const t of theirAltar) t.side = deal(lean(t.by, t.anon));
}

/** What a position is worth to a player: Glory, plus what their tokens, Choir and stores should still bring. */
function value(s: GameState, q: Seat): number {
  const p = s.players[q];
  if (s.phase === 'ended') return p.glory;
  let v = p.glory;
  // Variant (eligible): Glory counts only if this player ends on the world's side, so it is weighed by that chance.
  const elig = rulesOf(s).endScore === 'eligible';
  if (!elig) v += tokensValue(s, p.tokens, q);
  for (const c of activeCards(p)) v += choirCardValue(s, c.id, q) + (c.store ?? 0);
  const R = rulesOf(s);
  if (R.spoils !== 'none' || R.gatherTo !== 'choir' || R.upkeepDraw !== 'refill') {
    // Variants where cards in hand are scarce: each is worth something (a future Offer, Exalt or ability).
    for (const c of p.hand) v += 0.5 + 0.4 * choirCardValue(s, c, q);
  }
  if (R.miser || R.generous) {
    // The Miser / the Generous (variants): the risk of ending with the fewest Offers, or the chance of the most,
    // surer as the game goes on.
    const offers = s.players.map((x) => s.stats.filter((e) => e.seat === x.seat && e.type === 'action' && e.source === 'offer').length);
    const mine = offers[q], rest = offers.filter((_, k) => k !== q), f = Math.min(1, s.day / 7);
    if (R.miser) v -= R.miser * f * (mine < Math.min(...rest) ? 1 : mine === Math.min(...rest) ? 0.5 : 0);
    if (R.generous) v += R.generous * f * (mine > Math.max(...rest) ? 1 : mine === Math.max(...rest) ? 0.5 : 0);
  }
  if (R.devotion) {
    // Devotion (a variant): Choir cards of the color you hold more tokens of score again at the end.
    const l = p.tokens.filter((t) => t === 'light').length, d = p.tokens.length - l, cc = choirColors(s, q);
    if (l !== d) v += R.devotion * (l > d ? cc.light : cc.dark);
  }
  return elig ? v * (0.1 + 0.9 * eligibleChance(s, p.tokens)) : v;
}

/** The lab's utility: my value against the strongest rival and the table. */
function utility(s: GameState, q: Seat): number {
  if (s.phase === 'ended') {
    const r = s.result!;
    const best = Math.max(...s.players.map((o) => o.glory));
    return r.winners.includes(q) ? 100 / r.winners.length + s.players[q].glory * 0.01 : -50 + (s.players[q].glory - best) * 0.5;
  }
  const me = value(s, q);
  const others = s.players.filter((o) => o.seat !== q).map((o) => value(s, o.seat));
  return me - 0.6 * Math.max(...others) - 0.4 * (others.reduce((a, b) => a + b, 0) / others.length);
}

/** Copy the game at this decision, reshuffle the unseen, answer it with `choice`, and play out the rest of the Day. */
function rollout(g: Game, d: Decision, choice: Answer, policy: (s: GameState, d: Decision) => Answer = botAnswer): number {
  const r = g.fork();
  determinize(r.state, d.seat);
  const day = r.state.day;
  const open = () => r.pending.filter((p) => r.waitingOn(p.seat).includes(p));
  for (const p of open()) r.answer(p.seat, p.id, p.id === d.id ? choice : policy(r.state, p));
  let guard = 0;
  while (!r.over && r.state.day === day && r.pending.length) {
    for (const p of open()) if (r.pending.includes(p)) r.answer(p.seat, p.id, policy(r.state, p));
    if (++guard > 4000) break;
  }
  return utility(r.state, d.seat);
}

/** Whether the strong bot searches this decision (the others are answered by the heuristic). */
export const isSearched = (d: Decision) => SEARCHED.has(d.tag) && d.max === 1 && d.options.length >= 2;

/**
 * The search's estimate of each option it tries: the mean utility over `k.rollouts` reshuffled worlds. The heuristic's
 * choice is always among the candidates; the rest are the first options, up to `k.maxOptions`. Every option is tried
 * on the same reshuffled worlds (common random numbers), so the comparison is fair.
 */
export function searchScores(g: Game, d: Decision, k: Strength = STRONG, quick = botAnswer(g.state, d)): { ids: string[]; scores: number[] } {
  const ids = (k.rank ? k.rank(g.state, d) : [quick[0], ...d.options.map((o) => o.id).filter((id) => id !== quick[0])]).slice(0, k.maxOptions);
  if (ids.length === 1) return { ids, scores: [0] };
  const base = (g.state.config.seed ^ (d.id * 2654435761)) | 0;
  const scores = ids.map((id) => {
    let total = 0;
    for (let i = 0; i < k.rollouts; i++) { seq = base + i * 7919; total += rollout(g, d, [id], k.policy); }
    return total / k.rollouts + (k.bias ? k.bias(g.state, d, id) : 0);
  });
  return { ids, scores };
}

/** A strong answer to a decision in a live game. Falls back to the heuristic for minor decisions. */
export function strongAnswer(g: Game, d: Decision, k: Strength = STRONG): Answer {
  const quick = botAnswer(g.state, d);
  if (!isSearched(d)) return quick;
  const { ids, scores } = searchScores(g, d, k, quick);
  let b = 0;
  for (let i = 1; i < ids.length; i++) if (scores[i] > scores[b]) b = i;
  return [ids[b]];
}
