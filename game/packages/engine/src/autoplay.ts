// Run a game where bots answer every decision (used by the simulator, tests, and server bots).
import { botAnswer } from './bots';
import { Game } from './game';
import { learnedAnswer } from './learned';
import { strongAnswer } from './mc';
import type { Answer, Decision, GameConfig, GameState, Seat } from './types';

/** The bot that plays every seat not in `strong`: the fast heuristic (bots.ts) or the learned bot (learned.ts). */
export type BaseBot = 'heuristic' | 'learned';
const BASE: Record<BaseBot, (s: GameState, d: Decision) => Answer> = { heuristic: botAnswer, learned: learnedAnswer };

/** Answer every pending bot decision. Seats in `strong` play the Monte Carlo bot (mc.ts); the rest `base`. */
export function stepBots(g: Game, strong: ReadonlySet<Seat> = new Set(), base: BaseBot = 'heuristic'): boolean {
  let moved = false;
  for (const d of [...g.pending]) {
    if (!g.state.players[d.seat].isBot) continue;
    if (!g.pending.includes(d)) continue;
    g.answer(d.seat, d.id, strong.has(d.seat) ? strongAnswer(g, d) : BASE[base](g.state, d));
    moved = true;
  }
  return moved;
}

export function playBotGame(cfg: GameConfig, maxSteps = 20000, strong: Seat[] = [], base: BaseBot = 'heuristic'): Game {
  const g = new Game({ ...cfg, players: cfg.players.map((p) => ({ ...p, isBot: true })) });
  const set = new Set(strong);
  let steps = 0;
  while (!g.over) {
    if (!stepBots(g, set, base)) throw new Error('Game stalled with no bot decision pending.');
    if (++steps > maxSteps) throw new Error('Game exceeded step limit.');
  }
  return g;
}
