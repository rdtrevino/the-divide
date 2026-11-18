// The game loop: setup, then each Day's Morning, Noon (turns) and Evening, then the endgame.
import { TURN, temptationSwap } from './abilities';
import {
  activation, activeCards, alignment, altarAvailable, altarLabel, ask, askAll, baseHandLimit, baseValue, canActivate,
  canSpend, cardOpt, chooseOne, colorsOf, dirOf, discardFromChoir, discardableForRoom, drawHost, drawTo, enterChoir,
  eventOn, gain, handLimit, hasActive, isCelestial, log, lose, makeRoom, markToday, opposite, pay, pname, seatFromOpt,
  seatOpt, stat, transfer, usedToday, yesNo, choirLimit, variant, leastGloryOthers, immune, glorySafe, handProtected, others,
} from './core';
import { C, CELESTIALS, E, EVENTS, H, HOST, HOSTS, cardName } from './data';
import { randInt, shuffle } from './rng';
import type { Dir, GameConfig, GameState, Gen, Seat, TideRecord } from './types';

/** The game ends after the first Reaping at which any player has this much Glory (V41: 10). */
export const GLORY_TARGET = 10;
/** Engine safety cap only; the rules have no Day limit. */
export const MAX_DAYS = 60;
/** The Glory target: 10, or 'target-N' to test others. */
export const gloryTarget = (s: GameState) => Number((s.config.variants ?? []).find((v) => v.startsWith('target-'))?.slice(7) ?? GLORY_TARGET);
/** V42: one deck of 69 cards, all with art. Ithuriel, Urim and Asmadai (no art) are retired; their abilities moved to Revelation, Knowledge and Belial. */
export const OPEN_SET_ASIDE_HOSTS = [H.ithuriel, H.urim, H.asmadai];
export const OPEN_SET_ASIDE_EVENTS = [E.sabbath, E.equilibrium, E.armageddon];

function freshDay(): GameState['day_'] {
  return { usedToday: {}, ordeal: [], mercy: [], defiance: [], prophecy: {}, lots: {}, actionsTaken: [], eclipsed: {}, figLeaves: [], heresy: [], handLimitBonus: 0, bounty: {} };
}

// ---------------------------------------------------------------- setup

export function createState(cfg: GameConfig): GameState {
  if (cfg.mode !== 'open') throw new Error('Hidden Roles is not implemented yet.');
  if (cfg.players.length < 3 || cfg.players.length > 4) throw new Error('The Open Game is for 3 or 4 players. Hidden Roles (5 and 6 players) is not implemented yet.');
  const s: GameState = {
    config: cfg, rng: cfg.seed | 0, day: 0, phase: 'setup', players: [], hostDeck: [], discard: [], altar: [],
    eventDeck: [], eventDiscard: [], currentEvent: null, firstPlayer: 0, active: null, tides: [], lastAlignColor: {},
    carriedSeed: null, pacts: [], bonds: [], scapegoats: [], anathema: [], confession: [], morningStar: [], immune: [], silenced: [],
    day_: freshDay(), turnUsed: [], log: [], stats: [], seq: 0, decisionSeq: 0, result: null, celestialPool: [],
  };
  const hosts = HOSTS.filter((h) => !OPEN_SET_ASIDE_HOSTS.includes(h.id as any)).map((h) => h.id);
  const events = EVENTS.filter((e) => !OPEN_SET_ASIDE_EVENTS.includes(e.id as any)).map((e) => e.id);
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
    // For testing: 'choir-N' deals N Choir cards; 'pick-K' deals K extra hand cards to choose a Choir from.
    const n = baseHandLimit(s, p.seat) + pickCount(s);
    for (let i = 0; i < n; i++) p.hand.push(drawHost(s)!);
    for (let i = 0; i < choirCount(s); i++) p.choir.push({ id: drawHost(s)!, facedown: false, used: false });
  }
  s.celestialPool = pool;
  s.firstPlayer = randInt(s, s.players.length);
  log(s, 'setup', `A ${s.players.length}-player ${advanced ? 'Advanced' : 'Base'} game begins. ${pname(s, s.firstPlayer)} is the first player.`);
  return s;
}

// ---------------------------------------------------------------- main loop

const numVariant = (s: GameState, pre: string) => { const v = (s.config.variants ?? []).find((x) => x.startsWith(pre)); return v === undefined ? null : Number(v.slice(pre.length)); };
/** Cards dealt face up into each starting Choir (V41: 2, leaving room to build). */
export const STARTING_CHOIR = 2;
const pickCount = (s: GameState) => numVariant(s, 'pick-') ?? 0;
const choirCount = (s: GameState) => numVariant(s, 'choir-') ?? (pickCount(s) ? 0 : STARTING_CHOIR);

export function* runGame(s: GameState): Gen<void> {
  if (pickCount(s)) {
    // Test only: choose the starting Choir from a larger hand.
    const k = pickCount(s);
    const picks = yield* askAll(s, s.players.map((p) => ({ seat: p.seat, tag: 'choir.pick', prompt: `Choose ${k} cards from your hand for your starting Choir. Everyone reveals theirs together.`, options: p.hand.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), min: k, max: k })));
    s.players.forEach((p, i) => {
      const idx = picks[i].map(Number).sort((a, b) => b - a);
      const chosen = idx.map((j) => p.hand.splice(j, 1)[0]);
      for (const c of chosen.reverse()) p.choir.push({ id: c, facedown: false, used: false });
    });
  }
  // Raguel cards dealt into a starting Choir bind a player at the start.
  for (const p of s.players) if (p.choir.some((c) => c.id === H.raguel)) {
    p.choir = p.choir.filter((c) => c.id !== H.raguel);
    yield* enterChoir(s, p.seat, H.raguel);
  }
  // The game ends after the first Reaping at which anyone has reached the Glory target. There is no final Day.
  const target = gloryTarget(s);
  const over = () => s.players.some((p) => p.glory >= target);
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

// ---------------------------------------------------------------- Unveiling

export function* morning(s: GameState): Gen<void> {
  s.phase = 'morning';
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
  // Test 'heresy-morning': Heresy is decided in the Morning, before anyone Offers.
  if (variant(s, 'heresy-morning')) for (const p of s.players) {
    if (!hasActive(s, p.seat, H.heresy) || !canActivate(s, p.seat, H.heresy)) continue;
    if (yield* yesNo(s, p.seat, 'heresy.morning', 'Heresy: your Choir counts as leaning the opposite way this Day?')) {
      yield* activation(s, p.seat, H.heresy, function* () { s.day_.heresy.push(p.seat); log(s, 'heresy', `${p.name}'s Choir counts as leaning the opposite way this Day (Heresy).`); });
    }
  }
  if (variant(s, 'bounty-morning')) for (const p of s.players) {
    if (!hasActive(s, p.seat, H.bounty)) continue;
    const t = yield* chooseOne(s, p.seat, 'bounty.player', 'Bounty: name a player. If they lose Glory at this Reaping, you gain 1.', others(s, p.seat).map((o) => seatOpt(s, o.seat)), variant(s, 'bounty-bet') || variant(s, 'bounty-bet-soft'));
    if (t) s.day_.bounty[p.seat] = seatFromOpt(t);
  }
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
    const seats = s.players.filter((p) => eventOn(s, E.castingLots, p.seat));
    const answers = yield* askAll(s, seats.map((p) => ({ seat: p.seat, tag: 'lots', prompt: 'Casting Lots: secretly predict the Tide. Correct gains 1 Glory (2 for Neutral); wrong loses 1.', options: [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'neutral', label: 'Neutral' }], min: 1, max: 1 })));
    seats.forEach((p, i) => (s.day_.lots[p.seat] = answers[i][0] as Dir));
    log(s, 'lots', 'Every player has cast their lot.');
  }

  // Creation (Advanced Event): reveal 3 Host cards onto the Altar. There is no Seed (V41): First Fruits starts the Altar.
  if (s.currentEvent === E.creation) {
    const facedown = false;
    for (let i = 0; i < 3; i++) {
      const c = drawHost(s);
      if (!c) break;
      s.altar.push({ id: c, facedown, offeredBy: null, day: s.day, kind: 'seed' });
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
      if (c && p.choir.length < choirLimit(s)) yield* enterChoir(s, p.seat, c);
    }
  }
}

// ---------------------------------------------------------------- turns

export function* takeTurn(s: GameState, seat: Seat): Gen<void> {
  s.active = seat;
  // Two rounds per Day: each Choir card still activates at most once per Day.
  s.turnUsed = [];
  s.morningStar = s.morningStar.filter((m) => m.seat !== seat);
  // Anathema (V42) lasts until the end of its holder's next turn; Flaming Sword until the start of it.
  s.anathema = s.anathema.filter((a) => a.by !== seat || a.endAfter);
  for (const a of s.anathema) if (a.by === seat && a.endAfter) a.armed = true;
  s.silenced = s.silenced.filter((x) => x.by !== seat); // Silence lasts until the silencer's next turn
  const p = s.players[seat];
  log(s, 'turn', `${p.name}'s turn.`);

  try {
  yield* takeAction(s, seat, 0);
  yield* activationPhase(s, seat);
  // Free Will (V42): a second action, paid for during this turn's activations.
  if (s.day_.extraAction === seat) {
    s.day_.extraAction = undefined;
    yield* takeAction(s, seat, 1);
    yield* activationPhase(s, seat);
  }
  } finally {
    s.anathema = s.anathema.filter((a) => !(a.by === seat && a.armed));
  }

  for (const c of s.confession) if (c.seat === seat) c.turnsLeft--;
  s.confession = s.confession.filter((c) => c.turnsLeft > 0);
}

export function exaltCost(s: GameState, seat: Seat, card?: string): number {
  if (eventOn(s, E.divineCalling, seat)) return 0;
  // Test 'exalt-free': Exalt costs no Glory.
  if (variant(s, 'exalt-free')) return 0;
  // Seraphim (V42): Exalting a Light card costs nothing. Test 'legion-free': Legion does the same for Dark.
  if (card && hasActive(s, seat, H.seraphim) && colorsOf(s, null, card).light) return 0;
  if (card && variant(s, 'legion-free') && hasActive(s, seat, H.legion) && colorsOf(s, null, card).dark) return 0;
  if (hasActive(s, seat, H.outcast)) {
    const min = Math.min(...s.players.map((p) => p.glory));
    if (s.players[seat].glory === min) return 0;
  }
  return 1;
}

function canRoom(s: GameState, seat: Seat) {
  const p = s.players[seat];
  return p.choir.length < choirLimit(s) || discardableForRoom(s, p).length > 0;
}

export function legalActions(s: GameState, seat: Seat): ('offer' | 'gather' | 'exalt')[] {
  const p = s.players[seat];
  const out: ('offer' | 'gather' | 'exalt')[] = [];
  if (p.hand.length && !s.anathema.some((a) => a.target === seat && (a.action ?? 'offer') === 'offer')) out.push('offer');
  if (!s.anathema.some((a) => a.target === seat && a.action === 'gather') && canRoom(s, seat) && (altarAvailable(s, seat).length || (!variant(s, 'gather-altar') && (s.hostDeck.length || s.discard.length)) || (hasActive(s, seat, H.forger) && s.discard.length))) out.push('gather');
  if (!s.anathema.some((a) => a.target === seat && a.action === 'exalt') && canRoom(s, seat) && !eventOn(s, E.fast, seat) && p.hand.some((c) => p.glory >= exaltCost(s, seat, c))) out.push('exalt');
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
    // Test 'offer-noglory': an Offer earns no Glory; it only sways the Altar.
    if (variant(s, 'offer-noglory')) continue;
    // The Offer's reward is 1 Glory (V40: no longer a choice of 1 Glory or 1 card).
    // Mammon: when the Offer includes a Dark card, take this Glory from another player instead of the Pot.
    const mamFrom = s.players.filter((o) => o.seat !== seat && o.glory > 0 && !glorySafe(s, seat, o.seat));
    const mamOk = offered.some((c) => col(c).dark);
    if (mamOk && !variant(s, 'mammon-store') && hasActive(s, seat, H.mammon) && canActivate(s, seat, H.mammon) && mamFrom.length) {
      const pick = yield* chooseOne(s, seat, 'mammon.offer', 'Mammon: take this Glory from a player instead of the Pot?', mamFrom.map((o) => seatOpt(s, o.seat)), true);
      if (pick) {
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
  // Test 'gather-altar': Gather takes a card from the Altar only (no blind draw from the deck).
  if (!variant(s, 'gather-altar') && (s.hostDeck.length || s.discard.length)) opts.push({ id: 'deck', label: hasActive(s, seat, H.temptation) ? 'From the top of the Host deck (Temptation: look at 2)' : 'From the top of the Host deck', card: undefined });
  // V37: Forger may take any Host card from the discard pile (was the top card only).
  if (hasActive(s, seat, H.forger) && s.discard.length && canActivate(s, seat, H.forger)) for (const c of [...new Set(s.discard.filter((x) => x.startsWith('host-')))]) opts.push({ id: 'discard:' + c, label: `From the discard pile (Forger): ${cardName(c)}`, card: c });
  if (!variant(s, 'favor-ripen') && hasActive(s, seat, H.favor) && canActivate(s, seat, H.favor)) for (const o of s.players) if (o.seat !== seat && o.hand.length && !handProtected(s, seat, o.seat)) opts.push({ id: 'favor:' + o.seat, label: `From ${o.name}'s hand (Favor)`, card: undefined });
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
  } else if (src.startsWith('discard:')) {
    const want = src.slice(8);
    yield* activation(s, seat, H.forger, function* () { const i = s.discard.lastIndexOf(want); if (i >= 0) { s.discard.splice(i, 1); card = want; } });
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
  const affordable = p.hand.filter((c) => p.glory >= exaltCost(s, seat, c));
  const card = (yield* chooseOne(s, seat, 'exalt.card', `Exalt: choose a card from your hand to play into your Choir (cost ${exaltCost(s, seat)}${hasActive(s, seat, H.seraphim) ? '; Light cards are free with Seraphim' : ''}).`, affordable.map((c) => cardOpt(c))))!;
  const cost = exaltCost(s, seat, card);
  // Set the chosen card aside first, so Absolution's hand discard cannot take it.
  p.hand.splice(p.hand.indexOf(card), 1);
  if (!(yield* makeRoom(s, seat, 'Exalt'))) { p.hand.push(card); return; }
  yield* pay(s, seat, cost, 'exalt');
  yield* enterChoir(s, seat, card);
  stat(s, { type: 'action', seat, card, source: 'exalt' });
  // Test 'seraph-refund': Seraphim (Legion) pays 1 Glory when you Exalt a Light (Dark) card.
  if (variant(s, 'seraph-refund')) {
    if (hasActive(s, seat, H.seraphim) && colorsOf(s, null, card).light && card !== H.seraphim) { yield* gain(s, seat, 1, H.seraphim); log(s, 'seraphim', `${p.name} gained 1 Glory (Seraphim).`); }
    if (hasActive(s, seat, H.legion) && colorsOf(s, null, card).dark && card !== H.legion) { yield* gain(s, seat, 1, H.legion); log(s, 'legion', `${p.name} gained 1 Glory (Legion).`); }
  }
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
      if (c) { c.facedown = false; delete (c as any).michael; }
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

export function* evening(s: GameState, finalDay: boolean | (() => boolean)): Gen<void> {
  const n = s.players.length;
  const order = Array.from({ length: n }, (_, i) => (s.firstPlayer + i) % n);
  log(s, 'evening', 'Evening falls.');

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
  const mirageDraw = s.players.filter((p) => hasActive(s, p.seat, H.mirage) && s.altar.some((a) => a.facedown && a.offeredBy === p.seat && a.kind === 'offer')).map((p) => p.seat);
  // V38 Mirage: remember each holder's facedown Offerings; at the Reaping, 1 Glory if one is still there and matches the Tide.
  (s.day_ as any).mirageCards = Object.fromEntries(mirageDraw.map((seat) => [seat, s.altar.filter((a) => a.facedown && a.offeredBy === seat && a.kind === 'offer').map((a) => a.id)]));
  const hidden = s.altar.filter((a) => a.facedown);
  (s.day_ as any).reveal = { down: hidden.length, up: s.altar.length - hidden.length };
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
    // Eternity (V42): 1 Glory if you did not Offer this Day.
    if (hasActive(s, seat, H.eternity) && !s.day_.actionsTaken.some((x) => x.seat === seat && x.action === 'offer')) { yield* gain(s, seat, 1, H.eternity); log(s, 'eternity', `${p.name} did not Offer today and gains 1 Glory (Eternity).`); }
    const net = alignment(s, seat);
    if (hasActive(s, seat, H.twilight)) {
      const has = (k: 'light' | 'dark') => activeCards(p).some((c) => colorsOf(s, seat, c.id)[k]);
      if (has('light') && has('dark')) { yield* gain(s, seat, 1, H.twilight); log(s, 'twilight', `${p.name} gained 1 Glory (Twilight).`); }
    }
    // Zealot (V42): 1 Glory if your Choir has 3 or more cards, all of one color.
    if (hasActive(s, seat, H.zealot) && !variant(s, 'zealot-open')) {
      const cards = activeCards(p);
      const all = (k: 'light' | 'dark') => cards.every((c) => colorsOf(s, seat, c.id)[k]);
      // Test 'zealot-others': every other card in your Choir (at least 3) shares one alignment.
      const zo = cards.filter((c) => c.id !== H.zealot);
      const allO = (k: 'light' | 'dark') => zo.every((c) => colorsOf(s, seat, c.id)[k]);
      if (variant(s, 'zealot-others') ? zo.length >= 3 && (allO('light') || allO('dark')) : cards.length >= 3 && (all('light') || all('dark'))) { yield* gain(s, seat, 1, H.zealot); log(s, 'zealot', `${p.name} gained 1 Glory (Zealot).`); }
    }
    if (hasActive(s, seat, H.moderation) && net === 0) { yield* gain(s, seat, 1, H.moderation); log(s, 'moderation', `${p.name} gained 1 Glory (Moderation).`); }
  }
  // 3. The Reaping.
  yield* reaping(s, tide, order);
  if (typeof finalDay === 'function' ? finalDay() : finalDay) return;

  // 4. Refresh the Altar (Remnant first).
  for (const seat of order) {
    // Tests: 'remnant-own' (only a card you Offered), 'remnant-cost' (pay 1 Glory).
    const rOpts = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => !variant(s, 'remnant-own') || (a.offeredBy === seat && a.kind !== 'vessel'));
    if (!variant(s, 'remnant-off') && hasActive(s, seat, H.remnant) && rOpts.length && canActivate(s, seat, H.remnant) && (!variant(s, 'remnant-cost') || s.players[seat].glory >= 1)) {
      const pick = yield* chooseOne(s, seat, 'remnant', 'Remnant: take a card from the Altar into your hand (then discard 1 card from your hand)?', rOpts.map(({ a, i }) => ({ id: String(i), label: cardName(a.id), card: a.id })), true);
      if (pick !== null && variant(s, 'remnant-cost')) yield* pay(s, seat, 1, H.remnant);
      if (pick !== null) yield* activation(s, seat, H.remnant, function* () {
        const [a] = s.altar.splice(Number(pick), 1);
        const p = s.players[seat];
        p.hand.push(a.id);
        // 'remnant-own': no discard here; Upkeep (next) discards down to, or draws up to, the hand limit.
        if (variant(s, 'remnant-own')) { log(s, 'remnant', `${p.name} took back ${cardName(a.id)} from the Altar into their hand (Remnant).`); return; }
        const d = yield* chooseOne(s, seat, 'remnant.discard', 'Remnant: discard 1 card from your hand.', p.hand.map((c) => cardOpt(c)));
        if (d) { p.hand.splice(p.hand.indexOf(d), 1); s.discard.push(d); }
        log(s, 'remnant', `${p.name} took ${cardName(a.id)} from the Altar into their hand (Remnant).`);
      });
    }
  }
  // Test 'temptation-eod': at the end of the Day, discard any number of cards from your hand, then draw that many.
  if (variant(s, 'temptation-eod')) for (const seat of order) {
    if (hasActive(s, seat, H.temptation) && s.players[seat].hand.length && canActivate(s, seat, H.temptation)) yield* activation(s, seat, H.temptation, function* () { yield* temptationSwap(s, seat); });
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

  // V38 Michael: up to the Reaping, the owner of a card Michael Flipped may pay 1 Glory to Flip it face up.
  // The last chance comes here, after the Tide is known.
  for (const seat of order) {
    const p = s.players[seat];
    for (const c of p.choir) {
      if (!c.facedown || !(c as any).michael || !canSpend(s, seat, 1)) continue;
      if (!(yield* yesNo(s, seat, 'michael.restore', `Michael: the Tide is ${tide.dir}. Pay 1 Glory to Flip ${cardName(c.id)} face up before the Reaping?`))) continue;
      yield* pay(s, seat, 1, H.michael);
      c.facedown = false;
      delete (c as any).michael;
      log(s, 'restore', `${p.name} paid 1 Glory to turn ${cardName(c.id)} face up.`);
    }
  }

  // Alignment scoring.
  // V41 coalition scoring. Choirs leaning with the Tide share it: alone 3; two, 2 for the stronger lean and 1 for
  // the weaker (a tie, 1 each); three or more, nothing. A Choir leaning against the Tide loses 1. Neutral: nothing.
  const delta: Record<number, number> = {};
  const nets: Record<number, number> = {};
  const withTide: { seat: Seat; str: number; dbl: number }[] = [];
  const leansWithTide = new Set<Seat>();
  const against: { seat: Seat; dbl: number }[] = [];
  for (const p of s.players) {
    const seat = p.seat;
    let net = alignment(s, seat, { reaping: true });
    if (s.day_.figLeaves.includes(seat)) net = 0;
    nets[seat] = net;
    delta[seat] = 0;
    if (eventOn(s, E.famine, seat)) continue;
    if (eventOn(s, E.purgatory, seat)) { delta[seat] = net === 0 ? 1 : -1; continue; }
    let dir = tide.dir;
    if (eventOn(s, E.falseProphecy, seat)) dir = opposite(dir);
    if (dir === 'neutral' || net === 0) continue;
    let match = dirOf(net) === dir;
    if (s.day_.heresy.includes(seat)) match = !match;
    if (p.celestial === C.whisper && s.day_.whisperCall && s.day_.whisperCall === tide.dir) match = true;
    const dbl = s.day_.ordeal.includes(seat) ? 2 : 1;
    if (match) { withTide.push({ seat, str: Math.abs(net), dbl }); leansWithTide.add(seat); }
    else { delta[seat] = -1 * dbl; against.push({ seat, dbl }); }
  }
  // Test 'reap-mirror' (Robert): the loss mirrors the win. A lone Choir against the Tide loses 3; otherwise 1 each.
  if (variant(s, 'reap-mirror') && against.length === 1) delta[against[0].seat] = -3 * against[0].dbl;
  // Test 'scapegoat-sac' / 'scapegoat-sac-free': if you share the Tide, sacrifice one of the others sharing it.
  if (variant(s, 'scapegoat-sac') || variant(s, 'scapegoat-sac-free') || variant(s, 'scapegoat-sac2') || variant(s, 'scapegoat-crowd')) for (const w of [...withTide]) {
    if (withTide.length < (variant(s, 'scapegoat-crowd') ? 3 : 2) || !withTide.includes(w) || !hasActive(s, w.seat, H.scapegoat) || !canActivate(s, w.seat, H.scapegoat)) continue;
    const free = variant(s, 'scapegoat-sac-free');
    const cost = free ? 0 : variant(s, 'scapegoat-sac2') ? 2 : 1;
    if (!canSpend(s, w.seat, cost)) continue;
    const others2 = withTide.filter((x) => x.seat !== w.seat);
    const pick = yield* chooseOne(s, w.seat, 'scapegoat.sac', `Scapegoat: ${withTide.length} Choirs share the Tide. ${free ? '' : 'Pay 1 Glory to '}Name one of them to score nothing and not count?`, others2.map((x) => seatOpt(s, x.seat)), true);
    if (!pick) continue;
    if (cost) yield* pay(s, w.seat, cost, H.scapegoat);
    const t = seatFromOpt(pick);
    withTide.splice(withTide.findIndex((x) => x.seat === t), 1);
    log(s, 'scapegoat', `${pname(s, w.seat)} made ${pname(s, t)} the Scapegoat: they score nothing this Reaping.`);
  }
  if (withTide.length === 1) delta[withTide[0].seat] = 3 * withTide[0].dbl;
  if (withTide.length === 2) {
    const [a, b] = withTide;
    // Test 'reap-mirror': two with the Tide gain 1 each.
    delta[a.seat] = (variant(s, 'reap-mirror') ? 1 : a.str > b.str ? 2 : 1) * a.dbl;
    delta[b.seat] = (variant(s, 'reap-mirror') ? 1 : b.str > a.str ? 2 : 1) * b.dbl;
  }
  // Test 'scapegoat-deny' (Robert): pay 1 Glory so another player who would gain at this Reaping gains nothing.
  if (variant(s, 'scapegoat-deny')) for (const seat of order) {
    if (!hasActive(s, seat, H.scapegoat) || !canActivate(s, seat, H.scapegoat) || !canSpend(s, seat, 1)) continue;
    const gaining = others(s, seat).filter((o) => delta[o.seat] > 0 && !glorySafe(s, seat, o.seat));
    if (!gaining.length) continue;
    const pick = yield* chooseOne(s, seat, 'scapegoat.deny', 'Scapegoat: pay 1 Glory so one of these players gains nothing at this Reaping?', gaining.map((o) => seatOpt(s, o.seat)), true);
    if (!pick) continue;
    yield* pay(s, seat, 1, H.scapegoat);
    const t = seatFromOpt(pick);
    delta[t] = 0;
    log(s, 'scapegoat', `${pname(s, seat)} paid 1 Glory: ${pname(s, t)} gains nothing this Reaping (Scapegoat).`);
  }
  // Mercy (V42, spent): if you share the Tide, score 3 as if you were alone, then discard Mercy.
  const spentMercy: Seat[] = [];
  if (withTide.length >= 2 && !variant(s, 'mercy-spare')) for (const w of withTide) {
    if (!hasActive(s, w.seat, H.mercy) || !canActivate(s, w.seat, H.mercy)) continue;
    if (!(yield* yesNo(s, w.seat, 'mercy', `Mercy: ${withTide.length} Choirs share the Tide. Score 3 as if you were alone, then discard Mercy?`))) continue;
    if (yield* activation(s, w.seat, H.mercy, function* () { log(s, 'mercy', `${pname(s, w.seat)} scores 3 as if alone, and Mercy is spent.`); })) { delta[w.seat] = 3 * w.dbl; spentMercy.push(w.seat); }
  }
  // Test 'mercy-spare': if yours is the only Choir against the Tide, lose 1 instead of 3, then discard Mercy.
  if (variant(s, 'mercy-spare') && variant(s, 'reap-mirror') && against.length === 1) {
    const a = against[0];
    if (hasActive(s, a.seat, H.mercy) && canActivate(s, a.seat, H.mercy) && (yield* yesNo(s, a.seat, 'mercy', 'Mercy: yours is the only Choir against the Tide. Lose 1 instead of 3, then discard Mercy?'))) {
      if (yield* activation(s, a.seat, H.mercy, function* () { log(s, 'mercy', `${pname(s, a.seat)} is spared: loses 1 instead of 3, and Mercy is spent.`); })) { delta[a.seat] = -1 * a.dbl; spentMercy.push(a.seat); }
    }
  }
  log(s, 'share', withTide.length === 0 ? 'No Choir leans with the Tide.' : withTide.length >= 3 ? `${withTide.length} Choirs lean with the Tide, so none of them scores.` : withTide.length === 1 ? `${pname(s, withTide[0].seat)} leans with the Tide alone.` : `${withTide.map((w) => pname(s, w.seat)).join(' and ')} share the Tide.`);
  const prevLean = { ...s.lastAlignColor };
  for (const seat of spentMercy) yield* discardFromChoir(s, seat, H.mercy, 'Mercy');
  for (const p of s.players) s.lastAlignColor[p.seat] = dirOf(nets[p.seat]);

  const loss: Record<number, number> = {};
  for (const p of s.players) loss[p.seat] = delta[p.seat] < 0 ? -delta[p.seat] : 0;
  // Mercy (V42): you never lose Glory at the Reaping.
  // Scapegoat (V42): if you would lose Glory at the Reaping, a player of your choice loses it instead.
  for (const seat of order) {
    if (!loss[seat] || !hasActive(s, seat, H.scapegoat) || !canActivate(s, seat, H.scapegoat) || variant(s, 'scapegoat-sac') || variant(s, 'scapegoat-sac-free') || variant(s, 'scapegoat-sac2') || variant(s, 'scapegoat-crowd') || variant(s, 'scapegoat-deny')) continue;
    if (variant(s, 'scapegoat-cost') && !canSpend(s, seat, 1)) continue;
    const targets = others(s, seat).filter((o) => !glorySafe(s, seat, o.seat));
    if (!targets.length) continue;
    const pick = yield* chooseOne(s, seat, 'scapegoat', `Scapegoat: you would lose ${loss[seat]} Glory. Choose a player to lose it instead.`, targets.map((o) => seatOpt(s, o.seat)));
    if (!pick) continue;
    const to = seatFromOpt(pick);
    if (variant(s, 'scapegoat-cost')) yield* pay(s, seat, 1, H.scapegoat);
    if (yield* activation(s, seat, H.scapegoat, function* () { log(s, 'scapegoat', `${pname(s, to)} takes ${pname(s, seat)}'s Reaping loss (Scapegoat).`); })) {
      loss[to] = (loss[to] ?? 0) + loss[seat];
      loss[seat] = 0;
    }
  }

  const lost: Record<number, number> = {};
  const gained: Record<number, number> = {};
  for (const seat of order) {
    const p = s.players[seat];
    const g = delta[seat] > 0 ? yield* gain(s, seat, delta[seat], 'reaping') : 0;
    const l = loss[seat] ? yield* lose(s, seat, loss[seat], 'reaping') : 0;
    lost[seat] = l;
    gained[seat] = g;
    stat(s, { type: 'reaping', seat, amount: g - l, data: { net: nets[seat], tide: tide.dir } });
    if (g || l) log(s, 'reaping', `${p.name} ${g ? `gains ${g}` : `loses ${l}`} Glory at the Reaping (Alignment ${nets[seat]}).`);
  }

  // Bounty (V42): if the player you named lost Glory at this Reaping, gain 1.
  for (const [k, t] of Object.entries(s.day_.bounty)) {
    const seat = Number(k);
    // Test 'bounty-bet' / 'bounty-bet-soft' (Robert): +1 if they lose; -1 if they do not lose (strict) or only if they gain (soft).
    if ((variant(s, 'bounty-bet') || variant(s, 'bounty-bet-soft')) && hasActive(s, seat, H.bounty)) {
      if (lost[t] > 0) { yield* gain(s, seat, 1, H.bounty); log(s, 'bounty', `${pname(s, t)} lost Glory: ${pname(s, seat)} collects the Bounty.`); }
      else if (variant(s, 'bounty-bet') || gained[t] > 0) { yield* lose(s, seat, 1, H.bounty); log(s, 'bounty', `${pname(s, t)} did not lose: ${pname(s, seat)}'s Bounty costs them 1 Glory.`); }
      continue;
    }
    const spent = (s.day_ as any).bountySpent?.[seat];
    if ((hasActive(s, seat, H.bounty) || spent) && lost[t] > 0 && (!variant(s, 'bounty-with') || leansWithTide.has(seat)) && (!variant(s, 'bounty-nogain') || !(gained[seat] > 0))) { yield* gain(s, seat, spent ? (variant(s, 'bounty-spent3') ? 3 : 2) : 1, H.bounty); log(s, 'bounty', `${pname(s, t)} lost Glory, so ${pname(s, seat)} collects the Bounty (1 Glory).`); }
  }
  // Raguel (V42): each Reaping your Bound player gains Glory, you gain 1.
  for (const b of s.bonds) {
    // Tests: 'raguel-fate' (also lose 1 when they lose), 'raguel-nogain' (only if you gained nothing yourself).
    if (variant(s, 'raguel-fate') && hasActive(s, b.owner, H.raguel) && lost[b.bound] > 0) { yield* lose(s, b.owner, 1, H.raguel); log(s, 'raguel', `${pname(s, b.bound)} lost Glory, so ${pname(s, b.owner)} loses 1 (Raguel).`); continue; }
    if (!hasActive(s, b.owner, H.raguel) || !(gained[b.bound] > 0)) continue;
    if (variant(s, 'raguel-nogain') && gained[b.owner] > 0) continue;
    yield* gain(s, b.owner, 1, H.raguel);
    log(s, 'raguel', `${pname(s, b.bound)} gained at the Reaping, so ${pname(s, b.owner)} gains 1 Glory (Raguel).`);
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
    // Tests 'veil-secret' and 'zealot-open': facedown and face-up counts at the reveal.
    const rv = (s.day_ as any).reveal ?? { down: 0, up: 0 };
    if ((variant(s, 'veil-secret') || variant(s, 'veil-more') || variant(s, 'veil-4')) && hasActive(s, seat, H.veil) && (variant(s, 'veil-more') ? rv.down > rv.up : rv.down >= (variant(s, 'veil-4') ? 4 : 3))) { yield* gain(s, seat, 1, H.veil); log(s, 'veil', `${p.name} gained 1 Glory (Veil).`); }
    if (variant(s, 'zealot-open') && hasActive(s, seat, H.zealot) && rv.up > rv.down) { yield* gain(s, seat, 1, H.zealot); log(s, 'zealot', `${p.name} gained 1 Glory (Zealot).`); }
    if (hasActive(s, seat, H.stillness) && tide.dir === 'neutral') { yield* gain(s, seat, 1, H.stillness); log(s, 'stillness', `${p.name} gained 1 Glory (Stillness).`); }
    if (hasActive(s, seat, H.firmament) && tide.dir !== 'neutral' && tide.margin === 1 && (!variant(s, 'firm-with') || leansWithTide.has(seat))) { yield* gain(s, seat, 1, H.firmament); log(s, 'firmament', `${p.name} gained 1 Glory (Firmament).`); }
    const mc: string[] | undefined = (s.day_ as any).mirageCards?.[seat];
    if (mc && !variant(s, 'mirage-protect') && tide.dir !== 'neutral' && (!variant(s, 'mirage-hedge') || (nets[seat] !== 0 && !leansWithTide.has(seat))) && mc.some((id) => s.altar.some((a) => a.id === id) && colorsOf(s, null, id)[tide.dir as 'light' | 'dark'])) { yield* gain(s, seat, 1, H.mirage); log(s, 'mirage', `${p.name} gained 1 Glory (Mirage).`); }
    // Vessel (V40): 1 Glory if the card it placed today is still on the Altar and matches the Tide.
    // Test 'vessel-noglory': no Glory; the card is pure influence.
    if (!variant(s, 'vessel-noglory') && hasActive(s, seat, H.vessel) && tide.dir !== 'neutral' && s.altar.some((a) => a.kind === 'vessel' && a.offeredBy === seat && colorsOf(s, null, a.id)[tide.dir as 'light' | 'dark'])) { yield* gain(s, seat, 1, H.vessel); log(s, 'vessel', `${p.name} gained 1 Glory (Vessel).`); }
    // Test 'vessel-bet': lose 1 if your Vessel card is still on the Altar and opposes the Tide.
    if (variant(s, 'vessel-bet') && hasActive(s, seat, H.vessel) && tide.dir !== 'neutral' && s.altar.some((a) => a.kind === 'vessel' && a.offeredBy === seat && colorsOf(s, null, a.id)[opposite(tide.dir as 'light' | 'dark') as 'light' | 'dark'])) { yield* lose(s, seat, 1, H.vessel); log(s, 'vessel', `${p.name} lost 1 Glory (Vessel).`); }
    const call = s.day_.prophecy[seat];
    if (call) { // V38: a Neutral Tide is a miss
      if (call === tide.dir) { yield* gain(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy came true: +1 Glory.`); }
      else { yield* lose(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy failed: -1 Glory.`); }
    }
    // V38 Outcast: 1 Glory at the Reaping while you have the least Glory.
    if (hasActive(s, seat, H.outcast) && p.glory === Math.min(...s.players.map((o) => o.glory))) { yield* gain(s, seat, 1, H.outcast); log(s, 'outcast', `${p.name} gained 1 Glory (Outcast).`); }
    // Apple (V42): 1 Glory if your Choir leans the other way from yesterday (it rewards switching sides).
    if (hasActive(s, seat, H.apple)) {
      const was = prevLean[seat];
      if (was && was !== 'neutral' && nets[seat] !== 0 && dirOf(nets[seat]) === opposite(was)) { yield* gain(s, seat, 1, H.apple); log(s, 'apple', `${p.name} switched sides and gains 1 Glory (Apple).`); }
    }
    // Uriel and Beelzebub (V42): 1 Glory if your Choir holds 3 or more cards of their color.
    for (const [id, k] of [[H.uriel, 'light'], [H.beelzebub, 'dark']] as const) {
      // Tests: 'set-others' (3 others besides the card itself), 'set-tide' (and your Choir leans with the Tide).
      const setN = activeCards(p).filter((c) => colorsOf(s, seat, c.id)[k] && (!variant(s, 'set-others') || c.id !== id)).length;
      if (hasActive(s, seat, id) && setN >= 3 && (!variant(s, 'set-tide') || leansWithTide.has(seat))) { yield* gain(s, seat, variant(s, 'set-2') ? 2 : 1, id); log(s, 'set', `${p.name} gained 1 Glory (${cardName(id)}).`); }
    }
    // Test 'tree-swap' / 'tree-swap-tide' (Robert's idea): take an Altar card into your Choir, discarding one if it is full.
    if ((variant(s, 'tree-swap') || (variant(s, 'tree-swap-tide') && leansWithTide.has(seat)) || (variant(s, 'tree-swap-cost') && canSpend(s, seat, 1)) || (variant(s, 'tree-swap-lose') && !(gained[seat] > 0))) && hasActive(s, seat, H.treeOfLife) && canActivate(s, seat, H.treeOfLife)) {
      const opts = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => a.sanctuary === undefined || a.sanctuary === seat);
      if (opts.length) {
        const pick = yield* chooseOne(s, seat, 'tree.take', 'Tree of Life: take a card from the Altar into your Choir (discarding one if it is full)?', opts.map(({ a, i }) => ({ id: String(i), label: cardName(a.id), card: a.id })), true);
        if (pick !== null && (yield* makeRoom(s, seat, 'Tree of Life'))) {
          if (variant(s, 'tree-swap-cost')) yield* pay(s, seat, 1, H.treeOfLife);
          const [taken] = s.altar.splice(Number(pick), 1);
          yield* activation(s, seat, H.treeOfLife, function* () { yield* enterChoir(s, seat, taken.id); log(s, 'treeOfLife', `${p.name} took ${cardName(taken.id)} from the Altar into their Choir (Tree of Life).`); });
        }
      }
    }
    // Tree of Life (V42): fruit ripens. Each Reaping your Choir leans with the Tide, put 1 Glory on it; at 3, take all 3.
    const tree = p.choir.find((c) => c.id === H.treeOfLife && !c.facedown);
    if (tree && !(s.config.variants ?? []).some((v) => v.startsWith('tree-swap')) && hasActive(s, seat, H.treeOfLife) && leansWithTide.has(seat) && (!variant(s, 'tree-gain') || delta[seat] > 0)) {
      tree.store = (tree.store ?? 0) + 1;
      if (tree.store >= (variant(s, 'tree-4') ? 4 : 3)) { tree.store = 0; yield* gain(s, seat, variant(s, 'tree-2') ? 2 : 3, H.treeOfLife); log(s, 'treeOfLife', `${p.name}'s Tree of Life bears fruit.`); if (variant(s, 'tree-fall')) yield* discardFromChoir(s, seat, H.treeOfLife, 'Tree of Life'); }
      else log(s, 'treeOfLife', `1 Glory ripens on ${p.name}'s Tree of Life (${tree.store} of 3).`);
    }
    // Providence (V42): if your Choir leans with the Tide, put 1 Glory from the Pot on it.
    const prov = p.choir.find((c) => c.id === H.providence && !c.facedown);
    if (prov && hasActive(s, seat, H.providence) && (!variant(s, 'store-tide') || leansWithTide.has(seat))) { prov.store = (prov.store ?? 0) + 1; log(s, 'providence', `1 Glory is stored on ${p.name}'s Providence (${prov.store} in all).`); }
    // Test 'mammon-store': Mammon is the Dark store, like Providence.
    const mam = p.choir.find((c) => c.id === H.mammon && !c.facedown);
    if (variant(s, 'mammon-store') && mam && hasActive(s, seat, H.mammon) && (!variant(s, 'store-tide') || leansWithTide.has(seat))) { mam.store = (mam.store ?? 0) + 1; log(s, 'mammon', `1 Glory is stored on ${p.name}'s Mammon (${mam.store} in all).`); }
    // Test 'favor-ripen': each Day your Choir leans with the Tide, 1 Glory ripens on Favor; at 3, take all 3.
    const fav = p.choir.find((c) => c.id === H.favor && !c.facedown);
    if (variant(s, 'favor-ripen') && fav && hasActive(s, seat, H.favor) && leansWithTide.has(seat)) {
      fav.store = (fav.store ?? 0) + 1;
      if (fav.store >= 3) { fav.store = 0; yield* gain(s, seat, variant(s, 'favor-2') ? 2 : 3, H.favor); log(s, 'favor', `${p.name}'s Favor ripens: +3 Glory.`); }
      else log(s, 'favor', `1 Glory ripens on ${p.name}'s Favor (${fav.store} of 3).`);
    }
    // Leviathan (V42): 1 Glory if two or more other players lost Glory at this Reaping.
    if (hasActive(s, seat, H.leviathan) && s.players.filter((o) => o.seat !== seat && lost[o.seat] > 0).length >= 2) { yield* gain(s, seat, 1, H.leviathan); log(s, 'leviathan', `${p.name} gained 1 Glory (Leviathan).`); }
    // Test 'hubris-day' (Robert): at the end of the Day, if the player with the most Glory gained 3 or more this Day (from anything), they give 1 to you.
    if ((variant(s, 'hubris-day') || variant(s, 'hubris-day4')) && hasActive(s, seat, H.hubris)) {
      const dayGain = (x: Seat) => s.stats.filter((e) => e.type === 'glory' && e.seat === x && e.day === s.day && (e.amount ?? 0) > 0).reduce((t, e) => t + (e.amount ?? 0), 0);
      const max = Math.max(...s.players.map((o) => o.glory));
      const payers = s.players.filter((o) => o.seat !== seat && o.glory === max && dayGain(o.seat) >= (variant(s, 'hubris-day4') ? 4 : 3) && !glorySafe(s, seat, o.seat)).map((o) => o.seat);
      const l = payers.length > 1 ? seatFromOpt((yield* chooseOne(s, seat, 'hubris', 'Hubris: choose which leader gives you 1.', payers.map((x) => seatOpt(s, x))))!) : payers[0];
      if (l !== undefined && transfer(s, l, seat, 1, H.hubris)) log(s, 'hubris', `${pname(s, l)} gave 1 Glory to ${p.name} (Hubris).`);
    } else
    if (hasActive(s, seat, H.hubris)) {
      // Ruling confirmed November 16, 2026: one leader pays 1 Glory in total. When several tied leaders
      // gained, the Hubris holder chooses which one (the general rule for ties on most-Glory cards).
      const payers = leadersBefore.filter((l) => l !== seat && delta[l] >= (variant(s, 'hubris-3') ? 3 : 1) && s.players[l].glory > 0 && !glorySafe(s, seat, l));
      const l = payers.length > 1 ? seatFromOpt((yield* chooseOne(s, seat, 'hubris', 'Hubris: the tied leaders both gained Glory. Choose who gives you 1.', payers.map((x) => seatOpt(s, x))))!) : payers[0];
      if (l !== undefined) {
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

  s.morningStar = [];
  // V38 Michael: a card it Flipped turns face up again when the Reaping ends.
  for (const p of s.players) for (const c of p.choir) if ((c as any).michael) {
    c.facedown = false;
    delete (c as any).michael;
    log(s, 'restore', `${cardName(c.id)} in ${p.name}'s Choir turns face up again (Michael).`);
  }
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
  yield* [];
}

export { HOST };
