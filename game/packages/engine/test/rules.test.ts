import { describe, expect, it } from 'vitest';
import { alignment, baseValue, lose } from '../src/core';
import { C, E, H } from '../src/data';
import { endGame, evening, legalActions, reaping, setTide, takeTurn, morning } from '../src/engine';
import { Game, RuleError } from '../src/game';
import { viewFor } from '../src/view';
import { botAnswer } from '../src/bots';
import { altar, blank, choir, drive, hand, type Script } from './helpers';

const glory = (s: any) => s.players.map((p: any) => p.glory);
const reap = (s: any, script: Script = {}) => drive(s, reaping(s, setTide(s), s.players.map((p: any) => p.seat)), script);

describe('Set the Tide', () => {
  it('compares Light and Dark on the Altar, with margin', () => {
    const s = blank();
    altar(s, H.freeWill, H.wisdom, H.gabriel, H.moloch, H.envy, H.twilight); // L1 L1 L1 D1 D1 N (V42: every card is +1)
    expect(setTide(s)).toMatchObject({ dir: 'light', light: 3, dark: 2, margin: 1 });
  });
  it('Ascension and Fall From Grace double their side', () => {
    const s = blank();
    altar(s, H.wisdom, H.moloch);
    s.currentEvent = E.ascension;
    expect(setTide(s).dir).toBe('light');
    s.currentEvent = E.fallFromGrace;
    expect(setTide(s).dir).toBe('dark');
  });
  it('Nephilim cancels to 0; Acolyte (Shroud) matches the previous Tide (+1, V42)', () => {
    const s = blank();
    altar(s, H.nephilim, H.shroud);
    expect(setTide(s).dir).toBe('neutral'); // Day 1: Acolyte is Neutral
    s.day = 2;
    s.tides.push({ day: 1, dir: 'light', light: 1, dark: 0, margin: 1 });
    expect(setTide(s)).toMatchObject({ dir: 'light', light: 2, dark: 1 });
  });
});

describe('The Reaping', () => {
  it('V42 scoring: with the Tide alone 3, two 1 each, three or more 0; against it alone -3, otherwise -1; never below 0', () => {
    const run = (choirs: string[][], start = 2) => {
      const s = blank(choirs.length);
      choirs.forEach((c, i) => choir(s, i, ...c));
      s.players.forEach((p) => (p.glory = start));
      altar(s, H.confession); // Light Tide
      reap(s);
      return glory(s).map((g: number) => g - start);
    };
    expect(run([[H.freeWill, H.gabriel, H.wisdom], [H.moloch], []], 3)).toEqual([3, -3, 0]); // alone either way: +3 / -3
    expect(run([[H.freeWill, H.gabriel], [H.wisdom], [H.moloch]], 3)).toEqual([1, 1, -3]); // two with the Tide: 1 each
    expect(run([[H.wisdom], [H.moloch], [H.envy]], 3)).toEqual([3, -1, -1]); // two against it: -1 each
    expect(run([[H.wisdom], [H.gabriel], [H.confession], [H.moloch]], 3)).toEqual([0, 0, 0, -3]); // three share it: nobody scores
    expect(run([[H.moloch], [], []], 0)).toEqual([0, 0, 0]); // a loss never takes Glory below 0
  });
  it('Nephilim (V38) is Neutral for your Alignment and the Tide', () => {
    const s = blank();
    choir(s, 0, H.nephilim, H.uriel); // Nephilim adds nothing
    altar(s, H.nephilim);
    expect(alignment(s, 0, { reaping: true })).toBe(1);
    expect(setTide(s).dir).toBe('neutral');
  });
  it('a correct Whisper scores as if aligned; a net-zero Choir gains nothing', () => {
    const s = blank(3, [C.whisper]);
    choir(s, 0, H.moloch, H.envy); // Dark 2
    altar(s, H.wisdom);
    s.day_.whisperCall = 'light';
    reap(s);
    expect(s.players[0].glory).toBe(3);
  });
  it('the Eclipse (V38) neutralizes one card, chosen in the Evening before the reveal', () => {
    const s = blank(3, [C.eclipse]);
    choir(s, 0, H.freeWill, H.moloch); // Light 1 net
    altar(s, H.envy); // Dark Tide
    s.players[0].glory = 3;
    const { asked } = drive(s, evening(s, true), { 'eclipse.early': (d) => [d.options.find((o) => o.card === H.freeWill)!.id] });
    expect(asked.some((d) => d.tag === 'eclipse')).toBe(false);
    expect(s.players[0].glory).toBe(3 + 3); // now Dark 1, alone with the Dark Tide
  });
  it('Ordeal doubles the Reaping result', () => {
    const s = blank();
    choir(s, 0, H.ordeal, H.wisdom, H.gabriel); // Light 2
    altar(s, H.confession);
    s.day_.ordeal.push(0);
    reap(s);
    expect(s.players[0].glory).toBe(6);
  });
  it('Famine skips Alignment scoring; the V43 Purgatory paid Neutral Choirs and cost the others 1', () => {
    const s = blank();
    s.config.variants!.push('-purgatory-spare'); // V44 changed Purgatory (tested below)
    choir(s, 0, H.wisdom);
    choir(s, 1, H.twilight);
    s.players.forEach((p) => (p.glory = 2));
    altar(s, H.confession);
    s.currentEvent = E.famine;
    reap(s);
    expect(glory(s)).toEqual([2, 2, 2]);
    s.currentEvent = E.purgatory;
    reap(s);
    expect(glory(s)).toEqual([1, 3, 3]);
  });
  it('False Prophecy scores the opposite direction', () => {
    const s = blank();
    choir(s, 0, H.wisdom);
    s.players[0].glory = 4;
    altar(s, H.confession);
    s.currentEvent = E.falseProphecy;
    reap(s);
    expect(s.players[0].glory).toBe(1); // scored as the lone Choir against the Tide (V42: -3)
  });
});

describe('Actions', () => {
  it('Offer gains 1; the Cantor gains 1 per card; Hymn (V43) is Light +2 and goes face up when Offered', () => {
    const s = blank(3, [C.cantor, C.tempest, C.oracle]);
    hand(s, 0, H.wisdom, H.gabriel);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.second': (d) => [d.options[0].id] });
    expect(s.players[0].glory).toBe(2);
    expect(s.altar).toHaveLength(2);
    const t = blank(3, [C.tempest, C.oracle, C.cantor]);
    hand(t, 0, H.hymn);
    drive(t, takeTurn(t, 0), { action: ['offer'] });
    expect(t.players[0].glory).toBe(1);
    expect(t.altar[0]).toMatchObject({ id: H.hymn, facedown: false });
    expect(baseValue(t, H.hymn)).toEqual({ light: 2, dark: 0 });
    expect(baseValue(t, H.lamentation)).toEqual({ light: 0, dark: 2 });
  });
  it('Raphael (V43) destroys a face-up Dark card and keeps the Offer\'s Glory; the Offer goes face up', () => {
    const s = blank();
    choir(s, 0, H.raphael);
    hand(s, 0, H.wisdom);
    altar(s, H.moloch);
    drive(s, takeTurn(s, 0), { action: ['offer'], raphael: (d) => [d.options.find((o) => o.card === H.moloch)!.id] });
    expect(s.players[0].glory).toBe(1);
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
    const { asked } = drive(t, takeTurn(t, 0), { action: ['offer'] });
    const act = asked.find((d) => d.tag === 'action');
    expect(act).toBeDefined();
    expect(act!.options.map((o) => o.id)).toEqual(['offer', 'gather']);
  });
});

describe('Protection and reactions', () => {
  it('Cherubim stops Michael; Winnowing discards up to 2 facedown Altar cards unseen (V42)', () => {
    const s = blank();
    choir(s, 0, H.winnowing, H.michael);
    choir(s, 1, H.cherubim, H.wisdom);
    choir(s, 2, H.moloch);
    for (const [id, by] of [[H.gabriel, 1], [H.envy, 2], [H.hymn, 2]] as const) { s.hostDeck = s.hostDeck.filter((x) => x !== id); s.altar.push({ id, facedown: true, offeredBy: by, day: 1, kind: 'offer' }); }
    const { asked } = drive(s, takeTurn(s, 0), {
      action: ['gather'], 'gather.source': ['deck'],
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
    drive(s, takeTurn(s, 0), {
      action: ['gather'], 'gather.source': ['deck'],
      activate: (d) => [d.options.find((o) => o.card === H.michael)?.id ?? 'end'],
      'michael.target': (d) => [d.options.find((o) => o.seat === 1)!.id],
    });
    expect(s.players[0].glory).toBe(1);
    expect(s.players[1].glory).toBe(1);
    expect(s.players[1].choir).toHaveLength(1); // Michael cast a card out
  });
  it('The Flood also switches off automatic Light abilities, but the cards still count toward Alignment', () => {
    const run = (event: string | null) => {
      const s = blank();
      choir(s, 0, H.seraphim);
      hand(s, 0, H.gabriel);
      s.currentEvent = event;
      drive(s, takeTurn(s, 0), { action: ['exalt'] });
      return { glory: s.players[0].glory, align: alignment(s, 0) };
    };
    expect(run(null)).toEqual({ glory: 1, align: 2 }); // Seraphim pays for a Light Exalt
    expect(run(E.flood)).toEqual({ glory: 0, align: 2 });
  });
  it('Let There Be Light lets Parasite be discarded to make room', () => {
    const s = blank();
    choir(s, 0, H.parasite, H.moloch, H.azazel, H.envy); // a full Choir of 4
    s.currentEvent = E.letThereBeLight;
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'] });
    const room = asked.find((d) => d.options.some((o) => o.card === H.moloch) && d.options.length >= 3);
    expect(room?.options.some((o) => o.card === H.parasite)).toBe(true);
  });
  it('Hubris (V42): if tied leaders each gained 4 or more this Day, the holder chooses one of them to pay 1', () => {
    const s = blank();
    choir(s, 0, H.hubris);
    s.players[1].glory = 9;
    s.players[2].glory = 9;
    for (const seat of [1, 2]) s.stats.push({ type: 'glory', seat, amount: 4, day: s.day, source: 'offer' } as any);
    const { asked } = reap(s, { hubris: (d) => [d.options.find((o) => o.seat === 2)!.id] });
    expect(asked.some((d) => d.tag === 'hubris' && d.seat === 0)).toBe(true);
    expect(glory(s)).toEqual([1, 9, 8]);
  });
  it('The Flood stops Light cards from activating', () => {
    const s = blank();
    choir(s, 0, H.confession);
    s.currentEvent = E.flood;
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'] });
    expect(asked.some((d) => d.tag === 'activate' && d.options.some((o) => o.card === H.confession))).toBe(false);
  });
});

describe('V34 card changes', () => {
  it('Confession pays only when the revealed hand holds no Dark card', () => {
    const run = (cards: string[]) => {
      const s = blank();
      choir(s, 0, H.confession);
      hand(s, 0, ...cards);
      drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: (d) => [d.options.find((o) => o.card === H.confession)?.id ?? 'end'] });
      return s.players[0].glory;
    };
    expect(run([H.wisdom, H.twilight])).toBe(1);
    expect(run([H.wisdom, H.moloch])).toBe(0);
    expect(run([H.nephilim])).toBe(0); // Nephilim counts as Dark
  });
});

describe('Glory routing', () => {
  it('the Arbiter (V34): at the Reaping, takes 1 of its gain from a rival (from the Pot if no one has Glory)', () => {
    const s = blank(3, [C.arbiter]);
    s.config.variants!.push('-arbiter-judge'); // the V43 Arbiter (V44 is tested below)
    choir(s, 0, H.wisdom, H.gabriel); // Light 2, alone with the Tide: gains 3
    altar(s, H.confession);
    reap(s);
    expect(glory(s)).toEqual([3, 0, 0]);
    s.players[2].glory = 4;
    reap(s);
    expect(glory(s)).toEqual([6, 0, 3]);
  });
  it('the Arbiter (V34): gives 1 of its Reaping loss to a player of its choice', () => {
    const s = blank(3, [C.arbiter]);
    s.config.variants!.push('-arbiter-judge');
    choir(s, 0, H.moloch, H.envy); // Dark 2
    s.players[0].glory = 5;
    altar(s, H.confession);
    reap(s, { 'arbiter.give': ['p2'] });
    expect(glory(s)).toEqual([2, 0, 1]); // alone against the Tide, loses 3 (V42), and gives 1 of it to a player
  });
  it('Glory moves between players only through card abilities: old gift inputs do not replay', () => {
    const cfg = { seed: 3, mode: 'open' as const, players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) };
    expect('gift' in new Game(cfg)).toBe(false);
    expect(() => Game.replay(cfg, [{ t: 'gift', from: 0, to: 1, amount: 1 } as any])).toThrow(RuleError);
  });
});

describe('Evening', () => {
  it('Twilight (V43): 2 Glory if the other cards hold as many Light as Dark (Nephilim counts as both); Moderation pays a Neutral Choir', () => {
    const s = blank();
    choir(s, 0, H.twilight, H.nephilim);
    choir(s, 1, H.moderation, H.wisdom, H.moloch);
    choir(s, 2, H.twilight, H.wisdom, H.gabriel, H.moloch); // 2 Light, 1 Dark
    drive(s, evening(s, true));
    expect(glory(s)).toEqual([2, 1, 0]);
  });
});

describe('Endgame', () => {
  it('V41: no endgame bonus; most Glory wins; a tie is shared', () => {
    const s = blank();
    s.tides.push({ day: 6, dir: 'light', light: 2, dark: 0, margin: 2 });
    choir(s, 0, H.wisdom);
    hand(s, 0, H.gabriel);
    s.players.forEach((p, i) => (p.glory = [15, 15, 9][i]));
    drive(s, endGame(s));
    expect(glory(s)).toEqual([15, 15, 9]);
    expect(s.result!.winners).toEqual([0, 1]);
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
  it('V40: the Offer reward is always 1 Glory, with no choice to draw instead', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['offer'] });
    expect(asked.some((d) => d.tag === 'offer.reward')).toBe(false);
    expect(s.players[0].glory).toBe(1);
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
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: pick(H.knowledge), knowledge: (d) => d.options.map((o) => o.id) });
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
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: pick(H.belial), belial: (d) => [d.options[0].id] });
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
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: pick(H.knowledge) });
    expect(asked.some((d) => d.tag === 'knowledge')).toBe(false);
  });
  it('Vessel pays 1 Glory at the Reaping only if its card is still on the Altar and matches the Tide (V40)', () => {
    for (const [placed, others, want] of [[H.wisdom, [H.confession], 1], [H.moloch, [H.confession, H.freeWill], 0]] as const) {
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
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: pick(H.vessel), 'vessel.hand': (d) => [d.options.find((o) => o.card === H.wisdom)!.id] });
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

describe('the race to 12', () => {
  it('ends after the Reaping of the first Day on which someone has 12 Glory (V43)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const g = new Game({ seed, mode: 'open', players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
      while (g.pending.length) for (const d of g.pending) g.answer(d.seat, d.id, botAnswer(g.state, d));
      const s = g.state;
      expect(s.tides).toHaveLength(s.day);
      // Someone reached 12 at the last Reaping, and nobody had before it.
      const byDay = (day: number) => s.players.map((p) => s.stats.filter((e) => e.type === 'glory' && e.seat === p.seat && e.day <= day).reduce((a, e) => a + (e.amount ?? 0), 0));
      expect(Math.max(...s.players.map((p) => p.glory))).toBeGreaterThanOrEqual(12);
      if (s.day > 1) expect(Math.max(...byDay(s.day - 1))).toBeLessThan(12);
    }
  });
  it('the Arbiter gives to the other player with the least Glory; ties are the holder\'s choice', () => {
    const s = blank();
    s.config.variants!.push('-arbiter-judge');
    s.players[0].celestial = C.arbiter;
    s.players[0].glory = 5;
    s.players[1].glory = 2;
    s.players[2].glory = 2;
    const { asked } = drive(s, lose(s, 0, 2, 'reaping'), { 'arbiter.give': (d) => [d.options[1].id] });
    const d = asked.find((x) => x.tag === 'arbiter.give')!;
    expect(d.options.map((o) => o.seat)).toEqual([1, 2]);
    expect(s.players[2].glory).toBe(3);
    const t = blank();
    t.config.variants!.push('-arbiter-judge');
    t.players[0].celestial = C.arbiter;
    t.players[0].glory = 5;
    t.players[1].glory = 4;
    t.players[2].glory = 1;
    drive(t, lose(t, 0, 2, 'reaping'));
    expect(t.players[2].glory).toBe(2);
  });
});

describe('V37 card changes', () => {
  const act = (id: string) => (d: any) => [d.options.find((o: any) => o.card === id)?.id ?? 'end'];
  it('Envy works only if the leader has at least 3 more Glory than you', () => {
    const run = (mine: number) => {
      const s = blank();
      choir(s, 0, H.envy);
      s.players[0].glory = mine;
      s.players[1].glory = 5;
      drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: act(H.envy) });
      return s.players[1].glory;
    };
    expect(run(2)).toBe(4);
    expect(run(3)).toBe(5);
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
  it('Council (V43): named in the Morning; if both Choirs lean the same way at the end of the Day, each gains 1', () => {
    const s = blank();
    choir(s, 0, H.council, H.wisdom);
    choir(s, 1, H.gabriel);
    choir(s, 2, H.confession);
    (s.day_ as any).council = { 0: 1 };
    reap(s); // empty Altar: a Neutral Tide, so only the abilities pay
    expect(glory(s)).toEqual([1, 1, 0]);
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
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: act(H.knowledge), knowledge: (d) => d.options.slice(0, 3).map((o) => o.id) });
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
  it('the Arbiter (V38) takes from a player only when it gains 2 or more', () => {
    const run = (cards: string[]) => {
      const s = blank(3, [C.arbiter]);
      s.config.variants!.push('-arbiter-judge');
      choir(s, 0, ...cards);
      s.players.forEach((p) => (p.glory = 3));
      altar(s, H.confession);
      reap(s);
      return glory(s).reduce((a: number, b: number) => a + b, 0) - 9; // Glory from the Pot
    };
    expect(run([H.wisdom])).toBe(2); // gains 3, 1 of it taken from a player
    expect(run([H.wisdom, H.gabriel])).toBe(2);
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
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: (d) => [d.options.find((o) => o.card === H.mammon)?.id ?? 'end'] });
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
  it("'choir-N' and 'pick-K' change the deal for testing", () => {
    const cfg = (v: string) => new Game({ seed: 23, mode: 'open', variants: [v], players: ['A', 'B', 'C'].map((name) => ({ name, isBot: false })) });
    for (const p of cfg('choir-3').state.players) expect(p.choir).toHaveLength(3);
    const g = cfg('pick-2');
    expect(g.pending.map((d) => d.tag)).toEqual(['choir.pick', 'choir.pick', 'choir.pick']);
    for (const p of g.state.players) expect(p.choir).toHaveLength(0);
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
  it('Uriel and Beelzebub (V42): 2 Glory with 3 or more other cards of their alignment in your Choir', () => {
    const s = blank();
    choir(s, 0, H.uriel, H.wisdom, H.gabriel, H.confession); // 3 other Light cards
    choir(s, 1, H.beelzebub, H.moloch, H.envy); // only 2 other Dark cards
    reap(s); // Neutral Tide: only the abilities pay
    expect(glory(s)).toEqual([2, 0, 0]);
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
  it('Providence stores 1 Glory at each Reaping you lean with the Tide; cash it in on your turn', () => {
    const s = blank();
    choir(s, 0, H.providence, H.wisdom); // Light 2
    altar(s, H.confession);
    reap(s); // alone with the Tide: 3, and 1 stored
    reap(s); // again: 3, and 1 more stored
    expect(s.players[0].choir.find((c) => c.id === H.providence)!.store).toBe(2);
    expect(s.players[0].glory).toBe(6);
    turn(s, 0, { activate: act(H.providence) });
    expect(s.players[0].glory).toBe(6 + 1 + 2); // the Offer's 1, then the 2 stored
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
  it('Heresy is chosen on your turn (pay 1); Fig Leaves (V43) in the Evening, before the reveal', () => {
    const s = blank();
    choir(s, 0, H.heresy, H.moloch); // Dark 1
    choir(s, 1, H.figLeaves, H.envy); // Dark 1
    s.players.forEach((p) => (p.glory = 2));
    turn(s, 0, { activate: act(H.heresy) });
    altar(s, H.wisdom); // Light Tide
    drive(s, evening(s, true), { 'figLeaves.evening@1': ['yes'] });
    expect(glory(s).slice(0, 2)).toEqual([2 + 1 - 1 + 3, 2]); // Heresy: Light, alone with the Tide; Fig Leaves sits out
  });
  it('Morning Star (V42, free): on your turn, one card counts as the opposite alignment this Day', () => {
    const s = blank();
    choir(s, 0, H.morningStar, H.moloch, H.envy); // Light 1, Dark 2: Dark 1
    s.players[0].glory = 3;
    turn(s, 0, { activate: act(H.morningStar), morningStar: (d) => [d.options.find((o) => o.card === H.envy)!.id] });
    altar(s, H.wisdom); // Light Tide
    reap(s);
    expect(s.players[0].glory).toBe(3 + 1 + 3); // Offer +1, then Light 1, alone with the Tide
  });
  it('Raguel (V42): shared fate: +1 when the Bound player gains, -1 when they lose', () => {
    const s = blank();
    choir(s, 0, H.raguel, H.moloch); // Dark 1
    choir(s, 1, H.wisdom); // Light 1
    s.bonds.push({ owner: 0, bound: 1 });
    s.players.forEach((p) => (p.glory = 5));
    altar(s, H.confession); // Light Tide
    reap(s);
    expect(glory(s).slice(0, 2)).toEqual([5 - 3 + 1, 8]); // holder alone against the Tide (-3); Bound player alone with it (+3)
    altar(s, H.moloch, H.envy, H.azazel); // now Dark: the Bound player loses
    reap(s);
    expect(glory(s)[0]).toBe(3 + 3 - 1);
  });
  it('Apple (V43): 2 Glory when your Choir leans the other way from yesterday', () => {
    const s = blank();
    choir(s, 0, H.apple, H.wisdom); // Light 1
    s.lastAlignColor[0] = 'dark';
    reap(s); // Neutral Tide: only Apple pays
    expect(s.players[0].glory).toBe(2);
    reap(s); // same side as yesterday now
    expect(s.players[0].glory).toBe(2);
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
    choir(s, 0, H.firmament, H.gabriel); // V42: Firmament pays only if your Choir leans with the Tide
    choir(s, 1, H.moloch, H.prophecy);
    choir(s, 2, H.stillness);
    s.players.forEach((p) => (p.glory = 3));
    s.day_.prophecy[1] = 'light';
    s.day_.lots[2] = 'light';
    altar(s, H.wisdom); // Light by 1
    reap(s);
    // P0: Light, alone with the Tide (+3), Firmament +1. P1: Dark, alone against it (-3), Prophecy +1. P2: Lots +1.
    expect(glory(s)).toEqual([7, 1, 4]);
  });
  it('Leviathan (V43) rides a landslide; Favor (V43) gains when 2 or more others lose; Defiance (V43) rewards the upset', () => {
    const run = (cards: string[][], tide: string[]) => {
      const s = blank(4);
      cards.forEach((c, i) => choir(s, i, ...c));
      s.players.forEach((p) => (p.glory = 3));
      altar(s, ...tide);
      reap(s);
      return glory(s).map((g: number) => g - 3);
    };
    // Light wins by 3: Leviathan holder (Light) and a partner share it (+1 each), and Leviathan pays 1 more.
    expect(run([[H.leviathan, H.wisdom, H.gabriel, H.confession], [H.cherubim], [], []], [H.michael, H.tribute, H.sanctuary])).toEqual([2, 1, 0, 0]);
    // Two others lose: Favor (Neutral Choir: Favor is Dark 1, with Wisdom 0) gains 1.
    expect(run([[H.favor, H.wisdom], [H.moloch], [H.envy], [H.gabriel]], [H.confession])).toEqual([1, -1, -1, 3]);
    // Defiance: one Choir with the Tide, two against it.
    expect(run([[H.defiance, H.envy], [H.wisdom], [H.gabriel], []], [H.moloch, H.azazel])).toEqual([3 + 1, -1, -1, 0]);
  });
  it('Defiance: other players cannot make you lose Glory (Scapegoat, Envy)', () => {
    const s = blank();
    choir(s, 1, H.scapegoat); // Dark 1, loses under a Light Tide
    choir(s, 0, H.defiance); // Dark 1, loses 1 itself
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
    hand(s, 0, H.council);
    s.players[0].glory = 2;
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: act(H.silence), 'silence.player': ['p1'] });
    reap(s); // Neutral Tide, but Stillness is silenced
    expect(s.players[1].glory).toBe(0);
    expect(s.players[0].glory).toBe(2 + 1);
  });
  it('Bounty (V42): +1 if the player named in the Morning loses, -1 if they gain; Flaming Sword stops other players Exalting', () => {
    const s = blank();
    choir(s, 0, H.bounty, H.flamingSword, H.gabriel, H.confession); // Light 1
    choir(s, 1, H.moloch);
    hand(s, 0, H.council);
    hand(s, 1, H.wisdom);
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: (d) => [d.options.find((o: any) => o.card === H.flamingSword)?.id ?? 'end'] });
    expect(legalActions(s, 1)).not.toContain('exalt');
    s.day_.bounty[0] = 1;
    altar(s, H.wisdom); // Light Tide: player 1 (Dark) loses
    s.players[1].glory = 3;
    const g = s.players[0].glory;
    reap(s);
    expect(s.players[0].glory - g).toBe(3 + 1); // alone with the Tide, and the Bounty
    s.day_.bounty[0] = 1;
    s.altar = [];
    altar(s, H.envy, H.azazel); // Dark Tide: player 1 gains
    const g2 = s.players[0].glory;
    reap(s);
    expect(s.players[0].glory - g2).toBe(-1 - 3); // Bounty -1; player 0 leans Light, alone against the Tide
  });
  it('Tree of Life (V43): 1 Glory if your Choir leaned with the Tide today and yesterday', () => {
    const s = blank();
    choir(s, 0, H.treeOfLife, H.wisdom); // Light 2
    choir(s, 1, H.gabriel); // Light: two share the Tide, 1 each
    altar(s, H.confession);
    reap(s);
    expect(s.players[0].glory).toBe(1);
    reap(s);
    expect(s.players[0].glory).toBe(1 + 1 + 1);
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
    expect(s.players[2].glory).toBe(1 + 1); // the Offer, then Snare when player 0 Gathered it
  });
  it('Temptation (V42): on your turn, play a card from your hand into another player\'s Choir', () => {
    const s = blank();
    choir(s, 0, H.temptation);
    hand(s, 0, H.moloch, H.council);
    choir(s, 1, H.wisdom);
    choir(s, 2, H.cherubim); // protected
    const { asked } = drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.council)!.id], activate: act(H.temptation), 'temptation.give': (d) => [d.options.find((o) => o.card === H.moloch && o.seat === 1)!.id] });
    expect(asked.find((d) => d.tag === 'temptation.give')!.options.some((o) => o.seat === 2)).toBe(false);
    expect(s.players[1].choir.map((c) => c.id)).toEqual([H.wisdom, H.moloch]);
    expect(alignment(s, 1)).toBe(0);
  });
  it('Gather (V42) takes a card from the Altar only', () => {
    const s = blank();
    s.config.variants = [];
    choir(s, 0, H.wisdom);
    expect(legalActions(s, 0)).not.toContain('gather'); // an empty Altar: nothing to Gather
    altar(s, H.moloch);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'] });
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.moloch);
    expect(asked.find((d) => d.tag === 'gather.source')?.options.some((o) => o.id === 'deck') ?? false).toBe(false);
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
  it('Mercy (V42, spent): if yours is the only Choir against the Tide, lose 1 instead of 3, then discard it', () => {
    const s = blank();
    choir(s, 0, H.mercy, H.moloch, H.envy); // Dark 1
    choir(s, 1, H.gabriel); // Light
    s.players.forEach((p) => (p.glory = 5));
    altar(s, H.confession);
    reap(s, { mercy: ['yes'] });
    expect(glory(s).slice(0, 2)).toEqual([4, 8]);
    expect(s.players[0].choir.map((c) => c.id)).not.toContain(H.mercy);
  });
  it('Anathema (V42): no other player may Offer until the start of your next turn', () => {
    const s = blank();
    choir(s, 0, H.anathema);
    hand(s, 0, H.council, H.twilight);
    hand(s, 1, H.wisdom, H.hymn);
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: act(H.anathema) });
    expect(legalActions(s, 1)).not.toContain('offer');
    drive(s, takeTurn(s, 1), { action: ['gather'], 'gather.source': ['deck'] });
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: () => ['end'] }); // you may Offer on your next turn
    expect(legalActions(s, 1)).toContain('offer'); // it ended at the start of your turn
  });
});


describe('V44 Advanced pass: Celestials and Events for the current scoring', () => {
  const offerDown = (s: any, id: string, by: number) => { s.hostDeck = s.hostDeck.filter((x: string) => x !== id); s.altar.push({ id, facedown: true, offeredBy: by, day: 1, kind: 'offer' }); };
  const cel = (id: string) => (d: any) => [d.options.find((o: any) => o.card === id)?.id ?? 'end'];
  it('the Tempest: when you Offer, destroy a face-up card on the Altar (not on a turn you build; never a facedown card)', () => {
    const s = blank(3, [C.tempest]);
    hand(s, 0, H.wisdom, H.gabriel);
    altar(s, H.moloch);
    offerDown(s, H.envy, 1);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.wisdom)!.id], activate: cel(C.tempest) });
    expect(s.altar.map((a) => a.id)).not.toContain(H.moloch);
    expect(s.altar.map((a) => a.id)).toContain(H.envy); // the facedown Envy cannot be destroyed
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
  it('the Cantor: a second card of the same alignment (Neutral pairs too); both go face up, each with its reward', () => {
    const s = blank(3, [C.cantor]);
    hand(s, 0, H.wisdom, H.moloch, H.gabriel);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.wisdom)!.id], 'offer.second': (d) => [d.options.find((o) => o.card === H.gabriel)!.id] });
    expect(asked.find((d) => d.tag === 'offer.second')!.options.map((o) => o.card)).toEqual([H.gabriel, undefined]); // not the Dark Moloch
    expect(s.players[0].glory).toBe(2);
    expect(s.altar.map((a) => [a.id, a.facedown])).toEqual([[H.wisdom, false], [H.gabriel, false]]);
    const n = blank(3, [C.cantor]);
    hand(n, 0, H.council, H.twilight);
    drive(n, takeTurn(n, 0), { action: ['offer'], 'offer.second': (d) => [d.options[0].id] });
    expect(n.players[0].glory).toBe(2);
    const one = blank(3, [C.cantor]);
    hand(one, 0, H.wisdom);
    drive(one, takeTurn(one, 0), { action: ['offer'] });
    expect(one.altar[0].facedown).toBe(true); // a single Offer stays facedown
  });
  it('the Patron: playing a card into another Choir is Targeting, as with Temptation (Cherubim blocks it, Tribute is paid)', () => {
    const s = blank(3, [C.patron]);
    hand(s, 0, H.moloch);
    choir(s, 1, H.cherubim);
    choir(s, 2, H.tribute);
    s.players[0].glory = 2;
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: cel(C.patron) });
    expect(s.players[1].choir.map((c) => c.id)).toEqual([H.cherubim]); // the only other choice, Ben, is protected
    expect(s.players[2].choir.map((c) => c.id)).toContain(H.moloch);
    expect(s.players[0].glory).toBe(1);
    expect(s.players[2].glory).toBe(1);
  });
  it('the Arbiter: when it gains at the Reaping, it takes 1 of it from a player who leaned against the Tide (else any player)', () => {
    const s = blank(3, [C.arbiter]);
    choir(s, 0, H.wisdom, H.gabriel); // Light, alone with the Tide: 3
    choir(s, 1, H.moloch); // Dark: against it
    s.players.forEach((p) => (p.glory = 4));
    altar(s, H.confession);
    reap(s, { 'arbiter.take': (d) => { expect(d.options.map((o) => o.seat)).toEqual([1]); return [d.options[0].id]; } });
    expect(glory(s)).toEqual([7, 0, 4]); // Ben lost 3 alone against the Tide, and 1 more went to the Arbiter
    const t = blank(3, [C.arbiter]);
    choir(t, 0, H.wisdom);
    choir(t, 1, H.gabriel); // a pair with the Tide: 1 each; no one leaned against it, so the Arbiter may take from anyone
    t.players.forEach((p) => (p.glory = 4));
    altar(t, H.confession);
    reap(t, { 'arbiter.take': (d) => { expect(d.options.map((o) => o.seat)).toEqual([1, 2]); return [d.options[1].id]; } });
    expect(glory(t)).toEqual([5, 5, 3]);
    const z = blank(3, [C.arbiter]);
    choir(z, 0, H.wisdom, H.gabriel);
    altar(z, H.confession);
    reap(z);
    expect(glory(z)).toEqual([3, 0, 0]); // no one has Glory: all of it from the Pot
    const l = blank(3, [C.arbiter]);
    choir(l, 0, H.moloch);
    l.players.forEach((p) => (p.glory = 4));
    altar(l, H.confession);
    reap(l);
    expect(glory(l)).toEqual([1, 4, 4]); // a loss is no longer handed to anyone
  });
  it('Divine Calling: an Exalt earns 1 Glory this Day', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    s.currentEvent = E.divineCalling;
    drive(s, takeTurn(s, 0), { action: ['exalt'] });
    expect(s.players[0].glory).toBe(1);
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.wisdom);
  });
  it('Purgatory: no Choir loses at the Reaping; a Choir that leans neither way gains 1; the Tide still pays', () => {
    const s = blank();
    choir(s, 0, H.wisdom); // Light: alone with the Tide
    choir(s, 1, H.moloch); // Dark: alone against it
    choir(s, 2, H.twilight); // Neutral
    s.players.forEach((p) => (p.glory = 2));
    altar(s, H.confession);
    s.currentEvent = E.purgatory;
    reap(s);
    expect(glory(s)).toEqual([5, 2, 3]);
  });
  it('Tithe charges Host abilities only, not Celestial powers', () => {
    const s = blank(3, [C.tempest]);
    hand(s, 0, H.wisdom);
    altar(s, H.moloch);
    s.currentEvent = E.tithe;
    drive(s, takeTurn(s, 0), { action: ['offer'], activate: cel(C.tempest), tempest: (d) => [d.options[0].id] });
    expect(s.players[0].glory).toBe(1); // the Offer's 1, nothing paid for the Tempest
    expect(s.altar.map((a) => a.id)).not.toContain(H.moloch);
  });
});

describe('Site review fixes (V44)', () => {
  it("the table's Altar tally can count a partial state with no rules settings (it crashed at First Fruits)", () => {
    expect(() => setTide({ altar: [{ id: H.hymn }, { id: H.moloch }], currentEvent: null, tides: [], day: 1 } as any)).not.toThrow();
    expect(setTide({ altar: [{ id: H.hymn }, { id: H.moloch }], currentEvent: null, tides: [], day: 1 } as any)).toMatchObject({ light: 2, dark: 1 });
  });
  it('Anathema stops only the other players: its holder may still Offer (a Free Will second action)', () => {
    const s = blank();
    choir(s, 0, H.anathema);
    hand(s, 0, H.wisdom, H.gabriel);
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: (d) => [d.options.find((o) => o.card === H.anathema)?.id ?? 'end'] });
    expect(legalActions(s, 0)).toContain('offer');
    expect(legalActions(s, 1)).not.toContain('offer');
  });
});
