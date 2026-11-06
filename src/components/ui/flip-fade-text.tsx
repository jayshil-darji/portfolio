"use client";

/*
 * Vengeance UI: @vengeanceui/flip-fade-text
 * Source: public/r/flip-fade-text.json @ 298075b.
 *
 * Words swap letter by letter: the old word's letters flip up and fade
 * out (staggered), then the new word's letters flip in from below.
 *
 * LOCAL PATCHES:
 *  1. framer-motion → motion/react (one runtime; framer-motion uninstalled).
 *  2. Graphemes, not UTF-16 code units: upstream split("") tore combining
 *     marks (Indic vowel signs, emoji modifiers) off their base letters into
 *     separate inline-blocks. Intl.Segmenter keeps clusters whole.
 *     Spaces render as U+00A0 (a lone " " in an inline-block collapses).
 *  3. No layout shift: every word is rendered invisibly in the same grid
 *     cell, so the box is the largest word's from the first paint; the
 *     animated word overlays it. Upstream re-sized on every swap and had a
 *     fixed min-h-[200px] wrapper.
 *  4. SSR / first paint: AnimatePresence initial={false} — the first word is
 *     server-rendered fully visible (it's the hero LCP text); no flip on
 *     hydration.
 *  5. Looping: every `interval` ms the NEXT word plays — with a single word
 *     the same word re-animates (upstream's setInterval only changed the
 *     index, so one word never moved). The tick count is part of the key.
 *     Scheduling: `startDelay` before the first replay; optional `alignTo`
 *     (a document-timeline time, e.g. another animation's startTime) puts
 *     every tick on `alignTo + n·interval`, so two cycling effects can be
 *     phase-locked. Hidden tab: the tick is skipped, not queued.
 *  6. Styling: dropped the hard-coded text-4xl/uppercase/neutral colours
 *     and the per-letter gap (callers style via `textClassName`).
 *  7. Decorative: the animated letters are aria-hidden — callers must
 *     provide the accessible text (the hero <h1> has an sr-only name).
 *  8. `static`: no animation, first word only (reduced motion).
 */

import { AnimatePresence, motion, type Variants } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

/** Grapheme clusters; spaces → NBSP so inline-block cells keep their width. */
function graphemes(text: string) {
  const parts = segmenter
    ? Array.from(segmenter.segment(text), (s) => s.segment)
    : Array.from(text);
  return parts.map((c) => (c === " " ? " " : c));
}

export interface FlipFadeTextProps {
  /** Words to cycle through; one word = it replays on every tick. */
  words: string[];
  /** ms between flips. */
  interval?: number;
  /** LOCAL PATCH: ms before the first flip (default: `interval`). */
  startDelay?: number;
  /**
   * LOCAL PATCH: phase anchor (document-timeline ms, same clock as
   * performance.now()). Ticks land on anchor + n·interval. Called before
   * every tick, so it can track a live animation; null = no alignment.
   */
  alignTo?: () => number | null;
  /** LOCAL PATCH: no animation, first word only (reduced motion). */
  static?: boolean;
  className?: string;
  textClassName?: string;
  /** Seconds per letter. */
  letterDuration?: number;
  /** Seconds between letters entering. */
  staggerDelay?: number;
  /** Seconds between letters leaving. */
  exitStaggerDelay?: number;
}

const Letter = memo(function Letter({
  char,
  letterDuration,
}: {
  char: string;
  letterDuration: number;
}) {
  const variants: Variants = {
    initial: { rotateX: 90, y: "0.25em", opacity: 0, filter: "blur(8px)" },
    animate: {
      rotateX: 0,
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: letterDuration, ease: [0.2, 0.65, 0.3, 0.9] },
    },
    exit: {
      rotateX: -90,
      y: "-0.25em",
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: letterDuration * 0.67, ease: "easeIn" },
    },
  };
  return (
    <motion.span
      className="inline-block"
      style={{ transformStyle: "preserve-3d" }}
      variants={variants}
    >
      {char}
    </motion.span>
  );
});

export function FlipFadeText({
  words,
  interval = 2500,
  startDelay,
  alignTo,
  static: isStatic = false,
  className,
  textClassName,
  letterDuration = 0.6,
  staggerDelay = 0.1,
  exitStaggerDelay = 0.05,
}: FlipFadeTextProps) {
  const [tick, setTick] = useState(0);
  // Latest anchor without re-arming the timer on every render.
  const alignRef = useRef(alignTo);
  useEffect(() => {
    alignRef.current = alignTo;
  });

  useEffect(() => {
    if (isStatic) return;
    let timer: number | undefined;
    /** Wait ≥ minDelay, then (if anchored) until the next anchor + n·interval. */
    const schedule = (minDelay: number) => {
      const earliest = performance.now() + minDelay;
      const anchor = alignRef.current?.() ?? null;
      const behind =
        anchor === null
          ? 0
          : (((earliest - anchor) % interval) + interval) % interval;
      const wait = minDelay + (behind === 0 ? 0 : interval - behind);
      timer = window.setTimeout(() => {
        if (!document.hidden) setTick((t) => t + 1);
        // Anchored: half an interval, then snap to the grid (= exactly one
        // interval, without drift). Unanchored: one interval.
        schedule(alignRef.current ? interval / 2 : interval);
      }, wait);
    };
    schedule(startDelay ?? interval);
    return () => window.clearTimeout(timer);
  }, [isStatic, interval, startDelay]);

  const index = isStatic ? 0 : tick % words.length;
  const word = words[index];

  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid", className)}
      style={{ perspective: "1000px" }}
    >
      {/* Sizers: reserve the largest word's box (no shift on swap). */}
      {words.map((w, i) => (
        <span
          key={`sizer-${i}`}
          className={cn(
            "invisible flex whitespace-nowrap [grid-area:1/1]",
            textClassName,
          )}
        >
          {graphemes(w).map((c, j) => (
            <span key={j} className="inline-block">
              {c}
            </span>
          ))}
        </span>
      ))}

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={tick}
          className={cn(
            "flex justify-center whitespace-nowrap [grid-area:1/1]",
            textClassName,
          )}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={{
            initial: {},
            animate: { transition: { staggerChildren: staggerDelay } },
            exit: { transition: { staggerChildren: exitStaggerDelay } },
          }}
        >
          {graphemes(word).map((c, j) => (
            <Letter key={j} char={c} letterDuration={letterDuration} />
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default FlipFadeText;
