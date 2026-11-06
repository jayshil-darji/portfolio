"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MorphTextProps {
  /**
   * Array of words / phrases to cycle through.
   * @default ["CREATE", "DESIGN", "DEVELOP"]
   */
  words?: string[];
  /**
   * Duration (ms) each word is displayed before transitioning.
   * @default 3000
   */
  interval?: number;
  /**
   * Optional subtext rendered beneath the morphing word.
   */
  subtext?: string;
  /**
   * Font size passed as a CSS value (e.g. "clamp(3rem, 15vw, 10rem)").
   * Defaults to a fluid clamp that scales with the viewport.
   */
  fontSize?: string;
  /**
   * Font family. Defaults to `"Space Grotesk", sans-serif`.
   */
  fontFamily?: string;
  /** Extra CSS classes on the root wrapper. */
  className?: string;
  /** Extra CSS classes on the morphing text container. */
  textClassName?: string;
  /** Extra CSS classes on the subtext element. */
  subtextClassName?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MorphText({
  words = ["CREATE", "DESIGN", "DEVELOP"],
  interval = 3000,
  subtext,
  fontSize = "clamp(3rem, 15vw, 10rem)",
  // LOCAL PATCH: inherit the site font (upstream @import'ed Space Grotesk from
  // Google Fonts at runtime — render-blocking and bad for Lighthouse).
  fontFamily = "inherit",
  className,
  textClassName,
  subtextClassName,
}: MorphTextProps) {
  // Unique ID so multiple instances don't share filter IDs
  const uid = useId().replace(/:/g, "");
  const filterId = `morph-threshold-${uid}`;

  const totalDuration = (interval / 1000) * words.length; // seconds
  const wordDuration = interval / 1000;

  // LOCAL PATCH: keyframes generated from the word count. Upstream used
  // fixed percentages of the whole cycle (visible 15–35%, out by 50%),
  // tuned for ~2–3 words: with 4+ words neighbours overlapped for ~25% of
  // every slot (two phrases stacked = garbled). Each word owns 1/n of the
  // cycle and the change is a true CROSSFADE: a word morphs in over the
  // first 20% of its slot while the previous one morphs out over the same
  // window (its 100–120%). Opacities are complementary, so some text is
  // always visible (an earlier version blurred both out at once and the
  // threshold filter left the line blank). Steady state: 20–100% of a slot.
  const keyframesName = `morph-word-rotate-${uid}`;
  const slot = 100 / words.length;
  const pct = (f: number) => `${Math.min(100, +(slot * f).toFixed(3))}%`;
  const keyframes = `
    @keyframes ${keyframesName} {
      0% { opacity: 0; filter: blur(8px); transform: translate(-50%, -50%) scale(0.94); }
      ${pct(0.2)} { opacity: 1; filter: blur(0px); transform: translate(-50%, -50%) scale(1); }
      ${pct(1)} { opacity: 1; filter: blur(0px); transform: translate(-50%, -50%) scale(1); }
      ${pct(1.2)}, 100% { opacity: 0; filter: blur(8px); transform: translate(-50%, -50%) scale(1.04); }
    }`;

  // Build per-word keyframe + delay styles
  const wordStyles = words.map((_, i) => ({
    animationDelay: `${i * wordDuration}s`,
    animationDuration: `${totalDuration}s`,
  }));

  return (
    <div
      className={cn(
        "morph-text-root relative flex flex-col items-center",
        className,
      )}
    >
      {/* ── Threshold SVG filter (hidden) ─────────────────────────── */}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* ── Morphing word container ────────────────────────────────── */}
      <div
        className={cn(
          "morph-text-container relative select-none",
          textClassName,
        )}
        style={{
          fontSize,
          fontWeight: 700,
          filter: `url(#${filterId})`,
          fontFamily,
        }}
      >
        {/* word rotator */}
        <div
          className="morph-word-rotator relative flex items-center justify-center"
          // LOCAL PATCH: full container width (upstream min-width: 14ch let
          // long phrases spill past narrow screens). Callers size the font
          // so the longest phrase fits.
          style={{ height: "1.2em", width: "100%" }}
        >
          {words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="morph-word absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0,
                whiteSpace: "nowrap",
                animationName: keyframesName,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationFillMode: "both",
                ...wordStyles[i],
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* ── Optional subtext ──────────────────────────────────────── */}
      {subtext && (
        <p
          className={cn(
            "morph-subtext mt-8 uppercase tracking-[0.2em] text-[#888]",
            subtextClassName,
          )}
          style={{
            fontSize: "1.2rem",
            opacity: 0,
            animation: "morph-fade-up 1s ease-out 1s forwards",
            fontFamily,
          }}
        >
          {subtext}
        </p>
      )}

      {/* ── Scoped keyframes ──────────────────────────────────────── */}
      <style>{`
        ${keyframes}

        @keyframes morph-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default MorphText;
