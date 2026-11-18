// Card abilities that trigger at set moments rather than on their holder's turn: when you Offer or Exalt
// (Wisdom), when Parasite is played, In the Morning (Gabriel, Council), at the end of the Day (Gabriel, Council,
// Tree of Life, Defiance, Remnant, Parasite) and when the Altar is cleared (Eternity). Most are the V43 reworks.
import { H, cardName } from './data';
import {
  activation, alignment, canActivate, canAffordTribute, cardOpt, CHOIR_LIMIT, chooseOne, colorsOf, discardableForRoom,
  drawHost, gain, hasActive, log, makeRoom, others, payTribute, pname, protectedFrom, removeFromChoir, seatFromOpt,
  seatOpt, stat,
} from './core';
import type { AltarCard, Dir, GameState, Gen, Seat, TideRecord } from './types';

/** Wisdom: when you Offer or Exalt, look at the top 2 Host cards; put 1 into your hand and discard the other. */
export function* wisdomPeek(s: GameState, seat: Seat): Gen<void> {
  if (!hasActive(s, seat, H.wisdom) || !canActivate(s, seat, H.wisdom)) return;
  yield* activation(s, seat, H.wisdom, function* () {
    const top = [drawHost(s), drawHost(s)].filter((c): c is string => !!c);
    if (!top.length) return;
    const keep = top.length === 1 ? top[0] : (yield* chooseOne(s, seat, 'wisdom.keep', 'Wisdom: put one of the top 2 Host cards into your hand; the other is discarded.', top.map((c) => cardOpt(c)), false, top))!;
    s.players[seat].hand.push(keep);
    const rest = top.filter((_, i) => i !== top.indexOf(keep));
    s.discard.push(...rest);
    log(s, 'wisdom', `${pname(s, seat)} looked at the top 2 Host cards and kept one (Wisdom).`);
  });
}

/** Record the cards each player Offers this Day (for Gabriel's prediction). */
export function noteOffer(s: GameState, seat: Seat, cards: string[]) {
  const o = (s.day_.offered ??= {});
  (o[seat] ??= []).push(...cards);
}

/** Parasite: when you Exalt or Gather it, put it into another player's Choir instead. Returns true if planted. */
export function* parasitePlant(s: GameState, seat: Seat): Gen<boolean> {
  const targets = others(s, seat).filter((o) => !protectedFrom(s, seat, o.seat, 'replace') && canAffordTribute(s, seat, o.seat) && (o.choir.length < CHOIR_LIMIT || discardableForRoom(s, o).length > 0));
  if (!targets.length) return false;
  const pick = yield* chooseOne(s, seat, 'parasite.target', "Parasite: put it into another player's Choir.", targets.map((o) => seatOpt(s, o.seat)));
  if (!pick) return false;
  const t = seatFromOpt(pick);
  if (!payTribute(s, seat, t)) return false;
  if (!(yield* makeRoom(s, t, 'Parasite'))) return false;
  s.players[t].choir.push({ id: H.parasite, facedown: false, used: false, by: seat });
  stat(s, { type: 'enter_choir', seat: t, card: H.parasite });
  log(s, 'parasite', `${pname(s, seat)} planted Parasite in ${pname(s, t)}'s Choir.`);
  return true;
}

/** In the Morning: Gabriel's prediction and Council's partner. */
export function* morningTriggers(s: GameState): Gen<void> {
  for (const p of s.players) {
    if (hasActive(s, p.seat, H.gabriel) && canActivate(s, p.seat, H.gabriel)) {
      const ts = others(s, p.seat).filter((o) => o.hand.length && !protectedFrom(s, p.seat, o.seat, 'look'));
      const pick = ts.length ? yield* chooseOne(s, p.seat, 'seer.player', "Gabriel: look at another player's hand, then name Light or Dark.", ts.map((o) => seatOpt(s, o.seat)), true) : null;
      if (pick) {
        const t = seatFromOpt(pick);
        yield* activation(s, p.seat, H.gabriel, function* () {
          const dir = (yield* chooseOne(s, p.seat, 'seer.dir', `Gabriel: ${pname(s, t)} holds ${s.players[t].hand.map(cardName).join(', ')}. Name the alignment you think they will Offer.`, [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], false, s.players[t].hand)) as Dir;
          (s.day_.seer ??= {})[p.seat] = { t, dir };
          log(s, 'gabriel', `${p.name} looked at ${pname(s, t)}'s hand and named ${dir === 'light' ? 'Light' : 'Dark'} (Gabriel).`);
        });
      }
    }
    if (hasActive(s, p.seat, H.council) && canActivate(s, p.seat, H.council)) {
      const pick = yield* chooseOne(s, p.seat, 'council.player', 'Council: name a player. If your Choirs lean the same way at the end of the Day, each of you gains 1 Glory.', others(s, p.seat).map((o) => seatOpt(s, o.seat)), true);
      if (pick) yield* activation(s, p.seat, H.council, function* () {
        (s.day_.council ??= {})[p.seat] = seatFromOpt(pick);
        log(s, 'council', `${p.name} called a Council with ${pname(s, seatFromOpt(pick))}: if their Choirs lean the same way at the end of the Day, each gains 1 Glory.`);
      });
    }
  }
}

/** At the end of the Day, after the Reaping's scoring. */
export function* endOfDayTriggers(s: GameState, order: Seat[], gained: Record<number, number>, lost: Record<number, number>, withTide: Set<Seat>, tide: TideRecord): Gen<void> {
  for (const seat of order) {
    const p = s.players[seat];
    // Gabriel: +1 if the named player Offered a card of the named alignment.
    const seer = s.day_.seer?.[seat];
    if (seer && hasActive(s, seat, H.gabriel) && (s.day_.offered?.[seer.t] ?? []).some((c) => colorsOf(s, null, c)[seer.dir as 'light' | 'dark'])) { yield* gain(s, seat, 1, H.gabriel); log(s, 'gabriel', `${p.name} read ${pname(s, seer.t)} right: +1 Glory (Gabriel).`); }
    // Council: each gains 1 if your Choirs lean the same way.
    const partner = s.day_.council?.[seat];
    if (partner !== undefined && hasActive(s, seat, H.council)) {
      const a = Math.sign(alignment(s, seat)), b = Math.sign(alignment(s, partner));
      if (a && a === b) { yield* gain(s, seat, 1, H.council); yield* gain(s, partner, 1, H.council); log(s, 'council', `${p.name} and ${pname(s, partner)} lean the same way: each gains 1 Glory (Council).`); }
    }
    // Tree of Life: 1 Glory if your Choir leaned with the Tide today and yesterday.
    if (hasActive(s, seat, H.treeOfLife) && withTide.has(seat) && (s.lastWithTide ?? []).includes(seat)) { yield* gain(s, seat, 1, H.treeOfLife); log(s, 'treeOfLife', `${p.name} gained 1 Glory (Tree of Life).`); }
    // Defiance: 1 Glory if you lean with the Tide and more Choirs leaned against it than with it.
    if (hasActive(s, seat, H.defiance) && tide.dir !== 'neutral' && withTide.has(seat)) {
      const sign = tide.dir === 'light' ? 1 : -1;
      const against = s.players.filter((o) => !withTide.has(o.seat) && !s.day_.figLeaves.includes(o.seat) && Math.sign(alignment(s, o.seat)) === -sign).length;
      if (against > withTide.size) { yield* gain(s, seat, 1, H.defiance); log(s, 'defiance', `${p.name} gained 1 Glory (Defiance).`); }
    }
    // Remnant: 1 Glory if 2 or more places in your Choir are empty.
    if (hasActive(s, seat, H.remnant) && CHOIR_LIMIT - p.choir.length >= 2) { yield* gain(s, seat, 1, H.remnant); log(s, 'remnant', `${p.name} gained 1 Glory (Remnant).`); }
  }
  // Parasite: its planter gains 1 when its holder lost Glory; it is discarded when its holder gained.
  for (const p of s.players) {
    for (const c of [...p.choir]) {
      const by = c.by;
      if (c.id !== H.parasite || c.facedown || by === undefined) continue;
      if (lost[p.seat] > 0) { yield* gain(s, by, 1, H.parasite); log(s, 'parasite', `${pname(s, by)} fed on ${p.name}'s loss at the Reaping: +1 Glory (Parasite).`); }
      else if (gained[p.seat] > 0 && removeFromChoir(s, p.seat, H.parasite)) { s.discard.push(H.parasite); log(s, 'parasite', `${p.name} gained Glory at the Reaping, and the Parasite in their Choir is discarded.`); }
    }
  }
  s.lastWithTide = [...withTide];
}

/** Eternity: at the end of the Day, keep one card on the Altar, face up, through the next Day. Returns the kept cards. */
export function* keepRelics(s: GameState, order: Seat[]): Gen<Set<AltarCard>> {
  const kept = new Set<AltarCard>();
  for (const seat of order) {
    if (!hasActive(s, seat, H.eternity) || !canActivate(s, seat, H.eternity)) continue;
    const opts = s.altar.filter((a) => !kept.has(a) && a.kind !== 'relic');
    if (!opts.length) continue;
    const pick = yield* chooseOne(s, seat, 'eternity.keep', 'Eternity: keep one card on the Altar, face up, through the next Day?', opts.map((a) => ({ id: String(s.altar.indexOf(a)), label: cardName(a.id), card: a.id })), true);
    if (pick === null) continue;
    const a = s.altar[Number(pick)];
    kept.add(a);
    (s.relics ??= []).push({ id: a.id, by: a.offeredBy });
    log(s, 'eternity', `${pname(s, seat)} keeps ${cardName(a.id)} on the Altar for another Day (Eternity).`);
  }
  return kept;
}
export function placeRelics(s: GameState) {
  for (const r of s.relics ?? []) s.altar.push({ id: r.id, facedown: false, offeredBy: r.by, day: s.day, kind: 'relic' });
  s.relics = [];
}
