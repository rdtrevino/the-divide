// Core rule switches under test (rules.ts) must play whole games legally, and the defaults must be the current rules.
import { describe, expect, it } from 'vitest';
import { botAnswer } from '../src/bots';
import { Game } from '../src/game';
import { choirColors } from '../src/core';
import { DEFAULT_RULES, type CoreRules } from '../src/rules';

const VARIANTS: Partial<CoreRules>[] = [{ devotion: 1 }, { tokensEach: 8 }, { devotion: 1, tokensEach: 8 }];

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
});
