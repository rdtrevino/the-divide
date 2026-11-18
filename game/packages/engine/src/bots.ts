// Computer players. Heuristic, not perfect: they read their Choir's lean and the Altar,
// play toward a Tide that pays them, and answer every kind of decision sensibly.
import { CHOIR_LIMIT, alignment, baseValue, dirOf, hasActive } from './core';
import { GLORY_TARGET } from './engine';
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
  return n;
}

/** Expected Reaping value of a Choir net under an estimated Tide. */
function reapValue(net: number, tide: number, weight = 0.7) {
  // With the Tide: alone 3, two 1 each, three or more 0. Against it: alone -3, otherwise -1.
  const t = dirOf(tide);
  if (t === 'neutral' || net === 0) return 0;
  const same = OTHERS.filter((o) => o !== 0 && Math.sign(o) === Math.sign(net));
  if (dirOf(net) !== t) return SPARED ? 0 : -weight * (same.length === 0 ? 3 : 1);
  const v = same.length === 0 ? 3 : same.length === 1 ? 1 : 0;
  return v * weight;
}

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

/** Other players' leans, read once per decision (for coalition scoring). */
let OTHERS: number[] = [];
/** Purgatory (V44): on a Purgatory Day no Choir loses at the Reaping. */
let SPARED = false;
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
  if (id === H.remnant) return CHOIR_LIMIT - s.players[seat].choir.length > 2 ? 0.8 : 0;
  return ENGINE_RATE[id] ?? 0;
}
function daysLeft(s: GameState) {
  return Math.max(1, Math.min(6, (GLORY_TARGET - Math.max(...s.players.map((x) => x.glory))) / 1.6));
}
const engineVal = (s: GameState, seat: Seat, id: string | undefined) => engineRate(s, seat, id) * daysLeft(s);

/** Temptation: what playing `card` into `o`'s Choir is worth to a player who wants `want`. */
function corruptValue(s: GameState, want: number, card: string | undefined, o: Seat): number {
  if (!card) return 0;
  const on = alignment(s, o);
  const nn = on + signed(s, card);
  if (on === 0 || Math.sign(nn) === Math.sign(on)) return 0;
  // Pull a partner off my side, so I lean alone (+3 instead of +1).
  if (Math.sign(on) === Math.sign(want)) return 1.6;
  // Push a rival over to my side only if that does not crowd it; push the leader off their side.
  const lead = Math.max(...s.players.map((x) => x.glory));
  return s.players[o].glory === lead ? 1.0 : 0.3;
}
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
    case E.purgatory: return trailing ? 1 : 0.2;
    case E.castingLots: return trailing ? 0.5 : leading ? -0.5 : 0;
    case E.divineCalling: return 0.3;
    default: return 0;
  }
}
const HOSTTEXT = (id: string) => HOST[id]?.text ?? '';

export function botAnswer(s: GameState, d: Decision): Answer {
  OTHERS = s.players.filter((p) => p.seat !== d.seat).map((p) => alignment(s, p.seat));
  SPARED = s.currentEvent === E.purgatory;
  const r = rand(d.id * 7919 + d.seat * 104729 + (s.config.seed | 0));
  const seat = d.seat;
  const net = alignment(s, seat);
  const want = net !== 0 ? net : altarNet(s, seat) || 1;
  const wantDir: Dir = dirOf(want);
  const one = (id: string) => [id];
  const has = (id: string) => d.options.some((o) => o.id === id);
  const byId = (pred: (o: Option) => boolean) => d.options.find(pred);
  const altar = altarNet(s, seat);
  const later = laterPlayers(s, seat);
  const w = later === 0 ? 1 : later === 1 ? 0.75 : 0.55;

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
    case 'action': {
      const p = s.players[seat];
      const scores: Record<string, number> = {};
      // A Choir card keeps paying at later Reapings, so building is worth more early in the game.
      const rem = Math.max(1, Math.min(4, (GLORY_TARGET - Math.max(...s.players.map((x) => x.glory))) / 4));
      const fut = (n1: number) => rem * 0.3 * (Math.min(3, Math.abs(n1)) - Math.min(3, Math.abs(net)));
      if (has('offer')) {
        const best = Math.max(...p.hand.map((c) => reapValue(net, altar + signed(s, c), w) + (dirOf(signed(s, c)) === wantDir ? 0.3 : 0)));
        scores.offer = 1 + best;
      }
      if (has('gather')) {
        const worst = worstChoirCard(s, seat, want);
        const room = p.choir.length < CHOIR_LIMIT;
        let best = reapValue(net, altar, w) - 0.1;
        for (const a of s.altar) {
          if (!knows(a, seat)) continue;
          const v = signed(s, a.id);
          const newNet = net + v - (room ? 0 : worst?.v ?? 0);
          best = Math.max(best, reapValue(newNet, altar - v, w) + 0.15 + fut(newNet) + engineVal(s, seat, a.id) - (room ? 0 : engineVal(s, seat, worst?.id)));
        }
        if (p.choir.some((c) => c.id === H.forger && !c.facedown)) {
          for (const c of new Set(s.discard)) best = Math.max(best, reapValue(net + signed(s, c) - (room ? 0 : worst?.v ?? 0), altar, w) + 0.15);
        }
        scores.gather = best;
      }
      if (has('exalt')) {
        const worst = worstChoirCard(s, seat, want);
        const room = p.choir.length < CHOIR_LIMIT;
        // Seraphim and Legion pay 1 Glory for Exalting a card of their color.
        const refund = (c: string) => ((hasActive(s, seat, H.seraphim) && signed(s, c) > 0) || (hasActive(s, seat, H.legion) && signed(s, c) < 0) ? 1 : 0);
        const best = Math.max(...p.hand.map((c) => { const n1 = net + signed(s, c) - (room ? 0 : worst?.v ?? 0); return reapValue(n1, altar, w) + fut(n1) + engineVal(s, seat, c) - (room ? 0 : engineVal(s, seat, worst?.id)) + refund(c); }));
        scores.exalt = Math.max(best, 0) + 0.2 + (s.currentEvent === E.divineCalling ? 1 : 0);
      }
      const ids = Object.keys(scores);
      const choice = pickBest(ids, (x) => scores[x] + r * 0.4);
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
    case 'figLeaves.evening': {
      const sharing = OTHERS.filter((x) => x !== 0 && Math.sign(x) === Math.sign(net)).length;
      return one(net !== 0 && (sharing >= 2 || (altar !== 0 && dirOf(altar) !== dirOf(net))) ? 'yes' : 'no');
    }
    case 'lilith.take':
      return one('yes');
    case 'parasite.target': {
      const leaders = leaderSeats(s, seat);
      const o = byId((x) => x.seat !== undefined && leaders.includes(x.seat)) ?? d.options[0];
      return one(o.id);
    }
    case 'temptation.give': {
      const o = pickBest(d.options.filter((x) => x.seat !== undefined), (x) => corruptValue(s, want, x.card, x.seat!) - 0.3 * engineVal(s, seat, x.card));
      return one(o && corruptValue(s, want, o.card, o.seat!) > 0 ? o.id : 'none');
    }
    case 'firstFruits':
    case 'offer.card':
    case 'exalt.card': {
      const o = pickBest(d.options, (o) => {
        const v = signed(s, o.card);
        if (d.tag === 'offer.card' || d.tag === 'firstFruits') return reapValue(net, altar + v, w) + (dirOf(v) === wantDir ? 0.5 : dirOf(v) === 'neutral' ? 0.1 : -0.3);
        return (want >= 0 ? v : -v) + engineVal(s, seat, o.card);
      });
      return one(o.id);
    }
    case 'offer.second': {
      // The Cantor's second Offer earns its own reward, so a Neutral card is worth Offering too.
      const o = byId((x) => x.card !== undefined && dirOf(signed(s, x.card)) === wantDir) ?? byId((x) => x.card !== undefined && signed(s, x.card) === 0);
      return one(o ? o.id : 'none');
    }
    case 'gather.source': {
      const p = s.players[seat];
      const room = p.choir.length < CHOIR_LIMIT;
      const worst = worstChoirCard(s, seat, want);
      const o = pickBest(d.options, (o) => {
        const fromAltar = o.id.startsWith('altar');
        const ac = fromAltar ? s.altar[Number(o.id.slice(6))] : undefined;
        // A facedown card we have not seen: estimate it from who Offered it.
        const v = o.card !== undefined ? signed(s, o.card) : ac && ac.offeredBy !== null && ac.offeredBy >= 0 ? 0.6 * Math.sign(alignment(s, ac.offeredBy)) : 0;
        return reapValue(net + v - (room ? 0 : worst?.v ?? 0), fromAltar ? altar - v : altar, w) + (fromAltar ? 0.1 : 0) + engineVal(s, seat, o.card) - (room ? 0 : engineVal(s, seat, worst?.id));
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
        // V42 team tools, decided on your turn before the reveal.
        const sharing = OTHERS.filter((x) => x !== 0 && Math.sign(x) === Math.sign(net)).length;
        if (o.card === H.heresy) return net !== 0 && altar !== 0 && dirOf(altar) !== dirOf(net) && later <= 1;
        if (o.card === H.figLeaves) return net !== 0 && (sharing >= 2 || (altar !== 0 && dirOf(altar) !== dirOf(net) && later <= 1));
        // Morning Star: late in the turn order, flip one card if that turns your lean toward the Altar.
        if (o.card === H.morningStar) return altar !== 0 && net !== 0 && dirOf(altar) !== dirOf(net) && later <= 1 && s.players[seat].choir.some((c) => !c.facedown && dirOf(net - 2 * signed(s, c.id)) === dirOf(altar));
        if (o.card === H.mammon) {
          const st = s.players[seat].choir.find((c) => c.id === H.mammon)?.store ?? 0;
          return st >= 3 || Math.max(...s.players.map((x) => x.glory)) >= 7;
        }
        if (o.card === H.providence) {
          const st = s.players[seat].choir.find((c) => c.id === H.providence)?.store ?? 0;
          return st >= 3 || Math.max(...s.players.map((x) => x.glory)) >= 7;
        }
        if (o.card === H.freeWill) return s.players[seat].hand.length >= 2 && r < 0.4;
        if (o.card === H.anathema) return altar !== 0 && dirOf(altar) === wantDir && later >= 1;
        if (o.card === H.michael) return r < 0.6;
        if (o.card === H.silence) return leaders.some((l) => l !== seat) && r < 0.5;
        if (o.card === H.deliverance) return r < 0.25;
        if (o.card === H.temptation) return s.players[seat].hand.some((c) => s.players.some((x) => x.seat !== seat && corruptValue(s, want, c, x.seat) > 0));
        if (o.card === H.ordeal) return dirOf(altar) === wantDir && later <= 1;
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
    case 'mercy':
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
      const keep = reapValue(net, altar, w);
      const base = altar;
      const o = pickBest(d.options.filter((x) => x.card), (x) => reapValue(net, base - signed(s, seen) + signed(s, x.card), w) + (want >= 0 ? signed(s, seen) : -signed(s, seen)) * 0.2);
      return one(o && reapValue(net, base - signed(s, seen) + signed(s, o.card), w) > keep + 0.2 ? o.id : 'none');
    }
    case 'whisper':
    case 'prophecy':
      return one(wantDir === 'dark' ? 'dark' : 'light');
    case 'lots': {
      const opts = ['light', 'dark', 'neutral'];
      return one(r < 0.5 ? (wantDir === 'neutral' ? 'light' : wantDir) : opts[Math.floor(r * 3) % 3]);
    }
    case 'eclipse.early': {
      if (altar === 0) return one('none');
      const bad = byId((o) => o.card !== undefined && dirOf(signed(s, o.card)) !== dirOf(altar) && dirOf(signed(s, o.card)) !== 'neutral');
      return one(bad ? bad.id : 'none');
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
      const t = altar;
      const o = pickBest(d.options, (x) => (dirOf(net - 2 * signed(s, x.card)) === dirOf(t) ? 2 : 0) + (dirOf(signed(s, x.card)) !== dirOf(t) ? 1 : 0) + r * 0.1);
      return one(o.id);
    }
    default: {
      const opts = d.options.filter((o) => o.id !== 'none');
      const pool = opts.length ? opts : d.options;
      return one(pool[Math.floor(r * pool.length) % pool.length].id);
    }
  }
}
