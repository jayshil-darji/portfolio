/*
 * Vengeance UI: @vengeanceui/glow-border-card
 * Source: public/r/glow-border-card.json @ 298075b (removed in step 8 when
 * unused; re-added for the Experience timeline).
 *
 * A rotating conic-gradient ring, blurred, behind a glass card.
 *
 * LOCAL PATCHES:
 *  1. CSS (.glow-conic, @property --glow-angle, keyframes) wasn't shipped
 *     with the registry item → src/styles/vengeance.css.
 *  2. Colours: `gradientColors` accepts any CSS colour (theme vars like
 *     "var(--brand-teal)"); background uses the --glass-surface token
 *     instead of hard-coded bg-zinc-50 / dark:bg-neutral-900.
 *  3. Layout: `aspectRatio="auto"` → natural height; `contentClassName`
 *     replaces the hard-wired centred flex + p-4 content box.
 *  4. `animate`: "always" (upstream) | "hover" | "never". The rotation
 *     animates a CSS custom property, i.e. it repaints every frame — "hover"
 *     only runs it while the card is hovered / focused within.
 *  5. prefers-reduced-motion: never rotates (CSS).
 *  6. No "use client" needed (no hooks / handlers).
 *  7. "hover" rotation runs on :hover only for fine, hover-capable
 *     pointers (touch left :hover stuck after a tap); :focus-within always.
 */

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlowBorderCardProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  /** e.g. "1", "16/9"; "auto" (LOCAL PATCH) = natural content height. */
  aspectRatio?: string;
  borderRadius?: string;
  animationDuration?: number;
  /** Up to 10 CSS colours (theme vars allowed), cycled to 10 stops. */
  gradientColors?: string[];
  borderWidth?: string;
  blurAmount?: string;
  /** Negative values push the glow ring outside the card. */
  inset?: string;
  colorPreset?: "nature" | "ocean" | "sunset" | "aurora" | "custom";
  /** LOCAL PATCH: when the ring rotates. */
  animate?: "always" | "hover" | "never";
  /** @deprecated upstream API — same as animate="never". */
  paused?: boolean;
  /** LOCAL PATCH: classes for the content box (upstream: centred flex p-4). */
  contentClassName?: string;
}

const colorPresets: Record<string, string[]> = {
  nature: [
    "#669900",
    "#88bb22",
    "#99cc33",
    "#aaddaa",
    "#ccee66",
    "#006699",
    "#228888",
    "#3399cc",
    "#55aacc",
    "#669900",
  ],
  ocean: [
    "#006699",
    "#1177aa",
    "#2288bb",
    "#3399cc",
    "#44aadd",
    "#55bbee",
    "#66ccff",
    "#44bbee",
    "#2299cc",
    "#006699",
  ],
  sunset: [
    "#ff6600",
    "#ff7711",
    "#ff8822",
    "#ff9900",
    "#ffaa22",
    "#ffbb44",
    "#ffcc00",
    "#ff9933",
    "#ff7722",
    "#ff6600",
  ],
  aurora: [
    "#00ff87",
    "#22ffaa",
    "#44ffcc",
    "#60efff",
    "#88ddff",
    "#bb99ff",
    "#dd77ee",
    "#ff68f0",
    "#ff55cc",
    "#00ff87",
  ],
  custom: [
    "#669900",
    "#99cc33",
    "#ccee66",
    "#006699",
    "#3399cc",
    "#990066",
    "#cc3399",
    "#ff6600",
    "#ff9900",
    "#ffcc00",
  ],
};

export const GlowBorderCard = forwardRef<HTMLDivElement, GlowBorderCardProps>(
  (
    {
      children,
      className,
      width = "320px",
      height,
      aspectRatio = "1",
      borderRadius = "0.75rem",
      animationDuration = 4,
      gradientColors,
      borderWidth = "1.25em",
      blurAmount = "0.75em",
      inset = "-1em",
      colorPreset = "custom",
      animate = "always",
      paused = false,
      contentClassName,
      style,
      ...props
    },
    ref,
  ) => {
    const colors =
      gradientColors || colorPresets[colorPreset] || colorPresets.custom;
    const colorVars: Record<string, string> = {};
    for (let i = 0; i < 10; i++)
      colorVars[`--glow-color-${i + 1}`] = colors[i % colors.length];
    const mode = paused ? "never" : animate;

    return (
      <div
        ref={ref}
        data-glow-animate={mode}
        className={cn(
          "glow-card relative isolate overflow-hidden",
          "bg-[var(--glass-surface)] backdrop-blur-md",
          className,
        )}
        style={
          {
            width,
            height: height || "auto",
            aspectRatio: height ? "unset" : aspectRatio,
            borderRadius,
            "--glow-animation-duration": `${animationDuration}s`,
            ...colorVars,
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        <div
          aria-hidden="true"
          className="glow-conic absolute -z-10 rounded-[inherit] border-solid"
          style={{ inset, borderWidth, filter: `blur(${blurAmount})` }}
        />
        <div
          className={cn(
            "relative z-10 h-full w-full",
            contentClassName ?? "flex items-center justify-center p-4",
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);

GlowBorderCard.displayName = "GlowBorderCard";

export default GlowBorderCard;
