// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). Only the
// questions still open have switches; decided ones were removed (their results stay in results/;
// design/core-validation.md, design/harvest-and-sizes.md, design/spoils-and-economy.md).
import type { CoreRules } from '@divide/engine';

const none = { harvest: 'always' } as const;
const spoils = { ...none, spoils: 'claim', handMax: 5 } as const;
const S = { ...none, spoils: 'offerers', handMax: 5 } as const;
const R = { ...S, offerFrom: 'choir', fruits: 'down', fruitsToken: true } as const;
export const VARIANTS: Record<string, Partial<CoreRules>> = {
  current: {},
  devotion1: { devotion: 1 }, tokens8: { tokensEach: 8 },
  // The harvest rule: none (Robert, November 20: no harvest rule and no Miser), half, the Miser.
  none, half: { harvest: 'half' }, miser3: { ...none, miser: 3 },
  // Balance without a harvest rule, and Robert's economy ideas (November 20).
  pay1: { ...none, choirPay: 1 },
  spoils, spoilsPay1: { ...spoils, choirPay: 1 }, spoilsPay0: { ...spoils, choirPay: 0 },
  offererSpoils: { ...none, spoils: 'offerers', handMax: 5 }, offererSpoilsPay1: { ...none, spoils: 'offerers', handMax: 5, choirPay: 1 },
  market: { ...none, gatherTo: 'hand', handMax: 5, upkeepDraw: 1 },
  marketSpoils: { ...spoils, gatherTo: 'hand', upkeepDraw: 1, choirPay: 1 },
  turnover: { ...none, decay: true }, spoilsTurnover: { ...spoils, choirPay: 1, decay: true },
  // Round 2: the winners combined, with carryover (a tied Altar stays for the next Day).
  carry: { ...none, carryover: true }, turnCarry: { ...none, decay: true, carryover: true },
  offTurn: { ...none, spoils: 'offerers', handMax: 5, decay: true }, offCarry: { ...none, spoils: 'offerers', handMax: 5, carryover: true },
  offTurnCarry: { ...none, spoils: 'offerers', handMax: 5, decay: true, carryover: true },
  // Round 4: each Offerer takes one spoil (a draft until empty gave the first pickers extra).
  // Round 5 (Robert, November 20: spoils to the Offerers as the base): Choirs that move without rewarding free-riders.
  sReplaceHand: { ...none, spoils: 'offerers', handMax: 5, replacedToHand: true },
  sWither: { ...none, spoils: 'offerers', handMax: 5, witherIdle: true },
  sChoir3: { ...none, spoils: 'offerers', handMax: 5, choirLimit: 3 },
  off1: { ...none, spoils: 'offerers', spoilsEach: 1, handMax: 5 },
  // Round 6 (Robert, November 20): his flow. S is spoils to the Offerers (his assumed direction); R adds the three
  // pieces that change the turn: Offers only from the Choir (face up), First Fruits facedown, and a token allowed as First Fruits.
  rFull: R,
  // R with one piece left out.
  rHandOffer: { ...S, fruits: 'down', fruitsToken: true }, rFruitsUp: { ...S, offerFrom: 'choir', fruitsToken: true },
  rNoFruitToken: { ...S, offerFrom: 'choir', fruits: 'down' }, rNoSpoils: { ...none, offerFrom: 'choir', fruits: 'down', fruitsToken: true },
  // Each piece alone, on S.
  sChoirOnly: { ...S, offerFrom: 'choir' }, sFruitsDown: { ...S, fruits: 'down' }, sFruitToken: { ...S, fruitsToken: true }, sGatherHand: { ...S, gatherTo: 'hand' },
  // R with Robert's open questions (the spoils order, the Reaping variants, the 'winner' and 'net' end scores, a Choir
  // Offer counting 2 and Offers from the hand or the Choir were rejected and their switches removed: design/the-flow.md).
  rGatherHand: { ...R, gatherTo: 'hand' }, rPay1: { ...R, choirPay: 1 }, rMajority: { ...R, endScore: 'majority' },
  // Round 7: the end score by majority looked best in round 1 (seats even, sides moving); combined with the others.
  sMajority: { ...S, endScore: 'majority' }, rMajNoFT: { ...R, fruitsToken: false, endScore: 'majority' },
  rMajGH: { ...R, endScore: 'majority', gatherTo: 'hand' }, rMajUp: { ...R, endScore: 'majority', fruits: 'up' },
  rMajPay1: { ...R, endScore: 'majority', choirPay: 1 },
  // Round 8: the leader (rMajGH) with Offers from the hand again, or First Fruits face up: are they needed?
  rMajUpGH: { ...R, endScore: 'majority', gatherTo: 'hand', fruits: 'up' },
  hMajGH: { ...S, fruits: 'down', fruitsToken: true, endScore: 'majority', gatherTo: 'hand' },
  hMajUpGH: { ...S, fruitsToken: true, endScore: 'majority', gatherTo: 'hand' },
};
