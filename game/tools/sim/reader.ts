// How readable is each player's side from what the table sees? (vision principle 2.) Rows and model: readerlib.ts.
// Fitted on half the games and scored on the other half; guessing the more common side scores about 50%.
// Usage: [TABLE=heuristic|strong] npx tsx reader.ts <games> [persona for one seat: a LEVELS or STYLES name; the rest Expert]
import { Game, LEVELS, STYLES, botAnswer, personaAnswer, strongAnswer } from '@divide/engine';
import { pmap } from '../par';
import { ReaderLog, fitReader } from './readerlib';
const G = Number(process.argv[2] ?? 1000), who = process.argv[3], TABLE = process.env.TABLE;
const tested = who ? { ...LEVELS, ...STYLES }[who] : undefined;

const games = await pmap(G, (i) => {
  const n = i % 2 ? 3 : 4;
  const ps = Array.from({ length: n }, (_, k) => (tested && k === i % n ? tested : LEVELS.expert));
  const g = new Game({ seed: 120000 + i, mode: 'open', players: ps.map((p, k) => ({ name: p.name + k, isBot: true })) });
  const logs = new ReaderLog(n);
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, TABLE === 'heuristic' ? botAnswer(g.state, d) : TABLE === 'strong' ? strongAnswer(g, d) : personaAnswer(g.state, d, ps[d.seat]));
    logs.update(g.state);
  }
  return { rows: logs.rows, testedSeat: tested ? i % n : -1 };
});
const train = games.filter((_, i) => i % 2 === 0).flatMap((g) => g.rows), testGames = games.filter((_, i) => i % 2 === 1);
const test = testGames.flatMap((g) => g.rows), SEAT = 8; // readerlib rows: 7 facts, the side, the seat
const fit = fitReader(train, test);
const out: Record<string, unknown> = { table: TABLE ?? 'expert', games: G, rows: test.length, readerAccuracy: +fit.accuracy.toFixed(3), guessing: +fit.guessing.toFixed(3), weights: fit.weights };
if (tested) Object.assign(out, {
  [`${tested.name} read`]: +fit.accuracyOf(testGames.flatMap((g) => g.rows.filter((r) => r[SEAT] === g.testedSeat))).toFixed(3),
  'others read': +fit.accuracyOf(testGames.flatMap((g) => g.rows.filter((r) => r[SEAT] !== g.testedSeat))).toFixed(3),
});
console.log(JSON.stringify(out, null, 1));
