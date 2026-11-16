// The game loop: setup, Unveiling, turns, Evening, Reaping, endgame.
import { TURN } from './abilities';
import {
  activation, activeCards, alignment, altarAvailable, altarLabel, ask, askAll, baseHandLimit, baseValue, canActivate,
  canSpend, cardOpt, chooseOne, colorsOf, dirOf, discardFromChoir, discardableForRoom, drawHost, drawTo, enterChoir,
  eventOn, gain, handLimit, hasActive, isCelestial, log, lose, makeRoom, markToday, opposite, pay, pname, seatFromOpt,
  seatOpt, stat, transfer, usedToday, yesNo, CHOIR_LIMIT, variant,
} from './core';
import { C, CELESTIALS, E, EVENTS, H, HOST, HOSTS, cardName } from './data';
import { randInt, shuffle } from './rng';
import type { Dir, GameConfig, GameState, Gen, Seat, TideRecord } from './types';

export const DAYS = 6;
export const OPEN_SET_ASIDE_HOSTS = [H.revelation, H.knowledge, H.bounty, H.flamingSword, H.belial, H.hubris];
export const OPEN_SET_ASIDE_EVENTS = [E.sabbath, E.equilibrium, E.armageddon];

function freshDay(): GameState['day_'] {
  return { usedToday: {}, ordeal: [], mercy: [], defiance: [], prophecy: {}, lots: {}, actionsTaken: [], eclipsed: {}, figLeaves: [], heresy: [], handLimitBonus: 0 };
}

// ---------------------------------------------------------------- setup

export function createState(cfg: GameConfig): GameState {
  if (cfg.mode !== 'open') throw new Error('Hidden Roles is not implemented yet.');
  if (cfg.players.length < 3 || cfg.players.length > 4) throw new Error('The Open Game is for 3 or 4 players. Hidden Roles (5 and 6 players) is not implemented yet.');
  const s: GameState = {
    config: cfg, rng: cfg.seed | 0, day: 0, phase: 'setup', players: [], hostDeck: [], discard: [], altar: [],
    eventDeck: [], eventDiscard: [], currentEvent: null, firstPlayer: 0, active: null, tides: [], lastAlignColor: {},
    carriedSeed: null, pacts: [], bonds: [], scapegoats: [], anathema: [], confession: [], morningStar: [],
    day_: freshDay(), turnUsed: [], log: [], stats: [], seq: 0, decisionSeq: 0, result: null, celestialPool: [],
  };
  const hosts = HOSTS.filter((h) => !OPEN_SET_ASIDE_HOSTS.includes(h.id as any)).map((h) => h.id);
  const events = EVENTS.filter((e) => !OPEN_SET_ASIDE_EVENTS.includes(e.id as any)).map((e) => e.id);
  s.hostDeck = shuffle(s, hosts);
  s.eventDeck = shuffle(s, events);
  const pool = shuffle(s, CELESTIALS.map((c) => c.id).filter((id) => !cfg.players.some((p) => p.celestial === id)));
  s.players = cfg.players.map((p, seat) => ({
    seat, name: p.name, isBot: p.isBot, celestial: p.celestial ?? pool.pop()!, hand: [], choir: [], glory: 0,
  }));
  for (const p of s.players) {
    const n = p.celestial === C.dominion && !variant(s, 'celestial-draft') ? 4 : 3;
    for (let i = 0; i < n; i++) p.hand.push(drawHost(s)!);
    for (let i = 0; i < 3; i++) p.choir.push({ id: drawHost(s)!, facedown: false, used: false });
  }
  s.celestialPool = pool;
  s.firstPlayer = randInt(s, s.players.length);
  log(s, 'setup', `A ${s.players.length}-player Open Game begins. ${pname(s, s.firstPlayer)} is the first player.`);
  return s;
}

// ---------------------------------------------------------------- main loop

export function* runGame(s: GameState): Gen<void> {
  if (variant(s, 'celestial-draft')) yield* celestialDraft(s);
  // Raguel cards dealt into a starting Choir bind a player at the start.
  for (const p of s.players) if (p.choir.some((c) => c.id === H.raguel)) {
    p.choir = p.choir.filter((c) => c.id !== H.raguel);
    yield* enterChoir(s, p.seat, H.raguel);
  }
  for (let d = 1; d <= DAYS; d++) {
    s.day = d;
    s.day_ = freshDay();
    s.turnUsed = [];
    if (variant(s, 'catchup-order') && d > 1) {
      // The player with the least Glory acts last (ties: the one who would otherwise act earliest).
      const n0 = s.players.length;
      const rot = Array.from({ length: n0 }, (_, i) => (s.firstPlayer + i) % n0);
      const min = Math.min(...s.players.map((p) => p.glory));
      const last = rot.find((x) => s.players[x].glory === min)!;
      s.firstPlayer = (last + 1) % n0;
    }
    yield* unveiling(s);
    yield* firstFruits(s);
    s.phase = 'turns';
    const n = s.players.length;
    const snake = variant(s, 'snake-rounds');
    const rounds = variant(s, 'two-rounds') || snake ? 2 : 1;
    // Snake rounds: the second round runs in reverse (1, 2, 3 then 3, 2, 1).
    for (let r = 0; r < rounds; r++) for (let i = 0; i < n; i++) yield* takeTurn(s, (s.firstPlayer + (snake && r === 1 ? n - 1 - i : i)) % n);
    s.active = null;
    s.phase = 'evening';
    yield* evening(s, d === DAYS);
    s.firstPlayer = (s.firstPlayer + 1) % n;
  }
  yield* endGame(s);
}

// ---------------------------------------------------------------- experimental rules

/** Celestial draft: each player is offered two Celestials and keeps one. */
function* celestialDraft(s: GameState): Gen<void> {
  const picks = yield* askAll(s, s.players.map((p) => {
    const alt = s.celestialPool.pop()!;
    return { seat: p.seat, tag: 'celestial.pick', prompt: 'Choose your Celestial.', options: [p.celestial, alt].map((c) => ({ id: c, label: cardName(c), card: c })), min: 1, max: 1 };
  }));
  s.players.forEach((p, i) => {
    p.celestial = picks[i][0];
    if (p.celestial === C.dominion) p.hand.push(drawHost(s)!);
  });
  log(s, 'draft', 'Every player chose their Celestial.');
}

/**
 * First Fruits (V35): each Morning, after the Seed, every player chooses a card from hand in secret,
 * then all are revealed together and placed face up on the Altar, and each player draws 1 card.
 * No Glory; not the Offer action, so no Offer abilities trigger.
 */
function* firstFruits(s: GameState): Gen<void> {
  const ps = s.players.filter((p) => p.hand.length);
  const dark = s.currentEvent === E.pandemonium;
  const picks = yield* askAll(s, ps.map((p) => ({ seat: p.seat, tag: 'firstFruits', prompt: dark ? 'First Fruits (Pandemonium): place 1 card from your hand facedown on the Altar.' : 'First Fruits: choose 1 card from your hand. All players reveal theirs together, face up on the Altar.', options: p.hand.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), min: 1, max: 1 })));
  ps.forEach((p, k) => {
    const [c] = p.hand.splice(Number(picks[k][0]), 1);
    s.altar.push({ id: c, facedown: dark, offeredBy: p.seat, day: s.day, kind: 'fruits' });
    stat(s, { type: 'action', seat: p.seat, card: c, source: 'fruits' });
  });
  // Then each player draws 1 card, so First Fruits never shrinks a hand.
  for (const p of ps) yield* drawTo(s, p.seat, 1);
  log(s, 'fruits', dark ? 'Every player placed First Fruits facedown.' : `First Fruits: ${ps.map((p) => `${p.name} ${cardName(s.altar.find((a) => a.kind === 'fruits' && a.offeredBy === p.seat && a.day === s.day)!.id)}`).join(', ')}.`);
}

// ---------------------------------------------------------------- Unveiling

export function* unveiling(s: GameState): Gen<void> {
  s.phase = 'unveiling';
  if (s.currentEvent) s.eventDiscard.push(s.currentEvent);
  s.currentEvent = null;
  s.pacts = [];
  s.altar = [];
  log(s, 'day', `Day ${s.day} dawns.`);

  // 1. The Event (the Oracle may look first and bury it).
  const oracle = s.players.find((p) => p.celestial === C.oracle);
  if (oracle && s.eventDeck.length > 1 && canActivate(s, oracle.seat, C.oracle)) {
    const top = s.eventDeck[0];
    const use = yield* yesNo(s, oracle.seat, 'oracle.use', 'The Oracle: look at the top Event card before it is revealed?');
    if (use) {
      markToday(s, oracle.seat, C.oracle);
      yield* activation(s, oracle.seat, C.oracle, function* () {
        const a = yield* ask(s, { seat: oracle.seat, tag: 'oracle', prompt: `The Oracle: the top Event is ${cardName(top)}. Play it or bury it at the bottom of the deck?`, options: [{ id: 'play', label: `Play ${cardName(top)}` }, { id: 'bury', label: 'Bury it' }], min: 1, max: 1, reveal: [top] });
        if (a[0] === 'bury') {
          s.eventDeck.push(s.eventDeck.shift()!);
          log(s, 'oracle', `${oracle.name} buried the top Event (the Oracle).`);
        }
      });
    }
  }
  if (!s.eventDeck.length) {
    s.eventDeck = shuffle(s, s.eventDiscard.splice(0));
  }
  s.currentEvent = s.eventDeck.shift() ?? null;
  if (s.currentEvent) {
    log(s, 'event', `The Event is ${cardName(s.currentEvent)}.`, 'public', { event: s.currentEvent });
    stat(s, { type: 'event', card: s.currentEvent });
    yield* eventOnReveal(s, s.currentEvent);
  }

  // 2. Declarations.
  const whisper = s.players.find((p) => p.celestial === C.whisper);
  if (whisper && canActivate(s, whisper.seat, C.whisper)) {
    const call = yield* chooseOne(s, whisper.seat, 'whisper', 'The Whisper: publicly predict the direction of the Tide.', [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], true);
    if (call) {
      yield* activation(s, whisper.seat, C.whisper, function* () {
        s.day_.whisperCall = call as Dir;
        log(s, 'whisper', `${whisper.name} (the Whisper) predicts a ${call} Tide.`);
      });
    }
  }
  for (const p of s.players) {
    if (hasActive(s, p.seat, H.prophecy) && canActivate(s, p.seat, H.prophecy)) {
      const call = yield* chooseOne(s, p.seat, 'prophecy', 'Prophecy: declare Light or Dark. At the Reaping, gain 1 Glory if the Tide matches, lose 1 if it is the opposite.', [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], true);
      if (call) yield* activation(s, p.seat, H.prophecy, function* () {
        s.day_.prophecy[p.seat] = call as Dir;
        log(s, 'prophecy', `${p.name} declared a ${call} Prophecy.`);
      });
    }
  }
  if (s.currentEvent === E.castingLots) {
    const seats = s.players.filter((p) => eventOn(s, E.castingLots, p.seat));
    const answers = yield* askAll(s, seats.map((p) => ({ seat: p.seat, tag: 'lots', prompt: 'Casting Lots: secretly predict the Tide. Correct gains 1 Glory (2 for Neutral); wrong loses 1.', options: [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'neutral', label: 'Neutral' }], min: 1, max: 1 })));
    seats.forEach((p, i) => (s.day_.lots[p.seat] = answers[i][0] as Dir));
    log(s, 'lots', 'Every player has cast their lot.');
  }

  // 3. The Seed.
  const facedown = s.currentEvent === E.pandemonium;
  let seeds = (s.currentEvent === E.creation ? 3 : 1) + (s.config.twoSeeds ? 1 : 0);
  if (s.carriedSeed) {
    s.altar.push({ id: s.carriedSeed, facedown, offeredBy: null, day: s.day, kind: 'seed' });
    log(s, 'seed', `${cardName(s.carriedSeed)} returns as the Seed (Eternity).`);
    s.carriedSeed = null;
    seeds--;
  }
  for (let i = 0; i < seeds; i++) {
    const c = drawHost(s);
    if (!c) break;
    s.altar.push({ id: c, facedown, offeredBy: null, day: s.day, kind: 'seed' });
    log(s, 'seed', facedown ? 'A Seed is placed facedown on the Altar.' : `The Seed is ${cardName(c)}.`);
  }
}

function* eventOnReveal(s: GameState, ev: string): Gen<void> {
  if (ev === E.manna) {
    s.day_.handLimitBonus = 1;
    for (const p of s.players) yield* drawTo(s, p.seat, 1);
  }
  if (ev === E.dispersion) {
    const hands = s.players.map((p) => p.hand);
    const n = s.players.length;
    s.players.forEach((p, i) => (s.players[(i + 1) % n].hand = hands[i]));
    log(s, 'dispersion', 'Every player passed their hand to the left.');
  }
  if (ev === E.plague) {
    const picks = yield* askAll(s, s.players.map((p) => ({ seat: p.seat, tag: 'plague', prompt: 'The Plague: discard 1 Host card from your Choir. It is replaced from the top of the deck.', options: p.choir.filter((c) => c.id.startsWith('host-')).map((c) => cardOpt(c.id)), min: 1, max: 1 })));
    for (const p of s.players) {
      const id = picks[p.seat][0];
      if (!id) continue;
      yield* discardFromChoir(s, p.seat, id, 'the Plague');
      const c = drawHost(s);
      if (c && p.choir.length < CHOIR_LIMIT) yield* enterChoir(s, p.seat, c);
    }
  }
}

// ---------------------------------------------------------------- turns

export function* takeTurn(s: GameState, seat: Seat): Gen<void> {
  s.active = seat;
  // Two rounds per Day: each Choir card still activates at most once per Day.
  if (!variant(s, 'two-rounds') && !variant(s, 'snake-rounds')) s.turnUsed = [];
  s.morningStar = s.morningStar.filter((m) => m.seat !== seat);
  s.anathema = s.anathema.filter((a) => a.by !== seat);
  const p = s.players[seat];
  log(s, 'turn', `${p.name}'s turn.`);

  let actions = 1;
  const fw = p.choir.find((c) => c.id === H.freeWill && !c.facedown && !c.used);
  if (fw && canActivate(s, seat, H.freeWill)) {
    const use = yield* yesNo(s, seat, 'freeWill', 'Free Will (once per game): take two actions this turn?');
    if (use) {
      fw.used = true;
      s.turnUsed.push(H.freeWill);
      if (yield* activation(s, seat, H.freeWill, function* () { log(s, 'freeWill', `${p.name} takes two actions this turn (Free Will).`); })) actions = 2;
    }
  }
  for (let i = 0; i < actions; i++) yield* takeAction(s, seat, i);
  yield* activationPhase(s, seat);

  for (const c of s.confession) if (c.seat === seat) c.turnsLeft--;
  s.confession = s.confession.filter((c) => c.turnsLeft > 0);
}

export function exaltCost(s: GameState, seat: Seat): number {
  if (eventOn(s, E.divineCalling, seat)) return 0;
  if (hasActive(s, seat, H.outcast)) {
    const min = Math.min(...s.players.map((p) => p.glory));
    if (s.players[seat].glory === min) return 0;
  }
  return 1;
}

function canRoom(s: GameState, seat: Seat) {
  const p = s.players[seat];
  return p.choir.length < CHOIR_LIMIT || discardableForRoom(p).length > 0;
}

export function legalActions(s: GameState, seat: Seat): ('offer' | 'gather' | 'exalt')[] {
  const p = s.players[seat];
  const out: ('offer' | 'gather' | 'exalt')[] = [];
  if (p.hand.length && !s.anathema.some((a) => a.target === seat)) out.push('offer');
  if (canRoom(s, seat) && (altarAvailable(s, seat).length || s.hostDeck.length || s.discard.length)) out.push('gather');
  const cost = exaltCost(s, seat);
  if (p.hand.length && canRoom(s, seat) && !eventOn(s, E.fast, seat) && p.glory >= cost) out.push('exalt');
  return out;
}

function* takeAction(s: GameState, seat: Seat, index: number): Gen<void> {
  const legal = legalActions(s, seat);
  if (!legal.length) {
    log(s, 'pass', `${pname(s, seat)} has no legal action and passes.`);
    return;
  }
  const labels: Record<string, string> = { offer: 'Offer: play a card to the Altar and gain 1 Glory', gather: 'Gather: take a card into your Choir', exalt: `Exalt: pay ${exaltCost(s, seat)} Glory to play a card from your hand into your Choir` };
  const a = (yield* chooseOne(s, seat, 'action', index ? 'Free Will: choose your second action.' : 'Choose your action.', legal.map((id) => ({ id, label: labels[id] }))))!;
  s.day_.actionsTaken.push({ seat, action: a as any });
  for (const pact of s.pacts) if ((pact.a === seat || pact.b === seat) && pact.action === a && pact.day === s.day) pact.broken = true;
  if (a === 'offer') yield* doOffer(s, seat);
  if (a === 'gather') yield* doGather(s, seat);
  if (a === 'exalt') yield* doExalt(s, seat);
}

function* doOffer(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  const cantor = isCelestial(s, seat, C.cantor);
  const hymn = hasActive(s, seat, H.hymn);
  const lam = hasActive(s, seat, H.lamentation);
  const first = (yield* chooseOne(s, seat, 'offer.card', 'Offer: choose a card to place on the Altar.', p.hand.map((c) => cardOpt(c))))!;
  const cards = [first];
  p.hand.splice(p.hand.indexOf(first), 1);
  const col = (id: string) => colorsOf(s, null, id);
  const second = p.hand.filter((c) => cantor || (hymn && col(first).light && col(c).light) || (lam && col(first).dark && col(c).dark));
  if (second.length) {
    const why = cantor ? 'the Cantor' : hymn && col(first).light ? 'Hymn: both go face up' : 'Lamentation: both go face up';
    const pick = yield* chooseOne(s, seat, 'offer.second', `Offer a second card (${why})?`, second.map((c) => cardOpt(c)), true);
    if (pick) {
      cards.push(pick);
      p.hand.splice(p.hand.indexOf(pick), 1);
    }
  }
  // V35: Offers go facedown. Hymn and Lamentation pairs go face up (their color is shown).
  const facedown = !(cards.length === 2 && !cantor);
  for (const c of cards) s.altar.push({ id: c, facedown, offeredBy: seat, day: s.day, kind: 'offer' });
  stat(s, { type: 'action', seat, source: 'offer', data: { cards } });
  for (const c of cards) stat(s, { type: 'action', seat, card: c, source: 'offer.card' });
  log(s, 'offer', facedown ? `${p.name} Offered ${cards.length === 1 ? 'a card' : `${cards.length} cards`} facedown.` : `${p.name} Offered ${cards.map(cardName).join(' and ')} face up.`);
  if (facedown) log(s, 'offer', `You Offered ${cards.map(cardName).join(' and ')} facedown.`, [seat]);

  // Rewards: one per Offer (the Cantor gets one per card).
  const units = cantor ? cards.length : 1;
  for (let u = 0; u < units; u++) {
    const offered = cantor ? [cards[u]] : cards;
    // Raphael / Azazel: forgo this Glory to destroy an opposing card on the Altar.
    let forgone = false;
    for (const [hid, mine, theirs] of [[H.raphael, 'light', 'dark'], [H.azazel, 'dark', 'light']] as const) {
      if (forgone || !hasActive(s, seat, hid) || !offered.some((c) => col(c)[mine]) || !canActivate(s, seat, hid)) continue;
      const targets = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => !a.facedown && col(a.id)[theirs] && (a.sanctuary === undefined || a.sanctuary === seat));
      if (!targets.length) continue;
      const pick = yield* chooseOne(s, seat, hid === H.raphael ? 'raphael' : 'azazel', `${cardName(hid)}: turn your Offering face up and forgo its reward to destroy a face-up ${theirs === 'dark' ? 'Dark' : 'Light'} card on the Altar?`, targets.map(({ a, i }) => ({ id: String(i), label: cardName(a.id), card: a.id })), true);
      if (pick === null) continue;
      forgone = true;
      const target = s.altar[Number(pick)];
      const mineOffered = s.altar.find((a) => a.offeredBy === seat && a.kind === 'offer' && a.day === s.day && offered.includes(a.id) && col(a.id)[mine]);
      if (mineOffered) mineOffered.facedown = false;
      yield* activation(s, seat, hid, function* () {
        const i = s.altar.indexOf(target);
        if (i >= 0) {
          s.altar.splice(i, 1);
          s.discard.push(target.id);
          log(s, 'destroy', `${p.name} revealed their Offering and forwent its reward to destroy ${cardName(target.id)} (${cardName(hid)}).`);
        }
      });
    }
    if (forgone) continue;
    // Offer reward (V35): gain 1 Glory or draw 1 card.
    const r = yield* chooseOne(s, seat, 'offer.reward', 'Offer reward: gain 1 Glory, or draw 1 card?', [{ id: 'glory', label: 'Gain 1 Glory' }, { id: 'card', label: 'Draw 1 card' }]);
    if (r === 'card') { yield* drawTo(s, seat, 1); log(s, 'offer', `${p.name} drew a card instead of gaining Glory.`); continue; }
    // Mammon: once per Day, take this Glory from a player instead of the Pot.
    if (hasActive(s, seat, H.mammon) && !usedToday(s, seat, 'mammon') && canActivate(s, seat, H.mammon) && s.players.some((o) => o.seat !== seat && o.glory > 0)) {
      const pick = yield* chooseOne(s, seat, 'mammon.offer', 'Mammon: take this Glory from a player instead of the Pot?', s.players.filter((o) => o.seat !== seat && o.glory > 0).map((o) => seatOpt(s, o.seat)), true);
      if (pick) {
        markToday(s, seat, 'mammon');
        const from = seatFromOpt(pick);
        if (yield* activation(s, seat, H.mammon, function* () {
          transfer(s, from, seat, 1, H.mammon);
          log(s, 'mammon', `${p.name} took 1 Glory from ${pname(s, from)} (Mammon).`);
        })) continue;
      }
    }
    yield* gain(s, seat, 1, 'offer');
  }
}

function* doGather(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  const opts = altarAvailable(s, seat).map((a) => ({ id: 'altar:' + s.altar.indexOf(a), label: `From the Altar: ${altarLabel(s, a, seat)}`, card: a.facedown && a.offeredBy !== seat ? undefined : a.id }));
  if (s.hostDeck.length || s.discard.length) opts.push({ id: 'deck', label: hasActive(s, seat, H.temptation) ? 'From the top of the Host deck (Temptation: look at 2)' : 'From the top of the Host deck', card: undefined });
  if (hasActive(s, seat, H.forger) && s.discard.length && canActivate(s, seat, H.forger)) opts.push({ id: 'discard', label: `From the discard pile (Forger): ${cardName(s.discard[s.discard.length - 1])}`, card: s.discard[s.discard.length - 1] });
  if (hasActive(s, seat, H.favor) && canActivate(s, seat, H.favor)) for (const o of s.players) if (o.seat !== seat && o.hand.length) opts.push({ id: 'favor:' + o.seat, label: `From ${o.name}'s hand (Favor)`, card: undefined });
  const src = (yield* chooseOne(s, seat, 'gather.source', 'Gather: choose where to take a card from.', opts))!;
  if (!(yield* makeRoom(s, seat, 'Gather'))) return;

  let card: string | null = null;
  let fromAltar: { offeredBy: Seat | null; day: number; kind?: string } | null = null;
  if (src.startsWith('altar:')) {
    const a = s.altar[Number(src.slice(6))];
    s.altar.splice(s.altar.indexOf(a), 1);
    card = a.id;
    fromAltar = { offeredBy: a.offeredBy, day: a.day, kind: a.kind };
  } else if (src === 'deck') {
    if (hasActive(s, seat, H.temptation)) {
      const top: string[] = [];
      for (let i = 0; i < 2; i++) { const c = drawHost(s); if (c) top.push(c); }
      if (top.length === 2) {
        const pick = (yield* chooseOne(s, seat, 'temptation', 'Temptation: choose which card goes to your Choir. The other goes to your hand.', top.map((c) => cardOpt(c)), false, top))!;
        card = pick;
        p.hand.push(top.find((c) => c !== pick) ?? top[1]);
        const d = yield* chooseOne(s, seat, 'temptation.discard', 'Temptation: discard 1 card from your hand.', p.hand.map((c) => cardOpt(c)));
        if (d) { p.hand.splice(p.hand.indexOf(d), 1); s.discard.push(d); }
      } else card = top[0] ?? null;
    } else card = drawHost(s);
  } else if (src === 'discard') {
    yield* activation(s, seat, H.forger, function* () { card = s.discard.pop() ?? null; });
    if (!card) card = drawHost(s);
  } else if (src.startsWith('favor:')) {
    const o = s.players[Number(src.slice(6))];
    yield* activation(s, seat, H.favor, function* () {
      const how = yield* chooseOne(s, seat, 'favor.how', `Favor: take a random card from ${o.name}'s hand, or let them choose one to give you?`, [{ id: 'random', label: 'At random' }, { id: 'choose', label: `${o.name} chooses` }]);
      let c: string;
      if (how === 'random') c = o.hand[randInt(s, o.hand.length)];
      else c = (yield* chooseOne(s, o.seat, 'favor.give', `${p.name} is taking a card with Favor. Choose a card from your hand to give them.`, o.hand.map((x) => cardOpt(x))))!;
      o.hand.splice(o.hand.indexOf(c), 1);
      card = c;
      yield* drawTo(s, o.seat, 1);
      log(s, 'favor', `${p.name} took a card from ${o.name}'s hand (Favor). ${o.name} drew a replacement.`);
    });
    if (!card) card = drawHost(s);
  }
  if (!card) return;
  yield* enterChoir(s, seat, card);
  stat(s, { type: 'action', seat, card, source: 'gather', data: { from: src.split(':')[0] } });
  log(s, 'gather', `${p.name} Gathered ${cardName(card)}${src.startsWith('altar') ? ' from the Altar' : src === 'deck' ? ' from the Host deck' : ''}.`);
  // Snare: the player who Offered this card today gains 1 Glory.
  if (fromAltar && fromAltar.kind === 'offer' && fromAltar.offeredBy !== null && fromAltar.offeredBy !== seat && fromAltar.day === s.day && hasActive(s, fromAltar.offeredBy, H.snare)) {
    yield* gain(s, fromAltar.offeredBy, 1, H.snare);
    log(s, 'snare', `${pname(s, fromAltar.offeredBy)} gained 1 Glory (Snare).`);
  }
}

function* doExalt(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  const cost = exaltCost(s, seat);
  const card = (yield* chooseOne(s, seat, 'exalt.card', `Exalt: choose a card from your hand to play into your Choir (cost ${cost}).`, p.hand.map((c) => cardOpt(c))))!;
  // Set the chosen card aside first, so Absolution's hand discard cannot take it.
  p.hand.splice(p.hand.indexOf(card), 1);
  if (!(yield* makeRoom(s, seat, 'Exalt'))) { p.hand.push(card); return; }
  let paidTo: Seat | undefined;
  if (cost > 0 && hasActive(s, seat, H.mammon) && !usedToday(s, seat, 'mammon') && canActivate(s, seat, H.mammon)) {
    const pick = yield* chooseOne(s, seat, 'mammon.exalt', 'Mammon: pay your Exalt cost to a player of your choosing instead of the Pot?', s.players.filter((o) => o.seat !== seat).map((o) => seatOpt(s, o.seat)), true);
    if (pick) {
      markToday(s, seat, 'mammon');
      if (yield* activation(s, seat, H.mammon, function* () {})) paidTo = seatFromOpt(pick);
    }
  }
  yield* pay(s, seat, cost, 'exalt', paidTo);
  yield* enterChoir(s, seat, card);
  stat(s, { type: 'action', seat, card, source: 'exalt' });
  log(s, 'exalt', `${p.name} Exalted ${cardName(card)}${cost ? '' : ' at no cost'}.`);
}

/** After the action: activate each eligible Choir ability once, use Celestial powers, restore Flipped cards. */
function* activationPhase(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  for (let guard = 0; guard < 30; guard++) {
    const opts: { id: string; label: string; card?: string }[] = [];
    for (const c of activeCards(p)) {
      const ab = TURN[c.id];
      if (!ab || s.turnUsed.includes(c.id)) continue;
      if (ab.once === 'game' && c.used) continue;
      if (!ab.can(s, seat) || !canActivate(s, seat, c.id)) continue;
      opts.push({ id: 'card:' + c.id, label: `Activate ${cardName(c.id)}`, card: c.id });
    }
    const cel = p.celestial;
    if (TURN[cel] && !usedToday(s, seat, cel) && TURN[cel].can(s, seat) && canActivate(s, seat, cel)) opts.push({ id: 'cel:' + cel, label: `Use ${cardName(cel)}`, card: cel });
    for (const c of p.choir) if (c.facedown && canSpend(s, seat, 1)) opts.push({ id: 'restore:' + c.id, label: `Pay 1 Glory to turn ${cardName(c.id)} face up`, card: c.id });
    if (!opts.length) return;
    const pick = yield* chooseOne(s, seat, 'activate', 'Activate your Choir (each card once), or end your turn.', [...opts, { id: 'end', label: 'End turn' }]);
    if (!pick || pick === 'end') return;
    const [kind, id] = [pick.slice(0, pick.indexOf(':')), pick.slice(pick.indexOf(':') + 1)];
    if (kind === 'restore') {
      yield* pay(s, seat, 1, H.michael);
      const c = p.choir.find((x) => x.id === id);
      if (c) c.facedown = false;
      log(s, 'restore', `${p.name} paid 1 Glory to turn ${cardName(id)} face up.`);
      continue;
    }
    if (kind === 'cel') {
      markToday(s, seat, id);
      yield* activation(s, seat, id, () => TURN[id].run(s, seat));
      continue;
    }
    s.turnUsed.push(id);
    const ab = TURN[id];
    const card = p.choir.find((c) => c.id === id);
    if (ab.once === 'game' && card) card.used = true;
    yield* activation(s, seat, id, () => ab.run(s, seat));
  }
}

// ---------------------------------------------------------------- Evening

export function* evening(s: GameState, finalDay: boolean): Gen<void> {
  const n = s.players.length;
  const order = Array.from({ length: n }, (_, i) => (s.firstPlayer + i) % n);
  log(s, 'evening', 'Evening falls.');

  // V35: the Altar is revealed first, so Evening abilities act with everything known.
  const hidden = s.altar.filter((a) => a.facedown);
  for (const a of s.altar) { a.facedown = false; a.seenBy = undefined; }
  if (hidden.length) log(s, 'reveal', `The Altar is revealed: ${hidden.map((a) => cardName(a.id)).join(', ')}.`);

  // 1. In the Evening.
  for (const seat of order) {
    const p = s.players[seat];
    if (hasActive(s, seat, H.providence) && canActivate(s, seat, H.providence)) {
      const altar = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => !a.facedown && (a.sanctuary === undefined || a.sanctuary === seat));
      const mine = p.choir.filter((c) => c.id.startsWith('host-'));
      if (altar.length && mine.length) {
        const pick = yield* chooseOne(s, seat, 'providence', 'Providence: exchange a face-up Altar card with a card from your Choir?', altar.flatMap(({ a, i }) => mine.map((m) => ({ id: `${i}|${m.id}`, label: `Take ${cardName(a.id)}, give ${cardName(m.id)}`, card: a.id }))), true);
        if (pick) yield* activation(s, seat, H.providence, function* () {
          const [i, mid] = pick.split('|');
          const a = s.altar[Number(i)];
          const removed = removeChoirCard(s, seat, mid);
          if (!removed || !a) return;
          s.altar.splice(s.altar.indexOf(a), 1, { id: mid, facedown: false, offeredBy: seat, day: s.day, kind: 'other' });
          yield* enterChoir(s, seat, a.id);
          log(s, 'providence', `${p.name} exchanged ${cardName(mid)} for ${cardName(a.id)} on the Altar (Providence).`);
        });
      }
    }
    if (hasActive(s, seat, H.eternity) && canActivate(s, seat, H.eternity) && s.altar.length && !s.day_.eternityKeep) {
      const pick = yield* chooseOne(s, seat, 'eternity', "Eternity: keep a card from the Altar as the next Day's Seed?", s.altar.map((a, i) => ({ id: String(i), label: altarLabel(s, a, seat), card: a.facedown && a.offeredBy !== seat ? undefined : a.id })), true);
      if (pick !== null) yield* activation(s, seat, H.eternity, function* () {
        s.day_.eternityKeep = { seat, card: s.altar[Number(pick)].id };
        log(s, 'eternity', `${p.name} chose a card to keep as the next Seed (Eternity).`);
      });
    }
    const net = alignment(s, seat);
    if (hasActive(s, seat, H.twilight)) {
      const has = (k: 'light' | 'dark') => activeCards(p).some((c) => colorsOf(s, seat, c.id)[k]);
      if (has('light') && has('dark')) { yield* gain(s, seat, 1, H.twilight); log(s, 'twilight', `${p.name} gained 1 Glory (Twilight).`); }
    }
    if (hasActive(s, seat, H.zealot)) {
      const mags = s.players.map((o) => Math.abs(alignment(s, o.seat)));
      const mine = Math.abs(net);
      if (mine > 0 && mags.filter((m) => m >= mine).length === 1) { yield* gain(s, seat, 1, H.zealot); log(s, 'zealot', `${p.name} gained 1 Glory (Zealot).`); }
    }
    if (hasActive(s, seat, H.moderation) && net === 0) { yield* gain(s, seat, 1, H.moderation); log(s, 'moderation', `${p.name} gained 1 Glory (Moderation).`); }
  }
  // Covenants resolve in the Evening.
  for (const pact of s.pacts) {
    if (pact.broken) {
      for (const x of [pact.a, pact.b]) yield* lose(s, x, 1, H.covenant);
      log(s, 'covenant', `The Covenant between ${pname(s, pact.a)} and ${pname(s, pact.b)} was broken. Each loses 1 Glory.`);
    } else {
      for (const x of [pact.a, pact.b]) yield* gain(s, x, 1, H.covenant);
      log(s, 'covenant', `The Covenant between ${pname(s, pact.a)} and ${pname(s, pact.b)} held. Each gains 1 Glory.`);
    }
  }
  s.pacts = [];

  // 2. Set the Tide.
  const tide = setTide(s);
  s.tides.push(tide);
  stat(s, { type: 'tide', data: { ...tide } });
  log(s, 'tide', tide.dir === 'neutral' ? `The Tide is Neutral (Light ${tide.light}, Dark ${tide.dark}).` : `The Tide runs ${tide.dir === 'light' ? 'Light' : 'Dark'} by ${tide.margin} (Light ${tide.light}, Dark ${tide.dark}).`, 'public', { tide });

  // 3. The Reaping.
  yield* reaping(s, tide, order);
  if (finalDay) return;

  // 4. Refresh the Altar (Remnant first).
  for (const seat of order) {
    if (hasActive(s, seat, H.remnant) && s.altar.length && canActivate(s, seat, H.remnant)) {
      const pick = yield* chooseOne(s, seat, 'remnant', 'Remnant: before the Altar is Refreshed, take a card from it into your hand (then discard 1 card from your hand)?', s.altar.map((a, i) => ({ id: String(i), label: cardName(a.id), card: a.id })), true);
      if (pick !== null) yield* activation(s, seat, H.remnant, function* () {
        const [a] = s.altar.splice(Number(pick), 1);
        const p = s.players[seat];
        p.hand.push(a.id);
        const d = yield* chooseOne(s, seat, 'remnant.discard', 'Remnant: discard 1 card from your hand.', p.hand.map((c) => cardOpt(c)));
        if (d) { p.hand.splice(p.hand.indexOf(d), 1); s.discard.push(d); }
        log(s, 'remnant', `${p.name} took ${cardName(a.id)} from the Altar into their hand (Remnant).`);
      });
    }
  }
  const keep = s.day_.eternityKeep;
  for (const a of s.altar) {
    if (keep && a.id === keep.card) s.carriedSeed = a.id;
    else s.discard.push(a.id);
  }
  s.altar = [];

  // 5. Upkeep.
  const over = s.players.filter((p) => p.hand.length > baseHandLimit(s, p.seat));
  if (over.length) {
    const picks = yield* askAll(s, over.map((p) => ({ seat: p.seat, tag: 'upkeep.discard', prompt: `Upkeep: discard down to your hand limit (${baseHandLimit(s, p.seat)}).`, options: p.hand.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), min: p.hand.length - baseHandLimit(s, p.seat), max: p.hand.length - baseHandLimit(s, p.seat) })));
    over.forEach((p, k) => {
      const idx = picks[k].map(Number).sort((a, b) => b - a);
      for (const i of idx) s.discard.push(...p.hand.splice(i, 1));
    });
  }
  for (const p of s.players) yield* drawTo(s, p.seat, Math.max(0, baseHandLimit(s, p.seat) - p.hand.length));
}

function removeChoirCard(s: GameState, seat: Seat, id: string) {
  const p = s.players[seat];
  const i = p.choir.findIndex((c) => c.id === id);
  if (i < 0) return null;
  return p.choir.splice(i, 1)[0];
}

export function setTide(s: GameState): TideRecord {
  let light = 0;
  let dark = 0;
  const dbl = (ev: string) => (s.currentEvent === ev ? 2 : 1);
  for (const a of s.altar) {
    const v = baseValue(s, a.id);
    light += v.light * dbl(E.ascension);
    dark += v.dark * dbl(E.fallFromGrace);
  }
  const dir = dirOf(light - dark);
  return { day: s.day, dir, light, dark, margin: Math.abs(light - dark) };
}

export function* reaping(s: GameState, tide: TideRecord, order: Seat[]): Gen<void> {
  const leadersBefore = (() => {
    const max = Math.max(...s.players.map((p) => p.glory));
    return s.players.filter((p) => p.glory === max).map((p) => p.seat);
  })();

  // Choices made once the Tide is known: the Eclipse and Fig Leaves.
  for (const seat of order) {
    const p = s.players[seat];
    if (p.celestial === C.eclipse && canActivate(s, seat, C.eclipse)) {
      const cards = activeCards(p).filter((c) => c.id !== H.nephilim && baseValue(s, c.id).light + baseValue(s, c.id).dark > 0);
      const pick = yield* chooseOne(s, seat, 'eclipse', `The Eclipse: the Tide is ${tide.dir}. Treat one Host card in your Choir as Neutral for this Reaping?`, cards.map((c) => cardOpt(c.id)), true);
      if (pick) {
        markToday(s, seat, C.eclipse);
        yield* activation(s, seat, C.eclipse, function* () {
          s.day_.eclipsed[seat] = pick;
          log(s, 'eclipse', `${p.name} eclipsed ${cardName(pick)} (the Eclipse).`);
        });
      }
    }
    if (hasActive(s, seat, H.heresy) && canActivate(s, seat, H.heresy) && tide.dir !== 'neutral') {
      const net = alignment(s, seat, { reaping: true });
      if (net !== 0 && (yield* yesNo(s, seat, 'heresy', `Heresy: the Tide is ${tide.dir} and your Alignment is ${net > 0 ? 'Light' : 'Dark'} ${Math.abs(net)}. Score your Alignment in reverse this Reaping?`))) {
        yield* activation(s, seat, H.heresy, function* () {
          s.day_.heresy.push(seat);
          log(s, 'heresy', `${p.name} scores in reverse this Reaping (Heresy).`);
        });
      }
    }
    if (hasActive(s, seat, H.figLeaves) && canActivate(s, seat, H.figLeaves)) {
      const net = alignment(s, seat, { reaping: true });
      if (net !== 0 && (yield* yesNo(s, seat, 'figLeaves', `Fig Leaves: the Tide is ${tide.dir} and your Alignment is ${net > 0 ? 'Light' : 'Dark'} ${Math.abs(net)}. Treat your Choir as Neutral this Reaping?`))) {
        yield* activation(s, seat, H.figLeaves, function* () {
          s.day_.figLeaves.push(seat);
          log(s, 'figLeaves', `${p.name} covered their Choir with Fig Leaves.`);
        });
      }
    }
  }

  // Alignment scoring.
  const delta: Record<number, number> = {};
  const nets: Record<number, number> = {};
  for (const p of s.players) {
    const seat = p.seat;
    let net = alignment(s, seat, { reaping: true });
    if (s.day_.figLeaves.includes(seat)) net = 0;
    nets[seat] = net;
    if (eventOn(s, E.famine, seat)) { delta[seat] = 0; continue; }
    if (eventOn(s, E.purgatory, seat)) { delta[seat] = net === 0 ? 1 : -1; continue; }
    let dir = tide.dir;
    if (eventOn(s, E.falseProphecy, seat)) dir = opposite(dir);
    if (dir === 'neutral' || net === 0) { delta[seat] = 0; continue; }
    let match = dirOf(net) === dir;
    if (s.day_.heresy.includes(seat)) match = !match;
    if (p.celestial === C.whisper && s.day_.whisperCall && s.day_.whisperCall === tide.dir) match = true;
    let d = match ? Math.abs(net) : -Math.abs(net);
    if (s.day_.ordeal.includes(seat)) d *= 2;
    if (d > 0 && hasActive(s, seat, H.apple)) {
      const last = s.lastAlignColor[seat];
      if (last && last !== 'neutral' && dirOf(net) === opposite(last)) d *= 2;
    }
    delta[seat] = Math.max(-3, Math.min(3, d));
  }
  for (const p of s.players) s.lastAlignColor[p.seat] = dirOf(nets[p.seat]);

  // Loss adjustments: Scapegoat, Raguel bonds, Mercy.
  const loss: Record<number, number> = {};
  for (const p of s.players) loss[p.seat] = delta[p.seat] < 0 ? -delta[p.seat] : 0;
  for (const p of s.players) {
    if (!loss[p.seat]) continue;
    const sg = s.scapegoats.findIndex((x) => x.from === p.seat);
    if (sg >= 0) {
      const to = s.scapegoats[sg].to;
      s.scapegoats.splice(sg, 1);
      loss[to] = (loss[to] ?? 0) + loss[p.seat];
      log(s, 'scapegoat', `${pname(s, to)} takes ${p.name}'s Reaping loss (Scapegoat).`);
      loss[p.seat] = 0;
    }
  }
  for (const b of s.bonds) {
    if (!hasActive(s, b.owner, H.raguel)) continue;
    // V34: only the Raguel holder's loss is shared with the Bound player.
    if (loss[b.owner] > 0) {
      loss[b.bound] = Math.max(loss[b.bound], loss[b.owner]);
      log(s, 'raguel', `${pname(s, b.bound)} is Bound to ${pname(s, b.owner)} and loses ${loss[b.owner]} as well (Raguel).`);
    }
  }
  for (const seat of s.day_.mercy) loss[seat] = 0;

  const lost: Record<number, number> = {};
  for (const seat of order) {
    const p = s.players[seat];
    const g = delta[seat] > 0 ? yield* gain(s, seat, delta[seat], 'reaping') : 0;
    const l = loss[seat] ? yield* lose(s, seat, loss[seat], 'reaping') : 0;
    lost[seat] = l;
    stat(s, { type: 'reaping', seat, amount: g - l, data: { net: nets[seat], tide: tide.dir } });
    if (g || l) log(s, 'reaping', `${p.name} ${g ? `gains ${g}` : `loses ${l}`} Glory at the Reaping (Alignment ${nets[seat]}).`);
  }

  // Martyr: if you lost Glory, replace a Choir card with a card from your hand.
  for (const seat of order) {
    const p = s.players[seat];
    if (lost[seat] > 0 && hasActive(s, seat, H.martyr) && p.hand.length && canActivate(s, seat, H.martyr)) {
      const pick = yield* chooseOne(s, seat, 'martyr', 'Martyr: you lost Glory. Replace a card in your Choir with a card from your hand?', p.choir.filter((c) => c.id.startsWith('host-')).flatMap((c) => p.hand.map((h) => ({ id: `${c.id}|${h}`, label: `${cardName(c.id)} out, ${cardName(h)} in`, card: h }))), true);
      if (pick) yield* activation(s, seat, H.martyr, function* () {
        const [out, inn] = pick.split('|');
        p.hand.splice(p.hand.indexOf(inn), 1);
        yield* discardFromChoir(s, seat, out, 'Martyr');
        yield* enterChoir(s, seat, inn);
      });
    }
  }

  // Other At the Reaping abilities.
  for (const seat of order) {
    const p = s.players[seat];
    if (hasActive(s, seat, H.stillness) && tide.dir === 'neutral') { yield* gain(s, seat, 1, H.stillness); log(s, 'stillness', `${p.name} gained 1 Glory (Stillness).`); }
    if (hasActive(s, seat, H.firmament) && tide.dir !== 'neutral' && tide.margin === 1) { yield* gain(s, seat, 1, H.firmament); log(s, 'firmament', `${p.name} gained 1 Glory (Firmament).`); }
    const call = s.day_.prophecy[seat];
    if (call && tide.dir !== 'neutral') {
      if (call === tide.dir) { yield* gain(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy came true: +1 Glory.`); }
      else { yield* lose(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy failed: -1 Glory.`); }
    }
    if (hasActive(s, seat, H.leviathan)) {
      const k = s.players.filter((o) => o.seat !== seat && lost[o.seat] > 0).length;
      if (k) { yield* gain(s, seat, k, H.leviathan); log(s, 'leviathan', `${p.name} gained ${k} Glory (Leviathan).`); }
    }
    if (hasActive(s, seat, H.hubris)) {
      for (const l of leadersBefore) if (l !== seat && delta[l] > 0) {
        const t = transfer(s, l, seat, 1, H.hubris);
        if (t) log(s, 'hubris', `${pname(s, l)} gave 1 Glory to ${p.name} (Hubris).`);
      }
    }
    const lot = s.day_.lots[seat];
    if (lot) {
      if (lot === tide.dir) { const n = lot === 'neutral' ? 2 : 1; yield* gain(s, seat, n, E.castingLots); log(s, 'lots', `${p.name} called the Tide (${lot}): +${n} Glory.`); }
      else { yield* lose(s, seat, 1, E.castingLots); log(s, 'lots', `${p.name} called ${lot} and was wrong: -1 Glory.`); }
    }
  }
}

// ---------------------------------------------------------------- endgame

export function* endGame(s: GameState): Gen<void> {
  const final = s.tides[s.tides.length - 1]?.dir ?? 'neutral';
  const standings: { seat: Seat; glory: number; bonus: number; matching: number }[] = [];
  for (const p of s.players) {
    let matching = 0;
    if (final !== 'neutral') {
      const cards = [...p.hand, ...p.choir.filter((c) => !c.facedown && c.id.startsWith('host-')).map((c) => c.id)];
      for (const id of cards) {
        if (id === H.nephilim) continue;
        const v = baseValue(s, id);
        if ((final === 'light' && v.light > 0) || (final === 'dark' && v.dark > 0)) matching++;
      }
    }
    const bonus = matching ? yield* gain(s, p.seat, matching, 'bonus') : 0;
    if (bonus) log(s, 'bonus', `${p.name} gains ${bonus} bonus Glory for cards matching the final ${final} Tide.`);
    standings.push({ seat: p.seat, glory: 0, bonus, matching });
  }
  for (const st of standings) st.glory = s.players[st.seat].glory;
  const best = Math.max(...standings.map((x) => x.glory));
  let top = standings.filter((x) => x.glory === best);
  if (top.length > 1) {
    const m = Math.max(...top.map((x) => x.matching));
    top = top.filter((x) => x.matching === m);
  }
  s.result = { winners: top.map((x) => x.seat), finalTide: final, standings };
  s.phase = 'ended';
  stat(s, { type: 'game_end', data: { winners: s.result.winners, standings } });
  log(s, 'end', top.length === 1 ? `${pname(s, top[0].seat)} wins with ${best} Glory.` : `${top.map((x) => pname(s, x.seat)).join(' and ')} share the dawn with ${best} Glory.`);
}

export { HOST };
