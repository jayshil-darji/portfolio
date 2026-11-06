"use client";

/*
 * Vengeance UI: @vengeanceui/creepy-button
 * Source: public/r/creepy-button.json @ 298075b.
 *
 * A cover sits over a pair of eyes; on hover/focus the cover tilts up and
 * the eyes (which blink) follow the pointer.
 *
 * LOCAL PATCHES:
 *  1. `href` support: renders a real <a> (in-page anchors go through the
 *     site's scroll handling); <button> otherwise. No nested interactives.
 *  2. Accessible name: upstream rendered the label twice (cover + size
 *     placeholder) → "View My Work View My Work". Placeholder is aria-hidden.
 *  3. No re-render per pointer move: pupils are driven by CSS variables set
 *     imperatively. Cover lift / blink are CSS (styles/vengeance.css), so
 *     framer-motion is no longer needed at all.
 *  4. Theme colours via tokens (--brand-*, --background, --foreground…)
 *     instead of hard-coded bg-black / bg-white / bg-blue-500.
 *  5. Touch (hover: none): no cursor to follow and no hover to lift the
 *     cover, so the cover periodically "peeks" while the eyes look around
 *     and blink (pure CSS).
 *  6. prefers-reduced-motion: eyes centred and static, no blink, no peek.
 *  7. Removed the non-existent `tap-highlight-transparent` utility.
 */

import {
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type BaseProps = {
  children: ReactNode;
  className?: string;
  /** Classes for the cover (the visible face). */
  coverClassName?: string;
};
type AsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & { href: string };
type AsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };
export type CreepyButtonProps = AsLink | AsButton;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CreepyButton(props: CreepyButtonProps) {
  const { children, className, coverClassName, ...rest } = props;
  const eyesRef = useRef<HTMLSpanElement>(null);

  const track = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || reducedMotion() || !eyesRef.current) return;
    const r = eyesRef.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    // Upstream's mapping: direction from the eyes, limited reach.
    const angle = Math.atan2(-dy, dx) + Math.PI / 2;
    const dist = Math.hypot(dx, dy);
    const x = (Math.sin(angle) * Math.min(dist, 180)) / 180;
    const y = (Math.cos(angle) * Math.min(dist, 75)) / 75;
    e.currentTarget.style.setProperty("--eye-x", x.toFixed(3));
    e.currentTarget.style.setProperty("--eye-y", y.toFixed(3));
  };
  const reset = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--eye-x", "0");
    e.currentTarget.style.setProperty("--eye-y", "0");
  };

  const inner = (
    <>
      <span ref={eyesRef} aria-hidden="true" className="creepy-eyes">
        <span className="creepy-eye">
          <span className="creepy-pupil" />
        </span>
        <span className="creepy-eye">
          <span className="creepy-pupil" />
        </span>
      </span>
      <span className={cn("creepy-cover", coverClassName)}>{children}</span>
      {/* Size placeholder (cover is absolutely positioned). */}
      <span aria-hidden="true" className="creepy-size">
        {children}
      </span>
    </>
  );

  const classes = cn("creepy", className);

  if (rest.href !== undefined) {
    const anchorProps = rest as Omit<AsLink, keyof BaseProps>;
    return (
      <a
        {...anchorProps}
        className={classes}
        onPointerMove={(e) => {
          track(e);
          anchorProps.onPointerMove?.(e);
        }}
        onPointerLeave={(e) => {
          reset(e);
          anchorProps.onPointerLeave?.(e);
        }}
      >
        {inner}
      </a>
    );
  }
  const buttonProps = rest as Omit<AsButton, keyof BaseProps>;
  return (
    <button
      type="button"
      {...buttonProps}
      className={classes}
      onPointerMove={(e) => {
        track(e);
        buttonProps.onPointerMove?.(e);
      }}
      onPointerLeave={(e) => {
        reset(e);
        buttonProps.onPointerLeave?.(e);
      }}
    >
      {inner}
    </button>
  );
}

export default CreepyButton;
