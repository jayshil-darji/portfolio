"use client";

// Vengeance UI: @vengeanceui/stats-counter — upstream unchanged as of
// 298075b. LOCAL PATCHES: motion/react import; vertical-only in-view margin;
// reduced motion; screen-reader value; `delay` (stagger); width-stable box.

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface StatsCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  /** LOCAL PATCH: seconds to wait after entering view (for staggering). */
  delay?: number;
}

export default function StatsCounter({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  delay = 0,
}: StatsCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // LOCAL PATCH: vertical-only margin. Upstream's "-100px" shrank the
  // viewport on all four sides, so a narrow counter near the left edge of a
  // 375px screen never counted as in view and stayed at 0.
  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [displayValue, setDisplayValue] = useState(0);
  // LOCAL PATCH: reduced motion shows the final value, no count-up.
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    // LOCAL PATCH: optional stagger. once:true above → counts only once.
    const id = window.setTimeout(() => motionValue.set(value), delay * 1000);
    return () => window.clearTimeout(id);
  }, [isInView, value, motionValue, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [springValue]);

  // LOCAL PATCH: odometer cells — one span per integer digit position of
  // the final value, always present. Leading positions hold an invisible
  // "0", so the box is final-width and no text node ever moves while
  // counting (zero layout shift). A U+2007 figure-space pad was tried: Geist
  // lacks the glyph and its fallback was 2px wider than a tabular digit.
  const finalText = value.toFixed(decimals);
  const current = (reduced ? value : displayValue).toFixed(decimals);
  const finalInt = finalText.split(".")[0];
  const [curInt, curFrac] = current.split(".");
  const leading = Math.max(0, finalInt.length - curInt.length);
  const digits = curInt.padStart(finalInt.length, "0").split("");

  return (
    // LOCAL PATCH: the real value is always in the DOM for screen readers and
    // crawlers (SSR renders the counter at 0); the animated digits are
    // aria-hidden so the count-up isn't announced. An invisible copy of the
    // final value shares the same grid cell, so the box is final-width from
    // the first frame — no reflow when "9" becomes "10". (Grid, not absolute
    // positioning, so `bg-clip-text` gradients on className still apply.)
    <span
      ref={ref}
      className={cn("inline-grid justify-items-start tabular-nums", className)}
    >
      <span className="sr-only">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </span>
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </span>
      <span aria-hidden="true" className="[grid-area:1/1]">
        {prefix}
        {digits.map((d, i) => (
          <span key={i} className={i < leading ? "invisible" : undefined}>
            {d}
          </span>
        ))}
        {curFrac !== undefined && `.${curFrac}`}
        {suffix}
      </span>
    </span>
  );
}
