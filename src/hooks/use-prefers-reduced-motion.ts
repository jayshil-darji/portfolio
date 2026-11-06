"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Hydration-safe `prefers-reduced-motion` check.
 *
 * Why not motion's `useReducedMotion()`? It reads `matchMedia` *during render*
 * on the client but returns `null` on the server, so branching markup on it
 * causes a hydration mismatch for reduced-motion users. `useSyncExternalStore`
 * renders with the server snapshot (`false`) during hydration, then re-renders
 * with the real value — no mismatch, and it stays live if the OS setting
 * changes.
 *
 * Prefer pure CSS (`@media (prefers-reduced-motion: reduce)`) for visual
 * fallbacks; use this hook for JS-driven behaviour (pointer effects, timers,
 * canvas/WebGL mounting).
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
