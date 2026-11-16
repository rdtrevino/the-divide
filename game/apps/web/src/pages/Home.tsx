// The front door: start a table or join one by its code.
import { useState } from 'preact/hooks';
import { Card } from '../components/Card';
import { Site } from '../components/Site';
import { clientId, getName, setName } from '../lib/identity';
import { Link, go } from '../lib/router';

export function Home() {
  const [name, set] = useState(getName());
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = () => { if (name.trim()) setName(name); };
  const create = async () => {
    save();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId: clientId() }) });
      const body = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !body.code) throw new Error(body.error ?? 'Could not create a table.');
      go(`/r/${body.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create a table.');
      setBusy(false);
    }
  };
  const clean = code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
  return (
    <Site>
      <div class="home">
        <div class="home-hero">
          <div class="eyebrow">A card game of divine ambition</div>
          <h1 class="wordmark home-mark">The Divide</h1>
          <p class="home-lede">Feed the Altar in secret. Read the Tide. Be the first to gather 10 Glory, then hold on until the dawn.</p>
          <div class="home-fan" aria-hidden="true">
            <Card id="host-uriel" w={150} compact zoom={false} />
            <Card id="celestial-the-eclipse" w={164} compact zoom={false} />
            <Card id="host-leviathan" w={150} compact zoom={false} />
          </div>
        </div>
        <div class="home-play panel pad">
          <label class="eyebrow" for="home-name">Your name</label>
          <input id="home-name" class="field" value={name} maxLength={20} placeholder="What should the table call you?" onInput={(e) => set((e.target as HTMLInputElement).value)} onBlur={save} />
          <button class="btn primary big" disabled={busy || !name.trim()} onClick={create}>{busy ? 'Setting the table…' : 'Start a new table'}</button>
          <p class="muted small">You get a link to send to friends. Empty seats can be filled by computer players. 3 or 4 players.</p>
          <div class="rule"><span class="eyebrow">or join one</span></div>
          <form class="join" onSubmit={(e) => { e.preventDefault(); save(); if (clean.length === 5) go(`/r/${clean}`); }}>
            <input class="field code" value={clean} placeholder="CODE" aria-label="Table code" onInput={(e) => setCode((e.target as HTMLInputElement).value)} />
            <button class="btn" disabled={clean.length !== 5 || !name.trim()}>Join</button>
          </form>
          {error && <p class="error">{error}</p>}
        </div>
        <div class="home-links">
          <Link href="/rules" class="home-link panel"><b>Rules</b><span>How a Day works, the Tide, the Reaping, and every Celestial.</span></Link>
          <Link href="/cards" class="home-link panel"><b>Cards</b><span>Every card with its current text.</span></Link>
          <Link href="/stats" class="home-link panel"><b>Stats</b><span>Which cards and Celestials are winning in real games.</span></Link>
        </div>
      </div>
    </Site>
  );
}
