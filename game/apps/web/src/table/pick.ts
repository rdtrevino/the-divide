// Which things on the table answer the decision in front of you. The prompt bar always lists
// every option; this lets you also click the card, Altar slot, deck or player itself.
import type { Decision } from '@divide/engine';
import { createContext } from 'preact';

export interface Pick {
  decision: Decision | null;
  /** Card id -> option id, for cards that stand for exactly one option. */
  card: Map<string, string>;
  /** Altar position -> option id (facedown cards can only be chosen by position). */
  altar: Map<number, string>;
  deck: string | null;
  seat: Map<number, string>;
  selected: Set<string>;
  choose(option: string, confirm?: boolean): void;
}

export const noPick: Pick = { decision: null, card: new Map(), altar: new Map(), deck: null, seat: new Map(), selected: new Set(), choose: () => {} };
export const PickCtx = createContext<Pick>(noPick);

export function mapOptions(d: Decision | null): Omit<Pick, 'selected' | 'choose'> {
  const card = new Map<string, string>();
  const altar = new Map<number, string>();
  const seat = new Map<number, string>();
  let deck: string | null = null;
  if (d) {
    const count = new Map<string, number>();
    for (const o of d.options) if (o.card) count.set(o.card, (count.get(o.card) ?? 0) + 1);
    for (const o of d.options) {
      if (o.card && count.get(o.card) === 1) card.set(o.card, o.id);
      const a = /^altar:(\d+)$/.exec(o.id);
      if (a) altar.set(Number(a[1]), o.id);
      if (o.id === 'deck') deck = o.id;
      if (o.seat !== undefined) seat.set(o.seat, o.id);
      const f = /^favor:(\d+)$/.exec(o.id);
      if (f) seat.set(Number(f[1]), o.id);
    }
  }
  return { decision: d, card, altar, deck, seat };
}

/** Options answered with one click. Everything shown as a card asks for a confirming click. */
export const isButton = (d: Decision, id: string): boolean => {
  const o = d.options.find((x) => x.id === id);
  return !!o && !o.card && !/^altar:\d+$/.test(o.id) && o.id !== 'deck';
};
