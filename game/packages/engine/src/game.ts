// The Game object: owns the state, the running game loop, and the input log.
import { createState, runGame } from './engine';
import type { Answer, Decision, GameConfig, GameState, Gen, Seat } from './types';

export type Input = { t: 'answer'; id: number; seat: Seat; choice: Answer };

export class RuleError extends Error {}

export class Game {
  readonly state: GameState;
  readonly inputs: Input[] = [];
  pending: Decision[] = [];
  private answers = new Map<number, Answer>();
  private gen: Gen<void>;

  /** `setup` changes the dealt state before play (tests, simulations); replays repeat it. */
  constructor(readonly config: GameConfig, readonly opts: { setup?: (s: GameState) => void } = {}) {
    this.state = createState(config);
    opts.setup?.(this.state);
    this.gen = runGame(this.state);
    this.advance([]);
  }

  static replay(config: GameConfig, inputs: Input[], opts: Game['opts'] = {}): Game {
    const g = new Game(config, opts);
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
    // Games recorded before Glory gifts were removed may hold other inputs; they no longer replay.
    if (i.t !== 'answer') throw new RuleError('This game was recorded under earlier rules.');
    this.answer(i.seat, i.id, i.choice);
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

  private advance(ans: Answer[]) {
    const r = this.gen.next(ans);
    this.answers.clear();
    this.pending = r.done ? [] : r.value;
  }
}
