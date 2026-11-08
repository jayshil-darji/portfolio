"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useBuildActive } from "@/components/experimental/agent-cursor/build-state";
import {
  agentBuildAttrs,
  type AgentBuildType,
} from "@/components/experimental/agent-cursor/config";
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
  build,
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
  /** EXPERIMENT (agent-cursor): mark as a build unit (no-op when off). */
  build?: AgentBuildType;
}) {
  const reduced = usePrefersReducedMotion();
  // EXPERIMENT (agent-cursor): inside the build, the build reveals it. The
  // signal arrives after hydration, when motion has already applied
  // `initial` — so snap to the final values explicitly (animate, 0s).
  const buildActive = useBuildActive();
  const still = reduced || buildActive;
  const shown = { opacity: 1, x: 0, y: 0 };
  return (
    <motion.div
      {...(build ? agentBuildAttrs(build) : {})}
      className={className}
      initial={reduced ? false : { opacity: 0, x, y }}
      animate={buildActive ? shown : undefined}
      whileInView={buildActive ? undefined : shown}
      viewport={{ once: true, amount }}
      transition={{
        duration: still ? 0 : 0.8,
        delay: still ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
