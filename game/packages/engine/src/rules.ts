// Core rule switches still under test (design/core-validation.md). The defaults are the current rules; a game uses
// others only when its config says so, and every flag is read from the game state, so replays and the strong bot's
// copies play the same rules. As with earlier reworks, a switch is removed once its question is decided: the rejected
// variants and the re-checked standing decisions of the core validation were removed this way (git history).
import type { GameState } from './types';

export interface CoreRules {
  /** Tokens dealt to each player (8 is under consideration). */
  tokensEach: number;
  /** Devotion (proposed, held until playtesting): at the end, each Choir card of the color you hold more tokens of
   *  scores this much. */
  devotion: number;
}

export const DEFAULT_RULES: CoreRules = { tokensEach: 6, devotion: 0 };

const cache = new WeakMap<object, CoreRules>();
/** The rules this game is played under. */
export function rulesOf(s: Pick<GameState, 'config'>): CoreRules {
  let r = cache.get(s.config);
  if (!r) { r = { ...DEFAULT_RULES, ...s.config.rules }; cache.set(s.config, r); }
  return r;
}
