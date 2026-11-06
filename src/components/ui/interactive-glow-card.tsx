"use client";

import type { PointerEvent } from "react";
import {
  GlowBorderCard,
  type GlowBorderCardProps,
} from "@/components/ui/glow-border-card";
import { cn } from "@/lib/utils";

/** Glow ring in the brand accents (theme tokens). */
export const BRAND_GLOW = [
  "var(--brand-teal)",
  "var(--brand-blue)",
  "var(--brand-violet)",
  "var(--brand-blue)",
];

/**
 * GlowBorderCard + the shared card hover (Contact card, Experience cards):
 * - the conic glow ring rotates while hovered (`animate="hover"`; keyboard
 *   focus-within too);
 * - a soft radial highlight follows the mouse.
 * Mouse/desktop only: the highlight and hover rotation are gated on
 * `(hover: hover) and (pointer: fine)` and off under reduced motion
 * (`.igc*` in styles/vengeance.css). JS only writes two custom properties,
 * for mouse pointers.
 */
export function InteractiveGlowCard({
  children,
  className,
  contentClassName,
  gradientColors = BRAND_GLOW,
  ...props
}: GlowBorderCardProps) {
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    props.onPointerMove?.(e);
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };

  return (
    <GlowBorderCard
      width="100%"
      aspectRatio="auto"
      animate="hover"
      animationDuration={6}
      blurAmount="1em"
      gradientColors={gradientColors}
      {...props}
      className={cn("igc", className)}
      contentClassName={contentClassName}
      onPointerMove={onPointerMove}
    >
      <div
        aria-hidden="true"
        className="igc-spot pointer-events-none absolute inset-0"
      />
      <div className="relative">{children}</div>
    </GlowBorderCard>
  );
}
