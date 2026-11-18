// The game loop: setup, then each Day's Morning, Noon (turns) and Evening, then the endgame.
import { TURN } from './abilities';
import { endOfDayTriggers, keepRelics, morningTriggers, noteOffer, parasitePlant, placeRelics, wisdomPeek } from './triggers';
import {
  activation, activeCards, alignment, altarAvailable, altarLabel, altarShielded, ask, askAll, baseHandLimit,
  baseValue, canActivate, canSpend, cardOpt, CHOIR_LIMIT, chooseOne, colorsOf, dirOf, discardableForRoom,
  discardFromChoir, drawHost, drawTo, enterChoir, eventOn, gain, hasActive, isCelestial, log, lose, makeRoom,
  markToday, opposite, others, pay, pname, sanctuaryAllows, seatFromOpt, seatOpt, snareHit, stat, transfer,
  usedToday, yesNo,
} from './core';
import { C, CELESTIALS, E, EVENTS, H, HOSTS, cardName } from './data';
import { randInt, shuffle } from './rng';
import type { TideHistory } from './core';
import type { Dir, GameConfig, GameState, Gen, Seat, TideRecord } from './types';

/** The game ends after the first Reaping at which any player has this much Glory (V43: 12, was 10). */
export const GLORY_TARGET = 12;
/** Engine safety cap only; the rules have no Day limit. */
export const MAX_DAYS = 60;
/** V42: one deck of 69 cards, all with art. Ithuriel, Urim and Asmadai (no art) are retired; their abilities moved to Revelation, Knowledge and Belial. */
export const OPEN_SET_ASIDE_HOSTS: readonly string[] = [H.ithuriel, H.urim, H.asmadai];
/** The 3 Events that move the Balance (Hidden Roles only). */
export const OPEN_SET_ASIDE_EVENTS: readonly string[] = [E.sabbath, E.equilibrium, E.armageddon];

function freshDay(): GameState['day_'] {
  return { usedToday: {}, ordeal: [], prophecy: {}, lots: {}, actionsTaken: [], eclipsed: {}, figLeaves: [], heresy: [], handLimitBonus: 0, bounty: {} };
}

// ---------------------------------------------------------------- setup

export function createState(cfg: GameConfig): GameState {
  if (cfg.mode !== 'open') throw new Error('Hidden Roles is not implemented yet.');
  if (cfg.players.length < 3 || cfg.players.length > 4) throw new Error('The Open Game is for 3 or 4 players. Hidden Roles (5 and 6 players) is not implemented yet.');
  const s: GameState = {
    config: cfg, rng: cfg.seed | 0, day: 0, phase: 'setup', players: [], hostDeck: [], discard: [], altar: [],
    eventDeck: [], eventDiscard: [], currentEvent: null, firstPlayer: 0, active: null, tides: [], lastAlignColor: {},
    pacts: [], bonds: [], anathema: [], confession: [], morningStar: [], silenced: [],
    day_: freshDay(), turnUsed: [], log: [], stats: [], seq: 0, decisionSeq: 0, result: null,
  };
  const hosts = HOSTS.filter((h) => !OPEN_SET_ASIDE_HOSTS.includes(h.id)).map((h) => h.id);
  const events = EVENTS.filter((e) => !OPEN_SET_ASIDE_EVENTS.includes(e.id)).map((e) => e.id);
  s.hostDeck = shuffle(s, hosts);
  // The Base game has no Events and no Celestials; Advanced adds both (V41).
  const advanced = !!cfg.advanced;
  s.eventDeck = advanced ? shuffle(s, events) : [];
  const pool = advanced ? shuffle(s, CELESTIALS.map((c) => c.id).filter((id) => !cfg.players.some((p) => p.celestial === id))) : [];
  s.players = cfg.players.map((p, seat) => ({
    seat, name: p.name, isBot: p.isBot, celestial: advanced ? p.celestial ?? pool.pop()! : '', hand: [], choir: [], glory: 0,
  }));
  for (const p of s.players) {
    // Each player is dealt a hidden hand and 2 random face-up Choir cards (room for 4).
    for (let i = 0; i < baseHandLimit(s, p.seat); i++) p.hand.push(drawHost(s)!);
    for (let i = 0; i < STARTING_CHOIR; i++) p.choir.push({ id: drawHost(s)!, facedown: false, used: false });
  }
  s.firstPlayer = randInt(s, s.players.length);
  log(s, 'setup', `A ${s.players.length}-player ${advanced ? 'Advanced' : 'Base'} game begins. ${pname(s, s.firstPlayer)} is the first player.`);
  return s;
}

// ---------------------------------------------------------------- main loop

/** Cards dealt face up into each starting Choir (V41: 2, leaving room to build). */
export const STARTING_CHOIR = 2;

export function* runGame(s: GameState): Gen<void> {
  // Raguel cards dealt into a starting Choir bind a player at the start.
  for (const p of s.players) if (p.choir.some((c) => c.id === H.raguel)) {
    p.choir = p.choir.filter((c) => c.id !== H.raguel);
    yield* enterChoir(s, p.seat, H.raguel);
  }
  // The game ends after the first Reaping at which anyone has reached the Glory target. There is no final Day.
  const over = () => s.players.some((p) => p.glory >= GLORY_TARGET);
  for (let d = 1; d <= MAX_DAYS; d++) {
    s.day = d;
    s.day_ = freshDay();
    s.turnUsed = [];
    yield* morning(s);
    yield* firstFruits(s);
    s.phase = 'noon';
    const n = s.players.length;
    for (let i = 0; i < n; i++) yield* takeTurn(s, (s.firstPlayer + i) % n);
    s.active = null;
    s.phase = 'evening';
    let ended = false;
    yield* evening(s, () => (ended = over()));
    if (ended) break;
    s.firstPlayer = (s.firstPlayer + 1) % n;
  }
  yield* endGame(s);
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

// ---------------------------------------------------------------- Morning

export function* morning(s: GameState): Gen<void> {
  s.phase = 'morning';
  if (s.currentEvent) s.eventDiscard.push(s.currentEvent);
  s.currentEvent = null;
  s.pacts = [];
  s.altar = [];
  log(s, 'day', `Day ${s.day} dawns.`);
  placeRelics(s);

  // 1. The Event (the Oracle may look at the top 2 first and choose one).
  const oracle = s.players.find((p) => p.celestial === C.oracle);
  if (oracle && s.eventDeck.length > 1 && canActivate(s, oracle.seat, C.oracle)) {
    const use = yield* yesNo(s, oracle.seat, 'oracle.use', 'The Oracle: look at the top Event card before it is revealed?');
    if (use) {
      markToday(s, oracle.seat, C.oracle);
      yield* activation(s, oracle.seat, C.oracle, function* () {
        // V44: look at the top 2 Events, play one, and put the other on the bottom of the deck.
        const two = s.eventDeck.slice(0, 2);
        const a = yield* ask(s, { seat: oracle.seat, tag: 'oracle.two', prompt: `The Oracle: the top Events are ${two.map(cardName).join(' and ')}. Choose the one to play; the other goes to the bottom of the deck.`, options: two.map((e, i) => ({ id: String(i), label: `Play ${cardName(e)}`, card: e })), min: 1, max: 1, reveal: two });
        const keep = two[Number(a[0])];
        const other = two.find((_, i) => i !== Number(a[0]))!;
        s.eventDeck.splice(0, 2);
        s.eventDeck.unshift(keep);
        s.eventDeck.push(other);
        log(s, 'oracle', `${oracle.name} chose the Day's Event and buried the other (the Oracle).`);
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
    const call = yield* chooseOne(s, whisper.seat, 'whisper', 'The Whisper: name Light or Dark aloud. At the Reaping, if the Tide matches, your Choir counts as leaning with it.', [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], true);
    if (call) {
      yield* activation(s, whisper.seat, C.whisper, function* () {
        s.day_.whisperCall = call as Dir;
        log(s, 'whisper', `${whisper.name} (the Whisper) predicts a ${call} Tide.`);
      });
    }
  }
  for (const p of s.players) {
    if (hasActive(s, p.seat, H.prophecy) && canActivate(s, p.seat, H.prophecy)) {
      const call = yield* chooseOne(s, p.seat, 'prophecy', 'Prophecy: declare Light or Dark. At the end of the Day, gain 1 Glory if the Tide matches; otherwise (a Neutral Tide included) lose 1.', [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], true);
      if (call) yield* activation(s, p.seat, H.prophecy, function* () {
        s.day_.prophecy[p.seat] = call as Dir;
        log(s, 'prophecy', `${p.name} declared a ${call} Prophecy.`);
      });
    }
  }
  // Bounty (V42, In the Morning): name a player; +1 if they lose Glory at the Reaping, -1 if they gain.
  for (const p of s.players) {
    if (!hasActive(s, p.seat, H.bounty) || !canActivate(s, p.seat, H.bounty)) continue;
    const t = yield* chooseOne(s, p.seat, 'bounty.player', 'Bounty: name a player. If they lose Glory at the Reaping, you gain 1; if they gain, you lose 1.', others(s, p.seat).map((o) => seatOpt(s, o.seat)), true);
    if (t) yield* activation(s, p.seat, H.bounty, function* () {
      s.day_.bounty[p.seat] = seatFromOpt(t);
      log(s, 'bounty', `${p.name} put a Bounty on ${pname(s, seatFromOpt(t))}.`);
    });
  }
  yield* morningTriggers(s); // Gabriel's prediction, Council's partner
  // Covenant (V42, In the Morning): name a player; if neither of you Offers this Day, each gains 1 Glory.
  for (const p of s.players) {
    if (!hasActive(s, p.seat, H.covenant) || !canActivate(s, p.seat, H.covenant)) continue;
    const t = yield* chooseOne(s, p.seat, 'covenant.player', 'Covenant: name a player. If neither of you Offers this Day, each of you gains 1 Glory.', others(s, p.seat).map((o) => seatOpt(s, o.seat)), true);
    if (!t) continue;
    yield* activation(s, p.seat, H.covenant, function* () {
      s.pacts.push({ a: p.seat, b: seatFromOpt(t), action: 'offer', broken: false, day: s.day });
      log(s, 'covenant', `${p.name} made a Covenant with ${pname(s, seatFromOpt(t))}: if neither Offers this Day, both gain 1 Glory.`);
    });
  }
  if (s.currentEvent === E.castingLots) {
    const seats = s.players;
    const answers = yield* askAll(s, seats.map((p) => ({ seat: p.seat, tag: 'lots', prompt: 'Casting Lots: secretly predict the Tide. Correct gains 1 Glory (2 for Neutral); wrong loses 1.', options: [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'neutral', label: 'Neutral' }], min: 1, max: 1 })));
    seats.forEach((p, i) => (s.day_.lots[p.seat] = answers[i][0] as Dir));
    log(s, 'lots', 'Every player has cast their lot.');
  }

  // Creation (Advanced Event): reveal 3 Host cards onto the Altar. There is no Seed (V41): First Fruits starts the Altar.
  if (s.currentEvent === E.creation) {
    for (let i = 0; i < 3; i++) {
      const c = drawHost(s);
      if (!c) break;
      s.altar.push({ id: c, facedown: false, offeredBy: null, day: s.day, kind: 'seed' });
    }
    log(s, 'creation', `Creation reveals ${s.altar.filter((a) => a.kind === 'seed' && a.day === s.day).map((a) => cardName(a.id)).join(', ')} onto the Altar.`);
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
    s.players.forEach((_, i) => (s.players[(i + 1) % n].hand = hands[i]));
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
  s.turnUsed = []; // each Choir card activates at most once a turn
  s.morningStar = s.morningStar.filter((m) => m.seat !== seat);
  // Anathema and Flaming Sword last until the start of their holder's next turn.
  s.anathema = s.anathema.filter((a) => a.by !== seat);
  s.silenced = s.silenced.filter((x) => x.by !== seat); // Silence lasts until the silencer's next turn
  const p = s.players[seat];
  log(s, 'turn', `${p.name}'s turn.`);

  yield* takeAction(s, seat, 0);
  yield* activationPhase(s, seat);
  // Free Will (V42): a second action, paid for during this turn's activations.
  if (s.day_.extraAction === seat) {
    s.day_.extraAction = undefined;
    yield* takeAction(s, seat, 1);
    yield* activationPhase(s, seat);
  }

  for (const c of s.confession) if (c.seat === seat) c.turnsLeft--;
  s.confession = s.confession.filter((c) => c.turnsLeft > 0);
}

function canRoom(s: GameState, seat: Seat) {
  const p = s.players[seat];
  return p.choir.length < CHOIR_LIMIT || discardableForRoom(s, p).length > 0;
}

type Action = 'offer' | 'gather' | 'exalt';

export function legalActions(s: GameState, seat: Seat): Action[] {
  const p = s.players[seat];
  const out: Action[] = [];
  if (p.hand.length && !s.anathema.some((a) => a.target === seat && (a.action ?? 'offer') === 'offer')) out.push('offer');
  // Gather takes from the Altar (V42), or from the discard pile with Forger.
  if (!s.anathema.some((a) => a.target === seat && a.action === 'gather') && canRoom(s, seat) && (altarAvailable(s, seat).length || (hasActive(s, seat, H.forger) && s.discard.length))) out.push('gather');
  // Exalt is free (V42); with Forger it may take a card from the discard pile (V43).
  const forgeable = hasActive(s, seat, H.forger) && s.discard.some((x) => x.startsWith('host-'));
  if (!s.anathema.some((a) => a.target === seat && a.action === 'exalt') && canRoom(s, seat) && !eventOn(s, E.fast) && (forgeable || p.hand.length > 0)) out.push('exalt');
  return out;
}

function* takeAction(s: GameState, seat: Seat, index: number): Gen<void> {
  const legal = legalActions(s, seat);
  if (!legal.length) {
    log(s, 'pass', `${pname(s, seat)} has no legal action and passes.`);
    return;
  }
  const labels: Record<string, string> = { offer: 'Offer: play a card to the Altar and gain 1 Glory', gather: 'Gather: take a card from the Altar into your Choir', exalt: 'Exalt: play a card from your hand into your Choir' };
  const a = (yield* chooseOne(s, seat, 'action', index ? 'Free Will: choose your second action.' : 'Choose your action.', legal.map((id) => ({ id, label: labels[id] }))))!;
  s.day_.actionsTaken.push({ seat, action: a as Action });
  for (const pact of s.pacts) if ((pact.a === seat || pact.b === seat) && pact.action === a && pact.day === s.day) pact.broken = true;
  if (a === 'offer') yield* doOffer(s, seat);
  if (a === 'gather') yield* doGather(s, seat);
  if (a === 'exalt') yield* doExalt(s, seat);
}

function* doOffer(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  const cantor = isCelestial(s, seat, C.cantor);
  const first = (yield* chooseOne(s, seat, 'offer.card', 'Offer: choose a card to place on the Altar.', p.hand.map((c) => cardOpt(c))))!;
  const cards = [first];
  p.hand.splice(p.hand.indexOf(first), 1);
  const col = (id: string) => colorsOf(s, null, id);
  // The Cantor (V44) may Offer a second card of the first's alignment (two Neutral cards also pair); the pair goes face up.
  const neu = (c: string) => !col(c).light && !col(c).dark;
  const sameSide = (c: string) => (col(first).light && col(c).light) || (col(first).dark && col(c).dark) || (neu(first) && neu(c));
  const second = cantor ? p.hand.filter(sameSide) : [];
  if (second.length) {
    const pick = yield* chooseOne(s, seat, 'offer.second', 'Offer a second card (the Cantor)?', second.map((c) => cardOpt(c)), true);
    if (pick) {
      cards.push(pick);
      p.hand.splice(p.hand.indexOf(pick), 1);
    }
  }
  // V35: Offers go facedown, except the Cantor's pair and Hymn and Lamentation (V43), which go face up.
  const facedown = cards.length !== 2;
  for (const c of cards) s.altar.push({ id: c, facedown: facedown && c !== H.hymn && c !== H.lamentation, offeredBy: seat, day: s.day, kind: 'offer' });
  noteOffer(s, seat, cards);
  stat(s, { type: 'action', seat, source: 'offer', data: { cards } });
  for (const c of cards) stat(s, { type: 'action', seat, card: c, source: 'offer.card' });
  log(s, 'offer', facedown ? `${p.name} Offered ${cards.length === 1 ? 'a card' : `${cards.length} cards`} facedown.` : `${p.name} Offered ${cards.map(cardName).join(' and ')} face up.`);
  if (facedown) log(s, 'offer', `You Offered ${cards.map(cardName).join(' and ')} facedown.`, [seat]);

  // Rewards: one per Offer (the Cantor gets one per card).
  const units = cantor ? cards.length : 1;
  for (let u = 0; u < units; u++) {
    const offered = cantor ? [cards[u]] : cards;
    // Raphael / Azazel: turn your Offering face up to destroy an opposing face-up card on the Altar (V43: the reward is kept).
    for (const [hid, mine, theirs] of [[H.raphael, 'light', 'dark'], [H.azazel, 'dark', 'light']] as const) {
      if (!hasActive(s, seat, hid) || !offered.some((c) => col(c)[mine]) || !canActivate(s, seat, hid)) continue;
      const targets = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => !a.facedown && col(a.id)[theirs] && sanctuaryAllows(a, seat) && !altarShielded(s, a, seat));
      if (!targets.length) continue;
      const pick = yield* chooseOne(s, seat, hid === H.raphael ? 'raphael' : 'azazel', `${cardName(hid)}: turn your Offering face up and forgo its reward to destroy a face-up ${theirs === 'dark' ? 'Dark' : 'Light'} card on the Altar?`, targets.map(({ a, i }) => ({ id: String(i), label: cardName(a.id), card: a.id })), true);
      if (pick === null) continue;
      const target = s.altar[Number(pick)];
      const mineOffered = s.altar.find((a) => a.offeredBy === seat && a.kind === 'offer' && a.day === s.day && offered.includes(a.id) && col(a.id)[mine]);
      if (mineOffered) mineOffered.facedown = false;
      yield* activation(s, seat, hid, function* () {
        const i = s.altar.indexOf(target);
        if (i >= 0) {
          s.altar.splice(i, 1);
          s.discard.push(target.id);
          yield* snareHit(s, seat, target);
          log(s, 'destroy', `${p.name} revealed their Offering to destroy ${cardName(target.id)} (${cardName(hid)}).`);
        }
      });
    }
    // The Offer's reward is 1 Glory.
    yield* gain(s, seat, 1, 'offer');
  }
  yield* wisdomPeek(s, seat);
}

function* doGather(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  const opts = altarAvailable(s, seat).map((a) => ({ id: 'altar:' + s.altar.indexOf(a), label: `From the Altar: ${altarLabel(s, a, seat)}`, card: a.facedown && a.offeredBy !== seat ? undefined : a.id }));
  // Forger (V37): may take any Host card from the discard pile.
  if (hasActive(s, seat, H.forger) && s.discard.length && canActivate(s, seat, H.forger)) for (const c of [...new Set(s.discard.filter((x) => x.startsWith('host-')))]) opts.push({ id: 'discard:' + c, label: `From the discard pile (Forger): ${cardName(c)}`, card: c });
  const src = (yield* chooseOne(s, seat, 'gather.source', 'Gather: choose where to take a card from.', opts))!;
  if (!(yield* makeRoom(s, seat, 'Gather'))) return;

  let card: string | null = null;
  let fromAltar: { offeredBy: Seat | null; day: number; kind?: string } | null = null;
  if (src.startsWith('altar:')) {
    const a = s.altar[Number(src.slice(6))];
    s.altar.splice(s.altar.indexOf(a), 1);
    card = a.id;
    fromAltar = { offeredBy: a.offeredBy, day: a.day, kind: a.kind };
  } else if (src.startsWith('discard:')) {
    const want = src.slice(8);
    yield* activation(s, seat, H.forger, function* () { const i = s.discard.lastIndexOf(want); if (i >= 0) { s.discard.splice(i, 1); card = want; } });
    if (!card) card = drawHost(s);
  }
  if (!card) return;
  if (fromAltar) yield* snareHit(s, seat, fromAltar);
  if (card === H.parasite && (yield* parasitePlant(s, seat))) { stat(s, { type: 'action', seat, card, source: 'gather', data: { from: src.split(':')[0] } }); return; }
  yield* enterChoir(s, seat, card);
  stat(s, { type: 'action', seat, card, source: 'gather', data: { from: src.split(':')[0] } });
  log(s, 'gather', `${p.name} Gathered ${cardName(card)}${src.startsWith('altar') ? ' from the Altar' : ''}.`);
}

function* doExalt(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  // Forger (V43): you may Exalt a card from the discard pile instead.
  const forge = hasActive(s, seat, H.forger) && canActivate(s, seat, H.forger) ? [...new Set(s.discard.filter((x) => x.startsWith('host-')))] : [];
  let card = (yield* chooseOne(s, seat, 'exalt.card', 'Exalt: choose a card from your hand to play into your Choir.', [...p.hand.map((c) => cardOpt(c)), ...forge.map((c) => cardOpt(c, 'discard:'))]))!;
  let fromDiscard = false;
  if (card.startsWith('discard:')) { card = card.slice(8); fromDiscard = true; }
  // Set the chosen card aside first, so Absolution's hand discard cannot take it.
  if (fromDiscard) { s.discard.splice(s.discard.lastIndexOf(card), 1); log(s, 'forger', `${p.name} took ${cardName(card)} from the discard pile (Forger).`); }
  else p.hand.splice(p.hand.indexOf(card), 1);
  // Parasite (V43) goes into another player's Choir.
  if (card === H.parasite && (yield* parasitePlant(s, seat))) { stat(s, { type: 'action', seat, card, source: 'exalt' }); yield* wisdomPeek(s, seat); return; }
  if (!(yield* makeRoom(s, seat, 'Exalt'))) { p.hand.push(card); return; }
  yield* enterChoir(s, seat, card);
  stat(s, { type: 'action', seat, card, source: 'exalt' });
  // Divine Calling (V44): an Exalt earns 1 Glory, like an Offer.
  if (eventOn(s, E.divineCalling)) { yield* gain(s, seat, 1, E.divineCalling); log(s, 'calling', `${p.name} gained 1 Glory (Divine Calling).`); }
  yield* wisdomPeek(s, seat);
  // Seraphim (Legion), V42: 1 Glory when you Exalt another Light (Dark) card.
  if (hasActive(s, seat, H.seraphim) && colorsOf(s, null, card).light && card !== H.seraphim) { yield* gain(s, seat, 1, H.seraphim); log(s, 'seraphim', `${p.name} gained 1 Glory (Seraphim).`); }
  if (hasActive(s, seat, H.legion) && colorsOf(s, null, card).dark && card !== H.legion) { yield* gain(s, seat, 1, H.legion); log(s, 'legion', `${p.name} gained 1 Glory (Legion).`); }
  log(s, 'exalt', `${p.name} Exalted ${cardName(card)}.`);
}

/** After the action: activate each eligible Choir ability once, and use Celestial powers. */
export function* activationPhase(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  for (let guard = 0; guard < 30; guard++) {
    const opts: { id: string; label: string; card?: string }[] = [];
    for (const c of activeCards(p)) {
      const ab = TURN[c.id];
      if (!ab || s.turnUsed.includes(c.id)) continue;
      if (!ab.can(s, seat) || !canActivate(s, seat, c.id)) continue;
      opts.push({ id: 'card:' + c.id, label: `Activate ${cardName(c.id)}`, card: c.id });
    }
    const cel = p.celestial;
    if (TURN[cel] && !usedToday(s, seat, cel) && TURN[cel].can(s, seat) && canActivate(s, seat, cel)) opts.push({ id: 'cel:' + cel, label: `Use ${cardName(cel)}`, card: cel });
    if (!opts.length) return;
    const pick = yield* chooseOne(s, seat, 'activate', 'Activate your Choir (each card once), or end your turn.', [...opts, { id: 'end', label: 'End turn' }]);
    if (!pick || pick === 'end') return;
    const [kind, id] = [pick.slice(0, pick.indexOf(':')), pick.slice(pick.indexOf(':') + 1)];
    if (kind === 'cel') {
      markToday(s, seat, id);
      yield* activation(s, seat, id, () => TURN[id].run(s, seat));
      continue;
    }
    s.turnUsed.push(id);
    yield* activation(s, seat, id, () => TURN[id].run(s, seat));
  }
}

// ---------------------------------------------------------------- Evening

export function* evening(s: GameState, finalDay: boolean | (() => boolean)): Gen<void> {
  const n = s.players.length;
  const order = Array.from({ length: n }, (_, i) => (s.firstPlayer + i) % n);
  log(s, 'evening', 'Evening falls.');

  // Fig Leaves (V43): decided in the Evening, before the Altar is revealed.
  for (const seat of order) {
    if (!hasActive(s, seat, H.figLeaves) || !canActivate(s, seat, H.figLeaves) || s.day_.figLeaves.includes(seat)) continue;
    if (yield* yesNo(s, seat, 'figLeaves.evening', 'Fig Leaves: before the Altar is revealed, have your Choir sit out this Day?')) {
      yield* activation(s, seat, H.figLeaves, function* () { s.day_.figLeaves.push(seat); log(s, 'figLeaves', `${pname(s, seat)}'s Choir sits out this Day (Fig Leaves).`); });
    }
  }
  // V38 the Eclipse: chosen In the Evening, before the Altar is revealed.
  for (const seat of order) {
    const p = s.players[seat];
    if (p.celestial !== C.eclipse || !canActivate(s, seat, C.eclipse)) continue;
    const cards = activeCards(p).filter((c) => c.id !== H.nephilim && baseValue(s, c.id).light + baseValue(s, c.id).dark > 0);
    const pick = yield* chooseOne(s, seat, 'eclipse.early', 'The Eclipse: before the Altar is revealed, treat one Host card in your Choir as Neutral for this Reaping?', cards.map((c) => cardOpt(c.id)), true);
    if (pick) {
      markToday(s, seat, C.eclipse);
      yield* activation(s, seat, C.eclipse, function* () { s.day_.eclipsed[seat] = pick; log(s, 'eclipse', `${p.name} eclipsed ${cardName(pick)} (the Eclipse).`); });
    }
  }
  // V35: the Altar is revealed first, so Evening abilities act with everything known.
  const hidden = s.altar.filter((a) => a.facedown);
  s.day_.reveal = { down: hidden.length, up: s.altar.length - hidden.length };
  for (const a of s.altar) { a.facedown = false; a.seenBy = undefined; }
  if (hidden.length) log(s, 'reveal', `The Altar is revealed: ${hidden.map((a) => cardName(a.id)).join(', ')}.`);

  // Covenants resolve in the Evening.
  for (const pact of s.pacts) {
    if (pact.broken) {
      log(s, 'covenant', `The Covenant between ${pname(s, pact.a)} and ${pname(s, pact.b)} was broken: one of them Offered. No Glory.`);
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
  log(s, 'tide', tide.dir === 'neutral' ? `The Tide is Neutral (Light ${tide.light}, Dark ${tide.dark}).` : `The Tide runs ${tide.dir === 'light' ? 'Light' : 'Dark'} by ${tide.margin} (Light ${tide.light}, Dark ${tide.dark}).`, 'public',
    // The Altar as it was counted (every card is face up by now), so the site can show the Evening after the fact.
    { tide, event: s.currentEvent, altar: s.altar.map((a) => ({ id: a.id, offeredBy: a.offeredBy, kind: a.kind })) });

  // At the Reaping, before scoring (V41: the four timing labels; these were "In the Evening" and now see the Tide).
  for (const seat of order) {
    const p = s.players[seat];
    const net = alignment(s, seat);
    // Twilight (V43): 2 Glory if your other cards hold as many Light as Dark cards, at least 1 of each.
    if (hasActive(s, seat, H.twilight)) {
      const cnt = (k: 'light' | 'dark') => activeCards(p).filter((c) => c.id !== H.twilight && colorsOf(s, seat, c.id)[k]).length;
      if (cnt('light') >= 1 && cnt('light') === cnt('dark')) { yield* gain(s, seat, 2, H.twilight); log(s, 'twilight', `${p.name} gained 2 Glory (Twilight).`); }
    }
    // Zealot (V42): 1 Glory if the other cards in your Choir (at least 3) all share one alignment.
    if (hasActive(s, seat, H.zealot)) {
      const zo = activeCards(p).filter((c) => c.id !== H.zealot);
      const allO = (k: 'light' | 'dark') => zo.every((c) => colorsOf(s, seat, c.id)[k]);
      if (zo.length >= 3 && (allO('light') || allO('dark'))) { yield* gain(s, seat, 1, H.zealot); log(s, 'zealot', `${p.name} gained 1 Glory (Zealot).`); }
    }
    if (hasActive(s, seat, H.moderation) && net === 0) { yield* gain(s, seat, 1, H.moderation); log(s, 'moderation', `${p.name} gained 1 Glory (Moderation).`); }
  }
  // 3. The Reaping.
  yield* reaping(s, tide, order);
  if (typeof finalDay === 'function' ? finalDay() : finalDay) return;

  // 4. Refresh the Altar: Eternity keeps its cards, the rest are discarded.
  const relics = yield* keepRelics(s, order);
  for (const a of s.altar) if (!relics.has(a)) s.discard.push(a.id);
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

/** The Tide from the cards on the Altar. Takes only what it reads, so the site can tally the face-up cards. */
export function setTide(s: TideHistory & { altar: { id: string }[]; currentEvent: string | null }): TideRecord {
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
  // Alignment scoring (V42). With the Tide: alone 3, two 1 each, three or more nothing.
  // Against it: alone -3, otherwise -1. A Choir that leans neither way scores nothing.
  const delta: Record<number, number> = {};
  const nets: Record<number, number> = {};
  const withTide: { seat: Seat; dbl: number }[] = [];
  const leansWithTide = new Set<Seat>();
  const against: { seat: Seat; dbl: number }[] = [];
  for (const p of s.players) {
    const seat = p.seat;
    let net = alignment(s, seat, { reaping: true });
    if (s.day_.figLeaves.includes(seat)) net = 0;
    nets[seat] = net;
    delta[seat] = 0;
    if (eventOn(s, E.famine)) continue;
    // Purgatory (V44): no Choir loses at the Reaping, and a Choir that leans neither way gains 1 (one that sits out does not).
    if (eventOn(s, E.purgatory) && net === 0 && !s.day_.figLeaves.includes(seat)) { delta[seat] = 1; continue; }
    let dir = tide.dir;
    if (eventOn(s, E.falseProphecy)) dir = opposite(dir);
    if (dir === 'neutral' || net === 0) continue;
    let match = dirOf(net) === dir;
    if (s.day_.heresy.includes(seat)) match = !match;
    if (p.celestial === C.whisper && s.day_.whisperCall && s.day_.whisperCall === tide.dir) match = true;
    const dbl = s.day_.ordeal.includes(seat) ? 2 : 1;
    if (match) { withTide.push({ seat, dbl }); leansWithTide.add(seat); }
    else { delta[seat] = -1 * dbl; against.push({ seat, dbl }); }
  }
  if (against.length === 1) delta[against[0].seat] = -3 * against[0].dbl;
  if (withTide.length === 1) delta[withTide[0].seat] = 3 * withTide[0].dbl;
  if (withTide.length === 2) for (const w of withTide) delta[w.seat] = w.dbl;
  // Scapegoat (V42): pay 1 Glory so another player who would gain at this Reaping gains nothing.
  for (const seat of order) {
    if (!hasActive(s, seat, H.scapegoat) || !canActivate(s, seat, H.scapegoat) || !canSpend(s, seat, 1)) continue;
    const gaining = others(s, seat).filter((o) => delta[o.seat] > 0);
    if (!gaining.length) continue;
    const pick = yield* chooseOne(s, seat, 'scapegoat.deny', 'Scapegoat: pay 1 Glory so one of these players gains nothing at this Reaping?', gaining.map((o) => seatOpt(s, o.seat)), true);
    if (!pick) continue;
    yield* pay(s, seat, 1, H.scapegoat);
    const t = seatFromOpt(pick);
    delta[t] = 0;
    log(s, 'scapegoat', `${pname(s, seat)} paid 1 Glory: ${pname(s, t)} gains nothing this Reaping (Scapegoat).`);
  }
  // Mercy (V42, spent): if yours is the only Choir against the Tide, lose 1 instead of 3, then discard Mercy.
  const spentMercy: Seat[] = [];
  if (against.length === 1) {
    const a = against[0];
    if (hasActive(s, a.seat, H.mercy) && canActivate(s, a.seat, H.mercy) && (yield* yesNo(s, a.seat, 'mercy', 'Mercy: yours is the only Choir against the Tide. Lose 1 instead of 3, then discard Mercy?'))) {
      if (yield* activation(s, a.seat, H.mercy, function* () { log(s, 'mercy', `${pname(s, a.seat)} is spared: loses 1 instead of 3, and Mercy is spent.`); })) { delta[a.seat] = -1 * a.dbl; spentMercy.push(a.seat); }
    }
  }
  log(s, 'share', withTide.length === 0 ? 'No Choir leans with the Tide.' : withTide.length >= 3 ? `${withTide.length} Choirs lean with the Tide, so none of them scores.` : withTide.length === 1 ? `${pname(s, withTide[0].seat)} leans with the Tide alone.` : `${withTide.map((w) => pname(s, w.seat)).join(' and ')} share the Tide.`);
  const prevLean = { ...s.lastAlignColor };
  for (const seat of spentMercy) yield* discardFromChoir(s, seat, H.mercy, 'Mercy');
  for (const p of s.players) s.lastAlignColor[p.seat] = dirOf(nets[p.seat]);

  s.day_.against = against.map((a) => a.seat); // the Arbiter
  const loss: Record<number, number> = {};
  for (const p of s.players) loss[p.seat] = delta[p.seat] < 0 && !eventOn(s, E.purgatory) ? -delta[p.seat] : 0;
  const lost: Record<number, number> = {};
  const gained: Record<number, number> = {};
  for (const seat of order) {
    const p = s.players[seat];
    const g = delta[seat] > 0 ? yield* gain(s, seat, delta[seat], 'reaping') : 0;
    const l = loss[seat] ? yield* lose(s, seat, loss[seat], 'reaping') : 0;
    lost[seat] = l;
    gained[seat] = g;
    stat(s, { type: 'reaping', seat, amount: g - l, data: { net: nets[seat], tide: tide.dir } });
    if (g || l) log(s, 'reaping', `${p.name} ${g ? `gains ${g}` : `loses ${l}`} Glory at the Reaping (${s.day_.figLeaves.includes(seat) ? 'sitting out' : nets[seat] === 0 ? 'leans neither way' : `leans ${nets[seat] > 0 ? 'Light' : 'Dark'}`}).`);
  }

  // Bounty (V42): +1 if the player you named lost Glory at this Reaping, -1 if they gained.
  for (const [k, t] of Object.entries(s.day_.bounty)) {
    const seat = Number(k);
    if (!hasActive(s, seat, H.bounty)) continue;
    if (lost[t] > 0) { yield* gain(s, seat, 1, H.bounty); log(s, 'bounty', `${pname(s, t)} lost Glory at the Reaping: ${pname(s, seat)} collects the Bounty.`); }
    else if (gained[t] > 0) { yield* lose(s, seat, 1, H.bounty); log(s, 'bounty', `${pname(s, t)} gained Glory at the Reaping: ${pname(s, seat)}'s Bounty costs them 1 Glory.`); }
  }
  // Raguel (V42): each Reaping your Bound player gains Glory, you gain 1; when they lose, you lose 1.
  for (const b of s.bonds) {
    if (hasActive(s, b.owner, H.raguel) && lost[b.bound] > 0) { yield* lose(s, b.owner, 1, H.raguel); log(s, 'raguel', `${pname(s, b.bound)} lost Glory at the Reaping, so ${pname(s, b.owner)} loses 1 (Raguel).`); continue; }
    if (!hasActive(s, b.owner, H.raguel) || !(gained[b.bound] > 0)) continue;
    yield* gain(s, b.owner, 1, H.raguel);
    log(s, 'raguel', `${pname(s, b.bound)} gained at the Reaping, so ${pname(s, b.owner)} gains 1 Glory (Raguel).`);
  }
  yield* endOfDayTriggers(s, order, gained, lost, leansWithTide, tide);

  // Other At the Reaping abilities.
  for (const seat of order) {
    const p = s.players[seat];
    // Veil (V42): 1 Glory if more Altar cards were facedown than face up when it was revealed.
    const rv = s.day_.reveal ?? { down: 0, up: 0 };
    if (hasActive(s, seat, H.veil) && rv.down > rv.up) { yield* gain(s, seat, 1, H.veil); log(s, 'veil', `${p.name} gained 1 Glory (Veil).`); }
    if (hasActive(s, seat, H.stillness) && tide.dir === 'neutral') { yield* gain(s, seat, 1, H.stillness); log(s, 'stillness', `${p.name} gained 1 Glory (Stillness).`); }
    // Firmament (V42): 1 Glory if the Tide was won by exactly 1 and your Choir leans with it.
    if (hasActive(s, seat, H.firmament) && tide.dir !== 'neutral' && tide.margin === 1 && leansWithTide.has(seat)) { yield* gain(s, seat, 1, H.firmament); log(s, 'firmament', `${p.name} gained 1 Glory (Firmament).`); }
    // Vessel (V42): +1 if the card it placed today is still on the Altar and matches the Tide, -1 if it opposes it.
    if (hasActive(s, seat, H.vessel) && tide.dir !== 'neutral' && s.altar.some((a) => a.kind === 'vessel' && a.offeredBy === seat && colorsOf(s, null, a.id)[tide.dir as 'light' | 'dark'])) { yield* gain(s, seat, 1, H.vessel); log(s, 'vessel', `${p.name} gained 1 Glory (Vessel).`); }
    if (hasActive(s, seat, H.vessel) && tide.dir !== 'neutral' && s.altar.some((a) => a.kind === 'vessel' && a.offeredBy === seat && colorsOf(s, null, a.id)[opposite(tide.dir as 'light' | 'dark') as 'light' | 'dark'])) { yield* lose(s, seat, 1, H.vessel); log(s, 'vessel', `${p.name} lost 1 Glory (Vessel).`); }
    const call = s.day_.prophecy[seat];
    if (call) { // V38: a Neutral Tide is a miss
      if (call === tide.dir) { yield* gain(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy came true: +1 Glory.`); }
      else { yield* lose(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy failed: -1 Glory.`); }
    }
    // V38 Outcast: 1 Glory at the Reaping while you have the least Glory.
    if (hasActive(s, seat, H.outcast) && p.glory === Math.min(...s.players.map((o) => o.glory))) { yield* gain(s, seat, 1, H.outcast); log(s, 'outcast', `${p.name} gained 1 Glory (Outcast).`); }
    // Apple (V43): 2 Glory if your Choir leans the other way from yesterday (it rewards switching sides).
    if (hasActive(s, seat, H.apple)) {
      const was = prevLean[seat];
      if (was && was !== 'neutral' && nets[seat] !== 0 && dirOf(nets[seat]) === opposite(was)) { yield* gain(s, seat, 2, H.apple); log(s, 'apple', `${p.name} switched sides and gains 2 Glory (Apple).`); }
    }
    // Uriel and Beelzebub (V42): 2 Glory if 3 or more other cards in your Choir are of their color.
    for (const [id, k] of [[H.uriel, 'light'], [H.beelzebub, 'dark']] as const) {
      const setN = activeCards(p).filter((c) => colorsOf(s, seat, c.id)[k] && c.id !== id).length;
      if (hasActive(s, seat, id) && setN >= 3) { yield* gain(s, seat, 2, id); log(s, 'set', `${p.name} gained 2 Glory (${cardName(id)}).`); }
    }
    // Providence (V42): if your Choir leans with the Tide, put 1 Glory from the Pot on it.
    const prov = p.choir.find((c) => c.id === H.providence && !c.facedown);
    if (prov && hasActive(s, seat, H.providence) && leansWithTide.has(seat)) { prov.store = (prov.store ?? 0) + 1; log(s, 'providence', `1 Glory is stored on ${p.name}'s Providence (${prov.store} in all).`); }
    // Mammon (V42): the Dark store, like Providence.
    const mam = p.choir.find((c) => c.id === H.mammon && !c.facedown);
    if (mam && hasActive(s, seat, H.mammon) && leansWithTide.has(seat)) { mam.store = (mam.store ?? 0) + 1; log(s, 'mammon', `1 Glory is stored on ${p.name}'s Mammon (${mam.store} in all).`); }
    // Leviathan (V43): 1 Glory if the Tide was won by 3 or more and your Choir leans with it.
    if (hasActive(s, seat, H.leviathan) && tide.dir !== 'neutral' && tide.margin >= 3 && leansWithTide.has(seat)) { yield* gain(s, seat, 1, H.leviathan); log(s, 'leviathan', `${p.name} rode the landslide: +1 Glory (Leviathan).`); }
    // Favor (V43): 1 Glory if two or more other players lost Glory at this Reaping.
    const twoLost = s.players.filter((o) => o.seat !== seat && lost[o.seat] > 0).length >= 2;
    if (hasActive(s, seat, H.favor) && twoLost) { yield* gain(s, seat, 1, H.favor); log(s, 'favor', `${p.name} gained 1 Glory: two or more other players lost Glory at the Reaping (Favor).`); }
    // Hubris (V42): if the player with the most Glory gained 4 or more this Day (from anything), they give 1 to you.
    if (hasActive(s, seat, H.hubris)) {
      const dayGain = (x: Seat) => s.stats.filter((e) => e.type === 'glory' && e.seat === x && e.day === s.day && (e.amount ?? 0) > 0).reduce((t, e) => t + (e.amount ?? 0), 0);
      const max = Math.max(...s.players.map((o) => o.glory));
      const payers = s.players.filter((o) => o.seat !== seat && o.glory === max && dayGain(o.seat) >= 4).map((o) => o.seat);
      const l = payers.length > 1 ? seatFromOpt((yield* chooseOne(s, seat, 'hubris', 'Hubris: choose which leader gives you 1.', payers.map((x) => seatOpt(s, x))))!) : payers[0];
      if (l !== undefined && transfer(s, l, seat, 1, H.hubris)) log(s, 'hubris', `${pname(s, l)} gave 1 Glory to ${p.name} (Hubris).`);
    }
    const lot = s.day_.lots[seat];
    if (lot) {
      if (lot === tide.dir) { const n = lot === 'neutral' ? 2 : 1; yield* gain(s, seat, n, E.castingLots); log(s, 'lots', `${p.name} called the Tide (${lot}): +${n} Glory.`); }
      else { yield* lose(s, seat, 1, E.castingLots); log(s, 'lots', `${p.name} called ${lot} and was wrong: -1 Glory.`); }
    }
  }

  s.morningStar = [];
}

// ---------------------------------------------------------------- endgame

export function* endGame(s: GameState): Gen<void> {
  // V41: no endgame bonus. Most Glory wins; a tie is shared.
  const final = s.tides[s.tides.length - 1]?.dir ?? 'neutral';
  const standings = s.players.map((p) => ({ seat: p.seat, glory: p.glory }));
  const best = Math.max(...standings.map((x) => x.glory));
  const top = standings.filter((x) => x.glory === best);
  s.result = { winners: top.map((x) => x.seat), finalTide: final, standings };
  s.phase = 'ended';
  stat(s, { type: 'game_end', data: { winners: s.result.winners, standings } });
  log(s, 'end', top.length === 1 ? `${pname(s, top[0].seat)} wins with ${best} Glory.` : `${top.map((x) => pname(s, x.seat)).join(' and ')} share the win with ${best} Glory.`);
}
