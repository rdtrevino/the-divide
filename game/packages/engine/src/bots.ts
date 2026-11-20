// Computer players. Heuristic, not perfect: they weigh what a Light or a Dark Day is worth to them (their Choir
// and their secret tokens), read the Altar, and answer every kind of decision sensibly.
import { choirLimit, rulesOf } from './rules';
import { activeCards, baseValue, choirColors, dirOf, hasActive } from './core';
import { DAYS, TOKEN_WEIGHT, daysWon, tokenScore } from './engine';
import { E, H, HOST } from './data';
import type { Answer, Decision, Dir, GameState, Option, Seat } from './types';

/** Small deterministic PRNG per decision, so simulations are reproducible without touching game RNG. */
function rand(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const val = (s: GameState, id: string | undefined) => (id ? baseValue(s, id) : { light: 0, dark: 0 });
/** A Choir's public lean: its Light cards minus its Dark cards. The table's best read of a player's side. */
const alignment = (s: GameState, seat: Seat) => { const c = choirColors(s, seat); return c.light - c.dark; };
const signed = (s: GameState, id: string | undefined) => { const v = val(s, id); return v.light - v.dark; };

/** Does `viewer` know this Altar card? */
const knows = (a: { facedown: boolean; offeredBy: Seat | null; seenBy?: Seat[] }, viewer?: Seat) => !a.facedown || (viewer !== undefined && (a.offeredBy === viewer || !!a.seenBy?.includes(viewer)));

/**
 * The viewer's estimate of the Altar. Known cards count fully; a facedown Offering from another player
 * is read as leaning toward that player's own Choir (players tend to Offer toward their own side).
 */
function altarNet(s: GameState, viewer?: Seat) {
  let n = 0;
  for (const a of s.altar) {
    if (knows(a, viewer)) n += signed(s, a.id);
    else if (a.offeredBy !== null && a.offeredBy >= 0) n += 0.6 * Math.sign(alignment(s, a.offeredBy));
  }
  for (const t of s.altarTokens) n += tokenGuess(s, t, viewer);
  return n;
}
/** The viewer's read of a token on the Altar: its own exactly; another's leans like its Offerer's Choir (a First Fruits token: unknown). */
const tokenGuess = (s: GameState, t: GameState['altarTokens'][number], viewer?: Seat) =>
  t.by === viewer ? (t.side === 'light' ? TOKEN_WEIGHT : -TOKEN_WEIGHT) : t.anon ? 0 : 0.8 * Math.sign(alignment(s, t.by));

/** What a Light Day and a Dark Day are worth to a player today: their Choir cards of that color, plus their tokens. */
interface Stake { light: number; dark: number }
const addStake = (a: Stake, b: Stake): Stake => ({ light: a.light + b.light, dark: a.dark + b.dark });
/** What a Choir of these colors scores tonight if Light wins, and if Dark wins. */
const choirStake = (s: GameState, c: Stake): Stake => ({ light: rulesOf(s).choirPay * c.light, dark: rulesOf(s).choirPay * c.dark });
const count = (t: readonly string[], k: string) => t.filter((x) => x === k).length;
/** What these tokens gain at the end from a Light Day today, and from a Dark Day (V45: one each). */
function tokenStake(s: GameState, held: readonly string[]): Stake {
  const mode = rulesOf(s).endScore, tl = count(held, 'light'), td = count(held, 'dark');
  if (mode === 'each') return { light: tl, dark: td };
  const w = daysWon(s), left = daysAfter(s);
  return { light: expectTokens(mode, tl, td, w.light + 1, w.dark, left), dark: expectTokens(mode, tl, td, w.light, w.dark + 1, left) };
}
function stakeOf(s: GameState, seat: Seat): Stake {
  return addStake(choirStake(s, choirColors(s, seat)), tokenStake(s, s.players[seat].tokens));
}
/** A Day goes to each side this often, and to nobody the rest (for the end-score variants' expectations). */
const P_SIDE = 0.4;
const memo = new Map<string, number>();
/** The expected end score of a hand of tokens with `left` Days still to play (the `endScore` variants). */
export function expectTokens(mode: string, tl: number, td: number, wl: number, wd: number, left: number): number {
  if (left <= 0) return tokenScore(mode, tl, td, wl, wd);
  const key = `${mode} ${tl} ${td} ${wl} ${wd} ${left}`;
  let v = memo.get(key);
  if (v === undefined) {
    v = P_SIDE * expectTokens(mode, tl, td, wl + 1, wd, left - 1) + P_SIDE * expectTokens(mode, tl, td, wl, wd + 1, left - 1) + (1 - 2 * P_SIDE) * expectTokens(mode, tl, td, wl, wd, left - 1);
    memo.set(key, v);
  }
  return v;
}
/** What a hand of tokens should still bring by the end. */
export function tokensValue(s: GameState, held: readonly string[]): number {
  const mode = rulesOf(s).endScore;
  if (mode === 'each') return held.reduce((t, k) => t + tokenWorth(s, k as 'light' | 'dark'), 0);
  const w = daysWon(s);
  return expectTokens(mode, count(held, 'light'), count(held, 'dark'), w.light, w.dark, daysAfter(s));
}
/** Expected value of today's Day from an estimated Altar; `w` < 1 when players still to act can swing it. */
function dayValue(st: Stake, est: number, w = 0.7) {
  const pl = 1 / (1 + Math.exp(-1.2 * est * w));
  return pl * st.light + (1 - pl) * st.dark;
}
/** Days still to come after today. */
export const daysAfter = (s: GameState) => Math.max(0, DAYS - s.day);
/** A colored card in the Choir scores on about half the Days left. */
export const choirCardValue = (s: GameState, id: string | undefined) => {
  if (!id) return 0;
  const v = val(s, id);
  return rulesOf(s).choirPay * 0.5 * daysAfter(s) * ((v.light > 0 ? 1 : 0) + (v.dark > 0 ? 1 : 0));
};
/** What a card in hand is worth (a future First Fruits, Exalt or ability): as the strong bot's value() counts it. */
const handCardValue = (s: GameState, id: string | undefined) => 0.5 + 0.4 * choirCardValue(s, id);
/** What holding a token of a side is worth by the end: the Days it has won, and about half of those to come. */
/** For the end-score variants, the token's worth to `seat` given what it holds: one more (`more`), or one fewer. */
export const tokenWorth = (s: GameState, side: 'light' | 'dark', seat?: Seat, more = true): number => {
  if (rulesOf(s).endScore === 'each') return daysWon(s)[side] + 0.5 * daysAfter(s);
  const held = seat === undefined ? [] : s.players[seat].tokens;
  if (more) return tokensValue(s, [...held, side]) - tokensValue(s, held);
  const less = [...held]; less.splice(less.indexOf(side), 1);
  return tokensValue(s, held) - tokensValue(s, less);
};

/** Players acting after `seat` this Day can still swing the Tide; discount accordingly. */
function laterPlayers(s: GameState, seat: Seat) {
  const n = s.players.length;
  const pos = (seat - s.firstPlayer + n) % n;
  return n - 1 - pos;
}

function worstChoirCard(s: GameState, seat: Seat, want: number): { id: string; v: number } | null {
  const p = s.players[seat];
  const cands = p.choir.filter((c) => c.id.startsWith('host-') && !(c.id === H.parasite && !c.facedown));
  if (!cands.length) return null;
  let best = cands[0];
  let bestScore = Infinity;
  for (const c of cands) {
    const v = c.facedown ? 0 : signed(s, c.id);
    const score = (want >= 0 ? v : -v) + (c.facedown ? 0 : engineVal(s, seat, c.id));
    if (score < bestScore) { bestScore = score; best = c; }
  }
  return { id: best.id, v: best.facedown ? 0 : signed(s, best.id) };
}

function pickBest<T>(items: T[], score: (x: T) => number): T {
  let best = items[0];
  let bs = -Infinity;
  for (const x of items) { const sc = score(x); if (sc > bs) { bs = sc; best = x; } }
  return best;
}

function leaderSeats(s: GameState, except?: Seat) {
  const ps = s.players.filter((p) => p.seat !== except);
  const max = Math.max(...ps.map((p) => p.glory));
  return ps.filter((p) => p.glory === max).map((p) => p.seat);
}

/**
 * A Choir card's ability is valued by the Glory it earns per Day held (measured with tools/sim/income.ts),
 * times the Days likely left, so bots build for abilities as well as for lean.
 */
const ENGINE_RATE: Record<string, number> = {
  [H.providence]: 0.4, [H.mammon]: 0.4, [H.seraphim]: 0.25, [H.legion]: 0.25, [H.council]: 0.35, [H.gabriel]: 0.35,
  [H.martyr]: 0.35, [H.leviathan]: 0.3, [H.defiance]: 0.3, [H.twilight]: 0.3, [H.outcast]: 0.3, [H.treeOfLife]: 0.25,
  [H.moderation]: 0.24, [H.stillness]: 0.22, [H.favor]: 0.2, [H.snare]: 0.2, [H.vessel]: 0.2, [H.eternity]: 0.2,
  [H.firmament]: 0.18, [H.confession]: 0.13, [H.moloch]: 0.1, [H.zealot]: 0.1, [H.veil]: 0.09, [H.raguel]: 0.05,
  [H.hubris]: 0.05, [H.bounty]: 0.04, [H.covenant]: 0.04,
};
function engineRate(s: GameState, seat: Seat, id: string | undefined): number {
  if (!id) return 0;
  if (id === H.uriel || id === H.beelzebub) {
    const k = id === H.uriel ? 'light' : 'dark';
    const n = s.players[seat].choir.filter((c) => !c.facedown && c.id !== id && (k === 'light' ? signed(s, c.id) > 0 : signed(s, c.id) < 0)).length;
    return n >= 3 ? 2 : 0.15 * n * 2;
  }
  if (id === H.remnant) return choirLimit(s) - s.players[seat].choir.length > 2 ? 0.8 : 0;
  return ENGINE_RATE[id] ?? 0;
}
const daysLeft = (s: GameState) => daysAfter(s) + 1;
const engineVal = (s: GameState, seat: Seat, id: string | undefined) => engineRate(s, seat, id) * daysLeft(s);

/**
 * How much the Event would help `seat` against the table (positive: play it; negative: bury it).
 * Rough judgments a player would make: the leader wants quiet Days, a trailer wants swings, and an Event that
 * favors one side's cards or Choirs helps the players on it.
 */
function eventScore(s: GameState, seat: Seat, ev: string | undefined): number {
  if (!ev) return 0;
  const me = s.players[seat];
  const lead = Math.max(...s.players.map((p) => p.glory));
  const leading = me.glory === lead && s.players.filter((p) => p.glory === lead).length === 1;
  const trailing = me.glory < lead - 2;
  const myLean = Math.sign(alignment(s, seat));
  const leans = s.players.filter((p) => p.seat !== seat).map((p) => Math.sign(alignment(s, p.seat)));
  const mySide = leans.filter((x) => x !== 0 && x === myLean).length;
  const otherSide = leans.filter((x) => x !== 0 && x === -myLean).length;
  const colorCount = (p: { choir: { id: string; facedown: boolean }[] }, k: 1 | -1) => p.choir.filter((c) => !c.facedown && Math.sign(signed(s, c.id)) === k).length;
  const avgOthers = (k: 1 | -1) => s.players.filter((p) => p.seat !== seat).reduce((t, p) => t + colorCount(p, k), 0) / Math.max(1, s.players.length - 1);
  switch (ev) {
    case E.famine: return leading ? 1 : trailing ? -1 : 0;
    case E.ascension: return myLean > 0 ? 1 : myLean < 0 ? -1 : 0;
    case E.fallFromGrace: return myLean < 0 ? 1 : myLean > 0 ? -1 : 0;
    case E.flood: return avgOthers(1) - colorCount(me, 1);
    case E.letThereBeLight: return avgOthers(-1) - colorCount(me, -1);
    // False Prophecy reverses the scoring: good for the smaller side, which the Tide usually goes against.
    case E.falseProphecy: return myLean === 0 ? 0 : mySide < otherSide ? 1 : mySide > otherSide ? -1 : 0;
    case E.tithe: return -me.choir.filter((c) => !c.facedown && c.id.startsWith('host-') && /^On your turn/.test(HOSTTEXT(c.id))).length + 1;
    case E.purgatory: return 0;
    case E.castingLots: return trailing ? 0.5 : leading ? -0.5 : 0;
    case E.divineCalling: return 0.3;
    default: return 0;
  }
}
const HOSTTEXT = (id: string) => HOST[id]?.text ?? '';

export function botAnswer(s: GameState, d: Decision): Answer {
  const r = rand(d.id * 7919 + d.seat * 104729 + (s.config.seed | 0));
  const seat = d.seat;
  const st = stakeOf(s, seat);
  /** My side: positive when a Light Day is worth more to me. */
  const net = st.light - st.dark;
  const want = net !== 0 ? net : altarNet(s, seat) || 1;
  const wantDir: Dir = dirOf(want);
  const one = (id: string) => [id];
  const has = (id: string) => d.options.some((o) => o.id === id);
  const byId = (pred: (o: Option) => boolean) => d.options.find(pred);
  const altar = altarNet(s, seat);
  const later = laterPlayers(s, seat);
  const w = later === 0 ? 1 : later === 1 ? 0.75 : 0.55;
  /** Offering (or giving as First Fruits) one of my tokens: its push today, against its worth at the end. */
  const offerToken = (k: 'light' | 'dark') => {
    const less = rulesOf(s).endScore === 'each' ? { ...st, [k]: st[k] - 1 } : (() => { const h = [...s.players[seat].tokens]; h.splice(h.indexOf(k), 1); return addStake(choirStake(s, choirColors(s, seat)), tokenStake(s, h)); })();
    return dayValue(less, altar + (k === 'light' ? TOKEN_WEIGHT : -TOKEN_WEIGHT), w) - dayValue(st, altar, w) - tokenWorth(s, k, seat, false) + 0.5;
  };
  /** Offering a card from my Choir: its push today, against what it would have scored tonight and later. */
  const offerFromChoir = (id: string) => {
    const v = val(s, id), cc = choirColors(s, seat);
    const less = addStake(choirStake(s, { light: cc.light - Math.sign(v.light), dark: cc.dark - Math.sign(v.dark) }), tokenStake(s, s.players[seat].tokens));
    return dayValue(less, altar + signed(s, id), w) - dayValue(st, altar, w) - choirCardValue(s, id) - engineVal(s, seat, id);
  };

  // Multi-select decisions.
  if (d.max > 1 || d.min !== 1) {
    if (d.tag === 'upkeep.discard') {
      const sorted = [...d.options].sort((a, b) => (want >= 0 ? signed(s, a.card) - signed(s, b.card) : signed(s, b.card) - signed(s, a.card)));
      return sorted.slice(0, d.min).map((o) => o.id);
    }
    if (d.tag === 'jubilee') {
      return d.options.filter((o) => (want >= 0 ? signed(s, o.card) < 0 : signed(s, o.card) > 0)).map((o) => o.id).slice(0, d.max);
    }
    const k = d.min + Math.floor(r * (d.max - d.min + 1));
    return d.options.slice(0, k).map((o) => o.id);
  }

  switch (d.tag) {
    case 'judgment': {
      // Judgment Day: choose the action as on any turn, then what it takes, without seeing anyone else's choice.
      const acts = [...new Set(d.options.map((o) => o.id.split('|')[0]))].filter((x) => x !== 'pass');
      if (!acts.length) return one(d.options[0].id);
      const [a] = botAnswer(s, { ...d, tag: 'action', options: acts.map((id) => ({ id, label: id })) });
      const toSub = (id: string) => (id.startsWith('card:') ? 'altar:' + s.altar.findIndex((x) => x.id === id.slice(5)) : id);
      const subs = d.options.filter((o) => o.id.startsWith(a + '|')).map((o) => ({ ...o, id: toSub(o.id.slice(a.length + 1)), from: o.id }));
      const tag = a === 'offer' ? 'offer.card' : a === 'exalt' ? 'exalt.card' : 'gather.source';
      const [sub] = botAnswer(s, { ...d, tag, options: subs });
      return one(subs.find((o) => o.id === sub)?.from ?? subs[0].from);
    }
    case 'action': {
      const p = s.players[seat];
      const scores: Record<string, number> = {};
      const now = dayValue(st, altar, w);
      const room = p.choir.length < choirLimit(s);
      const worst = worstChoirCard(s, seat, want);
      const replaced = room ? 0 : choirCardValue(s, worst?.id) + engineVal(s, seat, worst?.id);
      /** My stake if `id` joins my Choir (and the worst card leaves a full one). */
      const cc = choirColors(s, seat);
      const toks = tokenStake(s, p.tokens);
      const withCard = (id: string | undefined): Stake => {
        const v = val(s, id), o = room || !worst ? { light: 0, dark: 0 } : val(s, worst.id);
        return addStake(choirStake(s, { light: cc.light + Math.sign(v.light) - Math.sign(o.light), dark: cc.dark + Math.sign(v.dark) - Math.sign(o.dark) }), toks);
      };
      // No offering, no harvest: until you have Offered today, an Offer also lets your Choir score tonight.
      const unlock = rulesOf(s).harvest === 'offer' ? 1 : rulesOf(s).harvest === 'half' ? 0.5 : 0;
      const harvest = p.offeredToday ? 0 : unlock * dayValue(choirStake(s, cc), altar, w);
      if (has('offer')) {
        const from = rulesOf(s).offerFrom;
        const cards = from === 'choir' ? [] : p.hand.map((c) => dayValue(st, altar + signed(s, c), w) - now - 0.15 * choirCardValue(s, c));
        const choir = from === 'hand' ? [] : activeCards(p).map((c) => offerFromChoir(c.id));
        const tokens = (['light', 'dark'] as const).filter((k) => p.tokens.includes(k)).map((k) => offerToken(k));
        scores.offer = Math.max(...cards, ...choir, ...tokens) + harvest + 0.3;
      }
      if (has('gather')) {
        let best = -Infinity;
        if (room || worst) for (const a of s.altar) {
          if (!knows(a, seat)) continue;
          const v = signed(s, a.id);
          best = Math.max(best, dayValue(withCard(a.id), altar - v, w) - now + choirCardValue(s, a.id) + engineVal(s, seat, a.id) - replaced);
        }
        // A token from the Altar: worth about the average of the two sides, and its push leaves the Altar.
        for (const t of s.altarTokens) {
          const guess = tokenGuess(s, t, seat);
          const worth = t.by === seat ? tokenWorth(s, t.side, seat) : 0.5 * (tokenWorth(s, 'light', seat) + tokenWorth(s, 'dark', seat));
          best = Math.max(best, dayValue(st, altar - guess, w) - now + worth);
        }
        if (p.choir.some((c) => c.id === H.forger && !c.facedown)) for (const c of new Set(s.discard)) best = Math.max(best, choirCardValue(s, c) + engineVal(s, seat, c) - replaced);
        scores.gather = best;
      }
      if (has('exalt')) {
        // Seraphim and Legion pay 1 Glory for Exalting a card of their color.
        const refund = (c: string) => ((hasActive(s, seat, H.seraphim) && signed(s, c) > 0) || (hasActive(s, seat, H.legion) && signed(s, c) < 0) ? 1 : 0);
        scores.exalt = Math.max(...p.hand.map((c) => dayValue(withCard(c), altar, w) - now + choirCardValue(s, c) + engineVal(s, seat, c) - replaced + refund(c))) + (s.currentEvent === E.divineCalling ? 1 : 0);
      }
      const ids = Object.keys(scores);
      const choice = pickBest(ids, (x) => scores[x] + r * 0.6);
      return one(choice);
    }
    // V43 tests
    case 'wisdom.keep': {
      const o = pickBest(d.options, (x) => (want >= 0 ? signed(s, x.card) : -signed(s, x.card)) + engineVal(s, seat, x.card));
      return one(o.id);
    }
    case 'seer.player': {
      const o = pickBest(d.options.filter((x) => x.seat !== undefined), (x) => s.players[x.seat!].hand.length + r * 0.1);
      return one(o ? o.id : 'none');
    }
    case 'seer.dir': {
      const cards = d.reveal ?? [];
      const lt = cards.filter((c) => signed(s, c) > 0).length, dk = cards.filter((c) => signed(s, c) < 0).length;
      return one(lt > dk ? 'light' : dk > lt ? 'dark' : r < 0.5 ? 'light' : 'dark');
    }
    case 'council.player': {
      const o = d.options.find((x) => x.seat !== undefined && net !== 0 && Math.sign(alignment(s, x.seat)) === Math.sign(net));
      return one(o ? o.id : 'none');
    }
    case 'eternity.keep': {
      const o = d.options.find((x) => x.card && dirOf(signed(s, x.card)) === wantDir);
      return one(o ? o.id : 'none');
    }
    case 'figLeaves.take': {
      // Take a card back when the Day is already won without it, to keep it for later.
      const o = d.options.find((x) => x.card && dirOf(signed(s, x.card)) === wantDir && Math.abs(altar) >= 3 && dirOf(altar) === wantDir);
      return one(o ? o.id : 'none');
    }
    case 'lilith.take':
      return one('yes');
    case 'parasite.target': {
      const leaders = leaderSeats(s, seat);
      const o = byId((x) => x.seat !== undefined && leaders.includes(x.seat)) ?? d.options[0];
      return one(o.id);
    }
    case 'temptation.turn': {
      // Turn the leader's card of the color the Altar favors, so it will not score.
      const lead = leaderSeats(s, seat);
      const o = pickBest(d.options.filter((x) => x.seat !== undefined), (x) => (dirOf(signed(s, x.card)) === dirOf(altar) ? 2 : 0) + (lead.includes(x.seat!) ? 1 : 0) + r * 0.1);
      return one(o && dirOf(altar) !== 'neutral' ? o.id : 'none');
    }
    case 'firstFruits':
    case 'offer.card':
    case 'exalt.card': {
      const now = dayValue(st, altar, w);
      const o = pickBest(d.options, (o) => {
        if (o.id.startsWith('token:')) return offerToken(o.id.slice(6) as 'light' | 'dark');
        if (o.id.startsWith('choir:')) return offerFromChoir(o.id.slice(6));
        const v = signed(s, o.card);
        if (d.tag === 'offer.card' || d.tag === 'firstFruits') return dayValue(st, altar + v, w) - now - 0.15 * choirCardValue(s, o.card) + (dirOf(v) === wantDir ? 0.2 : 0);
        return (want >= 0 ? v : -v) + engineVal(s, seat, o.card);
      });
      return one(o.id);
    }
    case 'gather.source': {
      const p = s.players[seat];
      const room = p.choir.length < choirLimit(s);
      const worst = worstChoirCard(s, seat, want);
      const now = dayValue(st, altar, w);
      const o = pickBest(d.options, (o) => {
        if (o.id.startsWith('token:')) {
          const t = s.altarTokens[Number(o.id.slice(6))];
          const guess = tokenGuess(s, t, seat);
          return dayValue(st, altar - guess, w) - now + (t.by === seat ? tokenWorth(s, t.side, seat) : 0.5 * (tokenWorth(s, 'light', seat) + tokenWorth(s, 'dark', seat)));
        }
        const fromAltar = o.id.startsWith('altar');
        const ac = fromAltar ? s.altar[Number(o.id.slice(6))] : undefined;
        // A facedown card we have not seen: estimate it from who Offered it.
        const v = o.card !== undefined ? signed(s, o.card) : ac && ac.offeredBy !== null && ac.offeredBy >= 0 ? 0.6 * Math.sign(alignment(s, ac.offeredBy)) : 0;
        return dayValue(st, fromAltar ? altar - v : altar, w) - now + (o.card ? choirCardValue(s, o.card) : rulesOf(s).choirPay * 0.4 * daysAfter(s)) + engineVal(s, seat, o.card) - (room ? 0 : choirCardValue(s, worst?.id) + engineVal(s, seat, worst?.id));
      });
      return one(o.id);
    }
    case 'gather.to': {
      // Into the Choir if it is worth more there than in hand (after any card it would replace).
      const c = d.options.find((o) => o.id === 'choir')?.card;
      const p = s.players[seat], worst = p.choir.length < choirLimit(s) ? undefined : worstChoirCard(s, seat, want);
      const there = choirCardValue(s, c) + engineVal(s, seat, c) + 0.3 * (want >= 0 ? signed(s, c) : -signed(s, c)) - (worst ? choirCardValue(s, worst.id) + engineVal(s, seat, worst.id) : 0);
      return one(there > handCardValue(s, c) ? 'choir' : 'hand');
    }
    case 'spoils.pick': {
      // Spoils: a token of the side I hold more of, else the card most worth having (its ability, its Choir value, its push).
      const o = pickBest(d.options, (o) => {
        if (o.id.startsWith('token:')) { const t = s.altarTokens[Number(o.id.slice(6))]; return tokenWorth(s, t.side, seat) + (Math.sign(net) === (t.side === 'light' ? 1 : -1) ? 1 : 0); }
        return engineVal(s, seat, o.card) + choirCardValue(s, o.card) + 0.5 * (want >= 0 ? signed(s, o.card) : -signed(s, o.card));
      });
      return one(o.id);
    }
    case 'choir.discard':
    case 'plague':
    case 'absolution.discard':
    case 'watchers.discard': {
      const o = pickBest(d.options, (o) => -(want >= 0 ? signed(s, o.card) : -signed(s, o.card)));
      return one(o.id);
    }
    case 'watchers.take': {
      const o = pickBest(d.options, (o) => (want >= 0 ? signed(s, o.card) : -signed(s, o.card)));
      return one(o.id);
    }
    case 'activate': {
      const leaders = leaderSeats(s);
      // Tithe: each Host ability costs 1 Glory today. Use only the ones that pay at least that back.
      const tithe = s.currentEvent === E.tithe;
      const opts = d.options.filter((o) => o.id !== 'end').filter((o) => {
        if (tithe && o.card?.startsWith('host-') && !(o.card === H.mammon || o.card === H.providence || o.card === H.confession || o.card === H.envy || o.card === H.moloch)) return false;
        if (o.card === H.envy && leaders.includes(seat)) return false;
        if (o.card === H.abaddon) return dirOf(altar) !== wantDir && altar !== 0;
        if (o.card === H.moloch) return s.players[seat].choir.some((c) => c.id !== H.moloch && (want >= 0 ? signed(s, c.id) < 0 : signed(s, c.id) > 0));
        // Decided on your turn before the reveal: worth it late in the turn order, when the Day looks settled.
        const cc = choirColors(s, seat);
        const winning = dirOf(altar);
        const mine = winning === 'light' ? cc.light : winning === 'dark' ? cc.dark : 0;
        const theirs = winning === 'light' ? cc.dark : winning === 'dark' ? cc.light : 0;
        if (o.card === H.heresy) return winning !== 'neutral' && Math.abs(altar) >= 2 && theirs > mine && later <= 1;
        // Morning Star: turn one card of the losing color to the winning one.
        if (o.card === H.morningStar) return winning !== 'neutral' && theirs > 0 && later <= 1;
        if (o.card === H.mammon) {
          const st = s.players[seat].choir.find((c) => c.id === H.mammon)?.store ?? 0;
          return st >= 3 || daysAfter(s) === 0;
        }
        if (o.card === H.providence) {
          const st = s.players[seat].choir.find((c) => c.id === H.providence)?.store ?? 0;
          return st >= 3 || daysAfter(s) === 0;
        }
        if (o.card === H.freeWill) return s.players[seat].hand.length >= 2 && r < 0.4;
        if (o.card === H.anathema) return later >= 1 && r < 0.6;
        if (o.card === H.michael) return r < 0.6;
        if (o.card === H.silence) return leaders.some((l) => l !== seat) && r < 0.5;
        if (o.card === H.deliverance) return r < 0.25;
        if (o.card === H.temptation) return altar !== 0 && later <= 1;
        if (o.card === H.ordeal) { const c = choirColors(s, seat); return later <= 1 && ((altar > 1 && c.light >= 2) || (altar < -1 && c.dark >= 2)); }
        return true;
      });
      if (!opts.length || r < 0.08) return one('end');
      return one(opts[0].id);
    }
    case 'scapegoat.deny': {
      // Deny the leader, if they are gaining.
      const o = d.options.find((x) => x.seat !== undefined && leaderSeats(s, seat).includes(x.seat));
      return one(o ? o.id : 'none');
    }
    case 'revelation.hide': {
      // Hide a card that pushes our way, so it cannot be destroyed and rivals must remember it.
      const o = d.options.find((x) => x.card && dirOf(signed(s, x.card)) === wantDir);
      return one(o ? o.id : 'none');
    }
    case 'silence.player': {
      const o = byId((x) => x.seat !== undefined && leaderSeats(s, seat).includes(x.seat)) ?? d.options.find((x) => x.id !== 'none');
      return one(o ? o.id : 'none');
    }
    case 'bounty.player': {
      // A player leaning against the way the Altar is going is likely to lose. Decline (when allowed) if no one looks likely.
      // With an empty Altar (the Morning), bet on a player in the smaller side: the bigger side usually wins the Tide.
      const leans = s.players.map((p) => Math.sign(alignment(s, p.seat)));
      const bigger = Math.sign(leans.reduce((t, x) => t + x, 0));
      const likely = (x: Option) => {
        if (x.seat === undefined) return false;
        const l = Math.sign(alignment(s, x.seat));
        if (l === 0) return false;
        return altar !== 0 ? l !== Math.sign(altar) : bigger !== 0 && l !== bigger;
      };
      const o = d.options.find(likely) ?? (d.options.some((x) => x.id === 'none') ? undefined : pickBest(d.options, () => r));
      return one(o ? o.id : 'none');
    }
    case 'covenant.player':
      return one(r < 0.5 ? d.options[Math.floor(r * 2 * (d.options.length - 1))].id : 'none');
    case 'absolution':
    case 'oracle.use':
      return one('yes');
    case 'oracle.two':
      return one(pickBest(d.options, (o) => eventScore(s, seat, o.card) + r * 0.01).id);
    case 'revelation': {
      // Reveal the hidden card most likely to work against us (an opponent's Offering).
      const o = pickBest(d.options, (o) => {
        const a = s.altar[Number(o.id)];
        return a.offeredBy !== null && a.offeredBy >= 0 && a.offeredBy !== seat ? 1 - Math.abs(Math.sign(alignment(s, a.offeredBy)) - Math.sign(want)) * 0.3 + r * 0.1 : 0;
      });
      return one(o.id);
    }
    case 'knowledge':
      return d.options.slice(0, d.max).map((o) => o.id);
    case 'belial': {
      const o = pickBest(d.options, (o) => {
        const a = s.altar[Number(o.id)];
        return a.offeredBy === seat ? -1 : a.offeredBy !== null && a.offeredBy >= 0 ? Math.abs(alignment(s, a.offeredBy)) + r * 0.1 : 0.2;
      });
      return one(o.id);
    }
    case 'belial.swap': {
      const seen = d.reveal?.[0];
      if (!seen) return one('none');
      const keep = dayValue(st, altar, w);
      const after = (c: string | undefined) => dayValue(st, altar - signed(s, seen) + signed(s, c), w);
      const o = pickBest(d.options.filter((x) => x.card), (x) => after(x.card) + (want >= 0 ? signed(s, seen) : -signed(s, seen)) * 0.2);
      return one(o && after(o.card) > keep + 0.2 ? o.id : 'none');
    }
    case 'whisper':
    case 'prophecy':
      return one(wantDir === 'dark' ? 'dark' : 'light');
    case 'eclipse.early': {
      // In the Morning: turn a card of the side I want less toward the side I want.
      const o = byId((x) => x.card !== undefined && dirOf(signed(s, x.card)) !== wantDir && dirOf(signed(s, x.card)) !== 'neutral');
      return one(o ? o.id : 'none');
    }
    case 'lots': {
      const opts = ['light', 'dark', 'neutral'];
      return one(r < 0.5 ? (wantDir === 'neutral' ? 'light' : wantDir) : opts[Math.floor(r * 3) % 3]);
    }
    case 'vessel.hand': {
      const o = pickBest(d.options.filter((x) => x.card), (x) => (want >= 0 ? signed(s, x.card) : -signed(s, x.card)));
      return one(o ? o.id : 'none'); // the reward makes Vessel always worth using
    }
    case 'raphael':
    case 'azazel': {
      const o = d.options.find((x) => x.id !== 'none');
      return one(o && dirOf(altar) !== wantDir ? o.id : 'none');
    }
    case 'arbiter.take':
    case 'serpent.player': {
      const leaders = leaderSeats(s, seat);
      const o = byId((x) => x.seat !== undefined && leaders.includes(x.seat)) ?? d.options.find((x) => x.id !== 'none');
      return one(o ? o.id : d.options[0].id);
    }
    case 'michael.target': {
      const opts = d.options.filter((x) => x.seat !== undefined);
      if (!opts.length) return one('none');
      const o = pickBest(opts, (x) => {
        if (x.seat === seat) return -5;
        const v = signed(s, x.card);
        const theirNet = alignment(s, x.seat!);
        return Math.sign(theirNet) === Math.sign(v) ? Math.abs(v) + (leaderSeats(s).includes(x.seat!) ? 1 : 0) : 0;
      });
      return one(o.id);
    }
    case 'patron.player': {
      const o = pickBest(d.options, (x) => (leaderSeats(s, seat).includes(x.seat!) ? 1 : 0) + r);
      return one(o.id);
    }
    case 'patron.card': {
      const o = pickBest(d.options, (x) => -(want >= 0 ? signed(s, x.card) : -signed(s, x.card)) + (x.card === H.parasite ? 3 : 0));
      return one(o.id);
    }
    case 'tempest':
    case 'sanctuary': {
      const keepGood = d.tag !== 'tempest';
      const opts = d.options.filter((o) => o.id !== 'none');
      if (!opts.length) return one('none');
      const o = pickBest(opts, (x) => {
        const v = signed(s, x.card);
        const aligned = dirOf(v) === wantDir ? 1 : dirOf(v) === 'neutral' ? 0 : -1;
        return keepGood ? aligned : -aligned;
      });
      return one(o.id);
    }
    case 'winnowing.altar': {
      // Strike the facedown card of whoever leans hardest against you; skip your own and your allies'.
      const foe = (o: Option) => (o.seat === undefined || o.seat === seat ? 0 : -Math.sign(want) * alignment(s, o.seat));
      const o = pickBest(d.options.filter((x) => x.id !== 'none'), (x) => foe(x) + r * 0.01);
      return one(o && foe(o) > 0 ? o.id : has('none') ? 'none' : d.options[0].id);
    }
    case 'morningStar': {
      // Turn a card of the color likely to lose.
      const o = pickBest(d.options, (x) => (dirOf(signed(s, x.card)) === dirOf(-altar) ? 2 : 0) + r * 0.1);
      return one(o.id);
    }
    default: {
      const opts = d.options.filter((o) => o.id !== 'none');
      const pool = opts.length ? opts : d.options;
      return one(pool[Math.floor(r * pool.length) % pool.length].id);
    }
  }
}
