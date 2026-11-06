"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  /** Section ids in page order. The first is treated as the "top" (→ null). */
  ids: readonly string[];
  /** Sticky header height in px (excluded from the detection band). */
  offset?: number;
  /** Detection band = from below the header down to this fraction of the viewport. */
  bandBottom?: number;
}

/**
 * Scroll-spy. Returns the id of the section currently in view, or null at
 * the top of the page (first id, e.g. the hero).
 *
 * - IntersectionObserver over a band just below the sticky header
 *   (`offset` → `bandBottom` of the viewport); the first section in page
 *   order intersecting the band wins.
 * - Bottom of the page: the last section wins once its bottom is in view
 *   (a short last section may never reach the band).
 * - `lockTo(id)`: for programmatic navigation — sets the active id now and
 *   ignores observer updates until the scroll settles (scrollend, or 150ms
 *   without scroll events, max 2s), so the indicator doesn't flicker
 *   through the sections in between.
 * Starts as null on the server and during hydration; the observer's first
 * callback (incl. loads with a #hash) sets the real value.
 */
export function useActiveSection({
  ids,
  offset = 56,
  bandBottom = 0.4,
}: Options) {
  const [active, setActive] = useState<string | null>(null);
  const intersecting = useRef(new Map<string, boolean>());
  const lastInView = useRef(false);
  const locked = useRef(false);
  const cancelLock = useRef<(() => void) | null>(null);

  const compute = useCallback(() => {
    let next: string | null = null;
    if (lastInView.current) next = ids[ids.length - 1];
    else next = ids.find((id) => intersecting.current.get(id)) ?? null;
    return next === ids[0] ? null : next;
  }, [ids]);

  const update = useCallback(() => {
    if (!locked.current) setActive(compute());
  }, [compute]);

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const band = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          intersecting.current.set(e.target.id, e.isIntersecting);
        update();
      },
      {
        rootMargin: `-${offset + 1}px 0px -${Math.round((1 - bandBottom) * 100)}% 0px`,
      },
    );
    els.forEach((el) => band.observe(el));

    const last = els[els.length - 1];
    const end = new IntersectionObserver(
      ([e]) => {
        const bottomVisible =
          e.isIntersecting &&
          e.boundingClientRect.bottom <=
            (e.rootBounds?.bottom ?? window.innerHeight) + 2;
        lastInView.current = bottomVisible;
        update();
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    end.observe(last);

    return () => {
      band.disconnect();
      end.disconnect();
      cancelLock.current?.();
    };
  }, [ids, offset, bandBottom, update]);

  const lockTo = useCallback(
    (id: string | null) => {
      cancelLock.current?.(); // a newer click supersedes an earlier lock
      setActive(id === ids[0] ? null : id);
      locked.current = true;
      let idle: number | undefined;
      const cleanup = () => {
        window.clearTimeout(idle);
        window.clearTimeout(max);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scrollend", release);
        cancelLock.current = null;
      };
      const release = () => {
        cleanup();
        locked.current = false;
        update();
      };
      const onScroll = () => {
        window.clearTimeout(idle);
        idle = window.setTimeout(release, 150);
      };
      const max = window.setTimeout(release, 2000);
      idle = window.setTimeout(release, 150); // already there → no scroll events
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scrollend", release, { once: true });
      cancelLock.current = cleanup;
    },
    [ids, update],
  );

  return { active, lockTo };
}
