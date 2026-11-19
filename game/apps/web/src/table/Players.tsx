// The players around the table: opponents along the top, you along the bottom.
// Each panel keeps its facts (name, Glory, Choir colors, tokens, hand size, notes) beside its cards, not above
// and below them, so the whole table fits on one screen.
import { CHOIR_LIMIT, type GameView } from '@divide/engine';
import { useContext } from 'preact/hooks';
import { Card } from '../components/Card';
import { Countdown, choirTag, colorsTip, seatColor, statusNotes } from './bits';
import { PickCtx } from './pick';

export interface Waiting { seat: number; deadline: number | null }

function Notes(p: { view: GameView; seat: number }) {
  const notes = statusNotes(p.view, p.seat);
  return <>{notes.map((n) => <span class={`note ${n.tone ?? ''}`}>{n.text}</span>)}</>;
}

/** A Choir: the cards, card backs for facedown cards you can't see, and empty outlines.
 *  Opponents' Choirs use the small face (name, value, art); your own shows the whole printed card. */
function ChoirCards(p: { view: GameView; seat: number; w: string; full?: boolean }) {
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
            compact={!p.full}
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
      {Array.from({ length: Math.max(0, CHOIR_LIMIT - pl.choir.length) }, () => <div class="slot" style={{ '--w': p.w } as any} />)}
    </>
  );
}

function ChoirChip(p: { c: { light: number; dark: number }; whose: string }) {
  return <span class="choirchip" data-tip={colorsTip(p.c, p.whose)}><b class="light">☀{p.c.light}</b><b class="dark">☾{p.c.dark}</b></span>;
}

/** Your secret tokens, and what they are worth on the Tide track so far. */
function MyTokens(p: { view: GameView; seat: number }) {
  const pl = p.view.players[p.seat];
  const t = pl.tokens ?? [];
  const L = t.filter((x) => x === 'light').length, D = t.length - L;
  const won = { light: 0, dark: 0 };
  for (const x of p.view.tides) if (!x.void && x.dir !== 'neutral') won[x.dir]++;
  const worth = L * won.light + D * won.dark;
  return (
    <span class="tokchip mine" data-tip={`Your secret tokens: ${L} Light, ${D} Dark. Each scores 1 for every Day its color wins: ${worth} so far. You have Offered ${pl.offers} time${pl.offers === 1 ? '' : 's'}; whoever Offers the fewest times loses 3 at the end`}>
      <i />{Array.from({ length: L }, () => <b class="tok light" />)}{Array.from({ length: D }, () => <b class="tok dark" />)}
      <small>{worth} so far</small>
    </span>
  );
}

function Status(p: { isBot: boolean; connected: boolean; away: boolean; first: boolean; waiting?: Waiting; skew: number }) {
  return (
    <>
      {p.isBot && <span class="pp-badge" data-tip="A computer player">bot</span>}
      {!p.isBot && p.away && <span class="pp-badge warn" data-tip="A bot is playing this seat until the player is back">away</span>}
      {!p.isBot && !p.connected && !p.away && <span class="pp-badge warn" data-tip="Not connected right now">offline</span>}
      {p.first && <span class="pp-first" data-tip="First player this Day">1st</span>}
      {p.waiting && (p.waiting.deadline ? <Countdown deadline={p.waiting.deadline} skew={p.skew} /> : <span class="thinking" aria-label="thinking"><i /><i /><i /></span>)}
    </>
  );
}

export function PlayerPanel(p: { view: GameView; seat: number; waiting?: Waiting; skew: number; connected: boolean; away: boolean }) {
  const pick = useContext(PickCtx);
  const pl = p.view.players[p.seat];
  const opt = pick.seat.get(p.seat);
  const active = p.view.active === p.seat && p.view.phase === 'noon';
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
        <div class="pp-glory" data-tip={`${pl.name} has ${pl.glory} Glory so far. Tokens are added at the end`}><b class="num" key={pl.glory}>{pl.glory}</b><small>Glory</small></div>
        <div class="pp-tags">
          <ChoirChip c={pl.colors} whose={`${pl.name}'s`} />
          <span class="tokchip" data-tip={`${pl.name} holds ${pl.tokenCount} secret allegiance token${pl.tokenCount === 1 ? '' : 's'} and has Offered ${pl.offers} time${pl.offers === 1 ? '' : 's'}`}><i />{pl.tokenCount}</span>
          <span class="pp-handcount" id={`hand-${p.seat}`} data-tip={`${pl.name} holds ${pl.handCount} card${pl.handCount === 1 ? '' : 's'} in hand`}><i />{pl.handCount}</span>
        </div>
        <div class="pp-notes"><Notes view={p.view} seat={p.seat} /></div>
        {opt && <span class="pp-choose">Choose {pl.name}</span>}
      </div>
      <div class="pp-cards">
        {pl.celestial && <><Card id={pl.celestial} w="var(--cw-opp)" compact /><span class="pp-sep" /></>}
        <ChoirCards view={p.view} seat={p.seat} w="var(--cw-opp)" />
        {pl.hand && (
          <div class="pp-revealed" data-tip="Their hand, revealed to the table">
            {pl.hand.map((id) => <Card key={id} id={id} w="calc(var(--cw-opp) * 0.62)" compact flip={id} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export function MyArea(p: { view: GameView; seat: number }) {
  const pick = useContext(PickCtx);
  const pl = p.view.players[p.seat];
  const celOpt = pick.card.get(pl.celestial);
  const active = p.view.active === p.seat && p.view.phase === 'noon';
  const hand = pl.hand ?? [];
  return (
    <div class={`mine${active ? ' active' : ''}`} style={{ '--seat': seatColor(p.seat) } as any}>
      <div class="mine-me">
        <div class="mine-name"><span class="pp-dot" />{pl.name}{p.view.firstPlayer === p.seat && p.view.phase !== 'ended' && <span class="pp-first" data-tip="You are the first player this Day">1st</span>}</div>
        <div class="mine-glory" data-tip="Your Glory so far. Your tokens are added at the end">
          <b class="num" key={pl.glory}>{pl.glory}</b><small>Glory</small>
        </div>
        <div class="mine-notes">
          <ChoirChip c={pl.colors} whose="Your" />
          <MyTokens view={p.view} seat={p.seat} />
          <Notes view={p.view} seat={p.seat} />
        </div>
      </div>
      {pl.celestial && <div class="mine-zone cel">
        <div class="zone-label">Celestial</div>
        <div class="zone-row">
          <Card id={pl.celestial} w="calc(var(--cw-me) * 0.82)" selectable={!!celOpt} selected={!!celOpt && pick.selected.has(celOpt)} onClick={celOpt ? () => pick.choose(celOpt) : undefined} onDblClick={celOpt ? () => pick.choose(celOpt, true) : undefined} />
        </div>
      </div>}
      <div class="mine-zone choir">
        <div class="zone-label">Your Choir</div>
        <div class="zone-row"><ChoirCards view={p.view} seat={p.seat} w="var(--cw-me)" full /></div>
      </div>
      <div class="mine-zone hand">
        <div class="zone-label">Your hand</div>
        <div class="zone-row" id={`hand-${p.seat}`}>
          {hand.map((id) => {
            const opt = pick.card.get(id);
            return <Card key={id} id={id} w="var(--cw-me)" flip={id} flipFrom="#deck" selectable={!!opt} selected={!!opt && pick.selected.has(opt)} onClick={opt ? () => pick.choose(opt) : undefined} onDblClick={opt ? () => pick.choose(opt, true) : undefined} />;
          })}
          {!hand.length && <span class="muted empty-hand">No cards in hand</span>}
        </div>
      </div>
    </div>
  );
}
