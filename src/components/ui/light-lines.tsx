"use client";

/*
 * Vengeance UI: @vengeanceui/light-lines
 * Source: public/r/light-lines.json @ 298075b.
 *
 * Thin vertical lines with short light streaks travelling along them.
 *
 * LOCAL PATCHES:
 *  1. CSS keyframes (styles/vengeance.css) replace the requestAnimationFrame
 *     loop that set style.transform on 17 paths every frame — and kept
 *     scheduling frames even while off-screen. Compositor-only now.
 *  2. Hydration / determinism: durations and start offsets were
 *     Math.random() → fixed per-light values (slower: 15–29s, calmer).
 *  3. Paused off-screen and while the tab is hidden (`data-paused`).
 *  4. prefers-reduced-motion: static streaks (CSS).
 *  5. Colours: theme tokens via CSS (`--ll-line`, `--ll-light`), no
 *     hard-coded blue gradient background (transparent; the section's
 *     dark background shows through). Props for raw colours dropped.
 *  6. SVG is full-width (`w-full`) — upstream sized it from its height, so
 *     a short, wide band left the sides empty. Decorative: aria-hidden.
 *  7. Line / light geometry moved into data arrays (same values).
 */

import { useInView } from "motion/react";
import { useRef, type CSSProperties } from "react";
import { usePageVisible } from "@/hooks/use-page-visible";
import { cn } from "@/lib/utils";

/** [x, width] of each static line (viewBox units, 1920×1080). */
const LINES: [number, number][] = [
  [1253.6, 4.5],
  [873.3, 1.8],
  [1100, 1.8],
  [1547.1, 4.5],
  [615, 4.5],
  [684.6, 1.8],
  [1369.4, 1.8],
  [1310.2, 0.9],
  [1233.4, 0.9],
  [124.2, 0.9],
  [1818.4, 4.5],
  [70.3, 4.5],
  [1618.6, 1.8],
  [455.9, 1.8],
  [328.7, 1.8],
  [300.8, 4.6],
  [1666.4, 0.9],
];

/** Light streaks: path, direction (up = bottom→top), duration in s. */
const LIGHTS: { d: string; up: boolean; s: number }[] = [
  {
    d: "M619.5,298.4H615v19.5h4.5V298.4z M619.5,674.8H615v9.8h4.5V674.8z M619.5,135.1H615v5.6h4.5V135.1z M619.5,55.5H615v68.7h4.5V55.5z",
    up: true,
    s: 19,
  },
  {
    d: "M1258.2,531.9h-4.5v8.1h4.5V531.9z M1258.2,497.9h-4.5v17.9h4.5V497.9z M1258.2,0h-4.5v25.3h4.5V0z M1258.2,252.2h-4.5v42.4h4.5V252.2z",
    up: true,
    s: 23,
  },
  {
    d: "M875.1,123.8h-1.8v4h1.8V123.8z M875.1,289.4h-1.8v24.1h1.8V289.4z M875.1,0h-1.8v31.4h1.8V0z M875.1,50.2h-1.8v11.5h1.8V50.2z",
    up: true,
    s: 17,
  },
  {
    d: "M1101.8,983.8h-1.8v8.2h1.8V983.8z M1101.8,1075.9h-1.8v4.1h1.8V1075.9z M1101.8,873.7h-1.8v4.2h1.8V873.7z M1101.8,851h-1.8v18.2h1.8V851z",
    up: false,
    s: 26,
  },
  {
    d: "M686.4,822.7h-1.8v3.8h1.8V822.7z M686.4,928.4h-1.8v23h1.8V928.4z M686.4,1043.8h-1.8v36.2h1.8V1043.8z",
    up: false,
    s: 21,
  },
  {
    d: "M1551.6,860.9h-4.4v-34.1h4.4V860.9z M1551.6,533.5h-4.4v-13.9h4.4V533.5z M1551.6,1080h-4.4v-89.1h4.4V1080z",
    up: false,
    s: 15,
  },
  {
    d: "M1311.1,707.7h-0.9V698h0.9V707.7z M1311.1,436.8h-0.9v-58.9h0.9V436.8z M1311.1,140.7h-0.9V48h0.9V140.7z",
    up: false,
    s: 28,
  },
  {
    d: "M125.1,514.5h-0.9v-9.7h0.9V514.5z M125.1,243.6h-0.9v-58.9h0.9V243.6z",
    up: false,
    s: 18,
  },
  {
    d: "M305.4,806.7h-4.6v-42.5h4.6V806.7z M305.4,398.5h-4.6v-17.3h4.6V398.5z M305.4,1080h-4.6V968.8h4.6V1080z",
    up: true,
    s: 24,
  },
  {
    d: "M1822.9,170.7h-4.5v13.7h4.5V170.7z M1822.9,435.1h-4.5v6.8h4.5V435.1z M1822.9,55.9h-4.5v4h4.5V55.9z M1822.9,0h-4.5v48.3h4.5V0z",
    up: true,
    s: 20,
  },
  {
    d: "M1666.4,331.5h0.9v9.7h-0.9V331.5z M1666.4,602.4h0.9v58.9h-0.9V602.4z M1666.4,898.5h0.9v92.7h-0.9V898.5z",
    up: false,
    s: 27,
  },
  {
    d: "M1620.4,200.7h-1.8v6.4h1.8V200.7z M1620.4,469.1h-1.8v39h1.8V469.1z M1620.4,0h-1.8v51h1.8V0z M1620.4,81.3h-1.8V100h1.8V81.3z",
    up: false,
    s: 16,
  },
  {
    d: "M74.8,201h-4.5v16.2h4.5V201z M74.8,512.3h-4.5v8.1h4.5V512.3z M74.8,65.8h-4.5v4.6h4.5V65.8z M74.8,0h-4.5v56.8h4.5V0z",
    up: false,
    s: 22,
  },
  {
    d: "M1371.2,655.3h-1.8v6.3h1.8V655.3z M1371.2,829.7h-1.8v37.9h1.8V829.7z M1371.2,1020.3h-1.8v59.7h1.8V1020.3z",
    up: false,
    s: 25,
  },
  {
    d: "M1234.3,898.1h-0.9v-4.9h0.9V898.1z M1234.3,762.5h-0.9v-29.5h0.9V762.5z M1234.3,614.4h-0.9v-46.4h0.9V614.4z",
    up: false,
    s: 18,
  },
  {
    d: "M457.7,1010.8h-1.8v-18.1h1.8V1010.8z M457.7,507.5h-1.8V398h1.8V507.5z",
    up: false,
    s: 29,
  },
  {
    d: "M330.5,170.7h-1.8v13.7h1.8V170.7z M330.5,435.1h-1.8v6.8h1.8V435.1z M330.5,55.9h-1.8v4h1.8V55.9z M330.5,0h-1.8v48.3h1.8V0z",
    up: true,
    s: 21,
  },
];

interface LightLinesProps {
  className?: string;
  /** Static lines opacity (0-1). */
  linesOpacity?: number;
  /** Light streaks opacity (0-1). */
  lightsOpacity?: number;
  /** Animation speed multiplier (> 1 = faster). */
  speedMultiplier?: number;
}

export function LightLines({
  className,
  linesOpacity = 0.05,
  lightsOpacity = 0.9,
  speedMultiplier = 1,
}: LightLinesProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Starts below the fold → initial false (useInView only updates on entry).
  const inView = useInView(ref, { initial: false });
  const visible = usePageVisible();

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-paused={!(inView && visible)}
      className={cn(
        "light-lines pointer-events-none overflow-hidden",
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
      >
        <g className="ll-lines" style={{ opacity: linesOpacity }}>
          {LINES.map(([x, width]) => (
            <rect key={x} x={x} width={width} height={1080} />
          ))}
        </g>
        <g className="ll-lights" style={{ opacity: lightsOpacity }}>
          {LIGHTS.map((light, i) => (
            <path
              key={i}
              className="ll-light"
              data-up={light.up}
              d={light.d}
              style={
                {
                  "--ll-dur": `${light.s / speedMultiplier}s`,
                  // Fixed phase so the streaks don't start in lockstep.
                  "--ll-delay": `${-((i * 7) % light.s)}s`,
                } as CSSProperties
              }
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default LightLines;
