// The game loop: setup, then each Day's Morning, Noon (turns) and Evening, then the endgame.
import { TURN } from './abilities';
import { endOfDayTriggers, keepRelics, morningTriggers, noteOffer, parasitePlant, placeRelics, wisdomPeek } from './triggers';
import {
  activation, activeCards, altarAvailable, altarLabel, altarShielded, ask, askAll, baseHandLimit, handMaxOf,
  baseValue, canActivate, canSpend, cardOpt, choirColors, chooseOne, colorOf, colorsOf, dirOf, discardableForRoom,
  discardFromChoir, removeFromChoir, drawHost, drawTo, enterChoir, eventOn, gain, hasActive, isCelestial, log, lose, makeRoom,
  markToday, opposite, others, pay, pname, sanctuaryAllows, seatFromOpt, seatOpt, snareHit, stat, transfer,
  usedToday, yesNo,
} from './core';
import { C, CELESTIALS, E, EVENTS, H, HOSTS, cardName } from './data';
import { randInt, shuffle } from './rng';
import { DEFAULT_RULES, choirLimit, rulesOf } from './rules';
import type { TideHistory } from './core';
import type { Dir, GameConfig, GameState, Gen, Option, Plan, Seat, Side, Standing, TideRecord } from './types';

/** V45: every game lasts 7 Days; the last is Judgment Day, when everyone chooses their action in secret. */
export const DAYS = 7;
/** Allegiance tokens dealt to each player from a shuffled, even pool (V45). */
export const TOKENS_EACH = DEFAULT_RULES.tokensEach;
/** Each Choir card of the winning color scores this much at the Reaping (V45). */
export const CHOIR_PAY = 2;
/** An Offered allegiance token counts this much for its color (V45). */
export const TOKEN_WEIGHT = 2;
/** V42: one deck of 69 cards, all with art. Ithuriel, Urim and Asmadai (no art) are retired; their abilities moved to Revelation, Knowledge and Belial. */
export const OPEN_SET_ASIDE_HOSTS: readonly string[] = [H.ithuriel, H.urim, H.asmadai];
/** The 3 Events that moved the Balance, retired with Hidden Roles (V45). */
export const OPEN_SET_ASIDE_EVENTS: readonly string[] = [E.sabbath, E.equilibrium, E.armageddon];

function freshDay(): GameState['day_'] {
  return { usedToday: {}, ordeal: [], prophecy: {}, lots: {}, actionsTaken: [], eclipsed: {}, heresy: [], handLimitBonus: 0, bounty: {} };
}

/** Days each side has won on the Tide track (a Neutral Tide or a Purgatory Day counts for neither). */
export function daysWon(s: Pick<GameState, 'tides'>): { light: number; dark: number } {
  const won = (d: Side) => s.tides.filter((t) => t.dir === d && !t.void).length;
  return { light: won('light'), dark: won('dark') };
}

// ---------------------------------------------------------------- setup

export function createState(cfg: GameConfig): GameState {
  if (cfg.players.length < 3 || cfg.players.length > 4) throw new Error('The Divide is for 3 or 4 players.');
  const s: GameState = {
    config: cfg, rng: cfg.seed | 0, day: 0, phase: 'setup', players: [], hostDeck: [], discard: [], altar: [], altarTokens: [],
    eventDeck: [], eventDiscard: [], currentEvent: null, firstPlayer: 0, active: null, tides: [],
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
    seat, name: p.name, isBot: p.isBot, celestial: advanced ? p.celestial ?? pool.pop()! : '', hand: [], choir: [], glory: 0, tokens: [], offeredToday: false,
  }));
  // V45: shuffle an even pool of allegiance tokens and deal each player 6, so mixes are uneven and secret.
  const R = rulesOf(s);
  // An odd total (a variant: 5 or 7 each with 3 players) has one extra token of a random color.
  const total = R.tokensEach * s.players.length, light = Math.floor(total / 2) + (total % 2 && randInt(s, 2) ? 1 : 0);
  const tokens = shuffle(s, [...Array<Side>(light).fill('light'), ...Array<Side>(total - light).fill('dark')]);
  for (const p of s.players) p.tokens = tokens.splice(0, R.tokensEach);
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

/**
 * The whole game, as a generator of decisions. `from` resumes at the start of a Day from a state saved there,
 * and `onDayStart` sees the state at the start of every Day (before anything happens), so it can be saved: the
 * strong bot's search forks games from these checkpoints instead of replaying every move since the first.
 */
export function* runGame(s: GameState, from?: number, onDayStart?: (s: GameState, day: number) => void): Gen<void> {
  // Raguel cards dealt into a starting Choir bind a player at the start (already done in a resumed game).
  if (from === undefined) for (const p of s.players) if (p.choir.some((c) => c.id === H.raguel)) {
    p.choir = p.choir.filter((c) => c.id !== H.raguel);
    yield* enterChoir(s, p.seat, H.raguel);
  }
  const last = DAYS;
  for (let d = from ?? 1; d <= last; d++) {
    onDayStart?.(s, d);
    s.day = d;
    s.day_ = freshDay();
    for (const p of s.players) p.offeredToday = false;
    s.turnUsed = [];
    yield* morning(s);
    yield* firstFruits(s);
    s.phase = 'noon';
    if (d === last) yield* judgmentDay(s);
    const n = s.players.length;
    for (let i = 0; i < n; i++) yield* takeTurn(s, (s.firstPlayer + i) % n);
    s.active = null;
    s.phase = 'evening';
    yield* evening(s, d === last);
    s.firstPlayer = (s.firstPlayer + 1) % n;
  }
  yield* endGame(s);
}

/**
 * First Fruits (V35): each Morning every player chooses a card from hand in secret, then all are shuffled and placed
 * face up on the Altar (V45: anonymously, so no one knows who gave which), and each player draws 1 card.
 * Not the Offer action, so no Offer abilities trigger.
 */
function* firstFruits(s: GameState): Gen<void> {
  const R = rulesOf(s);
  // Variant: a token may be given instead of a card (facedown, anonymous).
  const tokenOpts = (p: GameState['players'][number]) => (R.fruitsToken ? (['light', 'dark'] as const).filter((k) => p.tokens.includes(k)).map((k) => ({ id: 'token:' + k, label: `a ${tokenName(k)} token (counts ${R.tokenWeight})` })) : []);
  const ps = s.players.filter((p) => p.hand.length || tokenOpts(p).length);
  // Variant: First Fruits stay facedown until the Evening reveal.
  const dark = s.currentEvent === E.pandemonium || R.fruits === 'down';
  const picks = yield* askAll(s, ps.map((p) => ({ seat: p.seat, tag: 'firstFruits', prompt: dark ? 'First Fruits: place 1 card from your hand facedown on the Altar.' : 'First Fruits: choose 1 card from your hand. They are shuffled together and placed face up on the Altar, so no one knows whose is whose.', options: [...p.hand.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), ...tokenOpts(p)], min: 1, max: 1 })));
  const fruits: { c: string; seat: Seat }[] = [];
  const gave: Seat[] = [];
  ps.forEach((p, k) => {
    const id = picks[k][0];
    if (id.startsWith('token:')) {
      const side = id.slice(6) as Side;
      p.tokens.splice(p.tokens.indexOf(side), 1);
      s.altarTokens.push({ side, by: p.seat, anon: true, ...tokenWeightOf(s) });
      stat(s, { type: 'action', seat: p.seat, source: 'fruits', data: { token: side } });
      return;
    }
    const [c] = p.hand.splice(Number(id), 1);
    stat(s, { type: 'action', seat: p.seat, card: c, source: 'fruits' });
    fruits.push({ c, seat: p.seat });
    gave.push(p.seat);
  });
  // A facedown First Fruit is known to the player who gave it (not where it lies after the shuffle).
  for (const f of shuffle(s, fruits)) s.altar.push({ id: f.c, facedown: dark, offeredBy: null, day: s.day, kind: 'fruits', ...(dark && R.fruits === 'down' ? { seenBy: [f.seat] } : {}) });
  // Then each player who gave a card draws 1 card, so First Fruits never shrinks a hand (variant: everyone who gave).
  for (const seat of R.fruitsDraw === 'all' ? ps.map((p) => p.seat) : gave) yield* drawTo(s, seat, 1);
  log(s, 'fruits', dark ? 'Every player placed First Fruits facedown.' : `First Fruits: ${fruits.map((f) => cardName(f.c)).sort().join(', ')}.`);
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
    const call = yield* chooseOne(s, whisper.seat, 'whisper', 'The Whisper: name Light or Dark aloud. If that side wins the Day, gain 1 Glory; if the other side wins, lose 1.', [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }], true);
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
  // The Eclipse (V45): in the Morning, one Light or Dark Choir card counts as the other color this Day.
  const eclipse = s.players.find((p) => p.celestial === C.eclipse);
  if (eclipse && canActivate(s, eclipse.seat, C.eclipse)) {
    const seat = eclipse.seat;
    const cards = activeCards(eclipse).filter((c) => colorOf(s, seat, c.id) !== null);
    const pick = yield* chooseOne(s, seat, 'eclipse.early', 'The Eclipse: choose a card in your Choir to count as the other color this Day?', cards.map((c) => cardOpt(c.id)), true);
    if (pick) {
      markToday(s, seat, C.eclipse);
      yield* activation(s, seat, C.eclipse, function* () { s.day_.eclipsed[seat] = pick; log(s, 'eclipse', `${eclipse.name}'s ${cardName(pick)} counts as the other color this Day (the Eclipse).`); });
    }
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
      if (c && p.choir.length < choirLimit(s)) yield* enterChoir(s, p.seat, c);
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
  if (rulesOf(s).oldestFree) yield* offerOldest(s, seat);
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
  return p.choir.length < choirLimit(s) || discardableForRoom(s, p).length > 0;
}

type Action = 'offer' | 'gather' | 'exalt';

export function legalActions(s: GameState, seat: Seat): Action[] {
  const p = s.players[seat];
  const out: Action[] = [];
  if ((rulesOf(s).offerFrom !== 'choir' && p.hand.length) || (rulesOf(s).offerTokens && p.tokens.length) || (rulesOf(s).offerFrom !== 'hand' && activeCards(p).length)) out.push('offer');
  // Gather takes a card from the Altar (V42) or the discard pile (Forger), or a token from the Altar (V45: needs no room).
  const card = (rulesOf(s).gatherTo !== 'choir' || canRoom(s, seat)) && (altarAvailable(s, seat).length > 0 || (hasActive(s, seat, H.forger) && s.discard.length > 0));
  if (!s.anathema.some((a) => a.target === seat && a.action === 'gather') && (card || s.altarTokens.length)) out.push('gather');
  // Exalt is free (V42); with Forger it may take a card from the discard pile (V43).
  const forgeable = hasActive(s, seat, H.forger) && s.discard.some((x) => x.startsWith('host-'));
  if (!s.anathema.some((a) => a.target === seat && a.action === 'exalt') && canRoom(s, seat) && !eventOn(s, E.fast) && (forgeable || p.hand.length > 0)) out.push('exalt');
  return out;
}

function* takeAction(s: GameState, seat: Seat, index: number): Gen<void> {
  const legal = legalActions(s, seat);
  // Judgment Day: the action was chosen in secret this Morning. If it can no longer be done, nothing happens.
  const plan = index === 0 ? s.day_.plan?.[seat] : undefined;
  if (s.day_.plan) delete s.day_.plan[seat];
  if (plan && !legal.includes(plan.action)) { log(s, 'judgment', `${pname(s, seat)}'s chosen action can no longer be done: they do nothing.`); return; }
  if (!legal.length) {
    log(s, 'pass', `${pname(s, seat)} has no legal action and passes.`);
    return;
  }
  const labels: Record<string, string> = { offer: 'Offer: play a card or an allegiance token facedown onto the Altar', gather: 'Gather: take a card from the Altar into your Choir', exalt: 'Exalt: play a card from your hand into your Choir' };
  s.day_.preset = plan ?? null;
  const a = plan ? plan.action : (yield* chooseOne(s, seat, 'action', index ? 'Free Will: choose your second action.' : 'Choose your action.', legal.map((id) => ({ id, label: labels[id] }))))!;
  s.day_.actionsTaken.push({ seat, action: a as Action });
  for (const pact of s.pacts) if ((pact.a === seat || pact.b === seat) && pact.action === a && pact.day === s.day) pact.broken = true;
  if (a === 'offer') yield* doOffer(s, seat);
  if (a === 'gather') yield* doGather(s, seat);
  if (a === 'exalt') yield* doExalt(s, seat);
  s.day_.preset = null;
}

/** Choose an option: from the Judgment Day plan if there is one (null if it is no longer available), else by asking. */
function* pick(s: GameState, seat: Seat, tag: string, prompt: string, opts: Option[]): Gen<string | null> {
  // Kept in the state, not the module: several games (a live one and the search's copies) can be mid-turn at once.
  const p = s.day_.preset;
  if (!p) return yield* chooseOne(s, seat, tag, prompt, opts);
  s.day_.preset = null;
  const id = p.key.startsWith('card:') ? 'altar:' + s.altar.findIndex((a) => a.id === p.key.slice(5)) : p.token ? 'token:' + s.altarTokens.indexOf(p.token) : p.key;
  if (opts.some((o) => o.id === id)) return id;
  log(s, 'judgment', `${pname(s, seat)}'s chosen ${p.action === 'gather' ? 'card is gone' : 'card is no longer theirs'}: they do nothing.`);
  return null;
}

// ---------------------------------------------------------------- Judgment Day

/** Every option of every action, for the secret choice: ids are `<action>|<option>`. */
function planOptions(s: GameState, seat: Seat): Option[] {
  const out: Option[] = [];
  const legal = legalActions(s, seat);
  if (legal.includes('offer')) for (const o of offerOptions(s, seat)) out.push({ ...o, id: 'offer|' + o.id, label: `Offer ${o.label}` });
  if (legal.includes('exalt')) for (const o of exaltOptions(s, seat)) out.push({ ...o, id: 'exalt|' + o.id, label: `Exalt ${o.label}` });
  if (legal.includes('gather')) for (const o of gatherOptions(s, seat)) {
    const key = o.id.startsWith('altar:') ? 'card:' + s.altar[Number(o.id.slice(6))].id : o.id;
    out.push({ ...o, id: 'gather|' + key, label: `Gather ${o.label}` });
  }
  return out.length ? out : [{ id: 'pass', label: 'No action is possible: pass' }];
}

/**
 * Judgment Day (V45): on the last Day, after First Fruits, every player chooses their whole action in secret.
 * Then the turns are played in order as usual, each carrying out its chosen action; one that can no longer be done
 * (a card already Gathered, an Offer blocked) does nothing. Abilities are used on your turn as usual.
 */
export function* judgmentDay(s: GameState): Gen<void> {
  const n = s.players.length;
  const order = Array.from({ length: n }, (_, i) => (s.firstPlayer + i) % n);
  log(s, 'judgment', 'Judgment Day: everyone chooses their action in secret, then the actions are carried out in turn order.');
  const answers = yield* askAll(s, order.map((seat) => ({ seat, tag: 'judgment', prompt: 'Judgment Day: choose your action in secret. Everyone has chosen before anyone acts; actions are carried out in turn order, and one that can no longer be done does nothing.', options: planOptions(s, seat), min: 1, max: 1 })));
  s.day_.plan = {};
  order.forEach((seat, k) => {
    const id = answers[k][0];
    if (!id || id === 'pass') return;
    const [action, key] = [id.slice(0, id.indexOf('|')), id.slice(id.indexOf('|') + 1)] as [Plan['action'], string];
    s.day_.plan![seat] = { action, key, ...(key.startsWith('token:') && action === 'gather' ? { token: s.altarTokens[Number(key.slice(6))] } : {}) };
  });
}

const tokenName = (side: Side) => (side === 'light' ? 'Light' : 'Dark');

/** Anathema (V45): until its holder's next turn, other players' Offers go face up. */
const faceUp = (s: GameState, seat: Seat) => s.anathema.some((a) => a.target === seat && a.action === 'faceup');

/** The Cantor (V45): when you Offer, draw a card. */
function* cantorDraw(s: GameState, seat: Seat): Gen<void> {
  if (!isCelestial(s, seat, C.cantor) || !canActivate(s, seat, C.cantor)) return;
  yield* activation(s, seat, C.cantor, function* () { yield* drawTo(s, seat, 1); log(s, 'cantor', `${pname(s, seat)} drew a card (the Cantor).`); });
}

/** V45: an allegiance token may be Offered instead of a card. It counts 2 for its color, and it is gone. */
function offerOptions(s: GameState, seat: Seat): Option[] {
  const p = s.players[seat];
  const sides = rulesOf(s).offerTokens ? (['light', 'dark'] as const).filter((k) => p.tokens.includes(k)) : [];
  // Variants: a Choir card may be Offered too, or only a Choir card.
  const from = rulesOf(s).offerFrom;
  const choir = from !== 'hand' ? activeCards(p).map((c) => cardOpt(c.id, 'choir:')) : [];
  return [...(from !== 'choir' ? p.hand.map((c) => cardOpt(c)) : []), ...choir, ...sides.map((k) => ({ id: 'token:' + k, label: `a ${tokenName(k)} token (counts ${rulesOf(s).tokenWeight})` }))];
}

/** An Offered token's weight, when a variant changes it from TOKEN_WEIGHT. */
function tokenWeightOf(s: GameState): { weight?: number } {
  const w = rulesOf(s).tokenWeight;
  return w === TOKEN_WEIGHT ? {} : { weight: w };
}

function* doOffer(s: GameState, seat: Seat): Gen<void> {
  const first = yield* pick(s, seat, 'offer.card', 'Offer: choose a card or a token to place facedown on the Altar.', offerOptions(s, seat));
  if (first) yield* offerPicked(s, seat, first);
}

/** Variant (oldestFree): after your action, a full Choir may also Offer its oldest card, once a turn. */
function* offerOldest(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat], old = p.choir[0];
  if (p.choir.length < choirLimit(s) || !old || !activeCards(p).includes(old)) return;
  const yes = yield* chooseOne(s, seat, 'offer.oldest', `Also Offer ${cardName(old.id)}, the oldest card in your Choir, face up?`, [cardOpt(old.id, 'choir:')], true);
  if (yes) yield* offerPicked(s, seat, yes);
}

function* offerPicked(s: GameState, seat: Seat, first: string): Gen<void> {
  const p = s.players[seat];
  const R = rulesOf(s);
  p.offeredToday = true;
  if (R.offerGlory) yield* gain(s, seat, R.offerGlory, 'offer');
  if (first.startsWith('token:')) {
    const side = first.slice(6) as Side;
    p.tokens.splice(p.tokens.indexOf(side), 1);
    const shown = faceUp(s, seat);
    s.altarTokens.push({ side, by: seat, ...(shown ? { shown } : {}), ...tokenWeightOf(s) });
    stat(s, { type: 'action', seat, source: 'offer', data: { token: side } });
    log(s, 'offer', shown ? `${p.name} Offered a ${tokenName(side)} token face up (Anathema).` : `${p.name} Offered an allegiance token facedown.`);
    log(s, 'offer', `You Offered a ${tokenName(side)} token.`, [seat]);
    yield* cantorDraw(s, seat);
    yield* wisdomPeek(s, seat);
    return;
  }
  const fromChoir = first.startsWith('choir:');
  const card = fromChoir ? first.slice(6) : first;
  if (fromChoir) { removeFromChoir(s, seat, card); log(s, 'offer', `${p.name} takes ${cardName(card)} from their Choir to Offer it.`); }
  else p.hand.splice(p.hand.indexOf(card), 1);
  const col = (id: string) => colorsOf(s, null, id);
  // V35: Offers go facedown, except Hymn and Lamentation (V43), which go face up, and any Offer under Anathema (V45).
  // Variant: a card Offered from the Choir goes face up (everyone saw it leave), and may count more.
  const facedown = !fromChoir && card !== H.hymn && card !== H.lamentation && !faceUp(s, seat);
  s.altar.push({ id: card, facedown, offeredBy: seat, day: s.day, kind: 'offer', ...(fromChoir ? { fromChoir, ...(R.choirOfferWeight !== 1 ? { weight: R.choirOfferWeight } : {}) } : {}) });
  if (fromChoir) {
    // Variants: rewards for Offering a Choir card.
    (s.day_.choirOffers ??= []).push(seat);
    if (R.choirOfferGlory) yield* gain(s, seat, R.choirOfferGlory, 'offer');
    if (R.choirOfferDraw) yield* drawTo(s, seat, R.choirOfferDraw);
  }
  noteOffer(s, seat, [card]);
  stat(s, { type: 'action', seat, source: 'offer', data: { cards: [card], ...(fromChoir ? { choir: true } : {}) } });
  stat(s, { type: 'action', seat, card, source: 'offer.card' });
  log(s, 'offer', facedown ? `${p.name} Offered a card facedown.` : `${p.name} Offered ${cardName(card)} face up.`);
  if (facedown) log(s, 'offer', `You Offered ${cardName(card)} facedown.`, [seat]);

  // Raphael / Azazel: turn the Offered card face up to destroy an opposing face-up card on the Altar.
  for (const [hid, mine, theirs] of [[H.raphael, 'light', 'dark'], [H.azazel, 'dark', 'light']] as const) {
    if (!hasActive(s, seat, hid) || !col(card)[mine] || !canActivate(s, seat, hid)) continue;
    const targets = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => !a.facedown && col(a.id)[theirs] && sanctuaryAllows(a, seat) && !altarShielded(s, a, seat));
    if (!targets.length) continue;
    const pick = yield* chooseOne(s, seat, hid === H.raphael ? 'raphael' : 'azazel', `${cardName(hid)}: turn your Offering face up to destroy a face-up ${theirs === 'dark' ? 'Dark' : 'Light'} card on the Altar?`, targets.map(({ a, i }) => ({ id: String(i), label: cardName(a.id), card: a.id })), true);
    if (pick === null) continue;
    const target = s.altar[Number(pick)];
    const mineOffered = s.altar.find((a) => a.offeredBy === seat && a.kind === 'offer' && a.day === s.day && a.id === card);
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
  yield* cantorDraw(s, seat);
  yield* wisdomPeek(s, seat);
}

function gatherOptions(s: GameState, seat: Seat): Option[] {
  const room = rulesOf(s).gatherTo !== 'choir' || canRoom(s, seat);
  const opts: Option[] = room ? altarAvailable(s, seat).map((a) => ({ id: 'altar:' + s.altar.indexOf(a), label: `From the Altar: ${altarLabel(s, a, seat)}`, card: a.facedown && a.offeredBy !== seat ? undefined : a.id })) : [];
  // V45: an allegiance token on the Altar can always be taken; it joins your hidden tokens.
  s.altarTokens.forEach((t, i) => opts.push({ id: 'token:' + i, label: t.by === seat ? `Your ${tokenName(t.side)} token` : t.anon ? 'An allegiance token (First Fruits)' : `An allegiance token (Offered by ${pname(s, t.by)})` }));
  // Forger (V37): may take any Host card from the discard pile.
  if (room && hasActive(s, seat, H.forger) && s.discard.length && canActivate(s, seat, H.forger)) for (const c of [...new Set(s.discard.filter((x) => x.startsWith('host-')))]) opts.push({ id: 'discard:' + c, label: `From the discard pile (Forger): ${cardName(c)}`, card: c });
  return opts;
}

function* doGather(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  const src = yield* pick(s, seat, 'gather.source', 'Gather: choose a card or a token to take.', gatherOptions(s, seat));
  if (!src) return;
  if (src.startsWith('token:')) {
    const [t] = s.altarTokens.splice(Number(src.slice(6)), 1);
    p.tokens.push(t.side);
    stat(s, { type: 'action', seat, source: 'gather', data: { token: true } });
    log(s, 'gather', `${p.name} Gathered an allegiance token from the Altar.`);
    log(s, 'gather', `It was a ${tokenName(t.side)} token.`, [seat]);
    return;
  }
  const to = rulesOf(s).gatherTo;
  let toHand = to === 'hand';
  if (to === 'choir' && !(yield* makeRoom(s, seat, 'Gather'))) return;

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
  if (to === 'either') {
    // Variant: the player chooses where the Gathered card goes (a full Choir makes room first).
    const where = canRoom(s, seat) ? yield* chooseOne(s, seat, 'gather.to', `Gather: put ${cardName(card)} into your hand or your Choir?`, [{ id: 'hand', label: 'Into your hand' }, { id: 'choir', label: 'Into your Choir', card }]) : 'hand';
    toHand = where !== 'choir' || !(yield* makeRoom(s, seat, 'Gather'));
  }
  if (toHand) {
    // Variant (the Altar as a market): the card joins your hand.
    p.hand.push(card);
    stat(s, { type: 'action', seat, card, source: 'gather', data: { from: src.split(':')[0], toHand: true } });
    log(s, 'gather', `${p.name} Gathered ${cardName(card)} into their hand.`);
    return;
  }
  if (card === H.parasite && (yield* parasitePlant(s, seat))) { stat(s, { type: 'action', seat, card, source: 'gather', data: { from: src.split(':')[0] } }); return; }
  yield* enterChoir(s, seat, card);
  stat(s, { type: 'action', seat, card, source: 'gather', data: { from: src.split(':')[0] } });
  log(s, 'gather', `${p.name} Gathered ${cardName(card)}${src.startsWith('altar') ? ' from the Altar' : ''}.`);
}

function exaltOptions(s: GameState, seat: Seat): Option[] {
  // Forger (V43): you may Exalt a card from the discard pile instead.
  const forge = hasActive(s, seat, H.forger) && canActivate(s, seat, H.forger) ? [...new Set(s.discard.filter((x) => x.startsWith('host-')))] : [];
  return [...s.players[seat].hand.map((c) => cardOpt(c)), ...forge.map((c) => cardOpt(c, 'discard:'))];
}

function* doExalt(s: GameState, seat: Seat): Gen<void> {
  const p = s.players[seat];
  let card = yield* pick(s, seat, 'exalt.card', 'Exalt: choose a card from your hand to play into your Choir.', exaltOptions(s, seat));
  if (!card) return;
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

export function* evening(s: GameState, finalDay: boolean): Gen<void> {
  const n = s.players.length;
  const order = Array.from({ length: n }, (_, i) => (s.firstPlayer + i) % n);
  log(s, 'evening', 'Evening falls.');

  // Fig Leaves (V45): before the Altar is revealed, take back one facedown card you Offered this Day.
  for (const seat of order) {
    const mine = s.altar.filter((a) => a.facedown && a.kind === 'offer' && a.offeredBy === seat && a.day === s.day);
    if (!mine.length || !hasActive(s, seat, H.figLeaves) || !canActivate(s, seat, H.figLeaves)) continue;
    const pick = yield* chooseOne(s, seat, 'figLeaves.take', 'Fig Leaves: before the Altar is revealed, take back one facedown card you Offered this Day?', mine.map((a) => ({ id: String(s.altar.indexOf(a)), label: cardName(a.id), card: a.id })), true);
    if (pick === null) continue;
    yield* activation(s, seat, H.figLeaves, function* () {
      const [a] = s.altar.splice(Number(pick), 1);
      s.players[seat].hand.push(a.id);
      log(s, 'figLeaves', `${pname(s, seat)} took back a facedown Offer (Fig Leaves).`);
    });
  }
  // The reveal (V45: anonymous). The facedown cards are shuffled among themselves before they turn face up,
  // so no one learns whose Offer was whose; the tokens are counted with them.
  const hidden = s.altar.map((a, i) => ({ a, i })).filter(({ a }) => a.facedown);
  s.day_.reveal = { down: hidden.length + s.altarTokens.length, up: s.altar.length - hidden.length };
  const mixed = shuffle(s, hidden.map(({ a }) => a));
  hidden.forEach(({ i }, k) => (s.altar[i] = mixed[k]));
  for (const { a } of hidden) { a.facedown = false; a.seenBy = undefined; a.anon = true; }
  const toks = { light: s.altarTokens.filter((t) => t.side === 'light').length, dark: s.altarTokens.filter((t) => t.side === 'dark').length };
  if (hidden.length || s.altarTokens.length) log(s, 'reveal', `The Altar is revealed: ${[...hidden.map(({ a }) => cardName(a.id)).sort(), ...(toks.light ? [`${toks.light} Light token${toks.light > 1 ? 's' : ''}`] : []), ...(toks.dark ? [`${toks.dark} Dark token${toks.dark > 1 ? 's' : ''}`] : [])].join(', ')}.`);

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

  // The Tide, marked on the Tide track. Purgatory: the Day counts for neither side.
  const tide = setTide(s);
  if (eventOn(s, E.purgatory) && tide.dir !== 'neutral') tide.void = true;
  s.tides.push(tide);
  stat(s, { type: 'tide', data: { ...tide } });
  const won = daysWon(s);
  log(s, 'tide', tide.dir === 'neutral' ? `The Tide is Neutral (Light ${tide.light}, Dark ${tide.dark}): no one wins the Day.` : `${tide.dir === 'light' ? 'Light' : 'Dark'} wins the Day by ${tide.margin} (Light ${tide.light}, Dark ${tide.dark})${tide.void ? ', but in Purgatory it counts for neither side' : ''}. The Tide track: Light ${won.light}, Dark ${won.dark}.`, 'public',
    // The Altar as it was counted (every card is face up by now), so the site can show the Evening after the fact. Owners stay hidden.
    { tide, event: s.currentEvent, altar: s.altar.map((a) => ({ id: a.id, offeredBy: a.anon || a.kind === 'fruits' ? null : a.offeredBy, kind: a.kind })), tokens: toks });

  // At the Reaping, before scoring.
  for (const seat of order) {
    const p = s.players[seat];
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
    // Moderation (V45): 1 Glory if your Choir holds as many Light cards as Dark cards.
    const cc = choirColors(s, seat);
    if (hasActive(s, seat, H.moderation) && cc.light === cc.dark) { yield* gain(s, seat, 1, H.moderation); log(s, 'moderation', `${p.name} gained 1 Glory (Moderation).`); }
  }
  // The Reaping.
  yield* reaping(s, tide, order);
  if (rulesOf(s).spoils !== 'none' && tide.dir !== 'neutral' && !tide.void) yield* takeSpoils(s, tide.dir as Side, order);

  // Allegiance tokens left on the Altar are shuffled and handed out, one at a time, to whoever holds the fewest
  // (ties in turn order from the first player). Only the receiver sees what they got.
  // Variant (carryover): on a tied Day, the Altar stays for tomorrow, tokens included (their colors are now known).
  const carry = rulesOf(s).carryover && tide.dir === 'neutral' && !finalDay;
  if (carry) for (const t of s.altarTokens) t.shown = true;
  for (const t of carry ? [] : shuffle(s, s.altarTokens.splice(0))) {
    const fewest = Math.min(...s.players.map((p) => p.tokens.length));
    const to = order.find((x) => s.players[x].tokens.length === fewest)!;
    s.players[to].tokens.push(t.side);
    log(s, 'tokens', `${pname(s, to)} receives a token left on the Altar (they hold the fewest).`);
    log(s, 'tokens', `It is a ${tokenName(t.side)} token.`, [to]);
  }
  if (rulesOf(s).decay) {
    // Variant (turnover): a full Choir loses its oldest card.
    for (const seat of order) {
      const p = s.players[seat];
      if (p.choir.length >= choirLimit(s)) { const old = p.choir[0]; yield* discardFromChoir(s, seat, old.id, 'turnover'); }
    }
  }
  if (finalDay) return;

  // Refresh the Altar: Eternity keeps its cards, the rest are discarded.
  const relics = yield* keepRelics(s, order);
  if (carry) {
    for (const a of s.altar) if (!relics.has(a)) (s.relics ??= []).push({ id: a.id, by: null });
    log(s, 'carryover', 'The Altar is tied: its cards and tokens stay for the next Day.');
  } else for (const a of s.altar) if (!relics.has(a)) s.discard.push(a.id);
  s.altar = [];

  // Upkeep.
  const over = s.players.filter((p) => p.hand.length > handMaxOf(s, p.seat));
  if (over.length) {
    const picks = yield* askAll(s, over.map((p) => ({ seat: p.seat, tag: 'upkeep.discard', prompt: `Upkeep: discard down to your hand limit (${handMaxOf(s, p.seat)}).`, options: p.hand.map((c, i) => ({ id: String(i), label: cardName(c), card: c })), min: p.hand.length - handMaxOf(s, p.seat), max: p.hand.length - handMaxOf(s, p.seat) })));
    over.forEach((p, k) => {
      const idx = picks[k].map(Number).sort((a, b) => b - a);
      for (const i of idx) s.discard.push(...p.hand.splice(i, 1));
    });
  }
  const draw = rulesOf(s).upkeepDraw;
  for (const p of s.players) yield* drawTo(s, p.seat, draw === 'refill' ? Math.max(0, baseHandLimit(s, p.seat) - p.hand.length) : Math.max(0, Math.min(draw, handMaxOf(s, p.seat) - p.hand.length)));
}

/** The Tide from the cards (and tokens) on the Altar. Takes only what it reads, so the site can tally the face-up cards. */
export function setTide(s: TideHistory & { altar: { id: string; weight?: number }[]; altarTokens?: { side: Side; weight?: number }[]; currentEvent: string | null }): TideRecord {
  let light = 0;
  let dark = 0;
  const dbl = (ev: string) => (s.currentEvent === ev ? 2 : 1);
  for (const a of s.altar) {
    const v = baseValue(s, a.id), k = a.weight ?? 1;
    light += v.light * dbl(E.ascension) * k;
    dark += v.dark * dbl(E.fallFromGrace) * k;
  }
  // Tokens are not cards: Ascension and Fall from Grace do not double them.
  for (const t of s.altarTokens ?? []) if (t.side === 'light') light += t.weight ?? TOKEN_WEIGHT; else dark += t.weight ?? TOKEN_WEIGHT;
  const dir = dirOf(light - dark);
  return { day: s.day, dir, light, dark, margin: Math.abs(light - dark) };
}

/** Whether a Choir card scores when `side` wins: it is that color (the Eclipse: it is the other color). */
function scores(s: GameState, seat: Seat, id: string, side: Side): boolean {
  const c = colorOf(s, seat, id);
  return (s.day_.eclipsed[seat] === id ? (c && opposite(c)) : c) === side;
}

/**
 * Variant (spoils): after a won Day, the eligible players take the Altar's cards (into their hands) and tokens, one at a
 * time in turn order, until it is empty. 'claim': Choirs holding more cards of the winning color than of the other;
 * 'offerers': players who Offered today.
 */
function* takeSpoils(s: GameState, won: Side, order: Seat[]): Gen<void> {
  const lost = opposite(won) as Side;
  const mode = rulesOf(s).spoils;
  const eligible = order.filter((seat) => {
    if (mode === 'offerers') return s.players[seat].offeredToday && (rulesOf(s).choirSpoils !== 'only' || !!s.day_.choirOffers?.includes(seat));
    const c = choirColors(s, seat);
    return c[won] > c[lost];
  });
  // Variant: those who Offered a Choir card take their spoils first.
  if (rulesOf(s).choirSpoils === 'first') eligible.sort((a, b) => +!!s.day_.choirOffers?.includes(b) - +!!s.day_.choirOffers?.includes(a));
  if (!eligible.length) return;
  log(s, 'spoils', `Spoils to ${eligible.map((x) => pname(s, x)).join(', ')}.`);
  for (let k = 0; s.altar.length + s.altarTokens.length > 0; k++) {
    const seat = eligible[k % eligible.length];
    const opts: Option[] = [...s.altar.map((a, i) => ({ id: 'altar:' + i, label: cardName(a.id), card: a.id })), ...s.altarTokens.map((t, i) => ({ id: 'token:' + i, label: `A ${tokenName(t.side)} token` }))];
    const pick = (yield* chooseOne(s, seat, 'spoils.pick', 'Spoils: take a card (into your hand) or a token from the Altar.', opts))!;
    if (pick.startsWith('token:')) {
      const [t] = s.altarTokens.splice(Number(pick.slice(6)), 1);
      s.players[seat].tokens.push(t.side);
      stat(s, { type: 'action', seat, source: 'spoils', data: { token: t.side } });
      log(s, 'spoils', `${pname(s, seat)} takes a token.`);
    } else {
      const [a] = s.altar.splice(Number(pick.slice(6)), 1);
      s.players[seat].hand.push(a.id);
      stat(s, { type: 'action', seat, card: a.id, source: 'spoils' });
      log(s, 'spoils', `${pname(s, seat)} takes ${cardName(a.id)}.`);
    }
  }
}


/** End of the game: what a hand of tokens scores against the Days won (the `endScore` switch; 'each' is V45). */
export function tokenScore(mode: string, tl: number, td: number, wl: number, wd: number): number {
  if (mode === 'majority') return tl > td ? tl * wl : td > tl ? td * wd : Math.max(tl * wl, td * wd);
  return tl * wl + td * wd;
}

export function* reaping(s: GameState, tide: TideRecord, order: Seat[]): Gen<void> {
  // V45: each face-up Host card in your Choir of the winning color scores 2 Glory, if you Offered this Day (no offering,
  // no harvest). Nothing is ever lost here. Ordeal doubles; False Prophecy scores the other color; Heresy scores your
  // cards of the losing color; Famine stops the Reaping.
  const delta: Record<number, number> = {};
  for (const p of s.players) {
    const seat = p.seat;
    delta[seat] = 0;
    if (eventOn(s, E.famine) || tide.dir === 'neutral') continue;
    const harvest = rulesOf(s).harvest;
    if (!p.offeredToday && harvest === 'offer') { if (activeCards(p).length) log(s, 'harvest', `${p.name} did not Offer today, so their Choir does not score.`); continue; }
    let side = (eventOn(s, E.falseProphecy) ? opposite(tide.dir) : tide.dir) as Side;
    if (s.day_.heresy.includes(seat)) side = opposite(side) as Side;
    // Variant (choirOfferReaps): a card Offered from your Choir today still scores for you.
    const offered = rulesOf(s).choirOfferReaps ? s.altar.filter((a) => a.fromChoir && a.offeredBy === seat && a.day === s.day) : [];
    const count = [...activeCards(p), ...offered].filter((c) => scores(s, seat, c.id, side)).length;
    const full = rulesOf(s).choirPay * count * (s.day_.ordeal.includes(seat) ? 2 : 1);
    delta[seat] = !p.offeredToday && harvest === 'half' ? Math.floor(full / 2) : full;
  }
  // Scapegoat (V45): pay 2 Glory so another player who would score at this Reaping scores nothing.
  for (const seat of order) {
    if (!hasActive(s, seat, H.scapegoat) || !canActivate(s, seat, H.scapegoat) || !canSpend(s, seat, 2)) continue;
    const scoring = others(s, seat).filter((o) => delta[o.seat] > 0);
    if (!scoring.length) continue;
    const pick = yield* chooseOne(s, seat, 'scapegoat.deny', 'Scapegoat: pay 2 Glory so one of these players scores nothing at this Reaping?', scoring.map((o) => seatOpt(s, o.seat)), true);
    if (!pick) continue;
    yield* pay(s, seat, 2, H.scapegoat);
    const t = seatFromOpt(pick);
    delta[t] = 0;
    log(s, 'scapegoat', `${pname(s, seat)} paid 2 Glory: ${pname(s, t)} scores nothing this Reaping (Scapegoat).`);
  }
  s.day_.reaped = { ...delta }; // the Arbiter
  const gained: Record<number, number> = {};
  for (const seat of order) {
    const g = delta[seat] > 0 ? yield* gain(s, seat, delta[seat], 'reaping') : 0;
    gained[seat] = g;
    stat(s, { type: 'reaping', seat, amount: g, data: { tide: tide.dir } });
    if (g) log(s, 'reaping', `${pname(s, seat)}'s Choir scores ${g} Glory.`);
  }
  const scored = (x: Seat) => gained[x] > 0;

  // Bounty (V45): +1 if the player you named scored nothing at this Reaping, -1 if they scored.
  for (const [k, t] of Object.entries(s.day_.bounty)) {
    const seat = Number(k);
    if (!hasActive(s, seat, H.bounty)) continue;
    if (!scored(t)) { yield* gain(s, seat, 1, H.bounty); log(s, 'bounty', `${pname(s, t)} scored nothing at the Reaping: ${pname(s, seat)} collects the Bounty.`); }
    else { yield* lose(s, seat, 1, H.bounty); log(s, 'bounty', `${pname(s, t)} scored at the Reaping: ${pname(s, seat)}'s Bounty costs them 1 Glory.`); }
  }
  // Raguel (V45): 1 Glory each Reaping your Bound player's Choir scores more than yours.
  for (const b of s.bonds) {
    if (!hasActive(s, b.owner, H.raguel) || !(gained[b.bound] > gained[b.owner])) continue;
    yield* gain(s, b.owner, 1, H.raguel);
    log(s, 'raguel', `${pname(s, b.bound)}'s Choir outscored ${pname(s, b.owner)}'s, so ${pname(s, b.owner)} gains 1 Glory (Raguel).`);
  }
  yield* endOfDayTriggers(s, order, scored, tide);

  // Other At the Reaping abilities.
  const prev = s.tides.find((t) => t.day === s.day - 1)?.dir;
  for (const seat of order) {
    const p = s.players[seat];
    const win = (x: string, n: number, why: string) => function* () { yield* gain(s, seat, n, x); log(s, x.replace('host-', ''), `${p.name} gained ${n} Glory (${why}).`); };
    // Veil (V42): 1 Glory if more Altar cards were facedown than face up when it was revealed.
    const rv = s.day_.reveal ?? { down: 0, up: 0 };
    if (hasActive(s, seat, H.veil) && rv.down > rv.up) yield* win(H.veil, 1, 'Veil')();
    if (hasActive(s, seat, H.stillness) && tide.dir === 'neutral') yield* win(H.stillness, 1, 'Stillness')();
    // Firmament (V45): 1 Glory if the Day was won by exactly 1.
    if (hasActive(s, seat, H.firmament) && tide.dir !== 'neutral' && tide.margin === 1) yield* win(H.firmament, 1, 'Firmament')();
    // Leviathan (V45): 1 Glory if the Day was won by 3 or more.
    if (hasActive(s, seat, H.leviathan) && tide.dir !== 'neutral' && tide.margin >= 3) yield* win(H.leviathan, 1, 'Leviathan')();
    // Vessel (V42): +1 if the card it placed today is still on the Altar and matches the Tide, -1 if it opposes it.
    if (hasActive(s, seat, H.vessel) && tide.dir !== 'neutral' && s.altar.some((a) => a.kind === 'vessel' && a.offeredBy === seat && colorsOf(s, null, a.id)[tide.dir as Side])) yield* win(H.vessel, 1, 'Vessel')();
    if (hasActive(s, seat, H.vessel) && tide.dir !== 'neutral' && s.altar.some((a) => a.kind === 'vessel' && a.offeredBy === seat && colorsOf(s, null, a.id)[opposite(tide.dir) as Side])) { yield* lose(s, seat, 1, H.vessel); log(s, 'vessel', `${p.name} lost 1 Glory (Vessel).`); }
    // The Whisper (V45): +1 if the side it named won the Day, -1 if the other side won.
    if (p.celestial === C.whisper && s.day_.whisperCall && tide.dir !== 'neutral') {
      if (s.day_.whisperCall === tide.dir) { yield* gain(s, seat, 1, C.whisper); log(s, 'whisper', `${p.name}'s Whisper came true: +1 Glory.`); }
      else { yield* lose(s, seat, 1, C.whisper); log(s, 'whisper', `${p.name}'s Whisper failed: -1 Glory.`); }
    }
    const call = s.day_.prophecy[seat];
    if (call) { // V38: a Neutral Tide is a miss
      if (call === tide.dir) { yield* gain(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy came true: +1 Glory.`); }
      else { yield* lose(s, seat, 1, H.prophecy); log(s, 'prophecy', `${p.name}'s Prophecy failed: -1 Glory.`); }
    }
    // V38 Outcast: 1 Glory at the Reaping while you have the least Glory.
    if (hasActive(s, seat, H.outcast) && p.glory === Math.min(...s.players.map((o) => o.glory))) yield* win(H.outcast, 1, 'Outcast')();
    // Apple (V45): 1 Glory if the Tide turned: today's winner is not yesterday's.
    if (hasActive(s, seat, H.apple) && tide.dir !== 'neutral' && prev && prev !== 'neutral' && prev !== tide.dir) yield* win(H.apple, 1, 'Apple')();
    // Mercy (V45): 1 Glory if you Offered this Day and your Choir scored nothing.
    if (hasActive(s, seat, H.mercy) && p.offeredToday && !scored(seat)) yield* win(H.mercy, 1, 'Mercy')();
    // Uriel and Beelzebub (V45): 1 Glory if 3 or more other cards in your Choir are of their color.
    for (const [id, k] of [[H.uriel, 'light'], [H.beelzebub, 'dark']] as const) {
      const setN = activeCards(p).filter((c) => colorsOf(s, seat, c.id)[k] && c.id !== id).length;
      if (hasActive(s, seat, id) && setN >= 3) yield* win(id, 1, cardName(id))();
    }
    // Providence and Mammon (V45): each Day its color wins, put 1 Glory from the Pot on the card.
    for (const [id, k] of [[H.providence, 'light'], [H.mammon, 'dark']] as const) {
      const c = p.choir.find((x) => x.id === id && !x.facedown);
      if (c && hasActive(s, seat, id) && tide.dir === k) { c.store = (c.store ?? 0) + 1; log(s, id.replace('host-', ''), `1 Glory is stored on ${p.name}'s ${cardName(id)} (${c.store} in all).`); }
    }
    // Favor (V45): 1 Glory if your Choir scored more than every other player's at this Reaping.
    if (hasActive(s, seat, H.favor) && s.players.every((o) => o.seat === seat || gained[o.seat] < gained[seat])) yield* win(H.favor, 1, 'Favor')();
    // Hubris (V45): if the player with the most Glory gained 8 or more this Day (from anything), they give 1 to you.
    if (hasActive(s, seat, H.hubris)) {
      const dayGain = (x: Seat) => s.stats.filter((e) => e.type === 'glory' && e.seat === x && e.day === s.day && (e.amount ?? 0) > 0).reduce((t, e) => t + (e.amount ?? 0), 0);
      const max = Math.max(...s.players.map((o) => o.glory));
      const payers = s.players.filter((o) => o.seat !== seat && o.glory === max && dayGain(o.seat) >= 8).map((o) => o.seat);
      const l = payers.length > 1 ? seatFromOpt((yield* chooseOne(s, seat, 'hubris', 'Hubris: choose which leader gives you 1.', payers.map((x) => seatOpt(s, x))))!) : payers[0];
      if (l !== undefined && transfer(s, l, seat, 1, H.hubris)) log(s, 'hubris', `${pname(s, l)} gave 1 Glory to ${p.name} (Hubris).`);
    }
    const lot = s.day_.lots[seat];
    if (lot) {
      if (lot === tide.dir) { const k = lot === 'neutral' ? 2 : 1; yield* gain(s, seat, k, E.castingLots); log(s, 'lots', `${p.name} called the Tide (${lot}): +${k} Glory.`); }
      else { yield* lose(s, seat, 1, E.castingLots); log(s, 'lots', `${p.name} called ${lot} and was wrong: -1 Glory.`); }
    }
  }

  s.morningStar = [];
}

// ---------------------------------------------------------------- endgame

export function* endGame(s: GameState): Gen<void> {
  // V45: reveal the tokens. Each scores 1 for every Day its color won. Most Glory wins; a tie is shared.
  const won = daysWon(s);
  const standings: Standing[] = [];
  log(s, 'reveal', `The tokens are revealed. Light won ${won.light} Day${won.light === 1 ? '' : 's'} and Dark won ${won.dark}.`);
  for (const p of s.players) {
    const before = p.glory;
    const tokens = { light: p.tokens.filter((t) => t === 'light').length, dark: p.tokens.filter((t) => t === 'dark').length };
    const R = rulesOf(s);
    const fromTokens = tokenScore(R.endScore, tokens.light, tokens.dark, won.light, won.dark);
    yield* gain(s, p.seat, fromTokens, 'tokens');
    if (R.devotion && tokens.light !== tokens.dark) {
      // Variant (Devotion): each Choir card of the color you hold more tokens of scores again.
      const k = tokens.light > tokens.dark ? 'light' : 'dark', n = choirColors(s, p.seat)[k];
      if (n) { yield* gain(s, p.seat, R.devotion * n, 'devotion'); log(s, 'devotion', `${p.name}'s Choir holds ${n} ${k === 'light' ? 'Light' : 'Dark'} card${n > 1 ? 's' : ''} of their side: +${R.devotion * n}.`); }
    }
    standings.push({ seat: p.seat, glory: p.glory, before, tokens, fromTokens });
    log(s, 'tokens', `${p.name} held ${tokens.light} Light and ${tokens.dark} Dark: +${fromTokens}.`);
  }
  const R = rulesOf(s);
  if (R.miser || R.generous) {
    // Variants (the Miser, the Generous): the fewest Offers lose, or the most gain, at the end; nobody if all tied.
    const offers = s.players.map((p) => s.stats.filter((e) => e.seat === p.seat && e.type === 'action' && e.source === 'offer').length);
    const lo = Math.min(...offers), hi = Math.max(...offers);
    if (lo !== hi) for (const p of s.players) {
      if (R.miser && offers[p.seat] === lo) { yield* lose(s, p.seat, R.miser, 'miser'); log(s, 'miser', `${p.name} Offered the fewest times (${lo}): -${R.miser}.`); }
      if (R.generous && offers[p.seat] === hi) { yield* gain(s, p.seat, R.generous, 'generous'); log(s, 'generous', `${p.name} Offered the most times (${hi}): +${R.generous}.`); }
    }
    for (const st of standings) st.glory = s.players[st.seat].glory;
  }
  const final = s.tides[s.tides.length - 1]?.dir ?? 'neutral';
  const best = Math.max(...standings.map((x) => x.glory));
  const top = standings.filter((x) => x.glory === best);
  s.result = { winners: top.map((x) => x.seat), finalTide: final, daysWon: won, standings };
  s.phase = 'ended';
  stat(s, { type: 'game_end', data: { winners: s.result.winners, standings, daysWon: won } });
  log(s, 'end', top.length === 1 ? `${pname(s, top[0].seat)} wins with ${best} Glory.` : `${top.map((x) => pname(s, x.seat)).join(' and ')} share the win with ${best} Glory.`);
}
