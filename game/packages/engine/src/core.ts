// Shared helpers: decisions, logging, Glory, zones, card values, targeting.
import { DEFAULT_RULES, choirLimit, rulesOf } from './rules';
import { C, E, H, HOST, cardName } from './data';
import { shuffle } from './rng';
import type {
  AltarCard, Answer, ChoirCard, Decision, Dir, Gen, GameState, LogVisibility, Option, Player, Seat, Side, StatEvent,
} from './types';

// ---------------------------------------------------------------- decisions

/** `confirm`: show the decision even when it has a single option (a "you see these cards" step). */
export type Ask = Omit<Decision, 'id'> & { confirm?: boolean };

/** Ask one player one question. Forced single choices resolve without prompting. */
export function* ask(s: GameState, d: Ask): Gen<Answer> {
  const { confirm, ...rest } = d;
  if (d.options.length === 0) return [];
  if (!confirm && d.min >= 1 && d.options.length === 1 && d.max === 1) return [d.options[0].id];
  if (!confirm && d.min === d.options.length && d.max === d.options.length) return d.options.map((o) => o.id);
  const decision: Decision = { ...rest, id: ++s.decisionSeq };
  const [answer] = yield [decision];
  return answer;
}

/** Ask several players at once (simultaneous, secret choices). */
export function* askAll(s: GameState, ds: Ask[]): Gen<Answer[]> {
  const out: Answer[] = new Array(ds.length);
  const pending: Decision[] = [];
  const idx: number[] = [];
  ds.forEach((d, i) => {
    if (d.options.length === 0) out[i] = [];
    else if (d.min >= 1 && d.options.length === 1 && d.max === 1) out[i] = [d.options[0].id];
    else {
      pending.push({ ...d, id: ++s.decisionSeq });
      idx.push(i);
    }
  });
  if (pending.length) {
    const answers = yield pending;
    answers.forEach((a, j) => (out[idx[j]] = a));
  }
  return out;
}

export function* chooseOne(s: GameState, seat: Seat, tag: string, prompt: string, options: Option[], optional = false, reveal?: string[]): Gen<string | null> {
  const opts = optional ? [...options, { id: 'none', label: 'Decline' }] : options;
  if (!opts.length) return null;
  const [a] = yield* ask(s, { seat, tag, prompt, options: opts, min: 1, max: 1, reveal });
  return a === 'none' || a === undefined ? null : a;
}

export function* yesNo(s: GameState, seat: Seat, tag: string, prompt: string): Gen<boolean> {
  const a = yield* ask(s, { seat, tag, prompt, options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }], min: 1, max: 1 });
  return a[0] === 'yes';
}

export const cardOpt = (id: string, prefix = ''): Option => ({ id: prefix + id, label: cardName(id), card: id });
export const seatOpt = (s: GameState, seat: Seat): Option => ({ id: 'p' + seat, label: s.players[seat].name, seat });
export const seatFromOpt = (id: string): Seat => Number(id.slice(1));

// ---------------------------------------------------------------- log & stats

export function log(s: GameState, kind: string, text: string, visibility: LogVisibility = 'public', data?: Record<string, unknown>) {
  s.log.push({ seq: ++s.seq, day: s.day, kind, text, visibility, data });
}
export function stat(s: GameState, e: Omit<StatEvent, 'seq' | 'day'>) {
  s.stats.push({ ...e, seq: ++s.seq, day: s.day });
}
export const pname = (s: GameState, seat: Seat) => s.players[seat].name;

// ---------------------------------------------------------------- queries

export const others = (s: GameState, seat: Seat) => s.players.filter((p) => p.seat !== seat);
export const isCelestial = (s: GameState, seat: Seat, id: string) => s.players[seat].celestial === id;

/** A Host card is active when it is face up in a Choir. */
export function activeCards(p: Player): ChoirCard[] {
  return p.choir.filter((c) => !c.facedown && c.id.startsWith('host-'));
}
/**
 * Whether a card's ability is working for this player: face up in their Choir, and not switched off by
 * The Flood or Let There Be Light (ruling confirmed November 16, 2026: those Events switch off every
 * ability of their colour, automatic ones included; the cards still score at the Reaping).
 */
export function hasActive(s: GameState, seat: Seat, id: string): boolean {
  return activeCards(s.players[seat]).some((c) => c.id === id) && !blockedByEvent(s, seat, id);
}

/** Whether this is the Day's Event. */
export const eventOn = (s: GameState, ev: string) => s.currentEvent === ev;

export function usedToday(s: GameState, seat: Seat, key: string) {
  return !!s.day_.usedToday[`${seat}:${key}`];
}
export function markToday(s: GameState, seat: Seat, key: string) {
  s.day_.usedToday[`${seat}:${key}`] = true;
}

export function handLimit(s: GameState, seat: Seat): number {
  let n = baseHandLimit(s, seat);
  if (eventOn(s, E.manna)) n += s.day_.handLimitBonus;
  return n;
}
/** The hand limit: 3, or 5 for the Dominion (V44). */
export const baseHandLimit = (s: GameState, seat: Seat) => rulesOf(s).handSize + (isCelestial(s, seat, C.dominion) ? 2 : 0);
/** The most cards a hand may keep at the end of a Day (the hand size, unless a variant allows more). */
export const handMaxOf = (s: GameState, seat: Seat) => (rulesOf(s).handMax || rulesOf(s).handSize) + (isCelestial(s, seat, C.dominion) ? 2 : 0);

/** What a card's value depends on: the Day and the Tides so far (Acolyte follows the most recent Day won). */
export type TideHistory = Pick<GameState, 'day' | 'tides'>;

export const opposite = (d: Dir): Dir => (d === 'light' ? 'dark' : d === 'dark' ? 'light' : 'neutral');

// ---------------------------------------------------------------- card values

export interface Value { light: number; dark: number }

/** Offering value of a Host card in any zone, before Choir-only modifiers. */
export function baseValue(s: TideHistory, id: string): Value {
  const h = HOST[id];
  if (!h) return { light: 0, dark: 0 };
  // Acolyte (the card id is still host-shroud, V45): the color of the most recent Day won; Light before any.
  if (id === H.shroud) {
    const last = [...s.tides].reverse().find((t) => t.day < s.day && t.dir !== 'neutral');
    return last?.dir === 'dark' ? { light: 0, dark: 1 } : { light: 1, dark: 0 };
  }
  if (h.alignment === 'light') return { light: h.value ?? 0, dark: 0 };
  if (h.alignment === 'dark') return { light: 0, dark: h.value ?? 0 };
  return { light: 0, dark: 0 };
}

/** The color a card pushes and scores as (V45: every Host card is Light or Dark), turned over by Morning Star. */
export function colorOf(s: GameState, seat: Seat | null, id: string): Side | null {
  const v = baseValue(s, id);
  const c: Side | null = v.light > 0 ? 'light' : v.dark > 0 ? 'dark' : null;
  if (c && seat !== null && s.morningStar.some((m) => m.seat === seat && m.card === id)) return c === 'light' ? 'dark' : 'light';
  return c;
}

/** Which colors a card counts as for abilities that ask for a Light or Dark card (Nephilim is also Light). */
export function colorsOf(s: GameState, seat: Seat | null, id: string): { light: boolean; dark: boolean } {
  const c = colorOf(s, seat, id);
  return { light: c === 'light' || id === H.nephilim, dark: c === 'dark' };
}

/** How many face-up Host cards in a Choir count as Light and as Dark (Nephilim counts as both). */
export function choirColors(s: GameState, seat: Seat): { light: number; dark: number } {
  let light = 0;
  let dark = 0;
  for (const c of activeCards(s.players[seat])) {
    const k = colorsOf(s, seat, c.id);
    if (k.light) light++;
    if (k.dark) dark++;
  }
  return { light, dark };
}
export const dirOf = (n: number): Dir => (n > 0 ? 'light' : n < 0 ? 'dark' : 'neutral');

// ---------------------------------------------------------------- deck & zones

export function drawHost(s: GameState): string | null {
  if (!s.hostDeck.length) {
    if (!s.discard.length) return null;
    s.hostDeck = shuffle(s, s.discard.splice(0));
    log(s, 'reshuffle', 'The Host deck ran out; the discard pile was shuffled into a new deck.');
  }
  return s.hostDeck.shift() ?? null;
}
export function peekHost(s: GameState, n: number): string[] {
  if (s.hostDeck.length < n && s.discard.length) {
    s.hostDeck.push(...shuffle(s, s.discard.splice(0)));
    log(s, 'reshuffle', 'The Host deck ran out; the discard pile was shuffled into a new deck.');
  }
  return s.hostDeck.slice(0, n);
}

export function* drawTo(s: GameState, seat: Seat, n: number) {
  for (let i = 0; i < n; i++) {
    const c = drawHost(s);
    if (c) s.players[seat].hand.push(c);
  }
}

/** Ask a player to discard 1 card from their hand (Absolution, Remnant, Temptation, Watchers). */
export function* discardFromHand(s: GameState, seat: Seat, tag: string, prompt: string): Gen<void> {
  const hand = s.players[seat].hand;
  const d = yield* chooseOne(s, seat, tag, prompt, hand.map((c) => cardOpt(c)));
  if (d) {
    hand.splice(hand.indexOf(d), 1);
    s.discard.push(d);
  }
}

export function removeFromChoir(s: GameState, seat: Seat, id: string): ChoirCard | null {
  const p = s.players[seat];
  const i = p.choir.findIndex((c) => c.id === id);
  if (i < 0) return null;
  const [c] = p.choir.splice(i, 1);
  s.morningStar = s.morningStar.filter((m) => !(m.seat === seat && m.card === id));
  if (id === H.raguel) s.bonds = s.bonds.filter((b) => b.owner !== seat);
  stat(s, { type: 'leave_choir', seat, card: id });
  return c;
}

/** Discard a card from a Choir to the discard pile, honoring Absolution. */
export function* discardFromChoir(s: GameState, seat: Seat, id: string, why: string): Gen<void> {
  const gone = removeFromChoir(s, seat, id);
  if (!gone) return;
  // Martyr (V43): when another card is discarded from your Choir, gain 1 Glory.
  if (id !== H.martyr && id.startsWith('host-') && hasActive(s, seat, H.martyr) && canActivate(s, seat, H.martyr)) { yield* gain(s, seat, 1, H.martyr); log(s, 'martyr', `${pname(s, seat)} gained 1 Glory (Martyr).`); }
  if (id.startsWith('host-') && hasActive(s, seat, H.absolution) && canActivate(s, seat, H.absolution)) {
    const take = yield* yesNo(s, seat, 'absolution', `Absolution: return ${cardName(id)} to your hand instead of discarding it (then discard 1 card from your hand)?`);
    if (take) {
      let kept = false;
      const ok = yield* activation(s, seat, H.absolution, function* () {
        kept = true;
        s.players[seat].hand.push(id);
        yield* discardFromHand(s, seat, 'absolution.discard', 'Absolution: discard 1 card from your hand.');
        log(s, 'absolution', `${pname(s, seat)} used Absolution to keep ${cardName(id)}.`);
      });
      if (ok && kept) return;
    }
  }
  // Lilith (V43): a card discarded from another player's Choir may go into a Lilith holder's hand.
  if (id.startsWith('host-')) {
    for (const o of s.players) {
      if (o.seat === seat || !hasActive(s, o.seat, H.lilith) || !canActivate(s, o.seat, H.lilith)) continue;
      if (yield* yesNo(s, o.seat, 'lilith.take', `Lilith: ${cardName(id)} was discarded from ${pname(s, seat)}'s Choir. Put it into your hand?`)) {
        o.hand.push(id);
        log(s, 'lilith', `${pname(s, seat)} discarded ${cardName(id)} from their Choir (${why}); ${o.name} took it into their hand (Lilith).`);
        return;
      }
    }
  }
  if (id.startsWith('host-')) s.discard.push(id);
  log(s, 'discard', `${pname(s, seat)} discarded ${cardName(id)} from their Choir (${why}).`);
}

// ---------------------------------------------------------------- activation (Tithe, Silence, Flood)

/** Host cards of a blocked color cannot activate on The Flood / Let There Be Light. */
export function blockedByEvent(s: GameState, seat: Seat, id: string): boolean {
  if (!id.startsWith('host-')) return false;
  if (s.silenced?.some((x) => x.target === seat)) return true; // Silence (V42)
  const col = colorsOf(s, seat, id);
  if (col.light && eventOn(s, E.flood)) return true;
  if (col.dark && eventOn(s, E.letThereBeLight)) return true;
  return false;
}

/** Whether a player could pay to activate this ability right now. */
export function canActivate(s: GameState, seat: Seat, id: string): boolean {
  if (blockedByEvent(s, seat, id)) return false;
  if (tithed(s, id) && s.players[seat].glory < 1) return false;
  return true;
}

/** Tithe charges for Host abilities only, not Celestial powers (V44). */
const tithed = (s: GameState, id: string) => eventOn(s, E.tithe) && id.startsWith('host-');

/**
 * Activate an ability: pay Tithe, then run it.
 * Returns true if the ability resolved, false if it was negated or could not be paid.
 */
export function* activation(s: GameState, seat: Seat, source: string, run: () => Gen<void>): Gen<boolean> {
  if (blockedByEvent(s, seat, source)) return false;
  if (tithed(s, source)) {
    if (s.players[seat].glory < 1) return false;
    yield* pay(s, seat, 1, E.tithe);
  }
  stat(s, { type: 'activate', seat, card: source });
  log(s, 'activate', `${pname(s, seat)} activated ${cardName(source)}.`);
  yield* run();
  return true;
}

/** Cards a player may voluntarily discard from their Choir to make room. */
export function discardableForRoom(s: GameState, p: Player): ChoirCard[] {
  // Parasite cannot be discarded by choice while its ability works (not facedown, not switched off by Let There Be Light).
  return p.choir.filter((c) => c.id.startsWith('host-') && !(c.id === H.parasite && !c.facedown && !blockedByEvent(s, p.seat, c.id)));
}

/** A Choir holds up to 4 cards (V41). */
/** The usual Choir size (a game's own is choirLimit(s), rules.ts). */
export const CHOIR_LIMIT = DEFAULT_RULES.choirLimit;

/** Put a card into a Choir. Caller must ensure there is room. Handles entry triggers. */
export function* enterChoir(s: GameState, seat: Seat, id: string): Gen<void> {
  s.players[seat].choir.push({ id, facedown: false, used: false });
  stat(s, { type: 'enter_choir', seat, card: id });
  if (id === H.raguel) {
    const t = yield* chooseOne(s, seat, 'raguel.bind', 'Raguel entered your Choir: choose another player to be Bound to you.', others(s, seat).map((p) => seatOpt(s, p.seat)));
    if (t) {
      const bound = seatFromOpt(t);
      s.bonds.push({ owner: seat, bound });
      log(s, 'raguel', `${pname(s, bound)} is now Bound to ${pname(s, seat)} by Raguel.`);
    }
  }
}

/** Make room in a full Choir by discarding (player's choice among voluntary options). Returns false if impossible. */
export function* makeRoom(s: GameState, seat: Seat, why: string): Gen<boolean> {
  const p = s.players[seat];
  if (p.choir.length < choirLimit(s)) return true;
  const opts = discardableForRoom(s, p);
  if (!opts.length) return false;
  const pick = yield* chooseOne(s, seat, 'choir.discard', `Your Choir is full. Choose a card to discard (${why}).`, opts.map((c) => cardOpt(c.id)));
  if (!pick) return false;
  yield* discardFromChoir(s, seat, pick, why);
  if (rulesOf(s).replacedToHand) {
    // Variant: the replaced card goes back to its owner's hand (unless an ability already took it).
    const i = s.discard.lastIndexOf(pick);
    if (i >= 0) { s.discard.splice(i, 1); p.hand.push(pick); }
  }
  return true;
}

// ---------------------------------------------------------------- Glory

export type GlorySource = string; // card id, 'offer', 'reaping', 'exalt', 'arbiter', etc.

function addRaw(s: GameState, seat: Seat, n: number, source: GlorySource) {
  if (n === 0) return;
  s.players[seat].glory += n;
  stat(s, { type: 'glory', seat, amount: n, source });
}

/**
 * Gain Glory from the Pot.
 * The Arbiter (V45): when its Choir scores at the Reaping, 1 of that Glory is taken from a player whose Choir
 * scored less, if any of them has Glory.
 */
export function* gain(s: GameState, seat: Seat, n: number, source: GlorySource): Gen<number> {
  if (n <= 0) return 0;
  if (isCelestial(s, seat, C.arbiter) && source === 'reaping') {
    const rich = others(s, seat).filter((p) => p.glory > 0 && (s.day_.reaped?.[p.seat] ?? 0) < n);
    if (rich.length) {
      const t = yield* chooseOne(s, seat, 'arbiter.take', `The Arbiter: you gain ${n} Glory at the Reaping. Choose a player to take 1 of it from.`, rich.map((p) => seatOpt(s, p.seat)));
      const from = seatFromOpt(t!);
      addRaw(s, from, -1, 'arbiter');
      addRaw(s, seat, 1, 'arbiter');
      addRaw(s, seat, n - 1, source);
      log(s, 'glory', `${pname(s, seat)} took 1 Glory from ${pname(s, from)} (the Arbiter).`);
      return n;
    }
  }
  addRaw(s, seat, n, source);
  return n;
}

/** Lose Glory to the Pot (never below 0). */
export function* lose(s: GameState, seat: Seat, n: number, source: GlorySource): Gen<number> {
  const amt = Math.min(n, s.players[seat].glory);
  if (amt <= 0) return 0;
  addRaw(s, seat, -amt, source);
  return amt;
}

/** Pay Glory as a cost (Tithe, Michael, Silence...), to the Pot or, with `to`, to a player (Council). */
export function* pay(s: GameState, seat: Seat, n: number, source: GlorySource, to?: Seat): Gen<boolean> {
  if (n <= 0) return true;
  if (s.players[seat].glory < n) return false;
  if (to !== undefined) {
    addRaw(s, seat, -n, source);
    addRaw(s, to, n, source);
    return true;
  }
  yield* lose(s, seat, n, source);
  return true;
}

export const canSpend = (s: GameState, seat: Seat, n: number) => n === 0 || (!eventOn(s, E.fast) && s.players[seat].glory >= n);

/** Move Glory directly between players (Mammon, Hubris, Tribute). Not from the Pot. */
export function transfer(s: GameState, from: Seat, to: Seat, n: number, source: GlorySource): number {
  const amt = Math.min(n, s.players[from].glory);
  if (amt <= 0) return 0;
  addRaw(s, from, -amt, source);
  addRaw(s, to, amt, source);
  return amt;
}

// ---------------------------------------------------------------- targeting

export type TargetKind = 'look' | 'reveal' | 'copy' | 'flip' | 'replace' | 'discard';

/** Whether `actor` may Target `owner`'s cards with this kind of effect (ignoring Tribute cost). */
export function protectedFrom(s: GameState, actor: Seat, owner: Seat, kind: TargetKind): boolean {
  if (actor === owner) return false;
  // Cherubim: cards in its holder's Choir cannot be replaced or discarded by other players.
  return (kind === 'replace' || kind === 'discard') && hasActive(s, owner, H.cherubim);
}

/** Tribute: pay 1 Glory to its holder before Targeting a card in their Choir. False if it cannot be paid. */
export function canAffordTribute(s: GameState, actor: Seat, owner: Seat): boolean {
  if (actor === owner || !hasActive(s, owner, H.tribute)) return true;
  return canSpend(s, actor, 1);
}
export function payTribute(s: GameState, actor: Seat, owner: Seat): boolean {
  if (actor === owner || !hasActive(s, owner, H.tribute)) return true;
  if (!canSpend(s, actor, 1)) return false;
  transfer(s, actor, owner, 1, H.tribute);
  log(s, 'tribute', `${pname(s, actor)} paid 1 Glory to ${pname(s, owner)} to Target their Choir (Tribute).`);
  return true;
}

/** Choir cards of `owner` that `actor` may Target with `kind`. */
export function targetableChoir(s: GameState, actor: Seat, owner: Seat, kind: TargetKind, filter: (c: ChoirCard) => boolean = () => true): ChoirCard[] {
  if (protectedFrom(s, actor, owner, kind)) return [];
  if (!canAffordTribute(s, actor, owner)) return [];
  return s.players[owner].choir.filter((c) => c.id.startsWith('host-') && filter(c));
}

/** Sanctuary: a protected Altar card can be Gathered or destroyed only by the player who protected it. */
export const sanctuaryAllows = (a: AltarCard, seat: Seat) => a.sanctuary === undefined || a.sanctuary === seat;

/** Altar cards that `seat` may Gather or destroy (Sanctuary protects for other players). */
export function altarAvailable(s: GameState, seat: Seat): AltarCard[] {
  return s.altar.filter((a) => sanctuaryAllows(a, seat) && !altarShielded(s, a, seat));
}

export function altarLabel(s: GameState, a: AltarCard, viewer: Seat): string {
  // Who placed a card is shown until the Evening's anonymous reveal (V45); First Fruits never show it.
  const by = a.offeredBy !== null && a.offeredBy >= 0 && !a.anon ? ` (Offered by ${s.players[a.offeredBy]?.name ?? '?'})` : a.kind === 'seed' ? ' (Creation)' : a.kind === 'fruits' ? ' (First Fruits)' : '';
  if (a.facedown && a.offeredBy !== viewer) return 'Facedown card' + by;
  return cardName(a.id) + (a.facedown ? ' (your facedown card)' : '') + by;
}

/** Mirage (V43): every card its holder placed on the Altar, face up or down, is protected from other players' Gathers and abilities. */
export function altarShielded(s: GameState, a: AltarCard, actor: Seat): boolean {
  return a.offeredBy !== null && a.offeredBy >= 0 && a.offeredBy !== actor && hasActive(s, a.offeredBy, H.mirage);
}

/** Pandemonium (V35): no card on the Altar may be flipped or looked at before the Evening. */
export const altarSightBlocked = (s: GameState) => s.currentEvent === E.pandemonium;

/** Facedown Altar cards `actor` may flip, look at, or exchange. */
export function altarPeekable(s: GameState, actor: Seat): AltarCard[] {
  if (altarSightBlocked(s)) return [];
  return s.altar.filter((a) => a.facedown && !altarShielded(s, a, actor));
}

/** Snare (V43): when another player Gathers, looks at, flips, or discards a card you placed on the Altar, gain 1 Glory. */
export function* snareHit(s: GameState, actor: Seat, a: { offeredBy: Seat | null }): Gen<void> {
  const o = a.offeredBy;
  if (o === null || o < 0 || o === actor || !hasActive(s, o, H.snare) || !canActivate(s, o, H.snare)) return;
  yield* gain(s, o, 1, H.snare);
  log(s, 'snare', `${pname(s, o)} gained 1 Glory (Snare).`);
}
