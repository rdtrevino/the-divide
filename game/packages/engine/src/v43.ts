// V43 test switches: the engine reworks proposed in design/v43-proposal.md, measured before adoption.
import { H, cardName } from './data';
import {
  activation, alignment, canActivate, canAffordTribute, cardOpt, choirLimit, chooseOne, colorsOf, discardableForRoom,
  drawHost, gain, hasActive, log, makeRoom, others, payTribute, pname, protectedFrom, removeFromChoir, seatFromOpt,
  seatOpt, stat, variant,
} from './core';
import type { GameState, Gen, Seat } from './types';

const day = (s: GameState) => s.day_ as any;

/** 'wisdom-peek': when you Offer or Exalt, look at the top 2 Host cards; put 1 into your hand and discard the other. */
export function* wisdomPeek(s: GameState, seat: Seat): Gen<void> {
  if (!variant(s, 'wisdom-peek') || !hasActive(s, seat, H.wisdom) || !canActivate(s, seat, H.wisdom)) return;
  yield* activation(s, seat, H.wisdom, function* () {
    const top = [drawHost(s), drawHost(s)].filter((c): c is string => !!c);
    if (!top.length) return;
    const keep = top.length === 1 ? top[0] : (yield* chooseOne(s, seat, 'wisdom.keep', 'Wisdom: put one of the top 2 Host cards into your hand; the other is discarded.', top.map((c) => cardOpt(c)), false, top))!;
    s.players[seat].hand.push(keep);
    const rest = top.filter((c, i) => i !== top.indexOf(keep));
    s.discard.push(...rest);
    log(s, 'wisdom', `${pname(s, seat)} looked at the top 2 Host cards and kept one (Wisdom).`);
  });
}

/** Record the cards each player Offers this Day (for Gabriel's prediction). */
export function noteOffer(s: GameState, seat: Seat, cards: string[]) {
  const o = (day(s).offered ??= {});
  (o[seat] ??= []).push(...cards);
}

/** 'tribute-toll': when another player Exalts, gain 1 Glory if their Choir leans the same way as yours. */
export function* tributeToll(s: GameState, exalter: Seat): Gen<void> {
  if (!variant(s, 'tribute-toll')) return;
  const le = Math.sign(alignment(s, exalter));
  if (!le) return;
  for (const o of others(s, exalter)) {
    if (!hasActive(s, o.seat, H.tribute) || !canActivate(s, o.seat, H.tribute) || Math.sign(alignment(s, o.seat)) !== le) continue;
    yield* gain(s, o.seat, 1, H.tribute);
    log(s, 'tribute', `${o.name} gained 1 Glory: ${pname(s, exalter)}, on their side, Exalted (Tribute).`);
  }
}

/** 'parasite-feed': when you Exalt or Gather Parasite, put it into another player's Choir instead. Returns true if planted. */
export function* parasitePlant(s: GameState, seat: Seat): Gen<boolean> {
  if (!variant(s, 'parasite-feed')) return false;
  const targets = others(s, seat).filter((o) => !protectedFrom(s, seat, o.seat, 'replace') && canAffordTribute(s, seat, o.seat) && (o.choir.length < choirLimit(s) || discardableForRoom(s, o).length > 0));
  if (!targets.length) return false;
  const pick = yield* chooseOne(s, seat, 'parasite.target', "Parasite: put it into another player's Choir.", targets.map((o) => seatOpt(s, o.seat)));
  if (!pick) return false;
  const t = seatFromOpt(pick);
  if (!(yield* payTribute(s, seat, t))) return false;
  if (!(yield* makeRoom(s, t, 'Parasite'))) return false;
  s.players[t].choir.push({ id: H.parasite, facedown: false, used: false, by: seat } as any);
  stat(s, { type: 'enter_choir', seat: t, card: H.parasite });
  log(s, 'parasite', `${pname(s, seat)} planted Parasite in ${pname(s, t)}'s Choir.`);
  return true;
}

/** In the Morning: Gabriel's prediction ('gabriel-seer') and Council's partner ('council-same'). */
export function* morningV43(s: GameState): Gen<void> {
  for (const p of s.players) {
    if (variant(s, 'gabriel-seer') && hasActive(s, p.seat, H.gabriel) && canActivate(s, p.seat, H.gabriel)) {
      const ts = others(s, p.seat).filter((o) => o.hand.length && !protectedFrom(s, p.seat, o.seat, 'look'));
      const pick = ts.length ? yield* chooseOne(s, p.seat, 'seer.player', "Gabriel: look at another player's hand, then name Light or Dark.", ts.map((o) => seatOpt(s, o.seat)), true) : null;
      if (pick) {
        const t = seatFromOpt(pick);
        yield* activation(s, p.seat, H.gabriel, function* () {
          const dir = yield* chooseOne(s, p.seat, 'seer.dir', `Gabriel: ${pname(s, t)} holds ${s.players[t].hand.map(cardName).join(', ')}. Name the alignment you think they will Offer.`, [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], false, s.players[t].hand);
          (day(s).seer ??= {})[p.seat] = { t, dir };
          log(s, 'gabriel', `${p.name} looked at ${pname(s, t)}'s hand and named ${dir === 'light' ? 'Light' : 'Dark'} (Gabriel).`);
        });
      }
    }
    if (variant(s, 'council-same') && hasActive(s, p.seat, H.council) && canActivate(s, p.seat, H.council)) {
      const pick = yield* chooseOne(s, p.seat, 'council.player', 'Council: name a player. If your Choirs lean the same way at the end of the Day, each of you gains 1 Glory.', others(s, p.seat).map((o) => seatOpt(s, o.seat)), true);
      if (pick) (day(s).council ??= {})[p.seat] = seatFromOpt(pick);
    }
  }
}

/** At the end of the Day (after scoring): the V43 test payoffs. */
export function* endOfDayV43(s: GameState, order: Seat[], gained: Record<number, number>, lost: Record<number, number>, withTide: Set<Seat>): Gen<void> {
  for (const seat of order) {
    const p = s.players[seat];
    // Gabriel: +1 if the named player Offered a card of the named alignment.
    const seer = day(s).seer?.[seat];
    if (seer && hasActive(s, seat, H.gabriel) && (day(s).offered?.[seer.t] ?? []).some((c: string) => colorsOf(s, null, c)[seer.dir as 'light' | 'dark'])) { yield* gain(s, seat, 1, H.gabriel); log(s, 'gabriel', `${p.name} read ${pname(s, seer.t)} right: +1 Glory (Gabriel).`); }
    // Council: each gains 1 if your Choirs lean the same way.
    const partner = day(s).council?.[seat];
    if (partner !== undefined && hasActive(s, seat, H.council)) {
      const a = Math.sign(alignment(s, seat)), b = Math.sign(alignment(s, partner));
      if (a && a === b) { yield* gain(s, seat, 1, H.council); yield* gain(s, partner, 1, H.council); log(s, 'council', `${p.name} and ${pname(s, partner)} lean the same way: each gains 1 Glory (Council).`); }
    }
    // Tree of Life ('tree-mature'): 1 Glory a Day once it holds 3.
    const tree = p.choir.find((c) => c.id === H.treeOfLife && !c.facedown);
    if (variant(s, 'tree-mature') && tree && hasActive(s, seat, H.treeOfLife)) {
      if ((tree.store ?? 0) >= (variant(s, 'tree-mature4') ? 4 : 3)) { yield* gain(s, seat, 1, H.treeOfLife); log(s, 'treeOfLife', `${p.name}'s Tree of Life bears fruit: +1 Glory.`); }
      else tree.store = (tree.store ?? 0) + 1;
    }
    // Favor: 'favor-late' (Day 4+: 1, Day 7+: 2) or 'favor-momentum' (with the Tide today and yesterday: 1).
    if (hasActive(s, seat, H.favor)) {
      const n = variant(s, 'favor-late') ? (s.day >= 7 ? 2 : s.day >= 4 ? 1 : 0) : variant(s, 'favor-momentum') && withTide.has(seat) && ((s as any).lastWithTide ?? []).includes(seat) ? 1 : 0;
      if (n) { yield* gain(s, seat, n, H.favor); log(s, 'favor', `${p.name} gained ${n} Glory (Favor).`); }
    }
    // Remnant: 'remnant-asc2' (1 per empty place, up to 2) or 'remnant-asc1' (1 if any place is empty).
    if ((variant(s, 'remnant-asc2') || variant(s, 'remnant-asc1')) && hasActive(s, seat, H.remnant)) {
      const empty = Math.max(0, choirLimit(s) - p.choir.length);
      const n = variant(s, 'remnant-asc2') ? Math.min(2, empty) : empty > 0 ? 1 : 0;
      if (n) { yield* gain(s, seat, n, H.remnant); log(s, 'remnant', `${p.name} gained ${n} Glory (Remnant).`); }
    }
  }
  // Parasite ('parasite-feed'): its planter gains 1 when its holder lost Glory; it is discarded when its holder gained.
  if (variant(s, 'parasite-feed')) for (const p of s.players) {
    for (const c of [...p.choir]) {
      const by = (c as any).by;
      if (c.id !== H.parasite || c.facedown || by === undefined) continue;
      if (lost[p.seat] > 0) { yield* gain(s, by, 1, H.parasite); log(s, 'parasite', `${pname(s, by)} fed on ${p.name}'s loss: +1 Glory (Parasite).`); }
      else if (gained[p.seat] > 0 && removeFromChoir(s, p.seat, H.parasite)) { s.discard.push(H.parasite); log(s, 'parasite', `${p.name} prospered, and the Parasite in their Choir is discarded.`); }
    }
  }
  (s as any).lastWithTide = [...withTide];
}

/** 'eternity-relic': at the end of the Day, keep one card you Offered today on the Altar, face up, through the next Day. Returns the kept cards. */
export function* keepRelics(s: GameState, order: Seat[]): Gen<Set<object>> {
  const kept = new Set<object>();
  if (!variant(s, 'eternity-relic')) return kept;
  for (const seat of order) {
    if (!hasActive(s, seat, H.eternity) || !canActivate(s, seat, H.eternity)) continue;
    const opts = s.altar.filter((a) => a.offeredBy === seat && a.kind === 'offer' && a.day === s.day && !kept.has(a));
    if (!opts.length) continue;
    const pick = yield* chooseOne(s, seat, 'eternity.keep', 'Eternity: keep one card you Offered today on the Altar, face up, through the next Day?', opts.map((a) => ({ id: String(s.altar.indexOf(a)), label: cardName(a.id), card: a.id })), true);
    if (pick === null) continue;
    const a = s.altar[Number(pick)];
    kept.add(a);
    ((s as any).relics ??= []).push({ id: a.id, by: seat });
    log(s, 'eternity', `${pname(s, seat)} keeps ${cardName(a.id)} on the Altar for another Day (Eternity).`);
  }
  return kept;
}
export function placeRelics(s: GameState) {
  for (const r of (s as any).relics ?? []) s.altar.push({ id: r.id, facedown: false, offeredBy: r.by, day: s.day, kind: 'relic' as any });
  (s as any).relics = [];
}
