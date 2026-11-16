// Every card with its current text, as the game uses it.
import { useState } from 'preact/hooks';
import { Card } from '../components/Card';
import { Site } from '../components/Site';
import { CELESTIALS, EVENTS, HOSTS } from '../lib/cards';
import raw from '@divide/engine/src/cards.data.json';

type Filter = 'all' | 'light' | 'neutral' | 'dark' | 'celestial' | 'event';
const FILTERS: [Filter, string][] = [['all', 'All'], ['light', 'Light'], ['neutral', 'Neutral'], ['dark', 'Dark'], ['celestial', 'Celestials'], ['event', 'Events']];

export function Cards() {
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState(true);
  const hosts = HOSTS.filter((h) => (!open || h.openGame) && (filter === 'all' || (filter === 'light' && h.alignment === 'light') || (filter === 'dark' && h.alignment === 'dark') || (filter === 'neutral' && !['light', 'dark'].includes(h.alignment))));
  const showHosts = !['celestial', 'event'].includes(filter);
  const events = EVENTS.filter((e) => !open || e.openGame);
  return (
    <Site wide>
      <div class="page-head">
        <div>
          <div class="eyebrow">Card data {(raw as any).version}</div>
          <h1>The Cards</h1>
        </div>
        <div class="chips">
          {FILTERS.map(([f, label]) => <button class={`chip${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>{label}</button>)}
          <label class="check"><input type="checkbox" checked={open} onChange={(e) => setOpen((e.target as HTMLInputElement).checked)} /> Open Game deck only</label>
        </div>
      </div>
      {(filter === 'all' || filter === 'celestial') && (
        <section>
          <h2 class="rule"><span>The Nine Celestials</span></h2>
          <div class="gallery">{CELESTIALS.map((c) => <Card id={c.id} w={236} zoom={false} />)}</div>
        </section>
      )}
      {showHosts && (
        <section>
          <h2 class="rule"><span>Host cards ({hosts.length})</span></h2>
          <div class="gallery">{hosts.map((h) => <Card id={h.id} w={236} zoom={false} />)}</div>
        </section>
      )}
      {(filter === 'all' || filter === 'event') && (
        <section>
          <h2 class="rule"><span>Events ({events.length})</span></h2>
          <div class="gallery events">{events.map((e) => <Card id={e.id} w={380} zoom={false} />)}</div>
        </section>
      )}
    </Site>
  );
}
