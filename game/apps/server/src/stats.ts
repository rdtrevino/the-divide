// Stats: turn a finished game into database rows, write them to D1, and answer the stats page.
import { Game, type GameConfig, type Input } from '@divide/engine';
import type { CardStats, CelestialStats, GameDetail, GameSummary, StatsResponse } from '@divide/protocol';
import type { FinishedGame } from './roomCore';
import { CARD_VERSION } from './build.gen';

// ---------------------------------------------------------------- rows

export interface GameRows {
  game: Record<string, string | number | null>;
  players: { id: string; name: string }[];
  seats: { seat: number; player_id: string | null; name: string; is_bot: number; celestial: string; final_glory: number; bonus: number; matching: number; win_share: number; timeouts: number; turn_order: number }[];
  choirs: { seat: number; card: string; facedown: number }[];
  tides: { day: number; event: string | null; dir: string; light: number; dark: number; margin: number }[];
  events: { seq: number; day: number; type: string; seat: number | null; card: string | null; amount: number | null; source: string | null; data: unknown }[];
  dayScores: { day: number; seat: number; glory_start: number; glory_end: number }[];
  choirDays: { day: number; seat: number; card: string }[];
}

const iso = (ms: number) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19);

/**
 * Replay the game from its seed and inputs and collect everything worth measuring.
 * Replaying (rather than trusting the room's live state) proves the stored log really reproduces the game.
 */
export function buildRows(f: FinishedGame, cardVersion = CARD_VERSION): GameRows {
  const g = new Game(f.config);
  const n = f.config.players.length;
  const firstPlayer = g.state.firstPlayer;
  const timeouts = new Array<number>(n).fill(0);
  const auto = new Set(f.auto);
  const dayScores: GameRows['dayScores'] = [];
  const choirDays: GameRows['choirDays'] = [];
  let seen = 0;
  let prev = g.state.players.map((p) => p.glory);

  // After each input, record any Day whose Reaping has now happened.
  const snapshot = () => {
    while (seen < g.state.tides.length) {
      const day = g.state.tides[seen].day;
      // A Reaping can still be waiting on a player's choice after the Tide is set; record the Day once it is over.
      if (!g.over && g.state.day === day) break;
      seen++;
      if (seen < g.state.tides.length) continue; // only the newest Day matches the current table
      for (const p of g.state.players) {
        const end = p.glory;
        dayScores.push({ day, seat: p.seat, glory_start: prev[p.seat], glory_end: end });
        for (const c of p.choir) if (!c.facedown && c.id.startsWith('host-')) choirDays.push({ day, seat: p.seat, card: c.id });
      }
      prev = g.state.players.map((p) => p.glory);
    }
  };

  f.inputs.forEach((input, i) => {
    g.apply(input);
    if (auto.has(i) && input.t === 'answer') timeouts[input.seat]++;
    snapshot();
  });
  if (!g.over || !g.state.result) throw new Error('The stored inputs do not finish the game.');

  const s = g.state;
  const res = s.result!;
  const share = 1 / res.winners.length;
  const eventByDay = new Map<number, string>();
  for (const e of s.stats) if (e.type === 'event' && e.card) eventByDay.set(e.day, e.card);

  return {
    game: {
      id: f.id, room_code: f.roomCode, mode: f.config.mode, player_count: n,
      human_count: f.config.players.filter((p) => !p.isBot).length, seed: f.config.seed,
      engine_version: f.engineVersion, card_version: cardVersion,
      final_tide: res.finalTide, started_at: iso(f.startedAt), ended_at: iso(f.endedAt),
      inputs_json: JSON.stringify(f.inputs), config_json: JSON.stringify(f.config), days: s.tides.length,
      two_seeds: 0, // legacy column: the 2 Seeds option ended in V41
      timer_seconds: f.timer, auto_inputs: JSON.stringify(f.auto),
    },
    players: s.players.flatMap((p) => (f.playerKeys[p.seat] ? [{ id: f.playerKeys[p.seat]!, name: p.name }] : [])),
    seats: s.players.map((p) => {
      const st = res.standings.find((x) => x.seat === p.seat)!;
      return {
        seat: p.seat, player_id: f.playerKeys[p.seat] ?? null, name: p.name, is_bot: p.isBot ? 1 : 0, celestial: p.celestial,
        final_glory: st.glory, bonus: 0, matching: 0, win_share: res.winners.includes(p.seat) ? share : 0,
        timeouts: timeouts[p.seat], turn_order: (p.seat - firstPlayer + n) % n,
      };
    }),
    choirs: s.players.flatMap((p) => p.choir.map((c) => ({ seat: p.seat, card: c.id, facedown: c.facedown ? 1 : 0 }))),
    tides: s.tides.map((t) => ({ day: t.day, event: eventByDay.get(t.day) ?? null, dir: t.dir, light: t.light, dark: t.dark, margin: t.margin })),
    events: s.stats.map((e) => ({ seq: e.seq, day: e.day, type: e.type, seat: e.seat ?? null, card: e.card ?? null, amount: e.amount ?? null, source: e.source ?? null, data: e.data ?? null })),
    dayScores,
    choirDays,
  };
}

// ---------------------------------------------------------------- writing

const x = (field: string) => `json_extract(value, '$.${field}')`;

/** Write one finished game. Safe to repeat: every table is cleared for this game id first, in the same transaction. */
export async function saveGame(db: D1Database, f: FinishedGame): Promise<boolean> {
  const r = buildRows(f);
  const id = f.id;
  const gameCols = Object.keys(r.game);
  const stmts: D1PreparedStatement[] = [];
  for (const t of ['game_events', 'choir_days', 'day_scores', 'tides', 'final_choirs', 'game_players']) stmts.push(db.prepare(`DELETE FROM ${t} WHERE game_id = ?1`).bind(id));
  stmts.push(db.prepare('DELETE FROM games WHERE id = ?1').bind(id));
  stmts.push(db.prepare(`INSERT INTO games (${gameCols.join(', ')}) VALUES (${gameCols.map((_, i) => '?' + (i + 1)).join(', ')})`).bind(...gameCols.map((c) => r.game[c])));
  stmts.push(db.prepare(`INSERT INTO players (id, name) SELECT ${x('id')}, ${x('name')} FROM json_each(?1) WHERE true ON CONFLICT(id) DO UPDATE SET name = excluded.name`).bind(JSON.stringify(r.players)));
  const each = (table: string, cols: string[], rows: unknown[], map: Record<string, string> = {}) =>
    stmts.push(db.prepare(`INSERT INTO ${table} (game_id, ${cols.map((c) => map[c] ?? c).join(', ')}) SELECT ?1, ${cols.map(x).join(', ')} FROM json_each(?2)`).bind(id, JSON.stringify(rows)));
  each('game_players', ['seat', 'player_id', 'name', 'is_bot', 'celestial', 'final_glory', 'bonus', 'matching', 'win_share', 'timeouts', 'turn_order'], r.seats);
  each('final_choirs', ['seat', 'card', 'facedown'], r.choirs);
  each('tides', ['day', 'event', 'dir', 'light', 'dark', 'margin'], r.tides);
  each('game_events', ['seq', 'day', 'type', 'seat', 'card', 'amount', 'source', 'data'], r.events, { data: 'data_json' });
  each('day_scores', ['day', 'seat', 'glory_start', 'glory_end'], r.dayScores);
  each('choir_days', ['day', 'seat', 'card'], r.choirDays);
  await db.batch(stmts);
  return true;
}

// ---------------------------------------------------------------- reading

type Row = Record<string, any>;

/** The stats only ever cover the current card version: results from earlier rules are not shown. */
export interface StatsFilters { players: number | null; seats: 'all' | 'human' | 'bot' }

export function parseFilters(q: URLSearchParams): StatsFilters {
  const players = Number(q.get('players'));
  const seats = q.get('seats');
  return {
    players: players === 3 || players === 4 ? players : null,
    seats: seats === 'human' || seats === 'bot' ? seats : 'all',
  };
}

export async function readStats(db: D1Database, f: StatsFilters): Promise<StatsResponse> {
  const version = CARD_VERSION;
  // ?1 card version, ?2 player count or null, ?3 seat filter.
  const G = `g.ended_at IS NOT NULL AND g.card_version = ?1 AND (?2 IS NULL OR g.player_count = ?2) AND ?3 IS NOT NULL`;
  const S = `(?3 = 'all' OR gp.is_bot = (?3 = 'bot'))`;
  const GP = `game_players gp JOIN games g ON g.id = gp.game_id`;
  const q = (sql: string) => db.prepare(sql).bind(version, f.players, f.seats);
  const out = await db.batch<Row>([
    /* 0 */ q(`SELECT COUNT(*) AS games, AVG(g.days) AS avgDays FROM games g WHERE ${G}`),
    /* 1 */ q(`SELECT COUNT(*) AS seats, SUM(1 - gp.is_bot) AS humanSeats, AVG(CASE WHEN gp.win_share > 0 THEN gp.final_glory END) AS avgWinningGlory, AVG(gp.final_glory) AS avgGlory,
                 COUNT(DISTINCT CASE WHEN gp.win_share > 0 AND gp.win_share < 1 THEN gp.game_id END) AS sharedWins FROM ${GP} WHERE ${G} AND ${S}`),
    /* 2 */ q(`SELECT AVG(ds.glory_end - ds.glory_start) AS v FROM day_scores ds JOIN games g ON g.id = ds.game_id JOIN game_players gp ON gp.game_id = ds.game_id AND gp.seat = ds.seat WHERE ${G} AND ${S}`),
    /* 3 */ q(`SELECT gp.celestial AS card, COUNT(*) AS n, SUM(gp.win_share) AS wins, SUM(1.0 / g.player_count) AS expected, AVG(gp.final_glory) AS avgGlory FROM ${GP} WHERE ${G} AND ${S} GROUP BY gp.celestial`),
    /* 4 */ q(`SELECT fc.card, COUNT(*) AS n, SUM(gp.win_share) AS wins, SUM(1.0 / g.player_count) AS expected, AVG(gp.final_glory) AS avgGlory
               FROM final_choirs fc JOIN game_players gp ON gp.game_id = fc.game_id AND gp.seat = fc.seat JOIN games g ON g.id = fc.game_id WHERE fc.facedown = 0 AND ${G} AND ${S} GROUP BY fc.card`),
    /* 5 */ q(`SELECT cd.card, COUNT(*) AS n, AVG(ds.glory_end - ds.glory_start) AS perDay FROM choir_days cd
               JOIN day_scores ds ON ds.game_id = cd.game_id AND ds.day = cd.day AND ds.seat = cd.seat
               JOIN games g ON g.id = cd.game_id JOIN game_players gp ON gp.game_id = cd.game_id AND gp.seat = cd.seat WHERE ${G} AND ${S} GROUP BY cd.card`),
    /* 6 */ q(`SELECT e.card,
                 SUM(e.type = 'action' AND e.source = 'fruits') AS fruits, SUM(e.type = 'action' AND e.source = 'offer.card') AS offered,
                 SUM(e.type = 'action' AND e.source = 'gather') AS gathered, SUM(e.type = 'action' AND e.source = 'exalt') AS exalted,
                 SUM(e.type = 'activate') AS activations, SUM(e.type = 'negated') AS negated
               FROM game_events e JOIN games g ON g.id = e.game_id JOIN game_players gp ON gp.game_id = e.game_id AND gp.seat = e.seat
               WHERE e.card IS NOT NULL AND e.type IN ('action', 'activate', 'negated') AND ${G} AND ${S} GROUP BY e.card`),
    /* 7 */ q(`SELECT e.source AS card, SUM(e.amount) AS glory FROM game_events e JOIN games g ON g.id = e.game_id JOIN game_players gp ON gp.game_id = e.game_id AND gp.seat = e.seat
               WHERE e.type = 'glory' AND e.amount > 0 AND (e.source LIKE 'host-%' OR e.source LIKE 'celestial-%') AND ${G} AND ${S} GROUP BY e.source`),
    /* 8 */ q(`SELECT MAX(gp.name) AS name, COUNT(*) AS games, SUM(gp.win_share) AS wins, AVG(gp.final_glory) AS avgGlory FROM ${GP}
               WHERE ${G} AND gp.is_bot = 0 GROUP BY COALESCE(gp.player_id, lower(gp.name)) ORDER BY wins DESC, games DESC`),
    /* 9 */ q(`SELECT gp.turn_order AS "order", COUNT(*) AS n, SUM(gp.win_share) AS wins, SUM(1.0 / g.player_count) AS expected FROM ${GP} WHERE ${G} AND ${S} AND gp.turn_order IS NOT NULL GROUP BY gp.turn_order ORDER BY gp.turn_order`),
    /* 10 */ q(`SELECT t.dir, COUNT(*) AS n FROM tides t JOIN games g ON g.id = t.game_id WHERE ${G} GROUP BY t.dir`),
    /* 11 */ q(`SELECT t.event AS card, COUNT(DISTINCT t.game_id || ':' || t.day) AS n, AVG(ds.glory_end - ds.glory_start) AS avgSwing FROM tides t JOIN games g ON g.id = t.game_id
                LEFT JOIN day_scores ds ON ds.game_id = t.game_id AND ds.day = t.day WHERE t.event IS NOT NULL AND ${G} GROUP BY t.event ORDER BY n DESC`),
    /* 12 */ q(`SELECT g.id, g.ended_at AS endedAt, g.days, g.card_version AS cardVersion, g.final_tide AS finalTide FROM games g WHERE ${G} ORDER BY g.ended_at DESC LIMIT 25`),
  ]);
  const rows = (i: number) => (out[i].results ?? []) as Row[];
  const recentIds = rows(12).map((r) => r.id as string);
  const recentPlayers = recentIds.length
    ? ((await db.prepare(`SELECT game_id, seat, name, is_bot, celestial, final_glory, win_share FROM game_players WHERE game_id IN (SELECT value FROM json_each(?1)) ORDER BY seat`).bind(JSON.stringify(recentIds)).all<Row>()).results as Row[])
    : [];

  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const ratio = (r: Row) => ({ n: Number(r.n), wins: Number(r.wins), expected: Number(r.expected), avgGlory: Number(r.avgGlory) });
  const plays = new Map(rows(6).map((r) => [r.card as string, r]));
  const glory = new Map(rows(7).map((r) => [r.card as string, Number(r.glory)]));
  const finals = new Map(rows(4).map((r) => [r.card as string, r]));
  const perDay = new Map(rows(5).map((r) => [r.card as string, r]));

  const hostIds = new Set<string>([...finals.keys(), ...perDay.keys(), ...plays.keys(), ...glory.keys()].filter((c) => c.startsWith('host-')));
  const cards: CardStats[] = [...hostIds].map((card) => {
    const p = plays.get(card);
    const d = perDay.get(card);
    return {
      card, finalChoir: finals.has(card) ? ratio(finals.get(card)!) : null,
      choirDays: d ? Number(d.n) : 0, gloryPerDay: d ? num(d.perDay) : null,
      fruits: Number(p?.fruits ?? 0), offered: Number(p?.offered ?? 0), gathered: Number(p?.gathered ?? 0), exalted: Number(p?.exalted ?? 0),
      activations: Number(p?.activations ?? 0), negated: Number(p?.negated ?? 0), abilityGlory: glory.get(card) ?? 0,
    };
  });
  const celestials: CelestialStats[] = rows(3).map((r) => ({
    card: r.card, ratio: ratio(r), activations: Number(plays.get(r.card)?.activations ?? 0), abilityGlory: glory.get(r.card) ?? 0,
  }));
  const s0 = rows(0)[0] ?? {};
  const s1 = rows(1)[0] ?? {};
  return {
    filters: { version, players: f.players, seats: f.seats },
    summary: {
      games: Number(s0.games ?? 0), seats: Number(s1.seats ?? 0), humanSeats: Number(s1.humanSeats ?? 0), avgDays: num(s0.avgDays),
      avgWinningGlory: num(s1.avgWinningGlory), avgGlory: num(s1.avgGlory), sharedWins: Number(s1.sharedWins ?? 0), baselineGloryPerDay: num(rows(2)[0]?.v),
    },
    celestials, cards,
    players: rows(8).map((r) => ({ name: r.name, games: Number(r.games), wins: Number(r.wins), avgGlory: Number(r.avgGlory) })),
    turnOrder: rows(9).map((r) => ({ order: Number(r.order), n: Number(r.n), wins: Number(r.wins), expected: Number(r.expected) })),
    tides: rows(10).map((r) => ({ dir: r.dir, n: Number(r.n) })),
    events: rows(11).map((r) => ({ card: r.card, n: Number(r.n), avgSwing: num(r.avgSwing) })),
    recent: rows(12).map((g) => summary(g, recentPlayers.filter((p) => p.game_id === g.id))),
  };
}

function summary(g: Row, players: Row[]): GameSummary {
  return {
    id: g.id, endedAt: g.endedAt, days: g.days === null ? null : Number(g.days), cardVersion: g.cardVersion, finalTide: g.finalTide,
    players: players.map((p) => ({ seat: Number(p.seat), name: p.name, isBot: !!p.is_bot, celestial: p.celestial, glory: Number(p.final_glory), winShare: Number(p.win_share) })),
  };
}

/** One stored game with its seed and input log, so the browser can replay it with the engine. */
export async function readGame(db: D1Database, id: string): Promise<GameDetail | null> {
  const g = await db.prepare('SELECT id, ended_at AS endedAt, days, card_version AS cardVersion, final_tide AS finalTide, engine_version AS engineVersion, config_json, inputs_json, auto_inputs FROM games WHERE id = ?1').bind(id).first<Row>();
  if (!g) return null;
  const players = (await db.prepare('SELECT game_id, seat, name, is_bot, celestial, final_glory, win_share FROM game_players WHERE game_id = ?1 ORDER BY seat').bind(id).all<Row>()).results as Row[];
  return {
    ...summary(g, players), engineVersion: g.engineVersion,
    config: JSON.parse(g.config_json ?? 'null') as GameConfig, inputs: JSON.parse(g.inputs_json ?? '[]') as Input[], autoInputs: JSON.parse(g.auto_inputs ?? '[]'),
  };
}
