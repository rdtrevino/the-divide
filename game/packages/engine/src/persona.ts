// Human-like computer players (design/bots.md, layer 3), on top of the learned bot (learned.ts): one fast network,
// different players. A persona plays the learned bot's scores with two changes:
// - Sharpness: it picks among the options with probabilities softmax(score / temperature), so a loose player makes
//   close-call mistakes, not blunders. Temperature 0 is the learned bot itself.
// - Style: small bonuses for kinds of move (in the network's score units, about half a Glory each).
// Its randomness is seeded by the game and the decision, so a game still replays exactly.
import { botAnswer } from './bots';
import { describeOptions, learnedScores, tokenLean, hasLearnedWeights } from './learned';
import { isSearched } from './mc';
import type { Answer, Decision, GameState } from './types';

export interface Persona {
  name: string;
  /** 0: always the best-scored option; higher: looser play. */
  temperature: number;
  /** Bonus for pushing the Altar toward your own token majority (Offers toward it, Gathers away from the other). */
  loyal?: number;
  /** Bonus for building your Choir (Exalt, Gather a card). */
  build?: number;
  /** Bonus (or, negative, a cost) for Offering a token, on top of the learned bot's own (learned.ts, TOKEN_OFFER_COST). */
  tokens?: number;
  /** Bluffing: a cost for putting a card in your Choir that tells the table your side (by the reader, READ below). */
  conceal?: number;
}

/**
 * The reader (tools/sim/reader.ts) at a table of Expert bots: how much one more Light or Dark card in a player's Choir
 * moves the table's read of their side toward Light (log-odds). Strong players hedge (tokens of one color, a Choir of
 * the other), so a Light card in the Choir reads as Dark tokens: the reader names Experts' sides 83% of the time.
 */
export const READ = { light: -1.6, dark: 1.18 };

/** Sharpness levels, calibrated against heuristic bots (design/bots.md). */
export const LEVELS: Record<string, Persona> = {
  novice: { name: 'Novice', temperature: 2 },
  casual: { name: 'Casual', temperature: 1 },
  skilled: { name: 'Skilled', temperature: 0.5 },
  expert: { name: 'Expert', temperature: 0 },
};

/** Playing styles at Expert sharpness: different players, each still sound. */
export const STYLES: Record<string, Persona> = {
  loyalist: { name: 'Loyalist', temperature: 0, loyal: 1.5 },
  builder: { name: 'Builder', temperature: 0, build: 1.5 },
  hoarder: { name: 'Hoarder', temperature: 0, tokens: -2 },
  gambler: { name: 'Gambler', temperature: 0, tokens: 2 },
  bluffer: { name: 'Bluffer', temperature: 0, conceal: 1 },
};

function rand(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** A persona's answer: the learned bot's scores, styled and sampled. Minor decisions go to the heuristic. */
export function personaAnswer(s: GameState, d: Decision, p: Persona): Answer {
  const quick = botAnswer(s, d);
  if (!isSearched(d) || !hasLearnedWeights()) return quick;
  const sc = learnedScores(s, d, quick[0]);
  if (p.loyal || p.build || p.tokens || p.conceal) {
    const lean = tokenLean(s, d.seat);
    describeOptions(s, d).forEach((m, i) => {
      if (p.loyal) sc[i] += p.loyal * Math.sign(m.push) * lean;
      if (p.build && /^(exaltCard|gatherCard|gatherHidden|actExalt|actGather)$/.test(m.kind)) sc[i] += p.build;
      if (p.tokens && m.kind === 'offerToken') sc[i] += p.tokens;
      // A card entering the Choir shifts the table's read by READ; a bluffer avoids shifts toward its true side.
      if (p.conceal && lean && /^(exaltCard|gatherCard|gatherDiscard)$/.test(m.kind) && m.color) sc[i] -= p.conceal * lean * (m.color > 0 ? READ.light : READ.dark);
    });
  }
  let b = 0;
  if (p.temperature <= 0) { for (let i = 1; i < sc.length; i++) if (sc[i] > sc[b]) b = i; return [d.options[b].id]; }
  const mx = Math.max(...sc), w = sc.map((x) => Math.exp((x - mx) / p.temperature)), tot = w.reduce((a, c) => a + c, 0);
  let r = rand((s.config.seed | 0) * 31 + d.id * 7919 + d.seat * 104729) * tot;
  for (b = 0; b < w.length - 1; b++) { r -= w[b]; if (r <= 0) break; }
  return [d.options[b].id];
}
