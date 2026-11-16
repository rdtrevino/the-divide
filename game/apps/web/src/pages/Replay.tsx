// One finished game, rebuilt in the browser from its seed and input log with the same rules engine.
import { Game, type GameConfig, type Input } from '@divide/engine';
import type { GameDetail } from '@divide/protocol';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Card } from '../components/Card';
import { Site } from '../components/Site';
import { Link } from '../lib/router';
import { DIR_LABEL, seatColor } from '../table/bits';

export function Replay(p: { id: string }) {
  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/games/${p.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'That game is not in the stats.' : 'The game could not be loaded.'))))
      .then((d) => setDetail(d as GameDetail))
      .catch((e) => setError(e.message));
  }, [p.id]);

  const replay = useMemo(() => {
    if (!detail) return null;
    try {
      const g = Game.replay(detail.config as GameConfig, detail.inputs as Input[]);
      const same = g.over && detail.players.every((x) => g.state.players[x.seat]?.glory === x.glory);
      return { state: g.state, same };
    } catch {
      return { state: null, same: false };
    }
  }, [detail]);

  if (error) return <Site><p class="error">{error}</p><Link href="/stats">Back to the stats</Link></Site>;
  if (!detail || !replay) return <Site><p class="muted">Loading…</p></Site>;
  const s = replay.state;
  const auto = new Set(detail.autoInputs);
  const timeouts = (detail.inputs as Input[]).reduce<Record<number, number>>((acc, input, i) => { if (auto.has(i) && input.t === 'answer') acc[input.seat] = (acc[input.seat] ?? 0) + 1; return acc; }, {});
  const days = s ? [...new Set(s.log.map((e) => e.day))] : [];
  return (
    <Site>
      <div class="page-head">
        <div>
          <div class="eyebrow">{new Date(detail.endedAt.replace(' ', 'T') + 'Z').toLocaleString()} · {detail.days} Days</div>
          <h1>Game record</h1>
        </div>
        <Link class="btn quiet" href="/stats">All stats</Link>
      </div>
      {!replay.same && <p class="banner warn">This game was played on an earlier version of the rules, so it cannot be replayed move by move. The final scores below are as recorded.</p>}
      <div class="replay-players">
        {detail.players.map((x) => {
          const pl = s?.players[x.seat];
          return (
            <div class={`replay-player panel${x.winShare > 0 ? ' won' : ''}`} style={{ '--seat': seatColor(x.seat) } as any}>
              <div class="replay-name"><span class="pp-dot" />{x.name}{x.isBot && <span class="pp-badge">bot</span>}{x.winShare > 0 && <span class="pp-first">winner</span>}<b class="num">{x.glory}</b></div>
              <div class="replay-cards">
                <Card id={x.celestial} w={74} compact />
                {replay.same && pl?.choir.map((c) => <Card id={c.id} w={74} compact spent={c.used} tag={c.facedown ? 'Facedown' : undefined} />)}
              </div>
              {replay.same && pl && pl.hand.length > 0 && <div class="replay-hand"><span class="eyebrow">Hand</span>{pl.hand.map((id) => <Card id={id} w={46} compact />)}</div>}
              {timeouts[x.seat] > 0 && <p class="muted small">The turn timer made {timeouts[x.seat]} choice{timeouts[x.seat] === 1 ? '' : 's'} for this seat.</p>}
            </div>
          );
        })}
      </div>
      {replay.same && s && (
        <section>
          <h2 class="rule"><span>The whole game</span></h2>
          <p class="muted">Every line, including the ones only one player could see at the time.</p>
          <div class="replay-days">
            {days.map((d) => {
              const tide = s.tides.find((t) => t.day === d);
              return (
                <details class="replay-day panel" open={d <= 1}>
                  <summary>
                    <b>{d === 0 ? 'Setup' : `Day ${d}`}</b>
                    {tide && <span class={`align ${tide.dir}`}>{DIR_LABEL[tide.dir]}{tide.dir !== 'neutral' ? ` by ${tide.margin}` : ''}</span>}
                  </summary>
                  <div class="log static">
                    {s.log.filter((e) => e.day === d).map((e) => (
                      <div class={`log-line k-${e.kind}${e.visibility === 'public' ? '' : ' private'}`}>
                        {e.visibility !== 'public' && <span class="log-private">{(e.visibility as number[]).map((x) => s.players[x].name).join(', ')} only</span>}
                        {e.text}
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}
    </Site>
  );
}
