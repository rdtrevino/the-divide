// Small labels for the numbers and badges on the table. Any element with data-tip="..." shows its label
// on hover (after a short pause, so sweeping the mouse across the table stays quiet) or keyboard focus.
// One short line, placed under the element, or above it in the lower half of the screen.
import { useEffect, useState } from 'preact/hooks';

interface Shown { text: string; x: number; y: number; above: boolean }

export function Tip() {
  const [shown, setShown] = useState<Shown | null>(null);
  useEffect(() => {
    let timer = 0;
    let current: Element | null = null;
    const place = (el: Element): Shown | null => {
      const text = el.getAttribute('data-tip');
      if (!text) return null;
      const r = el.getBoundingClientRect();
      const above = r.top > window.innerHeight * 0.55;
      return { text, x: r.left + r.width / 2, y: above ? r.top - 8 : r.bottom + 8, above };
    };
    const show = (el: Element | null, wait: number) => {
      if (el === current) return;
      clearTimeout(timer);
      current = el;
      if (!el) { setShown(null); return; }
      timer = window.setTimeout(() => { if (current === el && el.isConnected) setShown(place(el)); }, wait);
    };
    const over = (e: PointerEvent) => { if (e.pointerType === 'mouse') show((e.target as Element | null)?.closest?.('[data-tip]') ?? null, 350); };
    const focus = (e: FocusEvent) => show((e.target as Element | null)?.closest?.('[data-tip]') ?? null, 0);
    const hide = () => { clearTimeout(timer); current = null; setShown(null); };
    document.addEventListener('pointerover', over);
    document.addEventListener('focusin', focus);
    document.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, []);
  if (!shown) return null;
  return (
    <div class={`tip${shown.above ? ' above' : ''}`} role="tooltip" style={{ left: shown.x, top: shown.y }}>
      {shown.text}
    </div>
  );
}
