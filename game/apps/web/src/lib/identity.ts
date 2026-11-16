// Who you are, without accounts: a random id kept in this browser (it holds your seat when you
// reconnect) and the name you typed (which is what the stats go by).
const ID = 'divide.client';
const NAME = 'divide.name';

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private browsing: the id lasts for this visit only */ }
}

let memoryId: string | null = null;
export function clientId(): string {
  let id = read(ID) ?? memoryId;
  if (!id || id.length < 8) {
    id = crypto.randomUUID?.() ?? `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    write(ID, id);
  }
  memoryId = id;
  return id;
}

export const getName = (): string => (read(NAME) ?? '').trim();
export const setName = (name: string) => write(NAME, name.trim().slice(0, 20));
