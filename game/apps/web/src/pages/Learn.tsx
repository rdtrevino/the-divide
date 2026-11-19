// Learn to play: a short, clickable walk through the game, with real cards and small things to try.
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
      <div class={`lm-verdict ${dir}`}>{dir === 'neutral' ? 'Neutral: no one wins the Day' : `${dir === 'light' ? 'Light' : 'Dark'} wins the Day`}</div>
    </div>
  );
}

// ---------------------------------------------------------------- interactive pieces

const CHOIR_POOL = ['host-michael', 'host-mercy', 'host-gabriel', 'host-moloch', 'host-abaddon', 'host-envy'];

function ChoirBuilder() {
  const [picked, setPicked] = useState<string[]>(['host-michael', 'host-gabriel', 'host-moloch']);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : [...p.slice(1), id]));
  const light = picked.filter((id) => signed(id) > 0).length;
  const dark = picked.filter((id) => signed(id) < 0).length;
  return (
    <div class="learn-try" data-no-zoom>
      <div class="eyebrow">Try it: pick up to 4 cards for your Choir</div>
      <div class="learn-pick">
        {CHOIR_POOL.map((id) => <Card id={id} w="calc((100cqw - 40px) / 6)" compact selectable={!picked.includes(id)} selected={picked.includes(id)} onClick={() => toggle(id)} />)}
      </div>
      <div class="learn-result">
        <span class="light">A Light Day pays you <b>{2 * light}</b></span> · <span class="dark">a Dark Day pays you <b>{2 * dark}</b></span>
        <span>{light && dark ? 'A mixed Choir scores whichever side wins, a little each time.' : light || dark ? `All your cards are ${light ? 'Light' : 'Dark'}: big Days when ${light ? 'Light' : 'Dark'} wins, nothing when it loses.` : 'Pick some cards.'}</span>
      </div>
    </div>
  );
}

/** Your secret tokens against the Tide track. */
function TokenCalc() {
  const [mine, setMine] = useState(4);
  const [lw, setLw] = useState(4);
  const days = 6;
  const dw = days - lw;
  const score = mine * lw + (6 - mine) * dw;
  return (
    <div class="learn-try">
      <div class="eyebrow">Try it: a 3-player game lasts 6 Days</div>
      <div class="learn-row">
        <span class="learn-label">Your 6 tokens</span>
        {[6, 5, 4, 3, 2, 1, 0].map((k) => <button class={`chip${mine === k ? ' on' : ''}`} onClick={() => setMine(k)}>{k} Light · {6 - k} Dark</button>)}
      </div>
      <div class="learn-row">
        <span class="learn-label">Days won</span>
        {Array.from({ length: days + 1 }, (_, k) => <button class={`chip${lw === k ? ' on' : ''}`} onClick={() => setLw(k)}>Light {k} · Dark {days - k}</button>)}
      </div>
      <div class="learn-result gain">
        <b>+{score} Glory</b>
        <span>{mine} Light × {lw} + {6 - mine} Dark × {dw}. Everyone holds some of each, so every Day pays everyone a little, and some much more than others.</span>
      </div>
    </div>
  );
}

// This Evening's Altar, already revealed: Light 2 against Dark 3, so one Gather of Silence makes the Day a tie.
const ALTAR = ['host-wisdom', 'host-free-will', 'host-serpent', 'host-silence', 'host-leviathan'];

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

type ActionKey = 'offer' | 'gather' | 'exalt';

const ACTIONS: Record<ActionKey, { title: string; icon: string; badge: string; tone: string; summary: string; steps: string[]; why: string }> = {
  offer: {
    title: 'Offer', icon: '✦', badge: 'Push a side', tone: 'gain',
    summary: 'Hand → Altar, facedown',
    steps: [
      'Put a card from your hand on the Altar facedown, or one of your tokens: a token counts 2 for its color.',
      'It earns you nothing directly. It pushes the Day toward a side, and everyone who holds that side gains.',
      'Nobody sees what you Offered until the Evening, and anyone who acts after you can still Gather it away.',
    ],
    why: 'The public good: your secret vote on who wins the Day. Whoever Offers the fewest times loses 3 at the end.',
  },
  gather: {
    title: 'Gather', icon: '❖', badge: 'Free', tone: '',
    summary: 'Altar → your Choir',
    steps: [
      'Take one card from the Altar into your Choir, or a token into your hidden tokens.',
      'You can take a facedown card or token without knowing what it is.',
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
    why: 'Build exactly the Choir you want. It helps only you.',
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

type TimingKey = 'morning' | 'turn' | 'evening' | 'reaping' | 'always';

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
  evening: {
    title: 'In the Evening', when: 'Before the Altar is revealed',
    cards: ['host-fig-leaves'],
    how: 'Works after every turn, just before the facedown cards on the Altar are turned over. Fig Leaves can take back a card you Offered.',
    tip: 'You decide knowing every move but not every card. Read the Offers you saw go down.',
  },
  reaping: {
    title: 'At the end of the Day', when: 'After the Choirs are scored',
    cards: ['host-twilight', 'host-uriel'],
    how: 'Works in the Evening, after every Choir is scored. Most pay Glory on a condition; some store it on the card for later.',
    tip: 'These pay every Evening, on top of your Choir\'s scoring. Over 6 or 8 Days they add up.',
  },
  always: {
    title: 'Always on', when: 'No label, or “When…”',
    cards: ['host-cherubim', 'host-snare'],
    how: 'A card with no label works all the time. One that starts with “When…” works whenever that happens, even on someone else’s turn.',
    tip: 'Nothing to remember to use. Some protect you, some quietly pay you.',
  },
};

/** The four timing labels, and abilities that are always on, each with real cards. */
function Timings() {
  const [t, setT] = useState<TimingKey>('turn');
  const info = TIMINGS[t];
  return (
    <div class="learn-try">
      <div class="eyebrow">Every ability starts with when it works. Tap one.</div>
      <div class="learn-actions five" role="tablist" aria-label="When abilities work">
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
      <p class="learn-small">◆ <b>Spent cards</b>, like Free Will and Michael, end with “then discard this card”: they work once. Save them for the Day they decide.</p>
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
        <p>Each Day, everyone secretly feeds a shared Altar, and the heavier side, Light or Dark, wins the Day. You hold a secret mix of Light and Dark <b>tokens</b>, and so does everyone else, so you never quite know who is on your side.</p>
        <p>Every card you play is a choice between helping yourself and helping a side. This walk-through teaches the game for 3 or 4 players. Use <b>Next</b>, or the arrow keys.</p>
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
    title: 'The goal: the most Glory',
    body: (
      <>
        <p><b>Glory</b> is your score. Your <b>Choir</b> earns it every Evening, and your secret <b>tokens</b> earn it all at once at the end.</p>
        <p>The game lasts <b>6 Days with 3 players, 8 with 4</b>. Then the tokens are revealed, and <b>the most Glory wins</b>.</p>
      </>
    ),
    side: (
      <div class="learn-track">
        {[['Ada', 14, 20, 'var(--seat-0)'], ['Ben', 22, 9, 'var(--seat-1)'], ['Cy', 17, 14, 'var(--seat-2)']].map(([n, c, t, col]) => (
          <div class="lt-row"><span>{n}</span><div class="lt-bar"><i style={{ width: `${(Number(c) / 40) * 100}%`, background: col as string }} /><i style={{ width: `${(Number(t) / 40) * 100}%`, background: col as string, opacity: 0.45 }} /></div><b class="num">{Number(c) + Number(t)}</b></div>
        ))}
        <p class="muted small">Solid: Glory from the Choir during the game. Faded: the tokens at the end. Ben led all game; Ada's tokens win it.</p>
      </div>
    ),
  },
  {
    title: 'What you have',
    body: (
      <ul class="learn-list">
        <li><b>A Choir</b> of up to 4 cards, face up in front of you. You start with 2, dealt at random. Their abilities are yours to use.</li>
        <li><b>A hand</b> of 3 cards only you can see. You refill it every Evening.</li>
        <li><b>Six secret tokens</b>, some Light and some Dark, dealt from a shuffled pile. Everyone sees how many you hold, never which.</li>
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
    title: 'Light and Dark',
    body: (
      <>
        <p>Every card is <span class="tag light">Light</span> or <span class="tag dark">Dark</span>, worth +1 (a few +2).</p>
        <p>On the <b>Altar</b>, a card pushes the Day its way. In your <b>Choir</b>, it scores on the Days its color wins. Its ability is yours either way.</p>
        <p class="muted">Hover over any card (or press and hold on a phone) to read it full size.</p>
      </>
    ),
    side: (
      <div class="learn-cards">
        <Card id="host-michael" w={150} />
        <Card id="host-twilight" w={150} />
        <Card id="host-moloch" w={150} />
      </div>
    ),
  },
  {
    title: 'Your Choir scores',
    body: (
      <>
        <p>Each Evening, <b>every card in your Choir of the winning color scores 2 Glory</b>. Nothing is ever lost.</p>
        <p>Everyone can see your Choir, so everyone can see what each side's win is worth to you. That is a clue to your side, not a proof.</p>
      </>
    ),
    side: <ChoirBuilder />,
  },
  {
    title: 'Your secret tokens',
    body: (
      <>
        <p>Every Day is marked on the <b>Tide track</b> for the side that won it. At the end, <b>each of your tokens scores 1 for every Day its color won</b>.</p>
        <p>Nobody is purely on one side: a Light Day pays every Light token at the table, yours and your rivals'. So the question is never only "who wins?", but "who paid for it?"</p>
      </>
    ),
    side: <TokenCalc />,
  },
  {
    title: 'Morning: the Day begins',
    body: (
      <>
      <p>Every Day has three parts: <b>Morning</b> sets up the Altar, at <b>Noon</b> everyone takes a turn, and in the <b>Evening</b> the Tide is set and everyone scores.</p>
      <ol class="learn-list">
        <li><b>Predictions:</b> cards like Prophecy are used now. <span class="muted">(In the Advanced game, an Event is revealed first.)</span></li>
        <li><b>First Fruits:</b> everyone secretly gives one card from their hand. They are shuffled and turned face up onto the Altar, so no one knows whose is whose. Then everyone draws one.</li>
      </ol>
      </>
    ),
    side: (
      <div class="learn-morning">
        <div>
          <div class="learn-label">The Altar after First Fruits</div>
          <div class="learn-cards tight">
            <Card id="host-wisdom" w={78} compact />
            <Card id="host-serpent" w={78} compact />
            <Card id="host-leviathan" w={78} compact />
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
          <li><b>Offer</b> a card, or one of your tokens, facedown onto the Altar: it helps a side.</li>
          <li><b>Gather</b> a card into your Choir, or a token from the Altar: it helps you.</li>
          <li><b>Exalt</b> a card from your hand into your Choir: it helps you.</li>
        </ul>
        <p class="muted">An Offer helps everyone who holds that side. Building helps only you. That choice, every turn, is the game.</p>
      </>
    ),
    side: <Actions />,
  },
  {
    title: 'Evening: who wins the Day',
    body: (
      <>
        <p>When everyone has had a turn, the facedown Offers are shuffled and turned face up, so the table sees what was given but not by whom. Add up the Light and the Dark (a token counts 2). The heavier side <b>wins the Day</b>: mark it on the Tide track. A tie is Neutral, and no one wins.</p>
      </>
    ),
    side: <AltarBuilder />,
  },
  {
    title: 'The Reaping',
    body: (
      <>
        <p>Every Choir card of the winning color scores <b>2 Glory</b>.</p>
        <p>Then any tokens left on the Altar are handed out, one at a time, to whoever holds the fewest. The Altar is cleared, hands are refilled, and a new Day begins.</p>
        <p class="muted">An Offered token is gone from you, and may land in a rival's hand. That is its price.</p>
      </>
    ),
    side: (
      <Callout>
        <div class="eyebrow">Example: Light wins the Day</div>
        <p>Ada's Choir holds two Light cards and a Dark one: she scores <b>4</b>.</p>
        <p>Ben's Choir is all Dark: he scores nothing today. But Ben may hold mostly Light tokens, and Light just won a Day.</p>
      </Callout>
    ),
  },
  {
    title: 'Building your Choir',
    body: (
      <>
        <p>Your Choir is your side, and it is also your engine. Its cards' abilities are yours to use.</p>
        <ul class="learn-list">
          <li><b>Grow it</b> with a Gather from the Altar or an Exalt from your hand, both free. It holds 4 cards; when it is full, a new card replaces one of yours, which is discarded.</li>
          <li><b>Every card does two jobs.</b> Its color scores on the Days that color wins; its ability earns you Glory or gets in someone's way.</li>
          <li><b>Mix or commit.</b> A Choir of one color scores big on its Days and nothing on the others; a mixed Choir scores a little every Day, and tells the table less.</li>
        </ul>
        <p class="muted">A card in your Choir pays every Day it is there, so build early, but someone has to pay for the Days.</p>
      </>
    ),
    side: <Timings />,
  },
  {
    title: 'How it ends',
    body: (
      <>
        <p>After the last Evening, everyone <b>reveals their tokens</b>. Each scores 1 for every Day its color won.</p>
        <p>Whoever <b>Offered the fewest times loses 3</b>. Then <b>the most Glory wins</b>; a tie is shared.</p>
      </>
    ),
    side: (
      <Callout>
        <div class="eyebrow">Example</div>
        <p>Light won 4 Days and Dark won 2. Ada holds 4 Light and 2 Dark tokens: 4 × 4 + 2 × 2 = <b>20</b>, added to the Glory her Choir earned.</p>
        <p>Ben led all game with a big Dark Choir, but he hoarded his cards and Offered the least: he loses 3, and Ada wins.</p>
      </Callout>
    ),
  },
  {
    title: 'Playing well',
    body: (
      <ul class="learn-list">
        <li><b>Let others pay, but not too often.</b> Every Offer helps the whole side; the player who gives least keeps the most, until the Miser's Rule bites.</li>
        <li><b>A token is your strongest push and your dearest.</b> Spend one when a Day truly hangs on it.</li>
        <li><b>Read the table.</b> Choirs are public, Offers are anonymous, and a Choir full of Light cards may hide a hand of Dark tokens.</li>
        <li><b>Make deals.</b> The Tide track gives everyone the same numbers to argue over. Promises aren't binding, so trust carefully.</li>
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
  // A link to another step (such as /learn#5) while already on this page changes only the hash.
  useEffect(() => {
    const onHash = () => setI(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
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
