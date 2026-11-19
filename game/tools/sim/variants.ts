// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). Only the
// questions still open have switches; decided ones were removed (their results stay in results/;
// design/core-validation.md, design/harvest-and-sizes.md).
import type { CoreRules } from '@divide/engine';

const none = { harvest: 'always' } as const;
export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  devotion1: { devotion: 1 }, devotion2: { devotion: 2 }, tokens8: { tokensEach: 8 }, dev1t8: { devotion: 1, tokensEach: 8 },
  // The harvest rule (Robert, November 19): no offering, no harvest; none; half; or an end-of-game rule instead.
  none, half: { harvest: 'half' }, miser3: { ...none, miser: 3 }, miser5: { ...none, miser: 5 }, generous3: { ...none, generous: 3 },
  // Hand and Choir sizes, under the current harvest rule and under none.
  hand2: { handSize: 2 }, hand4: { handSize: 4 }, choir3: { choirLimit: 3 }, choir5: { choirLimit: 5 }, choir6: { choirLimit: 6 },
  none_hand2: { ...none, handSize: 2 }, none_hand4: { ...none, handSize: 4 }, none_choir3: { ...none, choirLimit: 3 }, none_choir5: { ...none, choirLimit: 5 }, none_choir6: { ...none, choirLimit: 6 },
};
