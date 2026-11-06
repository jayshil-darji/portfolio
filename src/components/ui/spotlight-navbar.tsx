"use client";

/*
 * Vengeance UI: @vengeanceui/spotlight-navbar
 * Source: public/r/spotlight-navbar.json @ 298075b.
 *
 * Two light layers driven by CSS variables: a radial "spotlight" that
 * follows the pointer while hovering, and an "ambience" glow under the
 * active item that springs to it when the active item changes.
 *
 * LOCAL PATCHES:
 *  1. Controlled API: `activeIndex: number | null` (null = nothing active)
 *     + `onItemClick(item, index, event)`. `defaultActiveIndex` still works
 *     when `activeIndex` is omitted (backwards compatible).
 *  2. CSS moved out of a styled-jsx <style jsx> block and the Vengeance
 *     globals (classes spotlight-nav*, glass-border were not shipped with
 *     the registry item, and upstream defined them twice with conflicting
 *     values) → src/styles/vengeance.css.
 *  3. No React re-render per mousemove (upstream setState'd hoverX on every
 *     move); hover visibility is a data attribute. Removed the unused
 *     `isDark` state (setState-in-effect, never read).
 *  4. The spotlight also follows keyboard focus; aria-current="location"
 *     on the active link; <nav aria-label>.
 *  5. Modified clicks (cmd/ctrl/shift/middle) are left to the browser so
 *     "open in new tab" still works (upstream preventDefault'ed all).
 *  6. prefers-reduced-motion: the glow jumps instead of springing.
 *  7. Re-measures on resize / font load (ResizeObserver) — upstream's
 *     glow stayed at a stale x after layout changes.
 *  8. framer-motion → motion/react; removed the demo default items and the
 *     wrapper's `pt-10` page padding.
 */

import { animate, type AnimationPlaybackControls } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
}

export interface SpotlightNavbarProps<T extends NavItem = NavItem> {
  items: T[];
  className?: string;
  /** Accessible name for the <nav>. */
  ariaLabel?: string;
  /** LOCAL PATCH: controlled active item; null = none. */
  activeIndex?: number | null;
  /** Uncontrolled initial active item (upstream API). */
  defaultActiveIndex?: number | null;
  /**
   * Called on a plain left click (modified clicks open normally). Call
   * `event.preventDefault()` to handle navigation yourself.
   */
  onItemClick?: (
    item: T,
    index: number,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
}

const SPRING = { type: "spring", stiffness: 200, damping: 20 } as const;

export function SpotlightNavbar<T extends NavItem>({
  items,
  className,
  ariaLabel = "Primary",
  activeIndex: controlled,
  defaultActiveIndex = 0,
  onItemClick,
}: SpotlightNavbarProps<T>) {
  const navRef = useRef<HTMLElement>(null);
  const [uncontrolled, setUncontrolled] = useState<number | null>(
    defaultActiveIndex,
  );
  const isControlled = controlled !== undefined;
  const activeIndex = isControlled ? controlled : uncontrolled;
  const reduced = usePrefersReducedMotion();

  const spotlightX = useRef(0);
  const ambienceX = useRef<number | null>(null); // null = never positioned
  const spotlightAnim = useRef<AnimationPlaybackControls | null>(null);
  const ambienceAnim = useRef<AnimationPlaybackControls | null>(null);

  const centerOf = useCallback((index: number) => {
    const nav = navRef.current;
    const el = nav?.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!nav || !el) return null;
    const n = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return r.left - n.left + r.width / 2;
  }, []);

  /** Move a light layer to x (spring, or jump with reduced motion). */
  const moveTo = useCallback(
    (
      layer: "spotlight" | "ambience",
      x: number,
      { jump = false }: { jump?: boolean } = {},
    ) => {
      const nav = navRef.current;
      if (!nav) return;
      const ref = layer === "spotlight" ? spotlightX : ambienceX;
      const anim = layer === "spotlight" ? spotlightAnim : ambienceAnim;
      const prop = layer === "spotlight" ? "--spotlight-x" : "--ambience-x";
      anim.current?.stop();
      if (jump || reduced || ref.current === null) {
        ref.current = x;
        nav.style.setProperty(prop, `${x}px`);
        return;
      }
      anim.current = animate(ref.current, x, {
        ...SPRING,
        onUpdate: (v) => {
          ref.current = v;
          nav.style.setProperty(prop, `${v}px`);
        },
      });
    },
    [reduced],
  );

  // Ambience follows the active item; hidden when there is none.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (activeIndex === null || activeIndex < 0) {
      nav.dataset.hasActive = "false";
      return;
    }
    const x = centerOf(activeIndex);
    if (x === null) return;
    const wasHidden = nav.dataset.hasActive !== "true";
    nav.dataset.hasActive = "true";
    moveTo("ambience", x, { jump: wasHidden }); // appear in place, then glide
  }, [activeIndex, centerOf, moveTo]);

  // Keep the ambience aligned when the layout changes (resize, font load).
  // One observer for the component's lifetime, reading the active index
  // from a ref: re-creating it on every change made its initial callback
  // jump the glow and cancel the spring.
  const activeRef = useRef(activeIndex);
  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let lastWidth = nav.getBoundingClientRect().width;
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (Math.abs(width - lastWidth) < 0.5) return; // initial call / no change
      lastWidth = width;
      const index = activeRef.current;
      if (index === null || index < 0) return;
      const x = centerOf(index);
      if (x !== null) moveTo("ambience", x, { jump: true });
    });
    ro.observe(nav);
    return () => ro.disconnect();
  }, [centerOf, moveTo]);

  // Pointer spotlight (mouse/pen; no re-renders).
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const x = e.clientX - nav.getBoundingClientRect().left;
      spotlightAnim.current?.stop();
      spotlightX.current = x;
      nav.style.setProperty("--spotlight-x", `${x}px`);
      nav.dataset.spotlight = "on";
    };
    const onLeave = () => {
      // Stay lit on a keyboard-focused link; otherwise fade out over the
      // active item (upstream sprang back to it).
      const focused = nav.querySelector<HTMLElement>("a:focus-visible");
      if (focused) {
        moveTo("spotlight", centerOf(Number(focused.dataset.index)) ?? 0);
        return;
      }
      if (activeIndex !== null && activeIndex >= 0) {
        const x = centerOf(activeIndex);
        if (x !== null) moveTo("spotlight", x);
      }
      delete nav.dataset.spotlight;
    };
    nav.addEventListener("pointermove", onMove);
    nav.addEventListener("pointerleave", onLeave);
    return () => {
      nav.removeEventListener("pointermove", onMove);
      nav.removeEventListener("pointerleave", onLeave);
    };
  }, [activeIndex, centerOf, moveTo]);

  // LOCAL PATCH: keyboard focus drives the spotlight too.
  const onFocus =
    (index: number) => (e: React.FocusEvent<HTMLAnchorElement>) => {
      const nav = navRef.current;
      if (!nav || !e.currentTarget.matches(":focus-visible")) return;
      const x = centerOf(index);
      if (x === null) return;
      moveTo("spotlight", x, { jump: nav.dataset.spotlight !== "on" });
      nav.dataset.spotlight = "on";
    };
  const onBlur = () => {
    const nav = navRef.current;
    if (nav && !nav.matches(":hover")) delete nav.dataset.spotlight;
  };

  const handleClick =
    (item: T, index: number) => (e: MouseEvent<HTMLAnchorElement>) => {
      // LOCAL PATCH: let the browser handle new-tab / new-window clicks.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      if (!isControlled) {
        e.preventDefault();
        setUncontrolled(index);
      }
      onItemClick?.(item, index, e);
    };

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      data-has-active="false"
      className={cn(
        "spotlight-nav relative h-10 overflow-hidden rounded-full",
        className,
      )}
    >
      <ul className="relative z-10 flex h-full items-center gap-0 px-1.5">
        {items.map((item, idx) => {
          const active = activeIndex === idx;
          return (
            <li key={item.href} className="flex h-full items-center">
              <a
                href={item.href}
                data-index={idx}
                aria-current={active ? "location" : undefined}
                onClick={handleClick(item, idx)}
                onFocus={onFocus(idx)}
                onBlur={onBlur}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 lg:px-4",
                  "focus-visible:ring-2 focus-visible:ring-sky-300/60 focus-visible:outline-none focus-visible:ring-inset",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>

      {/* 1. Spotlight: follows the pointer / keyboard focus. */}
      <div aria-hidden="true" className="spotlight-nav-spotlight" />
      {/* 2. Ambience: glow line under the active item. */}
      <div aria-hidden="true" className="spotlight-nav-ambience" />
    </nav>
  );
}

export default SpotlightNavbar;
