// The Game object: owns the state, the running game loop, and the input log.
import { eventOn, log, stat } from './core';
import { E } from './data';
import { createState, DAYS, gloryTarget, runGame } from './engine';
import type { Answer, Decision, GameConfig, GameState, Gen, Seat } from './types';

export type Input =
  | { t: 'answer'; id: number; seat: Seat; choice: Answer }
  | { t: 'gift'; from: Seat; to: Seat; amount: number };

export class RuleError extends Error {}

export class Game {
  readonly state: GameState;
  readonly inputs: Input[] = [];
  pending: Decision[] = [];
  private answers = new Map<number, Answer>();
  private gen: Gen<void>;

  constructor(readonly config: GameConfig, opts: { setup?: (s: GameState) => void } = {}) {
    this.state = createState(config);
    opts.setup?.(this.state);
    this.gen = runGame(this.state);
    this.advance([]);
  }

  static replay(config: GameConfig, inputs: Input[]): Game {
    const g = new Game(config);
    for (const i of inputs) g.apply(i);
    return g;
  }

  get over() {
    return this.state.phase === 'ended';
  }

  /** Decisions currently waiting on this seat. */
  waitingOn(seat: Seat): Decision[] {
    return this.pending.filter((d) => d.seat === seat && !this.answers.has(d.id));
  }

  apply(i: Input) {
    if (i.t === 'answer') this.answer(i.seat, i.id, i.choice);
    else this.gift(i.from, i.to, i.amount);
  }

  answer(seat: Seat, id: number, choice: Answer) {
    const d = this.pending.find((x) => x.id === id);
    if (!d) throw new RuleError('That decision is not open.');
    if (d.seat !== seat) throw new RuleError('That decision belongs to another player.');
    if (this.answers.has(id)) throw new RuleError('Already answered.');
    const valid = new Set(d.options.map((o) => o.id));
    if (new Set(choice).size !== choice.length || choice.some((c) => !valid.has(c))) throw new RuleError('Invalid choice.');
    if (choice.length < d.min || choice.length > d.max) throw new RuleError(`Choose between ${d.min} and ${d.max} options.`);
    this.inputs.push({ t: 'answer', id, seat, choice: [...choice] });
    this.answers.set(id, [...choice]);
    if (this.pending.every((x) => this.answers.has(x.id))) {
      this.advance(this.pending.map((x) => this.answers.get(x.id)!));
    }
  }

  /** Give Glory to another player (deals). Not allowed on Babel or on the final Day. */
  canGift(from: Seat, to: Seat, amount: number): string | null {
    const s = this.state;
    if (s.phase === 'ended' || s.day === 0) return 'The game is not in progress.';
    if (from === to) return 'Choose another player.';
    if (!Number.isInteger(amount) || amount < 1) return 'Give at least 1 Glory.';
    if (s.players[from].glory < amount) return 'Not enough Glory.';
    if (eventOn(s, E.babel)) return 'Babel: no Glory transfers this Day.';
    if (!gloryTarget(s) && s.day === DAYS) return 'No Glory may be given on the final Day.';
    return null;
  }

  gift(from: Seat, to: Seat, amount: number) {
    const err = this.canGift(from, to, amount);
    if (err) throw new RuleError(err);
    const s = this.state;
    s.players[from].glory -= amount;
    s.players[to].glory += amount;
    stat(s, { type: 'glory', seat: from, amount: -amount, source: 'gift' });
    stat(s, { type: 'glory', seat: to, amount, source: 'gift' });
    log(s, 'gift', `${s.players[from].name} gave ${amount} Glory to ${s.players[to].name}.`);
    this.inputs.push({ t: 'gift', from, to, amount });
  }

  private advance(ans: Answer[]) {
    const r = this.gen.next(ans);
    this.answers.clear();
    this.pending = r.done ? [] : r.value;
  }
}
