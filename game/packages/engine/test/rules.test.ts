import { describe, expect, it } from 'vitest';
import { baseValue, choirColors } from '../src/core';
import { C, E, H } from '../src/data';
import { activationPhase, endGame, evening, judgmentDay, legalActions, reaping, setTide, takeTurn, morning } from '../src/engine';
import { Game, RuleError } from '../src/game';
import { viewFor } from '../src/view';
import { botAnswer } from '../src/bots';
import { altar, blank, choir, drive, hand, type Script } from './helpers';

const glory = (s: any) => s.players.map((p: any) => p.glory);
const reap = (s: any, script: Script = {}) => drive(s, reaping(s, setTide(s), s.players.map((p: any) => p.seat)), script);

describe('Set the Tide', () => {
  it('compares Light and Dark on the Altar, with margin', () => {
    const s = blank();
    altar(s, H.freeWill, H.wisdom, H.gabriel, H.moloch, H.envy, H.twilight); // V45: every card is Light or Dark, +1
    expect(setTide(s)).toMatchObject({ dir: 'light', light: 4, dark: 2, margin: 2 });
  });
  it('Ascension and Fall From Grace double their side', () => {
    const s = blank();
    altar(s, H.wisdom, H.moloch);
    s.currentEvent = E.ascension;
    expect(setTide(s).dir).toBe('light');
    s.currentEvent = E.fallFromGrace;
    expect(setTide(s).dir).toBe('dark');
  });
  it('V45: Nephilim is Dark; Acolyte is Light until a Day is won, then the color of the most recent Day won', () => {
    const s = blank();
    altar(s, H.nephilim, H.shroud);
    expect(setTide(s)).toMatchObject({ dir: 'neutral', light: 1, dark: 1 });
    s.day = 3;
    s.tides.push({ day: 1, dir: 'dark', light: 0, dark: 1, margin: 1 }, { day: 2, dir: 'neutral', light: 1, dark: 1, margin: 0 });
    expect(setTide(s)).toMatchObject({ dir: 'dark', light: 0, dark: 2 });
  });
});

describe('The Reaping', () => {
  it('V45 scoring: each Choir card of the winning color scores 2, however many players share the Day; nothing is lost', () => {
    const run = (choirs: string[][], start = 2) => {
      const s = blank(choirs.length);
      choirs.forEach((c, i) => choir(s, i, ...c));
      s.players.forEach((p) => (p.glory = start));
      altar(s, H.confession); // Light wins the Day
      reap(s);
      return glory(s).map((g: number) => g - start);
    };
    expect(run([[H.freeWill, H.gabriel, H.wisdom], [H.moloch], []])).toEqual([6, 0, 0]);
    expect(run([[H.freeWill, H.moloch], [H.wisdom], [H.moloch, H.twilight], [H.gabriel, H.confession]])).toEqual([2, 2, 2, 4]); // Twilight is Light since V45
    const s = blank();
    choir(s, 0, H.wisdom);
    reap(s); // an empty Altar: a Neutral Tide, so nobody scores
    expect(glory(s)).toEqual([0, 0, 0]);
  });
  it('Nephilim (V45) is Dark: it pushes and scores as Dark, and counts as Light too for card abilities', () => {
    const s = blank();
    choir(s, 0, H.nephilim, H.uriel);
    expect(choirColors(s, 0)).toEqual({ light: 2, dark: 1 });
    altar(s, H.nephilim);
    expect(setTide(s).dir).toBe('dark');
    reap(s);
    expect(s.players[0].glory).toBe(2);
  });
  it('the Whisper (V45): +1 if the side it named wins the Day, -1 if the other side wins', () => {
    const s = blank(3, [C.whisper]);
    choir(s, 0, H.moloch);
    s.players[0].glory = 3;
    altar(s, H.wisdom);
    s.day_.whisperCall = 'light';
    reap(s);
    expect(s.players[0].glory).toBe(4);
    s.day_.whisperCall = 'dark';
    reap(s);
    expect(s.players[0].glory).toBe(3);
  });
  it('the Eclipse (V45): in the Morning, one Light or Dark card counts as the other color this Day', () => {
    const s = blank(3, [C.eclipse]);
    s.eventDeck = [];
    choir(s, 0, H.freeWill, H.moloch, H.twilight);
    const { asked } = drive(s, morning(s), { 'eclipse.early': (d) => [d.options.find((o) => o.card === H.freeWill)!.id] });
    expect(asked.find((d) => d.tag === 'eclipse.early')!.options).toHaveLength(4); // 3 cards, or decline
    altar(s, H.envy); // Dark wins
    reap(s);
    expect(s.players[0].glory).toBe(4); // Moloch, and Free Will as Dark
  });
  it('Ordeal (V45, spent): invoked on your turn, then discarded; your Choir still scores double that Day', () => {
    const t = blank();
    choir(t, 0, H.ordeal, H.wisdom);
    hand(t, 0, H.envy);
    drive(t, takeTurn(t, 0), { action: ['offer'], activate: (d) => [d.options.find((o) => o.card === H.ordeal)?.id ?? 'end'] });
    expect(t.players[0].choir.map((c) => c.id)).toEqual([H.wisdom]);
    altar(t, H.confession, H.freeWill); // Light wins
    reap(t);
    expect(t.players[0].glory).toBe(4);
  });
  it('Ordeal doubles what the Choir scores', () => {
    const s = blank();
    choir(s, 0, H.ordeal, H.wisdom, H.gabriel); // 2 Light cards
    altar(s, H.confession);
    s.day_.ordeal.push(0);
    reap(s);
    expect(s.players[0].glory).toBe(8);
  });
  it('Famine skips Alignment scoring', () => {
    const s = blank();
    choir(s, 0, H.wisdom);
    choir(s, 1, H.twilight);
    s.players.forEach((p) => (p.glory = 2));
    altar(s, H.confession);
    s.currentEvent = E.famine;
    reap(s);
    expect(glory(s)).toEqual([2, 2, 2]);
  });
  it('False Prophecy: Choirs score as if the other side had won', () => {
    const s = blank();
    choir(s, 0, H.wisdom, H.moloch);
    s.players[0].glory = 4;
    altar(s, H.confession);
    s.currentEvent = E.falseProphecy;
    reap(s);
    expect(s.players[0].glory).toBe(6); // Moloch scores, Wisdom does not
  });
});

describe('Actions', () => {
  it('V45: an Offer earns no Glory; the Cantor draws a card when it Offers; Hymn is Light +2 and goes face up', () => {
    const s = blank(3, [C.cantor, C.tempest, C.oracle]);
    hand(s, 0, H.wisdom, H.gabriel);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.wisdom)!.id] });
    expect(s.players[0].glory).toBe(0);
    expect(s.players[0].offeredToday).toBe(true);
    expect(s.altar.map((a) => a.facedown)).toEqual([true]);
    expect(s.players[0].hand).toHaveLength(2);
    const t = blank(3, [C.tempest, C.oracle, C.cantor]);
    hand(t, 0, H.hymn);
    drive(t, takeTurn(t, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.hymn)!.id] });
    expect(t.players[0].glory).toBe(0);
    expect(t.altar[0]).toMatchObject({ id: H.hymn, facedown: false });
    expect(baseValue(t, H.hymn)).toEqual({ light: 2, dark: 0 });
    expect(baseValue(t, H.lamentation)).toEqual({ light: 0, dark: 2 });
  });
  it('Raphael (V43) destroys a face-up Dark card; the Offer goes face up', () => {
    const s = blank();
    choir(s, 0, H.raphael);
    hand(s, 0, H.wisdom);
    altar(s, H.moloch);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.wisdom)!.id], raphael: (d) => [d.options.find((o) => o.card === H.moloch)!.id] });
    expect(s.players[0].glory).toBe(0);
    expect(s.altar.map((a) => a.id)).toEqual([H.wisdom]);
    expect(s.altar[0].facedown).toBe(false);
  });
  it('Gathering a card a Snare holder Offered today pays them 1', () => {
    const s = blank();
    choir(s, 1, H.snare);
    s.hostDeck = s.hostDeck.filter((x) => x !== H.wisdom);
    s.altar.push({ id: H.wisdom, facedown: true, offeredBy: 1, day: 1, kind: 'offer' });
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['altar:0'] });
    expect(s.players[1].glory).toBe(1);
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.wisdom);
  });
  it('Parasite cannot be discarded to make room', () => {
    const s = blank();
    choir(s, 0, H.parasite, H.wisdom, H.gabriel, H.confession); // a full Choir of 4
    altar(s, H.moloch);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['altar:0'] });
    const room = asked.find((d) => d.tag === 'choir.discard')!;
    expect(room.options.map((o) => o.card)).not.toContain(H.parasite);
  });
  it('Exalt costs no Glory (V42); The Fast forbids it', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    s.players[0].glory = 2;
    drive(s, takeTurn(s, 0), { action: ['exalt'] });
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.wisdom);
    expect(s.players[0].glory).toBe(2);
    const t = blank();
    hand(t, 0, H.wisdom);
    t.players[0].glory = 3;
    t.currentEvent = E.fast;
    expect(legalActions(t, 0)).toEqual(['offer']); // and an empty Altar leaves nothing to Gather
  });
});

describe('Protection and reactions', () => {
  it('Cherubim stops Michael; Winnowing discards up to 2 facedown Altar cards unseen (V42)', () => {
    const s = blank();
    choir(s, 0, H.winnowing, H.michael);
    choir(s, 1, H.cherubim, H.wisdom);
    choir(s, 2, H.moloch);
    for (const [id, by] of [[H.gabriel, 1], [H.envy, 2], [H.hymn, 2]] as const) { s.hostDeck = s.hostDeck.filter((x) => x !== id); s.altar.push({ id, facedown: true, offeredBy: by, day: 1, kind: 'offer' }); }
    const { asked } = drive(s, activationPhase(s, 0), {
      activate: (d) => [d.options.find((o) => o.card === H.winnowing)?.id ?? d.options.find((o) => o.card === H.michael)?.id ?? 'end'],
      'winnowing.altar': (d) => [d.options.find((o) => o.id !== 'none')!.id],
      'michael.target': (d) => [d.options.find((o) => o.seat === 2)?.id ?? 'none'],
    });
    expect(s.altar.filter((a) => a.facedown)).toHaveLength(1); // two winnowed
    const mich = asked.find((d) => d.tag === 'michael.target');
    expect(mich!.options.filter((o) => o.seat === 1)).toHaveLength(0); // Cherubim
    expect(s.players[2].choir).toHaveLength(0); // Michael cast Moloch out
  });
  it('Tribute (V43): targeting that Choir costs 1 Glory, paid to Tribute\'s holder', () => {
    const s = blank();
    choir(s, 0, H.michael);
    s.players[0].glory = 2;
    choir(s, 1, H.tribute, H.wisdom);
    drive(s, activationPhase(s, 0), {
      activate: (d) => [d.options.find((o) => o.card === H.michael)?.id ?? 'end'],
      'michael.target': (d) => [d.options.find((o) => o.seat === 1)!.id],
    });
    expect(s.players[0].glory).toBe(1);
    expect(s.players[1].glory).toBe(1);
    expect(s.players[1].choir).toHaveLength(1); // Michael cast a card out
  });
  it('The Flood also switches off automatic Light abilities, but the cards still score', () => {
    const run = (event: string | null) => {
      const s = blank();
      choir(s, 0, H.seraphim);
      hand(s, 0, H.gabriel);
      s.currentEvent = event;
      drive(s, takeTurn(s, 0), { action: ['exalt'] });
      altar(s, H.confession);
      reap(s);
      return s.players[0].glory;
    };
    expect(run(null)).toBe(1 + 4); // Seraphim pays for a Light Exalt; both cards score
    expect(run(E.flood)).toBe(4);
  });
  it('Let There Be Light lets Parasite be discarded to make room', () => {
    const s = blank();
    choir(s, 0, H.parasite, H.moloch, H.azazel, H.envy); // a full Choir of 4
    s.currentEvent = E.letThereBeLight;
    altar(s, H.wisdom);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'] });
    const room = asked.find((d) => d.options.some((o) => o.card === H.moloch) && d.options.length >= 3);
    expect(room?.options.some((o) => o.card === H.parasite)).toBe(true);
  });
  it('Hubris (V45): if tied leaders each gained 8 or more this Day, the holder chooses one of them to pay 1', () => {
    const s = blank();
    choir(s, 0, H.hubris);
    s.players[1].glory = 9;
    s.players[2].glory = 9;
    for (const seat of [1, 2]) s.stats.push({ type: 'glory', seat, amount: 8, day: s.day, source: 'reaping' } as any);
    const { asked } = reap(s, { hubris: (d) => [d.options.find((o) => o.seat === 2)!.id] });
    expect(asked.some((d) => d.tag === 'hubris' && d.seat === 0)).toBe(true);
    expect(glory(s)).toEqual([1, 9, 8]);
  });
  it('The Flood stops Light cards from activating', () => {
    const s = blank();
    choir(s, 0, H.confession);
    s.currentEvent = E.flood;
    const { asked } = drive(s, activationPhase(s, 0));
    expect(asked.some((d) => d.tag === 'activate' && d.options.some((o) => o.card === H.confession))).toBe(false);
  });
});

describe('V34 card changes', () => {
  it('Confession pays only when the revealed hand holds no Dark card', () => {
    const run = (cards: string[]) => {
      const s = blank();
      choir(s, 0, H.confession);
      hand(s, 0, ...cards);
      drive(s, activationPhase(s, 0), { activate: (d) => [d.options.find((o) => o.card === H.confession)?.id ?? 'end'] });
      return s.players[0].glory;
    };
    expect(run([H.wisdom, H.twilight])).toBe(1);
    expect(run([H.wisdom, H.moloch])).toBe(0);
    expect(run([H.nephilim])).toBe(0); // Nephilim counts as Dark
  });
});

describe('Glory routing', () => {
  it('the Arbiter: when its Choir scores, it takes 1 of that from a player whose Choir scored nothing (else all from the Pot)', () => {
    const s = blank(3, [C.arbiter]);
    choir(s, 0, H.wisdom, H.gabriel); // 2 Light cards: scores 4
    choir(s, 1, H.confession);
    altar(s, H.confession);
    reap(s);
    expect(glory(s)).toEqual([4, 2, 0]);
    s.players[2].glory = 4;
    reap(s);
    expect(glory(s)).toEqual([8, 4, 3]); // Cy scored nothing: 1 of the 4 comes from Cy
  });
  it('Glory moves between players only through card abilities: old gift inputs do not replay', () => {
    const cfg = { seed: 3, mode: 'open' as const, players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) };
    expect('gift' in new Game(cfg)).toBe(false);
    expect(() => Game.replay(cfg, [{ t: 'gift', from: 0, to: 1, amount: 1 } as any])).toThrow(RuleError);
  });
});

describe('Evening', () => {
  it('Twilight (V43): 2 Glory if the other cards hold as many Light as Dark (Nephilim counts as both); Moderation (V45) pays a Choir with as many Light as Dark cards', () => {
    const s = blank();
    choir(s, 0, H.twilight, H.nephilim);
    choir(s, 1, H.moderation, H.moloch); // V45: Moderation is Light: 1 Light, 1 Dark
    choir(s, 2, H.twilight, H.wisdom, H.gabriel, H.moloch); // 2 Light, 1 Dark
    drive(s, evening(s, true));
    expect(glory(s)).toEqual([2, 1, 0]);
  });
});

describe('Endgame', () => {
  it('V45: tokens are revealed and each scores the Days its color won; most Glory wins, a tie shared', () => {
    const s = blank();
    for (const [day, dir] of [[1, 'light'], [2, 'light'], [3, 'dark'], [4, 'neutral'], [5, 'light']] as const) s.tides.push({ day, dir, light: 0, dark: 0, margin: 0 });
    s.tides.push({ day: 6, dir: 'dark', light: 0, dark: 2, margin: 2, void: true }); // Purgatory: counts for neither side
    s.players[0].tokens = ['light', 'light', 'light', 'light', 'dark', 'dark']; // 4 x 3 + 2 x 1 = 14
    s.players[1].tokens = ['light', 'light', 'dark', 'dark', 'dark', 'dark']; // 2 x 3 + 4 x 1 = 10
    s.players[2].tokens = ['light', 'light', 'light', 'dark', 'dark', 'dark']; // 3 x 3 + 3 x 1 = 12
    s.players.forEach((p, i) => { p.glory = [10, 14, 12][i]; });
    drive(s, endGame(s));
    expect(s.result!.daysWon).toEqual({ light: 3, dark: 1 });
    expect(glory(s)).toEqual([24, 24, 24]);
    expect(s.result!.standings[2]).toMatchObject({ before: 12, fromTokens: 12 });
    expect(s.result!.winners).toEqual([0, 1, 2]);
  });
  it('V45: no offering, no harvest: a player who did not Offer today scores nothing at the Reaping', () => {
    const s = blank();
    choir(s, 0, H.wisdom, H.gabriel);
    choir(s, 1, H.confession);
    s.players[1].offeredToday = false;
    altar(s, H.freeWill);
    reap(s);
    expect(glory(s)).toEqual([4, 0, 0]);
    const t = blank();
    t.players[0].offeredToday = false;
    choir(t, 0, H.wisdom);
    hand(t, 0, H.moloch);
    drive(t, takeTurn(t, 0), { action: ['offer'] });
    expect(t.players[0].offeredToday).toBe(true);
  });
});

describe('Morning', () => {
  it('V41: there is no Seed; Creation (Advanced) reveals 3 Host cards onto the Altar', () => {
    const s = blank();
    s.day = 2;
    s.eventDeck = [E.ascension, ...s.eventDeck.filter((e) => e !== E.ascension)];
    drive(s, morning(s));
    expect(s.altar).toHaveLength(0);
    s.eventDeck = [E.creation, ...s.eventDeck.filter((e) => e !== E.creation)];
    drive(s, morning(s));
    expect(s.altar).toHaveLength(3);
  });
  it('the Base game has no Events and no Celestials', () => {
    const g = new Game({ seed: 4, mode: 'open', players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
    expect(g.state.players.every((p) => p.celestial === '')).toBe(true);
    expect(g.state.eventDeck).toHaveLength(0);
    expect(g.state.currentEvent).toBe(null);
  });
});

describe('V35: First Fruits and facedown Offers', () => {
  const pick = (card: string) => (d: any) => [d.options.find((o: any) => o.card === card)?.id ?? 'end'];
  const fd = (s: any, id: string, by: number) => s.altar.push({ id, facedown: true, offeredBy: by, day: s.day, kind: 'offer' });

  it('Offers go facedown; Hymn and Lamentation go face up', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    drive(s, takeTurn(s, 0), { action: ['offer'] });
    expect(s.altar[0]).toMatchObject({ id: H.wisdom, facedown: true, kind: 'offer' });
    const t = blank();
    hand(t, 0, H.lamentation);
    drive(t, takeTurn(t, 0), { action: ['offer'] });
    expect(t.altar[0]).toMatchObject({ id: H.lamentation, facedown: false });
  });
  it('V45: an Offer earns no Glory, and is counted for the Miser\'s Rule', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    s.players[0].tokens = [];
    drive(s, takeTurn(s, 0), { action: ['offer'] });
    expect(s.players[0].glory).toBe(0);
    expect(s.players[0].offeredToday).toBe(true);
    expect(s.players[0].hand).toHaveLength(0);
  });
  it('the Altar is revealed at the start of the Evening', () => {
    const s = blank();
    fd(s, H.wisdom, 1);
    drive(s, evening(s, false));
    expect(s.log.some((l) => l.text.startsWith('The Altar is revealed'))).toBe(true);
  });
  it('Ithuriel flips a facedown card', () => {
    const s = blank();
    choir(s, 0, H.revelation);
    hand(s, 0, H.gabriel);
    fd(s, H.moloch, 1);
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: pick(H.revelation), revelation: (d) => [d.options.find((o) => s.altar[Number(o.id)].id === H.moloch)!.id] });
    expect(s.altar.find((a) => a.id === H.moloch)!.facedown).toBe(false);
  });
  it('Knowledge shows the chosen facedown cards once, to that player only, then they are hidden again', () => {
    const s = blank();
    choir(s, 0, H.knowledge);
    fd(s, H.moloch, 1);
    fd(s, H.wisdom, 2);
    const { asked } = drive(s, activationPhase(s, 0), { activate: pick(H.knowledge), knowledge: (d) => d.options.map((o) => o.id) });
    const shown = asked.find((d) => d.tag === 'knowledge.seen')!;
    expect(shown.seat).toBe(0);
    expect([...shown.reveal!].sort()).toEqual([H.moloch, H.wisdom].sort());
    // Afterwards nobody's view names them, the Knowledge player's included, and no log line does either.
    for (const seat of [0, 1]) expect(viewFor(s, seat, []).altar.filter((a) => a.facedown && a.offeredBy !== seat).every((a) => a.id === null)).toBe(true);
    expect(s.log.some((e) => /Moloch|Wisdom/.test(e.text))).toBe(false);
  });
  it('Belial with an empty hand still shows the card once', () => {
    const s = blank();
    choir(s, 0, H.belial);
    fd(s, H.wisdom, 1);
    const { asked } = drive(s, activationPhase(s, 0), { activate: pick(H.belial), belial: (d) => [d.options[0].id] });
    expect(asked.find((d) => d.tag === 'belial.seen')!.reveal).toEqual([H.wisdom]);
    expect(viewFor(s, 0, []).altar.find((a) => a.offeredBy === 1)!.id).toBeNull();
  });
  it('Belial exchanges a facedown card with one from hand, keeping it facedown', () => {
    const s = blank();
    choir(s, 0, H.belial);
    hand(s, 0, H.moloch, H.gabriel);
    fd(s, H.wisdom, 1);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.gabriel)!.id], activate: pick(H.belial), belial: (d) => [d.options.find((o) => s.altar[Number(o.id)].id === H.wisdom)!.id], 'belial.swap': (d) => [d.options.find((o) => o.card === H.moloch)!.id] });
    const swapped = s.altar.find((a) => a.offeredBy === 1)!;
    expect(swapped).toMatchObject({ id: H.moloch, facedown: true });
    expect(s.players[0].hand).toContain(H.wisdom);
  });
  it('Mirage shields facedown Offerings from Revelation', () => {
    const s = blank();
    choir(s, 0, H.revelation);
    choir(s, 1, H.mirage);
    hand(s, 0, H.gabriel);
    fd(s, H.moloch, 1);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['offer'], activate: pick(H.revelation) });
    expect(asked.some((d) => d.tag === 'revelation')).toBe(false);
    expect(s.altar.find((a) => a.id === H.moloch)!.facedown).toBe(true);
  });
  it('Pandemonium blocks flips and looks', () => {
    const s = blank();
    s.currentEvent = E.pandemonium;
    choir(s, 0, H.knowledge);
    fd(s, H.moloch, 1);
    const { asked } = drive(s, activationPhase(s, 0), { activate: pick(H.knowledge) });
    expect(asked.some((d) => d.tag === 'knowledge')).toBe(false);
  });
  it('Vessel pays 1 Glory at the Reaping only if its card is still on the Altar and matches the Tide (V40)', () => {
    for (const [placed, others, want] of [[H.wisdom, [H.confession], 1 + 2], [H.moloch, [H.confession, H.freeWill], 2 - 1]] as const) { // V45: Vessel is Light and scores 2; a Dark card under it costs 1
      const s = blank();
      choir(s, 0, H.vessel);
      s.altar.push({ id: placed, facedown: false, offeredBy: 0, day: s.day, kind: 'vessel' });
      altar(s, ...others);
      expect(setTide(s).dir).toBe('light');
      reap(s);
      expect(s.players[0].glory).toBe(want);
    }
  });
  it('Vessel adds its card facedown, with no draw (V42)', () => {
    const s = blank();
    choir(s, 0, H.vessel);
    hand(s, 0, H.wisdom);
    drive(s, activationPhase(s, 0), { activate: pick(H.vessel), 'vessel.hand': (d) => [d.options.find((o) => o.card === H.wisdom)!.id] });
    expect(s.altar.some((a) => a.kind === 'vessel' && a.facedown && a.id === H.wisdom)).toBe(true);
    expect(s.players[0].glory).toBe(0);
    expect(s.players[0].hand).toHaveLength(0);
  });
  it('a full game runs First Fruits every Morning, with no Glory for it', () => {
    const g = new Game({ seed: 5, mode: 'open', players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
    let n = 0;
    while (g.pending.length) {
      for (const d of g.pending) {
        if (d.tag === 'firstFruits') n++;
        g.answer(d.seat, d.id, botAnswer(g.state, d));
      }
    }
    expect(n).toBe(3 * g.state.day);
    expect(g.state.stats.filter((x) => x.type === 'glory' && x.source === 'fruits')).toHaveLength(0);
  });
  it('Open Game is 3 or 4 players', () => {
    expect(() => blank(5)).toThrow();
  });
});

describe('V45: allegiance tokens and the Tide track', () => {
  const four = () => new Game({ seed: 11, mode: 'open', players: ['A', 'B', 'C', 'D'].map((name) => ({ name, isBot: true })) }).state;
  it('7 Days at 3 and 4 players; each player is dealt 6 tokens from an even pool', () => {
    for (const n of [3, 4]) {
      const g = new Game({ seed: 9, mode: 'open', players: ['A', 'B', 'C', 'D'].slice(0, n).map((name) => ({ name, isBot: true })) });
      const all = g.state.players.flatMap((p) => p.tokens);
      expect(g.state.players.every((p) => p.tokens.length === 6)).toBe(true);
      expect(all.filter((t) => t === 'light')).toHaveLength(3 * n);
      while (g.pending.length) for (const d of g.pending) g.answer(d.seat, d.id, botAnswer(g.state, d));
      expect(g.state.day).toBe(7);
      expect(g.state.tides).toHaveLength(7);
    }
    expect(four().players).toHaveLength(4);
  });
  it('Judgment Day: on Day 7 everyone chooses in secret; actions are carried out in turn order, and one that can no longer be done does nothing', () => {
    const s = blank();
    s.day = 7;
    hand(s, 0, H.wisdom);
    hand(s, 1, H.gabriel);
    hand(s, 2, H.moloch);
    altar(s, H.envy);
    const asked: string[] = [];
    // Everyone wants to Gather Envy; the first player in turn order gets it, the others do nothing.
    drive(s, (function* () { yield* judgmentDay(s); for (const seat of [0, 1, 2]) yield* takeTurn(s, seat); })(), {
      judgment: (d) => { asked.push(String(d.seat)); return [d.options.find((o) => o.id === 'gather|card:' + H.envy)!.id]; },
    });
    expect(asked.sort()).toEqual(['0', '1', '2']);
    expect(s.players.map((p) => p.choir.map((c) => c.id))).toEqual([[H.envy], [], []]);
    expect(s.log.filter((l) => l.kind === 'judgment' && /do nothing/.test(l.text))).toHaveLength(2);
  });
  it('a token is Offered facedown, counts 2 for its color, and only its owner sees which', () => {
    const s = blank();
    s.players[0].tokens = ['dark'];
    hand(s, 0, H.wisdom);
    altar(s, H.gabriel);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': ['token:dark'] });
    expect(s.players[0].tokens).toEqual([]);
    expect(s.players[0].offeredToday).toBe(true);
    expect(setTide(s)).toMatchObject({ dir: 'dark', light: 1, dark: 2 });
    expect(viewFor(s, 0).altarTokens).toEqual([{ side: 'dark', by: 0 }]);
    expect(viewFor(s, 1).altarTokens).toEqual([{ side: null, by: 0 }]);
    expect(viewFor(s, 1).players[0].tokens).toBeNull();
    expect(viewFor(s, 1).players[0].tokenCount).toBe(0);
  });
  it('Gathering a token needs no room in the Choir; tokens are not cards, so Ascension does not double them', () => {
    const s = blank();
    choir(s, 1, H.wisdom, H.gabriel, H.confession, H.moloch); // full
    s.altarTokens.push({ side: 'light', by: 0 });
    s.players[1].tokens = [];
    expect(legalActions(s, 1)).toContain('gather');
    drive(s, takeTurn(s, 1), { action: ['gather'], 'gather.source': ['token:0'] });
    expect(s.players[1].tokens).toEqual(['light']);
    expect(s.altarTokens).toHaveLength(0);
    s.altarTokens.push({ side: 'light', by: 0 });
    s.currentEvent = E.ascension;
    expect(setTide(s).light).toBe(2);
  });
  it('tokens left on the Altar go, one at a time, to whoever holds the fewest', () => {
    const s = blank();
    s.players.forEach((p, i) => (p.tokens = Array(i + 4).fill('light')));
    s.altarTokens.push({ side: 'dark', by: 2 }, { side: 'dark', by: 1 }, { side: 'light', by: 2 });
    drive(s, evening(s, true));
    expect(s.players.map((p) => p.tokens.length)).toEqual([6, 6, 6]);
    expect(s.tides[0].dir).toBe('dark'); // 2 Dark tokens (4) against 1 Light token (2)
  });
  it('the reveal is anonymous: facedown Offers are shuffled, and no one but the owner sees who Offered which', () => {
    const s = blank();
    for (const [seat, id] of [[0, H.wisdom], [1, H.moloch], [2, H.envy]] as const) s.altar.push({ id, facedown: true, offeredBy: seat, day: 1, kind: 'offer' });
    drive(s, evening(s, true));
    expect(s.altar.every((a) => a.anon && !a.facedown)).toBe(true);
    const v = viewFor(s, 1);
    expect(v.altar.filter((a) => a.offeredBy !== null).map((a) => a.id)).toEqual([H.moloch]);
  });
  it('First Fruits are shuffled onto the Altar with no owner', () => {
    const g = new Game({ seed: 4, mode: 'open', players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
    while (g.state.phase !== 'noon') for (const d of [...g.pending]) g.answer(d.seat, d.id, botAnswer(g.state, d));
    const fruits = g.state.altar.filter((a) => a.kind === 'fruits');
    expect(fruits).toHaveLength(3);
    expect(fruits.every((a) => a.offeredBy === null)).toBe(true);
  });
  it('Purgatory: the Day counts for neither side on the Tide track, but Choirs still score', () => {
    const s = blank();
    choir(s, 0, H.wisdom);
    altar(s, H.confession);
    s.currentEvent = E.purgatory;
    drive(s, evening(s, true));
    expect(s.tides[0]).toMatchObject({ dir: 'light', void: true });
    expect(s.players[0].glory).toBe(2);
  });
});

describe('V37 card changes', () => {
  const act = (id: string) => (d: any) => [d.options.find((o: any) => o.card === id)?.id ?? 'end'];
  it('Envy (V45) works only if the leader has at least 5 more Glory than you', () => {
    const run = (mine: number) => {
      const s = blank();
      choir(s, 0, H.envy);
      s.players[0].glory = mine;
      s.players[1].glory = 7;
      drive(s, activationPhase(s, 0), { activate: act(H.envy) });
      return s.players[1].glory;
    };
    expect(run(2)).toBe(6);
    expect(run(3)).toBe(7);
  });
  it('Watchers puts 1 of the top 3 into your hand, then you discard 1', () => {
    const s = blank();
    choir(s, 0, H.watchers);
    hand(s, 0, H.gabriel);
    altar(s, H.seraphim);
    for (const c of [H.wisdom, H.moloch, H.envy]) s.hostDeck = s.hostDeck.filter((x) => x !== c);
    s.hostDeck.unshift(H.wisdom, H.moloch, H.envy);
    const rest = s.hostDeck.length;
    drive(s, takeTurn(s, 0), {
      action: ['gather'], 'gather.source': (d) => [d.options.find((o) => o.id.startsWith('altar'))!.id], activate: act(H.watchers),
      'watchers.take': (d) => [d.options.find((o) => o.card === H.moloch)!.id],
      'watchers.discard': (d) => [d.options.find((o) => o.card === H.gabriel)!.id],
    });
    expect(s.players[0].hand).toEqual([H.moloch]);
    expect(s.discard).toContain(H.gabriel);
    expect(s.hostDeck).toHaveLength(rest - 1);
    expect(s.hostDeck.slice(0, 2).sort()).toEqual([H.envy, H.wisdom].sort());
  });
  it('Forger may Gather any Host card from the discard pile', () => {
    const s = blank();
    choir(s, 0, H.forger);
    s.hostDeck = s.hostDeck.filter((x) => x !== H.wisdom && x !== H.moloch);
    s.discard.push(H.wisdom, H.moloch);
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': (d) => [d.options.find((o) => o.id === 'discard:' + H.wisdom)!.id] });
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.wisdom);
    expect(s.discard).toEqual([H.moloch]);
  });
  it('Council (V45): named in the Morning; if both Choirs score at the Reaping, each gains 1', () => {
    const s = blank();
    choir(s, 0, H.council, H.wisdom);
    choir(s, 1, H.gabriel);
    choir(s, 2, H.confession);
    (s.day_ as any).council = { 0: 1 };
    altar(s, H.freeWill); // Light wins: each scores 2 a Light card (Council is Light since V45)
    reap(s);
    expect(glory(s)).toEqual([4 + 1, 2 + 1, 2]);
    const t = blank();
    choir(t, 0, H.council, H.wisdom);
    choir(t, 1, H.moloch);
    (t.day_ as any).council = { 0: 1 };
    altar(t, H.freeWill);
    reap(t);
    expect(glory(t)).toEqual([4, 0, 0]);
  });
  it('Mirage (V42) only protects: no Glory for a facedown Offering that matches the Tide', () => {
    const run = (card: string) => {
      const s = blank();
      choir(s, 0, H.mirage);
      s.hostDeck = s.hostDeck.filter((x) => x !== card);
      s.altar.push({ id: card, facedown: true, offeredBy: 0, day: 1, kind: 'offer' });
      altar(s, H.wisdom); // with a Light card the Tide is Light either way below
      drive(s, evening(s, true));
      return s.players[0].glory;
    };
    expect(run(H.gabriel)).toBe(0);
    expect(run(H.moloch)).toBe(0);
  });
});


describe('V38 balance changes', () => {
  const act = (id: string) => (d: any) => [d.options.find((o: any) => o.card === id)?.id ?? 'end'];
  it('Knowledge looks at up to 3 facedown cards', () => {
    const s = blank();
    choir(s, 0, H.knowledge);
    for (const c of [H.gabriel, H.moloch, H.envy, H.wisdom]) {
      s.hostDeck = s.hostDeck.filter((x) => x !== c);
      s.altar.push({ id: c, facedown: true, offeredBy: 1, day: 1, kind: 'offer' });
    }
    const { asked } = drive(s, activationPhase(s, 0), { activate: act(H.knowledge), knowledge: (d) => d.options.slice(0, 3).map((o) => o.id) });
    expect(asked.find((d) => d.tag === 'knowledge')!.max).toBe(3);
    expect(s.altar.filter((a) => a.seenBy?.includes(0))).toHaveLength(3);
    expect(s.players[0].glory).toBe(0);
  });
  it('Prophecy loses 1 on a Neutral Tide', () => {
    const s = blank();
    s.players[0].glory = 2;
    s.day_.prophecy[0] = 'light';
    reap(s);
    expect(s.players[0].glory).toBe(1);
  });
  it('Outcast gains 1 at the Reaping while it holds the least Glory', () => {
    const s = blank();
    choir(s, 0, H.outcast);
    s.players[1].glory = 2;
    s.players[2].glory = 2;
    reap(s);
    expect(s.players[0].glory).toBe(1);
  });
  it('Mammon (V42) is the Dark store: 1 Glory each Day its Choir leans with the Tide; cash it in on your turn', () => {
    const s = blank();
    choir(s, 0, H.mammon, H.moloch); // Dark 2
    altar(s, H.envy); // Dark Tide
    reap(s);
    expect(s.players[0].choir.find((c) => c.id === H.mammon)!.store).toBe(1);
    s.altar = [];
    altar(s, H.wisdom); // Light Tide: nothing stored
    reap(s);
    expect(s.players[0].choir.find((c) => c.id === H.mammon)!.store).toBe(1);
    const g = s.players[0].glory;
    drive(s, activationPhase(s, 0), { activate: (d) => [d.options.find((o) => o.card === H.mammon)?.id ?? 'end'] });
    expect(s.players[0].glory).toBe(g + 1);
    expect(s.players[0].choir.some((c) => c.id === H.mammon)).toBe(false);
  });
});

describe('starting deal', () => {
  it('V41: deals a hand of 3 (the Dominion 5, V44) and 2 random face-up Choir cards, with room for 4', () => {
    const g = new Game({ seed: 21, mode: 'open', advanced: true, players: ['A', 'B', 'C', 'D'].map((name) => ({ name, isBot: false })) });
    expect(g.pending.some((d) => d.tag === 'choir.pick')).toBe(false);
    for (const p of g.state.players) {
      expect(p.choir).toHaveLength(2);
      expect(p.hand).toHaveLength(p.celestial === C.dominion ? 5 : 3);
    }
  });
});

describe('V42 reworked cards', () => {
  const act = (id: string) => (d: any) => [d.options.find((o: any) => o.card === id)?.id ?? 'end'];
  // A turn that leaves every lean alone: Offer a Neutral card, then use abilities as scripted.
  const filler = [H.council, H.twilight, H.stillness, H.knowledge, H.watchers, H.jubilee];
  const turn = (s: any, seat: number, script: Script) => {
    const c = filler.find((x) => s.hostDeck.includes(x))!;
    hand(s, seat, c);
    return drive(s, takeTurn(s, seat), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === c)!.id], ...script });
  };
  it('Uriel and Beelzebub (V45): 1 Glory with 3 or more other cards of their alignment in your Choir', () => {
    const s = blank();
    choir(s, 0, H.uriel, H.wisdom, H.gabriel, H.confession); // 3 other Light cards
    choir(s, 1, H.beelzebub, H.moloch, H.envy); // only 2 other Dark cards
    reap(s); // Neutral Tide: only the abilities pay
    expect(glory(s)).toEqual([1, 0, 0]);
  });
  it('Zealot (V42): 1 Glory if every other card in your Choir (at least 3) shares one alignment', () => {
    const s = blank();
    choir(s, 0, H.zealot, H.wisdom, H.gabriel, H.confession);
    choir(s, 1, H.moloch, H.envy);
    drive(s, evening(s, true));
    expect(s.players[0].glory).toBe(1);
    const t2 = blank();
    choir(t2, 0, H.zealot, H.wisdom, H.gabriel); // only 2 others
    drive(t2, evening(t2, true));
    expect(t2.players[0].glory).toBe(0);
  });
  it('Eternity (V43): keep one card on the Altar, face up, through the next Day', () => {
    const s = blank();
    choir(s, 0, H.eternity);
    altar(s, H.moloch, H.wisdom);
    drive(s, evening(s, false), { 'eternity.keep': (d) => [d.options.find((o) => o.card === H.moloch)!.id] });
    expect((s as any).relics).toEqual([{ id: H.moloch, by: null }]);
    s.day += 1;
    drive(s, morning(s));
    expect(s.altar.some((a) => a.id === H.moloch && !a.facedown && a.kind === 'relic')).toBe(true);
  });
  it('Providence (V45) stores 1 Glory each Day Light wins; cash it in on your turn', () => {
    const s = blank();
    choir(s, 0, H.providence, H.wisdom); // 2 Light cards
    altar(s, H.confession);
    reap(s); // 4, and 1 stored
    reap(s); // again: 4, and 1 more stored
    expect(s.players[0].choir.find((c) => c.id === H.providence)!.store).toBe(2);
    expect(s.players[0].glory).toBe(8);
    turn(s, 0, { activate: act(H.providence) });
    expect(s.players[0].glory).toBe(8 + 2);
    expect(s.players[0].choir.some((c) => c.id === H.providence)).toBe(false);
  });
  it('Seraphim and Legion (V42): Exalting a Light (Dark) card gains 1 Glory', () => {
    const run = (holder: string, card: string) => {
      const s = blank();
      choir(s, 0, holder);
      hand(s, 0, card);
      drive(s, takeTurn(s, 0), { action: ['exalt'] });
      expect(s.players[0].choir.map((c) => c.id)).toContain(card);
      return s.players[0].glory;
    };
    expect(run(H.seraphim, H.wisdom)).toBe(1);
    expect(run(H.seraphim, H.moloch)).toBe(0);
    expect(run(H.legion, H.moloch)).toBe(1);
  });
  it('Heresy (V45): pay 1 on your turn, and your Choir scores its cards of the losing color; Fig Leaves (V45) takes back a facedown Offer before the reveal', () => {
    const s = blank();
    choir(s, 0, H.heresy, H.moloch, H.envy);
    choir(s, 1, H.figLeaves);
    s.players.forEach((p) => (p.glory = 2));
    turn(s, 0, { activate: act(H.heresy) });
    altar(s, H.wisdom, H.gabriel, H.confession); // Light wins
    s.altar.push({ id: H.azazel, facedown: true, offeredBy: 1, day: s.day, kind: 'offer' });
    drive(s, evening(s, true), { 'figLeaves.take@1': (d) => [d.options.find((o) => o.card === H.azazel)!.id] });
    expect(s.players[0].glory).toBe(2 - 1 + 6); // Moloch, Envy and Heresy (Dark since V45) score on a Light Day
    expect(s.players[1].hand).toContain(H.azazel);
    expect(s.altar.map((a) => a.id)).not.toContain(H.azazel);
  });
  it('Morning Star (V45, pay 1): on your turn, one card counts as the opposite alignment this Day', () => {
    const s = blank();
    choir(s, 0, H.morningStar, H.moloch, H.envy); // Light 1, Dark 2: Dark 1
    s.players[0].glory = 3;
    turn(s, 0, { activate: act(H.morningStar), morningStar: (d) => [d.options.find((o) => o.card === H.envy)!.id] });
    altar(s, H.wisdom); // Light wins
    reap(s);
    expect(s.players[0].glory).toBe(3 - 1 + 4); // V45: it costs 1; Morning Star, and Envy now counted as Light
  });
  it('Raguel (V45): +1 each Reaping the Bound player\'s Choir scores more than yours', () => {
    const s = blank();
    choir(s, 0, H.raguel, H.moloch); // Raguel is Light
    choir(s, 1, H.wisdom, H.gabriel);
    s.bonds.push({ owner: 0, bound: 1 });
    altar(s, H.confession); // Light wins: 2 for the holder, 4 for the Bound player
    reap(s);
    expect(glory(s).slice(0, 2)).toEqual([2 + 1, 4]);
    altar(s, H.moloch, H.envy, H.azazel); // Dark wins: the holder outscores the Bound player
    reap(s);
    expect(glory(s).slice(0, 2)).toEqual([3 + 2, 4]);
  });
  it('Apple (V45): 1 Glory when the Tide turns', () => {
    const s = blank();
    choir(s, 0, H.apple);
    s.day = 2;
    s.tides.push({ day: 1, dir: 'dark', light: 0, dark: 1, margin: 1 });
    altar(s, H.wisdom); // Light wins today, Dark won yesterday
    reap(s);
    expect(s.players[0].glory).toBe(1);
    s.tides[0].dir = 'light';
    reap(s);
    expect(s.players[0].glory).toBe(1);
  });
  it('Covenant: if neither named player Offers this Day, each gains 1; if either Offers, nothing', () => {
    const s = blank();
    s.pacts.push({ a: 0, b: 1, action: 'offer', broken: false, day: 1 });
    s.pacts.push({ a: 2, b: 1, action: 'offer', broken: true, day: 1 });
    s.players.forEach((p) => (p.glory = 2));
    drive(s, evening(s, true));
    expect(glory(s)).toEqual([3, 3, 2]);
  });
  it('Gabriel (V43): +1 if the player named in the Morning Offers a card of the named alignment', () => {
    const s = blank();
    choir(s, 0, H.gabriel);
    (s.day_ as any).seer = { 0: { t: 1, dir: 'dark' } };
    (s.day_ as any).offered = { 1: [H.moloch] };
    reap(s);
    expect(s.players[0].glory).toBe(1);
  });
  it('Parasite (V43): Exalted into another Choir; it feeds when its holder loses and is discarded when they gain', () => {
    const s = blank();
    hand(s, 0, H.parasite);
    choir(s, 1, H.wisdom);
    drive(s, takeTurn(s, 0), { action: ['exalt'], 'parasite.target': ['p1'] });
    expect(s.players[0].choir).toHaveLength(0);
    expect(s.players[1].choir.map((c) => c.id)).toEqual([H.wisdom, H.parasite]); // Light 1 + Dark 1
    choir(s, 2, H.gabriel);
    s.players[1].glory = 3;
    altar(s, H.envy, H.azazel); // Dark Tide; player 1 is Neutral, player 2 alone against it
    reap(s);
    expect(s.players[0].glory).toBe(0); // player 1 neither gained nor lost
    s.players[1].choir = s.players[1].choir.filter((c) => c.id !== H.wisdom); // now Dark 1, alone with the Tide
    reap(s);
    expect(s.players[1].choir.some((c) => c.id === H.parasite)).toBe(false); // its holder gained: discarded
  });
});

describe('V42 one deck: no once-per-game cards', () => {
  const act = (id: string) => (d: any) => [d.options.find((o: any) => o.card === id)?.id ?? 'end'];
  it('every Light or Dark card is worth 1, except Hymn and Lamentation (2); the deck is 69 cards, all with art', () => {
    const g = new Game({ seed: 9, mode: 'open', players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
    const all = [...g.state.hostDeck, ...g.state.players.flatMap((p) => [...p.hand, ...p.choir.map((c) => c.id)])];
    expect(all).toHaveLength(69);
    for (const id of [H.ithuriel, H.urim, H.asmadai]) expect(all).not.toContain(id);
    for (const id of all) { const v = baseValue(g.state, id); expect(v.light + v.dark).toBeLessThanOrEqual(id === H.nephilim || id === H.hymn || id === H.lamentation ? 2 : 1); }
  });
  it('Stillness, Firmament, Prophecy and Casting Lots', () => {
    const s = blank();
    choir(s, 0, H.firmament, H.gabriel); // V45: Firmament pays for any Day won by exactly 1
    choir(s, 1, H.moloch, H.prophecy);
    choir(s, 2, H.stillness);
    s.day_.prophecy[1] = 'light';
    s.day_.lots[2] = 'light';
    altar(s, H.wisdom); // Light by 1
    reap(s);
    // V45 (all three are Light): P0 Gabriel and Firmament score 4, Firmament +1. P1 Prophecy scores 2, +1. P2 Stillness 2, Lots +1.
    expect(glory(s)).toEqual([5, 3, 3]);
  });
  it('Leviathan (V45) pays for a landslide; Favor (V45) when your Choir outscores everyone else; Defiance (V45) when most others score nothing', () => {
    const run = (cards: string[][], tide: string[]) => {
      const s = blank(4);
      cards.forEach((c, i) => choir(s, i, ...c));
      altar(s, ...tide);
      reap(s);
      return glory(s);
    };
    expect(run([[H.leviathan], [H.cherubim], [], []], [H.michael, H.tribute, H.sanctuary])).toEqual([1, 2, 0, 0]); // Light by 3
    expect(run([[H.favor, H.wisdom, H.freeWill], [H.moloch], [H.envy], [H.gabriel]], [H.confession])).toEqual([4 + 1, 0, 0, 2]); // Favor: outscored everyone
    expect(run([[H.favor, H.wisdom], [H.moloch], [H.envy], [H.gabriel]], [H.confession])).toEqual([2, 0, 0, 2]); // a tie is not more
    expect(run([[H.defiance, H.envy], [H.wisdom], [H.gabriel], []], [H.moloch, H.azazel])).toEqual([4 + 1, 0, 0, 0]);
    expect(run([[H.defiance, H.envy], [H.legion], [H.belial], []], [H.moloch, H.azazel])).toEqual([4, 2, 2, 0]); // two of three others scored
  });
  it('Defiance: other players cannot make you lose Glory (Scapegoat, Envy)', () => {
    const s = blank();
    choir(s, 1, H.scapegoat);
    choir(s, 0, H.defiance);
    choir(s, 2, H.wisdom);
    s.players.forEach((p) => (p.glory = 3));
    altar(s, H.gabriel, H.confession);
    const { asked } = reap(s);
    expect(asked.find((d) => d.tag === 'scapegoat')?.options.some((o) => o.seat === 0) ?? false).toBe(false);
  });
  it('Silence (V42, free): the chosen player\'s Choir abilities are off until your next turn', () => {
    const s = blank();
    choir(s, 0, H.silence);
    choir(s, 1, H.stillness);
    hand(s, 0, H.moloch);
    s.players[0].glory = 2;
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: act(H.silence), 'silence.player': ['p1'] });
    altar(s, H.wisdom); // a tie
    reap(s); // Neutral Tide, but Stillness is silenced
    expect(s.players[1].glory).toBe(0);
    expect(s.players[0].glory).toBe(2);
  });
  it('Bounty (V45): +1 if the named player\'s Choir scores nothing, -1 if it scores; Flaming Sword stops other players Exalting', () => {
    const s = blank();
    choir(s, 0, H.bounty, H.flamingSword, H.gabriel, H.confession);
    choir(s, 1, H.moloch);
    hand(s, 0, H.council);
    hand(s, 1, H.wisdom);
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: (d) => [d.options.find((o: any) => o.card === H.flamingSword)?.id ?? 'end'] });
    expect(legalActions(s, 1)).not.toContain('exalt');
    s.day_.bounty[0] = 1;
    altar(s, H.wisdom); // Light wins: player 1's Dark Choir scores nothing
    const g = s.players[0].glory;
    reap(s);
    expect(s.players[0].glory - g).toBe(6 + 1); // three Light cards (Flaming Sword is Light since V45), and the Bounty
    s.day_.bounty[0] = 1;
    s.altar = [];
    altar(s, H.envy, H.azazel); // Dark wins: player 1 scores
    const g2 = s.players[0].glory;
    reap(s);
    expect(s.players[0].glory - g2).toBe(2 - 1); // Bounty itself is Dark and scores; the Bounty costs 1
  });
  it('Tree of Life (V45): 1 Glory if Light won today and yesterday', () => {
    const s = blank();
    choir(s, 0, H.treeOfLife);
    altar(s, H.confession);
    s.day = 2;
    s.tides.push({ day: 1, dir: 'dark', light: 0, dark: 1, margin: 1 });
    reap(s);
    expect(s.players[0].glory).toBe(2);
    s.tides[0].dir = 'light';
    reap(s);
    expect(s.players[0].glory).toBe(2 + 2 + 1);
  });
  it('Martyr, Lilith and Snare (V43)', () => {
    const s = blank();
    choir(s, 0, H.martyr, H.wisdom, H.gabriel);
    choir(s, 1, H.lilith);
    choir(s, 2, H.michael, H.snare);
    hand(s, 2, H.moloch);
    drive(s, takeTurn(s, 2), { action: ['offer'], activate: (d) => [d.options.find((o) => o.card === H.michael)?.id ?? 'end'], 'michael.target': (d) => [d.options.find((o) => o.card === H.wisdom)!.id], 'lilith.take': ['yes'] });
    expect(s.players[0].glory).toBe(1); // Martyr: a card was discarded from its Choir
    expect(s.players[1].hand).toContain(H.wisdom); // Lilith took it
    const a = s.altar.find((x) => x.id === H.moloch)!;
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': (d) => [d.options.find((o) => o.id === 'altar:' + s.altar.indexOf(a))!.id] });
    expect(s.players[2].glory).toBe(1); // Snare, when player 0 Gathered it
  });
  it('Temptation (V45): a card in another player\'s Choir counts as the opposite alignment this Day; Tribute is paid', () => {
    const s = blank();
    choir(s, 0, H.temptation);
    choir(s, 1, H.wisdom, H.tribute);
    s.players[0].glory = 2;
    drive(s, activationPhase(s, 0), { activate: act(H.temptation), 'temptation.turn': (d) => [d.options.find((o) => o.card === H.wisdom)!.id] });
    expect(choirColors(s, 1)).toEqual({ light: 1, dark: 1 });
    expect(glory(s).slice(0, 2)).toEqual([1, 1]);
    altar(s, H.confession); // Light wins: Wisdom now counts as Dark
    reap(s);
    expect(s.players[1].glory).toBe(1 + 2); // only Tribute scores
  });
  it('Gather (V42) takes a card from the Altar only', () => {
    const s = blank();
    choir(s, 0, H.wisdom);
    expect(legalActions(s, 0)).not.toContain('gather'); // an empty Altar: nothing to Gather
    altar(s, H.moloch);
    drive(s, takeTurn(s, 0), { action: ['gather'] });
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.moloch);
  });
  it('spent cards: Free Will (second action), Abaddon (replace the Altar), Michael (cast a card out), then each is discarded', () => {
    const s = blank();
    choir(s, 0, H.freeWill, H.abaddon, H.michael);
    choir(s, 1, H.wisdom);
    hand(s, 0, H.council, H.twilight);
    altar(s, H.gabriel);
    const all = (d: any) => [d.options.find((o: any) => [H.freeWill, H.abaddon, H.michael].includes(o.card))?.id ?? 'end'];
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: all, 'michael.target': (d) => [d.options.find((o) => o.seat === 1)!.id] });
    expect(s.players[0].choir).toHaveLength(0);
    expect(s.players[1].choir).toHaveLength(0);
    expect(s.altar.some((a) => a.id === H.gabriel)).toBe(false);
    expect(s.discard).toEqual(expect.arrayContaining([H.freeWill, H.abaddon, H.michael, H.wisdom]));
  });
  it('Mercy (V45): 1 Glory when your Choir scores nothing at the Reaping', () => {
    const s = blank();
    choir(s, 0, H.mercy, H.moloch, H.envy);
    choir(s, 1, H.gabriel);
    altar(s, H.confession); // Light wins: Mercy is Light, so it scores
    reap(s);
    expect(glory(s).slice(0, 2)).toEqual([2, 2]);
    const t = blank();
    choir(t, 0, H.mercy, H.moloch);
    altar(t, H.envy); // Dark wins: Moloch scores
    reap(t);
    expect(t.players[0].glory).toBe(2);
    t.players[0].choir = t.players[0].choir.filter((c) => c.id !== H.moloch);
    reap(t); // nothing scores: Mercy pays 1
    expect(t.players[0].glory).toBe(3);
  });
  it('Anathema (V45): until the start of your next turn, other players\' Offers go face up, tokens too', () => {
    const s = blank();
    choir(s, 0, H.anathema);
    hand(s, 0, H.council, H.twilight);
    hand(s, 1, H.wisdom, H.moloch);
    s.players[2].tokens = ['dark'];
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: act(H.anathema) });
    expect(legalActions(s, 1)).toContain('offer');
    drive(s, takeTurn(s, 1), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.wisdom)!.id] });
    expect(s.altar.find((a) => a.id === H.wisdom)!.facedown).toBe(false);
    drive(s, takeTurn(s, 2), { action: ['offer'], 'offer.card': ['token:dark'] });
    expect(viewFor(s, 1).altarTokens).toEqual([{ side: 'dark', by: 2 }]);
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: () => ['end'] }); // it ends at the start of its holder's turn
    expect(s.anathema).toHaveLength(0);
  });
});


describe('V44 Advanced pass: Celestials and Events for the current scoring', () => {
  const offerDown = (s: any, id: string, by: number) => { s.hostDeck = s.hostDeck.filter((x: string) => x !== id); s.altar.push({ id, facedown: true, offeredBy: by, day: 1, kind: 'offer' }); };
  const cel = (id: string) => (d: any) => [d.options.find((o: any) => o.card === id)?.id ?? 'end'];
  it('the Tempest (V45): when you Offer, destroy a card on the Altar, face up or facedown (not on a turn you build)', () => {
    const s = blank(3, [C.tempest]);
    hand(s, 0, H.wisdom, H.gabriel);
    altar(s, H.moloch);
    offerDown(s, H.envy, 1);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.wisdom)!.id], activate: cel(C.tempest), tempest: (d) => [d.options.find((o) => o.label.startsWith('Facedown'))!.id] });
    expect(s.altar.map((a) => a.id)).toContain(H.moloch);
    expect(s.altar.map((a) => a.id)).not.toContain(H.envy); // the facedown Envy is destroyed unseen
    const b = blank(3, [C.tempest]);
    hand(b, 0, H.wisdom);
    altar(b, H.moloch);
    const r = drive(b, takeTurn(b, 0), { action: ['exalt'], activate: cel(C.tempest) });
    expect(r.asked.some((d) => d.tag === 'activate' && d.options.some((o) => o.card === C.tempest))).toBe(false);
    expect(b.altar.map((a) => a.id)).toEqual([H.moloch]);
  });
  it('the Oracle: look at the top 2 Events, play one, and put the other on the bottom', () => {
    const s = blank(3, [C.oracle]);
    s.eventDeck = [E.famine, E.manna, E.babel, E.tithe];
    drive(s, morning(s), { 'oracle.use': ['yes'], 'oracle.two': (d) => [d.options.find((o) => o.card === E.manna)!.id] });
    expect(s.currentEvent).toBe(E.manna);
    expect(s.eventDeck).toEqual([E.babel, E.tithe, E.famine]);
  });
  it('the Cantor (V45): when you Offer, a card or a token, draw a card', () => {
    const s = blank(3, [C.cantor]);
    hand(s, 0, H.wisdom);
    s.players[0].tokens = ['light'];
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': ['token:light'] });
    expect(s.players[0].hand).toHaveLength(2);
    expect(s.altarTokens).toHaveLength(1);
  });
  it('the Patron (V45): exchange a card from your hand with a card in another player\'s Choir (Cherubim blocks it, Tribute is paid)', () => {
    const s = blank(3, [C.patron]);
    hand(s, 0, H.moloch);
    choir(s, 1, H.cherubim, H.wisdom);
    choir(s, 2, H.tribute, H.gabriel);
    s.players[0].glory = 2;
    const { asked } = drive(s, activationPhase(s, 0), { activate: cel(C.patron), 'patron.take': (d) => [d.options.find((o) => o.card === H.gabriel)!.id] });
    expect(asked.find((d) => d.tag === 'patron.player')?.options.some((o) => o.seat === 1) ?? false).toBe(false);
    expect(s.players[2].choir.map((c) => c.id)).toEqual([H.tribute, H.moloch]);
    expect(s.players[0].hand).toEqual([H.gabriel]);
    expect(glory(s)).toEqual([1, 0, 1]);
  });
  it('the Arbiter (V45): when its Choir scores, it takes 1 of that from a player whose Choir scored less', () => {
    const s = blank(3, [C.arbiter]);
    choir(s, 0, H.wisdom, H.gabriel);
    choir(s, 1, H.moloch); // scores nothing on a Light Day
    choir(s, 2, H.confession); // scores
    s.players.forEach((p) => (p.glory = 4));
    altar(s, H.confession);
    reap(s, { 'arbiter.take': (d) => { expect(d.options.map((o) => o.seat)).toEqual([1, 2]); return [d.options[0].id]; } }); // both scored less than 4
    expect(glory(s)).toEqual([8, 3, 6]);
    const z = blank(3, [C.arbiter]);
    choir(z, 0, H.wisdom, H.gabriel);
    altar(z, H.confession);
    reap(z);
    expect(glory(z)).toEqual([4, 0, 0]); // no one who scored less has Glory: all of it from the Pot
  });
  it('Divine Calling: an Exalt earns 1 Glory this Day', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    s.currentEvent = E.divineCalling;
    drive(s, takeTurn(s, 0), { action: ['exalt'] });
    expect(s.players[0].glory).toBe(1);
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.wisdom);
  });
  it('Tithe charges Host abilities only, not Celestial powers', () => {
    const s = blank(3, [C.tempest]);
    hand(s, 0, H.wisdom);
    altar(s, H.moloch);
    s.currentEvent = E.tithe;
    s.players[0].glory = 1;
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: cel(C.tempest), tempest: (d) => [d.options[0].id] });
    expect(s.players[0].glory).toBe(1); // nothing paid for the Tempest
    expect(s.altar.map((a) => a.id)).not.toContain(H.moloch);
  });
});

describe('Site review fixes (V44)', () => {
  it("the table's Altar tally can count a partial state with no rules settings (it crashed at First Fruits)", () => {
    expect(() => setTide({ altar: [{ id: H.hymn }, { id: H.moloch }], currentEvent: null, tides: [], day: 1 } as any)).not.toThrow();
    expect(setTide({ altar: [{ id: H.hymn }, { id: H.moloch }], currentEvent: null, tides: [], day: 1 } as any)).toMatchObject({ light: 2, dark: 1 });
  });
  it('Anathema exposes only the other players: its holder still Offers facedown (a Free Will second action)', () => {
    const s = blank();
    choir(s, 0, H.anathema);
    hand(s, 0, H.wisdom, H.gabriel);
    drive(s, activationPhase(s, 0), { activate: (d) => [d.options.find((o) => o.card === H.anathema)?.id ?? 'end'] });
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: () => ['end'], 'offer.card': (d) => [d.options.find((o) => o.card === H.wisdom)!.id] });
    expect(s.altar.find((a) => a.id === H.wisdom)!.facedown).toBe(true);
  });
});
