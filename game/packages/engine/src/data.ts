// Card data: a copy of the repository's cards/cards.json, written by cards/tools/apply_changes.py.
import raw from './cards.data.json';

export type HostAlignment = 'light' | 'dark' | 'neutral' | 'variable' | 'both';

export interface HostDef {
  id: string;
  number: number;
  name: string;
  text: string;
  alignment: HostAlignment;
  value: number | null;
  cadence: string;
  oncePerGame: boolean;
  openGame: boolean;
  face: string;
  plate: string;
}

export interface SimpleDef {
  id: string;
  name: string;
  text: string;
  openGame: boolean;
  face: string;
  plate: string;
  numeral?: string;
}

const data = raw as unknown as { hosts: HostDef[]; celestials: SimpleDef[]; events: SimpleDef[] };
export const HOSTS = data.hosts;
export const CELESTIALS = data.celestials;
export const EVENTS = data.events;

export const HOST: Record<string, HostDef> = Object.fromEntries(HOSTS.map((h) => [h.id, h]));
export const CELESTIAL: Record<string, SimpleDef> = Object.fromEntries(CELESTIALS.map((c) => [c.id, c]));
export const EVENT: Record<string, SimpleDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function cardName(id: string): string {
  return HOST[id]?.name ?? CELESTIAL[id]?.name ?? EVENT[id]?.name ?? id;
}

// Short ids used throughout the engine.
export const H = {
  michael: 'host-michael', wisdom: 'host-wisdom', gabriel: 'host-gabriel', providence: 'host-providence',
  confession: 'host-confession', treeOfLife: 'host-tree-of-life', freeWill: 'host-free-will',
  seraphim: 'host-seraphim', hymn: 'host-hymn', raphael: 'host-raphael', sanctuary: 'host-sanctuary',
  uriel: 'host-uriel', martyr: 'host-martyr', covenant: 'host-covenant', tribute: 'host-tribute',
  mercy: 'host-mercy', revelation: 'host-revelation', cherubim: 'host-cherubim', morningStar: 'host-morning-star',
  absolution: 'host-absolution', knowledge: 'host-knowledge', deliverance: 'host-deliverance',
  vessel: 'host-vessel', eternity: 'host-eternity', ordeal: 'host-ordeal', raguel: 'host-raguel',
  twilight: 'host-twilight', zealot: 'host-zealot', stillness: 'host-stillness', shroud: 'host-shroud',
  nephilim: 'host-nephilim', firmament: 'host-firmament', moderation: 'host-moderation',
  figLeaves: 'host-fig-leaves', flamingSword: 'host-flaming-sword', outcast: 'host-outcast',
  heresy: 'host-heresy', council: 'host-council', mirage: 'host-mirage', veil: 'host-veil',
  prophecy: 'host-prophecy', watchers: 'host-watchers', apple: 'host-apple', forger: 'host-forger',
  anathema: 'host-anathema', serpent: 'host-serpent', favor: 'host-favor', temptation: 'host-temptation',
  legion: 'host-legion', lamentation: 'host-lamentation', azazel: 'host-azazel', moloch: 'host-moloch',
  beelzebub: 'host-beelzebub', leviathan: 'host-leviathan', hubris: 'host-hubris', belial: 'host-belial',
  mammon: 'host-mammon', envy: 'host-envy', lilith: 'host-lilith', parasite: 'host-parasite',
  winnowing: 'host-winnowing', silence: 'host-silence', scapegoat: 'host-scapegoat',
  defiance: 'host-defiance', bounty: 'host-bounty', abaddon: 'host-abaddon', remnant: 'host-remnant',
  jubilee: 'host-jubilee', snare: 'host-snare',
  ithuriel: 'host-ithuriel', urim: 'host-urim', asmadai: 'host-asmadai',
} as const;

export const C = {
  tempest: 'celestial-the-tempest', oracle: 'celestial-the-oracle', eclipse: 'celestial-the-eclipse',
  cantor: 'celestial-the-cantor', patron: 'celestial-the-patron', echo: 'celestial-the-echo',
  dominion: 'celestial-the-dominion', whisper: 'celestial-the-whisper', arbiter: 'celestial-the-arbiter',
} as const;

export const E = {
  creation: 'event-creation', manna: 'event-manna', ascension: 'event-ascension',
  letThereBeLight: 'event-let-there-be-light', sabbath: 'event-the-sabbath', divineCalling: 'event-divine-calling',
  dispersion: 'event-dispersion', equilibrium: 'event-equilibrium', purgatory: 'event-purgatory',
  castingLots: 'event-casting-lots', pandemonium: 'event-pandemonium', falseProphecy: 'event-false-prophecy',
  famine: 'event-famine', babel: 'event-babel', fallFromGrace: 'event-fall-from-grace',
  armageddon: 'event-armageddon', plague: 'event-the-plague', tithe: 'event-tithe', flood: 'event-the-flood',
  fast: 'event-the-fast',
} as const;
