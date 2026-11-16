// The Durable Object for one game room. All the rules of a room live in roomCore.ts;
// this file connects it to WebSockets, storage, alarms and the stats database.
import { DurableObject } from 'cloudflare:workers';
import { ENGINE_VERSION } from './build.gen';
import { RoomCore, cleanName, type Conn, type Store } from './roomCore';
import { saveGame } from './stats';
import type { Env } from './index';

export class Room extends DurableObject<Env> {
  private core: RoomCore | null = null;
  private loading: Promise<RoomCore> | null = null;
  private sockets = new Map<string, WebSocket>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Keep-alive pings are answered without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private ready(): Promise<RoomCore> {
    return (this.loading ??= (async () => {
      const storage = this.ctx.storage;
      const store: Store = {
        get: (key) => storage.get(key),
        list: (prefix) => storage.list({ prefix }),
        // Not awaited on purpose: Durable Object storage keeps writes in order and holds outgoing
        // messages until they are safely stored.
        put: (entries) => void storage.put(entries),
        delete: (keys) => void storage.delete(keys),
        deleteAll: () => void storage.deleteAll(),
      };
      const core = new RoomCore(store, {
        send: (id, msg) => {
          try { this.sockets.get(id)?.send(JSON.stringify(msg)); } catch { /* the socket is closing */ }
        },
        setAlarm: (at) => void (at === null ? storage.deleteAlarm() : storage.setAlarm(at)),
        now: () => Date.now(),
        saveGame: async (game) => {
          try { return await saveGame(this.env.DB, game); } catch (e) { console.error('stats write failed', game.id, e); return false; }
        },
        randomSeed: () => crypto.getRandomValues(new Int32Array(1))[0],
        randomId: () => crypto.randomUUID(),
        engineVersion: ENGINE_VERSION,
      });
      await core.load();
      // After hibernation the sockets are still open; rebuild who is who from what each one carries.
      const conns: Conn[] = [];
      for (const ws of this.ctx.getWebSockets()) {
        const conn = ws.deserializeAttachment() as Conn | null;
        if (!conn) continue;
        this.sockets.set(conn.id, ws);
        conns.push(conn);
      }
      core.restore(conns);
      this.core = core;
      return core;
    })());
  }

  override async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const core = await this.ready();
    if (url.pathname.endsWith('/init') && req.method === 'POST') {
      if (core.exists) return new Response('exists', { status: 409 });
      const body = (await req.json()) as { code: string; clientId: string };
      core.init(body.code, String(body.clientId ?? ''));
      return Response.json({ code: body.code });
    }
    if (!core.exists) return Response.json({ error: 'No room with that code.' }, { status: 404 });
    if (url.pathname.endsWith('/info')) return Response.json(core.publicRoom());
    if (url.pathname.endsWith('/ws')) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket.', { status: 426 });
      const clientId = (url.searchParams.get('client') ?? '').slice(0, 64);
      if (clientId.length < 8) return new Response('Missing client id.', { status: 400 });
      const pair = new WebSocketPair();
      const conn: Conn = { id: crypto.randomUUID(), clientId, name: cleanName(url.searchParams.get('name')) };
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment(conn);
      this.sockets.set(conn.id, pair[1]);
      core.connect(conn);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    return new Response('Not found', { status: 404 });
  }

  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer) {
    const core = await this.ready();
    const conn = ws.deserializeAttachment() as Conn | null;
    if (!conn || typeof data !== 'string' || data.length > 4000) return;
    let msg: unknown;
    try { msg = JSON.parse(data); } catch { return; }
    core.handle(conn.id, msg);
  }

  override async webSocketClose(ws: WebSocket) { await this.gone(ws); }
  override async webSocketError(ws: WebSocket) { await this.gone(ws); }

  private async gone(ws: WebSocket) {
    const core = await this.ready();
    const conn = ws.deserializeAttachment() as Conn | null;
    if (!conn) return;
    this.sockets.delete(conn.id);
    core.disconnect(conn.id);
    try { ws.close(); } catch { /* already closed */ }
  }

  override async alarm() {
    (await this.ready()).tick();
  }
}
