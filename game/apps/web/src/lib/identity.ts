// Who you are, without accounts. A random id kept in this browser holds your seat when you reconnect.
// Your name is yours alone: the first time you use it the site gives this browser a private player code,
// and the name can be used anywhere else only with that code.
const ID = 'divide.client';
const NAME = 'divide.name';
const CODES = 'divide.codes';

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private browsing: kept for this visit only */ }
}
const memory = new Map<string, string>();

export function clientId(): string {
  let id = read(ID) ?? memory.get(ID) ?? null;
  if (!id || id.length < 8) {
    id = crypto.randomUUID?.() ?? `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    write(ID, id);
  }
  memory.set(ID, id);
  return id;
}

const nameKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
function codes(): Record<string, { name: string; code: string }> {
  try { return JSON.parse(read(CODES) ?? memory.get(CODES) ?? '{}'); } catch { return {}; }
}

/** The name this browser last played under, if it holds that name's code. */
export function getName(): string {
  const n = (read(NAME) ?? memory.get(NAME) ?? '').trim();
  return n && codes()[nameKey(n)] ? codes()[nameKey(n)].name : '';
}
/** The name typed last, whether or not it was confirmed (to prefill forms). */
export const lastTypedName = (): string => (read(NAME) ?? memory.get(NAME) ?? '').trim();
export const codeFor = (name: string): string | null => codes()[nameKey(name)]?.code ?? null;
export const formatCode = (code: string) => code.replace(/(.{4})(?=.)/g, '$1-');

function remember(name: string, code: string) {
  const all = codes();
  all[nameKey(name)] = { name, code };
  const s = JSON.stringify(all);
  write(CODES, s);
  memory.set(CODES, s);
  write(NAME, name);
  memory.set(NAME, name);
}

export type ClaimOutcome = { ok: true; name: string } | { ok: false; reason: string; message: string };

/** Use a name: claims it if it is free, or proves it is yours with the code this browser holds (or one typed in). */
export async function useName(name: string, typedCode?: string): Promise<ClaimOutcome> {
  const code = typedCode ?? codeFor(name) ?? undefined;
  try {
    const res = await fetch('/api/names', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, code }) });
    const body = (await res.json()) as { name?: string; code?: string; error?: string; reason?: string };
    if (res.ok && body.name && body.code) {
      remember(body.name, body.code);
      return { ok: true, name: body.name };
    }
    write(NAME, name.trim());
    return { ok: false, reason: body.reason ?? 'error', message: body.error ?? 'That name could not be used.' };
  } catch {
    return { ok: false, reason: 'offline', message: 'Could not reach the site. Check your connection and try again.' };
  }
}
