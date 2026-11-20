// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). The defaults
// are the current core: Robert's flow as rMajGH (adopted November 20, design/the-flow.md). Earlier rounds were defined
// against the V45 core; their results stay in results/ and their definitions in the git history.
import { V45, type CoreRules } from '@divide/engine';

export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  v45: V45,
  // Round 1 of the fixes (design/flow-fixes.md). Choirs that change: a Choir Offer lets a hand card take its place;
  // Gather into the hand or the Choir; Devotion; a Choir of 3; a replaced card returns to hand; turnover; withering.
  swap: { offerSwap: true }, gatherEither: { gatherTo: 'either' }, devotion1: { devotion: 1 }, choir3: { choirLimit: 3 },
  replHand: { replacedToHand: true }, decay: { decay: true }, wither: { witherIdle: true },
  // Balance: everyone draws after First Fruits (a token giver cannot be spotted); odd or more tokens; one spoil each.
  drawAll: { fruitsDraw: 'all' }, tokens5: { tokensEach: 5 }, tokens7: { tokensEach: 7 }, tokens8: { tokensEach: 8 }, spoils1: { spoilsEach: 1 },
};
