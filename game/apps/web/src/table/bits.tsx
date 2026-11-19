// Small pieces of the table: countdowns, the Tide track, player status notes.
import type { GameView } from '@divide/engine';
import { useEffect, useState } from 'preact/hooks';

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

/** The Tide track: one space per Day; each Day won is marked for its side. Tokens score these at the end. */
export function TideTrack(p: { view: GameView }) {
  const won = { light: 0, dark: 0 };
  for (const t of p.view.tides) if (!t.void && t.dir !== 'neutral') won[t.dir]++;
  return (
    <div class="ttrack" aria-label={`The Tide track: Light ${won.light}, Dark ${won.dark}, of ${p.view.days} Days`}>
      <span class="tides">
        {Array.from({ length: p.view.days }, (_, i) => {
          const t = p.view.tides[i];
          if (!t) return <span class="tide-pip empty" data-tip={`Day ${i + 1}: still to come`}>{i + 1}</span>;
          const label = t.dir === 'neutral' ? 'Neutral: no one won' : `${DIR_LABEL[t.dir]} by ${t.margin}${t.void ? ' (Purgatory: counts for neither side)' : ''}`;
          return (
            <span class={`tide-pip ${t.dir}${t.void ? ' void' : ''}`} data-tip={`Day ${t.day}: ${label} (Light ${t.light}, Dark ${t.dark})`}>
              {t.dir === 'light' ? '☀' : t.dir === 'dark' ? '☾' : '•'}
            </span>
          );
        })}
      </span>
      <span class="ttrack-won" data-tip="Days each side has won. At the end, every token scores 1 for each Day its color won">
        <b class="light">☀ {won.light}</b><b class="dark">☾ {won.dark}</b>
      </span>
    </div>
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
  const blocked = (act: string) => view.anathema.some((a) => a.target === seat && (a.action ?? 'offer') === act);
  if (blocked('faceup')) out.push({ text: 'Anathema: Offers face up', tone: 'bad' });
  if (p.offeredToday && view.phase !== 'ended') out.push({ text: 'Offered today' });
  const sword = ['exalt', 'gather'].filter(blocked).map((x) => x[0].toUpperCase() + x.slice(1));
  if (sword.length) out.push({ text: `Flaming Sword: cannot ${sword.join(' or ')}`, tone: 'bad' });
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

/** A Choir's cards by color: each scores 2 Glory when its color wins the Day. */
export const colorsTip = (c: { light: number; dark: number }, whose: string) =>
  `${whose} Choir holds ${c.light} Light and ${c.dark} Dark card${c.dark === 1 ? '' : 's'}. Each scores 2 Glory when its color wins the Day`;
/** Who put a card on the Altar, and how. */
export const altarNote = (kind: string | undefined, who: string | null) => {
  if (kind === 'seed') return 'Revealed by Creation';
  if (kind === 'fruits') return 'First Fruits: no one knows whose';
  if (!who) return undefined;
  return kind === 'offer' ? `Offered by ${who}` : kind === 'vessel' ? `Placed by ${who} (Vessel; not an Offer)` : kind === 'relic' ? `Kept on the Altar by Eternity` : `Placed by ${who}`;
};
export const listNames = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
