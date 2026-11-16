// The side panel: the game log (only what you are allowed to see) and table chat.
import type { LogEntry } from '@divide/engine';
import type { ChatLine } from '@divide/protocol';
import { useEffect, useRef, useState } from 'preact/hooks';

export function LogList(p: { log: LogEntry[] }) {
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [p.log.length]);
  return (
    <div class="log" ref={box} onScroll={() => { const el = box.current!; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}>
      {p.log.map((e) => (
        <div key={e.seq} class={`log-line k-${e.kind}${e.visibility === 'public' ? '' : ' private'}`}>
          {e.visibility !== 'public' && <span class="log-private" title="Only you can see this line">only you</span>}
          {e.text}
        </div>
      ))}
      {!p.log.length && <div class="muted">Nothing has happened yet.</div>}
    </div>
  );
}

export function Chat(p: { chat: ChatLine[]; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [p.chat.length]);
  return (
    <div class="chat">
      <div class="chat-lines" ref={box}>
        {p.chat.map((c) => <div class="chat-line"><b>{c.from}</b> {c.text}</div>)}
        {!p.chat.length && <div class="muted">Table talk: deals, threats and promises go here.</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { p.onSend(text.trim()); setText(''); } }}>
        <input class="field" value={text} maxLength={300} placeholder="Say something" onInput={(e) => setText((e.target as HTMLInputElement).value)} />
      </form>
    </div>
  );
}
