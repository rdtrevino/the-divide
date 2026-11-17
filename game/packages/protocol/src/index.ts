// Messages between the browser and a game room, and the shapes of the stats API.
// The server only ever sends a player their own GameView (see the engine's viewFor).
import type { GameView } from '@divide/engine';

export type SeatKind = 'open' | 'human' | 'bot';

export interface SeatPublic {
  kind: SeatKind;
  name: string;
  /** A human seat whose browser is connected right now. */
  connected: boolean;
  /** A human seat a bot is covering after missed turns. */
  away: boolean;
}

export interface RoomOptions {
  /** Optional rule: 2 Seeds each Day (suggested for 3 players). */
  /** Advanced game: Celestials and Events. */
  advanced: boolean;
  /** Seconds a player has for each decision before a bot makes it. */
  timer: number;
}

export const TIMER_CHOICES = [60, 90, 120, 300] as const;
export const DEFAULT_TIMER = 90;

export interface RoomPublic {
  code: string;
  status: 'lobby' | 'playing' | 'ended';
  seats: SeatPublic[];
  /** Seat index of the player who controls the lobby right now, or null. */
  host: number | null;
  options: RoomOptions;
  gameNumber: number;
  /** Database id of the game in progress or just finished. */
  gameId: string | null;
  /** True once the finished game is written to the stats database. */
  saved: boolean;
  spectators: number;
  /** Shown when a game had to be abandoned (for example after a rules update mid-game). */
  notice?: string;
}

export interface ChatLine {
  ts: number;
  from: string;
  text: string;
}

export type ClientMsg =
  | { t: 'sit'; seat: number }
  | { t: 'stand' }
  | { t: 'seat'; seat: number; kind: 'bot' | 'open' }
  | { t: 'size'; seats: 3 | 4 }
  | { t: 'options'; advanced?: boolean; timer?: number }
  | { t: 'start' }
  | { t: 'answer'; id: number; choice: string[] }
  | { t: 'back' }
  | { t: 'again' }
  | { t: 'chat'; text: string }
  | { t: 'ping' };

export interface StateMsg {
  t: 'state';
  room: RoomPublic;
  you: { seat: number | null; isHost: boolean; name: string };
  /** Your view of the game. `view.log` holds only entries after `logFrom` unless `logReset`. */
  view: GameView | null;
  logReset: boolean;
  /** Seats the game is waiting on, with the server time (ms) their time runs out. */
  waiting: { seat: number; deadline: number | null }[];
  /** Server clock (ms), so the browser can show countdowns without trusting its own clock. */
  now: number;
}

export type ServerMsg =
  | StateMsg
  | { t: 'chat'; lines: ChatLine[]; reset: boolean }
  | { t: 'error'; message: string }
  | { t: 'pong' };

// ---------------------------------------------------------------- stats API

export interface Ratio {
  /** Seats counted. */
  n: number;
  wins: number;
  /** Wins expected by chance (1 / players for each seat). */
  expected: number;
  avgGlory: number;
}

export interface CardStats {
  card: string;
  finalChoir: Ratio | null;
  /** Days a face-up copy sat in a Choir at the end of the Day, and the average Glory its holder made that Day. */
  choirDays: number;
  gloryPerDay: number | null;
  fruits: number;
  offered: number;
  gathered: number;
  exalted: number;
  activations: number;
  negated: number;
  /** Glory this card's ability produced. */
  abilityGlory: number;
}

export interface CelestialStats {
  card: string;
  ratio: Ratio;
  activations: number;
  abilityGlory: number;
}

export interface StatsResponse {
  filters: { version: string; players: number | null; seats: 'all' | 'human' | 'bot' };
  /** Rules versions with finished games, newest first. Shown to players as "current" and "earlier" rules. */
  versions: { version: string; games: number; lastPlayed: string }[];
  summary: {
    games: number;
    seats: number;
    humanSeats: number;
    avgDays: number | null;
    avgWinningGlory: number | null;
    avgGlory: number | null;
    sharedWins: number;
    /** Average Glory change per seat per Day: the yardstick for `gloryPerDay`. */
    baselineGloryPerDay: number | null;
  };
  celestials: CelestialStats[];
  cards: CardStats[];
  players: { name: string; games: number; wins: number; avgGlory: number }[];
  turnOrder: { order: number; n: number; wins: number; expected: number }[];
  tides: { dir: string; n: number }[];
  events: { card: string; n: number; avgSwing: number | null }[];
  recent: GameSummary[];
}

export interface GameSummary {
  id: string;
  endedAt: string;
  days: number | null;
  cardVersion: string;
  finalTide: string | null;
  players: { seat: number; name: string; isBot: boolean; celestial: string; glory: number; winShare: number }[];
}

export interface GameDetail extends GameSummary {
  config: unknown;
  inputs: unknown[];
  engineVersion: string;
  autoInputs: number[];
}
