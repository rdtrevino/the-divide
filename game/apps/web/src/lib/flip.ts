// Move animations. Every element with data-flip="<key>" glides from where it was before the last
// update to where it is now; a new element with data-flip-from="<css selector>" flies in from that
// element (a card leaving a hand, the deck), and other new elements fade in.
import type { RefObject } from 'preact';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';

const EASE = 'cubic-bezier(0.22, 0.8, 0.26, 1)';

export function useFlip(root: RefObject<HTMLElement>) {
  const rects = useRef<Map<string, DOMRect> | null>(null);
  const anims = useRef(new Map<string, Animation>());

  useEffect(() => {
    // After a resize every position is stale; skip one round rather than animate nonsense.
    const reset = () => { rects.current = null; };
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const nodes = [...el.querySelectorAll<HTMLElement>('[data-flip]')];
    // Measure true layout positions: stop our own animations first.
    for (const a of anims.current.values()) a.cancel();
    anims.current.clear();
    const prev = rects.current;
    const next = new Map<string, DOMRect>();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    for (const n of nodes) {
      const key = n.dataset.flip!;
      const r = n.getBoundingClientRect();
      next.set(key, r);
      if (!prev || reduce || !r.width) continue;
      let from = prev.get(key);
      let entering = false;
      if (!from) {
        entering = true;
        const sel = n.dataset.flipFrom;
        const origin = sel ? el.querySelector(sel) : null;
        if (origin) from = origin.getBoundingClientRect();
      }
      if (!from) {
        anims.current.set(key, n.animate([{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE }));
        continue;
      }
      const dx = from.left + from.width / 2 - (r.left + r.width / 2);
      const dy = from.top + from.height / 2 - (r.top + r.height / 2);
      const scale = entering ? Math.min(1, Math.max(0.35, from.height / r.height)) : from.width / r.width;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(scale - 1) < 0.02) continue;
      const dist = Math.hypot(dx, dy);
      anims.current.set(key, n.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: entering ? 0.3 : 1, zIndex: 60 }, { transform: 'none', opacity: 1, zIndex: 60 }],
        { duration: Math.min(720, 380 + dist * 0.5), easing: EASE },
      ));
    }
    rects.current = next;
  });
}
