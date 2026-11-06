"use client";

/**
 * Vengeance UI — Solar System
 * https://www.vengenceui.com/components/solar-system
 *
 * SOURCE: github.com/Ashutoshx7/VengeanceUI src/components/ui/solar-system.tsx
 * at commit 3be420d (PR #46, 2026-07-06), copied manually.
 *
 * LOCAL PATCH (install): not installable via shadcn — the documented
 * `public/r/solar-system.json` returns 404 on every branch and the item is
 * absent from the registry index. The docs also describe `title`,
 * `description`, `item.code`, an "editor sidebar" and ring "filter options"
 * that the published source does not implement; those are built locally in
 * `src/components/skills/` (not part of this file).
 *
 * LOCAL PATCHES (behaviour) — summary, details inline:
 *  1. CSS moved from an injected <style> (re-sent every render, set
 *     --radius-* on :root) to src/styles/solar-system.css, scoped + prefixed.
 *  2. Radii scale continuously from `radiusPx` with the container width
 *     (container-query units) instead of three fixed :root breakpoints;
 *     `radiusClass` is no longer used.
 *  3. Planets are <button>s (keyboard-focusable, aria-pressed, visible focus,
 *     screen-reader label incl. ring) instead of mouse-only <div>s.
 *     Selection is controlled via `selectedId` / `onSelectItem`.
 *  4. Pauses when off-screen (IntersectionObserver), when the tab is hidden,
 *     and while a planet is hovered/focused (easier to click).
 *  5. prefers-reduced-motion: static distributed layout, still clickable.
 *  6. Per-ring `direction` and `variant: "muted"`; filter highlight via
 *     `highlightIds` (non-matching planets recede; rings holding a match
 *     light up); staggered entrance when scrolled into view.
 *  7. Removed DEFAULT_ORBITS / demo SVGs (dead weight) and the per-render
 *     hover state (hover/laser are pure CSS now → no re-renders).
 *  8. Cosmic-dust radii scale with the rings (were fixed px).
 */

import { useInView } from "motion/react";
import {
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface SolarSystemItem {
  id: string;
  label: string;
  /** Category tag (e.g. the ring name). Read out to screen readers. */
  type?: string;
  badge?: string;
  desc?: string;
  /** Brand colour for the glow / laser / focus highlight. */
  color: string;
  svg: ReactNode;
  /** Sample snippet (docs field; rendered by the consumer, not here). */
  code?: string;
}

export interface OrbitConfig {
  id: string;
  name: string;
  /** Ring radius in px at the design width (default 940px). */
  radiusPx: number;
  /** Seconds per revolution (before speedMultiplier). */
  speed: number;
  items: SolarSystemItem[];
  /** LOCAL PATCH: 1 = counter-clockwise (upstream), -1 = clockwise. */
  direction?: 1 | -1;
  /** LOCAL PATCH: "muted" = dashed ring, dimmer cards (e.g. "Learning"). */
  variant?: "default" | "muted";
  /** LOCAL PATCH: starting angle as a fraction of a turn (0–1). Staggers
   *  rings so their first planets don't line up — matters most for the
   *  static reduced-motion layout. */
  phase?: number;
  /** @deprecated LOCAL PATCH: ignored — radii derive from radiusPx. */
  radiusClass?: string;
}

export interface SolarSystemProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  orbits: OrbitConfig[];
  centerLogo?: ReactNode;
  centerLogoAlt?: string;
  isPaused?: boolean;
  speedMultiplier?: number;
  /** LOCAL PATCH: controlled selection. */
  selectedId?: string | null;
  onSelectItem?: (item: SolarSystemItem, orbit: OrbitConfig) => void;
  /** LOCAL PATCH: highlight these item ids, dim the rest (filter tabs). */
  highlightIds?: readonly string[] | null;
  /** LOCAL PATCH: width at which radiusPx is 1:1 (default 940). */
  designWidth?: number;
  /** LOCAL PATCH: ring-plane tilt in degrees (upstream: 65). */
  tilt?: number;
  /** LOCAL PATCH: CSS perspective in px (upstream: 1200). Larger = less
   *  near-side magnification, so the drawing stays inside its box. */
  perspective?: number;
  /** Accessible name for the whole system. */
  label?: string;
}

// Cosmic dust (decorative), radii in design px.
const DUST = [
  { delay: -4, r: 165, c: "#2dd4bf" },
  { delay: -11, r: 260, c: "#8b5cf6" },
  { delay: -19, r: 340, c: "#3b82f6" },
  { delay: -28, r: 395, c: "#2dd4bf" },
  { delay: -7, r: 200, c: "#60a5fa" },
  { delay: -15, r: 365, c: "#a78bfa" },
  { delay: -23, r: 430, c: "#8b5cf6" },
];

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}

const vars = (v: Record<string, string | number>) => v as CSSProperties;

export function SolarSystem({
  orbits,
  centerLogo,
  centerLogoAlt = "Core",
  isPaused = false,
  speedMultiplier = 1,
  selectedId = null,
  onSelectItem,
  highlightIds = null,
  designWidth = 940,
  tilt = 65,
  perspective = 1200,
  label = "Orbit diagram",
  className,
  style,
  ...props
}: SolarSystemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // LOCAL PATCH: pause off-screen; reveal once. Both start false on the
  // server and during hydration, so markup matches.
  const onScreen = useInView(rootRef, { margin: "120px 0px" });
  const revealed = useInView(rootRef, { once: true, amount: 0.25 });
  const tabHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "hidden",
    () => false,
  );
  const paused = isPaused || !onScreen || tabHidden;
  const maxRadius = Math.max(...orbits.map((o) => o.radiusPx));
  const highlight = highlightIds ? new Set(highlightIds) : null;

  return (
    <div className="ss-container">
      <div
        ref={rootRef}
        role="group"
        aria-label={label}
        className={cn("ss-root", className)}
        data-paused={paused}
        data-revealed={revealed}
        data-filtering={highlight ? "" : undefined}
        style={{
          ...vars({
            "--ss-design": designWidth,
            "--ss-design-px": `${designWidth}px`,
            "--ss-tilt": `${tilt}deg`,
            "--ss-perspective": `${perspective}px`,
            "--ss-maxr": maxRadius,
          }),
          ...style,
        }}
        {...props}
      >
        <div className="ss-stage">
          {/* Sun */}
          <div className="ss-sun" role="img" aria-label={centerLogoAlt}>
            <div className="ss-sun-ring ss-sun-ring--b" aria-hidden="true" />
            <div className="ss-sun-ring ss-sun-ring--a" aria-hidden="true" />
            <div className="ss-sun-aura" aria-hidden="true" />
            <div className="ss-sun-core" aria-hidden="true">
              {centerLogo}
            </div>
          </div>

          {/* Cosmic dust */}
          {DUST.map((d, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="ss-dust"
              style={vars({
                "--c": d.c,
                "--radius": `calc(${d.r} * var(--ss-unit))`,
                "--dur": `${24 / speedMultiplier}s`,
                "--delay": `${d.delay}s`,
              })}
            />
          ))}

          {/* Rings + planets */}
          {orbits.map((orbit, ringIndex) => {
            const dur = orbit.speed / speedMultiplier;
            return (
              <div
                key={orbit.id}
                role="group"
                aria-label={orbit.name}
                className="ss-ring"
                data-variant={orbit.variant ?? "default"}
                data-active={
                  highlight && orbit.items.some((it) => highlight.has(it.id))
                    ? ""
                    : undefined
                }
                style={vars({ "--r": orbit.radiusPx, "--i": ringIndex })}
              >
                <div className="ss-ring-line" aria-hidden="true" />

                {orbit.items.map((item, idx, arr) => {
                  // Distribute evenly: each planet starts at its own phase.
                  // Rounded so SSR and browser produce identical strings.
                  const turn = (orbit.phase ?? 0) + idx / arr.length;
                  const delay = Math.round(-dur * turn * 1000) / 1000;
                  const selected = selectedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="ss-orbiter"
                      data-highlight={highlight?.has(item.id) ? "" : undefined}
                      style={vars({
                        "--dur": `${dur}s`,
                        "--delay": `${delay}s`,
                        "--dir": orbit.direction === -1 ? "reverse" : "normal",
                        "--c": item.color,
                      })}
                    >
                      <div className="ss-laser" aria-hidden="true" />
                      <button
                        type="button"
                        className="ss-planet"
                        aria-pressed={selected}
                        onClick={() => onSelectItem?.(item, orbit)}
                      >
                        <span className="ss-face">
                          <span className="ss-icon" aria-hidden="true">
                            {item.svg}
                          </span>
                          {item.label}
                          {item.type && (
                            <span className="sr-only"> — {item.type}</span>
                          )}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SolarSystem;
