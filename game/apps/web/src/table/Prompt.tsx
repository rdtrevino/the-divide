// The prompt bar: the decision in front of you with every option, or who the table is waiting for.
import type { Decision, GameView, Option } from '@divide/engine';
import { Card } from '../components/Card';
import { nameOf } from '../lib/cards';
import { Countdown, listNames } from './bits';
import type { Waiting } from './Players';
import { isButton, type Pick } from './pick';

const ACTION_ICON: Record<string, string> = { offer: '✦', gather: '❖', exalt: '▲' };

function optionLabel(o: Option): string {
  if (o.id === 'none') return 'Decline';
  if (o.id === 'end') return 'End turn';
  return o.label;
}

export function Prompt(p: {
  view: GameView;
  decision: Decision | null;
  more: number;
  pick: Pick;
  waiting: Waiting[];
  skew: number;
  busy: boolean;
  spectator: boolean;
  onConfirm: () => void;
}) {
  const { decision: d, view, pick } = p;
  // Once the game is over the results take over; nothing is left to decide.
  if (view.phase === 'ended') return null;

  if (!d) {
    const humans = p.waiting.filter((w) => !view.players[w.seat].isBot);
    const bots = p.waiting.filter((w) => view.players[w.seat].isBot);
    const first = humans[0];
    return (
      <div class="prompt idle">
        <span class="prompt-text">
          {p.spectator && <span class="eyebrow">Watching&nbsp;&nbsp;</span>}
          {humans.length ? `Waiting for ${listNames(humans.map((w) => view.players[w.seat].name))}` : bots.length ? `${listNames(bots.map((w) => view.players[w.seat].name))} ${bots.length > 1 ? 'are' : 'is'} choosing` : 'One moment'}
          <span class="thinking"><i /><i /><i /></span>
        </span>
        {first?.deadline && <Countdown deadline={first.deadline} skew={p.skew} />}
      </div>
    );
  }

  const mine = p.waiting.find((w) => w.seat === d.seat);
  const single = d.min === 1 && d.max === 1;
  const sel = [...pick.selected];
  const cardOpts = d.options.filter((o) => !isButton(d, o.id));
  const buttons = d.options.filter((o) => isButton(d, o.id));
  const valid = sel.length >= d.min && sel.length <= d.max;
  const needConfirm = !single || cardOpts.length > 0;
  const chosen = single && sel[0] ? d.options.find((o) => o.id === sel[0]) : undefined;

  return (
    <div class={`prompt yours${p.busy ? ' busy' : ''}`}>
      <div class="prompt-top">
        <span class="prompt-text">{d.prompt}</span>
        {p.more > 0 && <span class="muted prompt-more">+{p.more} more to answer</span>}
        {mine?.deadline && <Countdown deadline={mine.deadline} skew={p.skew} />}
      </div>
      {!!d.reveal?.length && (
        <div class="prompt-reveal">
          <span class="eyebrow">Only you see</span>
          {d.reveal.map((id) => <Card id={id} w={62} compact />)}
        </div>
      )}
      <div class="prompt-opts">
        {d.tag === 'action'
          ? d.options.map((o) => {
              const [title, ...rest] = o.label.split(': ');
              return (
                <button class="action-btn" disabled={p.busy} onClick={() => pick.choose(o.id)}>
                  <span class="action-icon">{ACTION_ICON[o.id] ?? '•'}</span>
                  <span><b>{title}</b><small>{rest.join(': ')}</small></span>
                </button>
              );
            })
          : (
            <>
              {cardOpts.map((o) => {
                const altar = /^altar:(\d+)$/.exec(o.id);
                const cardId = o.card ?? null;
                const label = o.id === 'deck' ? 'Host deck' : altar && !cardId ? o.label.replace('From the Altar: ', '') : o.label === nameOf(cardId ?? '') ? '' : o.label;
                return (
                  <button class={`opt-card${pick.selected.has(o.id) ? ' on' : ''}`} disabled={p.busy} onClick={() => pick.choose(o.id)} onDblClick={() => pick.choose(o.id, true)} title={o.label}>
                    <Card id={cardId} w={58} compact selected={pick.selected.has(o.id)} />
                    <span class="opt-label">{label || nameOf(cardId ?? '')}</span>
                  </button>
                );
              })}
              {buttons.map((o) => (
                <button
                  class={`btn${o.id === 'yes' || o.id === 'end' ? ' primary' : o.id === 'no' || o.id === 'none' ? ' quiet' : ''}${pick.selected.has(o.id) ? ' on' : ''}${o.seat !== undefined ? ' seat-btn' : ''}`}
                  style={o.seat !== undefined ? ({ '--seat': `var(--seat-${o.seat})` } as any) : undefined}
                  disabled={p.busy}
                  onClick={() => pick.choose(o.id)}
                >
                  {optionLabel(o)}
                </button>
              ))}
            </>
          )}
      </div>
      {needConfirm && d.tag !== 'action' && (
        <div class="prompt-confirm">
          <span class="muted">{single ? 'Tap a card (or the card on the table), then confirm. Double-click to choose at once.' : `Choose ${d.min === d.max ? d.min : `${d.min} to ${d.max}`}.`}</span>
          <button class="btn primary confirm" disabled={!valid || p.busy} onClick={p.onConfirm}>
            {single ? (chosen ? `Confirm: ${chosen.card ? nameOf(chosen.card) : optionLabel(chosen)}` : 'Choose a card') : `Confirm (${sel.length} of ${d.min === d.max ? d.min : `${d.min} to ${d.max}`})`}
          </button>
        </div>
      )}
    </div>
  );
}
