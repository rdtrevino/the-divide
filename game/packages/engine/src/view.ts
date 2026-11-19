// What each player is allowed to see. The server sends only this, never the raw state.
import { choirColors } from './core';
import { DAYS } from './engine';
import type { Decision, GameState, LogEntry, Seat, Side } from './types';

export interface PlayerView {
  seat: Seat;
  name: string;
  isBot: boolean;
  celestial: string;
  glory: number;
  handCount: number;
  /** Your own hand, or a hand revealed by Confession. */
  hand: string[] | null;
  choir: { id: string | null; facedown: boolean; used: boolean }[];
  /** Face-up Choir cards that count as Light and as Dark (each scores 2 when its color wins the Day). */
  colors: { light: number; dark: number };
  /** How many allegiance tokens they hold (public). */
  tokenCount: number;
  /** Your own tokens; everyone's once the game is over. */
  tokens: Side[] | null;
  /** Offers made this game (the Miser's Rule). */
  offers: number;
}

export interface GameView {
  you: Seat | null;
  day: number;
  phase: GameState['phase'];
  event: string | null;
  firstPlayer: Seat;
  active: Seat | null;
  players: PlayerView[];
  altar: { id: string | null; facedown: boolean; offeredBy: Seat | null; kind?: string; sanctuary?: Seat }[];
  /** Allegiance tokens Offered this Day: who Offered each is public, its color is not. */
  altarTokens: { side: Side | null; by: Seat }[];
  /** How many Days the game lasts. */
  days: number;
  deckCount: number;
  discard: string[];
  eventDeckCount: number;
  tides: GameState['tides'];
  whisperCall?: string;
  prophecy: Record<number, string>;
  pacts: GameState['pacts'];
  bonds: GameState['bonds'];
  anathema: GameState['anathema'];
  morningStar: GameState['morningStar'];
  eclipsed: Record<number, string>;
  log: LogEntry[];
  decisions: Decision[];
  result: GameState['result'];
}

const canSee = (e: LogEntry, seat: Seat | null) => e.visibility === 'public' || (seat !== null && e.visibility.includes(seat));

export function viewFor(s: GameState, seat: Seat | null, pending: Decision[] = []): GameView {
  const revealed = new Set(s.confession.map((c) => c.seat));
  const ended = s.phase === 'ended';
  return {
    you: seat,
    day: s.day,
    phase: s.phase,
    event: s.currentEvent,
    firstPlayer: s.firstPlayer,
    active: s.active,
    players: s.players.map((p) => ({
      seat: p.seat,
      name: p.name,
      isBot: p.isBot,
      celestial: p.celestial,
      glory: p.glory,
      handCount: p.hand.length,
      hand: p.seat === seat || revealed.has(p.seat) || ended ? [...p.hand] : null,
      choir: p.choir.map((c) => ({ id: !c.facedown || p.seat === seat || ended ? c.id : null, facedown: c.facedown, used: c.used })),
      colors: choirColors(s, p.seat),
      tokenCount: p.tokens.length,
      tokens: p.seat === seat || ended ? [...p.tokens] : null,
      offers: p.offers,
    })),
    // A card someone peeked at (Knowledge, Belial) was shown to them once, in that decision; it is not shown again here.
    // Who placed a card is hidden once the anonymous reveal has shuffled it (except from its owner).
    altar: s.altar.map((a) => ({ id: !a.facedown || a.offeredBy === seat || ended ? a.id : null, facedown: a.facedown, offeredBy: a.anon && a.offeredBy !== seat ? null : a.offeredBy, kind: a.kind, sanctuary: a.sanctuary })),
    altarTokens: s.altarTokens.map((t) => ({ side: t.by === seat || ended ? t.side : null, by: t.by })),
    days: DAYS[s.players.length],
    deckCount: s.hostDeck.length,
    discard: [...s.discard],
    eventDeckCount: s.eventDeck.length,
    tides: s.tides,
    whisperCall: s.day_.whisperCall,
    prophecy: { ...s.day_.prophecy },
    pacts: s.pacts,
    bonds: s.bonds,
    anathema: s.anathema,
    morningStar: s.morningStar,
    eclipsed: { ...s.day_.eclipsed },
    log: s.log.filter((e) => canSee(e, seat)),
    decisions: seat === null ? [] : pending.filter((d) => d.seat === seat),
    result: s.result,
  };
}
