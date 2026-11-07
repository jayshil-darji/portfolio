"use client";

/*
 * Light "built" signals for our own components (statically imported —
 * tiny, no GSAP). The builder flips `active` on while it runs and marks
 * units with a data-build-id as built.
 *
 * useBuildActive(): true while the builder drives the page → skip your own
 *   entrance animation (the build reveals the element).
 * useBuilt(id): false only while the builder is active and that unit isn't
 *   revealed yet → start count-ups / loops on it.
 * Server snapshot: inactive → hydration always matches the server HTML.
 */

import { useSyncExternalStore } from "react";

let active = false;
let built = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setBuildActive(next: boolean) {
  if (active === next) return;
  active = next;
  built = new Set();
  emit();
}

export function setBuilt(id: string, value: boolean) {
  if (built.has(id) === value) return;
  built = new Set(built);
  if (value) built.add(id);
  else built.delete(id);
  emit();
}

export function useBuildActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => false,
  );
}

export function useBuilt(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !active || built.has(id),
    () => true,
  );
}
