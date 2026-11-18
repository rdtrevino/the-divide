// Shared helpers: decisions, logging, Glory, zones, card values, targeting.
import { C, E, H, HOST, cardName } from './data';
import { shuffle } from './rng';
import type {
  AltarCard, Answer, ChoirCard, Decision, Dir, Gen, GameState, LogVisibility, Option, Player, Seat, StatEvent,
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
/**
 * V42 rules (approved November 18, 2026). Each was measured as a test switch first; these are now the game.
 * Where a card's code still branches on one of these names, the branch it takes here is the rule.
 * The other switches in the code are the rejected or parked alternatives (see design/parked-abilities.md).
 */
export const V42_RULES: readonly string[] = [
  // Actions and the Reaping
  'exalt-free', 'gather-altar', 'reap-mirror',
  // Cards
  'scapegoat-deny', 'silence-free', 'firm-with', 'tree-swap', 'rev-swap', 'bounty-bet-soft', 'bounty-morning',
  'anathema-start', 'hubris-day4', 'mirage-protect', 'veil-more', 'winnowing-blind', 'winnowing-blind2', 'remnant-own',
  'set-others', 'set-2', 'raguel-fate', 'heresy-cost', 'morningstar-free', 'vessel-bet', 'vessel-nodraw', 'shroud-same',
  'seraph-refund', 'mammon-store', 'favor-ripen', 'favor-2', 'store-tide', 'zealot-others', 'sword-exalt',
  'temptation-give', 'mercy-spare',
  // Bots value a card's ability, not only its alignment, when they build.
  'bot-engine',
];
/**
 * V43 rules (approved November 18, 2026): the engine reworks. Each was measured as a test switch first
 * (design/v43-proposal.md). The race is to 12 (GLORY_TARGET in engine.ts).
 */
export const V43_RULES: readonly string[] = [
  'wisdom-peek', 'gabriel-seer', 'tree-momentum', 'hymn-loud', 'martyr-sac', 'tribute-pay', 'remnant-asc2e',
  'lilith-scavenge', 'parasite-feed', 'snare-trap', 'snare-nolook', 'eternity-relic', 'eternity-any', 'twilight-even',
  'council-same', 'forger-both', 'mirage-all', 'apple-2', 'fig-evening', 'raph-free', 'sword-both', 'lev-landslide',
  // Defiance takes the upset ability ('favor-upset' on Defiance), Favor takes Leviathan's old ability, and the Glory protection is dropped.
  'favor-upset', 'swap-defiance', 'favor-spared', 'no-shield',
];
const V42_SET = new Set([...V42_RULES, ...V43_RULES]);
/** A V42 rule, or a test switch named in the game's config. */
export const variant = (s: GameState, v: string) => {
  const cv = s.config.variants;
  if (cv?.includes(v)) return true;
  // '-name' turns one V42 rule off (tests and comparisons); 'v41-rules' turns them all off.
  return V42_SET.has(v) && !cv?.includes('v41-rules') && !cv?.includes('-' + v);
};
export const isCelestial = (s: GameState, seat: Seat, id: string) => s.players[seat].celestial === id;

/** A Host card is active when it is face up in a Choir. */
export function activeCards(p: Player): ChoirCard[] {
  return p.choir.filter((c) => !c.facedown && c.id.startsWith('host-'));
}
/**
 * Whether a card's ability is working for this player: face up in their Choir, and not switched off by
 * The Flood or Let There Be Light (ruling confirmed November 16, 2026: those Events switch off every
 * ability of their colour, automatic ones included; the cards still count toward Alignment).
 */
export function hasActive(s: GameState, seat: Seat, id: string): boolean {
  return activeCards(s.players[seat]).some((c) => c.id === id) && !blockedByEvent(s, seat, id);
}
export function holderOf(s: GameState, id: string): Seat | null {
  for (const p of s.players) if (hasActive(s, p.seat, id)) return p.seat;
  return null;
}

/** Whether the current Event applies to this player (Defiance ignores it). */
export function eventOn(s: GameState, ev: string, seat?: Seat): boolean {
  if (s.currentEvent !== ev) return false;
  if (seat !== undefined && s.day_.defiance.includes(seat)) return false;
  return true;
}

export function usedToday(s: GameState, seat: Seat, key: string) {
  return !!s.day_.usedToday[`${seat}:${key}`];
}
export function markToday(s: GameState, seat: Seat, key: string) {
  s.day_.usedToday[`${seat}:${key}`] = true;
}

export function handLimit(s: GameState, seat: Seat): number {
  let n = isCelestial(s, seat, C.dominion) ? 4 : 3;
  if (eventOn(s, E.manna, seat)) n += s.day_.handLimitBonus;
  return n;
}
export const baseHandLimit = (s: GameState, seat: Seat) => (isCelestial(s, seat, C.dominion) ? 4 : 3);

export const previousTide = (s: GameState): Dir | null => {
  const prev = s.tides.find((t) => t.day === s.day - 1);
  return prev ? prev.dir : null;
};
export const opposite = (d: Dir): Dir => (d === 'light' ? 'dark' : d === 'dark' ? 'light' : 'neutral');

// ---------------------------------------------------------------- card values

export interface Value { light: number; dark: number }

/** Offering value of a Host card in any zone, before Choir-only modifiers. */
export function baseValue(s: GameState, id: string): Value {
  const h = HOST[id];
  if (!h) return { light: 0, dark: 0 };
  if (id === H.shroud) {
    const prev = previousTide(s);
    const same = variant(s, 'shroud-same'); // test: follows yesterday's Tide instead of opposing it
    if (prev === 'light') return same ? { light: 1, dark: 0 } : { light: 0, dark: 1 };
    if (prev === 'dark') return same ? { light: 0, dark: 1 } : { light: 1, dark: 0 };
    return { light: 0, dark: 0 };
  }
  if (id === H.nephilim) return { light: 1, dark: 1 };
  // V43 test 'hymn-loud': Hymn is Light +2 and Lamentation Dark +2.
  if (variant(s, 'hymn-loud') && id === H.hymn) return { light: 2, dark: 0 };
  if (variant(s, 'hymn-loud') && id === H.lamentation) return { light: 0, dark: 2 };
  if (h.alignment === 'light') return { light: h.value ?? 0, dark: 0 };
  if (h.alignment === 'dark') return { light: 0, dark: h.value ?? 0 };
  return { light: 0, dark: 0 };
}

/** Which colors a card counts as for effects that check for a Light or Dark card. */
export function colorsOf(s: GameState, seat: Seat | null, id: string): { light: boolean; dark: boolean } {
  const v = baseValue(s, id);
  let light = v.light > 0;
  let dark = v.dark > 0;
  if (seat !== null && s.morningStar.some((m) => m.seat === seat && m.card === id) && id !== H.nephilim) [light, dark] = [dark, light];
  return { light, dark };
}

export interface AlignOpts { reaping?: boolean }

/** Net Alignment of a player's Choir. Positive = Light, negative = Dark. */
export function alignment(s: GameState, seat: Seat, opts: AlignOpts = {}): number {
  const p = s.players[seat];
  let light = 0;
  let dark = 0;
  for (const c of p.choir) {
    if (c.facedown || !c.id.startsWith('host-')) continue;
    if (c.id === H.nephilim) continue; // its two values are Neutral
    if (opts.reaping && s.day_.eclipsed[seat] === c.id) continue;
    let v = baseValue(s, c.id);
    if (s.morningStar.some((m) => m.seat === seat && m.card === c.id)) v = { light: v.dark, dark: v.light };
    light += v.light;
    dark += v.dark;
  }
  return light - dark;
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
  // V43 tests. 'defiance-store': Glory stored on a card that leaves your Choir is yours.
  if (variant(s, 'defiance-store') && (gone.store ?? 0) > 0 && hasActive(s, seat, H.defiance)) { const n = gone.store!; gone.store = 0; yield* gain(s, seat, n, H.defiance); log(s, 'defiance', `${pname(s, seat)} kept the ${n} Glory stored on ${cardName(id)} (Defiance).`); }
  // 'martyr-sac': when another card is discarded from your Choir, gain 1 Glory.
  if (variant(s, 'martyr-sac') && id !== H.martyr && id.startsWith('host-') && hasActive(s, seat, H.martyr) && canActivate(s, seat, H.martyr)) { yield* gain(s, seat, 1, H.martyr); log(s, 'martyr', `${pname(s, seat)} gained 1 Glory (Martyr).`); }
  if (id.startsWith('host-') && hasActive(s, seat, H.absolution) && canActivate(s, seat, H.absolution)) {
    const take = yield* yesNo(s, seat, 'absolution', `Absolution: return ${cardName(id)} to your hand instead of discarding it (then discard 1 card from your hand)?`);
    if (take) {
      let kept = false;
      const ok = yield* activation(s, seat, H.absolution, function* () {
        kept = true;
        s.players[seat].hand.push(id);
        const d = yield* chooseOne(s, seat, 'absolution.discard', 'Absolution: discard 1 card from your hand.', s.players[seat].hand.map((c) => cardOpt(c)));
        if (d) {
          s.players[seat].hand.splice(s.players[seat].hand.indexOf(d), 1);
          s.discard.push(d);
        }
        log(s, 'absolution', `${pname(s, seat)} used Absolution to keep ${cardName(id)}.`);
      });
      if (ok && kept) return;
    }
  }
  // 'lilith-scavenge': a card discarded from another player's Choir may go into a Lilith holder's hand.
  if (variant(s, 'lilith-scavenge') && id.startsWith('host-')) {
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
  if (col.light && eventOn(s, E.flood, seat)) return true;
  if (col.dark && eventOn(s, E.letThereBeLight, seat)) return true;
  return false;
}

/** Whether a player could pay to activate this ability right now. */
export function canActivate(s: GameState, seat: Seat, id: string): boolean {
  if (blockedByEvent(s, seat, id)) return false;
  if (eventOn(s, E.tithe, seat) && s.players[seat].glory < 1) return false;
  return true;
}

/**
 * Activate an ability: pay Tithe, open the Silence window, then run it.
 * Returns true if the ability resolved, false if it was negated or could not be paid.
 */
export function* activation(s: GameState, seat: Seat, source: string, run: () => Gen<void>): Gen<boolean> {
  if (blockedByEvent(s, seat, source)) return false;
  if (eventOn(s, E.tithe, seat)) {
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

export const CHOIR_LIMIT = 4;
/** The Choir limit: 4 (V41), or 'limit-N' for testing. */
export const choirLimit = (s: GameState) => Number((s.config.variants ?? []).find((v) => v.startsWith('limit-'))?.slice(6) ?? CHOIR_LIMIT);

/** Put a card into a Choir. Caller must ensure there is room. Handles entry triggers. */
export function* enterChoir(s: GameState, seat: Seat, id: string): Gen<void> {
  s.players[seat].choir.push({ id, facedown: false, used: false });
  stat(s, { type: 'enter_choir', seat, card: id });
  if (id === H.raguel) {
    const targets = others(s, seat).filter((p) => !immune(s, seat, p.seat));
    const t = yield* chooseOne(s, seat, 'raguel.bind', 'Raguel entered your Choir: choose another player to be Bound to you.', targets.map((p) => seatOpt(s, p.seat)));
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
  return true;
}

// ---------------------------------------------------------------- Glory

export type GlorySource = string; // card id, 'offer', 'reaping', 'bonus', 'gift', 'exalt', etc.

function addRaw(s: GameState, seat: Seat, n: number, source: GlorySource) {
  if (n === 0) return;
  s.players[seat].glory += n;
  stat(s, { type: 'glory', seat, amount: n, source });
}

/**
 * Gain Glory from the Pot.
 * The Arbiter (V34): at the Reaping, 1 of the Glory it gains is taken from a player of its choice.
 */
export function* gain(s: GameState, seat: Seat, n: number, source: GlorySource): Gen<number> {
  if (n <= 0) return 0;
  // V38: the Arbiter takes from a player only when it gains 2 or more at once.
  if (isCelestial(s, seat, C.arbiter) && source === 'reaping' && n >= 2) {
    const rich = others(s, seat).filter((p) => p.glory > 0);
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

/**
 * Lose Glory to the Pot (never below 0).
 * The Arbiter (V34): at the Reaping, 1 of the Glory it loses goes to a player of its choice.
 */
/** The other players tied for the least Glory (V36: the Arbiter and Mammon give to them; the user chooses among ties). */
export function leastGloryOthers(s: GameState, seat: Seat) {
  const os = others(s, seat);
  const min = Math.min(...os.map((p) => p.glory));
  return os.filter((p) => p.glory === min);
}

export function* lose(s: GameState, seat: Seat, n: number, source: GlorySource): Gen<number> {
  const amt = Math.min(n, s.players[seat].glory);
  if (amt <= 0) return 0;
  addRaw(s, seat, -amt, source);
  if (isCelestial(s, seat, C.arbiter) && source === 'reaping') {
    const t = yield* chooseOne(s, seat, 'arbiter.give', `The Arbiter: you lose ${amt} Glory at the Reaping. Give 1 of it to the player with the least Glory (choose among ties).`, leastGloryOthers(s, seat).map((p) => seatOpt(s, p.seat)));
    if (t) {
      const to = seatFromOpt(t);
      addRaw(s, to, 1, 'arbiter');
      log(s, 'glory', `${pname(s, seat)} gave 1 lost Glory to ${pname(s, to)} (the Arbiter).`);
    }
  }
  return amt;
}

/** Pay Glory as a cost (Exalt, Tithe, Tribute, Michael). The Arbiter pays a chosen player. */
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

export const canSpend = (s: GameState, seat: Seat, n: number) => n === 0 || (!eventOn(s, E.fast, seat) && s.players[seat].glory >= n);

/** Move Glory directly between players (Mammon, Hubris, gifts). Not from the Pot. */
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
  if (immune(s, actor, owner)) return true;
  if ((kind === 'replace' || kind === 'discard') && hasActive(s, owner, H.cherubim)) return true;
  if ((kind === 'look' || kind === 'reveal' || kind === 'copy' || kind === 'flip') && hasActive(s, owner, H.veil) && !variant(s, 'veil-secret') && !variant(s, 'veil-more') && !variant(s, 'veil-4')) return true;
  return false;
}

/** Kept for older call sites: no card grants blanket immunity any more. */
export const immune = (_s: GameState, _actor: Seat, _owner: Seat) => false;
/** Defiance (V42): other players' abilities cannot make you lose or give up Glory. */
// V43 test 'swap-defiance': Favor takes Defiance's protection, and Defiance takes Favor's upset ability.
export const glorySafe = (s: GameState, actor: Seat, owner: Seat) => !variant(s, 'no-shield') && actor !== owner && hasActive(s, owner, variant(s, 'swap-defiance') ? H.favor : H.defiance); // 'no-shield': the protection is dropped
/** Lilith (V42): other players' abilities cannot look at, take, or discard cards in your hand. */
export const handProtected = (s: GameState, actor: Seat, owner: Seat) => actor !== owner && (immune(s, actor, owner) || (!variant(s, 'lilith-scavenge') && hasActive(s, owner, H.lilith)) || (variant(s, 'cherub-hand') && hasActive(s, owner, H.cherubim)));

/** Tribute: pay 1 Glory to the owner before Targeting a card in their Choir. Returns false if it cannot be paid. */
export function canAffordTribute(s: GameState, actor: Seat, owner: Seat): boolean {
  if (actor === owner || !hasActive(s, owner, H.tribute) || variant(s, 'tribute-toll')) return true;
  return canSpend(s, actor, 1);
}
export function* payTribute(s: GameState, actor: Seat, owner: Seat): Gen<boolean> {
  if (actor === owner || !hasActive(s, owner, H.tribute)) return true;
  if (!canSpend(s, actor, 1)) return false;
  // V37: Tribute is paid to the Pot (was to Tribute's owner). V43 test 'tribute-pay': paid to Tribute's holder.
  if (variant(s, 'tribute-pay')) { transfer(s, actor, owner, 1, H.tribute); log(s, 'tribute', `${pname(s, actor)} paid 1 Glory to ${pname(s, owner)} to Target their Choir (Tribute).`); return true; }
  if (variant(s, 'tribute-toll')) return true; // the toll version has no targeting fee
  yield* pay(s, actor, 1, H.tribute);
  log(s, 'tribute', `${pname(s, actor)} paid 1 Glory to the Pot to Target ${pname(s, owner)}'s Choir (Tribute).`);
  return true;
}

/** Choir cards of `owner` that `actor` may Target with `kind`. */
export function targetableChoir(s: GameState, actor: Seat, owner: Seat, kind: TargetKind, filter: (c: ChoirCard) => boolean = () => true): ChoirCard[] {
  if (protectedFrom(s, actor, owner, kind)) return [];
  if (!canAffordTribute(s, actor, owner)) return [];
  return s.players[owner].choir.filter((c) => c.id.startsWith('host-') && filter(c));
}

/** Altar cards that `seat` may Gather or destroy (Sanctuary protects for other players). */
export function altarAvailable(s: GameState, seat: Seat): AltarCard[] {
  return s.altar.filter((a) => (a.sanctuary === undefined || a.sanctuary === seat) && !(variant(s, 'mirage-all') && altarShielded(s, a, seat)));
}

export function altarLabel(s: GameState, a: AltarCard, viewer: Seat): string {
  const by = a.offeredBy !== null && a.offeredBy >= 0 ? ` (${a.kind === 'fruits' ? 'First Fruits' : 'Offered'} by ${s.players[a.offeredBy]?.name ?? '?'})` : a.kind === 'seed' ? ' (Seed)' : '';
  if (a.facedown && a.offeredBy !== viewer) return 'Facedown card' + by;
  return cardName(a.id) + (a.facedown ? ' (your facedown card)' : '') + by;
}

/** Mirage (V35): a player's facedown Offerings cannot be flipped, looked at, exchanged, or destroyed by others before the Evening. */
export function altarShielded(s: GameState, a: AltarCard, actor: Seat): boolean {
  // V43 test 'mirage-all': every card you placed on the Altar is protected, face up or down, from other players' Gathers and abilities.
  if (variant(s, 'mirage-all')) return a.offeredBy !== null && a.offeredBy >= 0 && a.offeredBy !== actor && hasActive(s, a.offeredBy, H.mirage);
  return a.facedown && a.kind === 'offer' && a.offeredBy !== null && a.offeredBy !== actor && hasActive(s, a.offeredBy, H.mirage);
}

/** Pandemonium (V35): no card on the Altar may be flipped or looked at before the Evening. */
export const altarSightBlocked = (s: GameState) => s.currentEvent === E.pandemonium;

/** Facedown Altar cards `actor` may flip, look at, or exchange. */
export function altarPeekable(s: GameState, actor: Seat): AltarCard[] {
  if (altarSightBlocked(s)) return [];
  return s.altar.filter((a) => a.facedown && !altarShielded(s, a, actor));
}

/** V43 test 'snare-trap': when another player Gathers, looks at, flips, or discards a card you placed on the Altar, gain 1 Glory. */
export function* snareHit(s: GameState, actor: Seat, a: { offeredBy: Seat | null }): Gen<void> {
  const o = a.offeredBy;
  if (!variant(s, 'snare-trap') || o === null || o < 0 || o === actor || !hasActive(s, o, H.snare) || !canActivate(s, o, H.snare)) return;
  yield* gain(s, o, 1, H.snare);
  log(s, 'snare', `${pname(s, o)} gained 1 Glory (Snare).`);
}
