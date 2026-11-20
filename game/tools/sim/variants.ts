// Core rule variants for core.ts and exploits.ts (engine rules.ts holds the switches and their defaults). Only the
// questions still open have switches; decided ones were removed (their results stay in results/;
// design/core-validation.md, design/harvest-and-sizes.md, design/spoils-and-economy.md).
import type { CoreRules } from '@divide/engine';

const none = { harvest: 'always' } as const;
const spoils = { ...none, spoils: 'claim', handMax: 5 } as const;
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
  // Round 3: spoils drafted from the Day's last player (the first player's extra picks made seat 1 strong).
  offRev: { ...none, spoils: 'offerers', spoilsOrder: 'reverse', handMax: 5 },
  offTurnRev: { ...none, spoils: 'offerers', spoilsOrder: 'reverse', handMax: 5, decay: true },
  offTurnRevDraw1: { ...none, spoils: 'offerers', spoilsOrder: 'reverse', handMax: 5, decay: true, upkeepDraw: 1 },
  // Round 4: each Offerer takes one spoil (a draft until empty gave the first pickers extra).
  off1: { ...none, spoils: 'offerers', spoilsEach: 1, handMax: 5 }, off1Rev: { ...none, spoils: 'offerers', spoilsEach: 1, spoilsOrder: 'reverse', handMax: 5 },
};
