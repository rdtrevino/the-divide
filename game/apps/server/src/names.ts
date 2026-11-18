// Player names. A name belongs to whoever used it first: their browser holds a private player code,
// and the name can be used anywhere else (a phone, another browser) only with that code.
// Names are compared without regard to capitals or extra spaces, so "Robert" and "robert " are one name.
import { BOT_NAMES, cleanName, playerKey } from './roomCore';

/** Easy to read aloud and type: no 0/O, 1/I/L. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 12;

export const normalizeCode = (raw: unknown) => String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function newCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(CODE_LENGTH)), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export async function hashCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('divide-player:' + normalizeCode(code)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** What the name store needs: one row per name key. */
export interface NameStore {
  get(key: string): Promise<{ name: string; keyHash: string | null } | null>;
  /** Insert or update the row; returns false if another claim got there first. */
  claim(key: string, name: string, keyHash: string, onlyIfUnclaimed: boolean): Promise<boolean>;
}

export type ClaimResult =
  | { ok: true; name: string; code: string }
  | { ok: false; status: 400 | 409; reason: 'invalid' | 'reserved' | 'taken' | 'wrong-code'; message: string };

/** Reserved for the computer players and for placeholders, so a bot is never mistaken for a person. */
const RESERVED = new Set([...BOT_NAMES, 'Guest', 'Bot', 'Host', 'Player'].map((n) => n.toLowerCase()));

export function validateName(raw: unknown): { name: string; key: string } | { error: string; reason: 'invalid' | 'reserved' } {
  const name = cleanName(raw);
  if (name.length < 2) return { error: 'Use at least 2 characters.', reason: 'invalid' };
  if (!/[\p{L}\p{N}]/u.test(name)) return { error: 'Use at least one letter or number.', reason: 'invalid' };
  const key = playerKey(name);
  if (RESERVED.has(key) || /^bot\b/.test(key)) return { error: `"${name}" is kept for the computer players. Choose another name.`, reason: 'reserved' };
  return { name, key };
}

/**
 * Claim a name, or prove it is yours.
 * - No code: succeeds only if nobody has the name yet, and returns a new code for it.
 * - With a code: succeeds if it is the name's code (or the name is still free, which claims it with that code).
 */
export async function claimName(store: NameStore, rawName: unknown, rawCode?: unknown): Promise<ClaimResult> {
  const v = validateName(rawName);
  if ('error' in v) return { ok: false, status: 400, reason: v.reason, message: v.error };
  const code = rawCode === undefined || rawCode === null || rawCode === '' ? null : normalizeCode(rawCode);
  if (code !== null && code.length !== CODE_LENGTH) return { ok: false, status: 409, reason: 'wrong-code', message: 'That player code is not right. It has 12 letters and numbers.' };
  const row = await store.get(v.key);
  if (row?.keyHash) {
    if (code !== null && (await hashCode(code)) === row.keyHash) return { ok: true, name: row.name, code };
    return code === null
      ? { ok: false, status: 409, reason: 'taken', message: `"${row.name}" is already taken. If it's yours, enter your player code.` }
      : { ok: false, status: 409, reason: 'wrong-code', message: `That is not the player code for "${row.name}".` };
  }
  const fresh = code ?? newCode();
  const won = await store.claim(v.key, v.name, await hashCode(fresh), true);
  if (!won) return claimName(store, rawName, rawCode); // someone claimed it a moment ago: answer as above
  return { ok: true, name: v.name, code: fresh };
}

/** Check a name and code without claiming anything (used when a browser joins a table). */
export async function verifyName(store: NameStore, rawName: unknown, rawCode: unknown): Promise<string | null> {
  const v = validateName(rawName);
  if ('error' in v) return null;
  const row = await store.get(v.key);
  if (!row?.keyHash || !rawCode) return null;
  return (await hashCode(String(rawCode))) === row.keyHash ? row.name : null;
}

export function d1Names(db: D1Database): NameStore {
  return {
    async get(key) {
      const r = await db.prepare('SELECT name, key_hash FROM players WHERE id = ?1').bind(key).first<{ name: string; key_hash: string | null }>();
      return r ? { name: r.name, keyHash: r.key_hash } : null;
    },
    async claim(key, name, keyHash) {
      const r = await db
        .prepare(`INSERT INTO players (id, name, key_hash, claimed_at) VALUES (?1, ?2, ?3, datetime('now'))
                  ON CONFLICT(id) DO UPDATE SET name = excluded.name, key_hash = excluded.key_hash, claimed_at = excluded.claimed_at
                  WHERE players.key_hash IS NULL`)
        .bind(key, name, keyHash)
        .run();
      return (r.meta.changes ?? 0) > 0;
    },
  };
}
