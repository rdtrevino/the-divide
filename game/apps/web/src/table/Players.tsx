// The players around the table: opponents along the top, you along the bottom.
import type { GameView } from '@divide/engine';
import { useContext, useState } from 'preact/hooks';
import { Card } from '../components/Card';
import { Countdown, alignText, alignTone, choirTag, seatColor, statusNotes } from './bits';
import { PickCtx } from './pick';

export interface Waiting { seat: number; deadline: number | null }

function Notes(p: { view: GameView; seat: number }) {
  const notes = statusNotes(p.view, p.seat);
  return <>{notes.map((n) => <span class={`note ${n.tone ?? ''}`}>{n.text}</span>)}</>;
}

/** A Choir slot: the card, a card back, or an empty outline. */
function ChoirCards(p: { view: GameView; seat: number; w: string; mine?: boolean }) {
  const pick = useContext(PickCtx);
  const pl = p.view.players[p.seat];
  return (
    <>
      {pl.choir.map((c, i) => {
        const opt = c.id ? pick.card.get(c.id) : undefined;
        const tag = c.facedown ? 'Facedown' : choirTag(p.view, p.seat, c.id, c.used);
        return (
          <Card
            key={c.id ?? `fd-${i}`}
            id={c.id}
            w={p.w}
            compact
            spent={c.used && !c.facedown}
            hiddenOwn={c.facedown && !!c.id}
            tag={tag}
            tagCool={tag === 'Eclipsed' || tag === 'Inverted'}
            flip={c.id ?? `choir-fd-${p.seat}-${i}`}
            flipFrom="#deck"
            selectable={!!opt}
            selected={!!opt && pick.selected.has(opt)}
            onClick={opt ? () => pick.choose(opt) : undefined}
            onDblClick={opt ? () => pick.choose(opt, true) : undefined}
            note={c.facedown && c.id ? 'Facedown: it does not count and its ability is off until it turns face up.' : undefined}
          />
        );
      })}
      {Array.from({ length: Math.max(0, 3 - pl.choir.length) }, () => <div class="slot" style={{ '--w': p.w } as any} />)}
    </>
  );
}

export function PlayerPanel(p: { view: GameView; seat: number; waiting?: Waiting; skew: number; connected: boolean; away: boolean }) {
  const pick = useContext(PickCtx);
  const pl = p.view.players[p.seat];
  const opt = pick.seat.get(p.seat);
  const active = p.view.active === p.seat && p.view.phase === 'turns';
  const winner = p.view.result?.winners.includes(p.seat);
  return (
    <div
      class={`pp${active ? ' active' : ''}${opt ? ' pickable' : ''}${winner ? ' winner' : ''}`}
      style={{ '--seat': seatColor(p.seat) } as any}
      onClick={opt ? () => pick.choose(opt) : undefined}
    >
      <div class="pp-head">
        <span class="pp-dot" />
        <span class="pp-name">{pl.name}</span>
        {pl.isBot && <span class="pp-badge">bot</span>}
        {!pl.isBot && p.away && <span class="pp-badge warn" title="A bot is covering this seat">away</span>}
        {!pl.isBot && !p.connected && !p.away && <span class="pp-badge warn">offline</span>}
        {p.view.firstPlayer === p.seat && p.view.phase !== 'ended' && <span class="pp-first" title="First player this Day">1st</span>}
        {p.waiting && (p.waiting.deadline ? <Countdown deadline={p.waiting.deadline} skew={p.skew} /> : <span class="thinking" aria-label="thinking"><i /><i /><i /></span>)}
        <span class="pp-glory" title="Glory"><b class="num" key={pl.glory}>{pl.glory}</b><small>Glory</small></span>
      </div>
      <div class="pp-body">
        <Card id={pl.celestial} w="var(--cw-opp)" compact />
        <div class="pp-choir"><ChoirCards view={p.view} seat={p.seat} w="var(--cw-opp)" /></div>
        <div class="pp-hand" id={`hand-${p.seat}`} title={`${pl.handCount} card${pl.handCount === 1 ? '' : 's'} in hand`}>
          {pl.hand
            ? pl.hand.map((id) => <Card key={id} id={id} w="calc(var(--cw-opp) * 0.62)" compact flip={id} />)
            : Array.from({ length: pl.handCount }, () => <Card id={null} w="calc(var(--cw-opp) * 0.5)" />)}
          {pl.hand && <span class="pp-revealed">hand revealed</span>}
        </div>
      </div>
      <div class="pp-foot">
        <span class={`align ${alignTone(pl.alignment)}`} title="Alignment: the net of the Choir's Light and Dark values">{alignText(pl.alignment)}</span>
        <Notes view={p.view} seat={p.seat} />
        {opt && <span class="pp-choose">Choose {pl.name}</span>}
      </div>
    </div>
  );
}

export function MyArea(p: { view: GameView; seat: number; onGift: (to: number, amount: number) => void; canGift: boolean }) {
  const pick = useContext(PickCtx);
  const pl = p.view.players[p.seat];
  const [gift, setGift] = useState(false);
  const celOpt = pick.card.get(pl.celestial);
  const active = p.view.active === p.seat && p.view.phase === 'turns';
  return (
    <div class={`mine${active ? ' active' : ''}`} style={{ '--seat': seatColor(p.seat) } as any}>
      <div class="mine-me">
        <div class="mine-name"><span class="pp-dot" />{pl.name}{p.view.firstPlayer === p.seat && p.view.phase !== 'ended' && <span class="pp-first" title="You are the first player this Day">1st</span>}</div>
        <div class="mine-glory"><b class="num" key={pl.glory}>{pl.glory}</b><small>Glory</small></div>
        <span class={`align ${alignTone(pl.alignment)}`} title="Your Alignment: the net of your Choir's Light and Dark values">{alignText(pl.alignment)}</span>
        <div class="mine-notes"><Notes view={p.view} seat={p.seat} /></div>
        {p.canGift && (
          <div class="gift">
            <button class="btn quiet small" onClick={() => setGift(!gift)} disabled={pl.glory < 1}>Give Glory</button>
            {gift && pl.glory > 0 && (
              <div class="gift-pop panel">
                <div class="eyebrow">Give 1 Glory to</div>
                {p.view.players.filter((o) => o.seat !== p.seat).map((o) => (
                  <button class="btn small" onClick={() => { p.onGift(o.seat, 1); setGift(false); }}><span class="pp-dot" style={{ '--seat': seatColor(o.seat) } as any} />{o.name}</button>
                ))}
                <p class="muted">Gifts are public and cannot be taken back.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div class="mine-zone cel">
        <div class="zone-label">Your Celestial</div>
        <div class="zone-row">
          <Card id={pl.celestial} w="var(--cw-me)" compact selectable={!!celOpt} selected={!!celOpt && pick.selected.has(celOpt)} onClick={celOpt ? () => pick.choose(celOpt) : undefined} onDblClick={celOpt ? () => pick.choose(celOpt, true) : undefined} />
        </div>
      </div>
      <div class="mine-zone">
        <div class="zone-label">Your Choir</div>
        <div class="zone-row"><ChoirCards view={p.view} seat={p.seat} w="var(--cw-me)" mine /></div>
      </div>
      <div class="mine-zone hand">
        <div class="zone-label">Your hand</div>
        <div class={`zone-row n${Math.min(5, Math.max(3, pl.hand?.length ?? 0))}`} id={`hand-${p.seat}`}>
          {(pl.hand ?? []).map((id) => {
            const opt = pick.card.get(id);
            return <Card key={id} id={id} w="var(--cw-me)" compact flip={id} flipFrom="#deck" selectable={!!opt} selected={!!opt && pick.selected.has(opt)} onClick={opt ? () => pick.choose(opt) : undefined} onDblClick={opt ? () => pick.choose(opt, true) : undefined} />;
          })}
          {!pl.hand?.length && <span class="muted empty-hand">No cards in hand</span>}
        </div>
      </div>
    </div>
  );
}
