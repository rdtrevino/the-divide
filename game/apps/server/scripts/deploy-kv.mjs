// Publishes the site with its files stored in Workers KV (see src/site.ts and wrangler.kv.jsonc).
// Build the website first (npm run build at the game root), then: node scripts/deploy-kv.mjs
// Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID, like any wrangler deploy.
// Only files that changed since the last publish are uploaded.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const server = join(here, '..');
const dist = join(server, '../web/dist');
const config = JSON.parse(readFileSync(join(server, 'wrangler.kv.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const ns = config.kv_namespaces[0].id;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
const wrangler = (args, opts = {}) => execFileSync('npx', ['wrangler', ...args], { cwd: server, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'], ...opts });

const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const manifest = {};
const blobs = new Map();
for (const file of walk(dist)) {
  const data = readFileSync(file);
  const k = createHash('sha256').update(data).digest('hex').slice(0, 24);
  manifest['/' + relative(dist, file).split('\\').join('/')] = { k, t: TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' };
  blobs.set(k, data);
}
if (!manifest['/index.html']) throw new Error('No built website found. Run `npm run build` at the game root first.');
const manifestJson = JSON.stringify(manifest);
const id = createHash('sha256').update(manifestJson).digest('hex').slice(0, 16);

const have = new Set(JSON.parse(wrangler(['kv', 'key', 'list', '--namespace-id', ns, '--prefix', 'f:', '--remote'])).map((x) => x.name));
const upload = [...blobs].filter(([k]) => !have.has('f:' + k)).map(([k, data]) => ({ key: 'f:' + k, value: data.toString('base64'), base64: true }));
upload.push({ key: 'manifest:' + id, value: manifestJson });
const tmp = join(mkdtempSync(join(tmpdir(), 'divide-site-')), 'bulk.json');
// Keep each request comfortably small.
for (let i = 0; i < upload.length; i += 40) {
  writeFileSync(tmp, JSON.stringify(upload.slice(i, i + 40)));
  wrangler(['kv', 'bulk', 'put', tmp, '--namespace-id', ns, '--remote'], { stdio: ['ignore', 'ignore', 'inherit'] });
}
console.log(`Site files: ${blobs.size} in this build, ${upload.length - 1} uploaded, manifest ${id}.`);
// Cloudflare sometimes asks a busy network to slow down (error 971); wait and try again.
for (let attempt = 1; ; attempt++) {
  try {
    execFileSync('npx', ['wrangler', 'deploy', '--config', 'wrangler.kv.jsonc', '--var', `SITE_MANIFEST:${id}`], { cwd: server, stdio: 'inherit' });
    break;
  } catch (e) {
    if (attempt >= 6) throw e;
    console.log(`Publish attempt ${attempt} failed. Waiting ${attempt * 30} seconds before trying again.`);
    await new Promise((r) => setTimeout(r, attempt * 30000));
  }
}
