// Core rule variants tested by core.ts and exploits.ts (engine rules.ts holds the flags and their defaults).
import type { CoreRules } from '@divide/engine';

export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  // Standing decisions, re-checked with strong bots.
  harvestAlways: { harvest: 'always' }, harvestHalf: { harvest: 'half' }, noJudgment: { judgment: false }, leftoversLost: { leftovers: 'lost' },
  // Hedging and readability.
  devotion1: { devotion: 1 }, devotion2: { devotion: 2 }, choirPay1: { choirPay: 1 }, tokenValue2: { tokenValue: 2 },
  passTokens: { passTokens: true }, bag2: { bag: 2 }, choirVote: { choirVote: true }, choirFlat: { choirPay: 1, choirFlat: 1 },
  tokens4: { tokensEach: 4 }, tokens8: { tokensEach: 8 },
  // Round 2: the engine tied to the secret side, Choirs that churn, and a colorless Choir (for contrast).
  fall: { fall: true }, faith: { faith: true }, colorless: { choirPay: 0, choirFlat: 2 },
};
