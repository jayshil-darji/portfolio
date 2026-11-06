"use client";

import { FlipFadeText } from "@/components/ui/flip-fade-text";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/** Flip this far into a role slot (fraction). A role change (MorphText
 *  crossfade) occupies 0–0.2 of each slot; the name flip (≈1.6s ≈ 0.46 of
 *  a 3.5s slot) starts at 0.25 and ends by ~0.71, clear of both changes. */
const SLOT_PHASE = 0.25;
/** Name loop = this many role slots, so the phase never drifts. */
const SLOTS_PER_FLIP = 2;

/**
 * The hero name re-plays its flip-fade on a loop (visual only — the <h1>
 * carries the real name in sr-only text). The loop is phase-locked to the
 * roles MorphText's CSS animation (read from `syncSelector` via the Web
 * Animations API) so the name and the role never animate at the same
 * moment. Reduced motion: static.
 */
export function HeroName({
  name,
  rolePeriodMs,
  syncSelector,
}: {
  name: string;
  /** MorphText `interval` for the roles line. */
  rolePeriodMs: number;
  /** An element whose first CSS animation is the roles cycle. */
  syncSelector: string;
}) {
  const reduced = usePrefersReducedMotion();
  const alignTo = () => {
    const anim = document.querySelector(syncSelector)?.getAnimations()[0];
    return anim?.startTime != null
      ? Number(anim.startTime) + SLOT_PHASE * rolePeriodMs
      : null;
  };

  return (
    <FlipFadeText
      words={[name]}
      interval={SLOTS_PER_FLIP * rolePeriodMs}
      // First replay after the entrance has settled.
      startDelay={2500}
      alignTo={alignTo}
      static={reduced}
      letterDuration={0.5}
      staggerDelay={0.04}
      exitStaggerDelay={0.025}
    />
  );
}
