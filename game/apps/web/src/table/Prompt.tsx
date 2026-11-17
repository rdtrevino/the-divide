// The decision bar: its own row under your cards, never on top of anything.
// Line 1 says what to do (or who the table is waiting for); line 2 holds the choices. Card choices are
// made on the board itself (those cards glow); here they are listed as small name chips you can also
// click, and hover to read. Cards you could not otherwise see (the top of the deck, the discard pile,
// a card you peeked at) are shown as small cards.
import type { Decision, GameView, LogEntry, Option } from '@divide/engine';
import { Card } from '../components/Card';
import { HOST, nameOf } from '../lib/cards';
import { Countdown, listNames } from './bits';
import type { Waiting } from './Players';
import { isButton, type Pick } from './pick';

const ACTION_ICON: Record<string, string> = { offer: '✦', gather: '❖', exalt: '▲' };

const optionLabel = (o: Option) => (o.id === 'none' ? 'Decline' : o.id === 'end' ? 'End turn' : o.label);

/** The words on a card chip: the card's name, plus where it is when that matters. */
function chipText(o: Option): { name: string; where?: string } {
  if (o.id === 'deck') return { name: 'Host deck', where: 'top card' };
  const card = o.card ? nameOf(o.card) : null;
  const label = o.label.replace(/^From the Altar: /, '');
  if (!card) return { name: label };
  if (label === card) return { name: card };
  const rest = label.replace(card, '').replace(/^\s*[(:–-]\s*/, '').replace(/\)\s*$/, '').trim();
  return { name: card, where: rest || undefined };
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
  recent: LogEntry[];
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
        <div class="prompt-top">
          <span class="prompt-text">
            {p.spectator && <span class="eyebrow">Watching&nbsp;&nbsp;</span>}
            {humans.length ? `Waiting for ${listNames(humans.map((w) => view.players[w.seat].name))}` : bots.length ? `${listNames(bots.map((w) => view.players[w.seat].name))} ${bots.length > 1 ? 'are' : 'is'} choosing` : 'One moment'}
            <span class="thinking"><i /><i /><i /></span>
          </span>
          {first?.deadline && <Countdown deadline={first.deadline} skew={p.skew} />}
        </div>
        <div class="prompt-recent" aria-live="polite">
          {p.recent.map((e, i) => <span key={e.seq} class={`k-${e.kind}${i === p.recent.length - 1 ? ' latest' : ''}`}>{e.text}</span>)}
        </div>
      </div>
    );
  }

  const mine = p.waiting.find((w) => w.seat === d.seat);
  const single = d.min === 1 && d.max === 1;
  const sel = [...pick.selected];
  const cardOpts = d.options.filter((o) => !isButton(d, o.id));
  const buttons = d.options.filter((o) => isButton(d, o.id));
  const valid = sel.length >= d.min && sel.length <= d.max;
  const needConfirm = cardOpts.length > 0 || !single;
  const chosen = single && sel[0] ? d.options.find((o) => o.id === sel[0]) : undefined;

  return (
    <div class={`prompt yours${p.busy ? ' busy' : ''}`}>
      <div class="prompt-top">
        <span class="prompt-text">{d.prompt}</span>
        {cardOpts.length > 0 && <span class="prompt-hint">{single ? 'Click a glowing card, or a name below, then confirm.' : `Choose ${d.min === d.max ? d.min : `${d.min} to ${d.max}`}.`}</span>}
        {p.more > 0 && <span class="prompt-more">+{p.more} more to answer</span>}
        {mine?.deadline && <Countdown deadline={mine.deadline} skew={p.skew} />}
      </div>
      <div class="prompt-opts">
        {!!d.reveal?.length && (
          <div class="prompt-reveal" title="Only you see these">
            {d.reveal.map((id) => <Card id={id} w="var(--cw-reveal)" compact />)}
          </div>
        )}
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
                const t = chipText(o);
                const align = o.card ? HOST[o.card]?.alignment : undefined;
                return (
                  <button
                    class={`chip-opt${pick.selected.has(o.id) ? ' on' : ''}`}
                    disabled={p.busy}
                    data-zoom={o.card}
                    title={o.label}
                    onClick={() => pick.choose(o.id)}
                    onDblClick={() => pick.choose(o.id, true)}
                  >
                    <i class={`adot ${align ?? (o.card ? 'none' : 'hidden')}`} />
                    <b>{t.name}</b>
                    {t.where && <small>{t.where}</small>}
                  </button>
                );
              })}
              {buttons.map((o) => (
                <button
                  class={`btn small${o.id === 'yes' || o.id === 'end' ? ' primary' : o.id === 'no' || o.id === 'none' ? ' quiet' : ''}${pick.selected.has(o.id) ? ' on' : ''}${o.seat !== undefined ? ' seat-btn' : ''}`}
                  style={o.seat !== undefined ? ({ '--seat': `var(--seat-${o.seat})` } as any) : undefined}
                  disabled={p.busy}
                  onClick={() => pick.choose(o.id)}
                >
                  {optionLabel(o)}
                </button>
              ))}
            </>
          )}
        {needConfirm && d.tag !== 'action' && (
          <button class="btn primary small confirm" disabled={!valid || p.busy} onClick={p.onConfirm}>
            {single ? (chosen ? `Confirm: ${chosen.card ? nameOf(chosen.card) : optionLabel(chosen)}` : 'Choose one') : `Confirm (${sel.length} of ${d.min === d.max ? d.min : `${d.min} to ${d.max}`})`}
          </button>
        )}
      </div>
    </div>
  );
}
