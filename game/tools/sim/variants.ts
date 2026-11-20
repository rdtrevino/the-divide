// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). The defaults
// are the current core: Robert's flow as rMajGH (adopted November 20, design/the-flow.md). Earlier rounds were defined
// against the V45 core; their results stay in results/ and their definitions in the git history.
import { V45, type CoreRules } from '@divide/engine';

export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  v45: V45,
  // The previous core, rMajGH, before turnover and Gather into either (adopted November 20, design/flow-fixes.md).
  rMajGH: { decay: false, gatherTo: 'hand' },
  // Kept from the fixes: Devotion, a Choir of 3, everyone draws after First Fruits, other token counts.
  devotion1: { devotion: 1 }, choir3: { choirLimit: 3 }, drawAll: { fruitsDraw: 'all' }, tokens5: { tokensEach: 5 },
  // Choir Offers (design/choir-offers.md): Offer from the hand, or from either; no token Offers; rewards for a Choir
  // Offer (Glory, a card, it still reaps tonight, it counts double); any Offer pays 1; tokens count 1; spoils first or
  // only to Choir Offerers; a full Choir may also Offer its oldest card after the action.
  hand: { offerFrom: 'hand' }, both: { offerFrom: 'both' }, noTokenOffer: { offerTokens: false }, bothNoToken: { offerFrom: 'both', offerTokens: false },
  glory1: { choirOfferGlory: 1 }, glory2: { choirOfferGlory: 2 }, offerGlory1: { offerGlory: 1 }, draw1: { choirOfferDraw: 1 },
  reaps: { choirOfferReaps: true }, weight2: { choirOfferWeight: 2 }, tokenW1: { tokenWeight: 1 },
  spoilsFirst: { choirSpoils: 'first' }, spoilsOnly: { choirSpoils: 'only' }, oldest: { oldestFree: true },
};

/** A variant by name; `a+b` combines variants (later ones win). */
export function variant(name: string): Partial<CoreRules> {
  const parts = name.split('+').map((k) => VARIANTS[k]);
  if (parts.some((p) => !p)) throw new Error(`unknown variant ${name}; one of ${Object.keys(VARIANTS).join(', ')} (join with +)`);
  return Object.assign({}, ...parts);
}
