// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). The defaults
// are the current core: Robert's flow as rMajGH (adopted November 20, design/the-flow.md). Earlier rounds were defined
// against the V45 core; their results stay in results/ and their definitions in the git history.
import { V45, type CoreRules } from '@divide/engine';

export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  v45: V45,
  // The fixes (design/flow-fixes.md). Kept: turnover, Gather into the hand or the Choir, Devotion, a Choir of 3, everyone
  // draws after First Fruits, other token counts. The swap, a replaced card to the hand, withering and one spoil each
  // were rejected and removed (their definitions are in the git history).
  decay: { decay: true }, gatherEither: { gatherTo: 'either' }, devotion1: { devotion: 1 }, choir3: { choirLimit: 3 },
  drawAll: { fruitsDraw: 'all' }, tokens5: { tokensEach: 5 }, tokens7: { tokensEach: 7 }, tokens8: { tokensEach: 8 },
};

/** A variant by name; `a+b` combines variants (later ones win). */
export function variant(name: string): Partial<CoreRules> {
  const parts = name.split('+').map((k) => VARIANTS[k]);
  if (parts.some((p) => !p)) throw new Error(`unknown variant ${name}; one of ${Object.keys(VARIANTS).join(', ')} (join with +)`);
  return Object.assign({}, ...parts);
}
