// What a Host card is worth, wherever it ends up. Paired games on the same seeds: in one, a player is dealt the card
// in their opening hand; in the other, a plain card of the same color and value with no ability. The difference in
// that player's win rate is the card's value, however it is used: Offered, Exalted, planted, spent or kept.
// Also records how the card was used, so each card can be judged by its role.
// STRONG=1: the tested player is the Monte Carlo bot (mc.ts); the rest of the table plays the heuristic.
// Usage: [STRONG=1] npx tsx card-value.ts <pairs per card> <worker> <workers> <out.json>
import { writeFileSync } from 'node:fs';
import { Game, HOST, HOSTS, OPEN_SET_ASIDE_HOSTS, botAnswer, strongAnswer } from '@divide/engine';
import type { GameState, HostDef } from '@divide/engine';

const PAIRS = Number(process.argv[2] ?? 400);
const WORKER = Number(process.argv[3] ?? 0);
const WORKERS = Number(process.argv[4] ?? 1);
const OUT = process.argv[5] ?? `card-value-${WORKER}.json`;
const STRONG = !!process.env.STRONG;

// Plain cards: a color and a value, no ability.
const plain = (h: HostDef) => {
  const col = h.alignment === 'dark' ? 'dark' : 'light';
  const v = h.value && h.value > 1 ? 2 : 1;
  const id = `host-plain-${col}-${v}`;
  if (!HOST[id]) HOST[id] = { ...h, id, name: `Plain ${col} +${v}`, text: '', alignment: col, value: v, cadence: '', oncePerGame: false };
  return id;
};

/** Swap card X with the first card of `seat`'s hand, wherever X is; optionally replace X by another card. */
function deal(s: GameState, seat: number, x: string, give: string) {
  const hand = s.players[seat].hand;
  const h0 = hand[0];
  if (h0 !== x) {
    const where: string[][] = [s.hostDeck, ...s.players.map((p) => p.hand)];
    let done = false;
    for (const zone of where) { const i = zone.indexOf(x); if (i >= 0) { zone[i] = h0; done = true; break; } }
    if (!done) for (const p of s.players) { const c = p.choir.find((c) => c.id === x); if (c) { c.id = h0; done = true; break; } }
    hand[0] = x;
  }
  hand[0] = give;
}

function play(seed: number, n: number, seat: number, x: string, give: string) {
  const g = new Game({ seed, mode: 'open', players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) }, { setup: (s) => deal(s, seat, x, give) });
  let steps = 0;
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, STRONG && d.seat === seat ? strongAnswer(g, d) : botAnswer(g.state, d));
    if (++steps > 20000) throw new Error('stall');
  }
  return g.state;
}

const cards = HOSTS.filter((h) => !OPEN_SET_ASIDE_HOSTS.includes(h.id)).filter((_, i) => i % WORKERS === WORKER);
const out: Record<string, unknown> = {};
for (const h of cards) {
  const alt = plain(h);
  let a = 0, b = 0, expected = 0;
  const use = { fruits: 0, offered: 0, exalted: 0, inChoirAtEnd: 0, othersHad: 0, activations: 0, glory: 0 };
  for (let i = 0; i < PAIRS; i++) {
    const n = i % 2 ? 4 : 3;
    const seat = i % n;
    const seed = 700000 + i * 13;
    const sa = play(seed, n, seat, h.id, h.id);
    const sb = play(seed, n, seat, h.id, alt);
    const share = (s: GameState) => (s.result!.winners.includes(seat) ? 1 / s.result!.winners.length : 0);
    a += share(sa); b += share(sb); expected += 1 / n;
    for (const e of sa.stats) {
      if (e.card === h.id && e.seat === seat && e.type === 'action') { if (e.source === 'fruits') use.fruits++; if (e.source === 'offer.card') use.offered++; if (e.source === 'exalt') use.exalted++; }
      if (e.card === h.id && e.type === 'activate') use.activations++;
      if (e.source === h.id && e.type === 'glory' && e.seat === seat && (e.amount ?? 0) > 0) use.glory += e.amount!;
      if (e.card === h.id && e.type === 'enter_choir' && e.seat !== seat) use.othersHad++;
    }
    if (sa.players[seat].choir.some((c) => c.id === h.id)) use.inChoirAtEnd++;
  }
  out[h.id] = { name: h.name, alignment: h.alignment, pairs: PAIRS, withCard: a / expected, withPlain: b / expected, delta: (a - b) / PAIRS, use: Object.fromEntries(Object.entries(use).map(([k, v]) => [k, +(v / PAIRS).toFixed(3)])) };
  process.stderr.write(`${h.name} ${((a - b) / PAIRS).toFixed(3)}\n`);
}
writeFileSync(OUT, JSON.stringify(out));
