// The Evening, shown after the fact. The server resolves the reveal, the Tide and the Reaping in one
// step, so this panel replays that Day's Altar and results from the log the engine wrote.
import type { GameView, LogEntry } from '@divide/engine';
import { useEffect } from 'preact/hooks';
import { Card } from '../components/Card';
import { nameOf } from '../lib/cards';
import { DIR_LABEL, altarNote, seatColor } from './bits';

interface TideData { tide: { dir: string; light: number; dark: number; margin: number }; event: string | null; altar: { id: string; offeredBy: number | null; kind?: string }[] }

const QUIET = new Set(['evening', 'tide', 'reveal', 'activate']);

export function Evening(p: { day: number; log: LogEntry[]; view: GameView; onClose: () => void }) {
  const lines = p.log.filter((e) => e.day === p.day);
  const start = lines.findIndex((e) => e.kind === 'evening');
  const tideEntry = lines.find((e) => e.kind === 'tide');
  const data = tideEntry?.data as TideData | undefined;
  // The Day is over once the next Day dawns or the game ends.
  const over = p.view.day > p.day || p.view.phase === 'ended';
  useEffect(() => {
    if (!over || p.view.phase === 'ended') return;
    const t = setTimeout(p.onClose, 16000);
    return () => clearTimeout(t);
  }, [over]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') p.onClose(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  if (!tideEntry || !data) return null;
  const before = lines.slice(start + 1, lines.indexOf(tideEntry)).filter((e) => !QUIET.has(e.kind));
  const after = lines.slice(lines.indexOf(tideEntry) + 1).filter((e) => !QUIET.has(e.kind) && e.kind !== 'end' && e.kind !== 'bonus');
  const { tide } = data;
  const total = Math.max(1, tide.light + tide.dark);
  return (
    <div class="evening" role="dialog" aria-label={`Evening of Day ${p.day}`}>
      <div class="evening-in panel">
        <div class="evening-head">
          <div class="eyebrow">Evening of Day {p.day}{data.event ? ` · ${nameOf(data.event)}` : ''}</div>
          <h2 class={`verdict ${tide.dir}`}>{tide.dir === 'neutral' ? 'The Tide is Neutral' : `The Tide runs ${DIR_LABEL[tide.dir]} by ${tide.margin}`}</h2>
        </div>
        <div class="scale">
          <span class="scale-n light num">{tide.light}<small>Light</small></span>
          <div class="scale-bar">
            <i class="light" style={{ width: `${(tide.light / total) * 100}%` }} />
            <i class="dark" style={{ width: `${(tide.dark / total) * 100}%` }} />
          </div>
          <span class="scale-n dark num">{tide.dark}<small>Dark</small></span>
        </div>
        <div class="evening-altar">
          {data.altar.map((a) => <Card id={a.id} w="var(--cw-evening)" compact owner={a.offeredBy} tag={a.kind === 'seed' ? 'Creation' : a.kind === 'relic' ? 'Eternity' : undefined} note={altarNote(a.kind, a.offeredBy !== null ? p.view.players[a.offeredBy]?.name ?? null : null)} />)}
          {!data.altar.length && <span class="muted">The Altar was empty.</span>}
        </div>
        <div class="evening-cols">
          {before.length > 0 && (
            <div>
              <div class="eyebrow">In the Evening</div>
              {before.map((e) => <div class="ev-line">{e.text}</div>)}
            </div>
          )}
          <div>
            <div class="eyebrow">The Reaping</div>
            {after.map((e) => <div class={`ev-line${/loses|lost|failed|wrong|broken/.test(e.text) ? ' loss' : /gain|came true|\+\d/.test(e.text) ? ' gain' : ''}`}>{e.text}</div>)}
            {!after.length && <div class="ev-line muted">{over ? 'No Glory changed hands.' : 'Players are choosing…'}</div>}
          </div>
          <div>
            <div class="eyebrow">Glory</div>
            {[...p.view.players].sort((a, b) => b.glory - a.glory).map((pl) => (
              <div class="ev-score"><span class="pp-dot" style={{ '--seat': seatColor(pl.seat) } as any} />{pl.name}<b class="num">{pl.glory}</b></div>
            ))}
          </div>
        </div>
        <div class="evening-foot">
          <button class="btn primary" onClick={p.onClose} autoFocus>{p.view.phase === 'ended' ? 'See the result' : over ? `On to Day ${p.view.day}` : 'Close'}</button>
        </div>
      </div>
    </div>
  );
}
