"use client";

/*
 * Vengeance UI: @vengeanceui/ascii-glitch-ripple
 * Source: public/r/ascii-glitch-ripple.json @ 298075b (fetched via jsDelivr —
 * raw.githubusercontent.com was unreachable, so the shadcn CLI couldn't run).
 * The wave algorithm (calcWaveEffect / timings / charset) is upstream's.
 *
 * LOCAL PATCHES:
 *  1. SSR renders the real text. Upstream rendered an EMPTY element and
 *     injected the text with `textContent` after hydration (blank heading in
 *     the HTML, pop-in, React-owned node overwritten).
 *  2. Screen readers always get the real text: it stays in the DOM; the
 *     scramble is drawn in an aria-hidden overlay. (Upstream rewrote the
 *     real text node, so assistive tech could read "╬▓░…".)
 *  3. Zero layout shift: the real text keeps occupying its space (made
 *     transparent while scrambling) and each overlay glyph is pinned to the
 *     measured box of the character it replaces, clipped to that box — so
 *     fallback glyphs with different widths/heights can't move anything.
 *     (Upstream only locked the width.)
 *  4. `triggerOnView`: one automatic ripple when scrolled into view.
 *  5. prefers-reduced-motion: no scrambling at all.
 *  6. Removed `select-none` + `cursor-pointer` (text must stay selectable;
 *     a pointer cursor on non-links implies a click that does nothing) and
 *     the meaningless `as` class toggle.
 */

import {
  useEffect,
  useRef,
  type ElementType,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// Constants for wave animation behavior (upstream)
const WAVE_THRESH = 3;
const CHAR_MULT = 3;
const ANIM_STEP = 40;
const WAVE_BUF = 5;

const DEFAULT_CHARS =
  '.,·-─~+:;=*π""┐┌┘┴┬╗╔╝╚╬╠╣╩╦║░▒▓█▄▀▌▐■!?&#$@0123456789*';

export interface AsciiGlitchRippleProps extends HTMLAttributes<HTMLElement> {
  /** The text to display and animate. */
  children: string;
  /**
   * Element to render as. Upstream default is "a" — pass a semantic element
   * (h2, span, …) when it isn't a link.
   */
  as?: ElementType;
  className?: string;
  /** Duration of each ripple wave in ms. */
  dur?: number;
  /** Characters the wave scrambles through. */
  chars?: string;
  /** Keep spaces as spaces. */
  preserveSpaces?: boolean;
  /** Spread of the ripple wave; larger = wider. */
  spread?: number;
  /**
   * LOCAL PATCH: ripple once automatically when this fraction (0–1) of the
   * element first becomes visible. `true` = 0.6.
   */
  triggerOnView?: boolean | number;
  /** Extra attributes (e.g. href when rendered as "a"). */
  [key: string]: unknown;
}

type Wave = { startPos: number; startTime: number };

// Only called from event handlers / observers (client-only), never render.
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function AsciiGlitchRipple({
  children,
  as: Component = "a",
  className,
  dur = 1000,
  chars = DEFAULT_CHARS,
  preserveSpaces = true,
  spread = 1.0,
  triggerOnView = false,
  ...props
}: AsciiGlitchRippleProps) {
  const rootRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);

  // Latest options without re-binding listeners.
  const optsRef = useRef({ dur, chars, preserveSpaces, spread });
  useEffect(() => {
    optsRef.current = { dur, chars, preserveSpaces, spread };
  }, [dur, chars, preserveSpaces, spread]);

  useEffect(() => {
    const root = rootRef.current;
    const textEl = textRef.current;
    const overlay = overlayRef.current;
    if (!root || !textEl || !overlay) return;

    const origChars = children.split("");
    let waves: Wave[] = [];
    let cells: (HTMLSpanElement | null)[] = [];
    let animId: number | null = null;
    let cursorPos = 0;
    let hovering = false;

    /** Pin one overlay cell over each character's measured box. */
    const buildOverlay = () => {
      const node = textEl.firstChild;
      overlay.replaceChildren();
      cells = [];
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const base = root.getBoundingClientRect();
      const range = document.createRange();
      origChars.forEach((char, i) => {
        if (char === " " || char === "\n") {
          cells.push(null);
          return;
        }
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        const cell = document.createElement("span");
        cell.textContent = char;
        cell.style.cssText =
          `position:absolute;left:${r.left - base.left}px;top:${r.top - base.top}px;` +
          `width:${r.width}px;height:${r.height}px;line-height:${r.height}px;` +
          "text-align:center;overflow:hidden;white-space:pre";
        overlay.appendChild(cell);
        cells.push(cell);
      });
    };

    const calcWaveEffect = (charIdx: number, t: number) => {
      const { dur, chars, spread } = optsRef.current;
      let shouldAnim = false;
      let resultChar = origChars[charIdx];
      for (const w of waves) {
        const age = t - w.startTime;
        const prog = Math.min(age / dur, 1);
        const dist = Math.abs(charIdx - w.startPos);
        const maxDist = Math.max(w.startPos, origChars.length - w.startPos - 1);
        const rad = (prog * (maxDist + WAVE_BUF)) / spread;
        if (dist <= rad) {
          shouldAnim = true;
          const intens = Math.max(0, rad - dist);
          if (intens <= WAVE_THRESH && intens > 0) {
            const index =
              (dist * CHAR_MULT + Math.floor(age / ANIM_STEP)) % chars.length;
            resultChar = chars[index];
          }
        }
      }
      return shouldAnim ? resultChar : origChars[charIdx];
    };

    const stop = () => {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      waves = [];
      overlay.replaceChildren();
      cells = [];
      delete root.dataset.scrambling;
    };

    const frame = () => {
      const t = Date.now();
      waves = waves.filter((w) => t - w.startTime < optsRef.current.dur);
      if (waves.length === 0) return stop();
      const { preserveSpaces } = optsRef.current;
      origChars.forEach((char, i) => {
        const cell = cells[i];
        if (!cell || (preserveSpaces && char === " ")) return;
        const next = calcWaveEffect(i, t);
        if (cell.textContent !== next) cell.textContent = next;
      });
      animId = requestAnimationFrame(frame);
    };

    const startWave = (pos: number) => {
      if (prefersReducedMotion()) return; // LOCAL PATCH: no scramble
      waves.push({ startPos: pos, startTime: Date.now() });
      if (animId === null) {
        buildOverlay();
        root.dataset.scrambling = "";
        animId = requestAnimationFrame(frame);
      }
    };

    const posFromEvent = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const len = origChars.length;
      const pos = Math.round(((e.clientX - rect.left) / rect.width) * len);
      return Math.max(0, Math.min(pos, len - 1));
    };

    const onEnter = (e: MouseEvent) => {
      hovering = true;
      cursorPos = posFromEvent(e);
      startWave(cursorPos);
    };
    const onMove = (e: MouseEvent) => {
      if (!hovering) return;
      const pos = posFromEvent(e);
      if (pos !== cursorPos) {
        cursorPos = pos;
        startWave(pos);
      }
    };
    const onLeave = () => {
      hovering = false;
    };

    root.addEventListener("mouseenter", onEnter);
    root.addEventListener("mousemove", onMove);
    root.addEventListener("mouseleave", onLeave);

    let io: IntersectionObserver | null = null;
    if (triggerOnView) {
      const threshold = triggerOnView === true ? 0.6 : triggerOnView;
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            io?.disconnect();
            startWave(0); // sweep from the start of the text
          }
        },
        { threshold },
      );
      io.observe(root);
    }

    return () => {
      root.removeEventListener("mouseenter", onEnter);
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
      io?.disconnect();
      stop();
    };
  }, [children, triggerOnView]);

  return (
    <Component
      ref={rootRef}
      className={cn("agr relative inline-block", className)}
      {...props}
    >
      <span ref={textRef} className="agr-text">
        {children}
      </span>
      <span
        ref={overlayRef}
        aria-hidden="true"
        className="agr-overlay pointer-events-none absolute inset-0"
      />
    </Component>
  );
}

export default AsciiGlitchRipple;
