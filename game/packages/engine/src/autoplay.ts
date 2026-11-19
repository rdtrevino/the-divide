// Run a game where bots answer every decision (used by the simulator, tests, and server bots).
import { botAnswer } from './bots';
import { Game } from './game';
import { strongAnswer } from './mc';
import type { GameConfig, Seat } from './types';

/** Answer every pending bot decision. Seats in `strong` play the Monte Carlo bot (mc.ts); the rest the heuristic. */
export function stepBots(g: Game, strong: ReadonlySet<Seat> = new Set()): boolean {
  let moved = false;
  for (const d of [...g.pending]) {
    if (!g.state.players[d.seat].isBot) continue;
    if (!g.pending.includes(d)) continue;
    g.answer(d.seat, d.id, strong.has(d.seat) ? strongAnswer(g, d) : botAnswer(g.state, d));
    moved = true;
  }
  return moved;
}

export function playBotGame(cfg: GameConfig, maxSteps = 20000, strong: Seat[] = []): Game {
  const g = new Game({ ...cfg, players: cfg.players.map((p) => ({ ...p, isBot: true })) });
  const set = new Set(strong);
  let steps = 0;
  while (!g.over) {
    if (!stepBots(g, set)) throw new Error('Game stalled with no bot decision pending.');
    if (++steps > maxSteps) throw new Error('Game exceeded step limit.');
  }
  return g;
}
