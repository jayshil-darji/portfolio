"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `false` on the server and during hydration, `true` afterwards.
 * The hydration-safe replacement for `typeof window !== "undefined"` checks
 * and for `useEffect(() => setMounted(true), [])`.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
