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
  /** Where an Offered card comes from: the hand (facedown, now) or only the Choir ('choir': face up, since everyone saw
   *  it leave; Robert's flow, November 20). Tokens are Offered facedown either way. */
  offerFrom: 'hand' | 'choir';
  /** Glory gained at once for Offering a Choir card. */
  choirOfferGlory: number;
  /** Glory gained at once for any Offer (a card or a token). */
  offerGlory: number;

  /** First Fruits go face up (now) or stay facedown until the Evening reveal ('down'); either way shuffled, so anonymous. */
  fruits: 'up' | 'down';
  /** A token (facedown, counts 2) may be given as First Fruits instead of a card. */
  fruitsToken: boolean;
  /** End of the game, with tl / td your tokens and wl / wd the Days won: 'each' (tl·wl + td·wd, V45) or 'majority'
   *  (only your majority color scores: tl·wl or td·wd; tied, the better). */
  endScore: 'each' | 'majority';
  /** Most cards a hand may hold at the end of a Day (0: the hand size). */
  handMax: number;
  /** At the end of a Day: refill the hand to its size, or draw this many cards. */
  upkeepDraw: 'refill' | number;
  /** A Gathered card goes into the Choir, into the hand (now), or either, as the player chooses. */
  gatherTo: 'choir' | 'hand' | 'either';
  /** After First Fruits, who draws 1: those who gave a card ('card'), or everyone who gave anything ('all'), so a
   *  token given as First Fruits cannot be spotted by who did not draw. */
  fruitsDraw: 'card' | 'all';
  /** Turnover: after the Reaping, a full Choir loses its oldest card. */
  decay: boolean;
  /** Carryover: on a tied Day, the Altar is not cleared; its cards and tokens stay for the next Day. */
  carryover: boolean;
}

export const DEFAULT_RULES: CoreRules = {
  // Robert's flow (adopted November 20, design/the-flow.md): no harvest rule, spoils to the Offerers (hand limit 5),
  // Offers only from the Choir (face up) or a token, First Fruits facedown and possibly a token, and only your
  // majority color's tokens score. With turnover and Gather into the hand or the Choir (adopted November 20,
  // design/flow-fixes.md).
  tokensEach: 6, devotion: 0, harvest: 'always', miser: 0, generous: 0, handSize: 3, choirLimit: 4, choirPay: 2, spoils: 'offerers', handMax: 5,
  upkeepDraw: 'refill', gatherTo: 'either', decay: true, carryover: false, offerFrom: 'choir', choirOfferGlory: 0, offerGlory: 0, fruits: 'down', fruitsToken: true, endScore: 'majority', fruitsDraw: 'card',
};

/** The previous core (V45: no offering, no harvest; Offers from the hand; tokens each score the Days their color won).
 *  For comparisons, and for the card tests until the cards are reworked for the current core. */
export const V45: Partial<CoreRules> = { harvest: 'offer', spoils: 'none', handMax: 0, gatherTo: 'choir', decay: false, offerFrom: 'hand', fruits: 'up', fruitsToken: false, endScore: 'each' };

const cache = new WeakMap<object, CoreRules>();
/** The rules this game is played under. */
export function rulesOf(s: Pick<GameState, 'config'>): CoreRules {
  let r = cache.get(s.config);
  if (!r) { r = { ...DEFAULT_RULES, ...s.config.rules }; cache.set(s.config, r); }
  return r;
}

/** How many cards a Choir holds in this game. */
export const choirLimit = (s: Pick<GameState, 'config'>) => rulesOf(s).choirLimit;
