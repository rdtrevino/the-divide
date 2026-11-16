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
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : [...p.slice(1), id]));
  const light = picked.reduce((a, id) => a + Math.max(0, signed(id)), 0);
  const dark = picked.reduce((a, id) => a + Math.max(0, -signed(id)), 0);
  const net = light - dark;
  return (
    <div class="learn-try">
      <div class="eyebrow">Try it: pick 3 cards for your Choir</div>
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

const ALTAR_POOL = ['host-wisdom', 'host-free-will', 'host-serpent', 'host-silence', 'host-council', 'host-leviathan'];

function AltarBuilder() {
  const [on, setOn] = useState<string[]>(['host-wisdom', 'host-serpent', 'host-leviathan']);
  const [revealed, setRevealed] = useState(false);
  const light = on.reduce((a, id) => a + Math.max(0, signed(id)), 0);
  const dark = on.reduce((a, id) => a + Math.max(0, -signed(id)), 0);
  return (
    <div class="learn-try">
      <div class="eyebrow">Try it: put cards on the Altar, then reveal it</div>
      <div class="learn-split">
        <div>
          <div class="learn-label">Cards you could Offer</div>
          <div class="learn-cards small">
            {ALTAR_POOL.filter((id) => !on.includes(id)).map((id) => <Card id={id} w={84} compact selectable onClick={() => { setOn([...on, id]); setRevealed(false); }} />)}
            {ALTAR_POOL.every((id) => on.includes(id)) && <span class="muted">All on the Altar.</span>}
          </div>
        </div>
        <div>
          <div class="learn-label">The Altar {on.length > 0 && <span class="muted">(click a card to take it back)</span>}</div>
          <div class="learn-cards small altar">
            {on.map((id) => <Card id={revealed ? id : null} w={84} compact={revealed} onClick={() => setOn(on.filter((x) => x !== id))} />)}
            {!on.length && <span class="muted">Empty: the Tide would be Neutral.</span>}
          </div>
        </div>
      </div>
      {!revealed ? (
        <button class="btn primary" onClick={() => setRevealed(true)}>It's Evening: reveal the Altar</button>
      ) : (
        <>
          <Meter light={light} dark={dark} />
          <button class="btn quiet small" onClick={() => setRevealed(false)}>Turn them facedown again</button>
        </>
      )}
    </div>
  );
}

function ReapingCalc() {
  const [choir, setChoir] = useState(2);
  const [tide, setTide] = useState<'light' | 'dark' | 'neutral'>('light');
  const t = tide === 'light' ? 1 : tide === 'dark' ? -1 : 0;
  const raw = t === 0 || choir === 0 ? 0 : Math.sign(choir) === t ? Math.abs(choir) : -Math.abs(choir);
  const result = Math.max(-3, Math.min(3, raw));
  return (
    <div class="learn-try">
      <div class="eyebrow">Try it</div>
      <div class="learn-row">
        <span class="learn-label">Your Choir leans</span>
        {[4, 2, 1, 0, -1, -3].map((v) => <button class={`chip${choir === v ? ' on' : ''}`} onClick={() => setChoir(v)}>{v === 0 ? 'Neutral' : `${lean(v)} ${Math.abs(v)}`}</button>)}
      </div>
      <div class="learn-row">
        <span class="learn-label">The Tide is</span>
        {(['light', 'dark', 'neutral'] as const).map((d) => <button class={`chip${tide === d ? ' on' : ''}`} onClick={() => setTide(d)}>{d[0].toUpperCase() + d.slice(1)}</button>)}
      </div>
      <div class={`learn-result ${result > 0 ? 'gain' : result < 0 ? 'loss' : ''}`}>
        <b>{result > 0 ? `+${result} Glory` : result < 0 ? `${result} Glory` : 'No change'}</b>
        <span>
          {t === 0 ? 'A Neutral Tide scores nothing for anyone.' : choir === 0 ? 'A balanced Choir scores nothing.' : raw > 0 ? 'Your Choir leans with the Tide: you gain its lean.' : 'Your Choir leans against the Tide: you lose its lean.'}
          {Math.abs(raw) > 3 && ' (Capped at 3 per Reaping.)'}
        </span>
      </div>
    </div>
  );
}

function Actions() {
  const [a, setA] = useState<'offer' | 'gather' | 'exalt'>('offer');
  const info = {
    offer: { title: 'Offer', cost: 'Free', text: 'Put a card from your hand facedown on the Altar, then gain 1 Glory or draw 1 card.', why: 'Your income, and your secret vote on the Tide. Nobody knows what you Offered until the Evening.' },
    gather: { title: 'Gather', cost: 'Free', text: 'Take a card from the Altar (even a facedown one) or from the top of the deck into your Choir. If your Choir is full, discard one of its cards first.', why: 'Reshape your Choir, or pull a card off the Altar so it stops pushing the Tide.' },
    exalt: { title: 'Exalt', cost: '1 Glory', text: 'Play a card from your hand straight into your Choir. If your Choir is full, discard one of its cards first.', why: 'Change your Choir without showing the card to the Altar first.' },
  }[a];
  return (
    <div class="learn-try">
      <div class="learn-tabs" role="tablist">
        {(['offer', 'gather', 'exalt'] as const).map((k) => <button role="tab" aria-selected={a === k} class={`learn-tab${a === k ? ' on' : ''}`} onClick={() => setA(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}
      </div>
      <div class="learn-action">
        <div class="learn-action-head"><b>{info.title}</b><span>{info.cost}</span></div>
        <p>{info.text}</p>
        <p class="muted">{info.why}</p>
      </div>
      <p class="learn-small">After your action, use any of your Choir's “On your turn” abilities, once each. Your Celestial's power is extra: it never uses up your action.</p>
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
        <p>Each Day, everyone secretly feeds a shared Altar. At night the Altar tips toward the Light or the Dark, and every player whose cards lean the same way gains Glory.</p>
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
    title: 'The goal: 10 Glory',
    body: (
      <>
        <p><b>Glory</b> is your score. You gain it from cards you Offer and from your Choir each night.</p>
        <p>The first night anyone finishes with <b>10 or more Glory</b>, the game ends. A small bonus is added, and then <b>the most Glory wins</b>, so reaching 10 first doesn't guarantee the win.</p>
      </>
    ),
    side: (
      <div class="learn-track">
        {[['Ada', 10, 'var(--seat-0)'], ['Ben', 8, 'var(--seat-1)'], ['Cy', 5, 'var(--seat-2)']].map(([n, g, c]) => (
          <div class="lt-row"><span>{n}</span><div class="lt-bar"><i style={{ width: `${(Number(g) / 12) * 100}%`, background: c as string }} /><em style={{ left: `${(10 / 12) * 100}%` }} /></div><b class="num">{g}</b></div>
        ))}
        <p class="muted small">Ada reached 10, so this was the last Day.</p>
      </div>
    ),
  },
  {
    title: 'What you have',
    body: (
      <ul class="learn-list">
        <li><b>A Celestial.</b> Your special power. Everyone can see it.</li>
        <li><b>A Choir</b> of 3 cards, face up in front of you. Their abilities are yours to use, and together they lean Light or Dark.</li>
        <li><b>A hand</b> of 3 cards only you can see. You refill it every night.</li>
      </ul>
    ),
    side: (
      <div class="learn-mine">
        <div><div class="learn-label">Celestial</div><Card id="celestial-the-whisper" w={92} compact /></div>
        <div><div class="learn-label">Choir</div><div class="learn-cards tight"><Card id="host-michael" w={92} compact /><Card id="host-gabriel" w={92} compact /><Card id="host-moloch" w={92} compact /></div></div>
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
        <p>Add up the Light in your Choir, subtract the Dark: that's your <b>Alignment</b>.</p>
        <p>Everyone can see your Choir, so everyone knows which way you need the Tide to go.</p>
      </>
    ),
    side: <ChoirBuilder />,
  },
  {
    title: 'Morning: the Day begins',
    body: (
      <ol class="learn-list">
        <li><b>An Event</b> changes one rule for the whole Day.</li>
        <li><b>The Seed:</b> the top card of the deck goes face up on the Altar.</li>
        <li><b>First Fruits:</b> everyone secretly picks one card from their hand, then all are revealed together onto the Altar. Then everyone draws one.</li>
      </ol>
    ),
    side: (
      <div class="learn-morning">
        <Card id="event-creation" w={250} />
        <div>
          <div class="learn-label">The Altar so far</div>
          <div class="learn-cards tight">
            <Card id="host-council" w={78} compact tag="Seed" />
            <Card id="host-wisdom" w={78} compact owner={0} />
            <Card id="host-serpent" w={78} compact owner={1} />
            <Card id="host-leviathan" w={78} compact owner={2} />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Your turn: one action',
    body: (
      <>
        <p>Going around the table, each player takes <b>one turn</b> and picks <b>one action</b>.</p>
        <p>Offers go on the Altar <b>facedown</b>. The table only learns what they were in the Evening, so a hidden Offer can help you, hurt a rival, or bluff.</p>
      </>
    ),
    side: <Actions />,
  },
  {
    title: 'Evening: the Tide',
    body: (
      <>
        <p>When everyone has had a turn, the Altar is <b>revealed</b>. Add up its Light and its Dark. The heavier side is the <b>Tide</b>. A tie is a Neutral Tide.</p>
      </>
    ),
    side: <AltarBuilder />,
  },
  {
    title: 'The Reaping',
    body: (
      <>
        <p>Now every Choir is scored against the Tide:</p>
        <ul class="learn-list">
          <li><b>Leaning with the Tide:</b> gain Glory equal to your lean.</li>
          <li><b>Leaning against it:</b> lose that much.</li>
          <li><b>Neutral Choir or Neutral Tide:</b> nothing happens.</li>
        </ul>
        <p class="muted">You never gain or lose more than 3 at one Reaping. Then the Altar is cleared, hands are refilled, and a new Day begins.</p>
      </>
    ),
    side: <ReapingCalc />,
  },
  {
    title: 'How it ends',
    body: (
      <>
        <p>After any Reaping where someone has <b>10 or more</b>, the game ends.</p>
        <p>Then everyone gains <b>1 bonus Glory</b> for each card in their hand and Choir that matches the final Tide. <b>Most Glory wins.</b></p>
      </>
    ),
    side: (
      <Callout>
        <div class="eyebrow">Example</div>
        <p>The final Tide is Dark. Ada has 10 Glory and 1 Dark card. Ben has 9 and 3 Dark cards.</p>
        <p>Ada finishes with 11, Ben with <b>12</b>. <b>Ben wins.</b></p>
      </Callout>
    ),
  },
  {
    title: 'Playing well',
    body: (
      <ul class="learn-list">
        <li><b>Rivals will push against you.</b> They can see your lean, so expect Offers against it and Gathers that take your cards off the Altar.</li>
        <li><b>Read the table.</b> First Fruits are the one honest card each player has to show you. A card someone throws out of their Choir tells you which way they've decided to lean.</li>
        <li><b>Make deals.</b> You can give Glory to anyone at any time. Promises aren't binding, so trust carefully.</li>
        <li><b>Late in the game,</b> every Day might be the last. Hold cards that match the Tide you expect.</li>
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
