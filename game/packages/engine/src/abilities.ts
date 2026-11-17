// Abilities a player activates on their own turn, after their action:
// "On your turn" Host abilities, once-per-game Host abilities, and Celestial turn powers.
import { C, H, HOST, cardName } from './data';
import {
  activeCards, altarAvailable, altarLabel, ask, askAll, canAffordTribute, cardOpt, chooseOne, discardFromChoir,
  drawHost, drawTo, enterChoir, gain, handLimit, hasActive, log, lose, markToday, others, payTribute, peekHost,
  pname, protectedFrom, immune, handProtected, removeFromChoir, seatFromOpt, seatOpt, stat, targetableChoir, usedToday, yesNo, choirLimit,
  colorsOf, activation, altarShielded, altarPeekable, canSpend, pay, variant, makeRoom,
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
      if (c) { c.facedown = true; (c as any).michael = true; }
      log(s, 'michael', `${pname(s, seat)} turned ${cardName(id)} in ${pname(s, owner)}'s Choir Facedown until the Reaping ends.`);
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
    // V42: look at another player's hand (was the top Event card).
    can: (s, seat) => gabrielTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'gabriel.player', "Gabriel: look at another player's hand.", gabrielTargets(s, seat).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      const o = seatFromOpt(t);
      const theirs = [...s.players[o].hand];
      log(s, 'peek', `${pname(s, seat)} looked at ${pname(s, o)}'s hand (Gabriel).`);
      yield* ask(s, { seat, tag: 'gabriel.seen', prompt: `Gabriel: ${pname(s, o)} holds ${theirs.map(cardName).join(', ') || 'no cards'}.`, options: [{ id: 'done', label: 'Done' }], min: 1, max: 1, reveal: theirs, confirm: true } as any);
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
    // V42: name a player who has not acted; if neither of you Offers this Day, each gains 1 Glory.
    can: (s, seat) => !s.day_.actionsTaken.some((x) => x.seat === seat && x.action === 'offer') && covenantTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'covenant.player', 'Covenant: name a player who has not yet acted. If neither of you Offers this Day, each of you gains 1 Glory.', covenantTargets(s, seat).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      const b = seatFromOpt(t);
      s.pacts.push({ a: seat, b, action: 'offer', broken: false, day: s.day });
      log(s, 'covenant', `${pname(s, seat)} made a Covenant with ${pname(s, b)}: if neither Offers this Day, both gain 1 Glory.`);
    },
  },
  [H.heresy]: {
    // V42: decided on your turn, before the Altar is revealed.
    can: (s, seat) => !s.day_.heresy.includes(seat),
    *run(s, seat) {
      s.day_.heresy.push(seat);
      log(s, 'heresy', `${pname(s, seat)}'s Choir counts as leaning the opposite way this Day (Heresy).`);
    },
  },
  [H.figLeaves]: {
    can: (s, seat) => !s.day_.figLeaves.includes(seat),
    *run(s, seat) {
      s.day_.figLeaves.push(seat);
      log(s, 'figLeaves', `${pname(s, seat)}'s Choir sits out this Day (Fig Leaves).`);
    },
  },
  [H.morningStar]: {
    can: (s, seat) => canSpend(s, seat, 1) && !s.morningStar.some((m) => m.seat === seat) && morningStarCards(s, seat).length > 0,
    *run(s, seat) {
      const pick = yield* chooseOne(s, seat, 'morningStar', 'Morning Star: pay 1 Glory. Choose a card in your Choir to count as the opposite color this Day.', morningStarCards(s, seat).map((c) => cardOpt(c.id)), true);
      if (!pick) return;
      yield* pay(s, seat, 1, H.morningStar);
      s.morningStar.push({ seat, card: pick });
      log(s, 'morningStar', `${pname(s, seat)}'s ${cardName(pick)} counts as the opposite color this Day (Morning Star).`);
    },
  },
  [H.providence]: {
    // V42: a store. Glory piles up on it at Reapings your Choir leans with the Tide; take it all, then discard it.
    can: (s, seat) => (s.players[seat].choir.find((c) => c.id === H.providence)?.store ?? 0) > 0,
    *run(s, seat) {
      const c = s.players[seat].choir.find((x) => x.id === H.providence);
      const n = c?.store ?? 0;
      if (!c || !n) return;
      c.store = 0;
      yield* gain(s, seat, n, H.providence);
      yield* discardFromChoir(s, seat, H.providence, 'Providence');
      log(s, 'providence', `${pname(s, seat)} took the ${n} Glory stored on Providence and discarded it.`);
    },
  },
  [H.parasite]: {
    // V42: move this card into another player's Choir. Its holder cannot discard it.
    can: (s, seat) => parasiteTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'parasite.player', "Parasite: move it into another player's Choir.", parasiteTargets(s, seat).map((p) => seatOpt(s, p)));
      if (!t) return;
      const o = seatFromOpt(t);
      if (s.players[o].choir.length >= choirLimit(s)) {
        if (!(yield* payTribute(s, seat, o))) return;
        const opts = s.players[o].choir.filter((c) => c.id.startsWith('host-'));
        const d = yield* chooseOne(s, o, 'choir.discard', `${pname(s, seat)} moves Parasite into your full Choir. Choose a card to discard.`, opts.map((c) => cardOpt(c.id)));
        if (d) yield* discardFromChoir(s, o, d, 'Parasite');
      }
      if (!removeFromChoir(s, seat, H.parasite)) return;
      yield* enterChoir(s, o, H.parasite);
      log(s, 'parasite', `${pname(s, seat)} moved Parasite into ${pname(s, o)}'s Choir.`);
    },
  },
  // V38: Morning Star now acts At the Reaping (see engine.ts reaping()).
  [H.vessel]: {
    // V40: place a card from your hand on the Altar facedown, then draw 1 card. It is not an Offer.
    // Its Glory, if the card matches the Tide, is paid At the Reaping (engine.ts reaping()).
    can: (s, seat) => s.players[seat].hand.length > 0,
    *run(s, seat) {
      const h = s.players[seat].hand;
      const pick = yield* chooseOne(s, seat, 'vessel.hand', 'Vessel: place a card from your hand on the Altar facedown, then draw 1 card? At the Reaping, if it is still there and matches the Tide, you gain 1 Glory.', h.map((c) => cardOpt(c)), true);
      if (!pick) return;
      h.splice(h.indexOf(pick), 1);
      s.altar.push({ id: pick, facedown: true, offeredBy: seat, day: s.day, kind: 'vessel' });
      yield* drawTo(s, seat, 1);
      log(s, 'vessel', `${pname(s, seat)} placed a card on the Altar facedown (Vessel).`);
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
    // V37: you may replace another card in your Choir with a card from your hand; then each other
    // player may do the same by paying you 1 Glory (was: a unanimous vote, then everyone swaps).
    can: () => true,
    *run(s, seat) {
      log(s, 'council', `${pname(s, seat)} called a Council.`);
      const who = s.players.filter((p) => p.seat === seat || canSpend(s, p.seat, 1));
      const sw = yield* askAll(s, who.map((p) => ({
        seat: p.seat, tag: p.seat === seat ? 'council.swap' : 'council.tollswap',
        prompt: p.seat === seat ? 'Council: replace another card in your Choir with a card from your hand, or skip.' : `Council: pay ${pname(s, seat)} 1 Glory to replace a card in your Choir with a card from your hand, or skip.`,
        options: [{ id: 'skip', label: 'Skip' }, ...p.choir.filter((c) => c.id.startsWith('host-') && !(p.seat === seat && c.id === H.council)).flatMap((c) => p.hand.map((h) => ({ id: `${c.id}|${h}`, label: `${cardName(c.id)} out, ${cardName(h)} in`, card: h })))],
        min: 1, max: 1,
      })));
      for (const [i, p] of who.entries()) {
        const a = sw[i]?.[0];
        if (!a || a === 'skip') continue;
        if (p.seat !== seat && !(yield* pay(s, p.seat, 1, H.council, seat))) continue;
        const [out, inn] = a.split('|');
        p.hand.splice(p.hand.indexOf(inn), 1);
        yield* discardFromChoir(s, p.seat, out, 'Council');
        yield* enterChoir(s, p.seat, inn);
        log(s, 'council', p.seat === seat ? `${p.name} swapped ${cardName(out)} for ${cardName(inn)} (Council).` : `${p.name} paid ${pname(s, seat)} 1 Glory and swapped ${cardName(out)} for ${cardName(inn)} (Council).`);
      }
    },
  },
  [H.watchers]: {
    can: (s) => s.hostDeck.length + s.discard.length > 1,
    *run(s, seat) {
      // V37: take 1 of the top 3 into your hand, discard a card from your hand, then order the rest.
      let top = peekHost(s, 3);
      if (top.length) {
        const t = yield* chooseOne(s, seat, 'watchers.take', 'Watchers: take 1 of the top 3 cards into your hand.', top.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), false, top);
        const i = Number(t);
        const card = top[i];
        s.hostDeck.splice(i, 1);
        s.players[seat].hand.push(card);
        const h = s.players[seat].hand;
        const d = yield* chooseOne(s, seat, 'watchers.discard', 'Watchers: discard a card from your hand.', h.map((c) => cardOpt(c)));
        if (d) { h.splice(h.indexOf(d), 1); s.discard.push(d); }
        top = s.hostDeck.slice(0, top.length - 1);
      }
      const n = top.length;
      const order: string[] = [];
      let rest = [...top];
      log(s, 'peek', `${pname(s, seat)} took a card from the top of the Host deck and returned ${n} (Watchers).`);
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
      const t = yield* chooseOne(s, seat, 'anathema', 'Anathema: choose a player who cannot Offer until the start of your next turn.', others(s, seat).filter((p) => !immune(s, seat, p.seat)).map((p) => seatOpt(s, p.seat)));
      if (!t) return;
      const target = seatFromOpt(t);
      s.anathema.push({ target, by: seat });
      log(s, 'anathema', `${pname(s, target)} cannot Offer until ${pname(s, seat)}'s next turn (Anathema).`);
    },
  },
  [H.serpent]: {
    can: (s, seat) => others(s, seat).some((p) => !protectedFrom(s, seat, p.seat, 'look') && !handProtected(s, seat, p.seat) && p.hand.length > 0),
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'serpent.player', "Serpent: look at another player's hand.", others(s, seat).filter((p) => !protectedFrom(s, seat, p.seat, 'look') && !handProtected(s, seat, p.seat) && p.hand.length > 0).map((p) => seatOpt(s, p.seat)));
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
    // V37: only if the player with the most Glory has at least 3 more than you.
    can: (s, seat) => Math.max(...s.players.map((p) => p.glory)) - s.players[seat].glory >= 3,
    *run(s, seat) {
      for (const p of leaders(s)) {
        if (immune(s, seat, p.seat)) continue;
        const n = yield* lose(s, p.seat, 1, H.envy);
        if (n) log(s, 'envy', `${p.name} lost 1 Glory to Envy.`);
      }
    },
  },
  [H.winnowing]: {
    can: (s, seat) => others(s, seat).some((p) => p.hand.length && !protectedFrom(s, seat, p.seat, 'discard') && !handProtected(s, seat, p.seat)),
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'winnowing', 'Winnowing: choose another player to discard a random card from their hand.', others(s, seat).filter((p) => p.hand.length && !protectedFrom(s, seat, p.seat, 'discard') && !handProtected(s, seat, p.seat)).map((p) => seatOpt(s, p.seat)));
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

  // ----- once per game
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
  [H.defiance]: {
    // V42: no other player's ability can affect you until your next turn (was: ignore the Day's Event).
    once: 'game',
    can: (s, seat) => !s.immune.includes(seat),
    *run(s, seat) {
      s.immune.push(seat);
      log(s, 'defiance', `${pname(s, seat)} is Defiant: no other player's ability can affect them until their next turn.`);
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
    // V38: up to 3 facedown cards (was 2).
    can: (s, seat) => altarPeekable(s, seat).some((a) => a.offeredBy !== seat),
    *run(s, seat) {
      const t = altarPeekable(s, seat).filter((a) => a.offeredBy !== seat);
      {
        const picks = yield* ask(s, { seat, tag: 'urim', prompt: 'Urim: secretly look at up to 3 facedown cards on the Altar.', options: t.map((a) => ({ id: String(s.altar.indexOf(a)), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })), min: 1, max: Math.min(3, t.length) });
        const seen = picks.map((i) => s.altar[Number(i)]);
        // seenBy is kept for the computer players' memory; people see the cards once, here, and then must remember them.
        for (const a of seen) a.seenBy = [...(a.seenBy ?? []), seat];
        log(s, 'urim', `${pname(s, seat)} looked at ${seen.length} facedown card${seen.length === 1 ? '' : 's'} on the Altar (Urim).`);
        // Ruling confirmed November 16, 2026: shown once, then hidden again.
        yield* ask(s, { seat, tag: 'urim.seen', prompt: `Urim: ${seen.map((a) => `${altarLabel(s, a, -1)} is ${cardName(a.id)}`).join('; ')}. Remember them: they go back facedown when you close this.`, options: [{ id: 'done', label: 'Done' }], min: 1, max: 1, reveal: seen.map((a) => a.id), confirm: true });
      }
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
      const hand = s.players[seat].hand;
      // Ruling confirmed November 16, 2026: shown once (here or in the exchange choice below), then hidden again.
      if (!hand.length) {
        yield* ask(s, { seat, tag: 'asmadai.seen', prompt: `Asmadai: the card is ${cardName(a.id)}. You have no card to exchange it for. Remember it: it goes back facedown when you close this.`, options: [{ id: 'done', label: 'Done' }], min: 1, max: 1, reveal: [a.id], confirm: true });
        return;
      }
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
      const full = s.players[o].choir.length >= choirLimit(s);
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

/** Covenant: name another player who has not yet taken their turn this Day. */
function covenantTargets(s: GameState, seat: Seat) {
  const acted = new Set(s.day_.actionsTaken.map((a) => a.seat));
  return others(s, seat).filter((p) => !immune(s, seat, p.seat) && !acted.has(p.seat));
}
function gabrielTargets(s: GameState, seat: Seat) {
  return others(s, seat).filter((p) => p.hand.length > 0 && !handProtected(s, seat, p.seat) && !protectedFrom(s, seat, p.seat, 'look'));
}
function morningStarCards(s: GameState, seat: Seat) {
  return s.players[seat].choir.filter((c) => !c.facedown && c.id.startsWith('host-') && c.id !== H.nephilim && (colorsOf(s, null, c.id).light || colorsOf(s, null, c.id).dark));
}
function parasiteTargets(s: GameState, seat: Seat): Seat[] {
  return others(s, seat)
    .filter((p) => !immune(s, seat, p.seat) && (p.choir.length < choirLimit(s) || (!protectedFrom(s, seat, p.seat, 'discard') && canAffordTribute(s, seat, p.seat))))
    .map((p) => p.seat);
}

function patronTargets(s: GameState, seat: Seat): Seat[] {
  return others(s, seat)
    .filter((p) => p.choir.length < choirLimit(s) || (!protectedFrom(s, seat, p.seat, 'discard') && canAffordTribute(s, seat, p.seat)))
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
