"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * Fades/slides its child in once when it scrolls into view, after `delay`.
 * Contact order: marquee band (slides in from the right) → left-column text
 * (staggered) → card (rises). Reduced motion: visible immediately.
 */
export function ContactReveal({
  children,
  delay = 0,
  x = 0,
  y = 16,
  amount = 0.5,
  className,
}: {
  children: ReactNode;
  delay?: number;
  /** Start offset in px (positive = from the right). */
  x?: number;
  /** Start offset in px (positive = from below). */
  y?: number;
  /** Fraction of the element that must be visible to trigger. */
  amount?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: reduced ? 0 : 0.8,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
