// V43 test switches: the engine reworks proposed in design/v43-proposal.md, measured before adoption.
import { H, cardName } from './data';
import {
  activation, alignment, canActivate, canAffordTribute, cardOpt, choirLimit, chooseOne, colorsOf, discardableForRoom,
  drawHost, gain, hasActive, log, lose, makeRoom, others, payTribute, pname, protectedFrom, removeFromChoir, seatFromOpt,
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
      if ((tree.store ?? 0) >= (variant(s, 'tree-mature5') ? 5 : variant(s, 'tree-mature4') ? 4 : 3)) { yield* gain(s, seat, 1, H.treeOfLife); log(s, 'treeOfLife', `${p.name}'s Tree of Life bears fruit: +1 Glory.`); }
      else if (!variant(s, 'tree-tide') || withTide.has(seat)) tree.store = (tree.store ?? 0) + 1; // 'tree-tide': grows only on Days you lean with the Tide
    }
    // 'tree-momentum': Tree of Life takes Favor's momentum ability (with the Tide today and yesterday: 1 Glory).
    if (variant(s, 'tree-momentum') && hasActive(s, seat, H.treeOfLife) && withTide.has(seat) && ((s as any).lastWithTide ?? []).includes(seat)) { yield* gain(s, seat, 1, H.treeOfLife); log(s, 'treeOfLife', `${p.name} gained 1 Glory (Tree of Life).`); }
    // 'favor-fruits': 1 Glory if the card you gave as First Fruits matches the Tide.
    const tdir = s.tides[s.tides.length - 1]?.dir;
    const fruit = day(s).fruits?.[seat];
    if ((variant(s, 'favor-fruits') || variant(s, 'favor-fruits-alone') || variant(s, 'favor-fruits-bet')) && hasActive(s, seat, H.favor) && fruit && tdir && tdir !== 'neutral') {
      const k = tdir as 'light' | 'dark';
      const match = colorsOf(s, null, fruit)[k];
      // 'favor-fruits-alone': only if no other player's First Fruits matched the Tide. 'favor-fruits-bet': -1 if it opposed the Tide.
      const others2 = Object.entries(day(s).fruits ?? {}).filter(([o]) => Number(o) !== seat).some(([, c]) => colorsOf(s, null, c as string)[k]);
      if (match && (!variant(s, 'favor-fruits-alone') || !others2)) { yield* gain(s, seat, 1, H.favor); log(s, 'favor', `${p.name}'s First Fruits matched the Tide: +1 Glory (Favor).`); }
      else if (variant(s, 'favor-fruits-bet') && colorsOf(s, null, fruit)[k === 'light' ? 'dark' : 'light']) { yield* lose(s, seat, 1, H.favor); log(s, 'favor', `${p.name}'s First Fruits opposed the Tide: -1 Glory (Favor).`); }
    }
    // Favor: 'favor-late' (Day 4+: 1, Day 7+: 2) or 'favor-momentum' (with the Tide today and yesterday: 1).
    // Favor, Tide versions: 'favor-landslide' (Tide won by 3+ and you lean with it), 'favor-pair' (exactly two Choirs with the Tide, yours one of them),
    // 'favor-upset' (you lean with the Tide and more Choirs leaned against it than with it).
    const tide = s.tides[s.tides.length - 1];
    if ((variant(s, 'favor-landslide') || variant(s, 'favor-pair') || variant(s, 'favor-upset') || variant(s, 'favor-narrow')) && hasActive(s, seat, H.favor) && tide && tide.dir !== 'neutral' && withTide.has(seat)) {
      const sign = tide.dir === 'light' ? 1 : -1;
      const against = s.players.filter((o) => !withTide.has(o.seat) && !s.day_.figLeaves.includes(o.seat) && Math.sign(alignment(s, o.seat)) === -sign).length;
      // 'favor-narrow': Firmament's old ability (the Tide won by exactly 1), when Firmament takes Landslide ('firm-landslide').
      const ok = variant(s, 'favor-narrow') ? tide.margin === 1 : variant(s, 'favor-landslide') ? tide.margin >= 3 : variant(s, 'favor-pair') ? withTide.size === 2 : against > withTide.size;
      if (ok) { yield* gain(s, seat, 1, H.favor); log(s, 'favor', `${p.name} gained 1 Glory (Favor).`); }
    }
    if (hasActive(s, seat, H.favor) && !['favor-fruits', 'favor-fruits-alone', 'favor-fruits-bet', 'favor-landslide', 'favor-pair', 'favor-upset', 'favor-narrow', 'favor-spared'].some((v) => variant(s, v))) {
      const n = variant(s, 'favor-late') ? (s.day >= 7 ? 2 : s.day >= 4 ? 1 : 0) : variant(s, 'favor-momentum') && withTide.has(seat) && ((s as any).lastWithTide ?? []).includes(seat) ? 1 : 0;
      if (n) { yield* gain(s, seat, n, H.favor); log(s, 'favor', `${p.name} gained ${n} Glory (Favor).`); }
    }
    // Remnant: 'remnant-asc2' (1 per empty place, up to 2) or 'remnant-asc1' (1 if any place is empty).
    // 'remnant-asc2e': 1 if 2 or more places are empty.
    if ((variant(s, 'remnant-asc2') || variant(s, 'remnant-asc1') || variant(s, 'remnant-asc2e')) && hasActive(s, seat, H.remnant)) {
      const empty = Math.max(0, choirLimit(s) - p.choir.length);
      const n = variant(s, 'remnant-asc2') ? Math.min(2, empty) : variant(s, 'remnant-asc2e') ? (empty >= 2 ? 1 : 0) : empty > 0 ? 1 : 0;
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
  // 'eternity-forever': a kept card stays on the Altar until a player Gathers or removes it.
  if (variant(s, 'eternity-forever')) for (const a of s.altar) if (a.kind === 'relic' && a.offeredBy !== null && hasActive(s, a.offeredBy, H.eternity)) { kept.add(a); ((s as any).relics ??= []).push({ id: a.id, by: a.offeredBy }); }
  for (const seat of order) {
    if (!hasActive(s, seat, H.eternity) || !canActivate(s, seat, H.eternity)) continue;
    // 'eternity-any': keep any card on the Altar (Robert).
    const opts = s.altar.filter((a) => !kept.has(a) && (variant(s, 'eternity-any') ? a.kind !== 'relic' : a.offeredBy === seat && a.kind === 'offer' && a.day === s.day));
    if (!opts.length) continue;
    const pick = yield* chooseOne(s, seat, 'eternity.keep', 'Eternity: keep one card you Offered today on the Altar, face up, through the next Day?', opts.map((a) => ({ id: String(s.altar.indexOf(a)), label: cardName(a.id), card: a.id })), true);
    if (pick === null) continue;
    const a = s.altar[Number(pick)];
    kept.add(a);
    ((s as any).relics ??= []).push({ id: a.id, by: variant(s, 'eternity-any') ? a.offeredBy : seat });
    log(s, 'eternity', `${pname(s, seat)} keeps ${cardName(a.id)} on the Altar for another Day (Eternity).`);
  }
  return kept;
}
export function placeRelics(s: GameState) {
  for (const r of (s as any).relics ?? []) s.altar.push({ id: r.id, facedown: false, offeredBy: r.by, day: s.day, kind: 'relic' as any });
  (s as any).relics = [];
}
