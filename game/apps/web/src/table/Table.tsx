// The game table. Everything shown here comes from the view the server sends for your seat;
// the browser never sees another player's hand or a facedown card it should not.
import { GLORY_TARGET, type LogEntry } from '@divide/engine';
import type { ClientMsg } from '@divide/protocol';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useFlip } from '../lib/flip';
import { Link } from '../lib/router';
import type { RoomSnap } from '../lib/room';
import { GloryTrack, TideRecord } from './bits';
import { Center } from './Center';
import { Evening } from './Evening';
import { MyArea, PlayerPanel } from './Players';
import { PickCtx, isButton, mapOptions, type Pick } from './pick';
import { Prompt } from './Prompt';
import { Results } from './Results';
import { Chat, LogList } from './Side';

const PHASE: Record<string, string> = { setup: 'Setting up', unveiling: 'Morning', turns: 'Turns', evening: 'Evening', ended: 'Game over' };
/** Log lines too routine to announce in the middle of the table. */
const HERALD_SKIP = new Set(['turn', 'day', 'setup', 'evening', 'activate']);

export function Table(p: { snap: RoomSnap; send: (m: ClientMsg) => void }) {
  const { snap, send } = p;
  const state = snap.state!;
  const view = state.view!;
  const me = state.you.seat;
  const n = view.players.length;
  const root = useRef<HTMLDivElement>(null);
  useFlip(root);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const top = el.querySelector('.t-top')?.getBoundingClientRect().height ?? 52;
      const bar = el.querySelector('.prompt')?.getBoundingClientRect().height ?? 0;
      el.style.setProperty('--top-h', `${Math.round(top)}px`);
      el.style.setProperty('--prompt-h', `${Math.round(bar)}px`);
    };
    const ro = new ResizeObserver(measure);
    for (const sel of ['.t-top', '.prompt']) { const t = el.querySelector(sel); if (t) ro.observe(t); }
    measure();
    return () => ro.disconnect();
  });

  // ---------------------------------------------------------------- answering decisions
  const decision = view.decisions[0] ?? null;
  const [sel, setSel] = useState<string[]>([]);
  const [sent, setSent] = useState<number | null>(null);
  useEffect(() => { setSel([]); }, [decision?.id]);
  useEffect(() => { setSent(null); }, [snap.error?.n]);
  const busy = decision !== null && sent === decision.id;
  const submit = (choice: string[]) => {
    if (!decision || busy) return;
    setSent(decision.id);
    send({ t: 'answer', id: decision.id, choice });
  };
  const maps = useMemo(() => mapOptions(decision), [decision?.id]);
  const pick: Pick = {
    ...maps,
    selected: new Set(sel),
    choose: (opt, confirm) => {
      if (!decision || busy) return;
      if (decision.min === 1 && decision.max === 1) {
        if (confirm || isButton(decision, opt)) submit([opt]);
        else setSel(sel[0] === opt ? [] : [opt]);
      } else setSel(sel.includes(opt) ? sel.filter((x) => x !== opt) : sel.length < decision.max ? [...sel, opt] : sel);
    },
  };

  // ---------------------------------------------------------------- what just happened
  const [herald, setHerald] = useState<LogEntry | null>(null);
  const [evening, setEvening] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(true);
  const queue = useRef<LogEntry[]>([]);
  const timer = useRef(0);
  useEffect(() => {
    if (!snap.fresh.length) return;
    const tide = snap.fresh.find((e) => e.kind === 'tide');
    if (tide) { setEvening(tide.day); setShowResult(true); }
    queue.current.push(...snap.fresh.filter((e) => !HERALD_SKIP.has(e.kind)));
    // A burst (a whole Evening) is summarised by its last few lines.
    if (queue.current.length > 4) queue.current = queue.current.slice(-4);
    const next = () => {
      const e = queue.current.shift();
      if (!e) { timer.current = window.setTimeout(() => { setHerald(null); timer.current = 0; }, 2600); return; }
      setHerald(e);
      timer.current = window.setTimeout(next, queue.current.length ? 1150 : 1700);
    };
    if (timer.current) clearTimeout(timer.current);
    next();
  }, [snap.fresh]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const [side, setSide] = useState(false);
  const [chatSeen, setChatSeen] = useState(snap.chat.length);
  useEffect(() => { if (side || window.innerWidth > 1080) setChatSeen(snap.chat.length); }, [snap.chat.length, side]);

  const order = me === null ? view.players.map((x) => x.seat) : Array.from({ length: n - 1 }, (_, i) => (me + 1 + i) % n);
  const waitingOf = (seat: number) => state.waiting.find((w) => w.seat === seat);
  const away = me !== null && state.room.seats[me]?.away;
  const ended = view.phase === 'ended';

  return (
    <PickCtx.Provider value={pick}>
      <div class={`table${side ? ' side-open' : ''}`} ref={root} style={{ '--opp-n': order.length } as any}>
        <header class="t-top">
          <Link href="/" class="wordmark t-mark" title="Leave the table">The Divide</Link>
          <div class="t-day">
            <b>Day {view.day || 1}</b>
            <span>{PHASE[view.phase]}</span>
          </div>
          <TideRecord view={view} />
          <GloryTrack view={view} target={GLORY_TARGET} />
          <span class="t-room" title="Room code">{state.room.code}</span>
          <a class="btn quiet small" href="/rules" target="_blank" rel="noopener">Rules</a>
          <button class="btn quiet small side-toggle" onClick={() => setSide(!side)}>
            {side ? 'Table' : 'Log & chat'}{!side && snap.chat.length > chatSeen && <i class="unread" />}
          </button>
        </header>

        <main class="t-main">
          {snap.conn !== 'open' && <div class="banner warn">Connection lost. Reconnecting…</div>}
          {away && (
            <div class="banner">
              A bot is covering your seat because your time ran out.
              <button class="btn primary small" onClick={() => send({ t: 'back' })}>I'm back</button>
            </div>
          )}
          <div class="opponents">
            {order.map((seat) => (
              <PlayerPanel key={seat} view={view} seat={seat} waiting={waitingOf(seat)} skew={snap.skew} connected={state.room.seats[seat]?.connected ?? true} away={state.room.seats[seat]?.away ?? false} />
            ))}
          </div>
          <div class="mid">
            <Center view={view} />
            <div class={`herald${herald ? ' on' : ''}`} aria-live="polite">{herald && <span key={herald.seq} class={`k-${herald.kind}`}>{herald.text}</span>}</div>
          </div>
          {me !== null && <MyArea view={view} seat={me} canGift={!ended} onGift={(to, amount) => send({ t: 'gift', to, amount })} />}
          <Prompt
            view={view}
            decision={decision}
            more={Math.max(0, view.decisions.length - 1)}
            pick={pick}
            waiting={state.waiting}
            skew={snap.skew}
            busy={busy}
            spectator={me === null}
            onConfirm={() => submit(sel)}
          />
          {evening !== null && <Evening day={evening} log={snap.log} view={view} onClose={() => setEvening(null)} />}
        </main>

        <aside class="t-side">
          <div class="side-head"><span class="eyebrow">Game log</span></div>
          <LogList log={snap.log} />
          <div class="side-head"><span class="eyebrow">Table talk</span></div>
          <Chat chat={snap.chat} onSend={(text) => send({ t: 'chat', text })} />
        </aside>

        {ended && evening === null && showResult && <Results view={view} room={state.room} isHost={state.you.isHost} onAgain={() => send({ t: 'again' })} onClose={() => setShowResult(false)} />}
        {ended && !showResult && <button class="btn primary result-reopen" onClick={() => setShowResult(true)}>Show the result</button>}
        {snap.error && <div class="toast" key={snap.error.n}>{snap.error.message}</div>}
      </div>
    </PickCtx.Provider>
  );
}
