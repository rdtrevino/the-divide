// One game room: seats, the running Game, bots, the turn timer, and what each connection is sent.
// This file has no Cloudflare dependencies, so it runs in plain Node for tests; room.ts wires it to a Durable Object.
import { Game, RuleError, botAnswer, viewFor, type Decision, type GameConfig, type Input } from '@divide/engine';
import {
  DEFAULT_TIMER, TIMER_CHOICES, type ChatLine, type ClientMsg, type RoomOptions, type RoomPublic, type ServerMsg,
  type StateMsg,
} from '@divide/protocol';

// ---------------------------------------------------------------- timing

/** A bot waits this long before a choice the table has just watched something happen for. */
export const BOT_DELAY_SEEN = 1100;
/** ...and this long between choices nobody else can see (picking the card for a facedown Offer). */
export const BOT_DELAY_QUIET = 350;
/** A player whose browser is not connected gets at most this long per decision. */
export const DISCONNECTED_GRACE = 25_000;
/** A seat marked away (two missed decisions, or a miss while disconnected) is played by a bot at this pace. */
export const AWAY_DELAY = 2500;
export const MISSES_BEFORE_AWAY = 2;
/** How long to wait before retrying a failed stats write. */
export const SAVE_RETRY = 30_000;
export const SAVE_MAX_TRIES = 40;
/** A room nobody has opened for this long is deleted. */
export const ROOM_TTL = 14 * 24 * 3600 * 1000;

export const BOT_NAMES = ['Asher', 'Naomi', 'Ezra', 'Tirzah'];

// ---------------------------------------------------------------- stored shapes

export interface Seat {
  kind: 'open' | 'human' | 'bot';
  name: string;
  /** Browser id of the human in this seat. Never sent to other players. */
  clientId?: string;
  away?: boolean;
  misses?: number;
}

export interface GameMeta {
  id: string;
  config: GameConfig;
  startedAt: number;
  endedAt?: number;
  saved: boolean;
  /** Engine build the game was started on. A game cannot continue on a different build. */
  engine: string;
  /** For each seat: the stats key of the human who started in it (null for bots). */
  playerKeys: (string | null)[];
  timer: number;
}

export interface RoomMeta {
  code: string;
  createdAt: number;
  lastActive: number;
  hostClient: string | null;
  status: 'lobby' | 'playing' | 'ended';
  seats: Seat[];
  options: RoomOptions;
  gameNumber: number;
  game: GameMeta | null;
  notice?: string;
}

interface StoredInput { i: Input; at: number; auto?: 1 }
interface Timers { deadlines: Record<number, number>; botDue: number | null; quiet: boolean }

/** Everything the stats writer needs about a finished game. */
export interface FinishedGame {
  id: string;
  roomCode: string;
  config: GameConfig;
  inputs: Input[];
  /** Indexes into `inputs` that the turn timer answered for a human seat. */
  auto: number[];
  startedAt: number;
  endedAt: number;
  playerKeys: (string | null)[];
  timer: number;
  engineVersion: string;
  tries?: number;
}

/**
 * One open connection. `clientId` is the player's identity at this table: it is set from the name,
 * which the Worker has already checked against the name's player code, so the same person on two
 * devices is one player in one seat.
 */
export interface Conn { id: string; clientId: string; name: string }

/** The identity a verified name gives a player at a table. */
export const identityOf = (name: string) => 'p:' + playerKey(name);

export interface Store {
  get<T>(key: string): Promise<T | undefined>;
  /** Entries whose key starts with `prefix`, in key order. */
  list<T>(prefix: string): Promise<Map<string, T>>;
  put(entries: Record<string, unknown>): void;
  delete(keys: string[]): void;
  deleteAll(): void;
}

export interface Hooks {
  send(connId: string, msg: ServerMsg): void;
  /** Ask to be woken (tick) at this time; null cancels. */
  setAlarm(at: number | null): void;
  now(): number;
  /** Write a finished game to the stats database. Resolves true once it is safely stored. */
  saveGame(game: FinishedGame): Promise<boolean>;
  randomSeed(): number;
  randomId(): string;
  engineVersion: string;
}

export const cleanName = (raw: unknown): string => String(raw ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
/** Stats tell players apart by name: the same name on any device is the same player. */
export const playerKey = (name: string): string => cleanName(name).toLowerCase();
const pad = (n: number) => String(n).padStart(6, '0');

export class RoomCore {
  meta: RoomMeta | null = null;
  game: Game | null = null;
  conns = new Map<string, Conn>();
  private stored: StoredInput[] = [];
  private timers: Timers = { deadlines: {}, botDue: null, quiet: false };
  private chat: ChatLine[] = [];
  private unsaved = new Map<string, FinishedGame>();
  private retryAt: number | null = null;
  /** Per connection: the log position already sent, so each update carries only new lines. */
  private sent = new Map<string, { game: number; seq: number }>();

  constructor(private store: Store, private hooks: Hooks) {}

  get exists() { return this.meta !== null; }

  // ---------------------------------------------------------------- loading

  async load() {
    this.meta = (await this.store.get<RoomMeta>('meta')) ?? null;
    if (!this.meta) return;
    for (const seat of this.meta.seats) if (seat.kind === 'human' && !seat.clientId?.startsWith('p:')) seat.clientId = identityOf(seat.name);
    if (this.meta.hostClient && !this.meta.hostClient.startsWith('p:')) this.meta.hostClient = null;
    this.chat = (await this.store.get<ChatLine[]>('chat')) ?? [];
    this.timers = (await this.store.get<Timers>('timers')) ?? { deadlines: {}, botDue: null, quiet: false };
    for (const [k, v] of await this.store.list<FinishedGame>('finished:')) this.unsaved.set(k.slice(9), v);
    if (this.unsaved.size) this.retryAt = this.hooks.now();
    const g = this.meta.game;
    if (g && this.meta.status !== 'lobby') {
      this.stored = [...(await this.store.list<StoredInput>('in:')).values()];
      try {
        if (g.engine !== this.hooks.engineVersion && this.meta.status === 'playing') throw new Error('engine changed');
        this.game = Game.replay(g.config, this.stored.map((r) => r.i));
      } catch {
        // The saved moves no longer replay (the rules were updated mid-game). Send the table back to the lobby.
        this.game = null;
        this.stored = [];
        this.meta.game = null;
        this.meta.status = 'lobby';
        this.meta.notice = 'The game was updated while this table was playing, so that game could not continue. Start a new one.';
        this.saveMeta();
      }
    }
  }

  init(code: string, hostClient: string) {
    const now = this.hooks.now();
    this.meta = {
      code, createdAt: now, lastActive: now, hostClient, status: 'lobby',
      seats: Array.from({ length: 4 }, () => ({ kind: 'open' as const, name: '' })),
      options: { twoSeeds: false, timer: DEFAULT_TIMER }, gameNumber: 0, game: null,
    };
    this.saveMeta();
  }

  // ---------------------------------------------------------------- connections

  /** Rebuild the connection table after the room wakes from hibernation. Sends nothing. */
  restore(conns: Conn[]) {
    for (const c of conns) this.conns.set(c.id, { ...c, clientId: identityOf(cleanName(c.name) || 'Guest') });
  }

  connect(conn: Conn) {
    const m = this.need();
    const wasEmpty = this.conns.size === 0;
    conn.name = cleanName(conn.name) || 'Guest';
    conn.clientId = identityOf(conn.name);
    this.conns.set(conn.id, conn);
    m.lastActive = this.hooks.now();
    let seat = this.seatOf(conn.clientId);
    if (seat === null) {
      // The same name from a new device takes over that seat when its old browser is gone.
      const key = playerKey(conn.name);
      const same = m.seats.findIndex((s) => s.kind === 'human' && playerKey(s.name) === key && !this.clientConnected(s.clientId, conn.id));
      if (same >= 0) { m.seats[same].clientId = conn.clientId; seat = same; }
    }
    if (seat === null && m.status === 'lobby') {
      const open = m.seats.findIndex((s) => s.kind === 'open');
      if (open >= 0) { this.sitAt(open, conn); seat = open; }
    }
    if (seat !== null) {
      const s = m.seats[seat];
      if (m.status === 'lobby') s.name = this.uniqueName(conn.name, seat);
      s.away = false;
      s.misses = 0;
      if (this.game) for (const d of this.game.waitingOn(seat)) delete this.timers.deadlines[d.id];
    }
    if (!m.hostClient || !this.clientConnected(m.hostClient)) {
      const firstSeated = m.seats.find((s) => s.kind === 'human' && this.clientConnected(s.clientId));
      m.hostClient = firstSeated?.clientId ?? conn.clientId;
    }
    if (wasEmpty) this.timers = { deadlines: {}, botDue: null, quiet: false };
    this.saveMeta();
    this.schedule();
    this.hooks.send(conn.id, { t: 'chat', lines: this.chat, reset: true });
    this.broadcast();
  }

  disconnect(connId: string) {
    const conn = this.conns.get(connId);
    this.conns.delete(connId);
    this.sent.delete(connId);
    if (!this.meta || !conn) return;
    const m = this.meta;
    m.lastActive = this.hooks.now();
    const seat = this.seatOf(conn.clientId);
    if (seat !== null && !this.clientConnected(conn.clientId) && this.game && !this.game.over) {
      // Their clock keeps running, but no longer than the grace period.
      const cap = this.hooks.now() + Math.min(DISCONNECTED_GRACE, m.options.timer * 1000);
      for (const d of this.game.waitingOn(seat)) {
        const cur = this.timers.deadlines[d.id];
        if (cur === undefined || cur > cap) this.timers.deadlines[d.id] = cap;
      }
    }
    if (m.hostClient === conn.clientId && !this.clientConnected(conn.clientId)) {
      const next = m.seats.find((s) => s.kind === 'human' && this.clientConnected(s.clientId));
      if (next?.clientId) m.hostClient = next.clientId;
    }
    this.saveMeta();
    this.schedule();
    this.broadcast();
  }

  // ---------------------------------------------------------------- messages

  handle(connId: string, raw: unknown) {
    const conn = this.conns.get(connId);
    if (!conn || !this.meta) return;
    const msg = raw as ClientMsg;
    try {
      this.dispatch(conn, msg);
    } catch (e) {
      if (e instanceof RuleError || e instanceof RoomError) this.hooks.send(connId, { t: 'error', message: e.message });
      else throw e;
    }
  }

  private dispatch(conn: Conn, msg: ClientMsg) {
    const m = this.need();
    const seat = this.seatOf(conn.clientId);
    const host = this.isHost(conn.clientId);
    const lobby = () => { if (m.status !== 'lobby') throw new RoomError('The game has already started.'); };
    const hostOnly = () => { if (!host) throw new RoomError('Only the host can do that.'); };
    m.lastActive = this.hooks.now();
    switch (msg?.t) {
      case 'ping':
        this.hooks.send(conn.id, { t: 'pong' });
        return;
      case 'chat': {
        const text = String(msg.text ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 300);
        if (!text) return;
        const line: ChatLine = { ts: this.hooks.now(), from: seat !== null ? m.seats[seat].name : `${conn.name} (watching)`, text };
        this.chat.push(line);
        if (this.chat.length > 100) this.chat.splice(0, this.chat.length - 100);
        this.store.put({ chat: this.chat });
        for (const c of this.conns.values()) this.hooks.send(c.id, { t: 'chat', lines: [line], reset: false });
        return;
      }
      case 'sit': {
        lobby();
        const target = m.seats[msg.seat];
        if (!target || target.kind !== 'open') throw new RoomError('That seat is taken.');
        if (seat !== null) m.seats[seat] = { kind: 'open', name: '' };
        this.sitAt(msg.seat, conn);
        break;
      }
      case 'stand':
        lobby();
        if (seat !== null) m.seats[seat] = { kind: 'open', name: '' };
        break;
      case 'seat': {
        lobby(); hostOnly();
        const target = m.seats[msg.seat];
        if (!target) throw new RoomError('No such seat.');
        if (msg.kind === 'bot') {
          if (target.kind !== 'open') throw new RoomError('That seat is taken.');
          const used = new Set(m.seats.map((s) => s.name));
          m.seats[msg.seat] = { kind: 'bot', name: BOT_NAMES.find((n) => !used.has(n)) ?? `Bot ${msg.seat + 1}` };
        } else m.seats[msg.seat] = { kind: 'open', name: '' };
        break;
      }
      case 'size': {
        lobby(); hostOnly();
        if (msg.seats === 4 && m.seats.length === 3) m.seats.push({ kind: 'open', name: '' });
        else if (msg.seats === 3 && m.seats.length === 4) {
          // Remove an empty seat if there is one, otherwise a bot. Never a person.
          let i = m.seats.map((s) => s.kind).lastIndexOf('open');
          if (i < 0) i = m.seats.map((s) => s.kind).lastIndexOf('bot');
          if (i < 0) throw new RoomError('Four people are seated. Someone has to stand up first.');
          m.seats.splice(i, 1);
        }
        break;
      }
      case 'options':
        lobby(); hostOnly();
        if (typeof msg.twoSeeds === 'boolean') m.options.twoSeeds = msg.twoSeeds;
        if (msg.timer !== undefined && (TIMER_CHOICES as readonly number[]).includes(msg.timer)) m.options.timer = msg.timer;
        break;
      case 'start':
        lobby(); hostOnly();
        this.start();
        return;
      case 'answer': {
        if (seat === null || !this.game || m.status !== 'playing') throw new RoomError('You are not playing in this game.');
        if (!Array.isArray(msg.choice) || msg.choice.some((c) => typeof c !== 'string')) throw new RoomError('Invalid choice.');
        const before = this.game.state.seq;
        this.game.answer(seat, Number(msg.id), msg.choice);
        this.cameBack(seat);
        this.afterInput(before, false);
        return;
      }
      case 'back':
        if (seat !== null) {
          this.cameBack(seat);
          if (this.game) for (const d of this.game.waitingOn(seat)) delete this.timers.deadlines[d.id];
        }
        break;
      case 'again':
        hostOnly();
        if (m.status !== 'ended') throw new RoomError('The game is still being played.');
        m.status = 'lobby';
        m.game = null;
        m.notice = undefined;
        this.game = null;
        this.stored = [];
        for (const s of m.seats) { s.away = false; s.misses = 0; }
        // Seats whose player has left are opened up for the next game.
        m.seats = m.seats.map((s) => (s.kind === 'human' && !this.clientConnected(s.clientId) ? { kind: 'open' as const, name: '' } : s));
        break;
      default:
        throw new RoomError('Unknown message.');
    }
    this.saveMeta();
    this.schedule();
    this.broadcast();
  }

  private start() {
    const m = this.need();
    if (m.seats.some((s) => s.kind === 'open')) throw new RoomError('Fill every seat with a player or a bot first, or switch to 3 players.');
    if (m.seats.length < 3 || m.seats.length > 4) throw new RoomError('The Open Game is for 3 or 4 players.');
    m.seats.forEach((s, i) => (s.name = this.uniqueName(s.name || `Player ${i + 1}`, i)));
    const config: GameConfig = {
      seed: this.hooks.randomSeed(), mode: 'open',
      players: m.seats.map((s) => ({ name: s.name, isBot: s.kind === 'bot' })),
      ...(m.options.twoSeeds ? { twoSeeds: true } : {}),
    };
    const old = this.stored.map((_, i) => 'in:' + pad(i));
    if (old.length) this.store.delete(old);
    this.stored = [];
    this.game = new Game(config);
    m.gameNumber++;
    m.status = 'playing';
    m.notice = undefined;
    m.game = {
      id: this.hooks.randomId(), config, startedAt: this.hooks.now(), saved: false, engine: this.hooks.engineVersion,
      playerKeys: m.seats.map((s) => (s.kind === 'human' ? playerKey(s.name) : null)), timer: m.options.timer,
    };
    for (const s of m.seats) { s.away = false; s.misses = 0; }
    this.timers = { deadlines: {}, botDue: null, quiet: false };
    this.saveMeta();
    this.schedule();
    this.broadcast();
  }

  // ---------------------------------------------------------------- the clock

  /** Called when the alarm fires: play bot turns and decisions whose time has run out. */
  tick() {
    if (!this.meta) return;
    const m = this.meta;
    const now = this.hooks.now();
    if (this.retryAt !== null && now >= this.retryAt) this.retrySaves();
    if (this.conns.size === 0 && now - m.lastActive > ROOM_TTL && !this.unsaved.size) {
      this.store.deleteAll();
      this.meta = null;
      this.game = null;
      this.hooks.setAlarm(null);
      return;
    }
    const g = this.game;
    if (!g || g.over || m.status !== 'playing' || this.conns.size === 0) { this.schedule(); return; }

    let moved = false;
    // Human decisions that ran out of time: a bot makes that one choice.
    for (const d of this.open()) {
      const seat = m.seats[d.seat];
      if (seat.kind === 'bot' || !this.stillOpen(d)) continue;
      const due = this.timers.deadlines[d.id];
      if (due === undefined || due > now) continue;
      this.autoAnswer(d, true);
      seat.misses = (seat.misses ?? 0) + 1;
      if (seat.misses >= MISSES_BEFORE_AWAY || !this.clientConnected(seat.clientId)) seat.away = true;
      moved = true;
      if (g.over) break;
    }
    if (!g.over && this.timers.botDue !== null && this.timers.botDue <= now) {
      this.timers.botDue = null;
      for (const d of this.open()) {
        if (m.seats[d.seat].kind !== 'bot' || !this.stillOpen(d)) continue;
        this.autoAnswer(d, false);
        moved = true;
        if (g.over) break;
      }
    }
    if (moved) this.saveMeta();
    this.schedule();
    if (moved) this.broadcast();
  }

  private autoAnswer(d: Decision, timedOut: boolean) {
    const g = this.game!;
    const before = g.state.seq;
    try {
      g.answer(d.seat, d.id, botAnswer(g.state, d));
    } catch {
      // A bot should never produce an illegal answer; if it does, take the first legal options so the table is not stuck.
      g.answer(d.seat, d.id, d.options.slice(0, Math.max(1, d.min)).map((o) => o.id));
    }
    this.record(before, timedOut);
  }

  /** Bookkeeping after any accepted input. */
  private afterInput(seqBefore: number, auto: boolean) {
    this.record(seqBefore, auto);
    this.saveMeta();
    this.schedule();
    this.broadcast();
  }

  private record(seqBefore: number, auto: boolean) {
    const g = this.game!;
    const m = this.need();
    const now = this.hooks.now();
    // The engine appended exactly one input.
    const index = g.inputs.length - 1;
    const row: StoredInput = { i: g.inputs[index], at: now, ...(auto ? { auto: 1 as const } : {}) };
    this.stored[index] = row;
    this.store.put({ ['in:' + pad(index)]: row });
    // Did the table see something happen? Then the next bot waits long enough for people to read it.
    this.timers.quiet = !g.state.log.some((e) => e.seq > seqBefore && e.visibility === 'public');
    if (g.over && m.status === 'playing') this.finish();
  }

  private finish() {
    const m = this.need();
    const gm = m.game!;
    m.status = 'ended';
    gm.endedAt = this.hooks.now();
    this.timers = { deadlines: {}, botDue: null, quiet: false };
    const done: FinishedGame = {
      id: gm.id, roomCode: m.code, config: gm.config, inputs: this.stored.map((r) => r.i),
      auto: this.stored.flatMap((r, i) => (r.auto ? [i] : [])), startedAt: gm.startedAt, endedAt: gm.endedAt,
      playerKeys: gm.playerKeys, timer: gm.timer, engineVersion: gm.engine,
    };
    this.unsaved.set(gm.id, done);
    this.store.put({ ['finished:' + gm.id]: done });
    this.trySave(done);
  }

  private trySave(done: FinishedGame) {
    done.tries = (done.tries ?? 0) + 1;
    this.hooks.saveGame(done).then((ok) => ok, () => false).then((ok) => {
      if (!this.meta) return;
      if (ok) {
        this.unsaved.delete(done.id);
        this.store.delete(['finished:' + done.id]);
        if (this.meta.game?.id === done.id) { this.meta.game.saved = true; this.saveMeta(); this.broadcast(); }
      } else if (done.tries! < SAVE_MAX_TRIES) {
        this.store.put({ ['finished:' + done.id]: done });
        this.retryAt = this.hooks.now() + SAVE_RETRY;
      }
      this.schedule();
    });
  }

  private retrySaves() {
    this.retryAt = null;
    for (const done of this.unsaved.values()) if ((done.tries ?? 0) < SAVE_MAX_TRIES) this.trySave(done);
  }

  /** Work out when the room next needs to wake, and set the alarm. */
  private schedule() {
    if (!this.meta) return;
    const m = this.meta;
    const now = this.hooks.now();
    let next: number | null = this.retryAt;
    const g = this.game;
    if (g && !g.over && m.status === 'playing' && this.conns.size > 0) {
      const open = this.open();
      const ids = new Set(open.map((d) => d.id));
      for (const k of Object.keys(this.timers.deadlines)) if (!ids.has(Number(k))) delete this.timers.deadlines[Number(k)];
      let bot = false;
      for (const d of open) {
        const seat = m.seats[d.seat];
        if (seat.kind === 'bot') { bot = true; continue; }
        const limit = seat.away ? AWAY_DELAY : this.clientConnected(seat.clientId) ? m.options.timer * 1000 : Math.min(DISCONNECTED_GRACE, m.options.timer * 1000);
        const cur = this.timers.deadlines[d.id];
        if (cur === undefined || (seat.away && cur > now + AWAY_DELAY)) this.timers.deadlines[d.id] = now + limit;
        const due = this.timers.deadlines[d.id];
        next = next === null ? due : Math.min(next, due);
      }
      if (bot) {
        if (this.timers.botDue === null) this.timers.botDue = now + (this.timers.quiet ? BOT_DELAY_QUIET : BOT_DELAY_SEEN);
        next = next === null ? this.timers.botDue : Math.min(next, this.timers.botDue);
      } else this.timers.botDue = null;
    } else {
      // Nobody is at the table (or no game is running): the clock stops.
      this.timers = { deadlines: {}, botDue: null, quiet: false };
      if (this.conns.size === 0) {
        const expiry = m.lastActive + ROOM_TTL + 1000;
        next = next === null ? expiry : Math.min(next, expiry);
      }
    }
    this.store.put({ timers: this.timers });
    this.hooks.setAlarm(next);
  }

  // ---------------------------------------------------------------- views

  /** Decisions still waiting for an answer. */
  private open(): Decision[] {
    const g = this.game;
    if (!g || g.over) return [];
    return g.pending.filter((d) => g.waitingOn(d.seat).includes(d));
  }
  private stillOpen(d: Decision) {
    const g = this.game!;
    return !g.over && g.pending.includes(d) && g.waitingOn(d.seat).includes(d);
  }

  publicRoom(): RoomPublic {
    const m = this.need();
    const hostSeat = m.hostClient ? this.seatOf(m.hostClient) : null;
    const seated = new Set(m.seats.map((s) => s.clientId).filter(Boolean));
    const watchers = new Set([...this.conns.values()].map((c) => c.clientId).filter((id) => !seated.has(id)));
    return {
      code: m.code, status: m.status,
      seats: m.seats.map((s) => ({ kind: s.kind, name: s.name, connected: s.kind === 'human' && this.clientConnected(s.clientId), away: !!s.away })),
      host: hostSeat, options: m.options, gameNumber: m.gameNumber, gameId: m.game?.id ?? null, saved: !!m.game?.saved,
      spectators: watchers.size, ...(m.notice ? { notice: m.notice } : {}),
    };
  }

  stateFor(conn: Conn): StateMsg {
    const m = this.need();
    const seat = this.seatOf(conn.clientId);
    const g = this.game;
    let view = null;
    let logReset = true;
    if (g) {
      view = viewFor(g.state, seat, this.open());
      const sent = this.sent.get(conn.id);
      if (sent && sent.game === m.gameNumber) {
        logReset = false;
        view.log = view.log.filter((e) => e.seq > sent.seq);
      }
      this.sent.set(conn.id, { game: m.gameNumber, seq: g.state.seq });
    } else this.sent.delete(conn.id);
    const waiting = new Map<number, number | null>();
    for (const d of this.open()) {
      const due = m.seats[d.seat].kind === 'bot' ? null : this.timers.deadlines[d.id] ?? null;
      const cur = waiting.get(d.seat);
      waiting.set(d.seat, cur == null ? due : due === null ? cur : Math.min(cur, due));
    }
    return {
      t: 'state', room: this.publicRoom(),
      you: { seat, isHost: this.isHost(conn.clientId), name: seat !== null ? m.seats[seat].name : conn.name },
      view, logReset, waiting: [...waiting].map(([s, deadline]) => ({ seat: s, deadline })), now: this.hooks.now(),
    };
  }

  private broadcast() {
    if (!this.meta) return;
    for (const c of this.conns.values()) this.hooks.send(c.id, this.stateFor(c));
  }

  // ---------------------------------------------------------------- helpers

  private need(): RoomMeta {
    if (!this.meta) throw new RoomError('This room does not exist.');
    return this.meta;
  }
  private saveMeta() { if (this.meta) this.store.put({ meta: this.meta }); }
  private seatOf(clientId: string | undefined): number | null {
    if (!clientId || !this.meta) return null;
    const i = this.meta.seats.findIndex((s) => s.kind === 'human' && s.clientId === clientId);
    return i < 0 ? null : i;
  }
  private clientConnected(clientId: string | undefined, exceptConn?: string) {
    if (!clientId) return false;
    for (const c of this.conns.values()) if (c.clientId === clientId && c.id !== exceptConn) return true;
    return false;
  }
  private isHost(clientId: string) {
    const m = this.need();
    if (m.hostClient && this.clientConnected(m.hostClient)) return m.hostClient === clientId;
    const firstSeated = m.seats.find((s) => s.kind === 'human' && this.clientConnected(s.clientId));
    return (firstSeated?.clientId ?? [...this.conns.values()][0]?.clientId) === clientId;
  }
  private sitAt(seat: number, conn: Conn) {
    this.need().seats[seat] = { kind: 'human', name: this.uniqueName(conn.name, seat), clientId: conn.clientId };
  }
  /** Two seats never share a name, so the log always says who did what. */
  private uniqueName(name: string, seat: number) {
    const m = this.need();
    const taken = new Set(m.seats.filter((_, i) => i !== seat).map((s) => s.name.toLowerCase()));
    const base = cleanName(name) || 'Guest';
    if (!taken.has(base.toLowerCase())) return base;
    for (let n = 2; ; n++) {
      const candidate = `${base.slice(0, 17)} ${n}`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
  }
  private cameBack(seat: number) {
    const s = this.need().seats[seat];
    s.away = false;
    s.misses = 0;
  }
}

export class RoomError extends Error {}
