// The bot that plays the simulations: the learned bot by default (the site's bots; about 14 ms a 4-player game), or
// BOT=heuristic for the fast heuristic (about 3 ms a game, weaker; the bot behind measurements before November 19).
import { type Answer, type BaseBot, type Decision, type GameState, botAnswer, learnedAnswer } from '@divide/engine';

export const BOT: BaseBot = process.env.BOT === 'heuristic' ? 'heuristic' : 'learned';
/** The simulation bot's answer to a decision. */
export const answer: (s: GameState, d: Decision) => Answer = BOT === 'heuristic' ? botAnswer : learnedAnswer;
