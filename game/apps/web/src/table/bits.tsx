// Small pieces of the table: countdowns, the Glory track, the Tide record, player status notes.
import type { GameView } from '@divide/engine';
import { useEffect, useState } from 'preact/hooks';
import { nameOf } from '../lib/cards';

export const seatColor = (seat: number) => `var(--seat-${seat % 4})`;
export const DIR_LABEL: Record<string, string> = { light: 'Light', dark: 'Dark', neutral: 'Neutral' };

/** Seconds left until a server-clock deadline. */
export function useCountdown(deadline: number | null, skew: number): number | null {
  const [, tick] = useState(0);
  useEffect(() => {
    if (deadline === null) return;
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, [deadline]);
  if (deadline === null) return null;
  return Math.max(0, Math.ceil((deadline - (Date.now() + skew)) / 1000));
}

export function Countdown(p: { deadline: number | null; skew: number; class?: string }) {
  const s = useCountdown(p.deadline, p.skew);
  if (s === null) return null;
  return <span class={`countdown num${s <= 15 ? ' low' : ''} ${p.class ?? ''}`} data-tip="Time left for this choice. When it runs out, a bot makes it">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>;
}

/** The race to 12: one marker per player on a track to the target. */
export function GloryTrack(p: { view: GameView; target: number }) {
  const max = Math.max(p.target, ...p.view.players.map((x) => x.glory));
  return (
    <div class="track" role="img" aria-label={`Glory: ${p.view.players.map((x) => `${x.name} ${x.glory}`).join(', ')}`}>
      <div class="track-line">
        {Array.from({ length: max + 1 }, (_, i) => (
          <span class={`track-tick${i === p.target ? ' goal' : ''}`} style={{ left: `${(i / max) * 100}%` }}><i>{i}</i></span>
        ))}
        {p.view.players.map((x) => {
          const same = p.view.players.filter((o) => o.glory === x.glory);
          const k = same.findIndex((o) => o.seat === x.seat);
          return (
            <span class="track-peg" data-tip={`${x.name}: ${x.glory} Glory`} style={{ left: `${(x.glory / max) * 100}%`, '--seat': seatColor(x.seat), '--stack': k - (same.length - 1) / 2 } as any}>
              {x.name.slice(0, 1).toUpperCase()}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TideRecord(p: { view: GameView }) {
  if (!p.view.tides.length) return <span class="muted tides-none">No Tide yet</span>;
  return (
    <span class="tides" aria-label="Tides so far">
      {p.view.tides.map((t) => (
        <span class={`tide-pip ${t.dir}`} data-tip={`Day ${t.day}: ${DIR_LABEL[t.dir]}${t.dir === 'neutral' ? '' : ` by ${t.margin}`} (Light ${t.light}, Dark ${t.dark})`}>
          {t.dir === 'light' ? '☀' : t.dir === 'dark' ? '☾' : '•'}
        </span>
      ))}
    </span>
  );
}

/** Public notes on a player: declarations, pacts, bonds and so on. */
export function statusNotes(view: GameView, seat: number): { text: string; tone?: string }[] {
  const name = (s: number) => view.players[s]?.name ?? '?';
  const out: { text: string; tone?: string }[] = [];
  const p = view.players[seat];
  if (view.prophecy[seat]) out.push({ text: `Prophecy: ${DIR_LABEL[view.prophecy[seat]]}`, tone: view.prophecy[seat] });
  if (view.whisperCall && p.celestial === 'celestial-the-whisper') out.push({ text: `Whisper: ${DIR_LABEL[view.whisperCall]} Tide`, tone: view.whisperCall });
  for (const pact of view.pacts) {
    if (pact.a !== seat && pact.b !== seat) continue;
    const other = pact.a === seat ? pact.b : pact.a;
    out.push({ text: `Covenant with ${name(other)}: no ${pact.action[0].toUpperCase()}${pact.action.slice(1)}${pact.broken ? ' (broken)' : ''}`, tone: pact.broken ? 'bad' : undefined });
  }
  for (const b of view.bonds) {
    if (b.bound === seat) out.push({ text: `Bound to ${name(b.owner)} (Raguel)` });
  }
  for (const a of view.anathema) if (a.target === seat) out.push({ text: 'Anathema: cannot Offer', tone: 'bad' });
  return out;
}

/** Marks on a Choir card that everyone can see. */
export function choirTag(view: GameView, seat: number, id: string | null, used: boolean): string | undefined {
  if (!id) return undefined;
  if (view.eclipsed[seat] === id) return 'Eclipsed';
  if (view.morningStar.some((m) => m.seat === seat && m.card === id)) return 'Inverted';
  if (used) return 'Used';
  return undefined;
}

/** What a lean means at the Reaping, in one line. */
export const alignTip = (n: number | null, whose: string) => {
  if (n === null) return `${whose} Alignment`;
  if (n === 0) return `${whose} Choir is balanced: it gains and loses nothing at the Reaping`;
  const dir = n > 0 ? 'Light' : 'Dark';
  const k = Math.min(3, Math.abs(n));
  return `${whose} Choir leans ${dir} ${Math.abs(n)}: +${k} Glory on a ${dir} Tide, −${k} on a ${n > 0 ? 'Dark' : 'Light'} one`;
};
export const alignText = (n: number | null) => (n === null ? '' : n === 0 ? 'Neutral' : `${n > 0 ? 'Light' : 'Dark'} ${Math.abs(n)}`);
export const alignTone = (n: number | null) => (!n ? 'neutral' : n > 0 ? 'light' : 'dark');
export const listNames = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
export { nameOf };
