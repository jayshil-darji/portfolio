"use client";

import { useBuilt } from "@/components/experimental/agent-cursor/build-state";
import StatsCounter from "@/components/ui/stats-counter";

/** Seconds: far enough that the counter holds at 0 (< setTimeout's 2^31 ms cap). */
const HOLD = 1e6;

/**
 * StatsCounter wrapper (the Vengeance file stays untouched). Normally just
 * StatsCounter. While the agent-cursor build (EXPERIMENT) hasn't revealed
 * this stat yet, it holds at 0; on its "built" signal it remounts (key) and
 * counts up from 0.
 */
export function AboutStat({
  buildId,
  delay,
  ...props
}: {
  buildId: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delay: number;
  className?: string;
}) {
  const built = useBuilt(buildId);
  return (
    <StatsCounter
      key={built ? "counting" : "held"}
      {...props}
      duration={2}
      delay={built ? delay : HOLD}
    />
  );
}
