// Fits the game board into the space between the top bar and the decision bar, so the whole table is
// always on one screen: no scrolling, nothing covered.
//
// Card sizes are worked out from the space that is really there. Your cards are --u wide, opponents'
// cards --uo. Every width and height on the board grows in a straight line with the card size, so two
// measurements give the exact size that fills the space:
//   1. Opponents: the largest --uo that fits their panels in one row.
//   2. You: two arrangements are tried, your hand beside your Choir ("row") or under it ("stack"), and
//      the one that allows larger cards wins.
//   3. Height: the largest --u whose board fits between the bars.
// If the board still does not fit (a very small window), it is scaled down as one unit. Spare height is
// shared out between the rows, so opponents sit at the top and your cards sit just above the decision bar.
//
// Phones (narrow windows) use the scrolling layout instead: a whole table on a phone would be too small to read.
import type { RefObject } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

export const PHONE_MAX = 760;
const U_MIN = 50;
const U_MAX = 180;
const UO_MIN = 40;
const UO_MAX = 120;
const UO_RATIO = 0.68; // opponents' cards, compared with yours
const UO_SIDE = 64; // below this, opponents' facts go above their cards

export interface FitRefs {
  stage: RefObject<HTMLElement>;
  wrap: RefObject<HTMLElement>;
  board: RefObject<HTMLElement>;
}

type Mode = 'row' | 'stack';
interface Fit { w: number; h: number; mode: Mode; u: number; uo: number; k: number }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The width a row needs: its children side by side, plus gaps and padding. */
function need(el: Element | null, skip?: (c: HTMLElement) => boolean): number {
  if (!el) return 0;
  const cs = getComputedStyle(el);
  const kids = [...el.children].filter((c) => !skip?.(c as HTMLElement)) as HTMLElement[];
  const gap = parseFloat(cs.columnGap) || 0;
  const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
  let sum = 0;
  for (const k of kids) {
    const m = getComputedStyle(k);
    // Only overlaps (negative margins) count: a positive margin here is an "auto" one that soaks up spare room.
    sum += k.offsetWidth + Math.min(0, parseFloat(m.marginLeft) || 0) + Math.min(0, parseFloat(m.marginRight) || 0);
  }
  return sum + Math.max(0, kids.length - 1) * gap + pad;
}

export function useFit(refs: FitRefs) {
  const [tick, setTick] = useState(0);
  const last = useRef<Fit | null>(null);

  useEffect(() => {
    const again = () => { last.current = null; setTick((t) => t + 1); };
    window.addEventListener('resize', again);
    const wrap = refs.wrap.current;
    const ro = typeof ResizeObserver !== 'undefined' && wrap ? new ResizeObserver(() => setTick((t) => t + 1)) : null;
    if (ro && wrap) ro.observe(wrap);
    return () => { window.removeEventListener('resize', again); ro?.disconnect(); };
  }, []);

  // Runs after every render: content changes (a bigger Altar, a new note) can change the space needed.
  useLayoutEffect(() => {
    const stage = refs.stage.current;
    const wrap = refs.wrap.current;
    const board = refs.board.current;
    if (!stage || !wrap || !board) return;
    if (window.innerWidth <= PHONE_MAX) {
      stage.classList.remove('fitted');
      for (const v of ['--u', '--uo']) stage.style.removeProperty(v);
      delete stage.dataset.mode;
      delete stage.dataset.opp;
      board.style.transform = '';
      board.style.minHeight = '';
      board.dataset.scale = '1';
      last.current = null;
      return;
    }
    stage.classList.add('fitted');
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    const opp = board.querySelector<HTMLElement>('.opponents');
    const mine = board.querySelector<HTMLElement>('.mine');
    const center = board.querySelector<HTMLElement>('.t-center');

    const set = (u: number, uo: number) => {
      stage.style.setProperty('--u', `${u.toFixed(1)}px`);
      stage.style.setProperty('--uo', `${uo.toFixed(1)}px`);
    };
    const natural = () => { board.style.minHeight = ''; return board.offsetHeight; };
    const sides = (el: Element) => { const cs = getComputedStyle(el); return parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth); };
    // Row: everything side by side. Stack: your hand on a row of its own under the rest.
    const mineNeed = () => {
      if (!mine) return 0;
      if (stage.dataset.mode !== 'stack') return need(mine);
      const hand = mine.querySelector('.mine-zone.hand .zone-row');
      const handW = hand ? Math.max(need(hand), parseFloat(getComputedStyle(hand).minWidth) || 0) : 0; // a short hand keeps room for 3
      return Math.max(need(mine, (c) => c.classList.contains('hand')), handW + sides(mine));
    };
    const wide = () => Math.max(mineNeed(), need(opp), need(center)); // (offset sizes: flying cards do not count)

    const finish = (f: Omit<Fit, 'k' | 'w' | 'h'>) => {
      stage.dataset.mode = f.mode;
      set(f.u, f.uo);
      board.style.transform = '';
      const h = natural();
      // (Not board.scrollWidth: cards flying in from the deck would count.)
      const k = Math.min(1, H / h, W / Math.max(1, wide()));
      if (k < 0.999) {
        board.style.transform = `scale(${k.toFixed(4)})`;
        board.dataset.scale = k.toFixed(4);
      } else {
        board.dataset.scale = '1';
        board.style.minHeight = `${H}px`; // share out the spare height
      }
      last.current = { ...f, w: W, h: H, k: k < 0.999 ? k : 1 };
    };

    // Nothing that matters changed: keep the current sizes if they still fit well.
    const prev = last.current;
    if (prev && prev.w === W && prev.h === H) {
      const h = natural();
      const fits = h <= H + 0.5 && wide() <= W + 0.5;
      const snug = h >= H * 0.92 || prev.u >= U_MAX - 0.5 || prev.k < 1;
      if (prev.k === 1 && fits && snug) { board.style.minHeight = `${H}px`; return; }
      if (prev.k < 1) { finish(prev); return; }
    }

    // 1. Opponents, always one row. With room to spare, each panel has its facts beside its cards ("side",
    //    which costs no extra height); when that would make their cards small, the facts go above ("top").
    let uo = UO_MAX;
    if (opp) {
      const widest = (layout: string) => {
        stage.dataset.opp = layout;
        set(100, 70);
        const a = need(opp);
        set(100, 45);
        const b = need(opp);
        const slope = (a - b) / 25;
        return clamp(slope > 0 ? 45 + (W * 0.995 - b) / slope : UO_MAX, UO_MIN, UO_MAX);
      };
      uo = widest('side');
      if (uo < UO_SIDE) {
        const top = widest('top');
        if (top > uo) uo = top;
        else stage.dataset.opp = 'side';
      }
    }
    const uoFor = (u: number) => Math.min(uo, u * UO_RATIO);

    // 2 and 3. Your cards, in each arrangement.
    const tryMode = (mode: Mode) => {
      stage.dataset.mode = mode;
      set(100, uoFor(100));
      const w1 = mineNeed();
      set(70, uoFor(70));
      const w2 = mineNeed();
      const ws = (w1 - w2) / 30;
      const uW = clamp(ws > 0 ? 70 + (W * 0.995 - w2) / ws : U_MAX, U_MIN, U_MAX);
      set(uW, uoFor(uW));
      let h = natural();
      let u = uW;
      if (h > H) {
        // Height grows in a straight line with u (with a kink where the opponents' cap starts): solve twice.
        for (let i = 0; i < 2 && h > H; i++) {
          const u2 = Math.max(U_MIN, u * 0.75);
          set(u2, uoFor(u2));
          const h2 = natural();
          const slope = (h - h2) / (u - u2);
          u = slope > 0 ? clamp(u2 + (H * 0.995 - h2) / slope, U_MIN, uW) : u2;
          set(u, uoFor(u));
          h = natural();
        }
      }
      // Rounding can leave a pixel or two over: one more small step settles it.
      const over = mineNeed();
      if (over > W) { u = Math.max(U_MIN, u * (W / over) - 0.5); set(u, uoFor(u)); }
      return { mode, u, uo: uoFor(u) };
    };
    const row = tryMode('row');
    const stack = tryMode('stack');
    // A tall, narrow space gives the hand its own row; otherwise keep everything in one row unless that
    // makes the cards clearly smaller.
    const best = stack.u > row.u * 1.1 ? stack : row;
    finish(best);
  });

  return tick;
}
