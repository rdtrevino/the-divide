import { describe, expect, it } from 'vitest';
import { claimName, formatCode, verifyName, type NameStore } from '../src/names';

function memory(): NameStore & { rows: Map<string, { name: string; keyHash: string | null }> } {
  const rows = new Map<string, { name: string; keyHash: string | null }>();
  return {
    rows,
    async get(key) { return rows.get(key) ?? null; },
    async claim(key, name, keyHash) {
      if (rows.get(key)?.keyHash) return false;
      rows.set(key, { name, keyHash });
      return true;
    },
  };
}

describe('player names', () => {
  it('the first claim owns the name; others are refused, whatever the capitals or spacing', async () => {
    const store = memory();
    const a = await claimName(store, 'Robert');
    expect(a.ok).toBe(true);
    for (const other of ['Robert', 'robert', ' ROBERT  ']) {
      expect(await claimName(store, other)).toMatchObject({ ok: false, status: 409, reason: 'taken' });
    }
  });

  it('the owner can use the name on another device with the player code, typed any way', async () => {
    const store = memory();
    const a = await claimName(store, 'Robert');
    if (!a.ok) throw new Error();
    const typed = formatCode(a.code).toLowerCase();
    expect(await claimName(store, 'robert', typed)).toMatchObject({ ok: true, name: 'Robert' });
    expect(await claimName(store, 'Robert', 'AAAABBBBCCCC')).toMatchObject({ ok: false, reason: 'wrong-code' });
    expect(await verifyName(store, 'ROBERT', a.code)).toBe('Robert');
    expect(await verifyName(store, 'Robert', 'AAAABBBBCCCC')).toBe(null);
    expect(await verifyName(store, 'Ana', a.code)).toBe(null);
  });

  it('a name that appears in old stats but was never claimed can be claimed once', async () => {
    const store = memory();
    store.rows.set('ana', { name: 'Ana', keyHash: null });
    const a = await claimName(store, 'Ana');
    expect(a.ok).toBe(true);
    expect(await claimName(store, 'ana')).toMatchObject({ ok: false, reason: 'taken' });
  });

  it('bot names and empty names are refused', async () => {
    const store = memory();
    expect(await claimName(store, 'asher')).toMatchObject({ ok: false, reason: 'reserved' });
    expect(await claimName(store, ' ')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(await claimName(store, '<>')).toMatchObject({ ok: false, reason: 'invalid' });
  });
});
