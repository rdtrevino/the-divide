// Seat fairness: win share by starting seat (relative to the Day 1 first player) and Glory per Day by turn position.
// Usage: npx tsx seats.ts <games> <variant[,variant]> ...   ("base" = no variants)
import { Game, botAnswer } from '@divide/engine';
const N = Number(process.argv[2] ?? 6000);
const configs = process.argv.slice(3).length ? process.argv.slice(3) : ['base'];
const NAMES = ['Ada', 'Ben', 'Cy', 'Dee'];
const out: any[] = [];
for (const cfg of configs) {
  const variants = cfg === 'base' ? [] : cfg.split(',');
  const row: any = { config: cfg };
  for (const n of [3, 4]) {
    const win = Array(n).fill(0), glory = Array(n).fill(0), pos = Array(n).fill(0), last6 = Array(n).fill(0);
    for (let i = 0; i < N; i++) {
      const g = new Game({ seed: 300000 + i, mode: 'open', variants, players: NAMES.slice(0, n).map((name) => ({ name, isBot: true })) });
      const firsts: number[] = [];
      while (!g.over) {
        if (firsts[g.state.day] === undefined) firsts[g.state.day] = g.state.firstPlayer;
        for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, botAnswer(g.state, d));
      }
      const s = g.state, f1 = firsts[1];
      for (const p of s.players) {
        const k = (p.seat - f1 + n) % n;
        if (s.result!.winners.includes(p.seat)) win[k] += 1 / s.result!.winners.length;
        glory[k] += p.glory;
      }
      for (const e of s.stats) if (e.type === 'glory' && e.seat !== undefined && firsts[e.day] !== undefined) pos[(e.seat - firsts[e.day] + n) % n] += e.amount ?? 0;
    }
    const ratios = win.map((w) => +((w / N) * n).toFixed(3));
    row[`p${n}`] = {
      winRatioBySeat: ratios,
      seatGap: +(Math.max(...ratios) - Math.min(...ratios)).toFixed(3),
      avgGloryBySeat: glory.map((x) => +(x / N).toFixed(2)),
      dayGloryByPosition: pos.map((x) => +(x / (N * 6)).toFixed(2)),
    };
  }
  out.push(row);
  console.log(JSON.stringify(row));
}
