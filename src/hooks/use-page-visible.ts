"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * `true` while the tab is visible. Hydration-safe: the server snapshot is
 * `true`, so markup driven by it matches on first render. Use it with
 * `useInView` to pause ambient loops (`data-paused`) when nobody can see
 * them.
 */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.visibilityState === "visible",
    () => true,
  );
}
