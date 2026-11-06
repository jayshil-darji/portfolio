"use client";

/*
 * Vengeance UI: @vengeanceui/staggered-grid
 * Source: public/r/staggered-grid.json @ 298075b — written from the
 * registry source, NOT via `shadcn add` (that would install gsap, which this
 * project doesn't use). REWRITTEN; the concept is kept: a grid whose
 * columns sit at staggered heights and rise in column by column, from the
 * middle column outwards.
 *
 * Upstream: a Codrops-style 7×5 wall of image tiles + a "Halcyon" title +
 * a hover-expand bento group + credits footer, animated by GSAP
 * ScrollTrigger (scroll-scrubbed), gated on `imagesloaded`, with icons
 * from `react-icons` — neither of the last two declared in the registry
 * item (broken install). It also toggled a class on document.body and read
 * window.innerHeight during setup.
 *
 * LOCAL PATCHES:
 *  1. Generic list: `items` + `renderItem` (a real <ul>/<li>), any count.
 *     Removed the image wall, title, bento group, credits and hard-coded
 *     GitHub/Slack/Twitter tiles.
 *  2. gsap / ScrollTrigger / imagesloaded / react-icons removed. Entrance
 *     = motion `whileInView` once (not scroll-scrubbed): each column rises
 *     with a delay by its distance from the middle column (upstream's
 *     ordering), rows add a small extra delay.
 *  3. Stagger offsets are static CSS (`.sg-item`, styles/vengeance.css),
 *     ≥768px only; single column below. Column count = `columns` prop,
 *     mirrored in CSS via --sg-cols (no getComputedStyle at runtime).
 *  4. Reduced motion: no entrance animation (instant), offsets kept.
 *  5. Hydration-safe: no window reads in render; markup is identical on
 *     server and client.
 */

import { motion, type Variants } from "motion/react";
import type { CSSProperties, Key, ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export interface StaggeredGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => Key;
  /** Columns from 768px up (single column below). */
  columns?: number;
  /** Vertical offset between neighbouring columns (any CSS length). */
  offset?: string;
  className?: string;
  itemClassName?: string;
  /** Accessible name for the list. */
  label?: string;
}

const item: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: ({ delay, instant }: { delay: number; instant: boolean }) => ({
    opacity: 1,
    y: 0,
    transition: instant
      ? { duration: 0 }
      : { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function StaggeredGrid<T>({
  items,
  renderItem,
  getKey,
  columns = 3,
  offset = "3rem",
  className,
  itemClassName,
  label,
}: StaggeredGridProps<T>) {
  const reduced = usePrefersReducedMotion();
  const middle = Math.floor(columns / 2);

  return (
    <motion.ul
      aria-label={label}
      className={cn("sg grid gap-4 md:gap-5", className)}
      style={{ "--sg-cols": columns, "--sg-offset": offset } as CSSProperties}
      initial={reduced ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      {items.map((it, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        // Middle column first, then outwards (upstream ordering).
        const delay = Math.abs(col - middle) * 0.15 + row * 0.1;
        return (
          <motion.li
            key={getKey(it, i)}
            className={cn("sg-item", itemClassName)}
            // Static stagger: distance from the middle column.
            style={{ "--sg-step": Math.abs(col - middle) } as CSSProperties}
            variants={item}
            custom={{ delay, instant: reduced }}
          >
            {renderItem(it, i)}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

export default StaggeredGrid;
