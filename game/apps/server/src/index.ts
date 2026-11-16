// The Divide: the Worker. Serves the website, creates and routes to game rooms, and answers the stats API.
import { CARD_VERSION, ENGINE_VERSION } from './build.gen';
import { serveSite } from './site';
import { parseFilters, readGame, readStats } from './stats';

export { Room } from './room';

export interface Env {
  ROOM: DurableObjectNamespace;
  DB: D1Database;
  /** The website's files, when published with Cloudflare's static assets (the standard setup). */
  ASSETS?: Fetcher;
  /** The website's files in Workers KV, when published with scripts/deploy-kv.mjs. */
  SITE?: KVNamespace;
  SITE_MANIFEST?: string;
  /** The public address of the site, e.g. https://thedivide.pages.dev. */
  SITE_ORIGIN?: string;
}

// No I, L or O, so a code read aloud or typed from a phone is never ambiguous.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => ALPHABET[b % ALPHABET.length]).join('');
const json = (body: unknown, init: ResponseInit = {}) => Response.json(body, { ...init, headers: { 'cache-control': 'no-store', ...(init.headers ?? {}) } });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    // The site's address is SITE_ORIGIN (thedivide.pages.dev). Anyone who opens the Worker's own
    // workers.dev address is sent there, so there is only ever one link to share.
    if (env.SITE_ORIGIN && url.hostname.endsWith('.workers.dev')) return Response.redirect(env.SITE_ORIGIN + path + url.search, 301);
    if (!path.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(req) : serveSite(req, env);
    try {
      if (path === '/api/health') return json({ ok: true, engine: ENGINE_VERSION, cards: CARD_VERSION });

      if (path === '/api/rooms' && req.method === 'POST') {
        const body = (await req.json().catch(() => ({}))) as { clientId?: string };
        for (let attempt = 0; attempt < 6; attempt++) {
          const code = newCode();
          const stub = env.ROOM.get(env.ROOM.idFromName(code));
          const res = await stub.fetch('https://room/init', { method: 'POST', body: JSON.stringify({ code, clientId: body.clientId ?? '' }) });
          if (res.ok) return json({ code });
        }
        return json({ error: 'Could not create a room. Try again.' }, { status: 503 });
      }

      const room = path.match(/^\/api\/rooms\/([A-Za-z]{5})\/(ws|info)$/);
      if (room) {
        const stub = env.ROOM.get(env.ROOM.idFromName(room[1].toUpperCase()));
        return stub.fetch(new Request(`https://room/${room[2]}${url.search}`, req));
      }

      if (path === '/api/stats') return json(await readStats(env.DB, parseFilters(url.searchParams)));

      const game = path.match(/^\/api\/games\/([0-9a-f-]{36})$/);
      if (game) {
        const detail = await readGame(env.DB, game[1]);
        return detail ? json(detail) : json({ error: 'No such game.' }, { status: 404 });
      }
      return json({ error: 'Not found.' }, { status: 404 });
    } catch (e) {
      console.error(e);
      return json({ error: 'Something went wrong on the server.' }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
