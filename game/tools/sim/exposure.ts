// Robert's question: at 3 or 4 players, often only one or two players Offer a token on a Day. Who Offers a token is
// public, and the Evening reveal shows the tokens' colors, so a lone token's color is exposed. How often does that
// happen, how much does it tell the table, and does it make sides easier to read?
// Usage: [TABLE=strong] npx tsx exposure.ts <games>   (default: Expert learned bots; strong = Monte Carlo)
import { Game, LEVELS, personaAnswer, strongAnswer, type GameState } from '@divide/engine';
import { pmap } from '../par';
import { ReaderLog, READER_FEATURES, fitReader } from './readerlib';

const G = Number(process.argv[2] ?? 2000), TABLE = process.env.TABLE ?? 'expert';
const F = READER_FEATURES.length;

/** The token Offers of `day` as the table sees them: who Offered one (public), and the colors revealed that Evening. */
function tokenDay(s: GameState, day: number) {
  const offerers = s.stats.filter((e) => e.day === day && e.type === 'action' && e.source === 'offer' && e.data?.token).map((e) => ({ seat: e.seat!, side: e.data!.token as string }));
  const reveal = s.log.find((e) => e.day === day && e.kind === 'tide')?.data as { tokens?: { light: number; dark: number } } | undefined;
  const t = reveal?.tokens ?? { light: 0, dark: 0 };
  return { offerers, light: t.light, dark: t.dark };
}

const games = await pmap(G, (i) => {
  const n = i % 2 ? 3 : 4;
  const g = new Game({ seed: 140000 + i, mode: 'open', players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  const reader = new ReaderLog(n);
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, TABLE === 'strong' ? strongAnswer(g, d) : personaAnswer(g.state, d, LEVELS.expert));
    reader.update(g.state);
  }
  const s = g.state;
  // Per Day: how many token Offers, how many fully exposed (every token revealed that Evening is one color and none
  // was taken back off the Altar), and whether the exposed color matches the Offerer's majority at the end.
  const days: { offers: number; exposed: number; match: number; matchable: number }[] = [];
  const evidence = Array.from({ length: n }, () => new Array<number>(8).fill(0)); // [seat][day]: signed evidence so far
  for (let day = 1; day <= s.tides.length; day++) {
    const t = tokenDay(s, day), total = t.light + t.dark;
    let exposed = 0, match = 0, matchable = 0;
    for (const o of t.offerers) {
      const sure = total === t.offerers.length && (t.light === 0 || t.dark === 0);
      const sign = total ? (t.light - t.dark) / total : 0; // what the table can infer about this offerer's token
      for (let d2 = day; d2 < 8; d2++) evidence[o.seat][d2] += sign;
      if (sure) {
        exposed++;
        const p = s.players[o.seat], l = p.tokens.filter((x) => x === 'light').length, dk = p.tokens.length - l;
        if (l !== dk) { matchable++; if ((l > dk ? 'light' : 'dark') === o.side) match++; }
      }
    }
    days.push({ offers: t.offerers.length, exposed, match, matchable });
  }
  // Reader rows with the token evidence each player had shown by that Evening (seat is column F + 1).
  const rows = reader.rows.map((r) => [...r.slice(0, F), evidence[r[F + 1]][r[F - 1]] ?? 0, r[F]]);
  return { n, days, base: reader.rows, rows };
});

for (const n of [3, 4]) {
  const gs = games.filter((g) => g.n === n), days = gs.flatMap((g) => g.days);
  const dist = [0, 1, 2, 3].map((k) => days.filter((d) => (k < 3 ? d.offers === k : d.offers >= 3)).length / days.length);
  const offers = days.reduce((t, d) => t + d.offers, 0), exposed = days.reduce((t, d) => t + d.exposed, 0);
  const matchable = days.reduce((t, d) => t + d.matchable, 0), match = days.reduce((t, d) => t + d.match, 0);
  const half = (xs: typeof gs, k: number) => xs.filter((_, j) => j % 2 === k);
  const base = fitReader(half(gs, 0).flatMap((g) => g.base), half(gs, 1).flatMap((g) => g.base));
  const withTokens = fitReader(half(gs, 0).flatMap((g) => g.rows), half(gs, 1).flatMap((g) => g.rows), F + 1);
  console.log(JSON.stringify({
    table: TABLE, players: n, games: gs.length,
    daysWithTokenOffers: { none: +dist[0].toFixed(2), one: +dist[1].toFixed(2), two: +dist[2].toFixed(2), threePlus: +dist[3].toFixed(2) },
    tokenOffersPerPlayerGame: +(offers / gs.length / n).toFixed(2),
    fullyExposed: +(exposed / Math.max(1, offers)).toFixed(2),
    exposedColorIsTheirSide: +(match / Math.max(1, matchable)).toFixed(2),
    reader: +base.accuracy.toFixed(3), readerWithTokenColors: +withTokens.accuracy.toFixed(3), guessing: +base.guessing.toFixed(3),
    tokenEvidenceWeight: withTokens.weights['extra 1'],
  }));
}
