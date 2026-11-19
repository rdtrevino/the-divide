// Run a script's games on every core. The script calls `pmap(count, run)`; the same script is loaded again in worker
// threads, each of which plays its share of the indices and sends the results back. Every index is computed exactly
// as it would be alone (games are seeded by index), so the results, in index order, match a run on one core.
//
// In a worker, `pmap` never returns: code after it (printing, writing files) runs only in the main thread. Code before
// it runs in every worker too, so keep it to reading arguments and building inputs. One `pmap` call per script run:
// a worker finds its job by running the script up to that call.
//   WORKERS=1 forces a single thread (the reference run); by default one worker per core.
import { availableParallelism } from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

export const workerCount = () => Math.max(1, Number(process.env.WORKERS ?? availableParallelism()));

let calls = 0;

export async function pmap<T>(count: number, run: (i: number) => T, opts: { workers?: number; onProgress?: (done: number) => void } = {}): Promise<T[]> {
  if (++calls > 1) throw new Error('pmap: only one call per script run (workers find their job by running the script up to it).');
  if (!isMainThread && workerData?.__pmap) {
    const { w, W } = workerData.__pmap as { w: number; W: number };
    for (let i = w; i < count; i += W) parentPort!.postMessage({ i, r: run(i) });
    parentPort!.postMessage({ done: true });
    // Never settles, and stays alive until the main thread ends this worker, so the caller's later code never runs here.
    setInterval(() => {}, 1 << 30);
    return new Promise<T[]>(() => {});
  }
  const W = Math.min(count, opts.workers ?? workerCount());
  if (W <= 1) return Array.from({ length: count }, (_, i) => { const r = run(i); opts.onProgress?.(i + 1); return r; });
  const out = new Array<T>(count);
  let done = 0;
  const entry = process.argv[1];
  await Promise.all(Array.from({ length: W }, (_, w) => new Promise<void>((resolve, reject) => {
    const worker = new Worker(entry, { argv: process.argv.slice(2), execArgv: process.execArgv, workerData: { __pmap: { w, W } } });
    worker.on('message', (m: { i: number; r: T } | { done: true }) => {
      if ('done' in m) { void worker.terminate(); resolve(); return; }
      out[m.i] = m.r;
      opts.onProgress?.(++done);
    });
    worker.on('error', reject);
    worker.on('exit', (code) => (code === 0 || code === 1 ? resolve() : reject(new Error(`worker exited with ${code}`))));
  })));
  return out;
}
