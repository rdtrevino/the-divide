// A game room: ask for a name, connect, then show the lobby or the table.
import { TIMER_CHOICES, type ClientMsg } from '@divide/protocol';
import { useState } from 'preact/hooks';
import { Site } from '../components/Site';
import { NameForm, PlayerCode } from '../components/NameField';
import { getName } from '../lib/identity';
import { useRoom, type RoomSnap } from '../lib/room';
import { Link, go } from '../lib/router';
import { seatColor } from '../table/bits';
import { Chat } from '../table/Side';
import { Table } from '../table/Table';

export function Room(p: { code: string }) {
  const [name, set] = useState(getName());
  if (!name) {
    return (
      <Site>
        <div class="narrow panel pad">
          <div class="eyebrow">Table {p.code}</div>
          <h1 class="h-display">Join the table</h1>
          <NameForm action="Take a seat" onDone={set} />
          <p class="muted small learn-line">New to The Divide? <a href="/learn" target="_blank" rel="noopener">Learn to play in 5 minutes</a>.</p>
        </div>
      </Site>
    );
  }
  return <Connected key={`${p.code}:${name}`} code={p.code} name={name} onRename={set} />;
}

function Connected(p: { code: string; name: string; onRename: (n: string) => void }) {
  const [snap, send] = useRoom(p.code, p.name);
  if (snap.conn === 'unverified') {
    return (
      <Site>
        <div class="narrow panel pad">
          <div class="eyebrow">Table {p.code}</div>
          <h1 class="h-display">Who's playing?</h1>
          <p>This browser doesn't hold the player code for <b>{p.name}</b>. Enter it, or choose another name.</p>
          <NameForm action="Take a seat" initial={p.name} onDone={p.onRename} />
        </div>
      </Site>
    );
  }
  if (snap.conn === 'missing') {
    return (
      <Site>
        <div class="narrow panel pad">
          <h1 class="h-display">No table here</h1>
          <p>There is no table with the code <b>{p.code}</b>. It may have been mistyped, or the table was closed after two weeks without visitors.</p>
          <Link class="btn primary" href="/">Start a new table</Link>
        </div>
      </Site>
    );
  }
  if (!snap.state) return <Site><div class="narrow pad muted center">Finding the table…</div></Site>;
  if (snap.state.room.status === 'lobby' || !snap.state.view) return <Lobby snap={snap} send={send} onRename={p.onRename} />;
  return <Table snap={snap} send={send} />;
}

const TIMER_LABEL: Record<number, string> = { 60: '1 minute', 90: '90 seconds', 120: '2 minutes', 300: '5 minutes' };

function Lobby(p: { snap: RoomSnap; send: (m: ClientMsg) => void; onRename: (n: string) => void }) {
  const { room, you } = p.snap.state!;
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const link = `${location.origin}/r/${room.code}`;
  const open = room.seats.filter((s) => s.kind === 'open').length;
  const people = room.seats.filter((s) => s.kind === 'human').length;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* the link is shown, it can be copied by hand */ }
  };
  return (
    <Site>
      <div class="lobby">
        <div class="lobby-main panel pad">
          <div class="eyebrow">Table {room.code}{room.gameNumber > 0 ? ` · game ${room.gameNumber + 1}` : ''}</div>
          <h1 class="h-display">Gather the table</h1>
          {room.notice && <div class="banner warn">{room.notice}</div>}
          {p.snap.conn !== 'open' && <div class="banner warn">Connection lost. Reconnecting…</div>}
          <div class="share">
            <input class="field" readOnly value={link} onFocus={(e) => (e.target as HTMLInputElement).select()} aria-label="Link to this table" />
            <button class="btn" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
          </div>
          <p class="muted">Send this link to your friends. Anyone who opens it can take an empty seat.</p>

          <div class="seats">
            {room.seats.map((s, i) => (
              <div class={`seat ${s.kind}${you.seat === i ? ' you' : ''}`} style={{ '--seat': seatColor(i) } as any}>
                <span class="seat-n num">{i + 1}</span>
                <div class="seat-who">
                  {s.kind === 'open' ? <span class="muted">Empty seat</span> : <b>{s.name}</b>}
                  <small>
                    {s.kind === 'bot' && 'Computer player'}
                    {s.kind === 'human' && (you.seat === i ? 'You' : s.connected ? 'Here' : 'Not connected')}
                    {s.kind === 'human' && room.host === i && ' · host'}
                    {s.kind === 'open' && 'Waiting for a player'}
                  </small>
                </div>
                <div class="seat-actions">
                  {s.kind === 'open' && you.seat === null && <button class="btn small" onClick={() => p.send({ t: 'sit', seat: i })}>Sit here</button>}
                  {s.kind === 'open' && you.isHost && <button class="btn small" onClick={() => p.send({ t: 'seat', seat: i, kind: 'bot' })}>Add a bot</button>}
                  {s.kind === 'bot' && you.isHost && <button class="btn quiet small" onClick={() => p.send({ t: 'seat', seat: i, kind: 'open' })}>Remove</button>}
                  {s.kind === 'human' && you.seat === i && <button class="btn quiet small" onClick={() => setRenaming(true)}>Rename</button>}
                  {s.kind === 'human' && you.seat === i && <button class="btn quiet small" onClick={() => p.send({ t: 'stand' })}>Just watch</button>}
                  {s.kind === 'human' && you.seat !== i && you.isHost && !s.connected && <button class="btn quiet small" onClick={() => p.send({ t: 'seat', seat: i, kind: 'open' })}>Free seat</button>}
                </div>
              </div>
            ))}
          </div>
          {renaming && <div class="rename"><NameForm id="rename" action="Save name" initial={you.name} onDone={(n) => { setRenaming(false); p.onRename(n); }} /></div>}
          {you.seat !== null && <PlayerCode name={you.name} />}

          {you.isHost ? (
            <div class="lobby-start">
              <button class="btn primary big" disabled={open > 0} onClick={() => p.send({ t: 'start' })}>Start the game</button>
              <span class="muted">
                {open > 0
                  ? `${open} seat${open > 1 ? 's are' : ' is'} empty. Wait for friends, add a bot, or switch to 3 players.`
                  : `${people} ${people === 1 ? 'person' : 'people'} and ${room.seats.length - people} bot${room.seats.length - people === 1 ? '' : 's'}. Celestials and the first player are dealt at random.`}
              </span>
            </div>
          ) : (
            <p class="muted lobby-wait">Waiting for {room.host !== null ? room.seats[room.host].name : 'the host'} to start the game.</p>
          )}
        </div>

        <div class="lobby-side">
          <div class="panel pad">
            <div class="eyebrow">Table settings</div>
            <div class="setting">
              <span>Players</span>
              <div class="chips">
                {[3, 4].map((k) => <button class={`chip${room.seats.length === k ? ' on' : ''}`} disabled={!you.isHost} onClick={() => p.send({ t: 'size', seats: k as 3 | 4 })}>{k}</button>)}
              </div>
            </div>
            <div class="setting">
              <span>Time for each decision</span>
              <select class="field" disabled={!you.isHost} value={room.options.timer} onChange={(e) => p.send({ t: 'options', timer: Number((e.target as HTMLSelectElement).value) })}>
                {TIMER_CHOICES.map((t) => <option value={t}>{TIMER_LABEL[t]}</option>)}
              </select>
            </div>
            <p class="muted small">When a player's time runs out, a bot makes that one choice so the game keeps moving.</p>
            <label class="check setting">
              <input type="checkbox" disabled={!you.isHost} checked={room.options.twoSeeds} onChange={(e) => p.send({ t: 'options', twoSeeds: (e.target as HTMLInputElement).checked })} />
              Two Seeds each Day
            </label>
            <p class="muted small">Optional rule for 3 players, if the Altar feels thin.</p>
            {!you.isHost && <p class="muted small">Only the host can change these.</p>}
          </div>
          <div class="panel pad lobby-chat">
            <div class="eyebrow">Table talk</div>
            <Chat chat={p.snap.chat} onSend={(text) => p.send({ t: 'chat', text })} />
          </div>
          <p class="muted small center">New to the game? <a href="/learn" target="_blank" rel="noopener">Learn to play in 5 minutes</a>, or <a href="/rules" target="_blank" rel="noopener">read the rules</a>.</p>
        </div>
        {p.snap.error && <div class="toast" key={p.snap.error.n}>{p.snap.error.message}</div>}
      </div>
    </Site>
  );
}

export const leave = () => go('/');
