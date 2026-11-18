// Every rework tested in the lab. Targets are filled per player count after calibration (target3, target4).
import { type Rules, TABLES } from './core';

type V = Partial<Rules> & { target3?: number; target4?: number };

export const VARIANTS: Record<string, V> = {
  // ---- Round 1: scoring and the Offer's reward (vanilla deck, no abilities)
  v44: {},
  v44_match: { offerReward: 'match' },
  spoils_flat: { score: TABLES.spoils },
  spoils_match: { score: TABLES.spoils, offerReward: 'match' },
  spoils_none: { score: TABLES.spoils, offerReward: 'none' },
  spoilsLone_match: { score: TABLES.spoilsLone, offerReward: 'match' },
  spoils42_match: { score: TABLES.spoils42, offerReward: 'match' },
  spoils421L_match: { score: TABLES.spoils421L, offerReward: 'match' },
  mirror1_match: { score: TABLES.mirror1, offerReward: 'match' },
  pair_match: { score: TABLES.pair, offerReward: 'match' },
  flat2_match: { score: TABLES.flat2, offerReward: 'match' },
  sym_match: { score: TABLES.sym, offerReward: 'match' },
};

const T = (win: number[], lose: number[]) => ({ win: [0, ...win, 0, 0, 0], lose: [0, ...lose, ...Array(5).fill(lose[lose.length - 1] ?? 0)] });

Object.assign(VARIANTS, {
  // ---- Round 2: more scoring tables, all with Tide-matched Offers
  s220_match: { score: T([2, 2, 0], [0]), offerReward: 'match' },
  s220L_match: { score: T([2, 2, 0], [-1, 0]), offerReward: 'match' },
  s320_match: { score: T([3, 2, 0], [0]), offerReward: 'match' },
  s320L_match: { score: T([3, 2, 0], [-1, 0]), offerReward: 'match' },
  s310L_match: { score: T([3, 1, 0], [-1, 0]), offerReward: 'match' },
  s321_match: { score: T([3, 2, 1, 0], [0]), offerReward: 'match' },
  s330_match: { score: T([3, 3, 0], [0]), offerReward: 'match' },
  s420L_match: { score: T([4, 2, 0], [-1, 0]), offerReward: 'match' },
  s220_none: { score: T([2, 2, 0], [0]), offerReward: 'none' },
  s220_flat: { score: T([2, 2, 0], [0]), offerReward: 'flat' },
} as Record<string, V>);

const CORE: V = { score: T([3, 2, 0], [0]), offerReward: 'match' };
Object.assign(VARIANTS, {
  // ---- Round 3: structure, on the working core (alone 3, two 2, three+ 0; no losses; Offers pay when they match the Tide)
  core: CORE,
  core_anon: { ...CORE, anonymous: true },
  core_omen1: { ...CORE, omens: 1 },
  core_omen2: { ...CORE, omens: 2 },
  core_catchup: { ...CORE, order: 'catchup' },
  core_fbet: { ...CORE, fruitsBet: true },
  core_2turns: { ...CORE, turns: 2 },
  core_choir3: { ...CORE, choirMax: 3 },
  core_hand4: { ...CORE, hand: 4 },
  core_backhand: { ...CORE, replaced: 'hand' },
  core_nofruits: { ...CORE, fruits: false },
  core_noblind: { ...CORE, gatherBlind: false },
  core_start3: { ...CORE, choirStart: 3 },
} as Record<string, V>);

const C2: V = { score: T([3, 2, 0], [-1, 0]), offerReward: 'match' };
Object.assign(VARIANTS, {
  // ---- Round 4: combinations (alone 3 / two 2 / three+ 0; a lone loser -1; Tide-matched Offers)
  c_lone: C2,
  c_omen: { ...C2, omens: 1 },
  c_omen_s3: { ...C2, omens: 1, choirStart: 3 },
  c_omen_cu: { ...C2, omens: 1, order: 'catchup' },
  c_omen_s3_cu: { ...C2, omens: 1, choirStart: 3, order: 'catchup' },
  c_nl_omen_s3: { ...CORE, omens: 1, choirStart: 3 },
  c_omen_h4: { ...C2, omens: 1, hand: 4 },
  c_omen_s3_h4: { ...C2, omens: 1, choirStart: 3, hand: 4 },
  c_omen2_s3: { ...C2, omens: 2, choirStart: 3 },
} as Record<string, V>);

Object.assign(VARIANTS, {
  // ---- Round 5: the Crown (the sole leader's Choir counts as two Choirs)
  k_nl_omen_s3: { ...CORE, omens: 1, choirStart: 3, crown: 2 },
  k_omen_s3: { ...C2, omens: 1, choirStart: 3, crown: 2 },
  k_omen: { ...C2, omens: 1, crown: 2 },
  k_nl_omen: { ...CORE, omens: 1, crown: 2 },
  k_nl_omen_s3_h4: { ...CORE, omens: 1, choirStart: 3, hand: 4, crown: 2 },
  k_omen_s3_h4: { ...C2, omens: 1, choirStart: 3, hand: 4, crown: 2 },
  k_220_omen_s3: { score: T([2, 2, 0], [0]), offerReward: 'match', omens: 1, choirStart: 3, crown: 2 },
} as Record<string, V>);

// ---- Round 7: the engine layer. Each ability appears on a Light and a Dark card (or two Neutral cards).
const K: V = { ...CORE, omens: 1, choirStart: 3, crown: 2 };
const ENGINE_24 = {
  L1: 9, D1: 9, L2: 2, D2: 2, N: 4,
  'L1:herald': 2, 'D1:herald': 2, 'L1:banner': 1, 'D1:banner': 1, 'L1:bond': 1, 'D1:bond': 1,
  'L1:trumpet': 1, 'D1:trumpet': 1, 'L1:store': 1, 'D1:store': 1, 'L1:tithe': 1, 'D1:tithe': 1,
  'L1:zealot': 1, 'D1:zealot': 1, 'N:seer': 2, 'N:sanctuary': 2, 'N:turncoat': 2, 'N:twilight': 2,
};
Object.assign(VARIANTS, {
  e24_s3: { ...K, deck: ENGINE_24 },
  e24_s2: { ...K, choirStart: 2, deck: ENGINE_24 },
  e24_s2_c3: { ...K, choirStart: 2, choirMax: 3, deck: ENGINE_24 },
} as Record<string, V>);

const ENGINE_B = {
  L1: 9, D1: 9, L2: 2, D2: 2, N: 4,
  'L1:banner2': 1, 'D1:banner2': 1, 'L1:bond': 1, 'D1:bond': 1, 'L1:tithe': 1, 'D1:tithe': 1, 'L1:hedge': 1, 'D1:hedge': 1,
  'L1:trumpet': 1, 'D1:trumpet': 1, 'L1:zealot': 1, 'D1:zealot': 1, 'L1:store3': 1, 'D1:store3': 1,
  'N:seer': 2, 'N:sanctuary': 2, 'N:turncoat': 2, 'N:scribe': 2,
};
const ENGINE_S = { // sparse: 11 ability cards
  L1: 12, D1: 12, L2: 2, D2: 2, N: 6,
  'L1:banner2': 1, 'D1:banner2': 1, 'L1:tithe': 1, 'D1:hedge': 1, 'L1:bond': 1, 'D1:zealot': 1, 'L1:store3': 1, 'D1:trumpet': 1,
  'N:seer': 1, 'N:turncoat': 1, 'N:scribe': 1,
};
Object.assign(VARIANTS, {
  eb_s2: { ...K, choirStart: 2, deck: ENGINE_B },
  eb_s3: { ...K, deck: ENGINE_B },
  es_s2: { ...K, choirStart: 2, deck: ENGINE_S },
} as Record<string, V>);

const ENGINE_M = {
  L1: 10, D1: 10, L2: 2, D2: 2, N: 4,
  'L1:banner2': 1, 'D1:banner2': 1, 'L1:bond': 1, 'D1:bond': 1, 'L1:hedge': 1, 'D1:hedge': 1, 'L1:zealot': 1, 'D1:zealot': 1,
  'L1:store3': 1, 'D1:store3': 1, 'L1:horn': 1, 'D1:horn': 1,
  'N:tithe': 2, 'N:prophet': 2, 'N:sanctuary': 1, 'N:turncoat': 1,
};
Object.assign(VARIANTS, {
  em_s2: { ...K, choirStart: 2, deck: ENGINE_M },
  em_s3: { ...K, deck: ENGINE_M },
  em_s2_l: { ...C2, omens: 1, crown: 2, choirStart: 2, deck: ENGINE_M }, // with a lone loser -1
  em_s2_220: { score: T([2, 2, 0], [0]), offerReward: 'match', omens: 1, crown: 2, choirStart: 2, deck: ENGINE_M },
} as Record<string, V>);

const ENGINE_M2 = {
  L1: 10, D1: 10, L2: 2, D2: 2, N: 4,
  'L1:banner2': 1, 'D1:banner2': 1, 'L1:bond': 1, 'D1:bond': 1, 'L1:hedge': 1, 'D1:hedge': 1, 'L1:zealot2': 1, 'D1:zealot2': 1,
  'L1:store3': 1, 'D1:store3': 1, 'L1:horn': 1, 'D1:horn': 1,
  'N:tithe': 2, 'N:prophet': 2, 'N:sanctuary': 1, 'N:turncoat': 1,
};
Object.assign(VARIANTS, {
  em2_s2: { ...K, choirStart: 2, deck: ENGINE_M2 },
  em2_s2_220: { score: T([2, 2, 0], [0]), offerReward: 'match', omens: 1, crown: 2, choirStart: 2, deck: ENGINE_M2 },
  em2_s3: { ...K, deck: ENGINE_M2 },
} as Record<string, V>);

const ENGINE_F = { // final candidate: 10 abilities, 16 ability cards, 44 cards
  L1: 10, D1: 10, L2: 2, D2: 2, N: 4,
  'L1:banner2': 1, 'D1:banner2': 1, 'L1:bond': 1, 'D1:bond': 1, 'L1:hedge': 1, 'D1:hedge': 1, 'L1:zealot1': 1, 'D1:zealot1': 1,
  'L1:store3': 1, 'D1:store3': 1, 'L1:trumpet2': 1, 'D1:trumpet2': 1,
  'N:traitor': 2, 'N:prophet': 2, 'N:turncoat': 2,
};
const ENGINE_FS = { // sparser: 12 ability cards, 44 cards
  L1: 12, D1: 12, L2: 2, D2: 2, N: 4,
  'L1:banner2': 1, 'D1:banner2': 1, 'L1:bond': 1, 'D1:bond': 1, 'L1:hedge': 1, 'D1:hedge': 1,
  'L1:store3': 1, 'D1:zealot1': 1, 'L1:trumpet2': 1, 'D1:trumpet2': 1, 'N:traitor': 1, 'N:prophet': 1,
};
Object.assign(VARIANTS, {
  ef: { ...K, choirStart: 2, deck: ENGINE_F },
  ef_220: { score: T([2, 2, 0], [0]), offerReward: 'match', omens: 1, crown: 2, choirStart: 2, deck: ENGINE_F },
  efs: { ...K, choirStart: 2, deck: ENGINE_FS },
  ef_vanilla: { ...K, choirStart: 2, deck: { L1: 18, D1: 18, L2: 2, D2: 2, N: 4 } },
} as Record<string, V>);

Object.assign(VARIANTS, {
  final: { ...K, choirStart: 2, deck: ENGINE_F, target: 12, target3: 12, target4: 12 },
  v44_ref: { target: 12, target3: 12, target4: 12 },
} as Record<string, V>);

Object.assign(VARIANTS, {
  final_tb: { ...K, choirStart: 2, deck: ENGINE_F, target: 12, target3: 12, target4: 12, tieBreak: 'yesterday' },
} as Record<string, V>);
