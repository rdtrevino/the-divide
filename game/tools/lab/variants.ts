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

// ---- Round 16: Robert's questions. Base = the recommended rules (final_tb); one change each.
const FB: V = { ...K, choirStart: 2, deck: ENGINE_F, target: 12, target3: 12, target4: 12, tieBreak: 'yesterday' };
Object.assign(VARIANTS, {
  q_base: FB,
  q_lose1: { ...FB, score: T([3, 2, 0], [-1]) },                       // every Choir against the Tide loses 1
  q_heavy: { ...FB, score: T([3, 2, 0], [-1]), loseHeavy: 2 },         // only Choirs leaning by 2 or more lose 1
  q_luke: { ...FB, score: T([3, 2, 0], [-1]), neutralLoss: 1 },        // against loses 1, and a Neutral Choir loses 1
  q_lone: { ...FB, score: T([3, 2, 0], [-1, 0]) },                     // only a lone Choir against loses 1
  q_heavyluke: { ...FB, score: T([3, 2, 0], [-1]), loseHeavy: 2, neutralLoss: 1 },
  q_p1: { ...FB, score: T([3, 1, 0], [0]) },                           // a pair gains 1 each
  q_p1_lose1: { ...FB, score: T([3, 1, 0], [-1]) },
  q_p1_heavy: { ...FB, score: T([3, 1, 0], [-1]), loseHeavy: 2 },
  q_nocrown: { ...FB, crown: 1 },
  q_softcrown: { ...FB, crown: 1, crownTax: 1 },                       // the sole leader gains 1 less at the Reaping
  q_noomen: { ...FB, omens: 0 },
} as Record<string, V>);

const LONE = T([3, 2, 0], [-1, 0]);
Object.assign(VARIANTS, {
  // ---- Round 17: stakes without herding, and a gentler Crown
  q_betloss: { ...FB, betLoss: 1 },
  q_lone_betloss: { ...FB, score: LONE, betLoss: 1 },
  q_soft_lone: { ...FB, score: LONE, crown: 1, crownTax: 1 },
  q_soft_lone_t13: { ...FB, score: LONE, crown: 1, crownTax: 1, target: 13, target3: 13, target4: 13 },
  q_soft_lone_t14: { ...FB, score: LONE, crown: 1, crownTax: 1, target: 14, target3: 14, target4: 14 },
  q_soft_lone_bl: { ...FB, score: LONE, crown: 1, crownTax: 1, betLoss: 1 },
  q_p1_soft_lone: { ...FB, score: T([3, 1, 0], [-1, 0]), crown: 1, crownTax: 1 },
  q_soft_lone_cu: { ...FB, score: LONE, crown: 1, crownTax: 1, order: 'catchup' },
} as Record<string, V>);

Object.assign(VARIANTS, {
  // ---- Round 18
  q_soft_bl: { ...FB, crown: 1, crownTax: 1, betLoss: 1 },
  q_soft_bl_t13: { ...FB, crown: 1, crownTax: 1, betLoss: 1, target: 13, target3: 13, target4: 13 },
  q_420_soft_bl: { ...FB, score: T([4, 2, 0], [0]), crown: 1, crownTax: 1, betLoss: 1, target: 13, target3: 13, target4: 13 },
  q_p1_nocrown_bl: { ...FB, score: T([3, 1, 0], [0]), crown: 1, betLoss: 1 },
  q_soft: { ...FB, crown: 1, crownTax: 1 },
} as Record<string, V>);

// ---- Round 19: Pantheons. Recommended rules: 3/2/0, wrong bets cost 1, soft Crown, the Omen, a tie keeps yesterday's Tide.
const REC: V = { ...FB, crown: 1, crownTax: 1, betLoss: 1, target: 13, target3: 13, target4: 13 };
const LIGHT_POOL = ['L1:treeOfLife', 'L1:uriel', 'L1:remnant2', 'L1:seraph', 'L1:martyr', 'L1:michael', 'L1:raphael', 'L1:store', 'L1:mercy2', 'L1:turncoat'];
const DARK_POOL = ['D1:leviathan', 'D1:defiance', 'D1:uriel', 'D1:favor2', 'D1:hubris', 'D1:seraph', 'D1:snare', 'D1:envy', 'D1:anathema', 'D1:winnowing', 'D1:raphael', 'D1:abaddon', 'D1:scapegoat', 'D1:store', 'D1:bounty2'];
const NEUTRAL_POOL = ['N:firmament', 'N:outcastOld', 'N:council', 'N:stillness2', 'N:apple', 'N:moderation2', 'N:prophecy', 'N:mirage', 'N:vessel', 'N:ordeal', 'N:acolyte'];
const PLAIN = { L1: 10, D1: 10, L2: 1, D2: 1, N: 4 };
Object.assign(VARIANTS, {
  rec: { ...REC },
  rec_pantheon: { ...REC, pantheon: { base: PLAIN, pools: [LIGHT_POOL, DARK_POOL, NEUTRAL_POOL], picks: [7, 7, 4] } },
  rec_pantheon_s: { ...REC, pantheon: { base: { L1: 13, D1: 13, L2: 1, D2: 1, N: 4 }, pools: [LIGHT_POOL, DARK_POOL, NEUTRAL_POOL], picks: [4, 4, 4] } },
  rec_all: { ...REC, pantheon: { base: { L2: 1, D2: 1 }, pools: [LIGHT_POOL, DARK_POOL, NEUTRAL_POOL], picks: [10, 15, 11] } },
} as Record<string, V>);

// ---- Round 20: race to 12 with Pantheons, and a fixed Starter Pantheon of mirrored pairs
const STARTER = {
  ...PLAIN,
  'L1:treeOfLife': 1, 'L1:store': 1, 'L1:raphael': 1, 'L1:seraph': 1, 'L1:uriel': 1, 'L1:mercy2': 1, 'L1:turncoat': 1,
  'D1:leviathan': 1, 'D1:store': 1, 'D1:raphael': 1, 'D1:seraph': 1, 'D1:uriel': 1, 'D1:defiance': 1, 'D1:scapegoat': 1,
  'N:firmament': 1, 'N:council': 1, 'N:prophecy': 1, 'N:vessel': 1,
};
const REC12: V = { ...REC, target: 12, target3: 12, target4: 12 };
Object.assign(VARIANTS, {
  rec12_pantheon: { ...REC12, pantheon: { base: PLAIN, pools: [LIGHT_POOL, DARK_POOL, NEUTRAL_POOL], picks: [7, 7, 4] } },
  rec12_starter: { ...REC12, deck: STARTER },
} as Record<string, V>);

// ---- Round 21: can the patches go, and can Choir strength link the engine to the alliances?
Object.assign(VARIANTS, {
  r21_starter: { ...REC12, deck: STARTER },
  r21_nocrown: { ...REC12, deck: STARTER, crownTax: 0 },
  r21_noomen: { ...REC12, deck: STARTER, omens: 0 },
  r21_bare: { ...REC12, deck: STARTER, crownTax: 0, omens: 0 },
  r21_bare_notie: { ...REC12, deck: STARTER, crownTax: 0, omens: 0, tieBreak: 'none' },
  r21_senior31: { ...REC12, deck: STARTER, pairSplit: [3, 1] },          // alone 3; pair: stronger 3, weaker 1, equal 2 each
  r21_senior31_bare: { ...REC12, deck: STARTER, pairSplit: [3, 1], crownTax: 0, omens: 0 },
  r21_senior21_bare: { ...REC12, deck: STARTER, score: T([3, 2, 0], [0]), pairSplit: [2, 1], crownTax: 0, omens: 0 },
} as Record<string, V>);

// ---- Round 22: the dominance core, from the ground up (plain deck; no Crown, no Omen, no crowding rule)
const PLAIN44 = { L1: 18, D1: 18, L2: 2, D2: 2, N: 4 };
const DOM = (margin: number, dom: number[], indiv: number[], extra: V = {}): V => ({
  n: 4, hand: 3, choirStart: 2, choirMax: 4, fruits: true, omens: 0, crown: 1, deck: PLAIN44,
  offerReward: 'none', tieBreak: 'none', pax: { margin, dom, indiv, tie: 'lowGlory' }, ...extra,
});
Object.assign(VARIANTS, {
  d_m2_31_2: DOM(2, [3, 1], [2]),
  d_m2_42_2: DOM(2, [4, 2], [2]),
  d_m2_42_21: DOM(2, [4, 2], [2, 1]),
  d_m3_42_2: DOM(3, [4, 2], [2]),
  d_m1_31_2: DOM(1, [3, 1], [2]),
  d_m2_321_1: DOM(2, [3, 2, 1], [1]),
  d_m2_31_1: DOM(2, [3, 1], [1]),
  d_m2_42_2_bet: DOM(2, [4, 2], [2], { offerReward: 'match' }),
} as Record<string, V>);

// ---- Round 23: Fates. Secret Fate from a bag of 3 Light + 3 Dark; Choir cards matching the Tide pay; Fate Days pay at the end.
const FATE = (perDay: number, choirPay: number, extra: V = {}): V => ({
  hand: 3, choirStart: 2, choirMax: 4, fruits: true, omens: 0, crown: 1, deck: PLAIN44, offerReward: 'none', tieBreak: 'none',
  target: 999, target3: 999, target4: 999, maxDays: 7, fate: { pool: [1, 1, 1, -1, -1, -1], perDay, choirPay }, ...extra,
});
Object.assign(VARIANTS, {
  f_2_1: FATE(2, 1),
  f_3_1: FATE(3, 1),
  f_1_1: FATE(1, 1),
  f_2_1_bet: FATE(2, 1, { offerReward: 'match' }),
  f_2_1_known: FATE(2, 1, { fate: { pool: [1, 1, -1, -1], perDay: 2, choirPay: 1 } }), // 4p: always 2 v 2 (team sizes known)
  f_2_1_d6: FATE(2, 1, { maxDays: 6 }),
  f_2_1_d8: FATE(2, 1, { maxDays: 8 }),
} as Record<string, V>);

// ---- Round 24: the collection plate. Offers matching the Tide share a pot of 2 + 1 per losing Offer; Choir cards matching the Tide pay 1.
const PLATE = (base: number, extra: V = {}): V => ({
  hand: 3, choirStart: 2, choirMax: 4, fruits: true, omens: 0, crown: 1, deck: PLAIN44, tieBreak: 'none',
  offerReward: 'pari', pariBase: base, choirCardPay: 1, ...extra,
});
Object.assign(VARIANTS, {
  c_plate2: PLATE(2),
  c_plate3: PLATE(3),
  c_plate1: PLATE(1),
  c_plate2_fate: PLATE(2, { target: 999, target3: 999, target4: 999, maxDays: 7, fate: { pool: [1, 1, 1, -1, -1, -1], perDay: 2, choirPay: 1 } }),
} as Record<string, V>);

// ---- Round 25: Fates, multiplied (no hedging: your Choir pays only on your Fate's Days)
Object.assign(VARIANTS, {
  fm_1: FATE(1, 0, { fate: { pool: [1, 1, 1, -1, -1, -1], perDay: 1, choirPay: 0, mult: true } }),
  fm_1_bet: FATE(1, 0, { fate: { pool: [1, 1, 1, -1, -1, -1], perDay: 1, choirPay: 0, mult: true }, offerReward: 'match' }),
  fm_1_known: FATE(1, 0, { fate: { pool: [1, 1, -1, -1], perDay: 1, choirPay: 0, mult: true } }),
  fm_1_c5: FATE(1, 0, { fate: { pool: [1, 1, 1, -1, -1, -1], perDay: 1, choirPay: 0, mult: true }, choirMax: 5 }),
} as Record<string, V>);

// ---- Round 22b: Dominance as fixed 7-Day games (same length as Fates), for a fair comparison
const D7: V = { target: 999, target3: 999, target4: 999, maxDays: 7 };
Object.assign(VARIANTS, {
  d7_m2_31_2: { ...DOM(2, [3, 1], [2]), ...D7 },
  d7_m2_42_2: { ...DOM(2, [4, 2], [2]), ...D7 },
  d7_m3_42_2: { ...DOM(3, [4, 2], [2]), ...D7 },
  d7_m1_31_2: { ...DOM(1, [3, 1], [2]), ...D7 },
  d7_m2_42_2_bet: { ...DOM(2, [4, 2], [2], { offerReward: 'match' }), ...D7 },
} as Record<string, V>);

// ---- Round 26: multiplied Fates with the Forsaken (wins narrow Days, multiplied by Neutral Choir cards)
const N8 = { L1: 16, D1: 16, L2: 2, D2: 2, N: 8 };
const MF = (pool: number[], extra: V = {}): V => FATE(1, 0, { fate: { pool, perDay: 1, choirPay: 0, mult: true }, ...extra });
Object.assign(VARIANTS, {
  fm_n8: MF([1, 1, 1, -1, -1, -1], { deck: N8 }),
  fmF_n8: MF([1, 1, 1, -1, -1, -1, 0], { deck: N8 }),
  fmF2_n8: MF([1, 1, -1, -1, 0, 0], { deck: N8 }),
  fmF_n4: MF([1, 1, 1, -1, -1, -1, 0]),
} as Record<string, V>);

// ---- Round 27: the Miser's Rule (the player who Offered fewest cannot win), on multiplied Fates
Object.assign(VARIANTS, {
  fm_miser: MF([1, 1, 1, -1, -1, -1], { miser: true }),
  fmF_n8_miser: MF([1, 1, 1, -1, -1, -1, 0], { deck: N8, miser: true }),
} as Record<string, V>);

// ---- Round 28: Oaths that pass through the Altar (allegiance is an Oath card: +2 when Offered, can be Gathered, returns home if not)
const OATH_DECK = { L1: 18, D1: 18, L2: 2, D2: 2, N: 4, 'L2:oath': 3, 'D2:oath': 3 };
const OATH = (extra: V = {}): V => FATE(1, 0, { deck: OATH_DECK, fate: { pool: [], perDay: 1, choirPay: 0, mult: true, oath: true }, ...extra });
Object.assign(VARIANTS, {
  oath: OATH(),
  oath_miser: OATH({ miser: true }),
  oath_n8: OATH({ deck: { ...OATH_DECK, L1: 16, D1: 16, N: 8 } }),
} as Record<string, V>);
