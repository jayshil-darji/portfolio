"use client";

/*
 * Wireframe + agent markup (lazy chunk). Static structure only: the
 * builder's rAF loop drives every visual state (draw-in, bar-by-bar
 * replacement, brighten/settle, fades) from the planner's samples.
 */

import { useMemo, type CSSProperties } from "react";
import { CURSOR_STYLE, SHOW_LABELS, type AgentBuildType } from "./config";
import { seeded } from "./seeded";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const r = Math.round;

/**
 * One element (page coordinates): neon outline + corner handles, two long
 * guide lines across its section (along its top edge and its left edge),
 * a placeholder (text → seeded skeleton bars, image → box with an X,
 * block → skeleton block) and a Figma-style size label ("336 × 268",
 * real measured px) under the box.
 */
export function Wire({
  box,
  section,
  color,
  type,
  seed,
}: {
  box: Box;
  section: Box;
  color: string;
  type: AgentBuildType;
  seed: string;
}) {
  const bars = useMemo(() => {
    const rand = seeded(seed);
    const n = 2 + (rand() < 0.5 ? 1 : 0);
    return Array.from({ length: n }, () => r(40 + rand() * 50));
  }, [seed]);

  return (
    <div
      className="acb-item"
      data-wire=""
      style={
        {
          "--acb-c": color,
          width: r(box.w),
          height: r(box.h),
          transform: `translate(${r(box.x)}px, ${r(box.y)}px)`,
        } as CSSProperties
      }
    >
      <span
        className="acb-guide acb-guide-x"
        style={{ left: r(section.x - box.x), width: r(section.w) }}
      />
      <span
        className="acb-guide acb-guide-y"
        style={{ top: r(section.y - box.y), height: r(section.h) }}
      />
      <div className="acb-skel" data-type={type}>
        {type === "text" &&
          bars.map((w, i) => (
            <span key={i} className="acb-bar" style={{ width: `${w}%` }} />
          ))}
        {type === "image" && (
          <svg
            className="acb-x"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <line x1="0" y1="0" x2="100" y2="100" />
            <line x1="100" y1="0" x2="0" y2="100" />
          </svg>
        )}
        {type === "block" && <span className="acb-block" />}
      </div>
      <div className="acb-outline">
        <span className="acb-line acb-h acb-top" />
        <span className="acb-line acb-h acb-bottom" />
        <span className="acb-line acb-v acb-left" />
        <span className="acb-line acb-v acb-right" />
        <span className="acb-handle" data-corner="tl" />
        <span className="acb-handle" data-corner="tr" />
        <span className="acb-handle" data-corner="bl" />
        <span className="acb-handle" data-corner="br" />
      </div>
      <span className="acb-size">
        {r(box.w)} × {r(box.h)}
      </span>
    </div>
  );
}

/**
 * Cursor glyphs (inline SVG, ~20–22px, the agent's colour). Each is placed
 * so its HOTSPOT — tip for pointer/arrow, centre for reticle/orb — sits at
 * the agent's origin: that's where it works and where ripples start.
 */
function Glyph() {
  switch (CURSOR_STYLE) {
    case "arrow":
      return (
        <svg
          viewBox="0 0 20 22"
          width="20"
          height="22"
          className="acb-glyph acb-glyph-arrow"
        >
          <path d="M2 2v16.5l4.6-4.3 3.1 6.6 3-1.4-3-6.4H16z" />
        </svg>
      );
    case "reticle":
      return (
        <svg
          viewBox="0 0 22 22"
          width="22"
          height="22"
          className="acb-glyph acb-glyph-reticle"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M11 1.5v3.5M11 17v3.5M1.5 11H5M17 11h3.5" />
          <circle cx="11" cy="11" r="1.6" className="acb-glyph-dot" />
        </svg>
      );
    case "orb":
      return (
        <svg
          viewBox="0 0 22 22"
          width="22"
          height="22"
          className="acb-glyph acb-glyph-orb"
        >
          <circle cx="11" cy="11" r="6" />
          <circle cx="11" cy="11" r="2.4" className="acb-glyph-core" />
        </svg>
      );
    default: // "pointer"
      return (
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          className="acb-glyph acb-glyph-pointer"
        >
          <path d="M4.2 3.1 19.6 9.5c1 .4.9 1.8-.1 2.1l-6.3 1.9c-.4.1-.7.4-.8.8l-2.1 6.2c-.3 1-1.7 1.1-2.1.1L2.9 4.4c-.4-.9.4-1.7 1.3-1.3Z" />
        </svg>
      );
  }
}

export function Agent({ index, color }: { index: number; color: string }) {
  return (
    <div
      className="acb-agent"
      data-style={CURSOR_STYLE}
      style={{ "--acb-c": color } as CSSProperties}
    >
      <div className="acb-agent-drift">
        <span className="acb-ring" />
        {CURSOR_STYLE === "orb" &&
          [0, 1, 2, 3].map((d) => (
            <span key={d} className="acb-trail" data-d={d} />
          ))}
        <div className="acb-agent-body">
          <Glyph />
        </div>
        {SHOW_LABELS && <span className="acb-pill">Agent-{index + 1}</span>}
      </div>
    </div>
  );
}

/** Cached handles to a wire's parts (queried once per mount). */
export interface WireParts {
  root: HTMLElement;
  h: HTMLElement[];
  v: HTMLElement[];
  handles: HTMLElement[];
  meta: HTMLElement[]; // guides + size label
  skel: HTMLElement;
  bars: HTMLElement[];
  outline: HTMLElement;
}

export function wireParts(root: HTMLElement): WireParts {
  const q = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));
  return {
    root,
    h: q(".acb-h"),
    v: q(".acb-v"),
    handles: q(".acb-handle"),
    meta: q(".acb-guide, .acb-size"),
    skel: root.querySelector<HTMLElement>(".acb-skel")!,
    bars: q(".acb-bar"),
    outline: root.querySelector<HTMLElement>(".acb-outline")!,
  };
}
