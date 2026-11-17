// The players around the table: opponents along the top, you along the bottom.
// Each panel keeps its facts (name, Glory, lean, hand size, notes) beside its cards, not above
// and below them, so the whole table fits on one screen.
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

/** A Choir: the cards, card backs for facedown cards you can't see, and empty outlines. */
function ChoirCards(p: { view: GameView; seat: number; w: string }) {
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

function Status(p: { isBot: boolean; connected: boolean; away: boolean; first: boolean; waiting?: Waiting; skew: number }) {
  return (
    <>
      {p.isBot && <span class="pp-badge">bot</span>}
      {!p.isBot && p.away && <span class="pp-badge warn" title="A bot is covering this seat">away</span>}
      {!p.isBot && !p.connected && !p.away && <span class="pp-badge warn">offline</span>}
      {p.first && <span class="pp-first" title="First player this Day">1st</span>}
      {p.waiting && (p.waiting.deadline ? <Countdown deadline={p.waiting.deadline} skew={p.skew} /> : <span class="thinking" aria-label="thinking"><i /><i /><i /></span>)}
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
      <div class="pp-info">
        <div class="pp-name-row"><span class="pp-dot" /><span class="pp-name">{pl.name}</span></div>
        <div class="pp-status"><Status isBot={pl.isBot} connected={p.connected} away={p.away} first={p.view.firstPlayer === p.seat && p.view.phase !== 'ended'} waiting={p.waiting} skew={p.skew} /></div>
        <div class="pp-glory" title="Glory"><b class="num" key={pl.glory}>{pl.glory}</b><small>Glory</small></div>
        <div class="pp-tags">
          <span class={`align ${alignTone(pl.alignment)}`} title="Alignment: the net of the Choir's Light and Dark values">{alignText(pl.alignment)}</span>
          <span class="pp-handcount" id={`hand-${p.seat}`} title={`${pl.handCount} card${pl.handCount === 1 ? '' : 's'} in hand`}><i />{pl.handCount}</span>
        </div>
        <div class="pp-notes"><Notes view={p.view} seat={p.seat} /></div>
        {opt && <span class="pp-choose">Choose {pl.name}</span>}
      </div>
      <div class="pp-cards">
        <Card id={pl.celestial} w="var(--cw-opp)" compact />
        <span class="pp-sep" />
        <ChoirCards view={p.view} seat={p.seat} w="var(--cw-opp)" />
        {pl.hand && (
          <div class="pp-revealed" title="Hand revealed">
            {pl.hand.map((id) => <Card key={id} id={id} w="calc(var(--cw-opp) * 0.62)" compact flip={id} />)}
          </div>
        )}
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
  const hand = pl.hand ?? [];
  return (
    <div class={`mine${active ? ' active' : ''}`} style={{ '--seat': seatColor(p.seat) } as any}>
      <div class="mine-me">
        <div class="mine-name"><span class="pp-dot" />{pl.name}{p.view.firstPlayer === p.seat && p.view.phase !== 'ended' && <span class="pp-first" title="You are the first player this Day">1st</span>}</div>
        <div class="mine-glory">
          <b class="num" key={pl.glory}>{pl.glory}</b><small>Glory</small>
          {p.canGift && (
            <div class="gift">
              <button class="btn quiet small" onClick={() => setGift(!gift)} disabled={pl.glory < 1} title="Give Glory to another player">Give</button>
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
        <div class="mine-notes">
          <span class={`align ${alignTone(pl.alignment)}`} title="Your Alignment: the net of your Choir's Light and Dark values">{alignText(pl.alignment)}</span>
          <Notes view={p.view} seat={p.seat} />
        </div>
      </div>
      <div class="mine-zone cel">
        <div class="zone-label">Celestial</div>
        <div class="zone-row">
          <Card id={pl.celestial} w="calc(var(--cw-me) * 0.82)" compact selectable={!!celOpt} selected={!!celOpt && pick.selected.has(celOpt)} onClick={celOpt ? () => pick.choose(celOpt) : undefined} onDblClick={celOpt ? () => pick.choose(celOpt, true) : undefined} />
        </div>
      </div>
      <div class="mine-zone choir">
        <div class="zone-label">Your Choir</div>
        <div class="zone-row"><ChoirCards view={p.view} seat={p.seat} w="var(--cw-me)" /></div>
      </div>
      <div class="mine-zone hand">
        <div class="zone-label">Your hand</div>
        <div class={`zone-row n${Math.min(6, Math.max(3, hand.length))}`} id={`hand-${p.seat}`}>
          {hand.map((id) => {
            const opt = pick.card.get(id);
            return <Card key={id} id={id} w="var(--cw-me)" compact flip={id} flipFrom="#deck" selectable={!!opt} selected={!!opt && pick.selected.has(opt)} onClick={opt ? () => pick.choose(opt) : undefined} onDblClick={opt ? () => pick.choose(opt, true) : undefined} />;
          })}
          {!hand.length && <span class="muted empty-hand">No cards in hand</span>}
        </div>
      </div>
    </div>
  );
}
