// The frame around every page that is not the game table.
import type { ComponentChildren } from 'preact';
import { Link, usePath } from '../lib/router';

export function Site(p: { children: ComponentChildren; wide?: boolean }) {
  const path = usePath();
  const on = (href: string) => (path === href || (href !== '/' && path.startsWith(href)) ? 'on' : '');
  return (
    <div class="site">
      <header class="site-nav">
        <Link href="/" class="wordmark">The Divide</Link>
        <nav>
          <Link href="/" class={on('/')}>Play</Link>
          <Link href="/cards" class={on('/cards')}>Cards</Link>
          <Link href="/rules" class={on('/rules')}>Rules</Link>
          <Link href="/stats" class={on('/stats')}>Stats</Link>
        </nav>
      </header>
      <main class="site-main" style={p.wide ? { maxWidth: 1500 } : undefined}>{p.children}</main>
      <footer class="site-foot">The Divide, a game of divine ambition by Robert Treviño</footer>
    </div>
  );
}
