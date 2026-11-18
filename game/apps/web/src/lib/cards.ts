// Card lookups for the site. All names and rules text come from the engine's card data,
// so a card text change never needs a change here.
import { CELESTIAL, CELESTIALS, EVENT, EVENTS, HOST, HOSTS, type HostDef, type SimpleDef } from '@divide/engine';

export type CardKind = 'host' | 'celestial' | 'event';

export const kindOf = (id: string): CardKind | null => (HOST[id] ? 'host' : CELESTIAL[id] ? 'celestial' : EVENT[id] ? 'event' : null);
export const nameOf = (id: string): string => HOST[id]?.name ?? CELESTIAL[id]?.name ?? EVENT[id]?.name ?? id;
export const textOf = (id: string): string => HOST[id]?.text ?? CELESTIAL[id]?.text ?? EVENT[id]?.text ?? '';

/** Cards with no illustration yet get a drawn placeholder. */
export const artOf = (c: HostDef | SimpleDef, kind: CardKind): string | null => (c.plate ? `/art/${kind}/${c.id}.webp` : null);

export const alignLabel: Record<string, string> = { light: 'Light', dark: 'Dark', neutral: 'Neutral', variable: 'Light or Dark', both: 'Light and Dark' };
/** The frame a Host card is printed on. */
export const hostFrame = (h: HostDef): 'light' | 'dark' | 'neutral' => (h.alignment === 'light' ? 'light' : h.alignment === 'dark' ? 'dark' : 'neutral');
export const hostValue = (h: HostDef): string => (h.alignment === 'neutral' || !h.value ? '' : `+${h.value}`);

/** Field, frame, title and text colours of each Celestial, sampled from the printed cards. */
export const celestialColors: Record<string, { field: string; frame: string; title: string; ink: string }> = {
  'celestial-the-tempest': { field: '#34587a', frame: '#e6c850', title: '#e6c55e', ink: '#f2f7fb' },
  'celestial-the-oracle': { field: '#8a46c0', frame: '#e2ad4f', title: '#f0bd66', ink: '#fbf0ff' },
  'celestial-the-eclipse': { field: '#c22a20', frame: '#efb174', title: '#ffc9a0', ink: '#ffeedd' },
  'celestial-the-cantor': { field: '#c2385a', frame: '#edc893', title: '#ffd9a8', ink: '#ffeee8' },
  'celestial-the-patron': { field: '#1b4529', frame: '#e0b74b', title: '#e7bc4c', ink: '#f3f8e4' },
  'celestial-the-echo': { field: '#3f7469', frame: '#cba64d', title: '#e3c869', ink: '#eefbf2' },
  'celestial-the-dominion': { field: '#33804e', frame: '#dfb03c', title: '#f0c653', ink: '#f8fbe6' },
  'celestial-the-whisper': { field: '#33296a', frame: '#b0b3de', title: '#c2bbee', ink: '#f6f6ff' },
  'celestial-the-arbiter': { field: '#c47f1a', frame: '#3a2a10', title: '#2a1903', ink: '#221203' },
};

export const OPEN_HOSTS = HOSTS.filter((h) => h.openGame);
export { CELESTIAL, CELESTIALS, EVENT, EVENTS, HOST, HOSTS };
