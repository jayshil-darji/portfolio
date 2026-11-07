"use client";

import { useInView } from "motion/react";
import { useRef } from "react";
import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { AnimatedRays } from "@/components/ui/animated-rays";
import "@/styles/hero-rays.css";

/**
 * Layered, decorative hero backdrop:
 *  1. Vengeance UI AnimatedRays (CSS aurora, top-right) at ~45% opacity,
 *     re-hued to teal/blue/violet so the name stays the brightest element
 *  2. Static perspective grid (one element, CSS gradients — no DOM tiles)
 *  3. Soft glow + vignette + fade into the page background
 *
 * The aurora animation is paused while the hero is off-screen to save
 * battery/CPU. `initial: true` keeps SSR and first client render identical.
 */
export function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { initial: true });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-paused={!inView}
      {...agentBuildAttrs("image")}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background"
    >
      <AnimatedRays className="hero-rays absolute inset-0" />
      {/* Re-hues the rays to teal/blue/violet (mix-blend-mode: color keeps the
          rays' luminance, takes hue + saturation from this gradient). */}
      <div className="hero-rays-tint absolute inset-0" />
      <div className="hero-grid absolute inset-x-0 bottom-0 h-[60%]" />
      <div className="hero-glow absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background" />
    </div>
  );
}
