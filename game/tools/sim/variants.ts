// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). The defaults
// are the current core: Robert's flow as rMajGH with turnover and Gather into either (design/flow-fixes.md). Earlier
// rounds' results stay in results/ and their definitions in the git history.
import { V45, type CoreRules } from '@divide/engine';

export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  v45: V45,
  // The previous core, rMajGH, before turnover and Gather into either (adopted November 20, design/flow-fixes.md).
  rMajGH: { decay: false, gatherTo: 'hand' },
  // Kept from the fixes: Devotion, a Choir of 3, everyone draws after First Fruits, other token counts.
  devotion1: { devotion: 1 }, choir3: { choirLimit: 3 }, drawAll: { fruitsDraw: 'all' }, tokens5: { tokensEach: 5 },
  // Choir Offers (design/choir-offers.md, design/the-world.md): Offer from the hand; the Offer reward (open: every Offer
  // earns 1 Glory, a Choir Offer 2, as `offerGlory1+glory1`). The other ideas, the World and its gate were rejected and
  // removed (definitions in the git history).
  hand: { offerFrom: 'hand' }, glory1: { choirOfferGlory: 1 }, offerGlory1: { offerGlory: 1 },
};

/** A variant by name; `a+b` combines variants (later ones win). */
export function variant(name: string): Partial<CoreRules> {
  const parts = name.split('+').map((k) => VARIANTS[k]);
  if (parts.some((p) => !p)) throw new Error(`unknown variant ${name}; one of ${Object.keys(VARIANTS).join(', ')} (join with +)`);
  return Object.assign({}, ...parts);
}
