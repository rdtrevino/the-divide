// Serves the website's files from Workers KV. This is the fallback used when the Worker was
// published without Cloudflare's static-assets upload (see scripts/deploy-kv.mjs). When the
// standard `assets` binding is present, index.ts uses that instead and this file is idle.
import type { Env } from './index';

interface Manifest { [path: string]: { k: string; t: string } }

let cached: { id: string; files: Manifest } | null = null;

export async function serveSite(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const id = env.SITE_MANIFEST;
  if (!env.SITE || !id) return new Response('The site files have not been published yet.', { status: 503 });
  if (cached?.id !== id) {
    const files = await env.SITE.get<Manifest>('manifest:' + id, 'json');
    if (!files) return new Response('The site files are missing.', { status: 503 });
    cached = { id, files };
  }
  const files = cached.files;
  let path = new URL(req.url).pathname;
  try { path = decodeURIComponent(path); } catch { /* keep the raw path */ }
  let file = files[path];
  if (!file) {
    // A page of the single-page site (/r/ABCDE, /stats): the app's index. A missing file stays a 404.
    if (/\.[a-z0-9]+$/i.test(path)) return new Response('Not found', { status: 404 });
    path = '/index.html';
    file = files[path];
    if (!file) return new Response('Not found', { status: 404 });
  }
  const etag = `"${file.k}"`;
  const headers = new Headers({
    'content-type': file.t,
    etag,
    // Vite's /assets files carry a content hash in their name and never change; the rest is revalidated.
    'cache-control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : path.endsWith('.html') ? 'no-cache' : 'public, max-age=86400',
    'x-content-type-options': 'nosniff',
  });
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  if (req.method === 'HEAD') return new Response(null, { headers });
  const body = await env.SITE.get('f:' + file.k, { type: 'stream', cacheTtl: 86400 });
  if (!body) return new Response('Not found', { status: 404 });
  return new Response(body, { headers });
}
