// Run one experiment for one variant and print a JSON line. The main modes spread their games over every core
// (../par.ts; WORKERS=1 for one); run.sh runs several variants side by side.
//   tsx exp.ts <variant> <mode> <N> [seed]
// modes: mc4, mc3 (all Monte Carlo), h4, h3 (all heuristic), skill4 (one MC among heuristics),
//        dumb4:<policy> (one fixed-strategy player among MC players), calib (target for 6.5 Days at 4p)
import { type Rules, rules } from './core';
import { play, runSet, runSetPar } from './lab';
import type { Policy } from './bots';
import { VARIANTS } from './variants';
import { pmap } from '../par';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [name, mode, nStr, seedStr] = process.argv.slice(2);
const N = Number(nStr ?? 200);
const seed = Number(seedStr ?? 1000);
const calib: Record<string, any> = existsSync('calib.json') ? JSON.parse(readFileSync('calib.json', 'utf8')) : {};
const base: Partial<Rules> = mode === 'calib' ? VARIANTS[name] : { ...calib[name], ...VARIANTS[name] };
if (!VARIANTS[name]) throw new Error('unknown variant ' + name);

function R(n: number, over: Partial<Rules> = {}) {
  const t = (base as any)[`target${n}`] ?? base.target;
  return rules({ ...base, n, ...(t ? { target: t } : {}), ...over });
}
const all = (pol: Policy, n: number) => () => Array(n).fill(pol) as Policy[];
const one = (pol: Policy, rest: Policy, n: number) => (i: number) => { const a: Policy[] = Array(n).fill(rest); a[i % n] = pol; return a; };

let out: any;
if (mode === 'mc4') out = await runSetPar(R(4), all('mc', 4), N, seed);
else if (mode === 'mc3') out = await runSetPar(R(3), all('mc', 3), N, seed);
else if (mode === 'mc5' || mode === 'mc6') { const k = Number(mode[2]); out = await runSetPar(R(k), all('mc', k), N, seed); }
else if (mode === 'h4') out = await runSetPar(R(4), all('heur', 4), N, seed);
else if (mode === 'h3') out = await runSetPar(R(3), all('heur', 3), N, seed);
else if (mode === 'skill4') out = await runSetPar(R(4), one('mc', 'heur', 4), N, seed, (i) => i % 4);
else if (mode === 'skill3') out = await runSetPar(R(3), one('mc', 'heur', 3), N, seed, (i) => i % 3);
else if (mode.startsWith('dumb4:')) out = await runSetPar(R(4), one(mode.slice(6) as Policy, 'mc', 4), N, seed, (i) => i % 4);
else if (mode === 'calib') {
  // Find the target for which all-heuristic 4-player games last closest to 6.5 Days (and 3-player to 8).
  const res: Record<string, number> = {};
  for (const n of [3, 4]) {
    const want = n === 4 ? 6.5 : 8;
    let best = 0, bd = 1e9;
    for (let t = 5; t <= 30; t++) {
      const m = runSet(rules({ ...base, n, target: t }), all('heur', n), 150, seed);
      if (Math.abs(m.days - want) < bd) { bd = Math.abs(m.days - want); best = t; }
      if (m.days > want + 1.5) break;
    }
    res[`target${n}`] = best;
  }
  out = res;
} else if (/^rows[3-6]$/.test(mode)) {
  // Reader data: every player's public record and true allegiance at each Evening, from all-Monte-Carlo games.
  const n = Number(mode[4]);
  const games = await pmap(N, (i) => play(R(n), Array(n).fill('mc'), seed + i * 7919).readerRows);
  const rows: number[][] = games.flatMap((g, i) => g.map((r) => [i, ...r]));
  writeFileSync(`results/rows-${name}-${n}p.json`, JSON.stringify(rows));
  out = { rows: rows.length };
} else if (mode === 'calibmc') {
  // Find the target for which all-Monte-Carlo games last closest to 7 Days at 4 players and 8 at 3.
  const res: Record<string, any> = {};
  for (const n of [3, 4]) {
    const want = n === 4 ? 7 : 8;
    const start = (base as any)[`target${n}`] ?? 10;
    let best = start, bd = 1e9; const tried: Record<number, number> = {};
    for (let t = Math.max(5, start - 4); t <= start + 2; t++) {
      const m = runSet(rules({ ...base, n, target: t }), all('mc', n), 70, seed + 99);
      tried[t] = +m.days.toFixed(2);
      if (Math.abs(m.days - want) < bd) { bd = Math.abs(m.days - want); best = t; }
      if (m.days > want + 1) break;
    }
    res[`target${n}`] = best; res[`tried${n}`] = tried;
  }
  out = res;
} else throw new Error('mode ' + mode);
console.log(JSON.stringify({ name, mode, N, ...out }));
