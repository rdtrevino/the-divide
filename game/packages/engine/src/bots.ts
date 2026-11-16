// Computer players. Heuristic, not perfect: they read their Choir's lean and the Altar,
// play toward a Tide that pays them, and answer every kind of decision sensibly.
import { alignment, baseValue, dirOf } from './core';
import { exaltCost as exaltCostFor } from './engine';
import { H } from './data';
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
  const t = dirOf(tide);
  if (t === 'neutral' || net === 0) return 0;
  const m = Math.min(3, Math.abs(net));
  return (dirOf(net) === t ? m : -m) * weight;
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
    const score = want >= 0 ? v : -v;
    if (score < bestScore) { bestScore = score; best = c; }
  }
  return { id: best.id, v: best.facedown ? 0 : signed(s, best.id) };
}

function cardIdOf(o: Option) {
  return o.card;
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

export function botAnswer(s: GameState, d: Decision): Answer {
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
      if (has('offer')) {
        const best = Math.max(...p.hand.map((c) => reapValue(net, altar + signed(s, c), w) + (dirOf(signed(s, c)) === wantDir ? 0.3 : 0)));
        scores.offer = 1 + best;
      }
      if (has('gather')) {
        const worst = worstChoirCard(s, seat, want);
        const room = p.choir.length < 3;
        let best = reapValue(net, altar, w) - 0.1;
        for (const a of s.altar) {
          if (!knows(a, seat)) continue;
          const v = signed(s, a.id);
          const newNet = net + v - (room ? 0 : worst?.v ?? 0);
          best = Math.max(best, reapValue(newNet, altar - v, w) + 0.15);
        }
        scores.gather = best;
      }
      if (has('exalt')) {
        const worst = worstChoirCard(s, seat, want);
        const room = p.choir.length < 3;
        const cost = exaltCostFor(s, seat);
        const best = Math.max(...p.hand.map((c) => reapValue(net + signed(s, c) - (room ? 0 : worst?.v ?? 0), altar, w)));
        scores.exalt = best - cost + 0.2;
      }
      const ids = Object.keys(scores);
      const choice = pickBest(ids, (x) => scores[x] + r * 0.4);
      return one(choice);
    }
    case 'offer.reward':
      return one(s.players[seat].hand.length <= 1 && r < 0.6 ? 'card' : 'glory');
    case 'celestial.pick': {
      const pref = ['celestial-the-eclipse', 'celestial-the-arbiter', 'celestial-the-whisper', 'celestial-the-dominion', 'celestial-the-cantor', 'celestial-the-echo', 'celestial-the-tempest', 'celestial-the-oracle', 'celestial-the-patron'];
      return one(pickBest(d.options, (o) => -pref.indexOf(o.id)).id);
    }
    case 'firstFruits':
    case 'offer.card':
    case 'exalt.card': {
      const o = pickBest(d.options, (o) => {
        const v = signed(s, o.card);
        if (d.tag === 'offer.card' || d.tag === 'firstFruits') return reapValue(net, altar + v, w) + (dirOf(v) === wantDir ? 0.5 : dirOf(v) === 'neutral' ? 0.1 : -0.3);
        return want >= 0 ? v : -v;
      });
      return one(o.id);
    }
    case 'offer.second': {
      const o = byId((x) => x.card !== undefined && dirOf(signed(s, x.card)) === wantDir);
      return one(o ? o.id : 'none');
    }
    case 'gather.source': {
      const p = s.players[seat];
      const room = p.choir.length < 3;
      const worst = worstChoirCard(s, seat, want);
      const o = pickBest(d.options, (o) => {
        if (o.id === 'deck') return reapValue(net, altar, w) + 0.05;
        if (o.id.startsWith('favor')) return reapValue(net, altar, w) + 0.1;
        const fromAltar = o.id.startsWith('altar');
        const ac = fromAltar ? s.altar[Number(o.id.slice(6))] : undefined;
        // A facedown card we have not seen: estimate it from who Offered it.
        const v = o.card !== undefined ? signed(s, o.card) : ac && ac.offeredBy !== null && ac.offeredBy >= 0 ? 0.6 * Math.sign(alignment(s, ac.offeredBy)) : 0;
        return reapValue(net + v - (room ? 0 : worst?.v ?? 0), fromAltar ? altar - v : altar, w) + (fromAltar ? 0.1 : 0);
      });
      return one(o.id);
    }
    case 'upkeep.keep':
    case 'choir.discard':
    case 'plague':
    case 'patron.discard':
    case 'absolution.discard':
    case 'temptation.discard':
    case 'treeOfLife.discard':
    case 'remnant.discard':
    case 'favor.give': {
      const o = pickBest(d.options, (o) => -(want >= 0 ? signed(s, o.card) : -signed(s, o.card)));
      return one(o.id);
    }
    case 'temptation':
    case 'treeOfLife.take': {
      const o = pickBest(d.options, (o) => (want >= 0 ? signed(s, o.card) : -signed(s, o.card)));
      return one(o.id);
    }
    case 'activate': {
      const leaders = leaderSeats(s);
      const opts = d.options.filter((o) => o.id !== 'end').filter((o) => {
        if (o.card === H.envy && leaders.includes(seat)) return false;
        if (o.card === H.abaddon) return dirOf(altar) !== wantDir && altar !== 0;
        if (o.card === H.moloch) return s.players[seat].choir.some((c) => c.id !== H.moloch && (want >= 0 ? signed(s, c.id) < 0 : signed(s, c.id) > 0));
        if (o.card === H.mercy) return dirOf(altar) !== wantDir && altar !== 0 && later <= 1;
        if (o.card === H.defiance) return r < 0.3;
        if (o.card === H.deliverance) return r < 0.25;
        if (o.card === H.council) return r < 0.2;
        if (o.card === H.ordeal) return dirOf(altar) === wantDir && later <= 1;
        if (o.id.startsWith('restore')) return true;
        return true;
      });
      if (!opts.length || r < 0.08) return one('end');
      return one(opts[0].id);
    }
    case 'silence': {
      const actorMatch = /^(.*) is activating/.exec(d.prompt);
      const leader = leaderSeats(s)[0];
      const actor = s.players.find((p) => actorMatch && p.name === actorMatch[1]);
      return one(actor && actor.seat === leader && r < 0.5 ? 'yes' : r < 0.1 ? 'yes' : 'no');
    }
    case 'heresy':
    case 'figLeaves': {
      const t = s.tides[s.tides.length - 1];
      return one(t && t.dir !== dirOf(net) ? 'yes' : 'no');
    }
    case 'freeWill':
    case 'absolution':
    case 'oracle.use':
      return one('yes');
    case 'oracle':
      return one(r < 0.3 ? 'bury' : 'play');
    case 'ithuriel': {
      // Reveal the hidden card most likely to work against us (an opponent's Offering).
      const o = pickBest(d.options, (o) => {
        const a = s.altar[Number(o.id)];
        return a.offeredBy !== null && a.offeredBy >= 0 && a.offeredBy !== seat ? 1 - Math.abs(Math.sign(alignment(s, a.offeredBy)) - Math.sign(want)) * 0.3 + r * 0.1 : 0;
      });
      return one(o.id);
    }
    case 'urim':
      return d.options.slice(0, d.max).map((o) => o.id);
    case 'asmadai': {
      const o = pickBest(d.options, (o) => {
        const a = s.altar[Number(o.id)];
        return a.offeredBy === seat ? -1 : a.offeredBy !== null && a.offeredBy >= 0 ? Math.abs(alignment(s, a.offeredBy)) + r * 0.1 : 0.2;
      });
      return one(o.id);
    }
    case 'asmadai.swap': {
      const seen = d.reveal?.[0];
      if (!seen) return one('none');
      const keep = reapValue(net, altar, w);
      const base = altar;
      const o = pickBest(d.options.filter((x) => x.card), (x) => reapValue(net, base - signed(s, seen) + signed(s, x.card), w) + (want >= 0 ? signed(s, seen) : -signed(s, seen)) * 0.2);
      return one(o && reapValue(net, base - signed(s, seen) + signed(s, o.card), w) > keep + 0.2 ? o.id : 'none');
    }
    case 'council.vote':
      return one(r < 0.5 ? 'yes' : 'no');
    case 'wisdom': {
      const top = d.reveal?.[0];
      return one(top && dirOf(signed(s, top)) !== wantDir ? 'yes' : 'no');
    }
    case 'whisper':
    case 'prophecy':
      return one(wantDir === 'dark' ? 'dark' : 'light');
    case 'lots': {
      const opts = ['light', 'dark', 'neutral'];
      return one(r < 0.5 ? (wantDir === 'neutral' ? 'light' : wantDir) : opts[Math.floor(r * 3) % 3]);
    }
    case 'eclipse': {
      const t = s.tides[s.tides.length - 1];
      if (!t || t.dir === 'neutral') return one('none');
      const bad = byId((o) => o.card !== undefined && dirOf(signed(s, o.card)) !== t.dir && dirOf(signed(s, o.card)) !== 'neutral');
      return one(bad ? bad.id : 'none');
    }
    case 'raphael':
    case 'azazel': {
      const o = d.options.find((x) => x.id !== 'none');
      return one(o && dirOf(altar) !== wantDir ? o.id : 'none');
    }
    case 'mammon.offer':
    case 'mammon.exalt':
    case 'arbiter.take':
    case 'anathema':
    case 'winnowing':
    case 'scapegoat':
    case 'serpent.player': {
      const leaders = leaderSeats(s, seat);
      const o = byId((x) => x.seat !== undefined && leaders.includes(x.seat)) ?? d.options.find((x) => x.id !== 'none');
      return one(o ? o.id : d.options[0].id);
    }
    case 'arbiter.give': {
      const o = pickBest(d.options, (x) => -(s.players[x.seat ?? 0]?.glory ?? 0));
      return one(o.id);
    }
    case 'michael.target': {
      const o = pickBest(d.options, (x) => {
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
    case 'sanctuary':
    case 'eternity':
    case 'remnant': {
      const keepGood = d.tag !== 'tempest';
      const opts = d.options.filter((o) => o.id !== 'none');
      if (!opts.length) return one('none');
      const o = pickBest(opts, (x) => {
        const v = signed(s, x.card);
        const aligned = dirOf(v) === wantDir ? 1 : dirOf(v) === 'neutral' ? 0 : -1;
        return keepGood ? aligned : -aligned;
      });
      if (d.tag === 'remnant' && r < 0.5) return one('none');
      return one(o.id);
    }
    case 'providence':
    case 'martyr':
    case 'council.swap': {
      const o = pickBest(d.options, (x) => {
        if (x.id === 'none' || x.id === 'skip') return 0;
        const [out, inn] = x.id.includes('|') ? x.id.split('|') : ['', ''];
        const tIn = d.tag === 'providence' ? x.card : inn;
        const tOut = d.tag === 'providence' ? x.id.split('|')[1] : out;
        const gainV = (want >= 0 ? 1 : -1) * (signed(s, tIn) - signed(s, tOut));
        return gainV;
      });
      return one(o.id);
    }
    case 'morningStar': {
      const t = altar;
      const o = pickBest(d.options, (x) => (dirOf(signed(s, x.card)) !== dirOf(t) ? 1 : 0) + r * 0.1);
      return one(o.id);
    }
    default: {
      const opts = d.options.filter((o) => o.id !== 'none');
      const pool = opts.length ? opts : d.options;
      return one(pool[Math.floor(r * pool.length) % pool.length].id);
    }
  }
}

export { cardIdOf };
