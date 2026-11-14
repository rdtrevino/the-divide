import { describe, expect, it } from 'vitest';
import { playBotGame, Game, viewFor } from '../src';

const names = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fin'];
const cfg = (seed: number, n: number) => ({ seed, mode: 'open' as const, players: names.slice(0, n).map((name) => ({ name, isBot: true })) });

describe('bot games run to completion', () => {
  for (const n of [3, 4, 5, 6]) {
    it(`${n} players x 150 seeds`, () => {
      for (let seed = 1; seed <= 150; seed++) {
        const g = playBotGame(cfg(seed * 31 + n, n));
        expect(g.state.result).not.toBeNull();
        expect(g.state.tides).toHaveLength(6);
        for (const p of g.state.players) {
          expect(p.glory).toBeGreaterThanOrEqual(0);
          expect(p.choir.length).toBeLessThanOrEqual(3);
        }
        // card conservation: every Host card is in exactly one zone
        const s = g.state;
        const zones = [...s.hostDeck, ...s.discard, ...s.altar.map((a) => a.id), ...s.players.flatMap((p) => [...p.hand, ...p.choir.map((c) => c.id)])];
        if (s.carriedSeed) zones.push(s.carriedSeed);
        zones.push(...s.row);
        expect(new Set(zones).size).toBe(zones.length);
        expect(zones.length).toBe(63);
      }
    });
  }
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

describe('experimental rules run cleanly', () => {
  const sets = [['two-rounds'], ['secret-offering'], ['face-up-row'], ['draw2keep1'], ['offer-choice'], ['celestial-draft'],
    ['two-rounds', 'face-up-row', 'draw2keep1', 'offer-choice', 'secret-offering', 'celestial-draft']];
  for (const variants of sets) {
    it(variants.join('+'), () => {
      for (let seed = 1; seed <= 60; seed++) {
        const n = 3 + (seed % 4);
        const g = playBotGame({ ...cfg(seed * 13 + n, n), variants });
        const s = g.state;
        const zones = [...s.hostDeck, ...s.discard, ...s.altar.map((a) => a.id), ...s.row, ...s.players.flatMap((p) => [...p.hand, ...p.choir.map((c) => c.id)])];
        if (s.carriedSeed) zones.push(s.carriedSeed);
        expect(new Set(zones).size).toBe(zones.length);
        expect(zones.length).toBe(63);
        expect(s.result).not.toBeNull();
        const r = Game.replay(g.config, g.inputs);
        expect(r.state.result).toEqual(s.result);
      }
    });
  }
});
