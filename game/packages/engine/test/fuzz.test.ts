import { describe, expect, it } from 'vitest';
import { GLORY_TARGET, Game, playBotGame, viewFor } from '../src';

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
        // The game ends at the first Reaping where someone reaches the Glory target, and the winner has the most Glory.
        const best = Math.max(...s.players.map((p) => p.glory));
        if (s.day < 60) expect(best).toBeGreaterThanOrEqual(GLORY_TARGET); // 60 Days is the engine's safety stop
        expect(s.result!.winners.every((w) => s.players[w].glory === best)).toBe(true);
        if (!advanced) expect(s.log.some((l) => l.kind === 'event')).toBe(false);
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
