import { botAnswer } from '../src/bots';
import { createState } from '../src/engine';
import type { Answer, Decision, GameState, Gen } from '../src/types';

export const names = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fin'];

/** A blank state: empty hands, Choirs, and Altar, with chosen Celestials. */
export function blank(n = 3, celestials: string[] = []): GameState {
  const s = createState({ seed: 7, mode: 'open', players: names.slice(0, n).map((name, i) => ({ name, isBot: true, celestial: celestials[i] ?? ['celestial-the-tempest', 'celestial-the-oracle', 'celestial-the-cantor', 'celestial-the-patron', 'celestial-the-echo', 'celestial-the-dominion'][i] })) });
  for (const p of s.players) { s.hostDeck.push(...p.hand, ...p.choir.map((c) => c.id)); p.hand = []; p.choir = []; }
  s.day = 1;
  s.firstPlayer = 0;
  return s;
}

export function choir(s: GameState, seat: number, ...ids: string[]) {
  for (const id of ids) {
    s.hostDeck = s.hostDeck.filter((x) => x !== id);
    s.players[seat].choir.push({ id, facedown: false, used: false });
  }
}
export function hand(s: GameState, seat: number, ...ids: string[]) {
  for (const id of ids) { s.hostDeck = s.hostDeck.filter((x) => x !== id); s.players[seat].hand.push(id); }
}
export function altar(s: GameState, ...ids: string[]) {
  for (const id of ids) { s.hostDeck = s.hostDeck.filter((x) => x !== id); s.altar.push({ id, facedown: false, offeredBy: null, day: s.day }); }
}

export type Script = Record<string, Answer | ((d: Decision) => Answer)>;

/** Run a generator to completion, answering by tag from the script, else declining, else bot. */
export function drive<T>(s: GameState, gen: Gen<T>, script: Script = {}): { result: T; asked: Decision[] } {
  const asked: Decision[] = [];
  let r = gen.next([]);
  let guard = 0;
  while (!r.done) {
    const answers = r.value.map((d) => {
      asked.push(d);
      const sc = script[d.tag] ?? script[`${d.tag}@${d.seat}`];
      if (sc) return typeof sc === 'function' ? sc(d) : sc;
      if (d.options.some((o) => o.id === 'none')) return ['none'];
      if (d.options.some((o) => o.id === 'no')) return ['no'];
      if (d.options.some((o) => o.id === 'end')) return ['end'];
      return botAnswer(s, d);
    });
    r = gen.next(answers);
    if (++guard > 500) throw new Error('drive: too many decisions');
  }
  return { result: r.value, asked };
}
