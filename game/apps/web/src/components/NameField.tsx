// Choosing your name. A taken name asks for its player code; your own code is shown so you can use
// your name on another device.
import { useState } from 'preact/hooks';
import { codeFor, formatCode, lastTypedName, useName } from '../lib/identity';

export function NameForm(p: { action: string; onDone: (name: string) => void; initial?: string; busy?: boolean; id?: string; children?: any; before?: any }) {
  const [name, setName] = useState(p.initial ?? lastTypedName());
  const [code, setCode] = useState('');
  const [needCode, setNeedCode] = useState(false);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const submit = async () => {
    const n = name.trim();
    if (!n || working) return;
    setWorking(true);
    setError('');
    const r = await useName(n, needCode && code.trim() ? code : undefined);
    setWorking(false);
    if (r.ok) { setNeedCode(false); setCode(''); p.onDone(r.name); return; }
    if (r.reason === 'taken' || r.reason === 'wrong-code') setNeedCode(true);
    setError(r.message);
  };
  return (
    <form class="name-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <label class="eyebrow" for={p.id ?? 'name'}>Your name</label>
      <input id={p.id ?? 'name'} class="field" value={name} maxLength={20} autoComplete="nickname" placeholder="What should the table call you?" onInput={(e) => { setName((e.target as HTMLInputElement).value); setNeedCode(false); setError(''); }} />
      {needCode && (
        <>
          <label class="eyebrow" for={`${p.id ?? 'name'}-code`}>Player code for this name</label>
          <input id={`${p.id ?? 'name'}-code`} class="field code-field" value={code} maxLength={16} autoComplete="off" spellcheck={false} placeholder="XXXX-XXXX-XXXX" onInput={(e) => setCode((e.target as HTMLInputElement).value)} />
        </>
      )}
      {p.before}
      {error && <p class="error">{error}{needCode && ' Or choose a different name.'}</p>}
      <button class="btn primary big" disabled={!name.trim() || working || p.busy || (needCode && !code.trim())}>{working ? 'Checking…' : p.action}</button>
      {p.children}
    </form>
  );
}

/** Your player code, to use your name on another device. */
export function PlayerCode(p: { name: string }) {
  const code = codeFor(p.name);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  return (
    <div class="player-code">
      {!shown ? (
        <button type="button" class="linkish" onClick={() => setShown(true)}>Playing on another device? Show my player code</button>
      ) : (
        <>
          <span>Your player code for <b>{p.name}</b>:</span>
          <code>{formatCode(code)}</code>
          <button type="button" class="btn quiet small" onClick={async () => { try { await navigator.clipboard.writeText(formatCode(code)); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* shown on screen */ } }}>{copied ? 'Copied' : 'Copy'}</button>
          <small>Enter it with your name on another phone or computer. Keep it to yourself: it's what makes the name yours.</small>
        </>
      )}
    </div>
  );
}
