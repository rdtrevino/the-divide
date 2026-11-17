// Computer players. Heuristic, not perfect: they read their Choir's lean and the Altar,
// play toward a Tide that pays them, and answer every kind of decision sensibly.
import { alignment, baseValue, choirLimit, dirOf } from './core';
import { exaltCost as exaltCostFor, gloryTarget } from './engine';
import { H, cardName as cardNameOf } from './data';
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
  // V41 coalition scoring: alone with the Tide 3; two, 2 for the stronger and 1 for the weaker; three or more 0; against it, -1.
  const t = dirOf(tide);
  if (t === 'neutral' || net === 0) return 0;
  if (dirOf(net) !== t) return -weight;
  const same = OTHERS.filter((o) => o !== 0 && Math.sign(o) === Math.sign(net));
  const v = same.length === 0 ? 3 : same.length === 1 ? (Math.abs(net) > Math.abs(same[0]) ? 2 : 1) : 0;
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

/** Other players' leans, read once per decision (for coalition scoring). */
let OTHERS: number[] = [];
export function botAnswer(s: GameState, d: Decision): Answer {
  OTHERS = s.players.filter((p) => p.seat !== d.seat).map((p) => alignment(s, p.seat));
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
    if (d.tag === 'choir.pick') {
      // Lean hard one way: take the strongest cards of whichever color the hand favors.
      const by = (sign: number) => [...d.options].sort((a, b) => sign * (signed(s, b.card) - signed(s, a.card))).slice(0, d.min);
      const sum = (os: Option[], sign: number) => os.reduce((t, o) => t + sign * signed(s, o.card), 0);
      const L = by(1), D = by(-1);
      const pick = sum(L, 1) > sum(D, -1) || (sum(L, 1) === sum(D, -1) && r < 0.5) ? L : D;
      return pick.map((o) => o.id);
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
      const target = gloryTarget(s);
      const rem = Math.max(1, Math.min(4, (target - Math.max(...s.players.map((x) => x.glory))) / 4));
      const fut = (n1: number) => rem * 0.3 * (Math.min(3, Math.abs(n1)) - Math.min(3, Math.abs(net)));
      if (has('offer')) {
        const best = Math.max(...p.hand.map((c) => reapValue(net, altar + signed(s, c), w) + (dirOf(signed(s, c)) === wantDir ? 0.3 : 0)));
        scores.offer = 1 + best;
      }
      if (has('gather')) {
        const worst = worstChoirCard(s, seat, want);
        const room = p.choir.length < choirLimit(s);
        let best = reapValue(net, altar, w) - 0.1;
        for (const a of s.altar) {
          if (!knows(a, seat)) continue;
          const v = signed(s, a.id);
          const newNet = net + v - (room ? 0 : worst?.v ?? 0);
          best = Math.max(best, reapValue(newNet, altar - v, w) + 0.15 + fut(newNet));
        }
        if (p.choir.some((c) => c.id === H.forger && !c.facedown)) {
          for (const c of new Set(s.discard)) best = Math.max(best, reapValue(net + signed(s, c) - (room ? 0 : worst?.v ?? 0), altar, w) + 0.15);
        }
        scores.gather = best;
      }
      if (has('exalt')) {
        const worst = worstChoirCard(s, seat, want);
        const room = p.choir.length < choirLimit(s);
        const cost = exaltCostFor(s, seat);
        const best = Math.max(...p.hand.map((c) => { const n1 = net + signed(s, c) - (room ? 0 : worst?.v ?? 0); return reapValue(n1, altar, w) + fut(n1); }));
        scores.exalt = best - cost + 0.2;
      }
      const ids = Object.keys(scores);
      const choice = pickBest(ids, (x) => scores[x] + r * 0.4);
      return one(choice);
    }
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
      const room = p.choir.length < choirLimit(s);
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
    case 'watchers.discard':
    case 'remnant.discard':
    case 'favor.give': {
      const o = pickBest(d.options, (o) => -(want >= 0 ? signed(s, o.card) : -signed(s, o.card)));
      return one(o.id);
    }
    case 'temptation':
    case 'watchers.take':
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
        // V42 team tools, decided on your turn before the reveal.
        const sharing = OTHERS.filter((x) => x !== 0 && Math.sign(x) === Math.sign(net)).length;
        if (o.card === H.heresy) return net !== 0 && altar !== 0 && dirOf(altar) !== dirOf(net) && later <= 1;
        if (o.card === H.figLeaves) return net !== 0 && (sharing >= 2 || (altar !== 0 && dirOf(altar) !== dirOf(net) && later <= 1));
        if (o.card === H.morningStar) return false;
        if (o.card === H.providence) {
          const st = s.players[seat].choir.find((c) => c.id === H.providence)?.store ?? 0;
          return st >= 3 || Math.max(...s.players.map((x) => x.glory)) >= 7;
        }
        if (o.card === H.parasite) return want > 0;
        if (o.card === H.freeWill) return s.players[seat].hand.length >= 2 && r < 0.4;
        if (o.card === H.anathema) return altar !== 0 && dirOf(altar) === wantDir && later >= 1;
        if (o.card === H.michael) return leaders.some((l) => l !== seat) && r < 0.5;
        if (o.card === H.silence) return leaders.some((l) => l !== seat) && r < 0.5;
        if (o.card === H.deliverance) return r < 0.25;
        if (o.card === H.deliverance) return r < 0.25;
        if (o.card === H.council) {
          const p = s.players[seat];
          return p.choir.filter((c) => c.id.startsWith('host-')).some((c) => p.hand.some((h) => (want >= 0 ? 1 : -1) * (signed(s, h) - signed(s, c.id)) > 0));
        }
        if (o.card === H.ordeal) return dirOf(altar) === wantDir && later <= 1;
        if (o.id.startsWith('restore')) return false; // V38: wait for the Reaping, when the Tide is known
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
    case 'scapegoat.deny': {
      // Deny the leader, if they are gaining.
      const o = d.options.find((x) => x.seat !== undefined && leaderSeats(s, seat).includes(x.seat));
      return one(o ? o.id : 'none');
    }
    case 'scapegoat.sac': {
      // Sacrifice the stronger partner (they would take the 2), or anyone in a crowd.
      const o = pickBest(d.options.filter((x) => x.seat !== undefined), (x) => Math.abs(alignment(s, x.seat!)));
      return one(o ? o.id : 'none');
    }
    case 'revelation.hide': {
      // Hide a card that pushes our way, so it cannot be destroyed and rivals must remember it.
      const o = d.options.find((x) => x.card && dirOf(signed(s, x.card)) === wantDir);
      return one(o ? o.id : 'none');
    }
    case 'tree.take': {
      // Take the Altar card that most improves the lean (in the direction we want), if any does.
      const worst = worstChoirCard(s, seat, want);
      const room = s.players[seat].choir.length < choirLimit(s);
      const gain = (o: Option) => { const v = signed(s, o.card); return (want >= 0 ? v : -v) - (room ? 0 : (want >= 0 ? worst?.v ?? 0 : -(worst?.v ?? 0))); };
      const best = pickBest(d.options.filter((o) => o.id !== 'none'), gain);
      return one(best && gain(best) > 0 ? best.id : 'none');
    }
    case 'mercy.other':
      return one(d.options.find((o) => o.id !== 'none' && o.seat !== undefined && !leaderSeats(s, seat).includes(o.seat))?.id ?? 'none');
    case 'silence.player':
    case 'flamingSword.player': {
      const o = byId((x) => x.seat !== undefined && leaderSeats(s, seat).includes(x.seat)) ?? d.options.find((x) => x.id !== 'none');
      return one(o ? o.id : 'none');
    }
    case 'bounty.player': {
      // A player leaning against the way the Altar is going is likely to lose.
      const o = pickBest(d.options, (x) => (x.seat === undefined ? -9 : dirOf(alignment(s, x.seat)) !== dirOf(altar) && alignment(s, x.seat) !== 0 ? 1 + r : r));
      return one(o.id);
    }
    case 'covenant.player':
      return one(r < 0.5 ? d.options[Math.floor(r * 2 * (d.options.length - 1))].id : 'none');
    case 'mercy':
    case 'freeWill':
    case 'absolution':
    case 'oracle.use':
      return one('yes');
    case 'oracle':
      return one(r < 0.3 ? 'bury' : 'play');
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
    case 'eclipse.early': {
      if (altar === 0) return one('none');
      const bad = byId((o) => o.card !== undefined && dirOf(signed(s, o.card)) !== dirOf(altar) && dirOf(signed(s, o.card)) !== 'neutral');
      return one(bad ? bad.id : 'none');
    }
    case 'morningStar.reap': {
      const t = s.tides[s.tides.length - 1];
      if (!t || t.dir === 'neutral') return one('none');
      const score = (n: number) => (n === 0 ? 0 : (dirOf(n) === t.dir ? 1 : -1) * Math.min(3, Math.abs(n)));
      const now = alignment(s, seat, { reaping: true });
      let best = 'none', bv = score(now) + 1.5; // costs 1 Glory
      for (const o of d.options) { if (!o.card) continue; const v = signed(s, o.card); const sc = score(now - 2 * v); if (sc > bv) { bv = sc; best = o.id; } }
      return one(best);
    }
    case 'vessel.hand': {
      const o = pickBest(d.options.filter((x) => x.card), (x) => (want >= 0 ? signed(s, x.card) : -signed(s, x.card)));
      return one(o ? o.id : 'none'); // the reward makes Vessel always worth using
    }
    case 'doubler.pay': {
      const t = s.tides[s.tides.length - 1];
      if (!t || t.dir === 'neutral') return one('no');
      const score = (n: number) => (n === 0 ? 0 : (dirOf(n) === t.dir ? 1 : -1) * Math.min(3, Math.abs(n)));
      const now = alignment(s, seat, { reaping: true });
      const id = d.prompt.startsWith('Uriel') ? H.uriel : H.beelzebub;
      const store = ((s.day_ as any).doublerPaid ??= {});
      const before = store[seat];
      store[seat] = [...(before ?? []), id];
      const doubled = alignment(s, seat, { reaping: true });
      if (before) store[seat] = before; else delete store[seat];
      return one(score(doubled) - score(now) >= 2 ? 'yes' : 'no');
    }
    case 'eternity.hand': {
      const o = pickBest(d.options.filter((x) => x.card), (x) => -(want >= 0 ? signed(s, x.card) : -signed(s, x.card)));
      return one(o && (want >= 0 ? signed(s, o.card) : -signed(s, o.card)) < 0 ? o.id : 'none');
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
    case 'arbiter.take':
    case 'anathema':
    case 'winnowing':
    case 'scapegoat':
    case 'serpent.player': {
      const leaders = leaderSeats(s, seat);
      const o = byId((x) => x.seat !== undefined && leaders.includes(x.seat)) ?? d.options.find((x) => x.id !== 'none');
      return one(o ? o.id : d.options[0].id);
    }
    case 'mammon.exalt':
    case 'arbiter.give': {
      // Giving Glory away: hand it to whoever is least threatening.
      const o = pickBest(d.options, (x) => -(s.players[x.seat ?? 0]?.glory ?? 0));
      return one(o.id);
    }
    case 'michael.restore': {
      const t = s.tides[s.tides.length - 1];
      const card = /Flip (.*) face up/.exec(d.prompt)?.[1];
      const c = s.players[seat].choir.find((x) => x.facedown && cardNameOf(x.id) === card);
      if (!t || !c) return one('no');
      const now = alignment(s, seat, { reaping: true });
      const score = (n: number) => (t.dir === 'neutral' || n === 0 ? 0 : (dirOf(n) === t.dir ? 1 : -1) * Math.min(3, Math.abs(n)));
      return one(score(now + signed(s, c.id)) - score(now) >= 2 ? 'yes' : 'no');
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
      if (d.tag === 'providence' && o.id !== 'none') { // Providence costs 1 Glory
        const [i, out] = o.id.split('|');
        const g = (want >= 0 ? 1 : -1) * (signed(s, s.altar[Number(i)]?.id) - signed(s, out));
        if (g < 2) return one('none');
      }
      return one(o.id);
    }
    case 'council.tollswap': {
      const o = pickBest(d.options, (x) => {
        if (x.id === 'skip') return 0;
        const [out, inn] = x.id.split('|');
        return (want >= 0 ? 1 : -1) * (signed(s, inn) - signed(s, out)) - 1.25;
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
