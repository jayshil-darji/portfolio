"use client";

import { useInView } from "motion/react";
import { useRef, type CSSProperties } from "react";
import { usePageVisible } from "@/hooks/use-page-visible";
import { cn } from "@/lib/utils";

/** Theme accents, teal → blue → violet (looped). */
const THEME = ["var(--brand-teal)", "var(--brand-blue)", "var(--brand-violet)"];

export interface RotatingBorderProps {
  /**
   * Corner radius. Default "inherit": the ring is a child of the element it
   * frames, so it picks up that element's border-radius with no JS.
   */
  radius?: string;
  /** Ring thickness in px. */
  thickness?: number;
  /** Seconds per full rotation. */
  speed?: number;
  /** Starting angle in degrees (vary per instance → no synced wall). */
  startAngle?: number;
  /**
   * Conic colour stops, any CSS colours/vars. Plain colours are spaced
   * evenly and looped back to the first; stops with explicit positions
   * ("transparent 40deg") are used as given.
   */
  colors?: string[];
  /** Ring opacity (keep it low on large cards). */
  opacity?: number;
  /**
   * Offset from the parent's padding box. "-1px" lays the ring over a 1px
   * border (parents without overflow clipping); "0" (default) sits just
   * inside it, which also works inside overflow-hidden parents.
   */
  inset?: string;
  className?: string;
}

/**
 * Continuously rotating gradient border, placed INSIDE the element it
 * frames (which must be positioned). Absolutely positioned and
 * aria-hidden, so content never moves (no padding, no CLS).
 *
 * Technique (compositor-only): the outer span is masked to a `thickness`
 * ring (padding: content-box XOR border-box). Inside it, a square
 * conic-gradient — sized ≥ the frame's diagonal with container units — is
 * spun with a `transform: rotate` keyframe. Rotating a conic gradient about
 * its centre looks exactly like advancing its `from` angle, but runs on
 * the compositor: no per-frame style/paint on the main thread (an animated
 * @property angle measured ~30% lower fps at 4× CPU throttle).
 * No JS animation loop — JS only toggles `data-paused` (off-screen / tab
 * hidden). Reduced motion: static gradient (styles/vengeance.css).
 */
export function RotatingBorder({
  radius = "inherit",
  thickness = 1,
  speed = 7,
  startAngle = 0,
  colors = THEME,
  opacity = 1,
  inset = "0",
  className,
}: RotatingBorderProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // false until observed: off-screen rings never start animating.
  const inView = useInView(ref, { initial: false });
  const visible = usePageVisible();

  const positioned = /\d(deg|%|turn|rad)\s*$/.test(colors[colors.length - 1]);
  const stops = positioned ? colors : [...colors, colors[0]];

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-paused={!(inView && visible)}
      className={cn("rotating-border", className)}
      style={{
        inset,
        borderRadius: radius,
        padding: `${thickness}px`,
        opacity,
      }}
    >
      <span
        className="rotating-border-spin"
        style={
          {
            animationDuration: `${speed}s`,
            backgroundImage: `conic-gradient(from ${startAngle}deg, ${stops.join(", ")})`,
          } as CSSProperties
        }
      />
    </span>
  );
}

export default RotatingBorder;
