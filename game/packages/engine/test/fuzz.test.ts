import { describe, expect, it } from 'vitest';
import { DAYS, TOKENS_EACH, Game, daysWon, playBotGame, viewFor } from '../src';

const names = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fin'];
const cfg = (seed: number, n: number) => ({ seed, mode: 'open' as const, players: names.slice(0, n).map((name) => ({ name, isBot: true })) });

describe('bot games run to completion', () => {
  for (const [n, advanced] of [[3, false], [4, false], [3, true], [4, true]] as const) {
    it(`${n} players x 150 seeds, ${advanced ? 'Advanced' : 'Base'}`, () => {
      for (let seed = 1; seed <= 150; seed++) {
        const g = playBotGame({ ...cfg(seed * 31 + n, n), advanced });
        expect(g.state.result).not.toBeNull();
        expect(g.state.tides).toHaveLength(g.state.day);
        for (const p of g.state.players) {
          expect(p.glory).toBeGreaterThanOrEqual(0);
          expect(p.choir.length).toBeLessThanOrEqual(4);
          if (!advanced) expect(p.celestial).toBe('');
        }
        // card conservation: every Host card is in exactly one zone
        const s = g.state;
        const zones = [...s.hostDeck, ...s.discard, ...s.altar.map((a) => a.id), ...s.players.flatMap((p) => [...p.hand, ...p.choir.map((c) => c.id)])];
        expect(new Set(zones).size).toBe(zones.length);
        expect(zones.length).toBe(69);
        // V45: a fixed number of Days; every token is still held by someone; each scores the Days its color won.
        expect(s.day).toBe(DAYS);
        expect(s.log.some((l) => l.kind === 'judgment')).toBe(true);
        expect(s.players.reduce((t, p) => t + p.tokens.length, 0) + s.altarTokens.length).toBe(TOKENS_EACH * n);
        const won = daysWon(s);
        for (const x of s.result!.standings) {
          expect(x.fromTokens).toBe(x.tokens.light * won.light + x.tokens.dark * won.dark);
          expect(x.glory).toBe(x.before + x.fromTokens);
        }
        const best = Math.max(...s.players.map((p) => p.glory));
        expect(s.result!.winners.every((w) => s.players[w].glory === best)).toBe(true);
        if (!advanced) expect(s.log.some((l) => l.kind === 'event')).toBe(false);
      }
    });
  }
});

describe('strong bots (Monte Carlo)', () => {
  it('play legal, complete games, and are deterministic', () => {
    for (const seed of [3, 4]) {
      const a = playBotGame({ ...cfg(seed, 3), advanced: true }, 20000, [0]);
      const b = playBotGame({ ...cfg(seed, 3), advanced: true }, 20000, [0]);
      expect(a.state.result).not.toBeNull();
      expect(b.state.result).toEqual(a.state.result);
    }
  });
});

describe('replay is deterministic', () => {
  it('replaying inputs reproduces the game exactly', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const g = playBotGame(cfg(seed, 4));
      const r = Game.replay(g.config, g.inputs);
      expect(r.state.players.map((p) => p.glory)).toEqual(g.state.players.map((p) => p.glory));
      expect(r.state.result).toEqual(g.state.result);
      expect(viewFor(r.state, 0).log.length).toBe(viewFor(g.state, 0).log.length);
    }
  });
});
