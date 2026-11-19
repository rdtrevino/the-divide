// Core rule variants, for testing the game's structure (design/core-validation.md). The defaults are the current
// rules; a game uses others only when its config says so. Every flag is read from the game state, so replays and the
// strong bot's copies play the same rules.
import type { GameState } from './types';

export interface CoreRules {
  /** Glory per Choir card of the winning color at the Reaping. */
  choirPay: number;
  /** Glory per Choir card on any won Day, whatever its color (on top of choirPay). */
  choirFlat: number;
  /** At the end, each token scores this much per Day its color won. */
  tokenValue: number;
  /** Tokens dealt to each player. */
  tokensEach: number;
  /** Extra tokens of each color left facedown in the bag, so even the totals dealt are unknown. */
  bag: number;
  /** When a Choir scores: 'offer' (no offering, no harvest), 'always', or 'half' (half, rounded down, without an Offer). */
  harvest: 'offer' | 'always' | 'half';
  /** Day 7 is Judgment Day (secret, simultaneous choices). */
  judgment: boolean;
  /** Tokens left on the Altar: to whoever holds the fewest, or out of the game. */
  leftovers: 'fewest' | 'lost';
  /** Devotion: at the end, each Choir card of the color you hold more tokens of scores this much. */
  devotion: number;
  /** Each Evening, everyone passes one of their tokens, at random and facedown, to the player on their left. */
  passTokens: boolean;
  /** Each Choir adds 1 to the Tide for the color it holds more of. */
  choirVote: boolean;
  /** The Fall: after the Reaping of a won Day, each player discards one of their Choir cards of the losing color. */
  fall: boolean;
  /** Faith: at the end, your tokens of a color score only if your Choir holds a card of that color. */
  faith: boolean;
}

export const DEFAULT_RULES: CoreRules = {
  choirPay: 2, choirFlat: 0, tokenValue: 1, tokensEach: 6, bag: 0, harvest: 'offer', judgment: true, leftovers: 'fewest',
  devotion: 0, passTokens: false, choirVote: false, fall: false, faith: false,
};

const cache = new WeakMap<object, CoreRules>();
/** The rules this game is played under. */
export function rulesOf(s: Pick<GameState, 'config'>): CoreRules {
  let r = cache.get(s.config);
  if (!r) { r = { ...DEFAULT_RULES, ...s.config.rules }; cache.set(s.config, r); }
  return r;
}
