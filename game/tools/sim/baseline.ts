// Writes the Stats page's bot column (apps/web/src/data/bot-baseline.json) for the current card version:
// the win ratio of every Celestial and every Host card in a final Choir, over all-bot games.
// Half the games are Base and half Advanced (only Advanced games have Celestials), at 3 and 4 players.
// Usage: cd tools/sim && npx tsx baseline.ts 10000
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playBotGame } from '@divide/engine';
import { BOT } from './bot';

const here = dirname(fileURLToPath(import.meta.url));
const GAMES = Number(process.argv[2] ?? 10000);
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee'];
const version = JSON.parse(readFileSync(join(here, '../../packages/engine/src/cards.data.json'), 'utf8')).version as string;

type Agg = { wins: number; expected: number };
const cel: Record<string, Agg> = {};
const cards: Record<string, Agg> = {};
for (let g = 0; g < GAMES; g++) {
  const n = g % 2 ? 4 : 3;
  const advanced = g % 4 >= 2;
  const s = playBotGame({ seed: 500000 + g, mode: 'open', advanced, players: NAMES.slice(0, n).map((name) => ({ name, isBot: true })) }, 20000, [], BOT).state;
  const res = s.result!;
  for (const p of s.players) {
    const won = res.winners.includes(p.seat) ? 1 / res.winners.length : 0;
    if (p.celestial) { const a = (cel[p.celestial] ??= { wins: 0, expected: 0 }); a.wins += won; a.expected += 1 / n; }
    for (const c of p.choir) {
      if (c.facedown) continue;
      const a = (cards[c.id] ??= { wins: 0, expected: 0 });
      a.wins += won; a.expected += 1 / n;
    }
  }
}
const ratios = (m: Record<string, Agg>) => Object.fromEntries(Object.keys(m).sort().map((k) => [k, Math.round((m[k].wins / m[k].expected) * 100) / 100]));
const out = {
  version,
  games: GAMES,
  note: 'All-bot games, 3 and 4 players, half Base and half Advanced (Celestials from the Advanced games only). Written by tools/sim/baseline.ts.',
  celestials: ratios(cel),
  cards: ratios(cards),
};
const target = join(here, '../../apps/web/src/data/bot-baseline.json');
writeFileSync(target, JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${target}: ${version}, ${GAMES} games, ${Object.keys(out.cards).length} cards, ${Object.keys(out.celestials).length} Celestials.`);
