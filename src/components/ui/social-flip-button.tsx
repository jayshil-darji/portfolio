/*
 * Vengeance UI: @vengeanceui/social-flip-button
 * Source: public/r/social-flip-button.json @ 298075b.
 *
 * Hovering the group flips every tile (staggered) from a letter to its
 * icon; a small tooltip names the hovered tile.
 *
 * LOCAL PATCHES:
 *  1. Dropped `react-icons` — imported upstream but NOT declared in the
 *     registry item (broken install). Icons are passed in by the caller.
 *  2. Semantics: <ul> of real links (or <button> without href) with an
 *     aria-label each; letter/icon/tooltip are aria-hidden (upstream's
 *     accessible names were built from the letter + tooltip text). External
 *     links get target/rel; mailto: opens normally (upstream forced
 *     target="_blank" on every link).
 *  3. Keyboard: focus flips the tiles too (:focus-within), tooltip shows on
 *     :focus-visible. Upstream was mouse-only.
 *  4. CSS-only (styles/vengeance.css): flip, stagger, tooltip and border
 *     sweep — no framer-motion, no React state, no unused `isDark` effect.
 *  5. Theme tokens instead of hard-coded neutral/black/white; 44px tiles.
 *     Per-tile brand colour via `color` / `glow` → CSS vars --brand /
 *     --brand-glow-mix (one rule set for all tiles; see vengeance.css).
 *  6. Touch (hover: none): tiles rest on the icon side.
 *  7. prefers-reduced-motion: no flip — icon face only; hover/focus changes
 *     colour/opacity.
 *  9. The frame's border sweep is the shared RotatingBorder (two opposite
 *     highlights circling clockwise) instead of two ::before/::after
 *     strips; the frame is a <div> wrapping the ring + the <ul> (a span
 *     can't be a <ul> child). `className` goes on the frame;
 *     `borderStartAngle` de-syncs instances.
 *  8. `letter` is optional: without it the front face shows the icon too
 *     (neutral), and the flip reveals the brand-coloured back. Upstream's
 *     letter-only front meant pointer devices (hover: hover) showed "G" /
 *     "in" / "@" at rest — the icon only appeared after hovering.
 */

import type { CSSProperties, ReactNode } from "react";
import { RotatingBorder } from "@/components/ui/rotating-border";
import { cn } from "@/lib/utils";

/** Two opposite highlights (the original top/bottom sweep colour). */
const SWEEP = "color-mix(in oklch, var(--brand-blue) 80%, white)";
const SWEEP_STOPS = [
  "transparent 0deg",
  `${SWEEP} 22deg`,
  "transparent 44deg",
  "transparent 180deg",
  `${SWEEP} 202deg`,
  "transparent 224deg",
  "transparent 360deg",
];

export interface SocialItem {
  /**
   * Front face (e.g. a letter or short monogram). LOCAL PATCH: optional —
   * omitted → the front face shows `icon` as well.
   */
  letter?: string;
  /** Back face icon. */
  icon: ReactNode;
  /** Visible tooltip text, e.g. "GitHub". */
  label: string;
  /** Accessible name, e.g. "GitHub profile". Defaults to `label`. */
  ariaLabel?: string;
  href?: string;
  onClick?: () => void;
  /** LOCAL PATCH: brand colour for hover/focus/tap (icon, border, glow). */
  color?: string;
  /** LOCAL PATCH: glow strength in % (default: CSS --brand-glow-mix). */
  glow?: number;
}

interface SocialFlipButtonProps {
  items: SocialItem[];
  className?: string;
  itemClassName?: string;
  frontClassName?: string;
  backClassName?: string;
  /** Accessible name for the list. */
  listLabel?: string;
  /** LOCAL PATCH: start angle of the frame's rotating sweep. */
  borderStartAngle?: number;
}

const isExternal = (href: string) => /^https?:\/\//.test(href);

export default function SocialFlipButton({
  items,
  className,
  itemClassName,
  frontClassName,
  backClassName,
  listLabel = "Social links",
  borderStartAngle = 0,
}: SocialFlipButtonProps) {
  return (
    <div className={cn("social-flip", className)}>
      {/* Over the frame's 1px border; one turn = two sweeps (2.5s each,
          the original cadence). */}
      <RotatingBorder
        inset="-1px"
        speed={5}
        startAngle={borderStartAngle}
        colors={SWEEP_STOPS}
      />
      <ul aria-label={listLabel} className="social-flip-list">
        {items.map((item, i) => {
          const content = (
            <>
              <span aria-hidden="true" className="social-flip-tooltip">
                {item.label}
              </span>
              <span aria-hidden="true" className="social-flip-card">
                <span
                  className={cn(
                    "social-flip-face social-flip-front",
                    frontClassName,
                  )}
                >
                  {item.letter ?? item.icon}
                </span>
                <span
                  className={cn(
                    "social-flip-face social-flip-back",
                    backClassName,
                  )}
                >
                  {item.icon}
                </span>
              </span>
            </>
          );
          const common = {
            "aria-label": item.ariaLabel ?? item.label,
            className: cn("social-flip-item", itemClassName),
            style: {
              "--i": i,
              ...(item.color ? { "--brand": item.color } : {}),
              ...(item.glow !== undefined
                ? { "--brand-glow-mix": `${item.glow}%` }
                : {}),
            } as CSSProperties,
          };
          return (
            <li key={item.label}>
              {item.href ? (
                <a
                  href={item.href}
                  {...(isExternal(item.href)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  {...common}
                >
                  {content}
                </a>
              ) : (
                <button type="button" onClick={item.onClick} {...common}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { SocialFlipButton };
