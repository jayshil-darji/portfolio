"use client";

import {
  BookOpen,
  Compass,
  Hammer,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion, type Variants } from "motion/react";
import { BorderBeam } from "@/components/ui/border-beam";
import type { CurrentlyItem } from "@/data/profile";

// Decorative icon per label; unknown labels fall back to Sparkles.
const ICONS: Record<string, LucideIcon> = {
  learning: BookOpen,
  exploring: Compass,
  building: Hammer,
};

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Staggered-entrance cards. Hover: lift, brighter border, glow and a
 * Vengeance UI BorderBeam tracing the edge (its animation only runs while
 * hovered). Reduced motion: no lift/beam; cards fade in only.
 */
export function CurrentlyCards({ items }: { items: CurrentlyItem[] }) {
  return (
    <motion.ul
      className="grid gap-4 sm:grid-cols-3"
      variants={list}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      {items.map((item) => {
        const Icon = ICONS[item.label.toLowerCase()] ?? Sparkles;
        return (
          <motion.li key={item.label} variants={card}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-[translate,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_10px_40px_-10px_oklch(0.6_0.15_240/0.35)] motion-reduce:hover:translate-y-0 sm:p-6">
              <BorderBeam
                size={90}
                duration={6}
                borderWidth={1.5}
                colorFrom="#22d3ee"
                colorTo="#8b5cf6"
                className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 after:[animation-play-state:paused] group-hover:after:[animation-play-state:running]"
              />

              <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  <span className="relative flex size-2">
                    <span className="live-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                  </span>
                  {item.label}
                </span>
                <Icon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-sky-300"
                />
              </div>

              <p className="text-base leading-snug text-foreground/90 sm:text-lg">
                {item.href ? (
                  <a
                    href={item.href}
                    className="underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.text}
                  </a>
                ) : (
                  item.text
                )}
              </p>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
