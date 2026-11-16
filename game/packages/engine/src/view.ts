// What each player is allowed to see. The server sends only this, never the raw state.
import { alignment } from './core';
import type { Decision, GameState, LogEntry, Seat } from './types';

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
  alignment: number | null;
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
      alignment: alignment(s, p.seat),
    })),
    // A card someone peeked at (Urim, Asmadai) was shown to them once, in that decision; it is not shown again here.
    altar: s.altar.map((a) => ({ id: !a.facedown || a.offeredBy === seat || ended ? a.id : null, facedown: a.facedown, offeredBy: a.offeredBy, kind: a.kind, sanctuary: a.sanctuary })),
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
