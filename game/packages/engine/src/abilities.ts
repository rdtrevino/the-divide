// Abilities a player activates on their own turn, after their action:
// "On your turn" Host abilities, and Celestial turn powers (once per Day).
import { C, H, cardName } from './data';
import {
  altarAvailable, altarLabel, altarPeekable, altarShielded, ask, canAffordTribute, canSpend, cardOpt, CHOIR_LIMIT,
  chooseOne, colorsOf, discardableForRoom, discardFromChoir, discardFromHand, drawHost, drawTo, enterChoir, gain,
  handLimit, log, lose, makeRoom, others, pay, payTribute, peekHost, pname, protectedFrom, removeFromChoir,
  sanctuaryAllows, seatFromOpt, seatOpt, snareHit, targetableChoir,
} from './core';
import type { Gen, GameState, Seat } from './types';

export interface TurnAbility {
  once?: 'day';
  /** Whether the ability has at least one legal use right now. */
  can: (s: GameState, seat: Seat) => boolean;
  run: (s: GameState, seat: Seat) => Gen<void>;
}

const hostCardsOf = (s: GameState, seat: Seat) => s.players[seat].choir.filter((c) => c.id.startsWith('host-'));
const leaders = (s: GameState) => {
  const max = Math.max(...s.players.map((p) => p.glory));
  return s.players.filter((p) => p.glory === max);
};

/** The Glory stored on a card in this player's Choir (Providence, Mammon). */
const storeOf = (s: GameState, seat: Seat, id: string) => s.players[seat].choir.find((c) => c.id === id)?.store ?? 0;

/** Take all the Glory stored on a card, then discard it. */
function* cashStore(s: GameState, seat: Seat, id: string): Gen<void> {
  const c = s.players[seat].choir.find((x) => x.id === id);
  const n = c?.store ?? 0;
  if (!c || !n) return;
  c.store = 0;
  yield* gain(s, seat, n, id);
  yield* discardFromChoir(s, seat, id, cardName(id));
  log(s, id === H.providence ? 'providence' : 'mammon', `${pname(s, seat)} took the ${n} Glory stored on ${cardName(id)} and discarded it.`);
}

/** Host abilities the Echo can copy (not the Celestial powers). */
function repeatable(id: string): boolean {
  const a = TURN[id];
  return !!a && !a.once;
}

export const TURN: Record<string, TurnAbility> = {
  [H.michael]: {
    // V42, spent: discard a card from another player's Choir, then discard Michael.
    can: (s, seat) => michaelTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = michaelTargets(s, seat);
      const pick = yield* chooseOne(s, seat, 'michael.target', "Michael: discard a card from another player's Choir, then discard Michael.", t.map((x) => ({ id: `${x.owner}:${x.id}`, label: `${cardName(x.id)} (${pname(s, x.owner)})`, card: x.id, seat: x.owner })), true);
      if (!pick) return;
      const [o, id] = pick.split(':');
      const owner = Number(o);
      if (!payTribute(s, seat, owner)) return;
      yield* discardFromChoir(s, owner, id, 'Michael');
      yield* discardFromChoir(s, seat, H.michael, 'Michael');
      log(s, 'michael', `${pname(s, seat)} cast ${cardName(id)} out of ${pname(s, owner)}'s Choir, and Michael is spent.`);
    },
  },
  [H.confession]: {
    can: () => true,
    *run(s, seat) {
      s.confession = s.confession.filter((c) => c.seat !== seat);
      s.confession.push({ seat, turnsLeft: 2 });
      log(s, 'confession', `${pname(s, seat)} revealed their hand: ${s.players[seat].hand.map(cardName).join(', ') || 'no cards'}.`);
      // V34: the Glory is earned only if the revealed hand holds no Dark card.
      if (s.players[seat].hand.some((c) => colorsOf(s, null, c).dark)) return;
      yield* gain(s, seat, 1, H.confession);
    },
  },
  [H.mammon]: {
    // V42: take the Glory stored on Mammon, then discard it.
    can: (s, seat) => storeOf(s, seat, H.mammon) > 0,
    run: (s, seat) => cashStore(s, seat, H.mammon),
  },
  [H.sanctuary]: {
    can: (s) => s.altar.some((a) => a.sanctuary === undefined),
    *run(s, seat) {
      const pick = yield* chooseOne(s, seat, 'sanctuary', 'Sanctuary: choose a card on the Altar. Other players cannot Gather or destroy it this Day.', s.altar.map((a, i) => ({ id: String(i), label: altarLabel(s, a, seat), card: a.facedown && a.offeredBy !== seat ? undefined : a.id })).filter((_, i) => s.altar[i].sanctuary === undefined));
      if (pick === null) return;
      s.altar[Number(pick)].sanctuary = seat;
      log(s, 'sanctuary', `${pname(s, seat)} protected ${altarLabel(s, s.altar[Number(pick)], -1)} on the Altar with Sanctuary.`);
    },
  },
  [H.heresy]: {
    // V42: pay 1 Glory on your turn, before the Altar is revealed.
    can: (s, seat) => !s.day_.heresy.includes(seat) && canSpend(s, seat, 1),
    *run(s, seat) {
      yield* pay(s, seat, 1, H.heresy);
      s.day_.heresy.push(seat);
      log(s, 'heresy', `${pname(s, seat)}'s Choir scores its cards of the losing color this Day (Heresy).`);
    },
  },
  [H.morningStar]: {
    // V45: costs 1 Glory (free, it turned a losing card almost every Day: 1.31).
    can: (s, seat) => !s.morningStar.some((m) => m.seat === seat) && morningStarCards(s, seat).length > 0 && canSpend(s, seat, 1),
    *run(s, seat) {
      const pick = yield* chooseOne(s, seat, 'morningStar', 'Morning Star: pay 1 Glory to have a card in your Choir count as the opposite alignment this Day?', morningStarCards(s, seat).map((c) => cardOpt(c.id)), true);
      if (!pick || !(yield* pay(s, seat, 1, H.morningStar))) return;
      s.morningStar.push({ seat, card: pick });
      log(s, 'morningStar', `${pname(s, seat)}'s ${cardName(pick)} counts as the opposite alignment this Day (Morning Star).`);
    },
  },
  [H.providence]: {
    // V45: a store. Glory piles up on it each Day Light wins; take it all, then discard it.
    can: (s, seat) => storeOf(s, seat, H.providence) > 0,
    run: (s, seat) => cashStore(s, seat, H.providence),
  },
  [H.vessel]: {
    // V42: place a card from your hand on the Altar facedown. It is not an Offer.
    // Its Glory (or loss) is settled At the Reaping (engine.ts reaping()).
    can: (s, seat) => s.players[seat].hand.length > 0,
    *run(s, seat) {
      const h = s.players[seat].hand;
      const pick = yield* chooseOne(s, seat, 'vessel.hand', 'Vessel: place a card from your hand on the Altar facedown? It is not an Offer. At the end of the Day, if it is still there, gain 1 Glory if it matches the Tide, or lose 1 if it opposes it.', h.map((c) => cardOpt(c)), true);
      if (!pick) return;
      h.splice(h.indexOf(pick), 1);
      s.altar.push({ id: pick, facedown: true, offeredBy: seat, day: s.day, kind: 'vessel' });
      log(s, 'vessel', `${pname(s, seat)} placed a card on the Altar facedown (Vessel).`);
    },
  },
  [H.ordeal]: {
    can: (s, seat) => !s.day_.ordeal.includes(seat),
    *run(s, seat) {
      s.day_.ordeal.push(seat);
      yield* discardFromChoir(s, seat, H.ordeal, 'Ordeal');
      log(s, 'ordeal', `${pname(s, seat)} invoked Ordeal: their Choir scores double this Day, or loses 2 if it scores nothing.`);
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
        yield* discardFromHand(s, seat, 'watchers.discard', 'Watchers: discard a card from your hand.');
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
    // V42: no other player may Offer until the start of your next turn.
    can: (s, seat) => !s.anathema.some((a) => a.by === seat && a.action === 'offer'),
    *run(s, seat) {
      for (const p of others(s, seat)) s.anathema.push({ target: p.seat, by: seat, action: 'offer' });
      log(s, 'anathema', `No other player may Offer until the start of ${pname(s, seat)}'s next turn (Anathema).`);
    },
  },
  [H.temptation]: {
    // V42: play a card from your hand into another player's Choir.
    can: (s, seat) => temptationPairs(s, seat).length > 0,
    *run(s, seat) {
      const p = s.players[seat];
      const pairs = temptationPairs(s, seat);
      const pick = yield* chooseOne(s, seat, 'temptation.give', "Temptation: play a card from your hand into another player's Choir.", pairs.map(({ c, o }) => ({ id: `${c}|${o}`, label: `${cardName(c)} into ${pname(s, o)}'s Choir`, card: c, seat: o })), true);
      if (!pick) return;
      const [c, os] = pick.split('|'); const o = Number(os);
      if (!payTribute(s, seat, o)) return;
      if (!(yield* makeRoom(s, o, 'Temptation'))) return;
      p.hand.splice(p.hand.indexOf(c), 1);
      yield* enterChoir(s, o, c);
      log(s, 'temptation', `${pname(s, seat)} played ${cardName(c)} into ${pname(s, o)}'s Choir (Temptation).`);
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
      const pick = yield* chooseOne(s, seat, 'moloch', 'Moloch: discard another Host card from your Choir (whose ability you have not used this turn) to gain 2 Glory.', opts.map((c) => cardOpt(c.id)), true);
      if (!pick) return;
      yield* discardFromChoir(s, seat, pick, 'Moloch');
      yield* gain(s, seat, 2, H.moloch);
    },
  },
  [H.envy]: {
    // V45: only if the player with the most Glory has at least 5 more than you (scores run about twice as high).
    can: (s, seat) => Math.max(...s.players.map((p) => p.glory)) - s.players[seat].glory >= 5,
    *run(s) {
      for (const p of leaders(s)) {
        const n = yield* lose(s, p.seat, 1, H.envy);
        if (n) log(s, 'envy', `${p.name} lost 1 Glory to Envy.`);
      }
    },
  },
  [H.winnowing]: {
    // V42: discard up to 2 facedown Altar cards without looking at them.
    can: (s, seat) => winnowable(s, seat).length > 0,
    *run(s, seat) {
      const pick = yield* chooseOne(s, seat, 'winnowing.altar', 'Winnowing: discard a facedown Altar card without looking at it.', winnowable(s, seat).map(({ a, i }) => ({ id: String(i), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })), true);
      if (pick === null) return;
      const [c] = s.altar.splice(Number(pick), 1);
      s.discard.push(c.id);
      yield* snareHit(s, seat, c);
      log(s, 'winnowing', `${pname(s, seat)} winnowed a facedown card from the Altar: it was ${cardName(c.id)}.`);
      const more = winnowable(s, seat);
      if (!more.length) return;
      const p2 = yield* chooseOne(s, seat, 'winnowing.altar', 'Winnowing: discard a second facedown Altar card without looking at it?', more.map(({ a, i }) => ({ id: String(i), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })), true);
      if (p2 === null) return;
      const [c2] = s.altar.splice(Number(p2), 1);
      s.discard.push(c2.id);
      yield* snareHit(s, seat, c2);
      log(s, 'winnowing', `${pname(s, seat)} winnowed a second facedown card from the Altar: it was ${cardName(c2.id)}.`);
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
    // V42, spent: swap a card between any two Choirs, then discard Deliverance.
    can: (s, seat) => deliverancePairs(s, seat).length > 0,
    *run(s, seat) {
      const pairs = deliverancePairs(s, seat);
      const pick = yield* chooseOne(s, seat, 'deliverance', 'Deliverance: swap a card between two Choirs, then discard Deliverance?', pairs.map((x) => ({ id: `${x.a}:${x.ca}|${x.b}:${x.cb}`, label: `${cardName(x.ca)} (${pname(s, x.a)}) for ${cardName(x.cb)} (${pname(s, x.b)})` })), true);
      if (!pick) return;
      const [[a, ca], [b, cb]] = pick.split('|').map((x) => x.split(':'));
      const A = Number(a), B = Number(b);
      if (!payTribute(s, seat, A)) return;
      if (!payTribute(s, seat, B)) return;
      const cardA = removeFromChoir(s, A, ca);
      const cardB = removeFromChoir(s, B, cb);
      if (cardA) yield* enterChoir(s, B, ca);
      if (cardB) yield* enterChoir(s, A, cb);
      yield* discardFromChoir(s, seat, H.deliverance, 'Deliverance');
      log(s, 'deliverance', `${pname(s, seat)} swapped ${cardName(ca)} (${pname(s, A)}) with ${cardName(cb)} (${pname(s, B)}), and Deliverance is spent.`);
    },
  },
  [H.abaddon]: {
    // V42, spent: replace every Altar card with the top card of the Host deck, then discard Abaddon.
    can: (s, seat) => altarAvailable(s, seat).length > 0,
    *run(s, seat) {
      const keep = s.altar.filter((a) => (a.sanctuary !== undefined && a.sanctuary !== seat) || altarShielded(s, a, seat));
      const gone = s.altar.filter((a) => !keep.includes(a));
      s.discard.push(...gone.map((a) => a.id));
      for (const a of gone) yield* snareHit(s, seat, a);
      const fresh = gone.map(() => drawHost(s)).filter((c): c is string => !!c).map((id) => ({ id, facedown: false, offeredBy: null, day: s.day, kind: 'other' as const }));
      s.altar = [...keep, ...fresh];
      yield* discardFromChoir(s, seat, H.abaddon, 'Abaddon');
      log(s, 'abaddon', `${pname(s, seat)} unleashed Abaddon: ${gone.length} Altar card(s) were replaced, and Abaddon is spent.`);
    },
  },
  [H.freeWill]: {
    // V42, spent: take a second action this turn, then discard Free Will.
    can: (s, seat) => s.day_.extraAction !== seat,
    *run(s, seat) {
      s.day_.extraAction = seat;
      yield* discardFromChoir(s, seat, H.freeWill, 'Free Will');
      log(s, 'freeWill', `${pname(s, seat)} takes a second action, and Free Will is spent.`);
    },
  },
  [H.silence]: {
    // V42: choose a player; their Choir's abilities do not work until your next turn (was a once-per-game cancel).
    can: (s, seat) => others(s, seat).length > 0,
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'silence.player', "Silence: Choose a player whose Choir's abilities do not work until your next turn.", others(s, seat).map((p) => seatOpt(s, p.seat)), true);
      if (!t) return;
      s.silenced.push({ target: seatFromOpt(t), by: seat });
      log(s, 'silence', `${pname(s, seat)} Silenced ${pname(s, seatFromOpt(t))}: their Choir's abilities do not work until ${pname(s, seat)}'s next turn.`);
    },
  },
  [H.flamingSword]: {
    // V45: no other player may Exalt until the start of your next turn.
    can: (s, seat) => !s.anathema.some((a) => a.by === seat && a.action === 'exalt'),
    *run(s, seat) {
      for (const p of others(s, seat)) s.anathema.push({ target: p.seat, by: seat, action: 'exalt' });
      log(s, 'flamingSword', `No other player may Exalt until the start of ${pname(s, seat)}'s next turn (Flaming Sword).`);
    },
  },

  // ----- looking at the Altar
  [H.revelation]: {
    can: (s, seat) => altarPeekable(s, seat).length > 0,
    *run(s, seat) {
      const t = altarPeekable(s, seat);
      const pick = yield* chooseOne(s, seat, 'revelation', 'Revelation: flip a facedown card on the Altar face up.', t.map((a) => ({ id: String(s.altar.indexOf(a)), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })));
      if (pick === null) return;
      const a = s.altar[Number(pick)];
      a.facedown = false;
      a.seenBy = undefined;
      yield* snareHit(s, seat, a);
      log(s, 'revelation', `${pname(s, seat)} revealed ${cardName(a.id)} on the Altar (Revelation).`);
      // V42: then you may flip a face-up Altar card facedown.
      const up = s.altar.map((x, i) => ({ x, i })).filter(({ x }) => !x.facedown && x !== a);
      if (!up.length) return;
      const h = yield* chooseOne(s, seat, 'revelation.hide', 'Revelation: flip a face-up Altar card facedown?', up.map(({ x, i }) => ({ id: String(i), label: cardName(x.id), card: x.id })), true);
      if (h !== null) { const c = s.altar[Number(h)]; c.facedown = true; c.seenBy = []; log(s, 'revelation', `${pname(s, seat)} flipped ${cardName(c.id)} on the Altar facedown (Revelation).`); }
    },
  },
  [H.knowledge]: {
    // V38: up to 3 facedown cards (was 2).
    can: (s, seat) => altarPeekable(s, seat).some((a) => a.offeredBy !== seat),
    *run(s, seat) {
      const t = altarPeekable(s, seat).filter((a) => a.offeredBy !== seat);
      const picks = yield* ask(s, { seat, tag: 'knowledge', prompt: 'Knowledge: secretly look at up to 3 facedown cards on the Altar.', options: t.map((a) => ({ id: String(s.altar.indexOf(a)), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })), min: 1, max: Math.min(3, t.length) });
      const seen = picks.map((i) => s.altar[Number(i)]);
      // seenBy is kept for the computer players' memory; people see the cards once, here, and then must remember them.
      for (const a of seen) a.seenBy = [...(a.seenBy ?? []), seat];
      log(s, 'knowledge', `${pname(s, seat)} looked at ${seen.length} facedown card${seen.length === 1 ? '' : 's'} on the Altar (Knowledge).`);
      // Ruling confirmed November 16, 2026: shown once, then hidden again.
      yield* ask(s, { seat, tag: 'knowledge.seen', prompt: `Knowledge: ${seen.map((a) => `${altarLabel(s, a, -1)} is ${cardName(a.id)}`).join('; ')}. Remember them: they go back facedown when you close this.`, options: [{ id: 'done', label: 'Done' }], min: 1, max: 1, reveal: seen.map((a) => a.id), confirm: true });
    },
  },
  [H.belial]: {
    can: (s, seat) => altarPeekable(s, seat).length > 0,
    *run(s, seat) {
      const t = altarPeekable(s, seat);
      const pick = yield* chooseOne(s, seat, 'belial', 'Belial: look at a facedown card on the Altar.', t.map((a) => ({ id: String(s.altar.indexOf(a)), label: altarLabel(s, a, seat), seat: a.offeredBy ?? undefined })));
      if (pick === null) return;
      const a = s.altar[Number(pick)];
      a.seenBy = [...(a.seenBy ?? []), seat];
      log(s, 'belial', `${pname(s, seat)} looked at a facedown card on the Altar (Belial).`);
      const hand = s.players[seat].hand;
      // Ruling confirmed November 16, 2026: shown once (here or in the exchange choice below), then hidden again.
      if (!hand.length) {
        yield* ask(s, { seat, tag: 'belial.seen', prompt: `Belial: the card is ${cardName(a.id)}. You have no card to exchange it for. Remember it: it goes back facedown when you close this.`, options: [{ id: 'done', label: 'Done' }], min: 1, max: 1, reveal: [a.id], confirm: true });
        return;
      }
      const swap = yield* chooseOne(s, seat, 'belial.swap', `Belial: the card is ${cardName(a.id)}. Exchange it with a card from your hand? The new card stays facedown.`, hand.map((c) => cardOpt(c)), true, [a.id]);
      if (!swap) return;
      hand.splice(hand.indexOf(swap), 1, a.id);
      a.id = swap;
      a.seenBy = [seat];
      log(s, 'belial', `${pname(s, seat)} exchanged a facedown card on the Altar with one from their hand (Belial).`);
    },
  },
  // ----- Celestial turn powers (once per Day)
  [C.tempest]: {
    once: 'day',
    // V45: on a turn you Offered, destroy any card on the Altar, face up or facedown (unseen).
    can: (s, seat) => s.altar.some((a) => tempestOk(s, seat, a)),
    *run(s, seat) {
      const opts = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => tempestOk(s, seat, a));
      const pick = yield* chooseOne(s, seat, 'tempest', 'The Tempest: destroy a card on the Altar, face up or facedown.', opts.map(({ a, i }) => ({ id: String(i), label: altarLabel(s, a, seat), card: a.facedown && a.offeredBy !== seat ? undefined : a.id })));
      if (pick === null) return;
      const [a] = s.altar.splice(Number(pick), 1);
      s.discard.push(a.id);
      yield* snareHit(s, seat, a);
      log(s, 'tempest', `${pname(s, seat)} destroyed ${cardName(a.id)} on the Altar (the Tempest).`);
    },
  },
  [C.patron]: {
    once: 'day',
    // V45: exchange a card from your hand with a card in another player's Choir (Replace Targeting).
    can: (s, seat) => s.players[seat].hand.length > 0 && patronTargets(s, seat).length > 0,
    *run(s, seat) {
      const t = yield* chooseOne(s, seat, 'patron.player', "The Patron: choose a player whose Choir you will exchange with.", patronTargets(s, seat).map((p) => seatOpt(s, p)));
      if (!t) return;
      const o = seatFromOpt(t);
      const take = yield* chooseOne(s, seat, 'patron.take', `The Patron: choose a card to take from ${pname(s, o)}'s Choir into your hand.`, targetableChoir(s, seat, o, 'replace', (c) => !c.facedown).map((c) => cardOpt(c.id)));
      if (!take) return;
      const card = yield* chooseOne(s, seat, 'patron.card', `The Patron: choose a card from your hand to put into ${pname(s, o)}'s Choir in its place.`, s.players[seat].hand.map((c) => cardOpt(c)));
      if (!card || !payTribute(s, seat, o)) return;
      if (!removeFromChoir(s, o, take)) return;
      s.players[seat].hand.splice(s.players[seat].hand.indexOf(card), 1);
      s.players[seat].hand.push(take);
      yield* enterChoir(s, o, card);
      log(s, 'patron', `${pname(s, seat)} exchanged ${cardName(card)} for ${cardName(take)} in ${pname(s, o)}'s Choir (the Patron).`);
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
      if (!payTribute(s, seat, Number(o))) return;
      log(s, 'echo', `${pname(s, seat)} copied ${cardName(id)} with the Echo.`);
      yield* TURN[id].run(s, seat);
    },
  },
};

function morningStarCards(s: GameState, seat: Seat) {
  return s.players[seat].choir.filter((c) => !c.facedown && c.id.startsWith('host-'));
}

function tempestOk(s: GameState, seat: Seat, a: GameState['altar'][number]) {
  if (!s.day_.actionsTaken.some((x) => x.seat === seat && x.action === 'offer')) return false;
  return sanctuaryAllows(a, seat) && !altarShielded(s, a, seat);
}

function patronTargets(s: GameState, seat: Seat): Seat[] {
  return others(s, seat).filter((p) => targetableChoir(s, seat, p.seat, 'replace', (c) => !c.facedown).length > 0).map((p) => p.seat);
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

/** The facedown Altar cards Winnowing may discard, with their positions. */
function winnowable(s: GameState, seat: Seat) {
  return s.altar.map((a, i) => ({ a, i })).filter(({ a }) => a.facedown && !altarShielded(s, a, seat) && sanctuaryAllows(a, seat));
}
function deliverancePairs(s: GameState, seat: Seat) {
  const pool: { owner: Seat; id: string }[] = [];
  for (const p of s.players) {
    const cards = p.seat === seat ? hostCardsOf(s, seat).filter((c) => c.id !== H.deliverance) : targetableChoir(s, seat, p.seat, 'replace');
    for (const c of cards) if (canAffordTribute(s, seat, p.seat)) pool.push({ owner: p.seat, id: c.id });
  }
  const out: { a: Seat; ca: string; b: Seat; cb: string }[] = [];
  for (const x of pool) for (const y of pool) if (x.owner < y.owner) out.push({ a: x.owner, ca: x.id, b: y.owner, cb: y.id });
  return out;
}
function michaelTargets(s: GameState, seat: Seat) {
  const out: { owner: Seat; id: string }[] = [];
  for (const p of others(s, seat)) {
    if (!canAffordTribute(s, seat, p.seat)) continue;
    for (const c of targetableChoir(s, seat, p.seat, 'discard')) if (!c.facedown) out.push({ owner: p.seat, id: c.id });
  }
  return out;
}

function temptationPairs(s: GameState, seat: Seat) {
  const out: { c: string; o: Seat }[] = [];
  const hand = [...new Set(s.players[seat].hand)];
  for (const o of others(s, seat)) {
    if (protectedFrom(s, seat, o.seat, 'replace') || !canAffordTribute(s, seat, o.seat)) continue;
    if (o.choir.length >= CHOIR_LIMIT && !discardableForRoom(s, o).length) continue;
    for (const c of hand) out.push({ c, o: o.seat });
  }
  return out;
}
