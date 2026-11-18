// Learn to play: a short, clickable walk through the Open Game, with real cards and small things to try.
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Card } from '../components/Card';
import { Site } from '../components/Site';
import { HOST } from '../lib/cards';
import { Link } from '../lib/router';

// ---------------------------------------------------------------- helpers

/** Signed Offering value: Light positive, Dark negative, Neutral 0. */
const signed = (id: string) => {
  const h = HOST[id];
  if (!h || !h.value) return 0;
  return h.alignment === 'light' ? h.value : h.alignment === 'dark' ? -h.value : 0;
};
const lean = (n: number) => (n > 0 ? 'Light' : n < 0 ? 'Dark' : 'Neutral');
const leanClass = (n: number) => (n > 0 ? 'light' : n < 0 ? 'dark' : 'neutral');

function Callout(p: { children: ComponentChildren; tone?: string }) {
  return <div class={`learn-callout ${p.tone ?? ''}`}>{p.children}</div>;
}

function Meter(p: { light: number; dark: number }) {
  const total = Math.max(1, p.light + p.dark);
  const dir = p.light > p.dark ? 'light' : p.dark > p.light ? 'dark' : 'neutral';
  return (
    <div class="learn-meter">
      <span class="lm-n light">{p.light}<small>Light</small></span>
      <div class="lm-bar"><i class="light" style={{ width: `${(p.light / total) * 100}%` }} /><i class="dark" style={{ width: `${(p.dark / total) * 100}%` }} /></div>
      <span class="lm-n dark">{p.dark}<small>Dark</small></span>
      <div class={`lm-verdict ${dir}`}>{dir === 'neutral' ? 'The Tide is Neutral' : `The Tide is ${dir === 'light' ? 'Light' : 'Dark'}`}</div>
    </div>
  );
}

// ---------------------------------------------------------------- interactive pieces

const CHOIR_POOL = ['host-michael', 'host-mercy', 'host-gabriel', 'host-moloch', 'host-abaddon', 'host-ordeal'];

function ChoirBuilder() {
  const [picked, setPicked] = useState<string[]>(['host-michael', 'host-gabriel', 'host-moloch']);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : [...p.slice(1), id]));
  const light = picked.reduce((a, id) => a + Math.max(0, signed(id)), 0);
  const dark = picked.reduce((a, id) => a + Math.max(0, -signed(id)), 0);
  const net = light - dark;
  return (
    <div class="learn-try" data-no-zoom>
      <div class="eyebrow">Try it: pick up to 4 cards for your Choir</div>
      <div class="learn-cards">
        {CHOIR_POOL.map((id) => <Card id={id} w={104} compact selectable={!picked.includes(id)} selected={picked.includes(id)} onClick={() => toggle(id)} />)}
      </div>
      <div class={`learn-result ${leanClass(net)}`}>
        Light {light} − Dark {dark} = <b>{net === 0 ? 'Neutral (0)' : `${lean(net)} ${Math.abs(net)}`}</b>
        <span>{net === 0 ? 'A balanced Choir never gains or loses at the Reaping.' : `Your Choir leans ${lean(net)}. It scores when the Tide runs ${lean(net)}.`}</span>
      </div>
    </div>
  );
}

// This Evening's Altar, already revealed: Light 3 against Dark 4, so one Gather of Silence flips the Tide.
const ALTAR = ['host-wisdom', 'host-free-will', 'host-council', 'host-serpent', 'host-silence', 'host-leviathan'];

function AltarBuilder() {
  const [off, setOff] = useState<string[]>([]);
  const on = ALTAR.filter((id) => !off.includes(id));
  const light = on.reduce((a, id) => a + Math.max(0, signed(id)), 0);
  const dark = on.reduce((a, id) => a + Math.max(0, -signed(id)), 0);
  const toggle = (id: string) => setOff((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  return (
    <div class="learn-try" data-no-zoom>
      <div class="eyebrow">Try it: tap a card to take it off the Altar</div>
      <div class="learn-altar">
        {ALTAR.map((id) => {
          const v = signed(id);
          return (
            <div class={`la-slot${off.includes(id) ? ' off' : ''}`}>
              <Card id={id} w="calc((100cqw - 40px) / 6)" compact onClick={() => toggle(id)} />
              <span class={`tag ${leanClass(v)}`}>{v === 0 ? 'Neutral' : `+${Math.abs(v)} ${lean(v)}`}</span>
            </div>
          );
        })}
      </div>
      <Meter light={light} dark={dark} />
      <p class="learn-small">
        {off.length === 0
          ? 'Dark wins by 1. Take Silence off and see what happens.'
          : 'Taking a card off the Altar is what a Gather does: one card can turn the Tide.'}
        {off.length > 0 && <> <button class="linkish" onClick={() => setOff([])}>Put them all back</button></>}
      </p>
    </div>
  );
}

function ReapingCalc() {
  const [side, setSide] = useState<'with' | 'against' | 'neutral'>('with');
  const [sharing, setSharing] = useState(2);
  const [alone, setAlone] = useState(true);
  const result = side === 'against' ? (alone ? -3 : -1) : side === 'neutral' ? 0 : sharing === 1 ? 3 : sharing === 2 ? 1 : 0;
  const why = side === 'against' ? (alone ? 'Alone against the Tide: the worst result there is.' : 'Others lean Dark with you, so each of you loses only 1.')
    : side === 'neutral' ? 'A Neutral Choir neither gains nor loses.'
    : sharing === 1 ? 'Alone with the Tide: the best result there is.'
    : sharing === 2 ? 'You share the Tide with one partner: 1 each.'
    : 'Three or more Choirs share the Tide, so none of them is paid. Someone should have switched sides.';
  return (
    <div class="learn-try">
      <div class="eyebrow">Try it: the Tide is Light</div>
      <div class="learn-row">
        <span class="learn-label">Your Choir</span>
        {([['with', 'Leans Light'], ['against', 'Leans Dark'], ['neutral', 'Neutral']] as const).map(([k, l]) => <button class={`chip${side === k ? ' on' : ''}`} onClick={() => setSide(k)}>{l}</button>)}
      </div>
      {side === 'with' && (
        <div class="learn-row">
          <span class="learn-label">Choirs leaning Light, yours included</span>
          {[1, 2, 3].map((k) => <button class={`chip${sharing === k ? ' on' : ''}`} onClick={() => setSharing(k)}>{k === 3 ? '3 or more' : k}</button>)}
        </div>
      )}
      {side === 'against' && (
        <div class="learn-row">
          <span class="learn-label">Choirs leaning Dark, yours included</span>
          {([[true, '1'], [false, '2 or more']] as const).map(([k, l]) => <button class={`chip${alone === k ? ' on' : ''}`} onClick={() => setAlone(k)}>{l}</button>)}
        </div>
      )}
      <div class={`learn-result ${result > 0 ? 'gain' : result < 0 ? 'loss' : ''}`}>
        <b>{result > 0 ? `+${result} Glory` : result < 0 ? `${result} Glory` : 'No change'}</b>
        <span>{why}</span>
      </div>
    </div>
  );
}

type ActionKey = 'offer' | 'gather' | 'exalt';

const ACTIONS: Record<ActionKey, { title: string; icon: string; badge: string; tone: string; summary: string; steps: string[]; why: string }> = {
  offer: {
    title: 'Offer', icon: '✦', badge: '+1 Glory', tone: 'gain',
    summary: 'Hand → Altar, facedown',
    steps: [
      'Choose a card from your hand and put it on the Altar facedown.',
      'Then gain 1 Glory.',
      'Nobody sees what you Offered until the Evening, and anyone who acts after you can still Gather it away.',
    ],
    why: 'Your income, and your secret vote on the Tide.',
  },
  gather: {
    title: 'Gather', icon: '❖', badge: 'Free', tone: '',
    summary: 'Altar → your Choir',
    steps: [
      'Take one card from the Altar into your Choir.',
      'You can take a facedown Altar card without knowing what it is.',
      'If your Choir already has 4 cards, discard one of them first.',
    ],
    why: 'Reshape your Choir for free, or pull a card off the Altar so it stops pushing the Tide.',
  },
  exalt: {
    title: 'Exalt', icon: '▲', badge: 'Free', tone: '',
    summary: 'Hand → your Choir',
    steps: [
      'Play a card from your hand straight into your Choir.',
      'If your Choir already has 4 cards, discard one of them first.',
      'The card never touches the Altar, so nobody sees it coming.',
    ],
    why: 'Build exactly the Choir you want. It costs no Glory, but you give up the Offer.',
  },
};

/** The three actions side by side; choosing one opens its details below. */
function Actions() {
  const [a, setA] = useState<ActionKey>('offer');
  const info = ACTIONS[a];
  return (
    <div class="learn-try">
      <div class="eyebrow">Pick one each turn. Tap one to see how it works.</div>
      <div class="learn-actions" role="tablist" aria-label="The three actions">
        {(Object.keys(ACTIONS) as ActionKey[]).map((k) => (
          <button role="tab" aria-selected={a === k} class={`learn-act${a === k ? ' on' : ''}`} onClick={() => setA(k)}>
            <span class="la-icon">{ACTIONS[k].icon}</span>
            <b>{ACTIONS[k].title}</b>
            <span class="la-sum">{ACTIONS[k].summary}</span>
            <span class={`la-badge ${ACTIONS[k].tone}`}>{ACTIONS[k].badge}</span>
          </button>
        ))}
      </div>
      <div class="learn-action" role="tabpanel" key={a}>
        <div class="learn-action-head"><b>{info.title}</b><span class={`la-badge ${info.tone}`}>{info.badge}</span></div>
        <ol>{info.steps.map((t) => <li>{t}</li>)}</ol>
        <p class="muted">{info.why}</p>
      </div>
      <p class="learn-small">After your action, use any of your Choir's “On your turn” abilities, once each. Your Celestial's power is extra: it never uses up your action.</p>
    </div>
  );
}

type TimingKey = 'morning' | 'turn' | 'reaping' | 'always';

const TIMINGS: Record<TimingKey, { title: string; when: string; cards: string[]; how: string; tip: string }> = {
  morning: {
    title: 'In the Morning', when: 'Before First Fruits',
    cards: ['host-prophecy'],
    how: 'Works at the start of each Day, before anyone has shown a card. Prophecy calls the Tide: right, gain 1; wrong, lose 1.',
    tip: 'A bet you make before you know anything. Watch the other Choirs before you call it.',
  },
  turn: {
    title: 'On your turn', when: 'After your action',
    cards: ['host-wisdom', 'host-watchers'],
    how: 'After your action, use each “On your turn” card in your Choir once. They never use up your action.',
    tip: 'Each one is a free extra move every Day, so they are worth more the earlier you have them.',
  },
  reaping: {
    title: 'At the end of the Day', when: 'After the Tide is scored',
    cards: ['host-twilight', 'host-uriel'],
    how: 'Works in the Evening, after every Choir is scored. Most pay Glory on a condition; some store it on the card for later.',
    tip: 'These pay every Evening, on top of the Tide. A few of them can carry you to 10.',
  },
  always: {
    title: 'Always on', when: 'No label, or “When…”',
    cards: ['host-cherubim', 'host-snare'],
    how: 'A card with no label works all the time. One that starts with “When…” works whenever that happens, even on someone else’s turn.',
    tip: 'Nothing to remember to use. Some protect you, some quietly pay you.',
  },
};

/** The four timing labels, each with real cards. */
function Timings() {
  const [t, setT] = useState<TimingKey>('turn');
  const info = TIMINGS[t];
  return (
    <div class="learn-try">
      <div class="eyebrow">Every ability starts with when it works. Tap one.</div>
      <div class="learn-actions four" role="tablist" aria-label="When abilities work">
        {(Object.keys(TIMINGS) as TimingKey[]).map((k) => (
          <button role="tab" aria-selected={t === k} class={`learn-act${t === k ? ' on' : ''}`} onClick={() => setT(k)}>
            <b>{TIMINGS[k].title}</b>
            <span class="la-sum">{TIMINGS[k].when}</span>
          </button>
        ))}
      </div>
      <div class="learn-action learn-timing" role="tabpanel" key={t}>
        <div class="learn-cards">{info.cards.map((id) => <Card id={id} w={150} />)}</div>
        <div>
          <p>{info.how}</p>
          <p class="muted">{info.tip}</p>
        </div>
      </div>
      <p class="learn-small">◆ <b>Once per game</b> cards, like Free Will and Mercy, are turned sideways when used. Save them for the Day they decide.</p>
    </div>
  );
}

// ---------------------------------------------------------------- the steps

interface Step { title: string; body: ComponentChildren; side?: ComponentChildren }

const STEPS: Step[] = [
  {
    title: 'The Divide in 5 minutes',
    body: (
      <>
        <p>Each Day, everyone secretly feeds a shared Altar. In the Evening the Altar tips toward the Light or the Dark. Players whose Choirs lean that way score, and the fewer of them, the more each one gets. So you need allies, but not too many.</p>
        <p>This walk-through teaches the 3 and 4 player game, the one you play on this site. Use <b>Next</b>, or the arrow keys.</p>
      </>
    ),
    side: (
      <div class="learn-fan">
        <Card id="host-michael" w={130} />
        <Card id="celestial-the-whisper" w={140} />
        <Card id="host-moloch" w={130} />
      </div>
    ),
  },
  {
    title: 'The goal: 12 Glory',
    body: (
      <>
        <p><b>Glory</b> is your score. You gain it from cards you Offer, from the Tide each Evening, and from your Choir's abilities.</p>
        <p>The first Evening anyone finishes with <b>12 or more Glory</b>, the game ends and <b>the most Glory wins</b>.</p>
      </>
    ),
    side: (
      <div class="learn-track">
        {[['Ada', 10, 'var(--seat-0)'], ['Ben', 8, 'var(--seat-1)'], ['Cy', 5, 'var(--seat-2)']].map(([n, g, c]) => (
          <div class="lt-row"><span>{n}</span><div class="lt-bar"><i style={{ width: `${(Number(g) / 12) * 100}%`, background: c as string }} /><em style={{ left: `${(10 / 12) * 100}%` }} /></div><b class="num">{g}</b></div>
        ))}
        <p class="muted small">Ada reached 12, so the game is over. Ada wins.</p>
      </div>
    ),
  },
  {
    title: 'What you have',
    body: (
      <ul class="learn-list">
        <li><b>A Choir</b> of up to 4 cards, face up in front of you. You start with 2, dealt at random. Their abilities are yours to use, and together they lean Light or Dark: that is your side.</li>
        <li><b>A hand</b> of 3 cards only you can see. You refill it every Evening.</li>
        <li class="muted">In the <b>Advanced game</b>, everyone also has a <b>Celestial</b> (a public power), and an <b>Event</b> changes one rule each Day.</li>
      </ul>
    ),
    side: (
      <div class="learn-mine">
        <div><div class="learn-label">Choir</div><div class="learn-cards tight"><Card id="host-michael" w={92} compact /><Card id="host-gabriel" w={92} compact /><div class="slot" style={{ '--w': '92px' } as any} /><div class="slot" style={{ '--w': '92px' } as any} /></div></div>
        <div><div class="learn-label">Hand</div><div class="learn-cards tight"><Card id={null} w={64} /><Card id={null} w={64} /><Card id={null} w={64} /></div></div>
      </div>
    ),
  },
  {
    title: 'Light, Dark and Neutral',
    body: (
      <>
        <p>Every card has a value at the bottom: <span class="tag light">Light +1</span> <span class="tag dark">Dark +1</span>, sometimes +2, or <span class="tag neutral">Neutral</span>.</p>
        <p>On the <b>Altar</b>, a card's value pushes the Tide its way. In your <b>Choir</b>, it pulls your lean its way. Neutral cards push and pull nothing, but they still have abilities.</p>
        <p class="muted">Hover over any card (or press and hold on a phone) to read it full size.</p>
      </>
    ),
    side: (
      <div class="learn-cards">
        <Card id="host-michael" w={150} />
        <Card id="host-ordeal" w={150} />
        <Card id="host-moloch" w={150} />
      </div>
    ),
  },
  {
    title: 'Your Choir leans',
    body: (
      <>
        <p>Add up the Light in your Choir, subtract the Dark: that's your <b>lean</b>, and the side you are on.</p>
        <p>Everyone can see your Choir, so everyone knows whose side you are on, and who you are competing with.</p>
      </>
    ),
    side: <ChoirBuilder />,
  },
  {
    title: 'Morning: the Day begins',
    body: (
      <>
      <p>Every Day has three parts: <b>Morning</b> sets up the Altar, at <b>Noon</b> everyone takes a turn, and in the <b>Evening</b> the Tide is set and everyone scores.</p>
      <ol class="learn-list">
        <li><b>Predictions:</b> cards like Prophecy are used now. <span class="muted">(In the Advanced game, an Event is revealed first.)</span></li>
        <li><b>First Fruits:</b> everyone secretly picks one card from their hand, then all are revealed together onto the Altar. Then everyone draws one.</li>
      </ol>
      </>
    ),
    side: (
      <div class="learn-morning">
        <div>
          <div class="learn-label">The Altar after First Fruits</div>
          <div class="learn-cards tight">
            <Card id="host-wisdom" w={78} compact owner={0} />
            <Card id="host-serpent" w={78} compact owner={1} />
            <Card id="host-leviathan" w={78} compact owner={2} />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Noon: one action each',
    body: (
      <>
        <p>Going around the table, each player takes <b>one turn</b> and picks <b>one of three actions</b>:</p>
        <ul class="learn-list">
          <li><b>Offer</b> a card to the Altar, facedown, and <b>gain 1 Glory</b>.</li>
          <li><b>Gather</b> a card into your Choir, <b>free</b>.</li>
          <li><b>Exalt</b> a card from your hand into your Choir, <b>free</b>.</li>
        </ul>
        <p class="muted">A hidden Offer can help you, hurt a rival, or bluff: the table only sees it in the Evening.</p>
      </>
    ),
    side: <Actions />,
  },
  {
    title: 'Evening: the Tide',
    body: (
      <>
        <p>When everyone has had a turn, every facedown card on the Altar is turned face up. Add up its Light and its Dark. The heavier side is the <b>Tide</b>. A tie is a Neutral Tide.</p>
      </>
    ),
    side: <AltarBuilder />,
  },
  {
    title: 'The Reaping',
    body: (
      <>
        <p>Now every Choir is scored. Alone, you win or lose big:</p>
        <ul class="learn-list">
          <li><b>Alone with the Tide:</b> gain 3. <b>Alone against it:</b> lose 3.</li>
          <li><b>Two with the Tide:</b> gain 1 each.</li>
          <li><b>Three or more with it:</b> nobody gains.</li>
          <li><b>Against it with company:</b> lose 1 each.</li>
        </ul>
        <p class="muted">So you want allies to win the Tide, but as few as possible. Then the Altar is cleared, hands are refilled, and a new Day begins.</p>
      </>
    ),
    side: <ReapingCalc />,
  },
  {
    title: 'Building your Choir',
    body: (
      <>
        <p>Your Choir is your side, and it is also your engine. Its cards' abilities are yours to use.</p>
        <ul class="learn-list">
          <li><b>Grow it</b> with a Gather from the Altar or an Exalt from your hand, both free. It holds 4 cards; when it is full, a new card replaces one of yours, which is discarded.</li>
          <li><b>Every card does two jobs.</b> Its value moves your lean; its ability earns you Glory or gets in someone's way.</li>
          <li><b>Neutral cards</b> add an ability without moving your lean, so you can build without changing sides.</li>
        </ul>
        <p class="muted">An Offer pays 1 Glory once. A good Choir card pays every Day, so build early.</p>
      </>
    ),
    side: <Timings />,
  },
  {
    title: 'How it ends',
    body: (
      <>
        <p>After any Reaping where someone has <b>12 or more</b>, the game ends. <b>Most Glory wins</b>; a tie is shared.</p>
      </>
    ),
    side: (
      <Callout>
        <div class="eyebrow">Example</div>
        <p>After the Reaping, Ada has 12 Glory, Ben 13 and Cy 9.</p>
        <p>Ada reached 12, so the game ends, but <b>Ben has the most. Ben wins.</b></p>
      </Callout>
    ),
  },
  {
    title: 'Playing well',
    body: (
      <ul class="learn-list">
        <li><b>Too many on one side pays no one.</b> When three Choirs lean the same way, someone has to switch. Say so at the table.</li>
        <li><b>Build for later.</b> Offers pay now; a strong Choir keeps paying every Evening.</li>
        <li><b>Read the table.</b> First Fruits are the one honest card each player has to show you. A card someone throws out of their Choir tells you which way they've decided to lean.</li>
        <li><b>Make deals.</b> Talk at the table. Promises aren't binding, so trust carefully.</li>
      </ul>
    ),
    side: (
      <div class="learn-fan">
        <Card id="host-mirage" w={130} />
        <Card id="host-covenant" w={130} />
        <Card id="host-snare" w={130} />
      </div>
    ),
  },
  {
    title: 'Playing on this site',
    body: (
      <ul class="learn-list">
        <li><b>The bar under the Altar</b> always says what you can do. Cards you can choose glow; click one, then confirm.</li>
        <li><b>Hover or press and hold</b> any card to read it.</li>
        <li><b>Each choice has a timer.</b> If it runs out, a computer player makes that one choice for you.</li>
        <li><b>The log</b> on the right shows everything that happened, including things only you saw.</li>
        <li><b>Empty seats</b> can be filled by computer players.</li>
      </ul>
    ),
    side: (
      <div class="learn-done panel">
        <div class="eyebrow">You're ready</div>
        <h3>Gather a table</h3>
        <p class="muted">Start a table and send the link, or look something up in the full rules.</p>
        <div class="learn-done-actions">
          <Link href="/" class="btn primary">Start a table</Link>
          <Link href="/rules" class="btn">Full rules</Link>
          <Link href="/cards" class="btn quiet">All cards</Link>
        </div>
      </div>
    ),
  },
];

export function Learn() {
  const fromHash = () => Math.min(STEPS.length - 1, Math.max(0, Number(location.hash.replace('#', '')) - 1 || 0));
  const [i, setI] = useState(fromHash);
  const go = (n: number) => {
    const next = Math.min(STEPS.length - 1, Math.max(0, n));
    setI(next);
    history.replaceState(null, '', `#${next + 1}`);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [i]);
  const s = STEPS[i];
  return (
    <Site wide>
      <div class="learn">
        <div class="learn-progress" role="tablist" aria-label="Steps">
          {STEPS.map((st, k) => <button class={`lp-dot${k === i ? ' on' : k < i ? ' done' : ''}`} title={st.title} aria-label={`Step ${k + 1}: ${st.title}`} aria-selected={k === i} onClick={() => go(k)} />)}
        </div>
        <div class="learn-step" key={i}>
          <div class="learn-text">
            <div class="eyebrow">Step {i + 1} of {STEPS.length}</div>
            <h1>{s.title}</h1>
            <div class="learn-body">{s.body}</div>
            <div class="learn-nav">
              <button class="btn quiet" disabled={i === 0} onClick={() => go(i - 1)}>Back</button>
              {i < STEPS.length - 1 ? <button class="btn primary" onClick={() => go(i + 1)}>Next</button> : <Link href="/" class="btn primary">Start playing</Link>}
            </div>
          </div>
          <div class="learn-side">{s.side}</div>
        </div>
      </div>
    </Site>
  );
}
