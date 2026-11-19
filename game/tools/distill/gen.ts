// Training data for the learned bot: the strong bot's estimate of every option it tries, with the inputs the learned
// bot will see (learned.ts, encode). Games run on every core (../par.ts).
// Usage: npx tsx gen.ts <games> <out dir> [seed0] [teacher: name of a Strength preset below]
//   (Tried and dropped, November 19: the learned bot choosing the moves (DAgger), and a teacher whose playouts use the
//   learned bot. Neither made a stronger learned bot; see DECISIONS.md. Both are in the git history.)
//   Mixes 3 and 4 players; every third game is advanced (Celestials and Events); in every fourth game half the seats
//   are heuristic bots, so the teacher also learns positions against weaker play. The teacher plays one of the options
//   it tried at random 10% of the time, so the data covers more than its own best line.
import { mkdirSync, writeFileSync } from 'node:fs';
import { Game, botAnswer, encode, isSearched, searchScores, DECISION_FEATURES, OPTION_FEATURES, type Strength } from '@divide/engine';
import { pmap } from '../par';

const G = Number(process.argv[2] ?? 100), OUT = process.argv[3] ?? 'data/run', SEED0 = Number(process.argv[4] ?? 100000);
const TEACHERS: Record<string, Strength> = { data: { rollouts: 8, maxOptions: 10 }, wide: { rollouts: 16, maxOptions: 10 } };
const K: Strength = TEACHERS[process.argv[5] ?? 'data'];

function mulberry(seed: number) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const t0 = performance.now();
const games = await pmap(G, (i) => {
  const n = i % 2 ? 3 : 4, advanced = i % 3 === 2, seed = SEED0 + i, rnd = mulberry(seed * 31 + 7);
  const teacher = new Set(Array.from({ length: n }, (_, k) => k).filter((k) => i % 4 !== 3 || k % 2 === 0));
  const g = new Game({ seed, mode: 'open', advanced, players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) });
  const D: number[] = [], O: number[] = [], idx: number[] = [], y: number[] = [], meta: number[] = [];
  let decisions = 0, guard = 0;
  while (!g.over) {
    for (const d of [...g.pending]) {
      if (!g.pending.includes(d)) continue;
      if (!teacher.has(d.seat) || !isSearched(d)) { g.answer(d.seat, d.id, botAnswer(g.state, d)); continue; }
      const quick = botAnswer(g.state, d);
      const { ids, scores } = searchScores(g, d, K, quick);
      const enc = encode(g.state, d, quick[0]);
      D.push(...enc.decision);
      meta.push(i, ['action', 'offer.card', 'gather.source', 'exalt.card', 'firstFruits', 'judgment'].indexOf(d.tag), n, g.state.day, advanced ? 1 : 0, ids.length);
      ids.forEach((id, j) => { O.push(...enc.options[d.options.findIndex((o) => o.id === id)]); idx.push(decisions); y.push(scores[j]); });
      decisions++;
      let b = 0;
      for (let j = 1; j < ids.length; j++) if (scores[j] > scores[b]) b = j;
      if (rnd() < 0.1) b = Math.floor(rnd() * ids.length);
      g.answer(d.seat, d.id, [ids[b]]);
    }
    if (++guard > 20000) throw new Error('stalled');
  }
  return { D: new Float32Array(D), O: new Float32Array(O), idx: new Int32Array(idx), y: new Float32Array(y), meta: new Int32Array(meta), decisions };
}, { onProgress: (k) => { if (k % 50 === 0) console.error(`${k}/${G} games, ${((performance.now() - t0) / 1000).toFixed(0)} s`); } });

// Concatenate, renumbering each game's decisions.
let offset = 0;
const parts = { D: [] as Float32Array[], O: [] as Float32Array[], idx: [] as Int32Array[], y: [] as Float32Array[], meta: [] as Int32Array[] };
for (const r of games) {
  parts.D.push(r.D); parts.O.push(r.O); parts.y.push(r.y); parts.meta.push(r.meta);
  parts.idx.push(r.idx.map((x) => x + offset));
  offset += r.decisions;
}
const cat = <T extends Float32Array | Int32Array>(xs: T[], make: (n: number) => T) => { const out = make(xs.reduce((t, x) => t + x.length, 0)); let k = 0; for (const x of xs) { out.set(x as never, k); k += x.length; } return out; };
mkdirSync(OUT, { recursive: true });
const write = (name: string, a: Float32Array | Int32Array) => writeFileSync(`${OUT}/${name}.bin`, Buffer.from(a.buffer, a.byteOffset, a.byteLength));
write('D', cat(parts.D, (n) => new Float32Array(n))); write('O', cat(parts.O, (n) => new Float32Array(n)));
write('idx', cat(parts.idx, (n) => new Int32Array(n))); write('y', cat(parts.y, (n) => new Float32Array(n))); write('meta', cat(parts.meta, (n) => new Int32Array(n)));
const rows = parts.y.reduce((t, x) => t + x.length, 0);
writeFileSync(`${OUT}/info.json`, JSON.stringify({ games: G, seed0: SEED0, teacher: K, decisions: offset, rows, decisionFeatures: DECISION_FEATURES, optionFeatures: OPTION_FEATURES, meta: ['game', 'tag', 'players', 'day', 'advanced', 'options'], seconds: Math.round((performance.now() - t0) / 1000) }, null, 1));
console.log(JSON.stringify({ games: G, decisions: offset, rows, seconds: Math.round((performance.now() - t0) / 1000) }));
