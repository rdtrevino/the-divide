// Core rule switches still under test (design/core-validation.md, design/harvest-and-sizes.md). The defaults are the
// current rules; a game uses others only when its config says so, and every flag is read from the game state, so
// replays and the strong bot's copies play the same rules. A switch is removed once its question is decided (the
// earlier variants' switches are in the git history).
import type { GameState } from './types';

export interface CoreRules {
  /** Tokens dealt to each player (8 is under consideration). */
  tokensEach: number;
  /** Devotion (held until playtesting): at the end, each Choir card of the color you hold more tokens of scores this. */
  devotion: number;
  /** When a Choir scores: 'offer' (no offering, no harvest), 'always', or 'half' (half, rounded down, without an Offer). */
  harvest: 'offer' | 'always' | 'half';
  /** The Miser: at the end, whoever Offered the fewest times loses this much (nobody, if all tied). */
  miser: number;
  /** The Generous: at the end, whoever Offered the most times gains this much (nobody, if all tied). */
  generous: number;
  /** Hand size (the Dominion holds 2 more). */
  handSize: number;
  /** How many cards a Choir holds. */
  choirLimit: number;
  /** Glory per Choir card of the winning color at the Reaping. */
  choirPay: number;
  /** Spoils: after a won Day, eligible players take the Altar's cards (into hand) and tokens, one at a time in turn
   *  order. 'claim': players whose Choir holds more cards of the winning color than of the other; 'offerers': players
   *  who Offered today. Unclaimed tokens still go to whoever holds the fewest. */
  spoils: 'none' | 'claim' | 'offerers';
  /** Most cards a hand may hold at the end of a Day (0: the hand size). */
  handMax: number;
  /** At the end of a Day: refill the hand to its size, or draw this many cards. */
  upkeepDraw: 'refill' | number;
  /** A Gathered card goes into the Choir, or into the hand (the Altar as a market). */
  gatherTo: 'choir' | 'hand';
  /** Turnover: after the Reaping, a full Choir loses its oldest card. */
  decay: boolean;
  /** Carryover: on a tied Day, the Altar is not cleared; its cards and tokens stay for the next Day. */
  carryover: boolean;
}

export const DEFAULT_RULES: CoreRules = {
  tokensEach: 6, devotion: 0, harvest: 'offer', miser: 0, generous: 0, handSize: 3, choirLimit: 4, choirPay: 2, spoils: 'none', handMax: 0,
  upkeepDraw: 'refill', gatherTo: 'choir', decay: false, carryover: false,
};

const cache = new WeakMap<object, CoreRules>();
/** The rules this game is played under. */
export function rulesOf(s: Pick<GameState, 'config'>): CoreRules {
  let r = cache.get(s.config);
  if (!r) { r = { ...DEFAULT_RULES, ...s.config.rules }; cache.set(s.config, r); }
  return r;
}

/** How many cards a Choir holds in this game. */
export const choirLimit = (s: Pick<GameState, 'config'>) => rulesOf(s).choirLimit;
