// One card, drawn like the printed deck: Host (portrait, cream / ash / black by alignment),
// Celestial (portrait, jewel field) and Event (landscape, scene over a black banner).
import type { ComponentChildren } from 'preact';
import { CELESTIAL, EVENT, HOST, alignLabel, artOf, celestialColors, hostFrame, hostValue } from '../lib/cards';

export interface CardProps {
  /** Card id, or null for a card whose face you may not see. */
  id: string | null;
  /** Width in px, or any CSS length. */
  w?: number | string;
  compact?: boolean;
  /** Once-per-game card whose ability is used up. */
  spent?: boolean;
  /** Your own facedown card: shown dimmed so you remember what it is. */
  hiddenOwn?: boolean;
  selectable?: boolean;
  selected?: boolean;
  tag?: string;
  tagCool?: boolean;
  /** Seat colour dot (who Offered this card). */
  owner?: number | null;
  onClick?: () => void;
  onDblClick?: () => void;
  /** Layout key for move animations (see lib/flip). */
  flip?: string;
  flipFrom?: string;
  /** Set false to stop the hover preview (the preview itself, option thumbnails beside a preview). */
  zoom?: boolean;
  note?: string;
  class?: string;
  children?: ComponentChildren;
}

const Sun = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <g stroke="#C9922A" stroke-width="1.6" stroke-linecap="round">
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * Math.PI) / 12;
        const r1 = 24;
        const r2 = i % 2 ? 36 : 46;
        return <line x1={50 + Math.cos(a) * r1} y1={50 + Math.sin(a) * r1} x2={50 + Math.cos(a) * r2} y2={50 + Math.sin(a) * r2} />;
      })}
    </g>
    <circle cx="50" cy="50" r="19" fill="none" stroke="#C9922A" stroke-width="1.6" />
    <path d="M50 31a19 19 0 0 0 0 38z" fill="#F6EAD2" />
    <path d="M50 31a19 19 0 0 1 0 38z" fill="#3b3170" />
    <line x1="50" y1="26" x2="50" y2="74" stroke="#C9922A" stroke-width="1.6" />
  </svg>
);

const Placeholder = () => (
  <svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="50" cy="50" r="30" />
    <circle cx="50" cy="50" r="20" stroke-dasharray="2 4" />
    <path d="M50 14v72M14 50h72M24 24l52 52M76 24L24 76" opacity="0.5" />
  </svg>
);

export function Card(p: CardProps) {
  const style = { '--w': typeof p.w === 'number' ? `${p.w}px` : p.w } as any;
  const state = `${p.compact ? ' compact' : ''}${p.spent ? ' spent' : ''}${p.hiddenOwn ? ' hidden-own' : ''}${p.selectable ? ' selectable' : ''}${p.selected ? ' selected' : ''}${p.class ? ' ' + p.class : ''}`;
  const common = {
    style,
    onClick: p.onClick,
    onDblClick: p.onDblClick,
    'data-flip': p.flip,
    'data-flip-from': p.flipFrom,
    'data-zoom': p.zoom === false || !p.id ? undefined : p.id,
    'data-zoom-note': p.note,
    role: p.onClick ? ('button' as const) : undefined,
    tabIndex: p.onClick ? 0 : undefined,
    onKeyDown: p.onClick ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onClick!(); } } : undefined,
  };
  const extras = (
    <>
      {p.tag && <div class={`card-tag${p.tagCool ? ' cool' : ''}`}>{p.tag}</div>}
      {p.owner != null && <div class="card-owner" style={{ '--seat': `var(--seat-${p.owner})` } as any} />}
      {p.children}
    </>
  );

  const host = p.id ? HOST[p.id] : undefined;
  if (host) {
    const art = artOf(host, 'host');
    const len = host.text.length;
    const value = hostValue(host);
    return (
      <div class={`card host ${hostFrame(host)}${state}`} aria-label={host.name} {...common}>
        <div class="card-in">
          <div class="c-head"><span class="c-num">{host.number}</span><span class="c-kind">{p.compact ? '' : alignLabel[host.alignment]}</span></div>
          <div class={`c-art${art ? '' : ' blank'}`}>{art ? <img src={art} alt="" loading="lazy" draggable={false} /> : <Placeholder />}</div>
          <div class={`c-name${host.name.length > 9 ? ' long' : ''}`}><span>{host.name}</span></div>
          <div class={`c-text${len > 210 ? ' xlong' : len > 135 ? ' long' : ''}`}>{host.text}</div>
          <div class="c-foot">{value && <b>{value}</b>}<span>{p.compact && value ? alignLabel[host.alignment].replace(' or ', '/').replace(' and ', '+') : alignLabel[host.alignment]}</span></div>
        </div>
        {extras}
      </div>
    );
  }

  const cel = p.id ? CELESTIAL[p.id] : undefined;
  if (cel) {
    const c = celestialColors[cel.id];
    const art = artOf(cel, 'celestial');
    return (
      <div class={`card celestial${state}`} aria-label={cel.name} {...common} style={{ ...style, '--c-field': c?.field, '--c-frame': c?.frame, '--c-title': c?.title, '--c-ink': c?.ink }}>
        <div class="card-in">
          <div class="c-head"><span class="c-num">{cel.numeral}</span><span class="c-kind">{p.compact ? '' : 'Celestial'}</span></div>
          <div class={`c-art${art ? '' : ' blank'}`}>{art ? <img src={art} alt="" loading="lazy" draggable={false} /> : <Placeholder />}</div>
          <div class={`c-name${cel.name.length > 9 ? ' long' : ''}`}><span>{cel.name}</span></div>
          <div class={`c-text${cel.text.length > 150 ? ' xlong' : cel.text.length > 95 ? ' long' : ''}`}>{cel.text}</div>
        </div>
        {extras}
      </div>
    );
  }

  const ev = p.id ? EVENT[p.id] : undefined;
  if (ev) {
    const art = artOf(ev, 'event');
    return (
      <div class={`card event${state}`} aria-label={ev.name} {...common}>
        <div class="card-in">
          <div class={`c-art${art ? '' : ' blank'}`}>{art ? <img src={art} alt="" loading="lazy" draggable={false} /> : <Placeholder />}</div>
          <div class="c-banner">
            <div class="c-eyebrow">EVENT</div>
            <div class="c-title">{ev.name}</div>
            <div class={`c-etext${ev.text.length > 120 ? ' long' : ''}`}>{ev.text}</div>
          </div>
        </div>
        {extras}
      </div>
    );
  }

  return (
    <div class={`card back${state}`} aria-label="Facedown card" {...common}>
      <div class="card-in"><Sun /></div>
      {extras}
    </div>
  );
}
