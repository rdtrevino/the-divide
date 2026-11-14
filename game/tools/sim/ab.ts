// A/B test balance variants against the current rules on identical seeds.
// Usage: npx tsx ab.ts --games 20000 --variants arbiter-catchup,confession-pure
import { cardName, playBotGame } from '@divide/engine';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : [])).filter((x) => x.length));
const GAMES = Number(args.games ?? 20000);
const VARIANTS = String(args.variants ?? '').split(',').filter(Boolean);
const COUNTS = String(args.players ?? '3,4').split(',').map(Number);
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fin'];

function run(variants: string[]) {
  const win: Record<string, { w: number; e: number }> = {};
  const src: Record<string, number> = {};
  const add = (k: string, w: number, e: number) => { const a = (win[k] ??= { w: 0, e: 0 }); a.w += w; a.e += e; };
  for (let g = 0; g < GAMES; g++) {
    const n = COUNTS[g % COUNTS.length];
    const s = playBotGame({ seed: 100000 + g, mode: 'open', variants, players: NAMES.slice(0, n).map((name) => ({ name, isBot: true })) }).state;
    const res = s.result!;
    for (const p of s.players) {
      const w = res.winners.includes(p.seat) ? 1 / res.winners.length : 0;
      add(p.celestial, w, 1 / n);
      for (const c of p.choir) if (!c.facedown) add(c.id, w, 1 / n);
    }
    for (const e of s.stats) if (e.type === 'glory' && e.source && (e.amount ?? 0) > 0 && !['offer', 'reaping', 'bonus', 'gift', 'arbiter'].includes(e.source)) src[e.source] = (src[e.source] ?? 0) + e.amount!;
  }
  return { win, src };
}
const ratio = (r: ReturnType<typeof run>, k: string) => (r.win[k] ? r.win[k].w / r.win[k].e : NaN);
const base = run([]);
const watch = ['celestial-the-arbiter', 'host-confession', 'host-covenant', 'host-heresy', 'host-raguel', 'celestial-the-patron', 'celestial-the-eclipse', 'host-leviathan'];
console.log(`Baseline (${GAMES} games, ${COUNTS.join('/')}p)`);
for (const k of watch) console.log(`  ${cardName(k).padEnd(16)} win ratio ${ratio(base, k).toFixed(2)}   Glory/game from ability ${((base.src[k] ?? 0) / GAMES).toFixed(2)}`);
for (const v of VARIANTS) {
  const r = run(v.split("+"));
  console.log(`\nVariant: ${v}`);
  for (const k of watch) {
    const b = ratio(base, k), x = ratio(r, k);
    if (Math.abs(x - b) >= 0.03 || ((r.src[k] ?? 0) !== (base.src[k] ?? 0))) console.log(`  ${cardName(k).padEnd(16)} ${b.toFixed(2)} -> ${x.toFixed(2)}   Glory/game ${((base.src[k] ?? 0) / GAMES).toFixed(2)} -> ${((r.src[k] ?? 0) / GAMES).toFixed(2)}`);
  }
}
