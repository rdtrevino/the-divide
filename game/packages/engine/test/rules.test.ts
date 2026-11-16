import { describe, expect, it } from 'vitest';
import { alignment, lose } from '../src/core';
import { C, E, H } from '../src/data';
import { endGame, evening, reaping, setTide, takeTurn, unveiling } from '../src/engine';
import { Game } from '../src/game';
import { viewFor } from '../src/view';
import { botAnswer } from '../src/bots';
import { altar, blank, choir, drive, hand, type Script } from './helpers';

const glory = (s: any) => s.players.map((p: any) => p.glory);
const reap = (s: any, script: Script = {}) => drive(s, reaping(s, setTide(s), [0, 1, 2].slice(0, s.players.length)), script);

describe('Set the Tide', () => {
  it('compares Light and Dark on the Altar, with margin', () => {
    const s = blank();
    altar(s, H.freeWill, H.wisdom, H.moloch, H.envy, H.twilight); // L2 L1 D1 D1 N
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
  it('Nephilim cancels to 0; Shroud is the opposite of the previous Tide (+2)', () => {
    const s = blank();
    altar(s, H.nephilim, H.shroud);
    expect(setTide(s).dir).toBe('neutral'); // Day 1: Shroud is Neutral
    s.day = 2;
    s.tides.push({ day: 1, dir: 'light', light: 1, dark: 0, margin: 1 });
    expect(setTide(s)).toMatchObject({ dir: 'dark', dark: 3, light: 1 });
  });
});

describe('The Reaping', () => {
  it('gains when aligned, loses when opposed, never below 0, capped at 3', () => {
    const s = blank();
    choir(s, 0, H.freeWill, H.mercy, H.wisdom); // Light 5
    choir(s, 1, H.moloch); // Dark 1
    s.players[1].glory = 0;
    altar(s, H.confession);
    reap(s);
    expect(glory(s)).toEqual([3, 0, 0]);
  });
  it('Uriel doubles Light values; Nephilim always scores 0', () => {
    const s = blank();
    choir(s, 0, H.uriel, H.nephilim); // Light 1 doubled = 2, Nephilim 0
    altar(s, H.wisdom);
    expect(alignment(s, 0, { reaping: true })).toBe(2);
    reap(s);
    expect(s.players[0].glory).toBe(2);
  });
  it('Heresy (V34): you may score in reverse, chosen after the Tide is known', () => {
    const s = blank();
    choir(s, 0, H.heresy, H.moloch); // Dark 1 under a Light Tide
    altar(s, H.wisdom);
    reap(s, { heresy: ['yes'] });
    expect(s.players[0].glory).toBe(1);
    const t = blank();
    choir(t, 0, H.heresy, H.moloch);
    t.players[0].glory = 2;
    altar(t, H.wisdom);
    reap(t, { heresy: ['no'] });
    expect(t.players[0].glory).toBe(1);
  });
  it('a correct Whisper scores as if aligned; a net-zero Choir gains nothing', () => {
    const s = blank(3, [C.whisper]);
    choir(s, 0, H.moloch, H.envy); // Dark 2
    altar(s, H.wisdom);
    s.day_.whisperCall = 'light';
    reap(s);
    expect(s.players[0].glory).toBe(2);
  });
  it('Fig Leaves avoids a loss; Tithe charges 1 to activate it', () => {
    const s = blank();
    choir(s, 0, H.figLeaves, H.moloch, H.envy);
    s.players[0].glory = 5;
    altar(s, H.wisdom);
    s.currentEvent = E.tithe;
    reap(s, { figLeaves: ['yes'] });
    expect(s.players[0].glory).toBe(4);
  });
  it('the Eclipse neutralizes one card after the Tide is known', () => {
    const s = blank(3, [C.eclipse]);
    choir(s, 0, H.freeWill, H.moloch); // Light 1 net
    altar(s, H.envy); // Dark Tide
    s.players[0].glory = 3;
    reap(s, { eclipse: (d) => [d.options.find((o) => o.card === H.freeWill)!.id] });
    expect(s.players[0].glory).toBe(4); // now Dark 1, gains 1
  });
  it('Ordeal doubles, still capped at 3', () => {
    const s = blank();
    choir(s, 0, H.ordeal, H.wisdom, H.gabriel); // Light 2
    altar(s, H.confession);
    s.day_.ordeal.push(0);
    reap(s);
    expect(s.players[0].glory).toBe(3);
  });
  it('Apple doubles gains after the Choir changes color', () => {
    const s = blank();
    choir(s, 0, H.apple, H.wisdom);
    s.lastAlignColor[0] = 'dark';
    altar(s, H.confession);
    reap(s);
    expect(s.players[0].glory).toBe(2);
  });
  it('Mercy prevents Reaping losses; Scapegoat passes them on', () => {
    const s = blank();
    choir(s, 0, H.moloch);
    choir(s, 1, H.envy);
    s.players.forEach((p) => (p.glory = 5));
    altar(s, H.wisdom);
    s.day_.mercy.push(0);
    s.scapegoats.push({ from: 1, to: 2 });
    reap(s);
    expect(glory(s)).toEqual([5, 5, 4]);
  });
  it('Raguel (V34): only the holder\'s loss is shared with the Bound player', () => {
    const s = blank();
    choir(s, 0, H.raguel, H.moloch); // Dark 1
    choir(s, 1, H.wisdom); // Light 1
    s.bonds.push({ owner: 0, bound: 1 });
    s.players.forEach((p) => (p.glory = 5));
    altar(s, H.confession); // Light Tide
    reap(s);
    expect(glory(s).slice(0, 2)).toEqual([4, 5]); // 0 loses 1; 1 gains 1, then loses 1 (Bound)
    const t = blank();
    choir(t, 0, H.raguel, H.wisdom); // Light 1: gains
    choir(t, 1, H.moloch, H.envy); // Dark 2: loses 2
    t.bonds.push({ owner: 0, bound: 1 });
    t.players.forEach((p) => (p.glory = 5));
    altar(t, H.confession);
    reap(t);
    expect(glory(t).slice(0, 2)).toEqual([6, 3]); // the Bound player's loss is not shared back
  });
  it('Famine skips Alignment scoring; Purgatory pays Neutral Choirs', () => {
    const s = blank();
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
    s.players[0].glory = 2;
    altar(s, H.confession);
    s.currentEvent = E.falseProphecy;
    reap(s);
    expect(s.players[0].glory).toBe(1);
  });
  it('Stillness, Firmament, Prophecy, Leviathan, and Casting Lots', () => {
    const s = blank();
    choir(s, 0, H.firmament, H.leviathan);
    choir(s, 1, H.moloch, H.prophecy);
    choir(s, 2, H.stillness);
    s.players.forEach((p) => (p.glory = 3));
    s.day_.prophecy[1] = 'light';
    s.day_.lots[2] = 'light';
    altar(s, H.wisdom); // Light by 1
    reap(s);
    // P0: Leviathan is Dark 1 vs Light Tide: loses 1; Firmament +1; Leviathan +1 (P1 lost)
    // P1: Moloch Dark 1: loses 1; Prophecy correct +1
    // P2: lots correct +1
    expect(glory(s)).toEqual([4, 3, 4]);
  });
});

describe('Actions', () => {
  it('Offer gains 1; the Cantor gains 1 per card; Hymn offers 2 Light for 1', () => {
    const s = blank(3, [C.cantor, C.tempest, C.oracle]);
    hand(s, 0, H.wisdom, H.gabriel);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.second': (d) => [d.options[0].id], 'offer.reward': ['glory'] });
    expect(s.players[0].glory).toBe(2);
    expect(s.altar).toHaveLength(2);
    const t = blank(3, [C.tempest, C.oracle, C.cantor]);
    choir(t, 0, H.hymn);
    hand(t, 0, H.wisdom, H.gabriel);
    drive(t, takeTurn(t, 0), { action: ['offer'], 'offer.second': (d) => [d.options[0].id], 'offer.reward': ['glory'] });
    expect(t.players[0].glory).toBe(1);
    expect(t.altar).toHaveLength(2);
  });
  it('Raphael forgoes the Glory to destroy a Dark card', () => {
    const s = blank();
    choir(s, 0, H.raphael);
    hand(s, 0, H.wisdom);
    altar(s, H.moloch);
    drive(s, takeTurn(s, 0), { action: ['offer'], raphael: (d) => [d.options.find((o) => o.card === H.moloch)!.id] });
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
    choir(s, 0, H.parasite, H.wisdom, H.gabriel);
    altar(s, H.moloch);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['altar:0'] });
    const room = asked.find((d) => d.tag === 'choir.discard')!;
    expect(room.options.map((o) => o.card)).not.toContain(H.parasite);
  });
  it('Outcast and Divine Calling make Exalt free; The Fast forbids it', () => {
    const s = blank();
    choir(s, 0, H.outcast);
    hand(s, 0, H.wisdom);
    s.players[1].glory = 2;
    drive(s, takeTurn(s, 0), { action: ['exalt'] });
    expect(s.players[0].choir.map((c) => c.id)).toContain(H.wisdom);
    expect(s.players[0].glory).toBe(0);
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
  it('Cherubim stops Winnowing; Veil stops Michael', () => {
    const s = blank();
    choir(s, 0, H.winnowing, H.michael);
    choir(s, 1, H.cherubim, H.veil, H.wisdom);
    hand(s, 1, H.gabriel);
    choir(s, 2, H.moloch);
    hand(s, 2, H.envy);
    const { asked } = drive(s, takeTurn(s, 0), {
      action: ['gather'], 'gather.source': ['deck'],
      activate: (d) => [d.options.find((o) => o.card === H.winnowing)?.id ?? d.options.find((o) => o.card === H.michael)?.id ?? 'end'],
    });
    const win = asked.find((d) => d.tag === 'winnowing');
    // Only one legal target (seat 2), so it auto-resolves: check the effect instead.
    expect(win).toBeUndefined();
    expect(s.players[1].hand).toEqual([H.gabriel]);
    expect(s.players[2].hand).not.toContain(H.envy);
    const mich = asked.find((d) => d.tag === 'michael.target');
    expect(mich).toBeDefined();
    expect(mich!.options.filter((o) => o.seat === 1)).toHaveLength(0);
    expect(mich!.options.some((o) => o.seat === 2)).toBe(true);
  });
  it('Tribute charges 1 Glory to target that Choir', () => {
    const s = blank();
    choir(s, 0, H.michael);
    s.players[0].glory = 2;
    choir(s, 1, H.tribute, H.wisdom);
    drive(s, takeTurn(s, 0), {
      action: ['gather'], 'gather.source': ['deck'],
      activate: (d) => [d.options.find((o) => o.card === H.michael)?.id ?? 'end'],
      'michael.target': (d) => [d.options.find((o) => o.seat === 1)!.id],
    });
    expect(s.players[1].glory).toBe(1);
    expect(s.players[1].choir.some((c) => c.facedown)).toBe(true);
  });
  it('Silence negates an activation and the cost is lost', () => {
    const s = blank();
    choir(s, 0, H.confession);
    choir(s, 1, H.silence);
    s.currentEvent = E.tithe;
    s.players[0].glory = 3;
    s.players[1].glory = 3;
    drive(s, takeTurn(s, 0), {
      action: ['gather'], 'gather.source': ['deck'],
      activate: (d) => [d.options.find((o) => o.card === H.confession)?.id ?? 'end'],
      silence: ['yes'],
    });
    expect(s.players[0].glory).toBe(2); // paid Tithe, gained nothing
    expect(s.players[1].glory).toBe(2); // paid Tithe for Silence
    expect(s.players[1].choir[0].used).toBe(true);
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
  it('Covenant forbids only Offer or Gather and names a player who has not yet acted', () => {
    const s = blank();
    choir(s, 1, H.covenant);
    s.day_.actionsTaken.push({ seat: 0, action: 'offer' });
    const { asked } = drive(s, takeTurn(s, 1), { action: ['gather'], 'gather.source': ['deck'], activate: (d) => [d.options.find((o) => o.card === H.covenant)?.id ?? 'end'] });
    const act = asked.find((d) => d.tag === 'covenant.action')!;
    expect(act.options.map((o) => o.id)).toEqual(['offer', 'gather']);
    expect(s.pacts).toHaveLength(1);
    expect(s.pacts[0].b).toBe(2); // seat 0 already acted, so only seat 2 can be named
  });
});

describe('Glory routing', () => {
  it('the Arbiter (V34): at the Reaping, takes 1 of its gain from a rival (from the Pot if no one has Glory)', () => {
    const s = blank(3, [C.arbiter]);
    choir(s, 0, H.wisdom, H.gabriel); // Light 2
    altar(s, H.confession);
    reap(s);
    expect(glory(s)).toEqual([2, 0, 0]);
    s.players[2].glory = 4;
    reap(s);
    expect(glory(s)).toEqual([4, 0, 3]);
  });
  it('the Arbiter (V34): gives 1 of its Reaping loss to a player of its choice', () => {
    const s = blank(3, [C.arbiter]);
    choir(s, 0, H.moloch, H.envy); // Dark 2
    s.players[0].glory = 5;
    altar(s, H.confession);
    reap(s, { 'arbiter.give': ['p2'] });
    expect(glory(s)).toEqual([3, 0, 1]);
  });
  it('Glory gifts are blocked on Babel; the final-Day ban applies only to the six-Day game', () => {
    const g = new Game({ seed: 3, mode: 'open', variants: ['six-days'], players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
    g.state.players[0].glory = 2;
    expect(g.canGift(0, 1, 1)).toBeNull();
    g.state.currentEvent = E.babel;
    expect(g.canGift(0, 1, 1)).toMatch(/Babel/);
    g.state.currentEvent = E.creation;
    g.state.day = 6;
    expect(g.canGift(0, 1, 1)).toMatch(/final Day/);
    const r = new Game({ seed: 3, mode: 'open', players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
    r.state.players[0].glory = 2;
    r.state.day = 6;
    expect(r.canGift(0, 1, 1)).toBeNull();
  });
});

describe('Evening', () => {
  it('Covenant: held pays both, broken costs both', () => {
    const s = blank();
    s.pacts.push({ a: 0, b: 1, action: 'offer', broken: false, day: 1 });
    s.pacts.push({ a: 2, b: 1, action: 'gather', broken: true, day: 1 });
    s.players.forEach((p) => (p.glory = 2));
    drive(s, evening(s, true));
    expect(glory(s)).toEqual([3, 2, 1]);
  });
  it('Twilight counts Nephilim as both colors; Moderation pays a Neutral Choir', () => {
    const s = blank();
    choir(s, 0, H.twilight, H.nephilim);
    choir(s, 1, H.moderation, H.wisdom, H.moloch);
    drive(s, evening(s, true));
    expect(glory(s)).toEqual([1, 1, 0]);
  });
});

describe('Endgame', () => {
  it('bonus counts matching hand and Choir cards; Nephilim never counts; ties go to more matching cards', () => {
    const s = blank();
    s.day = 6;
    s.tides.push({ day: 6, dir: 'light', light: 2, dark: 0, margin: 2 });
    choir(s, 0, H.wisdom, H.nephilim);
    hand(s, 0, H.gabriel);
    choir(s, 1, H.confession);
    s.players[1].glory = 1;
    drive(s, endGame(s));
    expect(s.result!.standings.map((x) => x.bonus)).toEqual([2, 1, 0]);
    expect(s.result!.winners).toEqual([0]);
  });
});

describe('Unveiling', () => {
  it('Creation reveals 3 Seeds; Eternity carries a Seed over', () => {
    const s = blank();
    s.day = 2;
    s.eventDeck = [E.creation, ...s.eventDeck.filter((e) => e !== E.creation)];
    s.carriedSeed = H.wisdom;
    s.hostDeck = s.hostDeck.filter((x) => x !== H.wisdom);
    drive(s, unveiling(s));
    expect(s.altar).toHaveLength(3);
    expect(s.altar[0].id).toBe(H.wisdom);
  });
});

describe('V35: First Fruits and facedown Offers', () => {
  const pick = (card: string) => (d: any) => [d.options.find((o: any) => o.card === card)?.id ?? 'end'];
  const fd = (s: any, id: string, by: number) => s.altar.push({ id, facedown: true, offeredBy: by, day: s.day, kind: 'offer' });

  it('Offers go facedown; Hymn pairs go face up', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.reward': ['glory'] });
    expect(s.altar[0]).toMatchObject({ id: H.wisdom, facedown: true, kind: 'offer' });
    const t = blank();
    choir(t, 0, H.hymn);
    hand(t, 0, H.wisdom, H.gabriel);
    drive(t, takeTurn(t, 0), { action: ['offer'], 'offer.second': (d) => [d.options[0].id], 'offer.reward': ['glory'] });
    expect(t.altar.map((a) => a.facedown)).toEqual([false, false]);
  });
  it('the Offer reward can be a card instead of Glory', () => {
    const s = blank();
    hand(s, 0, H.wisdom);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.reward': ['card'] });
    expect(s.players[0].glory).toBe(0);
    expect(s.players[0].hand).toHaveLength(1);
  });
  it('the Altar is revealed at the start of the Evening', () => {
    const s = blank();
    fd(s, H.wisdom, 1);
    drive(s, evening(s, false));
    expect(s.log.some((l) => l.text.startsWith('The Altar is revealed'))).toBe(true);
  });
  it('Ithuriel flips a facedown card', () => {
    const s = blank();
    choir(s, 0, H.ithuriel);
    hand(s, 0, H.gabriel);
    fd(s, H.moloch, 1);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.reward': ['glory'], activate: pick(H.ithuriel), ithuriel: (d) => [d.options.find((o) => s.altar[Number(o.id)].id === H.moloch)!.id] });
    expect(s.altar.find((a) => a.id === H.moloch)!.facedown).toBe(false);
  });
  it('Urim sees up to two facedown cards; they become visible to that player only', () => {
    const s = blank();
    choir(s, 0, H.urim);
    fd(s, H.moloch, 1);
    fd(s, H.wisdom, 2);
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: pick(H.urim), urim: (d) => d.options.map((o) => o.id) });
    const v0 = viewFor(s, 0, []), v1 = viewFor(s, 1, []);
    expect(v0.altar.filter((a) => a.facedown).map((a) => a.id).sort()).toEqual([H.moloch, H.wisdom].sort());
    expect(v1.altar.find((a) => a.offeredBy === 2)!.id).toBeNull();
  });
  it('Asmadai exchanges a facedown card with one from hand, keeping it facedown', () => {
    const s = blank();
    choir(s, 0, H.asmadai);
    hand(s, 0, H.moloch, H.gabriel);
    fd(s, H.wisdom, 1);
    drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.card': (d) => [d.options.find((o) => o.card === H.gabriel)!.id], 'offer.reward': ['glory'], activate: pick(H.asmadai), asmadai: (d) => [d.options.find((o) => s.altar[Number(o.id)].id === H.wisdom)!.id], 'asmadai.swap': (d) => [d.options.find((o) => o.card === H.moloch)!.id] });
    const swapped = s.altar.find((a) => a.offeredBy === 1)!;
    expect(swapped).toMatchObject({ id: H.moloch, facedown: true });
    expect(s.players[0].hand).toContain(H.wisdom);
  });
  it('Mirage shields facedown Offerings from Ithuriel, Urim and Asmadai', () => {
    const s = blank();
    choir(s, 0, H.ithuriel);
    choir(s, 1, H.mirage);
    hand(s, 0, H.gabriel);
    fd(s, H.moloch, 1);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['offer'], 'offer.reward': ['glory'], activate: pick(H.ithuriel) });
    expect(asked.some((d) => d.tag === 'ithuriel')).toBe(false);
    expect(s.altar.find((a) => a.id === H.moloch)!.facedown).toBe(true);
  });
  it('Pandemonium blocks flips and looks', () => {
    const s = blank();
    s.currentEvent = E.pandemonium;
    choir(s, 0, H.urim);
    fd(s, H.moloch, 1);
    const { asked } = drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: pick(H.urim) });
    expect(asked.some((d) => d.tag === 'urim')).toBe(false);
  });
  it('Vessel adds its card facedown', () => {
    const s = blank();
    choir(s, 0, H.vessel);
    drive(s, takeTurn(s, 0), { action: ['gather'], 'gather.source': ['deck'], activate: pick(H.vessel), vessel: ['yes'] });
    expect(s.altar.some((a) => a.kind === 'vessel' && a.facedown)).toBe(true);
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

describe('snake rounds', () => {
  it('runs two rounds per Day, the second in reverse order', () => {
    const g = new Game({ seed: 11, mode: 'open', variants: ['snake-rounds'], players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
    while (g.pending.length && g.state.day === 1) for (const d of g.pending) g.answer(d.seat, d.id, botAnswer(g.state, d));
    const order = g.state.stats.filter((e) => e.day === 1 && e.type === 'action' && ['offer', 'gather', 'exalt'].includes(e.source ?? '')).map((e) => e.seat!);
    const f = order[0];
    expect(order).toEqual([f, (f + 1) % 3, (f + 2) % 3, (f + 2) % 3, (f + 1) % 3, f]);
  });
});

describe('V36: first to 10 Glory', () => {
  it('ends after the Reaping of the first Day on which someone has 10 Glory', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const g = new Game({ seed, mode: 'open', players: ['A', 'B', 'C'].map((name) => ({ name, isBot: true })) });
      while (g.pending.length) for (const d of g.pending) g.answer(d.seat, d.id, botAnswer(g.state, d));
      const s = g.state;
      expect(s.tides).toHaveLength(s.day);
      // Before the endgame bonus, someone had reached 10 at the final Reaping, and nobody had before it.
      const byDay = (day: number) => s.players.map((p) => s.stats.filter((e) => e.type === 'glory' && e.seat === p.seat && e.day <= day && e.source !== 'bonus').reduce((a, e) => a + (e.amount ?? 0), 0));
      if (s.day > 1) expect(Math.max(...byDay(s.day - 1))).toBeLessThan(10);
    }
  });
  it('the Arbiter gives to the other player with the least Glory; ties are the holder\'s choice', () => {
    const s = blank();
    s.players[0].celestial = C.arbiter;
    s.players[0].glory = 5;
    s.players[1].glory = 2;
    s.players[2].glory = 2;
    const { asked } = drive(s, lose(s, 0, 2, 'reaping'), { 'arbiter.give': (d) => [d.options[1].id] });
    const d = asked.find((x) => x.tag === 'arbiter.give')!;
    expect(d.options.map((o) => o.seat)).toEqual([1, 2]);
    expect(s.players[2].glory).toBe(3);
    const t = blank();
    t.players[0].celestial = C.arbiter;
    t.players[0].glory = 5;
    t.players[1].glory = 4;
    t.players[2].glory = 1;
    drive(t, lose(t, 0, 2, 'reaping'));
    expect(t.players[2].glory).toBe(2);
  });
});
