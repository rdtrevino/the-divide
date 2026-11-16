// A very small router: paths map to pages, links use the History API.
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';

const listeners = new Set<() => void>();
export function go(path: string, replace = false) {
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

export function usePath(): string {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const on = () => setPath(location.pathname);
    listeners.add(on);
    window.addEventListener('popstate', on);
    return () => { listeners.delete(on); window.removeEventListener('popstate', on); };
  }, []);
  return path;
}

export function Link(p: { href: string; class?: string; children: ComponentChildren; title?: string }) {
  return (
    <a
      href={p.href}
      class={p.class}
      title={p.title}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(p.href);
      }}
    >
      {p.children}
    </a>
  );
}
