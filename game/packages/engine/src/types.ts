// Core types for The Divide rules engine.
// The engine is deterministic: a game is fully described by its config (including the seed)
// plus the ordered list of inputs. Replaying those reproduces the game exactly.

export type Seat = number;
export type Dir = 'light' | 'dark' | 'neutral';
/** A side: the color of an allegiance token. */
export type Side = 'light' | 'dark';
/** One game for 3 and 4 players (V45). Hidden Roles, the 5–6 player mode, was retired. */
export type Mode = 'open';

export interface PlayerConfig {
  name: string;
  isBot: boolean;
  celestial?: string; // celestial id; random if omitted
}

export interface GameConfig {
  seed: number;
  mode: Mode;
  players: PlayerConfig[];
  /** Advanced game: Celestials and Events (V41). The Base game has neither. */
  advanced?: boolean;
}

export interface ChoirCard {
  id: string;
  facedown: boolean;
  /** Once-per-game card whose ability has been spent (turned sideways). */
  used: boolean;
  /** Providence (V42): Glory stored on the card. */
  store?: number;
  /** Parasite (V43): the player who planted it. */
  by?: Seat;
}

export interface AltarCard {
  id: string;
  facedown: boolean;
  offeredBy: Seat | null;
  day: number;
  /** How the card reached the Altar. Only 'offer' counts as an Offer (Snare, Mirage). First Fruits have no owner (V45: anonymous). */
  kind?: 'seed' | 'fruits' | 'offer' | 'vessel' | 'relic' | 'other';
  /** Players who have secretly seen this facedown card (Knowledge, Belial). */
  seenBy?: Seat[];
  /** Sanctuary: seat that protected this card for the rest of the Day. */
  sanctuary?: Seat;
  /** Revealed in the Evening among the shuffled facedown cards (V45): who placed it is no longer shown. */
  anon?: boolean;
}

/** An allegiance token Offered onto the Altar (V45). Not a card: only Gather and the Evening touch it. */
export interface AltarToken {
  side: Side;
  by: Seat;
  /** Offered face up (Anathema): everyone sees its color. */
  shown?: boolean;
}

export interface Player {
  seat: Seat;
  name: string;
  isBot: boolean;
  celestial: string;
  hand: string[];
  choir: ChoirCard[];
  glory: number;
  /** Secret allegiance tokens (V45). */
  tokens: Side[];
  /** Whether they Offered this Day (a card or a token): no offering, no harvest. */
  offeredToday: boolean;
}

export interface Pact {
  a: Seat;
  b: Seat;
  action: 'offer' | 'gather' | 'exalt';
  broken: boolean;
  day: number;
}

export interface TideRecord {
  day: number;
  dir: Dir;
  light: number;
  dark: number;
  margin: number;
  /** Purgatory (V45): the Day counts for neither side on the Tide track. */
  void?: boolean;
}

export interface Option {
  id: string;
  label: string;
  card?: string;
  seat?: Seat;
}

export interface Decision {
  /** Unique, increasing id assigned by the engine. */
  id: number;
  seat: Seat;
  /** Machine-readable context, used by bots, UI, and stats. */
  tag: string;
  prompt: string;
  options: Option[];
  min: number;
  max: number;
  /** Extra context (for example, cards a player is privately looking at). Visible only to `seat`. */
  reveal?: string[];
}

export type Answer = string[];

export type Gen<T> = Generator<Decision[], T, Answer[]>;

export type LogVisibility = 'public' | Seat[];

export interface LogEntry {
  seq: number;
  day: number;
  kind: string;
  text: string;
  visibility: LogVisibility;
  data?: Record<string, unknown>;
}

/** Structured record for stats, written to the database by the server. */
export interface StatEvent {
  seq: number;
  day: number;
  type:
    | 'action'
    | 'activate'
    | 'negated'
    | 'glory'
    | 'tide'
    | 'reaping'
    | 'event'
    | 'enter_choir'
    | 'leave_choir'
    | 'game_end';
  seat?: Seat;
  card?: string;
  amount?: number;
  source?: string;
  data?: Record<string, unknown>;
}

export interface Standing {
  seat: Seat;
  glory: number;
  /** Glory from the Choir and abilities, before the reveal. */
  before: number;
  tokens: { light: number; dark: number };
  /** Glory from tokens: each scores the Days its color won. */
  fromTokens: number;
}

export interface GameResult {
  winners: Seat[];
  finalTide: Dir;
  /** Days each side won on the Tide track. */
  daysWon: { light: number; dark: number };
  standings: Standing[];
}

/** A secret Judgment Day choice: the action, and what it takes (a card id, a token, or a discard-pile card). */
export interface Plan {
  action: 'offer' | 'gather' | 'exalt';
  /** The option chosen: a card id, 'token:light' / 'token:dark', 'discard:<id>', or 'card:<id>' for a card on the Altar. */
  key: string;
  /** For a token Gathered from the Altar: which one. */
  token?: AltarToken;
}

export interface DayFlags {
  /** `${seat}:${key}` -> true for once-per-Day usage this Day. */
  usedToday: Record<string, true>;
  ordeal: Seat[];
  whisperCall?: Dir;
  prophecy: Record<number, Dir>;
  lots: Record<number, Dir>;
  /** Seats that took each action this Day, in order (for Covenant). */
  actionsTaken: { seat: Seat; action: 'offer' | 'gather' | 'exalt' }[];
  eclipsed: Record<number, string>;
  heresy: Seat[];
  handLimitBonus: number;
  /** Bounty (V42): the player each holder named this Day. */
  bounty: Record<number, Seat>;
  /** Free Will (V42): this player takes a second action this turn. */
  extraAction?: Seat;
  /** Cards each player Offered this Day (for Gabriel). */
  offered?: Record<number, string[]>;
  /** Gabriel's prediction: the player named and the alignment called. */
  seer?: Record<number, { t: Seat; dir: Dir }>;
  /** Council's partner. */
  council?: Record<number, Seat>;
  /** Facedown and face-up Altar counts when it was revealed (Veil). */
  reveal?: { down: number; up: number };
  /** Judgment Day (V45): each player's secret action for the last Day, carried out in turn order. */
  plan?: Record<number, Plan>;
  /** The Judgment Day choice being carried out right now (set by the action, read once by its first pick). */
  preset?: Plan | null;
  /** What each Choir scores at this Reaping, before anyone gains (the Arbiter). */
  reaped?: Record<number, number>;
}

export interface GameState {
  config: GameConfig;
  rng: number;
  day: number;
  phase: 'setup' | 'morning' | 'noon' | 'evening' | 'ended';
  players: Player[];
  hostDeck: string[];
  discard: string[];
  altar: AltarCard[];
  /** Allegiance tokens Offered this Day (V45). */
  altarTokens: AltarToken[];
  eventDeck: string[];
  eventDiscard: string[];
  currentEvent: string | null;
  firstPlayer: Seat;
  active: Seat | null;
  tides: TideRecord[];
  pacts: Pact[];
  bonds: { owner: Seat; bound: Seat }[];
  /** Anathema blocks Offer; Flaming Sword blocks Exalt and Gather. Each lasts until the start of its holder's next turn. */
  /** Anathema (V45: other players' Offers go face up) and Flaming Sword (no Exalting): each lasts until the start of its holder's next turn. */
  anathema: { target: Seat; by: Seat; action?: 'faceup' | 'gather' | 'exalt' }[];
  /** Silence (V42): a player whose Choir abilities do not work until the silencer's next turn. */
  silenced: { target: Seat; by: Seat }[];
  confession: { seat: Seat; turnsLeft: number }[];
  morningStar: { seat: Seat; card: string }[];
  day_: DayFlags;
  turnUsed: string[];
  log: LogEntry[];
  stats: StatEvent[];
  seq: number;
  decisionSeq: number;
  result: GameResult | null;
  /** Cards Eternity keeps on the Altar into the next Day. */
  relics?: { id: string; by: Seat | null }[];
}
