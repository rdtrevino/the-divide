// The middle of the table: the Day's Event, the Altar, the Host deck and the discard pile.
import { setTide, type GameView } from '@divide/engine';
import { useContext, useState } from 'preact/hooks';
import { Card } from '../components/Card';
import { textOf } from '../lib/cards';
import { altarNote } from './bits';
import { PickCtx } from './pick';

export function Center(p: { view: GameView }) {
  const { view } = p;
  const pick = useContext(PickCtx);
  const [showDiscard, setShowDiscard] = useState(false);
  const shown = view.altar.filter((a) => !a.facedown && a.id);
  const hidden = view.altar.filter((a) => a.facedown).length;
  // The engine's own count, applied to the cards everyone can see.
  const tally = setTide({ altar: shown.map((a) => ({ id: a.id! })), currentEvent: view.event, tides: view.tides, day: view.day });
  const unknown = new Map<string, number>();
  const discardOpts = view.discard.filter((id) => pick.card.has(id));
  return (
    <div class="t-center">
      {/* The Base game has no Events (and no Celestials); show the Event place only in the Advanced game. */}
      {(view.event || view.players.some((pl) => pl.celestial)) && <div class="event-slot">
        <div class="zone-label">{view.event ? 'Today’s Event' : 'Event'}</div>
        {view.event ? (
          <>
            <Card id={view.event} w="var(--cw-event)" compact flip={view.event} />
            <p class="event-text" data-zoom={view.event} title={textOf(view.event)}>{textOf(view.event)}</p>
          </>
        ) : (
          <div class="slot event" style={{ '--w': 'var(--cw-event)' } as any} />
        )}
      </div>}

      <div class="altar">
        <div class="zone-label">
          The Altar
          <span class="tally">
            <span class="light" data-tip="Light from the face-up cards on the Altar">Light {tally.light}</span>
            <span class="dark" data-tip="Dark from the face-up cards on the Altar">Dark {tally.dark}</span>
            {hidden > 0 && <span class="hid" data-tip="Facedown cards count toward the Tide, but no one sees them until the Evening">{hidden} facedown</span>}
            {view.altarTokens.length > 0 && <span class="hid" data-tip="Each allegiance token counts 2 for its color. No one sees which until the Evening">{view.altarTokens.length} token{view.altarTokens.length > 1 ? 's' : ''}</span>}
          </span>
        </div>
        <div class="altar-row">
          {view.altar.map((a, i) => {
            let key = a.id;
            if (!key) {
              const who = a.offeredBy === null ? 'seed' : String(a.offeredBy);
              const n = unknown.get(who) ?? 0;
              unknown.set(who, n + 1);
              key = `altar-fd-${who}-${n}`;
            }
            const opt = pick.altar.get(i) ?? (a.id ? pick.card.get(a.id) : undefined);
            const tag = a.facedown && a.id ? 'Facedown' : a.sanctuary !== undefined ? 'Sanctuary' : a.kind === 'seed' ? 'Creation' : a.kind === 'relic' ? 'Eternity' : undefined;
            const who = a.offeredBy !== null ? view.players[a.offeredBy]?.name : null;
            return (
              <Card
                key={key}
                id={a.id}
                w="var(--cw-altar)"
                compact
                hiddenOwn={a.facedown && !!a.id}
                owner={a.offeredBy}
                tag={tag}
                tagCool={tag === 'Sanctuary'}
                flip={key}
                flipFrom={a.offeredBy !== null ? `#hand-${a.offeredBy}` : '#deck'}
                selectable={!!opt}
                selected={!!opt && pick.selected.has(opt)}
                onClick={opt ? () => pick.choose(opt) : undefined}
                onDblClick={opt ? () => pick.choose(opt, true) : undefined}
                note={a.facedown && a.id ? (a.offeredBy === view.you ? 'Facedown: only you know this card until the Evening.' : 'You have seen this facedown card. The table has not.') : altarNote(a.kind, who)}
              />
            );
          })}
          {view.altarTokens.map((t) => (
            <span class={`altar-tok ${t.side ?? 'hidden'}`} style={{ '--seat': `var(--seat-${t.by % 4})` } as any} data-tip={t.side ? `Your ${t.side === 'light' ? 'Light' : 'Dark'} token: it counts 2` : `An allegiance token Offered by ${view.players[t.by]?.name}: it counts 2 for its color`}>◆</span>
          ))}
          {!view.altar.length && !view.altarTokens.length && <span class="muted altar-empty">The Altar is empty</span>}
        </div>
      </div>

      <div class="piles">
        <div class="pile">
          <div class="zone-label">Host deck</div>
          <div id="deck" class="pile-stack">
            <Card id={null} w="var(--cw-pile)" selectable={!!pick.deck} selected={!!pick.deck && pick.selected.has(pick.deck)} onClick={pick.deck ? () => pick.choose(pick.deck!) : undefined} onDblClick={pick.deck ? () => pick.choose(pick.deck!, true) : undefined} />
            <span class="pile-count num" data-tip={`${view.deckCount} cards left in the Host deck`}>{view.deckCount}</span>
          </div>
        </div>
        <div class="pile">
          <div class="zone-label">Discard</div>
          <div class="pile-stack">
            {view.discard.length ? <Card id={view.discard[view.discard.length - 1]} w="var(--cw-pile)" compact onClick={() => setShowDiscard(true)} class={discardOpts.length ? 'selectable' : ''} /> : <div class="slot" style={{ '--w': 'var(--cw-pile)' } as any} />}
            <span class="pile-count num" data-tip={view.discard.length ? `${view.discard.length} cards in the discard pile. Click the top card to see them all` : 'The discard pile is empty'}>{view.discard.length}</span>
          </div>
        </div>
      </div>

      {showDiscard && (
        <div class="overlay" onClick={() => setShowDiscard(false)}>
          <div class="modal panel" onClick={(e) => e.stopPropagation()}>
            <div class="modal-head"><h2>Discard pile ({view.discard.length})</h2><button class="btn quiet small" onClick={() => setShowDiscard(false)}>Close</button></div>
            <p class="muted">Most recent first.</p>
            <div class="modal-cards">
              {[...view.discard].reverse().map((id, i) => {
                const opt = pick.card.get(id);
                return <Card key={`${id}-${i}`} id={id} w={104} compact selectable={!!opt} selected={!!opt && pick.selected.has(opt)} onClick={opt ? () => { pick.choose(opt); setShowDiscard(false); } : undefined} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
