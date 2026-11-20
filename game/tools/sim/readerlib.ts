// The reader shared by reader.ts and core.ts: what the table can see of each player, and a logistic model that
// guesses their side from it (vision principle 2). Public facts only: their Choir's Light and Dark cards, the Light and
// Dark cards they have put in it all game, tokens they have Offered and Gathered, the Light and Dark cards everyone saw them
// Offer (a variant: Offers from the Choir go face up), and the Day (kept last: exposure.ts reads it there).
import { HOST, type GameState } from '@divide/engine';

export const READER_FEATURES = ['choir Light', 'choir Dark', 'put in Light', 'put in Dark', 'tokens Offered', 'tokens Gathered', 'Offered Light, seen', 'Offered Dark, seen', 'Day'];
const color = (id?: string) => (id && HOST[id]?.alignment === 'dark' ? -1 : id && HOST[id] ? 1 : 0);

/** Follows a game and records a row per player (not evenly split) at every Evening: facts, 1 if Light-heavy, seat. */
export class ReaderLog {
  rows: number[][] = [];
  private put: number[][]; private shown: number[][]; private seen = 0; private day = 1;
  constructor(n: number) { this.put = Array.from({ length: n }, () => [0, 0]); this.shown = Array.from({ length: n }, () => [0, 0]); }
  /** Call after every answer. */
  update(s: GameState) {
    for (; this.seen < s.stats.length; this.seen++) {
      const e = s.stats[this.seen];
      if (e.type === 'action' && (e.source === 'exalt' || e.source === 'gather') && e.card) { const c = color(e.card); if (c) this.put[e.seat!][c > 0 ? 0 : 1]++; }
      if (e.type === 'action' && e.source === 'offer' && e.data?.choir) { const c = color((e.data.cards as string[])[0]); if (c) this.shown[e.seat!][c > 0 ? 0 : 1]++; }
    }
    if (s.day === this.day && s.phase !== 'ended') return;
    this.day = s.day;
    for (const p of s.players) {
      const l = p.tokens.filter((t) => t === 'light').length, d = p.tokens.length - l;
      if (l === d) continue;
      let off = 0, got = 0;
      for (const e of s.stats) if (e.seat === p.seat && e.type === 'action') { if (e.source === 'offer' && e.data?.token) off++; if (e.source === 'gather' && e.data?.token) got++; }
      const c = p.choir.filter((x) => !x.facedown);
      this.rows.push([c.filter((x) => color(x.id) > 0).length, c.filter((x) => color(x.id) < 0).length, this.put[p.seat][0], this.put[p.seat][1], off, got, this.shown[p.seat][0], this.shown[p.seat][1], s.day, l > d ? 1 : 0, p.seat]);
    }
  }
}

/** Fit on `train`, score on `test`: the share of rows whose side the reader names, and the model. */
/** `F`: how many leading columns are features (the side follows them); the standard reader uses READER_FEATURES. */
export function fitReader(train: number[][], test: number[][], F = READER_FEATURES.length) {
  const mu = Array.from({ length: F }, (_, j) => train.reduce((t, r) => t + r[j], 0) / train.length);
  const sd = Array.from({ length: F }, (_, j) => Math.sqrt(train.reduce((t, r) => t + (r[j] - mu[j]) ** 2, 0) / train.length) || 1);
  const z = (r: number[]) => r.slice(0, F).map((x, j) => (x - mu[j]) / sd[j]);
  let w = new Array<number>(F).fill(0), b = 0;
  for (let it = 0; it < 300; it++) {
    const gw = new Array<number>(F).fill(0); let gb = 0;
    for (const r of train) { const x = z(r), p = 1 / (1 + Math.exp(-(b + x.reduce((t, v, j) => t + v * w[j], 0)))); const e = p - r[F]; gb += e; x.forEach((v, j) => (gw[j] += e * v)); }
    w = w.map((v, j) => v - (0.5 * gw[j]) / train.length); b -= (0.5 * gb) / train.length;
  }
  const predict = (r: number[]) => (b + z(r).reduce((t, v, j) => t + v * w[j], 0) > 0 ? 1 : 0);
  const accuracy = (rows: number[][]) => (rows.length ? rows.filter((r) => predict(r) === r[F]).length / rows.length : NaN);
  const l = test.filter((r) => r[F] === 1).length / test.length;
  return { accuracy: accuracy(test), guessing: Math.max(l, 1 - l), accuracyOf: accuracy, weights: Object.fromEntries(w.map((x, j) => [READER_FEATURES[j] ?? `extra ${j - READER_FEATURES.length + 1}`, +(x / sd[j]).toFixed(3)])) };
}
