// Quick check that the lab runs and the bots are ordered: random < heuristic < Monte Carlo.
import { rules } from './core';
import { HEADER, fmt, runSet } from './lab';
import type { Policy } from './bots';

const N = Number(process.argv[2] ?? 100);
const R = rules({ n: 4 });
const t0 = Date.now();
console.log(HEADER);
console.log(fmt('V44 all heur', runSet(R, () => ['heur', 'heur', 'heur', 'heur'], N * 5, 1)));
console.log('time', Date.now() - t0, 'ms');
const t1 = Date.now();
const one = (pol: Policy, rest: Policy) => (i: number) => { const a: Policy[] = [rest, rest, rest, rest]; a[i % 4] = pol; return a; };
console.log(fmt('random among heur', runSet(R, one('random', 'heur'), N * 3, 2, (i) => i % 4)));
console.log(fmt('mc among heur', runSet(R, one('mc', 'heur'), N, 3, (i) => i % 4)));
console.log('time', Date.now() - t1, 'ms');
