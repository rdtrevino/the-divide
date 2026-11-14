// Balance simulator: plays many all-bot games and reports how each Celestial and Host card performs.
// Usage: npm run sim -- --games 20000 --players 3,4 --out report
import { writeFileSync } from 'node:fs';
import { CELESTIALS, HOSTS, cardName, playBotGame } from '@divide/engine';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : [])).filter((x) => x.length));
const GAMES = Number(args.games ?? 10000);
const COUNTS = String(args.players ?? '3,4').split(',').map(Number);
const OUT = String(args.out ?? 'sim-report');
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fin'];

type Agg = { seats: number; wins: number; expected: number; glory: number };
const cel: Record<string, Agg> = {};
const cardFinal: Record<string, Agg> = {};
const cardSource: Record<string, { glory: number; games: number; activations: number; negated: number }> = {};
const actions: Record<string, { offer: number; gather: number; exalt: number }> = {};
let totalGlory = 0;
let seatsTotal = 0;
const winnerGlory: number[] = [];
const ties = { count: 0 };

const t0 = Date.now();
for (let g = 0; g < GAMES; g++) {
  const n = COUNTS[g % COUNTS.length];
  const game = playBotGame({ seed: 100000 + g, mode: 'open', players: NAMES.slice(0, n).map((name) => ({ name, isBot: true })) });
  const s = game.state;
  const res = s.result!;
  if (res.winners.length > 1) ties.count++;
  winnerGlory.push(s.players[res.winners[0]].glory);
  const share = 1 / res.winners.length;
  const present = new Set<string>();
  for (const p of s.players) {
    const won = res.winners.includes(p.seat) ? share : 0;
    const a = (cel[p.celestial] ??= { seats: 0, wins: 0, expected: 0, glory: 0 });
    a.seats++; a.wins += won; a.expected += 1 / n; a.glory += p.glory;
    totalGlory += p.glory; seatsTotal++;
    for (const c of p.choir) {
      if (c.facedown) continue;
      const b = (cardFinal[c.id] ??= { seats: 0, wins: 0, expected: 0, glory: 0 });
      b.seats++; b.wins += won; b.expected += 1 / n; b.glory += p.glory;
    }
  }
  for (const e of s.stats) {
    if (e.type === 'glory' && e.source && (e.source.startsWith('host-') || e.source.startsWith('celestial-')) && (e.amount ?? 0) > 0) {
      (cardSource[e.source] ??= { glory: 0, games: 0, activations: 0, negated: 0 }).glory += e.amount!;
      present.add(e.source);
    }
    if (e.type === 'activate' && e.card) (cardSource[e.card] ??= { glory: 0, games: 0, activations: 0, negated: 0 }).activations++;
    if (e.type === 'negated' && e.card) (cardSource[e.card] ??= { glory: 0, games: 0, activations: 0, negated: 0 }).negated++;
    if (e.type === 'action' && e.card && e.source) {
      const k = e.source === 'offer.card' ? 'offer' : e.source === 'gather' ? 'gather' : e.source === 'exalt' ? 'exalt' : null;
      if (k) (actions[e.card] ??= { offer: 0, gather: 0, exalt: 0 })[k]++;
    }
  }
  for (const id of present) cardSource[id].games++;
}
const secs = (Date.now() - t0) / 1000;

const pct = (x: number) => (x * 100).toFixed(1) + '%';
const ratio = (a: Agg) => a.wins / a.expected;
const lines: string[] = [];
lines.push(`# Balance simulation`, '', `${GAMES} all-bot Open Games (${COUNTS.join(' and ')} players), ${secs.toFixed(1)}s. Bots are heuristic, so treat this as a first signal, not a verdict.`, '');
lines.push(`Average final Glory per player: ${(totalGlory / seatsTotal).toFixed(1)}. Average winning Glory: ${(winnerGlory.reduce((a, b) => a + b, 0) / winnerGlory.length).toFixed(1)}. Shared wins: ${pct(ties.count / GAMES)}.`, '');
lines.push(`**Win ratio** = actual wins / wins expected by chance. 1.00 is perfectly fair; above 1.15 or below 0.85 is worth a look.`, '');
lines.push('## Celestials', '', '| Celestial | Seats | Win ratio | Avg Glory |', '|---|---|---|---|');
for (const [id, a] of Object.entries(cel).sort((x, y) => ratio(y[1]) - ratio(x[1]))) lines.push(`| ${cardName(id)} | ${a.seats} | ${ratio(a).toFixed(2)} | ${(a.glory / a.seats).toFixed(1)} |`);
lines.push('', '## Host cards in the final Choir', '', 'Win ratio for players who ended the game with the card face up in their Choir.', '', '| Card | Seen | Win ratio | Avg Glory |', '|---|---|---|---|');
for (const [id, a] of Object.entries(cardFinal).sort((x, y) => ratio(y[1]) - ratio(x[1]))) lines.push(`| ${cardName(id)} | ${a.seats} | ${ratio(a).toFixed(2)} | ${(a.glory / a.seats).toFixed(1)} |`);
lines.push('', '## Glory produced by abilities', '', '| Source | Total Glory | Per game where it scored | Activations | Negated by Silence |', '|---|---|---|---|---|');
for (const [id, a] of Object.entries(cardSource).sort((x, y) => y[1].glory - x[1].glory)) lines.push(`| ${cardName(id)} | ${a.glory} | ${a.games ? (a.glory / a.games).toFixed(2) : '0'} | ${a.activations} | ${a.negated} |`);
lines.push('', '## How cards are played', '', '| Card | Offered | Gathered | Exalted |', '|---|---|---|---|');
for (const h of HOSTS.filter((x) => x.openGame)) { const a = actions[h.id] ?? { offer: 0, gather: 0, exalt: 0 }; lines.push(`| ${h.name} | ${a.offer} | ${a.gather} | ${a.exalt} |`); }
writeFileSync(`${OUT}.md`, lines.join('\n'));
writeFileSync(`${OUT}.json`, JSON.stringify({ games: GAMES, counts: COUNTS, celestials: cel, cardFinal, cardSource, actions }, null, 1));
console.log(lines.slice(0, 22).join('\n'));
console.log(`\nWrote ${OUT}.md and ${OUT}.json`);
void CELESTIALS;
