"use client";

/*
 * Build HUD (+ self-building tour controls): fixed bottom-left pill (in the page gutter at desktop widths,
 * clear of the centred content column) — agent dots in each agent's colour,
 * "{agents} agents · {built}/{total} layers · building / idle / done" and a
 * thin progress bar — agent dots, "{agents} agents ·
 * {built}/{total} layers" across the whole site, status building / idle /
 * done. Decorative (aria-hidden, pointer-events: none). Hidden while the
 * hero's scroll indicator is on screen (same spot) and a moment after
 * everything is built.
 */

import {
  useCallback,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AGENT_PALETTE } from "./config";
import type { TourState } from "./tour";

export interface HudState {
  agents: number;
  built: number;
  total: number;
  status: "building" | "idle" | "done";
  hidden: boolean;
  /** Self-building tour state (tour.ts); "off" = no tour UI. */
  tour: TourState;
  countdown: number;
  /** Short-lived message ("Tour stopped"). */
  flash: string | null;
}

export function createHudStore() {
  let state: HudState = {
    agents: 0,
    built: 0,
    total: 0,
    status: "idle",
    hidden: false,
    tour: "off",
    countdown: 0,
    flash: null,
  };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(patch: Partial<HudState>) {
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}
export type HudStore = ReturnType<typeof createHudStore>;

function subscribeScroll(cb: () => void) {
  addEventListener("scroll", cb, { passive: true });
  addEventListener("resize", cb);
  return () => {
    removeEventListener("scroll", cb);
    removeEventListener("resize", cb);
  };
}

/**
 * Hidden whenever it would cover content: while the hero's "Scroll" cue is
 * on screen (it owns the bottom of the hero), and while its box overlaps
 * any build unit — except full-width bands (backgrounds, navbar, footer,
 * marquee), which have no gutter to keep clear.
 */
function covers(hud: HTMLElement | null, ignoreCue: boolean): boolean {
  const cue = document
    .querySelector("#hero a[href='#about']")
    ?.getBoundingClientRect();
  if (!ignoreCue && cue && cue.bottom > 0 && cue.top < innerHeight) return true;
  if (!hud) return false;
  const h = hud.getBoundingClientRect();
  for (const el of document.querySelectorAll("[data-build]")) {
    const r = el.getBoundingClientRect();
    if (r.width >= innerWidth * 0.9) continue;
    if (
      r.right > h.left &&
      r.left < h.right &&
      r.bottom > h.top &&
      r.top < h.bottom
    )
      return true;
  }
  return false;
}

const LIVE: Partial<Record<TourState, string>> = {
  countdown: "Auto-tour starting. Press any key to stop.",
  touring: "Touring the build. Press any key to stop.",
  done: "Build tour done.",
  stopped: "Tour stopped.",
};

export function Hud({
  store,
  onStop,
  onReplay,
}: {
  store: HudStore;
  onStop: () => void;
  onReplay: () => void;
}) {
  const s = useSyncExternalStore(store.subscribe, store.get, store.get);
  const ref = useRef<HTMLDivElement>(null);
  // While the HUD offers a tour action it's always shown at the top (it's
  // in the bottom-left corner, clear of the hero's scroll cue).
  const actionable = s.tour !== "off";
  const getCovering = useCallback(
    () => covers(ref.current, actionable),
    [actionable],
  );
  const covering = useSyncExternalStore(
    subscribeScroll,
    getCovering,
    () => true,
  );
  const touring = s.tour === "touring" || s.tour === "returning";
  const tourActive = touring || s.tour === "countdown";
  const allBuilt = s.total > 0 && s.built >= s.total;

  let line: ReactNode;
  let action: ReactNode = null;
  if (s.flash) line = s.flash;
  else if (s.tour === "countdown") line = `Auto-tour in ${s.countdown}…`;
  else if (s.tour === "done") line = "Done";
  if (s.tour === "countdown" || touring)
    action = (
      <button type="button" className="acb-hud-btn" onClick={onStop}>
        Stop
      </button>
    );
  else if (
    s.tour === "done" ||
    s.tour === "stopped" ||
    (s.tour === "idle" && allBuilt)
  )
    action = (
      <button type="button" className="acb-hud-btn" onClick={onReplay}>
        ↻ Replay build
      </button>
    );
  else if (s.tour === "idle")
    action = (
      <button type="button" className="acb-hud-btn" onClick={onReplay}>
        ▶ Watch it build
      </button>
    );
  const status = touring ? "touring" : s.status;

  return (
    <div
      ref={ref}
      className="acb-hud"
      // While a tour counts down or runs, never auto-hide: Stop must
      // always be reachable (the pill is compact, bottom-left).
      data-hidden={tourActive ? false : covering || s.hidden || s.total === 0}
    >
      <span className="acb-hud-dots" aria-hidden="true">
        {Array.from({ length: s.agents }, (_, k) => (
          <span
            key={k}
            className="acb-hud-dot"
            style={
              {
                "--acb-c": AGENT_PALETTE[k % AGENT_PALETTE.length],
              } as CSSProperties
            }
          />
        ))}
      </span>
      <span className="acb-hud-text" aria-hidden="true">
        {line ?? (
          <>
            <span className="acb-hud-count">{s.agents}</span> agents ·{" "}
            <span className="acb-hud-count acb-hud-layers">
              {s.built}/{s.total}
            </span>{" "}
            layers ·{" "}
            <span className="acb-hud-status" data-status={status}>
              {status}
            </span>
          </>
        )}
      </span>
      <span className="acb-hud-bar" aria-hidden="true">
        <span
          className="acb-hud-fill"
          style={{ transform: `scaleX(${s.total ? s.built / s.total : 0})` }}
        />
      </span>
      {/* The button slot is always reserved while the tour UI is on, so
          the bottom-anchored pill never changes height (no layout shift). */}
      {action ??
        (actionable && (
          <span className="acb-hud-btn" data-empty="" aria-hidden="true">
            ·
          </span>
        ))}
      {/* Status changes only — never per layer. */}
      <span className="acb-sr" aria-live="polite">
        {LIVE[s.tour] ?? ""}
      </span>
    </div>
  );
}
