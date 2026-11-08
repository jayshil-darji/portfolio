"use client";

/*
 * Entry point, rendered once at the end of the page's <main> (not in the
 * layout: the page segment hydrates after the layout, and the builder must
 * not touch the hero's DOM before React has hydrated it). Flag off →
 * nothing (and no dynamic import exists → no GSAP chunk). Flag on → mounts
 * the lazy builder while builds may run (≥768px, motion allowed —
 * re-evaluated live). The chunk is prefetched as soon as this module
 * evaluates when the hero gate is armed, so the hero isn't held longer
 * than hydration takes.
 */

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import {
  AGENT_CURSOR_ENABLED,
  AGENT_CURSOR_QUERY,
  DEFAULT_AGENTS,
  loadBuilder,
  MAX_AGENTS,
} from "./config";
import { getGateState } from "./gate-shared";

const BuilderChunk = loadBuilder ? dynamic(loadBuilder, { ssr: false }) : null;

if (loadBuilder && getGateState() === "pending") void loadBuilder();

function subscribe(cb: () => void) {
  const mql = matchMedia(AGENT_CURSOR_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

export function BuildRoot({ agents = DEFAULT_AGENTS }: { agents?: number }) {
  const allowed = useSyncExternalStore(
    subscribe,
    () => matchMedia(AGENT_CURSOR_QUERY).matches,
    () => false,
  );
  if (!AGENT_CURSOR_ENABLED || !BuilderChunk || !allowed) return null;
  return <BuilderChunk agents={Math.min(MAX_AGENTS, Math.max(1, agents))} />;
}
