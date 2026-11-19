// The learned bot (learned.ts) must see only what its seat may see, and must always answer legally.
import { describe, expect, it } from 'vitest';
import { botAnswer } from '../src/bots';
import { Game } from '../src/game';
import { DECISION_FEATURES, OPTION_FEATURES, encode, learnedAnswer } from '../src/learned';
import { isSearched } from '../src/mc';
import type { GameState } from '../src/types';

declare function structuredClone<T>(value: T): T;

/** Re-deal everything `seat` cannot see: other hands, the deck and facedown Altar cards, and the colors of other players' tokens. */
function redeal(s: GameState, seat: number): GameState {
  const c: GameState = structuredClone(s);
  const others = c.players.filter((p) => p.seat !== seat);
  const hidden = c.altar.filter((a) => a.facedown && a.offeredBy !== seat && !a.seenBy?.includes(seat));
  const pool = [...c.hostDeck, ...others.flatMap((p) => p.hand), ...hidden.map((a) => a.id)].reverse();
  let k = 0;
  for (const p of others) p.hand = p.hand.map(() => pool[k++]);
  for (const a of hidden) a.id = pool[k++];
  c.hostDeck = pool.slice(k);
  const toks = others.flatMap((p) => p.tokens).map((t) => (t === 'light' ? 'dark' : 'light'));
  let j = 0;
  for (const p of others) p.tokens = p.tokens.map(() => toks[j++]);
  return c;
}

describe('learned bot', () => {
  it('reads only what its seat can see, and its inputs have the declared sizes', () => {
    let checked = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const g = new Game({ seed, mode: 'open', advanced: seed % 2 === 0, players: [0, 1, 2, 3].map((k) => ({ name: 'P' + k, isBot: true })) });
      while (!g.over) for (const d of [...g.pending]) {
        if (!g.pending.includes(d)) continue;
        if (isSearched(d)) {
          const pick = botAnswer(g.state, d)[0];
          const a = encode(g.state, d, pick), b = encode(redeal(g.state, d.seat), d, pick);
          expect(b).toEqual(a);
          expect(a.decision).toHaveLength(DECISION_FEATURES);
          for (const o of a.options) expect(o).toHaveLength(OPTION_FEATURES);
          checked++;
        }
        g.answer(d.seat, d.id, botAnswer(g.state, d));
      }
    }
    expect(checked).toBeGreaterThan(200);
  });

  it('plays whole games with legal answers', () => {
    for (let seed = 1; seed <= 4; seed++) {
      const g = new Game({ seed, mode: 'open', advanced: seed > 2, players: [0, 1, 2].map((k) => ({ name: 'P' + k, isBot: true })) });
      while (!g.over) for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, learnedAnswer(g.state, d));
      expect(g.state.result).toBeTruthy();
    }
  });
});
