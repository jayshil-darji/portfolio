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
 * useBuildHold(id): the hold signal for JS-driven media (the hero video):
 *   true while the pre-paint gate holds the hero for a build that hasn't
 *   started yet, or while the builder hasn't revealed the unit. CSS
 *   animations (the rays) need no hook: [data-acb-pending] pauses them.
 *   Flag off → always false.
 * Server snapshot: inactive → hydration always matches the server HTML.
 */

import { useSyncExternalStore } from "react";
import { AGENT_CURSOR_ENABLED } from "./config";
import { GATE_RELEASE_EVENT, gatePending } from "./gate-shared";

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

function subscribeHold(l: () => void) {
  listeners.add(l);
  addEventListener(GATE_RELEASE_EVENT, l);
  return () => {
    listeners.delete(l);
    removeEventListener(GATE_RELEASE_EVENT, l);
  };
}

export function useBuildHold(id: string): boolean {
  return useSyncExternalStore(
    subscribeHold,
    () => AGENT_CURSOR_ENABLED && (active ? !built.has(id) : gatePending()),
    // Server / hydration: held while the flag is on (effects only; no
    // markup depends on it).
    () => AGENT_CURSOR_ENABLED,
  );
}
