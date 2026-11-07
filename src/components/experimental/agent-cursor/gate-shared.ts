/*
 * Shared by the pre-paint hero gate (inline script) and the builder.
 * Plain module: the eligibility function is serialised into the gate
 * script with Function#toString, so it must be self-contained (no imports,
 * no closures, ES5-safe after compilation).
 */

/**
 * ONE eligibility rule for gate and builder.
 * site: builds may run at all (width ≥ 768px, motion allowed).
 * hero: the hero builds on load — additionally no URL hash, at the top,
 *       and not a back/forward navigation (which restores scroll).
 */
export function eligibility(
  w: Window,
  query: string,
): { site: boolean; hero: boolean } {
  const site = w.matchMedia(query).matches;
  const nav = w.performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  const hero =
    site &&
    !w.location.hash &&
    w.scrollY === 0 &&
    !(nav && nav.type === "back_forward");
  return { site: site, hero: hero };
}

export const GATE_ID = "acb-gate";

/** Hero + navbar units the gate hides before first paint. */
export const HERO_UNITS =
  "body header, #hero [data-build], #hero a[href='#about']";

/**
 * pending: hero + navbar hidden (and their CSS animations paused) until the
 *   builder claims them; our hero entrance stagger never plays.
 * claimed: the builder's inline styles own the units; the stagger stays
 *   off for good (re-enabling it would restart it: a double animation).
 */
export function gateCss(state: "pending" | "claimed"): string {
  const stagger = ".hero-reveal{animation:none!important}";
  if (state === "claimed") return stagger;
  return `${stagger}${HERO_UNITS.split(", ")
    .map((s) => s.trim())
    .join(",")}{opacity:0!important}${HERO_UNITS.split(", ")
    .map((s) => `${s.trim()},${s.trim()} *`)
    .join(",")}{animation-play-state:paused!important}`;
}

export function getGateState(): "pending" | "claimed" | null {
  const s = document.getElementById(GATE_ID);
  return (s?.dataset.state as "pending" | "claimed" | undefined) ?? null;
}

export function setGateState(state: "pending" | "claimed") {
  const s = document.getElementById(GATE_ID);
  if (!s) return;
  s.dataset.state = state;
  s.textContent = gateCss(state);
}
