import { describe, expect, it } from 'vitest';
import { botAnswer, Game, type GameView } from '@divide/engine';
import type { ServerMsg, StateMsg } from '@divide/protocol';
import { AWAY_DELAY, DISCONNECTED_GRACE, RoomCore, type FinishedGame, type Hooks, type Store } from '../src/roomCore';
import { buildRows } from '../src/stats';

/** A room wired to an in-memory store and a clock the test controls. */
function table(seed = 1234, shared?: { data: Map<string, unknown> }) {
  const data = shared?.data ?? new Map<string, unknown>();
  const inbox = new Map<string, ServerMsg[]>();
  const saved: FinishedGame[] = [];
  const t = { now: 1_000_000, alarm: null as number | null, saveOk: true };
  const store: Store = {
    get: async (k) => structuredClone(data.get(k)) as any,
    list: async (prefix) => new Map([...data].filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, structuredClone(v)])) as any,
    put: (e) => { for (const [k, v] of Object.entries(e)) data.set(k, structuredClone(v)); },
    delete: (keys) => { for (const k of keys) data.delete(k); },
    deleteAll: () => data.clear(),
  };
  let ids = 0;
  const hooks: Hooks = {
    send: (id, msg) => { (inbox.get(id) ?? inbox.set(id, []).get(id)!).push(structuredClone(msg)); },
    setAlarm: (at) => { t.alarm = at; },
    now: () => t.now,
    saveGame: async (g) => { if (t.saveOk) saved.push(structuredClone(g)); return t.saveOk; },
    randomSeed: () => seed,
    randomId: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}`,
    engineVersion: 'test',
  };
  const core = new RoomCore(store, hooks);
  const last = (id: string) => [...(inbox.get(id) ?? [])].reverse().find((m): m is StateMsg => m.t === 'state')!;
  const errors = (id: string) => (inbox.get(id) ?? []).filter((m) => m.t === 'error');
  /** Run the clock until nothing is scheduled or `until` says stop. */
  const run = async (until: () => boolean, max = 20000) => {
    for (let i = 0; i < max && !until(); i++) {
      if (t.alarm === null) break;
      t.now = Math.max(t.now, t.alarm);
      core.tick();
      await Promise.resolve();
    }
  };
  return { core, data, inbox, saved, t, last, errors, run, store, hooks };
}

const join = (x: ReturnType<typeof table>, id: string, name: string) => x.core.connect({ id, clientId: `client-${id}-xxxx`, name });

/** Collect the log a connection has been sent, the way the browser does. */
function logOf(x: ReturnType<typeof table>, id: string) {
  const lines = new Map<number, string>();
  for (const m of x.inbox.get(id) ?? []) {
    if (m.t !== 'state' || !m.view) continue;
    if (m.logReset) lines.clear();
    for (const e of m.view.log) lines.set(e.seq, e.text);
  }
  return lines;
}

describe('lobby', () => {
  it('seats people as they arrive and lets the host fill seats with bots', async () => {
    const x = table();
    await x.core.load();
    expect(x.core.exists).toBe(false);
    x.core.init('ABCDE', 'client-a-xxxx');
    join(x, 'a', 'Robert');
    join(x, 'b', 'Ana');
    expect(x.last('a').room.seats.map((s) => s.name)).toEqual(['Robert', 'Ana', '', '']);
    expect(x.last('a').you).toMatchObject({ seat: 0, isHost: true });
    expect(x.last('b').you).toMatchObject({ seat: 1, isHost: false });

    x.core.handle('b', { t: 'start' });
    expect(x.errors('b').at(-1)).toMatchObject({ message: 'Only the host can do that.' });
    x.core.handle('a', { t: 'start' });
    expect(x.errors('a').at(-1)?.t).toBe('error');

    x.core.handle('a', { t: 'seat', seat: 2, kind: 'bot' });
    x.core.handle('a', { t: 'size', seats: 3 });
    expect(x.last('a').room.seats.map((s) => s.kind)).toEqual(['human', 'human', 'bot']);
    x.core.handle('a', { t: 'options', timer: 120, twoSeeds: true });
    x.core.handle('a', { t: 'options', timer: 7 });
    expect(x.last('a').room.options).toEqual({ timer: 120, twoSeeds: true });
    x.core.handle('a', { t: 'start' });
    expect(x.last('b').room.status).toBe('playing');
    expect(x.last('b').view?.players.length).toBe(3);
  });

  it('the same player on two devices has one seat (names are verified before they reach the table)', async () => {
    const x = table();
    x.core.init('ABCDE', 'client-a-xxxx');
    join(x, 'a', 'Sam');
    join(x, 'b', 'sam');
    expect(x.last('a').room.seats.map((s) => s.kind)).toEqual(['human', 'open', 'open', 'open']);
    expect(x.last('b').you.seat).toBe(0);
    // Leaving on one device does not mark the player as gone while the other is still connected.
    x.core.disconnect('a');
    expect(x.last('b').room.seats[0].connected).toBe(true);
  });
});

describe('a full game', () => {
  it('plays to the end with two people and two bots, hides what should be hidden, and saves it', async () => {
    const x = table(77);
    x.core.init('ABCDE', 'client-a-xxxx');
    join(x, 'a', 'Robert');
    join(x, 'b', 'Ana');
    join(x, 'w', 'Watcher');
    x.core.handle('w', { t: 'stand' });
    x.core.handle('a', { t: 'seat', seat: 2, kind: 'bot' });
    x.core.handle('a', { t: 'seat', seat: 3, kind: 'bot' });
    x.core.handle('a', { t: 'start' });
    expect(x.last('w').you.seat).toBe(null);

    const g = () => x.core.game!;
    const check = (id: string, seat: number | null) => {
      const v = x.last(id).view as GameView;
      const s = g().state;
      if (s.phase === 'ended') return;
      v.players.forEach((p) => {
        if (p.seat !== seat && !s.confession.some((c) => c.seat === p.seat)) expect(p.hand).toBe(null);
      });
      v.altar.forEach((a, i) => {
        const real = s.altar[i];
        if (real.facedown && real.offeredBy !== seat && !(seat !== null && real.seenBy?.includes(seat))) expect(a.id).toBe(null);
      });
      for (const d of v.decisions) expect(d.seat).toBe(seat);
      expect(JSON.stringify(x.last(id))).not.toContain('client-');
    };

    let guard = 0;
    while (x.last('a').room.status === 'playing' && guard++ < 5000) {
      check('a', 0); check('b', 1); check('w', null);
      let acted = false;
      for (const [id, seat] of [['a', 0], ['b', 1]] as const) {
        const d = x.last(id).view!.decisions[0];
        if (!d) continue;
        x.core.handle(id, { t: 'answer', id: d.id, choice: botAnswer(g().state, d) });
        acted = true;
        break;
      }
      if (!acted) await x.run(() => x.last('a').view!.decisions.length > 0 || x.last('b').view!.decisions.length > 0 || x.last('a').room.status !== 'playing');
    }
    await Promise.resolve();
    await Promise.resolve();
    expect(x.last('a').room.status).toBe('ended');
    expect(x.errors('a')).toEqual([]);
    expect(x.errors('b')).toEqual([]);
    expect(x.last('a').room.saved).toBe(true);
    expect(x.saved.length).toBe(1);

    // What each browser was sent, pieced together, is exactly the log that seat may see.
    const full = g().state.log;
    expect([...logOf(x, 'a').keys()]).toEqual(full.filter((e) => e.visibility === 'public' || e.visibility.includes(0)).map((e) => e.seq));
    expect([...logOf(x, 'w').keys()]).toEqual(full.filter((e) => e.visibility === 'public').map((e) => e.seq));

    // The stored record replays to the same result and yields sensible stats rows.
    const done = x.saved[0];
    const replay = Game.replay(done.config, done.inputs);
    expect(replay.state.result).toEqual(g().state.result);
    const rows = buildRows(done, 'V38');
    expect(rows.game).toMatchObject({ player_count: 4, human_count: 2, card_version: 'V38', room_code: 'ABCDE' });
    expect(rows.seats.map((s) => s.player_id)).toEqual(['robert', 'ana', null, null]);
    expect(rows.seats.reduce((a, s) => a + s.win_share, 0)).toBeCloseTo(1);
    expect(rows.seats.map((s) => s.turn_order).sort()).toEqual([0, 1, 2, 3]);
    expect(rows.tides.length).toBe(rows.game.days);
    expect(rows.dayScores.length).toBe(4 * rows.tides.length);
    for (const seat of [0, 1, 2, 3]) {
      const days = rows.dayScores.filter((d) => d.seat === seat);
      expect(days[0].glory_start).toBe(0);
      days.slice(1).forEach((d, i) => expect(d.glory_start).toBe(days[i].glory_end));
      const st = rows.seats[seat];
      expect(days.at(-1)!.glory_end).toBe(st.final_glory - st.bonus);
    }
    expect(rows.choirDays.length).toBeGreaterThan(rows.tides.length * 4);
    expect(rows.events.some((e) => e.type === 'game_end')).toBe(true);

    // The host can deal again with the same seats.
    x.core.handle('a', { t: 'again' });
    expect(x.last('b').room.status).toBe('lobby');
    expect(x.last('b').view).toBe(null);
  });

  it('survives the room being unloaded: a fresh room object replays the stored moves', async () => {
    const x = table(5);
    x.core.init('ABCDE', 'client-a-xxxx');
    join(x, 'a', 'Robert');
    for (const seat of [1, 2]) x.core.handle('a', { t: 'seat', seat, kind: 'bot' });
    x.core.handle('a', { t: 'size', seats: 3 });
    x.core.handle('a', { t: 'start' });
    for (let i = 0; i < 12; i++) {
      const d = x.last('a').view!.decisions[0];
      if (d) x.core.handle('a', { t: 'answer', id: d.id, choice: botAnswer(x.core.game!.state, d) });
      else await x.run(() => x.last('a').view!.decisions.length > 0);
    }
    const before = JSON.stringify(x.core.game!.state);
    const y = table(5, { data: x.data });
    await y.core.load();
    expect(JSON.stringify(y.core.game!.state)).toBe(before);
    join(y, 'a2', 'Robert');
    expect(y.last('a2').you.seat).toBe(0);
    expect(y.last('a2').logReset).toBe(true);
  });
});

describe('the turn timer', () => {
  const started = () => {
    const x = table(9);
    x.core.init('ABCDE', 'client-a-xxxx');
    join(x, 'a', 'Robert');
    join(x, 'b', 'Ana');
    x.core.handle('a', { t: 'seat', seat: 2, kind: 'bot' });
    x.core.handle('a', { t: 'size', seats: 3 });
    x.core.handle('a', { t: 'start' });
    return x;
  };

  it('makes the choice for a player who runs out of time, and marks them away after two misses', async () => {
    const x = started();
    const first = x.last('a');
    expect(first.view!.decisions.length).toBe(1); // First Fruits
    const mine = first.waiting.find((w) => w.seat === 0)!;
    expect(mine.deadline).toBe(x.t.now + 90_000);
    // Ana answers; Robert does not.
    const d = x.last('b').view!.decisions[0];
    x.core.handle('b', { t: 'answer', id: d.id, choice: [d.options[0].id] });
    x.t.now += 89_000;
    x.core.tick();
    expect(x.core.game!.inputs.filter((i) => i.t === 'answer' && i.seat === 0).length).toBe(0);
    x.t.now += 1_500;
    x.core.tick();
    expect(x.core.game!.inputs.filter((i) => i.t === 'answer' && i.seat === 0).length).toBe(1);
    expect(x.last('a').room.seats[0].away).toBe(false);

    // Keep the clock running without Robert: after the second miss a bot covers the seat quickly.
    const answerOthers = () => {
      const dd = x.last('b').view!.decisions[0];
      if (dd) x.core.handle('b', { t: 'answer', id: dd.id, choice: botAnswer(x.core.game!.state, dd) });
    };
    let guard = 0;
    while (!x.last('a').room.seats[0].away && guard++ < 500) { answerOthers(); await x.run(() => x.last('b').view!.decisions.length > 0 || x.last('a').room.seats[0].away, 1); }
    expect(x.last('a').room.seats[0].away).toBe(true);
    await x.run(() => x.last('a').view!.decisions.length > 0 || x.last('b').view!.decisions.length > 0);
    guard = 0;
    while (!x.last('a').view!.decisions.length && guard++ < 500) { answerOthers(); await x.run(() => x.last('a').view!.decisions.length > 0 || x.last('b').view!.decisions.length > 0, 1); }
    expect(x.last('a').waiting.find((w) => w.seat === 0)!.deadline).toBeLessThanOrEqual(x.t.now + AWAY_DELAY);

    // "I'm back" restores the full clock.
    x.core.handle('a', { t: 'back' });
    expect(x.last('a').room.seats[0].away).toBe(false);
    expect(x.last('a').waiting.find((w) => w.seat === 0)!.deadline).toBe(x.t.now + 90_000);
    const done = x.core.game!;
    expect(done.inputs.length).toBeGreaterThan(3);
  });

  it('shortens the clock for a player who has disconnected, and stops it when the table is empty', async () => {
    const x = started();
    x.core.disconnect('a');
    expect(x.last('b').room.seats[0].connected).toBe(false);
    expect(x.last('b').waiting.find((w) => w.seat === 0)!.deadline).toBe(x.t.now + DISCONNECTED_GRACE);
    // Robert returns on a new device under the same name and gets his seat and a full clock back.
    x.core.connect({ id: 'a-phone', clientId: 'client-phone-xxxx', name: 'robert' });
    expect(x.last('a-phone').you.seat).toBe(0);
    expect(x.last('a-phone').waiting.find((w) => w.seat === 0)!.deadline).toBe(x.t.now + 90_000);

    const moves = x.core.game!.inputs.length;
    x.core.disconnect('a-phone');
    x.core.disconnect('b');
    x.t.now += 10 * 60_000;
    x.core.tick();
    expect(x.core.game!.inputs.length).toBe(moves);
  });

  it('retries the stats write until it succeeds', async () => {
    const x = table(3);
    x.t.saveOk = false;
    x.core.init('ABCDE', 'client-a-xxxx');
    join(x, 'a', 'Robert');
    x.core.handle('a', { t: 'stand' });
    for (const seat of [0, 1, 2]) x.core.handle('a', { t: 'seat', seat, kind: 'bot' });
    x.core.handle('a', { t: 'size', seats: 3 });
    x.core.handle('a', { t: 'start' });
    await x.run(() => x.last('a').room.status === 'ended');
    await Promise.resolve(); await Promise.resolve();
    expect(x.last('a').room).toMatchObject({ status: 'ended', saved: false });
    expect([...x.data.keys()].some((k) => k.startsWith('finished:'))).toBe(true);
    x.t.saveOk = true;
    await x.run(() => x.saved.length > 0, 5);
    await Promise.resolve(); await Promise.resolve();
    expect(x.saved.length).toBe(1);
    expect(x.last('a').room.saved).toBe(true);
    expect([...x.data.keys()].some((k) => k.startsWith('finished:'))).toBe(false);
  });
});
