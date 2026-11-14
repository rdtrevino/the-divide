// Run a game where bots answer every decision (used by the simulator, tests, and server bots).
import { botAnswer } from './bots';
import { Game } from './game';
import type { GameConfig } from './types';

export function stepBots(g: Game): boolean {
  let moved = false;
  for (const d of [...g.pending]) {
    if (!g.state.players[d.seat].isBot) continue;
    if (!g.pending.includes(d)) continue;
    g.answer(d.seat, d.id, botAnswer(g.state, d));
    moved = true;
  }
  return moved;
}

export function playBotGame(cfg: GameConfig, maxSteps = 20000): Game {
  const g = new Game({ ...cfg, players: cfg.players.map((p) => ({ ...p, isBot: true })) });
  let steps = 0;
  while (!g.over) {
    if (!stepBots(g)) throw new Error('Game stalled with no bot decision pending.');
    if (++steps > maxSteps) throw new Error('Game exceeded step limit.');
  }
  return g;
}
