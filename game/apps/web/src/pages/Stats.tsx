// Balance stats from real games: which cards and Celestials win more or less than their share.
import type { CardStats, GameSummary, Ratio, StatsResponse } from '@divide/protocol';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Site } from '../components/Site';
import { CELESTIAL, EVENT, HOST, OPEN_HOSTS, nameOf } from '../lib/cards';
import { Link } from '../lib/router';
import bots from '../data/bot-baseline.json';

const LOW = 0.75;
const HIGH = 1.25;
/** Below this many seats a win ratio is mostly luck. */
const THIN = 12;
const botCards = bots.cards as Record<string, number>;
const botCelestials = bots.celestials as Record<string, number>;

const ratioOf = (r: Ratio | null | undefined) => (r && r.expected > 0 ? r.wins / r.expected : null);
const fmt = (n: number | null | undefined, d = 2) => (n === null || n === undefined || Number.isNaN(n) ? '–' : n.toFixed(d));

/** A win ratio on a 0 to 2 scale: the shaded band is the 0.75 to 1.25 target, the dot is real games, the tick is the bots. */
function RatioMark(p: { value: number | null; n: number; bot?: number; label: string }) {
  if (p.value === null) return <span class="muted">no games yet</span>;
  const x = (v: number) => `${Math.min(100, Math.max(0, (v / 2) * 100))}%`;
  const tone = p.value > HIGH ? 'high' : p.value < LOW ? 'low' : 'ok';
  const thin = p.n < THIN;
  return (
    <span class="ratio" title={`${p.label}: win ratio ${p.value.toFixed(2)} over ${p.n} seat${p.n === 1 ? '' : 's'}${p.bot !== undefined ? `. Bots: ${p.bot.toFixed(2)}` : ''}${thin ? '. Too few games to trust yet.' : ''}`}>
      <span class="ratio-track">
        <i class="ratio-band" style={{ left: x(LOW), width: `${((HIGH - LOW) / 2) * 100}%` }} />
        <i class="ratio-mid" style={{ left: x(1) }} />
        {p.bot !== undefined && <i class="ratio-bot" style={{ left: x(p.bot) }} />}
        <i class={`ratio-dot ${tone}${thin ? ' thin' : ''}`} style={{ left: x(p.value) }} />
      </span>
      <b class="num">{p.value.toFixed(2)}</b>
      {tone !== 'ok' && !thin && <span class={`flag ${tone}`}>{tone === 'high' ? '▲ strong' : '▼ weak'}</span>}
      {thin && <span class="flag thin">few games</span>}
    </span>
  );
}

type SortKey = 'name' | 'ratio' | 'bot' | 'n' | 'days' | 'perDay' | 'fruits' | 'offered' | 'gathered' | 'exalted' | 'kept' | 'activations' | 'glory';

interface Row extends CardStats { name: string; ratio: number | null; n: number; bot: number | undefined; kept: number | null; perDayDiff: number | null }

export function Stats() {
  const [version, setVersion] = useState('');
  const [players, setPlayers] = useState('');
  const [seats, setSeats] = useState<'all' | 'human' | 'bot'>('all');
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'ratio', dir: -1 });

  useEffect(() => {
    let live = true;
    const q = new URLSearchParams();
    if (version) q.set('version', version);
    if (players) q.set('players', players);
    q.set('seats', seats);
    fetch(`/api/stats?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('The stats could not be loaded.'))))
      .then((d) => { if (live) { setData(d as StatsResponse); setError(''); } })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [version, players, seats]);

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const byCard = new Map(data.cards.map((c) => [c.card, c]));
    const base = data.summary.baselineGloryPerDay;
    const all = OPEN_HOSTS.map((h): Row => {
      const c = byCard.get(h.id) ?? { card: h.id, finalChoir: null, choirDays: 0, gloryPerDay: null, fruits: 0, offered: 0, gathered: 0, exalted: 0, activations: 0, negated: 0, abilityGlory: 0 };
      const taken = c.gathered + c.exalted;
      const seen = taken + c.offered + c.fruits;
      return { ...c, name: h.name, ratio: ratioOf(c.finalChoir), n: c.finalChoir?.n ?? 0, bot: botCards[h.id], kept: seen ? taken / seen : null, perDayDiff: c.gloryPerDay !== null && base !== null ? c.gloryPerDay - base : null };
    });
    const val = (r: Row): number | string | null => ({ name: r.name, ratio: r.ratio, bot: r.bot ?? null, n: r.n, days: r.choirDays, perDay: r.perDayDiff, fruits: r.fruits, offered: r.offered, gathered: r.gathered, exalted: r.exalted, kept: r.kept, activations: r.activations, glory: r.abilityGlory }[sort.key]);
    return all.sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (x === null && y === null) return a.name.localeCompare(b.name);
      if (x === null) return 1;
      if (y === null) return -1;
      return (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * sort.dir || a.name.localeCompare(b.name);
    });
  }, [data, sort]);

  const Th = (p: { k: SortKey; children: any; title?: string; class?: string }) => (
    <th class={`${p.class ?? ''} sortable${sort.key === p.k ? ' on' : ''}`} title={p.title} aria-sort={sort.key === p.k ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
      <button onClick={() => setSort({ key: p.k, dir: sort.key === p.k ? (sort.dir === 1 ? -1 : 1) : p.k === 'name' ? 1 : -1 })}>{p.children}{sort.key === p.k ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}</button>
    </th>
  );

  const s = data?.summary;
  return (
    <Site wide>
      <div class="page-head">
        <div>
          <div class="eyebrow">From every game played on this site</div>
          <h1>Stats</h1>
        </div>
        <div class="filters">
          <label>Card version
            <select class="field" value={data?.filters.version ?? version} onChange={(e) => setVersion((e.target as HTMLSelectElement).value)}>
              {!data?.versions.length && <option value="">{data?.filters.version ?? 'Current'}</option>}
              {data?.versions.map((v) => <option value={v.version}>{v.version} ({v.games} game{v.games === 1 ? '' : 's'})</option>)}
            </select>
          </label>
          <label>Players
            <select class="field" value={players} onChange={(e) => setPlayers((e.target as HTMLSelectElement).value)}>
              <option value="">3 and 4</option><option value="3">3 players</option><option value="4">4 players</option>
            </select>
          </label>
          <label>Seats counted
            <select class="field" value={seats} onChange={(e) => setSeats((e.target as HTMLSelectElement).value as any)}>
              <option value="all">People and bots</option><option value="human">People only</option><option value="bot">Bots only</option>
            </select>
          </label>
        </div>
      </div>
      {error && <p class="error">{error}</p>}
      {!data && !error && <p class="muted">Loading…</p>}
      {data && s && (
        <>
          <div class="tiles">
            <div class="tile panel"><small>Games</small><b class="num">{s.games}</b><span>{s.humanSeats} of {s.seats} seats played by people</span></div>
            <div class="tile panel"><small>Average length</small><b class="num">{fmt(s.avgDays, 1)}</b><span>Days (bots average 6.2)</span></div>
            <div class="tile panel"><small>Winning Glory</small><b class="num">{fmt(s.avgWinningGlory, 1)}</b><span>average for the winner; {fmt(s.avgGlory, 1)} for everyone</span></div>
            <div class="tile panel"><small>Glory per Day</small><b class="num">{fmt(s.baselineGloryPerDay, 2)}</b><span>average for one player in one Day</span></div>
            <div class="tile panel"><small>Shared wins</small><b class="num">{s.sharedWins}</b><span>games that ended in a tie</span></div>
          </div>

          <div class="howto panel">
            <p><b>How to read this.</b> A <b>win ratio</b> is wins divided by the wins expected by chance, so 1.00 is fair. The target is every card and Celestial between {LOW} and {HIGH}.</p>
            <p class="ratio-legend">
              <span><span class="ratio-track demo"><i class="ratio-band" style={{ left: '37.5%', width: '25%' }} /><i class="ratio-mid" style={{ left: '50%' }} /><i class="ratio-bot" style={{ left: '56%' }} /><i class="ratio-dot ok" style={{ left: '44%' }} /></span></span>
              <span><i class="key dot" /> real games on this site</span>
              <span><i class="key tick" /> the same measure from {bots.games.toLocaleString()} all-bot games ({bots.version})</span>
              <span><i class="key band" /> target range</span>
            </p>
            {s.games < 40 && <p class="muted">With {s.games} game{s.games === 1 ? '' : 's'}, most of what you see here is still luck. A card needs roughly {THIN} or more final Choirs before its ratio means much; until then the bot tick and the “Glory per Day” column (which counts every Day a card was held, not only the last) are the steadier guides.</p>}
          </div>

          <section>
            <h2 class="rule"><span>Celestials</span></h2>
            <div class="table-wrap">
              <table class="stats">
                <thead><tr><th>Celestial</th><th class="r">Seats</th><th>Win ratio</th><th class="r">Bots</th><th class="r">Avg Glory</th><th class="r" title="Times the power was used">Uses</th><th class="r" title="Glory the power itself produced">Glory from power</th></tr></thead>
                <tbody>
                  {Object.keys(CELESTIAL).map((id) => {
                    const c = data.celestials.find((x) => x.card === id);
                    return (
                      <tr>
                        <td><span class="cardname" data-zoom={id}>{nameOf(id)}</span></td>
                        <td class="r num">{c?.ratio.n ?? 0}</td>
                        <td><RatioMark value={ratioOf(c?.ratio)} n={c?.ratio.n ?? 0} bot={botCelestials[id]} label={nameOf(id)} /></td>
                        <td class="r num muted">{fmt(botCelestials[id])}</td>
                        <td class="r num">{c ? fmt(c.ratio.avgGlory, 1) : '–'}</td>
                        <td class="r num">{c?.activations ?? 0}</td>
                        <td class="r num">{c?.abilityGlory ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 class="rule"><span>Host cards</span></h2>
            <p class="muted">Click a column to sort. Hover a card name to see the card.</p>
            <div class="table-wrap">
              <table class="stats cards-table">
                <thead>
                  <tr>
                    <Th k="name">Card</Th>
                    <Th k="n" class="r" title="Seats that ended the game with this card face up in their Choir">Final Choirs</Th>
                    <Th k="ratio" title="Win ratio of players who ended the game with this card in their Choir">Win ratio</Th>
                    <Th k="bot" class="r" title="The same win ratio in all-bot games">Bots</Th>
                    <Th k="days" class="r" title="Days this card sat face up in a Choir when the Reaping was over">Days held</Th>
                    <Th k="perDay" class="r" title="Glory its holder made on those Days, compared with the average player-Day">Glory per Day vs average</Th>
                    <Th k="fruits" class="r" title="Times given as First Fruits">First Fruits</Th>
                    <Th k="offered" class="r" title="Times Offered to the Altar">Offered</Th>
                    <Th k="gathered" class="r" title="Times Gathered into a Choir">Gathered</Th>
                    <Th k="exalted" class="r" title="Times Exalted from a hand into a Choir">Exalted</Th>
                    <Th k="kept" class="r" title="Share of plays that put the card into a Choir (Gathered or Exalted) rather than onto the Altar. High means players want it in their Choir.">Kept</Th>
                    <Th k="activations" class="r" title="Times its ability was activated (and times Silence negated it)">Activated</Th>
                    <Th k="glory" class="r" title="Glory its ability produced directly">Glory from ability</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr>
                      <td><i class={`adot ${HOST[r.card]?.alignment}`} /><span class="cardname" data-zoom={r.card}>{r.name}</span></td>
                      <td class="r num">{r.n}</td>
                      <td><RatioMark value={r.ratio} n={r.n} bot={r.bot} label={r.name} /></td>
                      <td class="r num muted">{fmt(r.bot)}</td>
                      <td class="r num">{r.choirDays}</td>
                      <td class="r num">{r.perDayDiff === null ? '–' : <span title={`${fmt(r.gloryPerDay)} Glory per Day over ${r.choirDays} Days; the average is ${fmt(s.baselineGloryPerDay)}`}>{r.perDayDiff > 0 ? '+' : r.perDayDiff < 0 ? '−' : ''}{Math.abs(r.perDayDiff).toFixed(2)}</span>}</td>
                      <td class="r num">{r.fruits}</td>
                      <td class="r num">{r.offered}</td>
                      <td class="r num">{r.gathered}</td>
                      <td class="r num">{r.exalted}</td>
                      <td class="r num">{r.kept === null ? '–' : `${Math.round(r.kept * 100)}%`}</td>
                      <td class="r num">{r.activations}{r.negated > 0 && <span class="muted"> ({r.negated} negated)</span>}</td>
                      <td class="r num">{r.abilityGlory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div class="stats-cols">
            <section>
              <h2 class="rule"><span>Players</span></h2>
              <table class="stats">
                <thead><tr><th>Player</th><th class="r">Games</th><th class="r">Wins</th><th class="r">Win rate</th><th class="r">Avg Glory</th></tr></thead>
                <tbody>
                  {data.players.map((p) => <tr><td>{p.name}</td><td class="r num">{p.games}</td><td class="r num">{fmt(p.wins, p.wins % 1 ? 1 : 0)}</td><td class="r num">{Math.round((p.wins / p.games) * 100)}%</td><td class="r num">{fmt(p.avgGlory, 1)}</td></tr>)}
                  {!data.players.length && <tr><td colSpan={5} class="muted">No games with people yet.</td></tr>}
                </tbody>
              </table>
            </section>
            <section>
              <h2 class="rule"><span>Turn order</span></h2>
              <table class="stats">
                <thead><tr><th>Seat on Day 1</th><th class="r">Seats</th><th>Win ratio</th></tr></thead>
                <tbody>
                  {data.turnOrder.map((t) => <tr><td>{['First', 'Second', 'Third', 'Fourth'][t.order] ?? t.order + 1} to act</td><td class="r num">{t.n}</td><td><RatioMark value={t.expected ? t.wins / t.expected : null} n={t.n} label={`Acting ${t.order + 1}`} /></td></tr>)}
                  {!data.turnOrder.length && <tr><td colSpan={3} class="muted">No games yet.</td></tr>}
                </tbody>
              </table>
              <h2 class="rule"><span>Tides</span></h2>
              <p class="tide-counts">{['light', 'neutral', 'dark'].map((d) => <span class={`align ${d}`}>{d[0].toUpperCase() + d.slice(1)} {data.tides.find((t) => t.dir === d)?.n ?? 0}</span>)}</p>
            </section>
            <section>
              <h2 class="rule"><span>Events</span></h2>
              <table class="stats">
                <thead><tr><th>Event</th><th class="r">Days</th><th class="r" title="Average Glory one player made on a Day with this Event">Glory per player</th></tr></thead>
                <tbody>
                  {data.events.map((e) => <tr><td><span class="cardname" data-zoom={e.card}>{EVENT[e.card]?.name ?? e.card}</span></td><td class="r num">{e.n}</td><td class="r num">{fmt(e.avgSwing)}</td></tr>)}
                  {!data.events.length && <tr><td colSpan={3} class="muted">No games yet.</td></tr>}
                </tbody>
              </table>
            </section>
          </div>

          <section>
            <h2 class="rule"><span>Recent games</span></h2>
            <div class="recent">
              {data.recent.map((g) => <GameLine g={g} />)}
              {!data.recent.length && <p class="muted">No finished games yet. <Link href="/">Start a table</Link> and the first one will appear here.</p>}
            </div>
          </section>
        </>
      )}
    </Site>
  );
}

export function GameLine(p: { g: GameSummary }) {
  const { g } = p;
  return (
    <Link href={`/game/${g.id}`} class="recent-game panel">
      <span class="recent-when">{new Date(g.endedAt.replace(' ', 'T') + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}<small>{g.days} Days · {g.cardVersion}</small></span>
      <span class="recent-players">
        {g.players.map((x) => (
          <span class={x.winShare > 0 ? 'won' : ''}>{x.winShare > 0 && '★ '}{x.name}{x.isBot ? ' (bot)' : ''} <b class="num">{x.glory}</b><small>{nameOf(x.celestial).replace('The ', '')}</small></span>
        ))}
      </span>
    </Link>
  );
}
