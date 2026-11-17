// Core types for The Divide rules engine.
// The engine is deterministic: a game is fully described by its config (including the seed)
// plus the ordered list of inputs. Replaying those reproduces the game exactly.

export type Seat = number;
export type Dir = 'light' | 'dark' | 'neutral';
export type Mode = 'open' | 'hidden';

export interface PlayerConfig {
  name: string;
  isBot: boolean;
  celestial?: string; // celestial id; random if omitted
}

export interface GameConfig {
  seed: number;
  mode: Mode;
  players: PlayerConfig[];
  /** Optional rule: reveal 2 Seeds each Morning (suggested for thin 3-player Altars). */
  twoSeeds?: boolean;
  /** Experimental balance variants, used for A/B testing in the simulator. */
  variants?: string[];
}

export interface ChoirCard {
  id: string;
  facedown: boolean;
  /** Once-per-game card whose ability has been spent (turned sideways). */
  used: boolean;
}

export interface AltarCard {
  id: string;
  facedown: boolean;
  offeredBy: Seat | null;
  day: number;
  /** How the card reached the Altar. Only 'offer' counts as an Offer (Snare, Mirage). */
  kind?: 'seed' | 'fruits' | 'offer' | 'vessel' | 'other';
  /** Players who have secretly seen this facedown card (Urim, Asmadai). */
  seenBy?: Seat[];
  /** Sanctuary: seat that protected this card for the rest of the Day. */
  sanctuary?: Seat;
}

export interface Player {
  seat: Seat;
  name: string;
  isBot: boolean;
  celestial: string;
  hand: string[];
  choir: ChoirCard[];
  glory: number;
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

export interface GameResult {
  winners: Seat[];
  finalTide: Dir;
  standings: { seat: Seat; glory: number; bonus: number; matching: number }[];
}

export interface DayFlags {
  /** `${seat}:${key}` -> true for once-per-Day usage this Day. */
  usedToday: Record<string, true>;
  ordeal: Seat[];
  mercy: Seat[];
  defiance: Seat[];
  whisperCall?: Dir;
  prophecy: Record<number, Dir>;
  lots: Record<number, Dir>;
  /** Seats that took each action this Day, in order (for Covenant). */
  actionsTaken: { seat: Seat; action: 'offer' | 'gather' | 'exalt' }[];
  /** Seat (by Eternity) and card kept as the next Day's Seed. */
  eternityKeep?: { seat: Seat; card: string };
  eclipsed: Record<number, string>;
  figLeaves: Seat[];
  heresy: Seat[];
  handLimitBonus: number;
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
  eventDeck: string[];
  eventDiscard: string[];
  currentEvent: string | null;
  firstPlayer: Seat;
  active: Seat | null;
  tides: TideRecord[];
  /** Each player's Alignment color at their previous Reaping (for Apple). */
  lastAlignColor: Record<number, Dir>;
  /** Seed carried over by Eternity. */
  carriedSeed: string | null;
  pacts: Pact[];
  bonds: { owner: Seat; bound: Seat }[];
  scapegoats: { from: Seat; to: Seat }[];
  anathema: { target: Seat; by: Seat }[];
  confession: { seat: Seat; endsAfterTurnOf: Seat; turnsLeft: number }[];
  morningStar: { seat: Seat; card: string }[];
  day_: DayFlags;
  turnUsed: string[];
  log: LogEntry[];
  stats: StatEvent[];
  seq: number;
  decisionSeq: number;
  result: GameResult | null;
  celestialPool: string[];
}
