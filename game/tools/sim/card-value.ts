// What a Host card's ability is worth. Paired games on the same seeds: in one, a player starts with the card in their
// Choir (in hand for Hymn, Lamentation and Parasite, which work from the hand); in the other, a plain card of the same
// color and value with no ability. The difference in that player's win rate is the card's value, however it is used:
// kept and activated, spent, discarded, stolen or planted.
// Also records how the card was used, so each card can be judged by its role.
// STRONG=1: the tested player is the Monte Carlo bot (mc.ts); the rest of the table plays the simulation bot (bot.ts).
// Usage: [STRONG=1] npx tsx card-value.ts <pairs per card> <worker> <workers> <out.json>
import { writeFileSync } from 'node:fs';
import { Game, HOST, HOSTS, OPEN_SET_ASIDE_HOSTS, STRONG as MC, strongAnswer } from '@divide/engine';
import { answer } from './bot';
import type { GameState, HostDef } from '@divide/engine';

const PAIRS = Number(process.argv[2] ?? 400);
const WORKER = Number(process.argv[3] ?? 0);
const WORKERS = Number(process.argv[4] ?? 1);
const OUT = process.argv[5] ?? `card-value-${WORKER}.json`;
const STRONG = !!process.env.STRONG;
if (process.env.ROLLOUTS) MC.rollouts = Number(process.env.ROLLOUTS);

// Plain cards: a color and a value, no ability.
const plain = (h: HostDef) => {
  const col = h.alignment === 'dark' ? 'dark' : 'light';
  const v = h.value && h.value > 1 ? 2 : 1;
  const id = `host-plain-${col}-${v}`;
  if (!HOST[id]) HOST[id] = { ...h, id, name: `Plain ${col} +${v}`, text: '', alignment: col, value: v, cadence: '', oncePerGame: false };
  return id;
};

/** Cards that do their work from the hand (Offered, or planted when Exalted); every other ability works from the Choir. */
const FROM_HAND = new Set(['host-hymn', 'host-lamentation', 'host-parasite']);

/** Give `seat` card X at the start (in their starting Choir, or in hand for FROM_HAND), swapping it with whatever was
 *  there so the deck is otherwise the same; then put `give` in X's place (X itself, or a plain card). */
function deal(s: GameState, seat: number, x: string, give: string) {
  const slot = FROM_HAND.has(x) ? { get: () => s.players[seat].hand[0], set: (c: string) => (s.players[seat].hand[0] = c) } : { get: () => s.players[seat].choir[0].id, set: (c: string) => (s.players[seat].choir[0].id = c) };
  const mine = slot.get();
  if (mine !== x) {
    let done = false;
    for (const zone of [s.hostDeck, ...s.players.map((p) => p.hand)]) { const i = zone.indexOf(x); if (i >= 0) { zone[i] = mine; done = true; break; } }
    if (!done) for (const p of s.players) { const c = p.choir.find((c) => c.id === x); if (c) { c.id = mine; done = true; break; } }
  }
  slot.set(give);
}

function play(seed: number, n: number, seat: number, x: string, give: string) {
  const g = new Game({ seed, mode: 'open', players: Array.from({ length: n }, (_, k) => ({ name: 'P' + k, isBot: true })) }, { setup: (s) => deal(s, seat, x, give) });
  let steps = 0;
  while (!g.over) {
    for (const d of [...g.pending]) if (g.pending.includes(d)) g.answer(d.seat, d.id, STRONG && d.seat === seat ? strongAnswer(g, d) : answer(g.state, d));
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
