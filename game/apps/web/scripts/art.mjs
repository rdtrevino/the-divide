// Makes the web-sized card illustrations in public/art from the full plates in the repository's art/plates.
// Run `npm run art -w @divide/web` after adding or changing a plate. The outputs are committed, so the
// site builds without the 19 MB of source plates.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../../../..');
const cards = JSON.parse(readFileSync(join(repo, 'cards/cards.json'), 'utf8'));
const sizes = { host: 640, celestial: 640, event: 1000 };
let made = 0;
const missing = [];
for (const [kind, list] of [['host', cards.hosts], ['celestial', cards.celestials], ['event', cards.events]]) {
  mkdirSync(join(here, '../public/art', kind), { recursive: true });
  for (const c of list) {
    const src = join(repo, c.plate ?? '');
    if (!c.plate || !existsSync(src)) { missing.push(c.name); continue; }
    await sharp(src).resize({ width: sizes[kind], withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(here, '../public/art', kind, `${c.id}.webp`));
    made++;
  }
}
console.log(`Wrote ${made} illustrations.`);
if (missing.length) console.log(`No plate yet (the site draws a placeholder): ${missing.join(', ')}`);
