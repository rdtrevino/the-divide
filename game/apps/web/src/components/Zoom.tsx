// The full-size card preview. Any element with data-zoom="<card id>" shows it on hover (mouse)
// or on a long press (touch), so small cards on the table can always be read. Inside an element
// marked data-no-zoom (the Learn page's click-to-try demos) there is no preview, so it never covers
// the card you are about to click.
import { useEffect, useState } from 'preact/hooks';
import { Card } from './Card';
import { kindOf } from '../lib/cards';

interface Shown { id: string; x: number; y: number; w: number; note?: string }

export function Zoom() {
  const [shown, setShown] = useState<Shown | null>(null);
  useEffect(() => {
    let timer = 0;
    let current: Element | null = null;
    const zoomable = (t: EventTarget | null) => {
      const el = (t as Element | null)?.closest?.('[data-zoom]') ?? null;
      return el && !el.closest('[data-no-zoom]') ? el : null;
    };
    const place = (el: Element): Shown | null => {
      const id = el.getAttribute('data-zoom');
      if (!id) return null;
      const r = el.getBoundingClientRect();
      const event = kindOf(id) === 'event';
      const note = el.getAttribute('data-zoom-note') ?? undefined;
      // As large as the window allows (up to a comfortable reading size), always fully on screen.
      const room = window.innerHeight - 24 - (note ? 70 : 0);
      const w = Math.max(160, Math.min(event ? 560 : 400, window.innerWidth - 24, room / (event ? 0.714 : 1.4)));
      const h = event ? w * 0.714 : w * 1.4;
      const total = h + (note ? 70 : 0);
      // Cards in the lower half of the screen (your Celestial, Choir and hand) open above themselves, so the
      // magnified card never covers the cards beside it; it may cover the table above for a moment.
      const upW = Math.min(event ? 560 : 400, window.innerWidth - 24, (r.top - 20 - (note ? 70 : 0)) / (event ? 0.714 : 1.4));
      if (r.top > window.innerHeight / 2 && upW >= 240) {
        const uh = upW * (event ? 0.714 : 1.4) + (note ? 70 : 0);
        return { id, x: Math.min(Math.max(8, r.left + r.width / 2 - upW / 2), window.innerWidth - upW - 8), y: Math.max(8, r.top - uh - 10), w: upW, note };
      }
      // Beside the card if there is room, otherwise above or below it.
      let x = r.right + 14;
      if (x + w > window.innerWidth - 8) x = r.left - w - 14;
      if (x < 8) x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
      let y = r.top + r.height / 2 - total / 2;
      if (x < r.right && x + w > r.left) y = r.top - total - 12 > 8 ? r.top - total - 12 : r.bottom + 12;
      y = Math.min(Math.max(8, y), Math.max(8, window.innerHeight - total - 8));
      return { id, x, y, w, note };
    };
    const hide = () => { clearTimeout(timer); current = null; setShown(null); };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = zoomable(e.target);
      if (el === current) return;
      clearTimeout(timer);
      current = el;
      if (!el) { setShown(null); return; }
      // Slight delay so sweeping the mouse across the table does not flicker.
      timer = window.setTimeout(() => { if (current === el && el.isConnected) setShown(place(el)); }, 140);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') { hide(); return; }
      const el = zoomable(e.target);
      clearTimeout(timer);
      if (!el) { setShown(null); return; }
      timer = window.setTimeout(() => setShown(place(el)), 420);
    };
    const up = (e: PointerEvent) => { if (e.pointerType !== 'mouse') hide(); };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerdown', down);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('blur', hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('blur', hide);
    };
  }, []);
  if (!shown) return null;
  return (
    <div class="zoom" style={{ left: shown.x, top: shown.y, width: shown.w }}>
      <Card id={shown.id} w={shown.w} zoom={false} />
      {shown.note && <div class="zoom-note">{shown.note}</div>}
    </div>
  );
}
