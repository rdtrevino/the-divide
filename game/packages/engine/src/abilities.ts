// Abilities a player activates on their own turn, after their action:
// "On your turn" Host abilities, once-per-game Host abilities, and Celestial turn powers.
import { C, H, HOST, cardName } from './data';
import {
  activeCards, altarAvailable, altarLabel, ask, askAll, canAffordTribute, cardOpt, chooseOne, discardFromChoir,
  drawHost, drawTo, enterChoir, gain, handLimit, hasActive, log, lose, markToday, others, payTribute, peekHost,
  pname, protectedFrom, removeFromChoir, seatFromOpt, seatOpt, stat, targetableChoir, usedToday, yesNo, CHOIR_LIMIT,
  colorsOf, activation, altarShielded, altarPeekable,
} from './core';
import { randInt } from './rng';
import type { Gen, GameState, Seat } from './types';

export interface TurnAbility {
  once?: 'game' | 'day';
  /** Whether the ability has at least one legal use right now. */
  can: (s: GameState, seat: Seat) => boolean;
  run: (s: GameState, seat: Seat) => Gen<void>;
}

const hostCardsOf = (s: GameState, seat: Seat) => s.players[seat].choir.filter((c) => c.id.startsWith('host-'));
const leaders = (s: GameState) => {
  const max = Math.max(...s.players.map((p) => p.glory));
  return s.players.filter((p) => p.glory === max);
};

function flipTargets(s: GameState, seat: Seat) {
  const out: { owner: Seat; id: string }[] = [];
  for (const p of s.players) {
    const cards = p.seat === seat ? hostCardsOf(s, seat) : targetableChoir(s, seat, p.seat, 'flip');
    for (const c of cards) if (!c.facedown) out.push({ owner: p.seat, id: c.id });
  }
  return out;
}

/** Abilities that can be re-activated by Seraphim, Legion, and the Echo (repeatable turn abilities only). */
export function repeatable(id: string): boolean {
  const a = TURN[id];
  return !!a && !a.once && id !== H.seraphim && id !== H.legion;
}

export const TURN: Record<string, TurnAbility> = {
  [H.michael]: {
    can: (s, seat) => flipTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = flipTargets(s, seat);
      const pick = yield* chooseOne(s, seat, 'michael.target', 'Michael: Flip a Host card in any Choir Facedown.', t.map((x) => ({ id: `${x.owner}:${x.id}`, label: `${cardName(x.id)} (${pname(s, x.owner)})`, card: x.id, seat: x.owner })));
      if (!pick) return;
      const [o, id] = pick.split(':');
      const owner = Number(o);
      if (!(yield* payTribute(s, seat, owner))) return;
      const c = s.players[owner].choir.find((x) => x.id === id);
      if (c) c.facedown = true;
      log(s, 'michael', `${pname(s, seat)} turned ${cardName(id)} in ${pname(s, owner)}'s Choir Facedown.`);
    },
  },
  [H.wisdom]: {
    can: (s) => s.hostDeck.length + s.discard.length > 0,
    *run(s, seat) {
      const [top] = peekHost(s, 1);
      if (!top) return;
      const discard = yield* ask(s, { seat, tag: 'wisdom', prompt: `Wisdom: the top Host card is ${cardName(top)}. Discard it?`, options: [{ id: 'yes', label: 'Discard it' }, { id: 'no', label: 'Leave it on top' }], min: 1, max: 1, reveal: [top] });
      log(s, 'peek', `${pname(s, seat)} looked at the top card of the Host deck.`, 'public');
      log(s, 'peek', `You saw ${cardName(top)} on top of the Host deck.`, [seat]);
      if (discard[0] === 'yes') {
        s.hostDeck.shift();
        s.discard.push(top);
        log(s, 'wisdom', `${pname(s, seat)} discarded ${cardName(top)} from the top of the Host deck.`);
      }
    },
  },
  [H.gabriel]: {
    can: (s) => s.eventDeck.length > 0,
    *run(s, seat) {
      const top = s.eventDeck[0];
      log(s, 'peek', `${pname(s, seat)} looked at the top Event card.`);
      log(s, 'peek', `Gabriel: the next Event is ${cardName(top)}.`, [seat], { reveal: [top] });
    },
  },
  [H.confession]: {
    can: () => true,
    *run(s, seat) {
      s.confession = s.confession.filter((c) => c.seat !== seat);
      s.confession.push({ seat, endsAfterTurnOf: seat, turnsLeft: 2 });
      log(s, 'confession', `${pname(s, seat)} revealed their hand: ${s.players[seat].hand.map(cardName).join(', ') || 'no cards'}.`);
      // V34: the Glory is earned only if the revealed hand holds no Dark card.
      if (s.players[seat].hand.some((c) => colorsOf(s, null, c).dark)) return;
      yield* gain(s, seat, 1, H.confession);
    },
  },
  [H.treeOfLife]: {
    can: (s) => s.discard.some((c) => c.startsWith('host-')),
    *run(s, seat) {
      const pick = yield* chooseOne(s, seat, 'treeOfLife.take', 'Tree of Life: take any Host card from the discard pile into your hand.', [...new Set(s.discard)].map((c) => cardOpt(c)));
      if (!pick) return;
      s.discard.splice(s.discard.indexOf(pick), 1);
      s.players[seat].hand.push(pick);
      const d = yield* chooseOne(s, seat, 'treeOfLife.discard', 'Tree of Life: discard a card from your hand.', s.players[seat].hand.map((c) => cardOpt(c)));
      if (d) {
        s.players[seat].hand.splice(s.players[seat].hand.indexOf(d), 1);
        s.discard.push(d);
      }
      log(s, 'treeOfLife', `${pname(s, seat)} took ${cardName(pick)} from the discard pile.`);
    },
  },
  [H.seraphim]: reactivator('light'),
  [H.legion]: reactivator('dark'),
  [H.sanctuary]: {
    can: (s) => s.altar.some((a) => a.sanctuary === undefined),
    *run(s, seat) {
      const pick = yield* chooseOne(s, seat, 'sanctuary', 'Sanctuary: choose a card on the Altar. Other players cannot Gather or destroy it this Day.', s.altar.map((a, i) => ({ id: String(i), label: altarLabel(s, a, seat), card: a.facedown && a.offeredBy !== seat ? undefined : a.id })).filter((_, i) => s.altar[i].sanctuary === undefined));
      if (pick === null) return;
      s.altar[Number(pick)].sanctuary = seat;
      log(s, 'sanctuary', `${pname(s, seat)} protected ${altarLabel(s, s.altar[Number(pick)], -1)} on the Altar with Sanctuary.`);
    },
  },
  [H.covenant]: {
    can: (s, seat) => covenantTargets(s, seat).length > 0,
    *run(s, seat) {
      const act = (yield* chooseOne(s, seat, 'covenant.action', 'Covenant: forbid Offer or Gather until the next Evening.', [
        { id: 'offer', label: 'Offer' }, { id: 'gather', label: 'Gather' },
      ])) as 'offer' | 'gather';
      const t = yield* chooseOne(s, seat, 'covenant.player', 'Covenant: name another player.', covenantTargets(s, seat).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      const b = seatFromOpt(t);
      s.pacts.push({ a: seat, b, action: act, broken: false, day: s.day });
      log(s, 'covenant', `${pname(s, seat)} bound ${pname(s, b)} in a Covenant: neither may ${act} before the Evening.`);
    },
  },
  [H.morningStar]: {
    can: (s, seat) => hostCardsOf(s, seat).some((c) => !c.facedown && c.id !== H.nephilim && (colorsOf(s, null, c.id).light || colorsOf(s, null, c.id).dark)),
    *run(s, seat) {
      const opts = hostCardsOf(s, seat).filter((c) => !c.facedown && c.id !== H.nephilim && (colorsOf(s, null, c.id).light || colorsOf(s, null, c.id).dark));
      const pick = yield* chooseOne(s, seat, 'morningStar', 'Morning Star: choose a card in your Choir to treat as the opposite alignment until your next turn.', opts.map((c) => cardOpt(c.id)));
      if (!pick) return;
      s.morningStar = s.morningStar.filter((m) => m.seat !== seat);
      s.morningStar.push({ seat, card: pick });
      log(s, 'morningStar', `${pname(s, seat)} inverted ${cardName(pick)} with Morning Star until their next turn.`);
    },
  },
  [H.vessel]: {
    can: (s) => s.hostDeck.length + s.discard.length > 0,
    *run(s, seat) {
      const c = drawHost(s);
      if (!c) return;
      s.altar.push({ id: c, facedown: true, offeredBy: null, day: s.day, kind: 'vessel' });
      log(s, 'vessel', `${pname(s, seat)} added the top card of the Host deck to the Altar facedown (Vessel).`);
    },
  },
  [H.ordeal]: {
    can: (s, seat) => !s.day_.ordeal.includes(seat),
    *run(s, seat) {
      s.day_.ordeal.push(seat);
      log(s, 'ordeal', `${pname(s, seat)} invoked Ordeal: their Reaping gains or losses double this Day.`);
    },
  },
  [H.council]: {
    can: () => true,
    *run(s, seat) {
      log(s, 'council', `${pname(s, seat)} called a Council vote.`);
      const votes = yield* askAll(s, s.players.map((p) => ({ seat: p.seat, tag: 'council.vote', prompt: `${pname(s, seat)} called a Council: if every player votes yes, each player may swap 1 Choir card for 1 hand card.`, options: [{ id: 'yes', label: 'Vote yes' }, { id: 'no', label: 'Vote no' }], min: 1, max: 1 })));
      const yes = votes.every((v) => v[0] === 'yes');
      log(s, 'council', yes ? 'The Council passed unanimously.' : 'The Council failed.');
      if (!yes) return;
      const swaps = yield* askAll(s, s.players.map((p) => ({
        seat: p.seat, tag: 'council.swap', prompt: 'Council: choose a Choir card and a hand card to swap, or skip.',
        options: [{ id: 'skip', label: 'Skip' }, ...p.choir.filter((c) => c.id.startsWith('host-')).flatMap((c) => p.hand.map((h) => ({ id: `${c.id}|${h}`, label: `${cardName(c.id)} out, ${cardName(h)} in`, card: h })))],
        min: 1, max: 1,
      })));
      for (const p of s.players) {
        const a = swaps[p.seat][0];
        if (!a || a === 'skip') continue;
        const [out, inn] = a.split('|');
        p.hand.splice(p.hand.indexOf(inn), 1);
        yield* discardFromChoir(s, p.seat, out, 'Council');
        yield* enterChoir(s, p.seat, inn);
        log(s, 'council', `${p.name} swapped ${cardName(out)} for ${cardName(inn)}.`);
      }
    },
  },
  [H.watchers]: {
    can: (s) => s.hostDeck.length + s.discard.length > 1,
    *run(s, seat) {
      const top = peekHost(s, 3);
      const n = top.length;
      const order: string[] = [];
      let rest = [...top];
      log(s, 'peek', `${pname(s, seat)} looked at the top ${n} cards of the Host deck.`);
      while (rest.length > 1) {
        const pick = yield* chooseOne(s, seat, 'watchers.order', `Watchers: choose the card to place ${order.length === 0 ? 'on top' : 'next'}.`, rest.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), false, top);
        const i = Number(pick);
        order.push(rest[i]);
        rest = rest.filter((_, j) => j !== i);
      }
      order.push(...rest);
      s.hostDeck.splice(0, n, ...order);
    },
  },
  [H.anathema]: {
    can: () => true,
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'anathema', 'Anathema: choose a player who cannot Offer until the start of your next turn.', others(s, seat).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      const target = seatFromOpt(t);
      s.anathema.push({ target, by: seat });
      log(s, 'anathema', `${pname(s, target)} cannot Offer until ${pname(s, seat)}'s next turn (Anathema).`);
    },
  },
  [H.serpent]: {
    can: (s, seat) => others(s, seat).some((p) => !protectedFrom(s, seat, p.seat, 'look') && p.hand.length > 0),
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'serpent.player', "Serpent: look at another player's hand.", others(s, seat).filter((p) => !protectedFrom(s, seat, p.seat, 'look') && p.hand.length > 0).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      const o = seatFromOpt(t);
      const theirs = s.players[o].hand;
      log(s, 'serpent', `${pname(s, seat)} looked at ${pname(s, o)}'s hand.`);
      log(s, 'peek', `${pname(s, o)}'s hand: ${theirs.map(cardName).join(', ')}.`, [seat]);
      const mine = s.players[seat].hand;
      if (!mine.length) return;
      const pick = yield* chooseOne(s, seat, 'serpent.swap', `Serpent: ${pname(s, o)} holds ${theirs.map(cardName).join(', ')}. Exchange 1 of your cards for 1 of theirs?`, mine.flatMap((m) => theirs.map((t2) => ({ id: `${m}|${t2}`, label: `Give ${cardName(m)}, take ${cardName(t2)}`, card: t2 }))), true, [...theirs]);
      if (!pick) return;
      const [give, take] = pick.split('|');
      mine.splice(mine.indexOf(give), 1, take);
      theirs.splice(theirs.indexOf(take), 1, give);
      log(s, 'serpent', `${pname(s, seat)} exchanged a card with ${pname(s, o)}.`);
    },
  },
  [H.moloch]: {
    can: (s, seat) => hostCardsOf(s, seat).some((c) => c.id !== H.moloch && !s.turnUsed.includes(c.id)),
    *run(s, seat) {
      const opts = hostCardsOf(s, seat).filter((c) => c.id !== H.moloch && !s.turnUsed.includes(c.id));
      const pick = yield* chooseOne(s, seat, 'moloch', 'Moloch: discard another Host card from your Choir (whose ability you have not used this turn) to gain 1 Glory.', opts.map((c) => cardOpt(c.id)), true);
      if (!pick) return;
      yield* discardFromChoir(s, seat, pick, 'Moloch');
      yield* gain(s, seat, 1, H.moloch);
    },
  },
  [H.envy]: {
    can: () => true,
    *run(s, seat) {
      for (const p of leaders(s)) {
        const n = yield* lose(s, p.seat, 1, H.envy);
        if (n) log(s, 'envy', `${p.name} lost 1 Glory to Envy.`);
      }
    },
  },
  [H.winnowing]: {
    can: (s, seat) => others(s, seat).some((p) => p.hand.length && !protectedFrom(s, seat, p.seat, 'discard')),
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'winnowing', 'Winnowing: choose another player to discard a random card from their hand.', others(s, seat).filter((p) => p.hand.length && !protectedFrom(s, seat, p.seat, 'discard')).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      const o = s.players[seatFromOpt(t)];
      const [c] = o.hand.splice(randInt(s, o.hand.length), 1);
      s.discard.push(c);
      yield* drawTo(s, o.seat, 1);
      log(s, 'winnowing', `${o.name} discarded ${cardName(c)} at random (Winnowing) and drew a replacement.`);
    },
  },
  [H.jubilee]: {
    can: (s, seat) => s.players[seat].hand.length > 0,
    *run(s, seat) {
      const p = s.players[seat];
      const picks = yield* ask(s, { seat, tag: 'jubilee', prompt: 'Jubilee: discard any number of cards from your hand, then draw back up to your hand limit.', options: p.hand.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), min: 0, max: p.hand.length });
      const idx = picks.map(Number).sort((a, b) => b - a);
      for (const i of idx) s.discard.push(...p.hand.splice(i, 1));
      yield* drawTo(s, seat, Math.max(0, handLimit(s, seat) - p.hand.length));
      log(s, 'jubilee', `${p.name} discarded ${idx.length} card(s) and drew back up (Jubilee).`);
    },
  },
  [H.lilith]: {
    can: (s, seat) => s.pacts.some((x) => x.a === seat || x.b === seat) || s.bonds.some((b) => b.owner === seat || b.bound === seat),
    *run(s, seat) {
      const opts = [
        ...s.pacts.map((x, i) => ({ x, i })).filter(({ x }) => x.a === seat || x.b === seat).map(({ x, i }) => ({ id: 'pact' + i, label: `Covenant between ${pname(s, x.a)} and ${pname(s, x.b)}` })),
        ...s.bonds.map((b, i) => ({ b, i })).filter(({ b }) => b.owner === seat || b.bound === seat).map(({ b, i }) => ({ id: 'bond' + i, label: `Raguel bond between ${pname(s, b.owner)} and ${pname(s, b.bound)}` })),
      ];
      const pick = yield* chooseOne(s, seat, 'lilith', 'Lilith: dissolve a pact or bond that includes you.', opts);
      if (!pick) return;
      if (pick.startsWith('pact')) s.pacts.splice(Number(pick.slice(4)), 1);
      else s.bonds.splice(Number(pick.slice(4)), 1);
      log(s, 'lilith', `${pname(s, seat)} dissolved a pact with Lilith.`);
    },
  },

  // ----- once per game
  [H.mercy]: {
    once: 'game',
    can: (s, seat) => !s.day_.mercy.includes(seat),
    *run(s, seat) {
      s.day_.mercy.push(seat);
      log(s, 'mercy', `${pname(s, seat)} invoked Mercy: they lose no Glory at this Evening's Reaping.`);
    },
  },
  [H.deliverance]: {
    once: 'game',
    can: (s, seat) => deliverancePairs(s, seat).length > 0,
    *run(s, seat) {
      const pairs = deliverancePairs(s, seat);
      const pick = yield* chooseOne(s, seat, 'deliverance', 'Deliverance: choose two cards in two different Choirs to exchange.', pairs.map((x) => ({ id: `${x.a}:${x.ca}|${x.b}:${x.cb}`, label: `${cardName(x.ca)} (${pname(s, x.a)}) for ${cardName(x.cb)} (${pname(s, x.b)})` })));
      if (!pick) return;
      const [[a, ca], [b, cb]] = pick.split('|').map((x) => x.split(':'));
      const A = Number(a), B = Number(b);
      if (!(yield* payTribute(s, seat, A))) return;
      if (!(yield* payTribute(s, seat, B))) return;
      const cardA = removeFromChoir(s, A, ca);
      const cardB = removeFromChoir(s, B, cb);
      if (cardA) yield* enterChoir(s, B, ca);
      if (cardB) yield* enterChoir(s, A, cb);
      log(s, 'deliverance', `${pname(s, seat)} exchanged ${cardName(ca)} (${pname(s, A)}) with ${cardName(cb)} (${pname(s, B)}).`);
    },
  },
  [H.scapegoat]: {
    once: 'game',
    can: (s, seat) => others(s, seat).some((p) => !hasActive(s, p.seat, H.lilith)),
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'scapegoat', 'Scapegoat: choose a player. The next time you would lose Glory at a Reaping, they lose it instead.', others(s, seat).filter((p) => !hasActive(s, p.seat, H.lilith)).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      s.scapegoats.push({ from: seat, to: seatFromOpt(t) });
      log(s, 'scapegoat', `${pname(s, seat)} named ${pname(s, seatFromOpt(t))} as their Scapegoat.`);
    },
  },
  [H.defiance]: {
    once: 'game',
    can: (s, seat) => !!s.currentEvent && !s.day_.defiance.includes(seat),
    *run(s, seat) {
      s.day_.defiance.push(seat);
      log(s, 'defiance', `${pname(s, seat)} defied the Day's Event (${cardName(s.currentEvent!)}).`);
    },
  },
  [H.abaddon]: {
    once: 'game',
    can: (s, seat) => altarAvailable(s, seat).length > 0,
    *run(s, seat) {
      const keep = s.altar.filter((a) => (a.sanctuary !== undefined && a.sanctuary !== seat) || altarShielded(s, a, seat));
      const gone = s.altar.filter((a) => !keep.includes(a));
      s.discard.push(...gone.map((a) => a.id));
      const fresh = gone.map(() => drawHost(s)).filter((c): c is string => !!c).map((id) => ({ id, facedown: false, offeredBy: null, day: s.day, kind: 'other' as const }));
      s.altar = [...keep, ...fresh];
      log(s, 'abaddon', `${pname(s, seat)} unleashed Abaddon: ${gone.length} Altar card(s) were replaced from the Host deck.`);
    },
  },

  // ----- Celestial turn powers (once per Day)
  [H.ithuriel]: {
    can: (s, seat) => altarPeekable(s, seat).length > 0,
    *run(s, seat) {
      const t = altarPeekable(s, seat);
      const pick = yield* chooseOne(s, seat, 'ithuriel', 'Ithuriel: flip a facedown card on the Altar face up.', t.map((a) => ({ id: String(s.altar.indexOf(a)), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })));
      if (pick === null) return;
      const a = s.altar[Number(pick)];
      a.facedown = false;
      a.seenBy = undefined;
      log(s, 'ithuriel', `${pname(s, seat)} revealed ${cardName(a.id)} on the Altar (Ithuriel).`);
    },
  },
  [H.urim]: {
    can: (s, seat) => altarPeekable(s, seat).some((a) => a.offeredBy !== seat),
    *run(s, seat) {
      const t = altarPeekable(s, seat).filter((a) => a.offeredBy !== seat);
      const picks = yield* ask(s, { seat, tag: 'urim', prompt: 'Urim: secretly look at up to 2 facedown cards on the Altar.', options: t.map((a) => ({ id: String(s.altar.indexOf(a)), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })), min: 1, max: Math.min(2, t.length) });
      const seen = picks.map((i) => s.altar[Number(i)]);
      for (const a of seen) a.seenBy = [...(a.seenBy ?? []), seat];
      log(s, 'urim', `${pname(s, seat)} looked at ${seen.length} facedown card(s) on the Altar (Urim).`);
      log(s, 'peek', `Urim: ${seen.map((a) => `${altarLabel(s, a, -1)} is ${cardName(a.id)}`).join('; ')}.`, [seat], { reveal: seen.map((a) => a.id) });
    },
  },
  [H.asmadai]: {
    can: (s, seat) => altarPeekable(s, seat).length > 0,
    *run(s, seat) {
      const t = altarPeekable(s, seat);
      const pick = yield* chooseOne(s, seat, 'asmadai', 'Asmadai: look at a facedown card on the Altar.', t.map((a) => ({ id: String(s.altar.indexOf(a)), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })));
      if (pick === null) return;
      const a = s.altar[Number(pick)];
      a.seenBy = [...(a.seenBy ?? []), seat];
      log(s, 'asmadai', `${pname(s, seat)} looked at a facedown card on the Altar (Asmadai).`);
      log(s, 'peek', `Asmadai: the card is ${cardName(a.id)}.`, [seat], { reveal: [a.id] });
      const hand = s.players[seat].hand;
      if (!hand.length) return;
      const swap = yield* chooseOne(s, seat, 'asmadai.swap', `Asmadai: the card is ${cardName(a.id)}. Exchange it with a card from your hand? The new card stays facedown.`, hand.map((c) => cardOpt(c)), true, [a.id]);
      if (!swap) return;
      hand.splice(hand.indexOf(swap), 1, a.id);
      a.id = swap;
      a.seenBy = [seat];
      log(s, 'asmadai', `${pname(s, seat)} exchanged a facedown card on the Altar with one from their hand (Asmadai).`);
    },
  },
  [C.tempest]: {
    once: 'day',
    can: (s, seat) => s.altar.some((a) => (a.sanctuary === undefined || a.sanctuary === seat) && !altarShielded(s, a, seat)),
    *run(s, seat) {
      const opts = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => (a.sanctuary === undefined || a.sanctuary === seat) && !altarShielded(s, a, seat));
      const pick = yield* chooseOne(s, seat, 'tempest', 'The Tempest: destroy one Host card on the Altar.', opts.map(({ a, i }) => ({ id: String(i), label: altarLabel(s, a, seat), card: a.facedown && a.offeredBy !== seat ? undefined : a.id })));
      if (pick === null) return;
      const [a] = s.altar.splice(Number(pick), 1);
      s.discard.push(a.id);
      log(s, 'tempest', `${pname(s, seat)} destroyed ${cardName(a.id)} on the Altar (the Tempest).`);
    },
  },
  [C.patron]: {
    once: 'day',
    can: (s, seat) => s.players[seat].hand.length > 0 && patronTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'patron.player', 'The Patron: choose a player to receive a card from your hand.', patronTargets(s, seat).map((p) => seatOpt(s, p)));
      if (!t) return;
      const o = seatFromOpt(t);
      const card = yield* chooseOne(s, seat, 'patron.card', `The Patron: choose a card to give to ${pname(s, o)}'s Choir.`, s.players[seat].hand.map((c) => cardOpt(c)));
      if (!card) return;
      const full = s.players[o].choir.length >= CHOIR_LIMIT;
      if (full && !(yield* payTribute(s, seat, o))) return;
      s.players[seat].hand.splice(s.players[seat].hand.indexOf(card), 1);
      if (full) {
        const opts = s.players[o].choir.filter((c) => c.id.startsWith('host-'));
        const d = yield* chooseOne(s, o, 'patron.discard', `${pname(s, seat)} is giving you ${cardName(card)}. Choose a Choir card to discard to make room.`, opts.map((c) => cardOpt(c.id)));
        if (d) yield* discardFromChoir(s, o, d, 'the Patron');
      }
      yield* enterChoir(s, o, card);
      log(s, 'patron', `${pname(s, seat)} placed ${cardName(card)} into ${pname(s, o)}'s Choir (the Patron).`);
    },
  },
  [C.echo]: {
    once: 'day',
    can: (s, seat) => echoTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = echoTargets(s, seat);
      const pick = yield* chooseOne(s, seat, 'echo', "The Echo: copy a Host ability in another player's Choir.", t.map((x) => ({ id: `${x.owner}:${x.id}`, label: `${cardName(x.id)} (${pname(s, x.owner)})`, card: x.id })));
      if (!pick) return;
      const [o, id] = pick.split(':');
      if (!(yield* payTribute(s, seat, Number(o)))) return;
      log(s, 'echo', `${pname(s, seat)} copied ${cardName(id)} with the Echo.`);
      yield* TURN[id].run(s, seat);
    },
  },
};

function reactivator(color: 'light' | 'dark'): TurnAbility {
  const opts = (s: GameState, seat: Seat) =>
    activeCards(s.players[seat]).filter((c) => repeatable(c.id) && colorsOf(s, seat, c.id)[color] && TURN[c.id].can(s, seat));
  return {
    can: (s, seat) => opts(s, seat).length > 0,
    *run(s, seat) {
      const pick = yield* chooseOne(s, seat, color === 'light' ? 'seraphim' : 'legion', `Activate another ${color === 'light' ? 'Light' : 'Dark'} Host card's ability a second time.`, opts(s, seat).map((c) => cardOpt(c.id)));
      if (!pick) return;
      yield* activation(s, seat, pick, () => TURN[pick].run(s, seat));
    },
  };
}

/** Covenant (V34): name another player who has not yet taken their turn this Day. */
function covenantTargets(s: GameState, seat: Seat) {
  const acted = new Set(s.day_.actionsTaken.map((a) => a.seat));
  return others(s, seat).filter((p) => !hasActive(s, p.seat, H.lilith) && !acted.has(p.seat));
}

function patronTargets(s: GameState, seat: Seat): Seat[] {
  return others(s, seat)
    .filter((p) => p.choir.length < CHOIR_LIMIT || (!protectedFrom(s, seat, p.seat, 'discard') && canAffordTribute(s, seat, p.seat)))
    .map((p) => p.seat);
}

function echoTargets(s: GameState, seat: Seat) {
  const out: { owner: Seat; id: string }[] = [];
  for (const p of others(s, seat)) {
    for (const c of targetableChoir(s, seat, p.seat, 'copy', (c) => !c.facedown)) {
      if (repeatable(c.id) && TURN[c.id].can(s, seat)) out.push({ owner: p.seat, id: c.id });
    }
  }
  return out;
}

function deliverancePairs(s: GameState, seat: Seat) {
  const pool: { owner: Seat; id: string }[] = [];
  for (const p of s.players) {
    const cards = p.seat === seat ? hostCardsOf(s, seat) : targetableChoir(s, seat, p.seat, 'replace');
    for (const c of cards) pool.push({ owner: p.seat, id: c.id });
  }
  const out: { a: Seat; ca: string; b: Seat; cb: string }[] = [];
  for (const x of pool) for (const y of pool) if (x.owner < y.owner) out.push({ a: x.owner, ca: x.id, b: y.owner, cb: y.id });
  return out;
}

export function hostTurnAbilities(): string[] {
  return Object.keys(TURN).filter((k) => k.startsWith('host-'));
}
export { HOST };
