// Game.fork must be indistinguishable from replaying every input since the deal: same state, same open decisions,
// and the same future when both are played on. The strong bot's search relies on it.
import { describe, expect, it } from 'vitest';
import { botAnswer } from '../src/bots';
import { Game } from '../src/game';

const same = (a: Game, b: Game) => {
  expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
  expect(JSON.stringify(a.pending)).toBe(JSON.stringify(b.pending));
};

describe('Game.fork', () => {
  for (const [n, advanced] of [[3, false], [4, false], [4, true]] as const) {
    it(`matches a full replay at every decision (${n} players${advanced ? ', advanced' : ''})`, () => {
      for (let seed = 1; seed <= 4; seed++) {
        const g = new Game({ seed: 300 + seed, mode: 'open', advanced, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
        let step = 0;
        while (!g.over) {
          const d = g.pending.find((x) => g.waitingOn(x.seat).includes(x))!;
          if (step++ % 3 === 0) {
            const f = g.fork(), r = Game.replay(g.config, g.inputs, g.opts);
            same(f, r);
            // Playing both forward the same way keeps them identical, and leaves the original untouched.
            const before = JSON.stringify(g.state);
            for (let k = 0; k < 6 && !f.over; k++) {
              const e = f.pending.find((x) => f.waitingOn(x.seat).includes(x))!;
              const a = botAnswer(f.state, e);
              f.answer(e.seat, e.id, a); r.answer(e.seat, e.id, a);
            }
            same(f, r);
            expect(JSON.stringify(g.state)).toBe(before);
          }
          g.answer(d.seat, d.id, botAnswer(g.state, d));
        }
      }
    });
  }
});
