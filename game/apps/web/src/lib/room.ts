// The live connection to a game room. Reconnects by itself and pieces the game log together
// from the updates the server sends.
import type { LogEntry } from '@divide/engine';
import type { ChatLine, ClientMsg, ServerMsg, StateMsg } from '@divide/protocol';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { clientId, codeFor } from './identity';

export interface RoomSnap {
  conn: 'connecting' | 'open' | 'reconnecting' | 'missing' | 'unverified';
  state: StateMsg | null;
  log: LogEntry[];
  /** Log lines that arrived with the latest update. Empty when the whole log was (re)loaded. */
  fresh: LogEntry[];
  chat: ChatLine[];
  error: { message: string; n: number } | null;
  /** Server clock minus this browser's clock, in ms. */
  skew: number;
  rev: number;
}

export class RoomClient {
  snap: RoomSnap = { conn: 'connecting', state: null, log: [], fresh: [], chat: [], error: null, skew: 0, rev: 0 };
  private ws: WebSocket | null = null;
  private listeners = new Set<() => void>();
  private closed = false;
  private retry = 0;
  private timer = 0;
  private ping = 0;
  private errors = 0;

  constructor(readonly code: string, private name: string) {
    void this.open();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private set(patch: Partial<RoomSnap>) {
    this.snap = { ...this.snap, ...patch, rev: this.snap.rev + 1 };
    this.listeners.forEach((l) => l());
  }

  private async open() {
    if (this.closed) return;
    try {
      const info = await fetch(`/api/rooms/${this.code}/info`);
      if (info.status === 404) { this.set({ conn: 'missing' }); return; }
    } catch { /* offline: fall through and let the socket retry */ }
    if (this.closed) return;
    const code = codeFor(this.name);
    if (!code) { this.set({ conn: 'unverified' }); return; }
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/api/rooms/${this.code}/ws?client=${encodeURIComponent(clientId())}&name=${encodeURIComponent(this.name)}&code=${encodeURIComponent(code)}`);
    let opened = false;
    this.ws = ws;
    ws.onopen = () => {
      opened = true;
      this.retry = 0;
      clearInterval(this.ping);
      this.ping = window.setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 20000);
    };
    ws.onmessage = (e) => {
      if (typeof e.data !== 'string' || e.data === 'pong') return;
      let msg: ServerMsg;
      try { msg = JSON.parse(e.data); } catch { return; }
      this.receive(msg);
    };
    ws.onclose = async () => {
      clearInterval(this.ping);
      if (this.closed || this.ws !== ws) return;
      // A refused connection may mean the name's code is no longer valid here: check before retrying.
      if (!opened) {
        const r = await fetch('/api/names', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: this.name, code: codeFor(this.name) }) }).catch(() => null);
        if (r && (r.status === 409 || r.status === 400)) { this.set({ conn: 'unverified' }); return; }
      }
      this.set({ conn: 'reconnecting' });
      this.timer = window.setTimeout(() => void this.open(), Math.min(8000, 600 * 2 ** this.retry++));
    };
    ws.onerror = () => ws.close();
  }

  private receive(msg: ServerMsg) {
    if (msg.t === 'state') {
      const incoming = msg.view?.log ?? [];
      const log = msg.logReset ? incoming : [...this.snap.log, ...incoming.filter((e) => !this.snap.log.length || e.seq > this.snap.log[this.snap.log.length - 1].seq)];
      this.set({ conn: 'open', state: msg, log, fresh: msg.logReset ? [] : incoming, skew: msg.now - Date.now() });
    } else if (msg.t === 'chat') {
      this.set({ chat: msg.reset ? msg.lines : [...this.snap.chat, ...msg.lines] });
    } else if (msg.t === 'error') {
      this.set({ error: { message: msg.message, n: ++this.errors } });
    }
  }

  send(msg: ClientMsg) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.closed = true;
    clearTimeout(this.timer);
    clearInterval(this.ping);
    this.ws?.close();
  }
}

export function useRoom(code: string, name: string): [RoomSnap, (msg: ClientMsg) => void] {
  const client = useMemo(() => new RoomClient(code, name), [code, name]);
  const [snap, setSnap] = useState(client.snap);
  useEffect(() => {
    setSnap(client.snap);
    const off = client.subscribe(() => setSnap(client.snap));
    return () => { off(); client.close(); };
  }, [client]);
  return [snap, (msg) => client.send(msg)];
}
