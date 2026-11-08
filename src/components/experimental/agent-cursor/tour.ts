/*
 * Self-building tour (lazy chunk): the page scrolls itself through the
 * build in ONE continuous, smooth scroll, slowing down (never stopping)
 * while the top of the view still has unbuilt elements.
 *
 *   idle → countdown → touring → returning → done
 *                  ↘──── any user input ────↘ stopped
 *
 * - One rAF loop: velocity × dt into a float position accumulator →
 *   window.scrollTo (scroll-behavior forced to "auto" meanwhile). Base
 *   speed = scrollable height / TOUR_DURATION_S (clamped); eases in over
 *   TOUR_EASE_IN_S, glides out over the last TOUR_EASE_OUT_PX; at least
 *   1px per frame, so it never stalls. While anything in the top
 *   TOUR_SLOW_ZONE of the view is unbuilt, the speed eases (~TOUR_LERP_MS)
 *   toward TOUR_MIN_SPEED_FACTOR × base, then back.
 * - The builder starts sections as soon as they enter the viewport during
 *   the tour, and only fast-forwards one whose element reaches the top
 *   unbuilt. The scroll is real: scroll-spy and the Experience line follow.
 * - The user always wins: wheel / touch / key / mouse / pointer / in-page
 *   link input stops it at once (input events, not scroll events) and
 *   cancels every in-flight scroll, wait and timer via a generation token.
 *   It never restarts automatically after a stop.
 */

import {
  AUTO_TOUR,
  TOUR_COUNTDOWN_S,
  TOUR_DURATION_S,
  TOUR_EASE_IN_S,
  TOUR_EASE_OUT_PX,
  TOUR_END_HOLD_MS,
  TOUR_LERP_MS,
  TOUR_LOOP,
  TOUR_MIN_SPEED_FACTOR,
  TOUR_RETURN_MS,
  TOUR_RETURN_TO_TOP,
  TOUR_SLOW_ZONE,
  TOUR_SPEED_MAX,
  TOUR_SPEED_MIN,
} from "./config";
import type { HudStore } from "./hud";

export type TourState =
  "off" | "idle" | "countdown" | "touring" | "returning" | "done" | "stopped";

/** What the tour needs from the builder. */
export interface BuilderApi {
  /** The hero was built on load (fresh visit at the top, no hash). */
  heroPlayedOnLoad: boolean;
  heroBuilt(): boolean;
  /** Every build unit in the viewport (of started groups) is built. */
  allInViewBuilt(): boolean;
  /** Unbuilt elements in the top `share` of the viewport. */
  unbuiltInTop(share: number): number;
  /** Called on every build-state change. */
  subscribe(listener: () => void): () => void;
  /** Tour scrolls aren't "the user scrolled past" (no fast-forward). */
  setTourScrolling(on: boolean): void;
  /** Everything back to unbuilt (wireframes re-applied), hero rebuilds. */
  resetAll(): void;
}

export interface Tour {
  stop(reason?: string): void;
  /** Reset the whole build and tour it from the top. */
  replay(): void;
  destroy(): void;
}

const SESSION_KEY = "acb-tour-played";
const ease = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const scrollToY = (y: number) =>
  window.scrollTo({ top: y, behavior: "instant" });
const maxScroll = () =>
  document.documentElement.scrollHeight - window.innerHeight;

export function createTour(
  api: BuilderApi,
  hud: HudStore,
  log: (...args: unknown[]) => void,
): Tour {
  let state: TourState = AUTO_TOUR === "off" ? "off" : "idle";
  let gen = 0;
  let raf = 0;
  let looped = false;
  const timers = new Set<number>();
  /** Restores the page's scroll-behavior after the tour. */
  let restoreBehavior: (() => void) | null = null;

  const set = (next: TourState) => {
    state = next;
    hud.set({ tour: next });
  };
  const active = () =>
    state === "countdown" || state === "touring" || state === "returning";
  const live = (g: number) => g === gen && active();

  const sleep = (ms: number, g: number) =>
    new Promise<boolean>((res) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        res(live(g));
      }, ms);
      timers.add(t);
    });

  /** Eased programmatic scroll; false if cancelled. */
  const scrollTo = (y: number, ms: number, g: number) =>
    new Promise<boolean>((res) => {
      const from = window.scrollY;
      const t0 = performance.now();
      const frame = (now: number) => {
        if (!live(g)) return res(false);
        const f = Math.min(1, (now - t0) / ms);
        scrollToY(from + (y - from) * ease(f));
        if (f < 1) raf = requestAnimationFrame(frame);
        else res(true);
      };
      raf = requestAnimationFrame(frame);
    });

  /** Until everything in view is built (the footer, at the end). */
  const inViewBuilt = (g: number) =>
    new Promise<boolean>((res) => {
      const tick = () => {
        if (!live(g)) return res(false);
        if (api.allInViewBuilt()) return res(true);
        const t = window.setTimeout(() => {
          timers.delete(t);
          tick();
        }, 100);
        timers.add(t);
      };
      tick();
    });

  /** The continuous glide to the bottom; false if cancelled. */
  const glide = (g: number) =>
    new Promise<boolean>((res) => {
      const max = maxScroll();
      // Height / duration, compensated for the ramps so the trip really
      // takes ~TOUR_DURATION_S: the ease-in costs ~½ of its length, the
      // √-shaped glide-out takes twice its distance at base speed.
      const base = Math.max(
        TOUR_SPEED_MIN,
        Math.min(
          TOUR_SPEED_MAX,
          (max + TOUR_EASE_OUT_PX) / (TOUR_DURATION_S - TOUR_EASE_IN_S / 2),
        ),
      );
      const tau = TOUR_LERP_MS / 1000 / 3; // ~95% of a speed change in TOUR_LERP_MS
      let pos = window.scrollY;
      let factor = 1;
      let last = 0;
      let t0 = 0;
      // stats (?introDebug=1)
      const st = {
        frames: 0,
        minD: Infinity,
        maxD: 0,
        zeroRun: 0,
        maxZeroRun: 0,
        slowdowns: 0,
        slow: false,
        vMin: Infinity,
        vSum: 0,
      };
      let prevY = Math.round(window.scrollY);
      const frame = (now: number) => {
        if (!live(g)) return res(false);
        if (!last) {
          last = t0 = now;
          raf = requestAnimationFrame(frame);
          return;
        }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        // Adaptive: slow down while the top of the view is unbuilt.
        const slow = api.unbuiltInTop(TOUR_SLOW_ZONE) > 0;
        if (slow && !st.slow) st.slowdowns++;
        st.slow = slow;
        const target = slow ? TOUR_MIN_SPEED_FACTOR : 1;
        factor += (target - factor) * (1 - Math.exp(-dt / tau));
        const ramp = ease(Math.min(1, (now - t0) / 1000 / TOUR_EASE_IN_S));
        const left = max - pos;
        const glideOut = Math.sqrt(Math.min(1, left / TOUR_EASE_OUT_PX));
        // ≥ 1px per frame (at 60fps): never stalls, never sub-pixel stutter.
        const v = Math.max(60, base * factor * ramp * glideOut);
        pos = Math.min(max, pos + v * dt);
        scrollToY(pos);
        const y = Math.round(window.scrollY);
        const d = y - prevY;
        prevY = y;
        st.frames++;
        st.minD = Math.min(st.minD, d);
        st.maxD = Math.max(st.maxD, d);
        st.zeroRun = d === 0 ? st.zeroRun + 1 : 0;
        st.maxZeroRun = Math.max(st.maxZeroRun, st.zeroRun);
        st.vMin = Math.min(st.vMin, v);
        st.vSum += v;
        if (pos < max) raf = requestAnimationFrame(frame);
        else {
          log(
            `tour: glide ${((now - t0) / 1000).toFixed(1)}s, base ${base.toFixed(0)}px/s, ` +
              `v min/avg ${st.vMin.toFixed(0)}/${(st.vSum / st.frames).toFixed(0)}px/s, ` +
              `per-frame Δ ${st.minD}…${st.maxD}px, longest zero-Δ run ${st.maxZeroRun} frame(s), ` +
              `${st.frames} frames, slow-downs ${st.slowdowns}`,
          );
          res(true);
        }
      };
      raf = requestAnimationFrame(frame);
    });

  const untilHeroBuilt = () =>
    new Promise<void>((res) => {
      if (api.heroBuilt()) return res();
      const off = api.subscribe(() => {
        if (!api.heroBuilt()) return;
        off();
        res();
      });
    });

  /* ---- user always wins ---- */
  const onInput = (e: Event) => {
    if (e.type === "click") {
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!a) return;
    }
    stop(`${e.type}`);
  };
  const INPUTS = [
    "wheel",
    "touchstart",
    "keydown",
    "mousedown",
    "pointerdown",
    "click",
  ];
  const listen = (on: boolean) => {
    for (const ev of INPUTS)
      if (on)
        window.addEventListener(ev, onInput, { capture: true, passive: true });
      else window.removeEventListener(ev, onInput, { capture: true });
  };

  function stop(reason = "stop") {
    if (!active()) return;
    gen++;
    cancelAnimationFrame(raf);
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    listen(false);
    api.setTourScrolling(false);
    restoreBehavior?.();
    set("stopped");
    hud.set({ flash: "Tour stopped" });
    const t = window.setTimeout(() => hud.set({ flash: null }), 2000);
    timers.add(t);
    log(`tour: stopped (${reason})`);
  }

  async function tour(g: number) {
    set("touring");
    api.setTourScrolling(true);
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    restoreBehavior = () => {
      html.style.scrollBehavior = prevBehavior;
      restoreBehavior = null;
    };
    const t0 = performance.now();
    if (!(await glide(g))) return;
    // Hold at the bottom once the footer (everything in view) is built.
    if (!(await inViewBuilt(g))) return;
    const atFooter = performance.now() - t0;
    if (!(await sleep(TOUR_END_HOLD_MS, g))) return;
    if (TOUR_RETURN_TO_TOP) {
      set("returning");
      if (!(await scrollTo(0, TOUR_RETURN_MS, g))) return;
    }
    listen(false);
    api.setTourScrolling(false);
    restoreBehavior?.();
    set("done");
    log(
      `tour: done — top → built footer ${(atFooter / 1000).toFixed(1)}s, ` +
        `full run ${((performance.now() - t0) / 1000).toFixed(1)}s`,
    );
    if (TOUR_LOOP && !looped) {
      looped = true;
      replay();
    }
  }

  async function countdown(g: number) {
    set("countdown");
    for (let n = TOUR_COUNTDOWN_S; n > 0; n--) {
      hud.set({ countdown: n });
      if (!(await sleep(1000, g))) return;
    }
    await tour(g);
  }

  function replay() {
    if (state === "off") return;
    const g = ++gen;
    cancelAnimationFrame(raf);
    // Into "touring" first: input from here on stops it.
    set("touring");
    listen(true);
    api.setTourScrolling(true);
    scrollToY(0);
    api.resetAll();
    log("tour: replay");
    untilHeroBuilt().then(() => {
      if (live(g)) void tour(g);
    });
  }

  /* ---- boot ---- */
  let fresh = false;
  try {
    fresh = !sessionStorage.getItem(SESSION_KEY);
  } catch {}
  if (
    AUTO_TOUR === "auto" &&
    fresh &&
    api.heroPlayedOnLoad &&
    !location.hash &&
    window.scrollY <= 2
  ) {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    const g = ++gen;
    // Waiting for the hero counts as part of the countdown: input stops it.
    set("countdown");
    hud.set({ countdown: TOUR_COUNTDOWN_S });
    listen(true);
    untilHeroBuilt().then(() => {
      if (!live(g)) return;
      if (window.scrollY > 2) return stop("not at top");
      void countdown(g);
    });
  } else hud.set({ tour: state });

  return {
    stop,
    replay,
    destroy() {
      gen++;
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      listen(false);
      api.setTourScrolling(false);
      restoreBehavior?.();
    },
  };
}
