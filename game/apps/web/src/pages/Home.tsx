// The front door: start a table or join one by its code.
import { useState } from 'preact/hooks';
import { Card } from '../components/Card';
import { Site } from '../components/Site';
import { NameForm, PlayerCode } from '../components/NameField';
import { clientId, getName } from '../lib/identity';
import { Link, go } from '../lib/router';

export function Home() {
  const [name, setName] = useState(getName());
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const clean = code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
  const create = async (who: string) => {
    setName(who);
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
  return (
    <Site>
      <div class="home">
        <div class="home-hero">
          <h1 class="wordmark home-mark">The Divide</h1>
          <p class="home-lede">A game of divine ambition and hidden loyalties</p>
          <p class="home-sub">A card game for 3 to 6 players</p>
          <div class="home-fan" aria-hidden="true">
            <Card id="host-uriel" w={190} zoom={false} />
            <Card id="celestial-the-eclipse" w={206} zoom={false} />
            <Card id="host-leviathan" w={190} zoom={false} />
          </div>
        </div>
        <div class="home-play panel pad">
          <NameForm
            id="home-name"
            action={busy ? 'Setting the table…' : joining ? 'Join the table' : 'Start a new table'}
            busy={busy || (joining && clean.length !== 5)}
            initial={name || undefined}
            onDone={(who) => (joining ? (setName(who), go(`/r/${clean}`)) : void create(who))}
            before={joining && (
              <>
                <label class="eyebrow" for="table-code">Table code</label>
                <input id="table-code" class="field code" value={clean} placeholder="CODE" autoComplete="off" onInput={(e) => setCode((e.target as HTMLInputElement).value)} />
              </>
            )}
          >
            <p class="muted small">{joining ? 'The 5 letters at the end of the link your friend sent.' : 'You get a link to send to friends. Online tables are for 3 or 4 players, and computer players can fill any empty seat.'}</p>
          </NameForm>
          {joining ? (
            <button class="btn quiet" onClick={() => setJoining(false)}>Start a new table instead</button>
          ) : (
            <>
              <div class="rule"><span class="eyebrow">or</span></div>
              <button class="btn" onClick={() => setJoining(true)}>Join a friend's table</button>
            </>
          )}
          {error && <p class="error">{error}</p>}
          {name && <PlayerCode name={name} />}
          <Link href="/learn" class="learn-cta">New to The Divide? <b>Learn to play in 5 minutes →</b></Link>
        </div>
        <div class="home-links">
          <Link href="/cards" class="home-link panel"><b>Cards</b><span>Every card with its current text.</span></Link>
          <Link href="/rules" class="home-link panel"><b>Rules</b><span>The full rules, with a quick reference.</span></Link>
          <Link href="/stats" class="home-link panel"><b>Stats</b><span>Which cards and Celestials are winning in real games.</span></Link>
        </div>
      </div>
    </Site>
  );
}
