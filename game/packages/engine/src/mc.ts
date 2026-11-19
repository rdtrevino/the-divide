// Strong computer players: determinized Monte Carlo, like the design lab's bots (game/tools/lab).
// For each real choice the bot tries every option: it copies the game at this moment (Game.fork), reshuffles everything it
// cannot see, plays the rest of the Day forward with the fast heuristic bots, and keeps the option that leaves it
// best placed against the strongest rival. Reads come from how it reshuffles: a player's secret tokens are dealt
// leaning toward their Choir's colors, as a careful person would guess. Bluffs come from the search itself: it learns
// what the other players read into Choirs and facedown Offers, and plays against that.
import { botAnswer, choirCardValue, tokenWorth } from './bots';
import { activeCards, choirColors } from './core';
import { Game } from './game';
import type { Answer, Decision, GameState, Seat, Side } from './types';

/** Decisions worth searching; everything else is answered by the heuristic. */
const SEARCHED = new Set(['action', 'offer.card', 'gather.source', 'exalt.card', 'firstFruits', 'judgment']);

export interface Strength { rollouts: number; maxOptions: number }
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
  const lean = (x: Seat) => { const c = choirColors(s, x); return Math.max(0.25, Math.min(0.75, 0.5 + 0.08 * (c.light - c.dark))); };
  const deal = (want: number) => {
    const L = sides.filter((x) => x === 'light').length;
    if (!L) return sides.splice(sides.indexOf('dark'), 1)[0];
    if (L === sides.length) return sides.splice(sides.indexOf('light'), 1)[0];
    const pL = (want * L) / (want * L + (1 - want) * (sides.length - L));
    return sides.splice(sides.indexOf(rand() < pL ? 'light' : 'dark'), 1)[0];
  };
  for (const p of holders) for (let i = 0; i < p.tokens.length; i++) p.tokens[i] = deal(lean(p.seat));
  for (const t of theirAltar) t.side = deal(lean(t.by));
}

/** What a position is worth to a player: Glory, plus what their tokens, Choir and stores should still bring. */
function value(s: GameState, q: Seat): number {
  const p = s.players[q];
  if (s.phase === 'ended') return p.glory;
  let v = p.glory;
  for (const t of p.tokens) v += tokenWorth(s, t);
  for (const c of activeCards(p)) v += choirCardValue(s, c.id) + (c.store ?? 0);
  return v;
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
function rollout(g: Game, d: Decision, choice: Answer): number {
  const r = g.fork();
  determinize(r.state, d.seat);
  const day = r.state.day;
  const open = () => r.pending.filter((p) => r.waitingOn(p.seat).includes(p));
  for (const p of open()) r.answer(p.seat, p.id, p.id === d.id ? choice : botAnswer(r.state, p));
  let guard = 0;
  while (!r.over && r.state.day === day && r.pending.length) {
    for (const p of open()) if (r.pending.includes(p)) r.answer(p.seat, p.id, botAnswer(r.state, p));
    if (++guard > 4000) break;
  }
  return utility(r.state, d.seat);
}

/** A strong answer to a decision in a live game. Falls back to the heuristic for minor decisions. */
export function strongAnswer(g: Game, d: Decision, k: Strength = STRONG): Answer {
  const quick = botAnswer(g.state, d);
  if (!SEARCHED.has(d.tag) || d.max !== 1 || d.options.length < 2) return quick;
  // The heuristic's choice is always among the candidates; the rest are the first options, up to the limit.
  const ids = [quick[0], ...d.options.map((o) => o.id).filter((id) => id !== quick[0])].slice(0, k.maxOptions);
  // Every option is tried on the same reshuffled worlds (common random numbers), so the comparison is fair.
  const base = (g.state.config.seed ^ (d.id * 2654435761)) | 0;
  let best = quick, bestScore = -Infinity;
  for (const id of ids) {
    let total = 0;
    for (let i = 0; i < k.rollouts; i++) { seq = base + i * 7919; total += rollout(g, d, [id]); }
    if (total > bestScore) { bestScore = total; best = [id]; }
  }
  return best;
}
