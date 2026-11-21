// Core rule switches under test (rules.ts) must play whole games legally, and the defaults must be the current rules.
import { describe, expect, it } from 'vitest';
import { botAnswer } from '../src/bots';
import { Game } from '../src/game';
import { choirColors } from '../src/core';
import { DEFAULT_RULES, type CoreRules } from '../src/rules';
import { tokenScore } from '../src/engine';

const VARIANTS: Partial<CoreRules>[] = [
  { devotion: 1 }, { tokensEach: 8 }, { devotion: 1, tokensEach: 8 }, { harvest: 'always' }, { harvest: 'half' },
  { harvest: 'always', miser: 3 }, { harvest: 'always', generous: 3 }, { handSize: 2 }, { handSize: 4 }, { choirLimit: 3 }, { choirLimit: 6 },
  { choirPay: 1 }, { harvest: 'always', spoils: 'claim', handMax: 5 }, { spoils: 'offerers', handMax: 5, choirPay: 0 },
  { gatherTo: 'hand', handMax: 5, upkeepDraw: 1 }, { decay: true }, { harvest: 'always', carryover: true }, { spoils: 'claim', handMax: 5, carryover: true }, { harvest: 'always', spoils: 'offerers', handMax: 5, decay: true, upkeepDraw: 1 }, { spoils: 'claim', gatherTo: 'hand', upkeepDraw: 1, handMax: 5, decay: true },
  // Robert's flow (November 20): Offers only from the Choir (face up), facedown First Fruits that may be a token, majority end score.
  { harvest: 'always', spoils: 'offerers', handMax: 5, offerFrom: 'choir', fruits: 'down', fruitsToken: true }, { offerFrom: 'choir', gatherTo: 'hand', endScore: 'majority' },
  { harvest: 'always', spoils: 'offerers', handMax: 5, offerFrom: 'choir', fruitsToken: true, endScore: 'majority' }, { endScore: 'majority', fruitsToken: true },
  // The rMajGH core without turnover; everyone draws after First Fruits; Offers from the hand; the Offer reward (open).
  { gatherTo: 'hand', decay: false }, { fruitsDraw: 'all' }, { offerFrom: 'hand' }, { offerGlory: 1, choirOfferGlory: 1 },
];

describe('core rule switches', () => {
  it('play whole games with legal answers', () => {
    for (const [k, rules] of VARIANTS.entries()) for (const n of [3, 4]) {
      const g = new Game({ seed: 50 + k, mode: 'open', rules, players: Array.from({ length: n }, (_, j) => ({ name: 'P' + j, isBot: true })) });
      while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
      expect(g.state.result!.winners.length).toBeGreaterThan(0);
      expect(g.state.tides.length).toBe(7);
    }
  });

  it('defaults are the current rules: an explicit default config plays the same game', () => {
    const play = (rules?: Partial<CoreRules>) => {
      const g = new Game({ seed: 9, mode: 'open', rules, players: [0, 1, 2, 3].map((j) => ({ name: 'P' + j, isBot: true })) });
      while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
      return JSON.stringify([g.inputs, g.state.players.map((p) => p.glory)]);
    };
    expect(play({ ...DEFAULT_RULES })).toBe(play());
  });

  it("Devotion scores 1 for each Choir card of the player's token side, at the end", () => {
    for (const seed of [11, 12, 13]) {
      const g = new Game({ seed, mode: 'open', rules: { devotion: 1 }, players: [0, 1, 2].map((j) => ({ name: 'P' + j, isBot: true })) });
      while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
      for (const p of g.state.players) {
        const st = g.state.result!.standings.find((x) => x.seat === p.seat)!;
        const side = st.tokens.light > st.tokens.dark ? 'light' : st.tokens.dark > st.tokens.light ? 'dark' : null;
        const n = side ? choirColors(g.state, p.seat)[side] : 0;
        expect(p.glory - st.before - st.fromTokens).toBe(n);
      }
    }
  });

  it('the Miser and the Generous score the fewest and the most Offers at the end (nobody if all tied)', () => {
    for (const seed of [21, 22, 23, 24]) {
      const g = new Game({ seed, mode: 'open', rules: { harvest: 'always', miser: 3, generous: 2 }, players: [0, 1, 2, 3].map((j) => ({ name: 'P' + j, isBot: true })) });
      while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
      const s = g.state, offers = s.players.map((p) => s.stats.filter((e) => e.seat === p.seat && e.type === 'action' && e.source === 'offer').length);
      const lo = Math.min(...offers), hi = Math.max(...offers);
      for (const p of s.players) {
        const st = s.result!.standings.find((x) => x.seat === p.seat)!;
        const devotionless = st.before + st.fromTokens;
        const want = lo === hi ? 0 : (offers[p.seat] === lo ? -3 : 0) + (offers[p.seat] === hi ? 2 : 0);
        expect(Math.max(0, devotionless + want) === p.glory || devotionless + want === p.glory).toBe(true);
        expect(st.glory).toBe(p.glory);
      }
    }
  });

  it('spoils hand out the Altar after won Days, and hands stay within their limit', () => {
    let spoils = 0;
    for (const seed of [31, 32, 33]) {
      const g = new Game({ seed, mode: 'open', rules: { harvest: 'always', spoils: 'claim', handMax: 5 }, players: [0, 1, 2, 3].map((j) => ({ name: 'P' + j, isBot: true })) });
      while (!g.over) {
        for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
        // The limit applies at the end of a Day: when the next Morning's First Fruits are chosen, no hand holds more than 5.
        if (g.pending.some((d) => d.tag === 'firstFruits')) for (const p of g.state.players) expect(p.hand.length).toBeLessThanOrEqual(5);
      }
      spoils += g.state.stats.filter((e) => e.source === 'spoils').length;
    }
    expect(spoils).toBeGreaterThan(10);
  });

  it("Robert's flow: Offers come only from the Choir; First Fruits go facedown", () => {
    let n = 0;
    for (const seed of [31, 32, 33, 34, 35, 36, 37, 38]) {
      const g = new Game({ seed, mode: 'open', rules: { harvest: 'always', spoils: 'offerers', handMax: 5, offerFrom: 'choir', fruits: 'down', fruitsToken: true }, players: [0, 1, 2, 3].map((j) => ({ name: 'P' + j, isBot: true })) });
      while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
      expect(g.state.log.filter((e) => e.text.startsWith('Every player placed First Fruits facedown')).length).toBe(7);
      const offers = g.state.stats.filter((e) => e.type === 'action' && e.source === 'offer' && e.data?.cards);
      n += offers.length;
      for (const e of offers) expect(e.data?.choir).toBe(true);
    }
    expect(n).toBeGreaterThan(0);
  });

  it('end-score variants', () => {
    expect(tokenScore('each', 4, 2, 3, 2)).toBe(16);
    expect(tokenScore('majority', 4, 2, 3, 2)).toBe(12);
    expect(tokenScore('majority', 3, 3, 1, 4)).toBe(12);
  });
});
