/*
 * EXPERIMENT (branch test/agentic-ai): the real site builds itself section
 * by section as you scroll, with one persistent swarm of agent cursors.
 * See README.md in this folder.
 *
 * Plain module (no "use client", no React): safe to import from server
 * components (attribute helper, the pre-paint gate).
 */

/**
 * Master switch. `false` → no gate script, no data-build attributes, no
 * extra DOM, and the GSAP chunk is not emitted at all.
 */
export const AGENT_CURSOR_ENABLED = true;

/**
 * "once": a section builds the first time its top reaches ~75% of the
 *   viewport and stays built.
 * "scrub": build progress follows scroll (top 80% → top 20%); scrolling up
 *   reverses it.
 */
export const BUILD_MODE: "once" | "scrub" = "once";

/** Below this width / with reduced motion: no builds at all. */
export const AGENT_CURSOR_MIN_WIDTH = 768;
export const AGENT_CURSOR_QUERY = `(min-width: ${AGENT_CURSOR_MIN_WIDTH}px) and (prefers-reduced-motion: no-preference)`;

/** Neon palette (outlines, cursors, HUD dots). Decorative only. */
export const AGENT_PALETTE = [
  "oklch(0.88 0.24 145)", // neon green
  "oklch(0.93 0.19 103)", // yellow
  "oklch(0.74 0.25 352)", // pink
  "oklch(0.86 0.15 205)", // cyan
  "oklch(0.79 0.18 55)", // orange
  "oklch(0.7 0.23 302)", // purple
] as const;

export const DEFAULT_AGENTS = 12;
export const MAX_AGENTS = 20;

/**
 * Pace multiplier for every timing below (1 = default; 2 = twice as long,
 * 0.5 = twice as fast). Tune the whole choreography with this one number.
 */
export const TEMPO = 1;

/** Build lengths in seconds (× TEMPO). */
export const HERO_DURATION = 2.5 * TEMPO;
export const SECTION_DURATION = 3.5 * TEMPO;
export const FOOTER_DURATION = 2 * TEMPO;
export const DURATION_CAP = 4.5 * TEMPO;

/** Phase split of a section's time: scaffold → divided work → finish. */
export const PHASES = { scaffold: 0.15, work: 0.75, finish: 0.1 } as const;

/** Agent travel: px per second, clamped to [min, max] seconds (× TEMPO). */
export const TRAVEL = { speed: 900, min: 0.35 * TEMPO, max: 1.1 * TEMPO };
/** Departure stagger between agents (s, × TEMPO). */
export const DEPART_STAGGER = 0.06 * TEMPO;
/**
 * Cursor look: "pointer" (rounded multiplayer pointer, white outline,
 * glow), "arrow" (sharp classic arrow), "reticle" (ring + ticks, spins
 * while working) or "orb" (glowing dot with a short trail).
 */
export const CURSOR_STYLE: "pointer" | "arrow" | "reticle" | "orb" = "pointer";
/** Show "Agent-N · task" pills next to the cursors. */
export const SHOW_LABELS = false;
/** Cursor glyph size (px) and the minimum empty gap between two cursors. */
export const CURSOR_SIZE = 22;
export const CURSOR_GAP = 18;

/** Pill task labels (SHOW_LABELS), cycled as an element progresses. */
export const TASK_LABELS = [
  "layout",
  "type",
  "color",
  "spacing",
  "shadow",
  "polish",
] as const;

/** Large elements (image type or > 25% of the section) get up to this many agents. */
export const MAX_AGENTS_PER_ELEMENT = 2;
/**
 * A session waits (up to CREW_WAIT_MS) for at least this many free agents
 * (or one per element), so a section is never left to a single agent
 * working through it alone while the others finish elsewhere.
 */
export const MIN_CREW = 3;
export const CREW_WAIT_MS = 600;
export const LARGE_AREA_SHARE = 0.25;

/** Outline opacity once its element is built (then it fades in the finish). */
export const SETTLE_OPACITY = 0.15;
/** Negative clip inset (px) so glows / rotating borders aren't cut off. */
export const CLIP_BLEED = 48;
/** Units per section (DOM order). */
export const MAX_UNITS_PER_SECTION = 11;
/** once: only elements within this margin of the viewport are worked on (× vh). */
export const NEAR_VIEW = 0.15;

/**
 * Self-building tour (once mode).
 * "auto": on a fresh visit (at the top, no hash, once per session) the page
 *   scrolls itself through the build after the hero is built, following a
 *   visible countdown in the HUD. "button": only from the HUD button.
 *   "off": no tour and no tour buttons.
 * Any user input stops it immediately; it never restarts by itself.
 */
export const AUTO_TOUR: "auto" | "button" | "off" = "auto";
/**
 * Continuous tour: one smooth scroll from the top to the built footer.
 * Base speed ≈ scrollable height / TOUR_DURATION_S (compensated for the
 * ease-in over TOUR_EASE_IN_S and the glide-out over the last
 * TOUR_EASE_OUT_PX, so the trip really takes ~TOUR_DURATION_S), clamped
 * to [TOUR_SPEED_MIN, TOUR_SPEED_MAX] px/s.
 */
export const TOUR_DURATION_S = 0.5;
export const TOUR_SPEED_MIN = 120;
export const TOUR_SPEED_MAX = 320;
export const TOUR_EASE_IN_S = 1;
export const TOUR_EASE_OUT_PX = 400;
/** Never slower than this share of the base speed (and never 0). */
export const TOUR_MIN_SPEED_FACTOR = 0.35;
/** Slow down while elements in the top share of the viewport are unbuilt… */
export const TOUR_SLOW_ZONE = 0.6;
/** …easing the speed change over about this long (ms). */
export const TOUR_LERP_MS = 300;
/** During the tour, sections start as soon as their top enters the
 *  viewport's bottom band (normally START_LINE). */
export const TOUR_START_LINE = 1;
/** Hold at the built footer, then the eased return to the top (ms). */
export const TOUR_END_HOLD_MS = 1200;
export const TOUR_RETURN_MS = 2500;
/** Countdown before the auto tour (s). */
export const TOUR_COUNTDOWN_S = 3;
export const TOUR_RETURN_TO_TOP = true;
/** Replay automatically once after returning to the top (max 1 loop). */
export const TOUR_LOOP = false;

/** once: a section starts when its top crosses this fraction of the viewport. */
export const START_LINE = 0.75;
/** scrub: ScrollTrigger range. */
export const SCRUB_RANGE = { start: 0.8, end: 0.2 } as const;

/** Pre-paint hero gate: released by this time even if JS never arrives. */
export const GATE_TIMEOUT_MS = { production: 3500, development: 12000 };

/** `?introDebug=1` logs build start/finish per section. */
export const DEBUG_PARAM = "introDebug";

/*
 * Lazy chunk loader. It MUST live in this module, next to the literal flag:
 * Turbopack folds a constant condition only within one module (with an
 * imported flag the GSAP chunk was still emitted with the flag off).
 * `typeof window` removes it from the server graphs: this module is
 * imported by server components, and an RSC-graph import() of a client
 * module makes Next preload it as a page <script> (GSAP on first load).
 */
export const loadBuilder =
  AGENT_CURSOR_ENABLED && typeof window !== "undefined"
    ? () => import("./builder")
    : null;

export type AgentBuildType = "text" | "image" | "block";

export type AgentBuildAttrs = {
  "data-build"?: string;
  "data-build-type"?: AgentBuildType;
  "data-build-id"?: string;
};

/**
 * Marks an element as a build unit (`id` → components can wait for its
 * "built" signal with useBuilt). `{}` when the flag is off, so the server
 * HTML is identical to the site without the experiment.
 */
export function agentBuildAttrs(
  type: AgentBuildType = "block",
  id?: string,
): AgentBuildAttrs {
  if (!AGENT_CURSOR_ENABLED) return {};
  return {
    "data-build": "",
    "data-build-type": type,
    ...(id ? { "data-build-id": id } : {}),
  };
}
