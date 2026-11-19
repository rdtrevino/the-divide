// The Game object: owns the state, the running game loop, and the input log.
import { createState, runGame } from './engine';
import type { Answer, Decision, GameConfig, GameState, Gen, Seat } from './types';

export type Input = { t: 'answer'; id: number; seat: Seat; choice: Answer };

export class RuleError extends Error {}

// Available in every runtime the engine runs in (browsers, Workers, Node 17+); the ES2022 lib does not declare it.
declare function structuredClone<T>(value: T): T;

/**
 * A deep copy of the state, except that the log and stats (nine tenths of a late-game state) share their entries:
 * entries are never changed once written, so only the arrays need copying.
 */
function copyState(s: GameState): GameState {
  const c: GameState = structuredClone({ ...s, log: [], stats: [] });
  c.log = s.log.slice();
  c.stats = s.stats.slice();
  return c;
}

type Checkpoint = { day: number; state: GameState; at: number };

export class Game {
  readonly state: GameState;
  readonly inputs: Input[] = [];
  pending: Decision[] = [];
  private answers = new Map<number, Answer>();
  private gen: Gen<void>;

  /** The state at the start of the current Day, and how many inputs had been given by then (see `fork`). */
  private checkpoint: Checkpoint | null = null;

  /**
   * `setup` changes the dealt state before play (tests, simulations); replays repeat it.
   * `resume` (used by `fork`) starts from a saved Day-start state instead of a fresh deal.
   */
  constructor(readonly config: GameConfig, readonly opts: { setup?: (s: GameState) => void } = {}, resume?: Checkpoint & { inputs: Input[] }) {
    this.state = resume ? copyState(resume.state) : createState(config);
    if (resume) this.inputs.push(...resume.inputs);
    else opts.setup?.(this.state);
    // Forks are short-lived and never forked again, so they skip the checkpoint copies.
    const save = resume ? undefined : (s: GameState, day: number) => { this.checkpoint = { day, state: copyState(s), at: this.inputs.length }; };
    this.gen = runGame(this.state, resume?.day, save);
    this.advance([]);
  }

  static replay(config: GameConfig, inputs: Input[], opts: Game['opts'] = {}): Game {
    const g = new Game(config, opts);
    for (const i of inputs) g.apply(i);
    return g;
  }

  /**
   * An independent copy of this game at this moment, identical to `Game.replay(config, inputs, opts)` but much
   * cheaper: it starts from the state saved at the start of the current Day and replays only today's inputs.
   */
  fork(): Game {
    const cp = this.checkpoint;
    if (!cp) return Game.replay(this.config, this.inputs, this.opts);
    const g = new Game(this.config, this.opts, { ...cp, inputs: this.inputs.slice(0, cp.at) });
    for (let k = cp.at; k < this.inputs.length; k++) g.apply(this.inputs[k]);
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
