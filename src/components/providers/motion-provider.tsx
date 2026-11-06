"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Global Framer Motion config. `reducedMotion="user"` makes every motion
 * component honour the OS `prefers-reduced-motion` setting automatically
 * (transform/layout animations are disabled; opacity still animates).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
