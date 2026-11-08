"use client";

/*
 * The site builder (lazy chunk). Mounted by <BuildRoot> while builds may
 * run. The REAL page builds itself section by section:
 *
 *  - Groups: navbar + hero (on load, time-based, name & roles first), every
 *    top-level <section>, the footer. Units: [data-build] elements plus
 *    SELECTOR_UNITS for spots we can't attribute (navbar, Vengeance roots,
 *    footer), at most MAX_UNITS_PER_SECTION per group.
 *  - A group builds in work SESSIONS (planner.ts): scaffold (every
 *    wireframe draws in) → divided work (a queue; agents claim elements,
 *    travel on arcs, scribble, pulse; large elements get two agents; the
 *    real element is revealed bar by bar / in clip steps as the work
 *    progresses) → finish (labels, guides, outlines fade; agents regroup).
 *    once: only elements in/near the viewport are planned; the rest get
 *    their own session when they come near. scrub: one session per group,
 *    its time = ScrollTrigger progress.
 *  - ONE rAF loop renders every running session and the swarm; it runs
 *    only while a session runs (rAF also stops in hidden tabs, and time
 *    only advances by clamped frame deltas, so the build pauses).
 *  - Never blocks: a group leaving the viewport mid-build, or input inside
 *    it, fast-forwards it; in-page jumps (anchor clicks, hash on load,
 *    restored scroll) mark jumped-over groups built instantly and animate
 *    only the destination.
 *  - Built signals (build-state.ts) start count-ups and loops on reveal;
 *    [data-acb-pending] pauses CSS animations inside unbuilt units.
 * Only transform / opacity / clip-path are animated.
 */

import "./build.css";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { setBuildActive, setBuilt } from "./build-state";
import {
  AGENT_CURSOR_QUERY,
  AGENT_PALETTE,
  AUTO_TOUR,
  BUILD_MODE,
  CLIP_BLEED,
  CREW_WAIT_MS,
  DEBUG_PARAM,
  DURATION_CAP,
  FOOTER_DURATION,
  HERO_DURATION,
  MAX_UNITS_PER_SECTION,
  MIN_CREW,
  NEAR_VIEW,
  SCRUB_RANGE,
  SECTION_DURATION,
  SETTLE_OPACITY,
  START_LINE,
  TOUR_START_LINE,
  type AgentBuildType,
} from "./config";
import { eligibility, getGateState, setGateState } from "./gate-shared";
import { ScrollTrigger } from "./gsap";
import { createHudStore, Hud, type HudStore } from "./hud";
import { createTour, type Tour } from "./tour";
import { makePlan, sampleAgent, sampleElement, type Plan } from "./planner";
import {
  agentPagePositions,
  createSwarm,
  type AgentFrame,
  type Swarm,
} from "./swarm";
import { Agent, Wire, wireParts, type Box, type WireParts } from "./wire";

const DEBUG = new URLSearchParams(location.search).get(DEBUG_PARAM) === "1";
const log = (...args: unknown[]) => {
  if (DEBUG) console.log("[agent-build]", ...args);
};

/** Units we can't mark in markup (navbar, Vengeance component roots, footer). */
const SELECTOR_UNITS: {
  group: string;
  sel: string;
  type: AgentBuildType;
  /** Motion animates this element's opacity: reveal with clip-path only. */
  clipOnly?: boolean;
}[] = [
  { group: "hero", sel: "body header", type: "block" },
  { group: "hero", sel: "body header a[href='#hero']", type: "block" },
  { group: "hero", sel: "body header .spotlight-nav", type: "block" },
  { group: "hero", sel: "#hero a[href='#about']", type: "block" },
  { group: "skills", sel: "#skills .ss-container", type: "image" },
  {
    group: "projects",
    sel: "#projects [role='list'] > li",
    type: "image",
    clipOnly: true,
  },
  { group: "contact", sel: "#contact > :first-child", type: "image" },
  { group: "footer", sel: "body footer", type: "block" },
  { group: "footer", sel: "body footer p", type: "text" },
  { group: "footer", sel: "body footer a", type: "text" },
];
const SELECTOR_MARK = "data-acb-selector";

interface Unit {
  el: HTMLElement;
  type: AgentBuildType;
  id?: string;
  clipOnly: boolean;
}
interface Group {
  id: string;
  root: HTMLElement;
  units: Unit[];
}

const TYPES: readonly AgentBuildType[] = ["text", "image", "block"];

function discover(): Group[] {
  for (const s of SELECTOR_UNITS)
    document.querySelectorAll<HTMLElement>(s.sel).forEach((el) => {
      if (el.hasAttribute("data-build")) return;
      el.setAttribute("data-build", "");
      el.setAttribute("data-build-type", s.type);
      el.setAttribute(SELECTOR_MARK, s.clipOnly ? "clip" : "");
    });

  const toUnits = (els: HTMLElement[]): Unit[] =>
    els
      .filter((el) => el.getBoundingClientRect().width > 0)
      .sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      )
      .slice(0, MAX_UNITS_PER_SECTION)
      .map((el) => {
        const type = (el.dataset.buildType ?? "block") as AgentBuildType;
        return {
          el,
          type: TYPES.includes(type) ? type : "block",
          id: el.dataset.buildId,
          clipOnly: el.getAttribute(SELECTOR_MARK) === "clip",
        };
      });
  const within = (root: Element) =>
    Array.from(root.querySelectorAll<HTMLElement>("[data-build]"));

  const groups: Group[] = [];
  const header = document.querySelector<HTMLElement>("body header");
  for (const section of document.querySelectorAll<HTMLElement>(
    "main section[id]",
  )) {
    if (section.parentElement?.closest("section")) continue; // nested
    const els = within(section);
    if (section.id === "hero" && header) els.unshift(header, ...within(header));
    groups.push({ id: section.id, root: section, units: toUnits(els) });
  }
  const footer = document.querySelector<HTMLElement>("body footer");
  if (footer)
    groups.push({
      id: "footer",
      root: footer,
      units: toUnits([footer, ...within(footer)]),
    });
  return groups.filter((g) => g.units.length);
}

/** Left→right reveal with a negative-inset bleed on every side. */
function applyClip(el: HTMLElement, p: number) {
  if (p >= 1) {
    el.style.removeProperty("clip-path");
    return;
  }
  const b = CLIP_BLEED;
  const rest = 1 - p;
  el.style.clipPath = `inset(-${b}px calc(${(rest * 100).toFixed(3)}% + ${(
    rest * 2 * b -
    b
  ).toFixed(2)}px) -${b}px -${b}px)`;
}

function hideUnit(u: Unit) {
  if (!u.clipOnly) u.el.style.opacity = "0";
  applyClip(u.el, 0);
  u.el.setAttribute("data-acb-pending", "");
}
function showUnit(u: Unit) {
  u.el.style.removeProperty("opacity");
  u.el.style.removeProperty("clip-path");
  u.el.removeAttribute("data-acb-pending");
}

function pageBox(el: Element): Box {
  const r = el.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
}

/* ---------- reveal styles (clip-path + opacity only) ---------- */

const B = CLIP_BLEED;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Text: top→bottom (lines appear as their skeleton bars go). */
function clipTopDown(el: HTMLElement, p: number) {
  const r = 1 - p;
  el.style.clipPath = `inset(-${B}px -${B}px calc(${(r * 100).toFixed(3)}% + ${(r * 2 * B - B).toFixed(2)}px) -${B}px)`;
}
/** Images / cards: left→right in 3 quick steps with pauses between. */
function clipStepped(el: HTMLElement, p: number) {
  const k = Math.floor(p * 3);
  const ps = Math.min(1, (k + Math.min(1, (p * 3 - k) * 1.8)) / 3);
  applyClip(el, ps);
}

const pageBoxes = (els: HTMLElement[]) => els.map(pageBox);

/* ---------- engine ---------- */

type GroupState = "pending" | "building" | "built";

interface Session {
  id: string;
  group: Group;
  units: Unit[];
  plan: Plan;
  boxes: Box[];
  section: Box;
  t: number;
  scrub: boolean;
  done: boolean;
  parts: WireParts[] | null;
  /** Last applied visual key per element (skip unchanged writes). */
  keys: string[];
}

interface Engine {
  sessions: Session[];
  registerParts(id: string, parts: WireParts[] | null): void;
  updateBoxes(id: string, boxes: Box[], section: Box): void;
}

function durationFor(g: Group) {
  const base =
    g.id === "hero"
      ? HERO_DURATION
      : g.id === "footer"
        ? FOOTER_DURATION
        : SECTION_DURATION;
  return Math.min(base, DURATION_CAP);
}

export default function Builder({ agents }: { agents: number }) {
  const [groups] = useState(discover);
  const [layers, setLayers] = useState<Session[]>([]);
  const [hud] = useState(createHudStore);
  const swarmLayer = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const tourRef = useRef<Tour | null>(null);
  const [heroPlays] = useState(
    () =>
      getGateState() === "pending" &&
      eligibility(window, AGENT_CURSOR_QUERY).hero &&
      window.scrollY <= 2,
  );

  useLayoutEffect(() => {
    const html = document.documentElement;
    setBuildActive(true);
    html.setAttribute("data-acb-site", "");
    const layer = swarmLayer.current!;
    const swarm: Swarm = createSwarm(layer);

    const state = new Map<Group, GroupState>();
    const started = new Map<Group, number>();
    /** Units of a building group not planned yet (off-screen in once mode). */
    const waiting = new Map<Group, Unit[]>();
    const built = new Set<HTMLElement>();
    const agentSession: (Session | null)[] = Array.from(
      { length: agents },
      () => null,
    );
    const sessions: Session[] = [];
    const total = groups.reduce((n, g) => n + g.units.length, 0);
    const scrubbing = new Set<Group>();
    let seq = 0;
    /** When a group first had to wait for a crew. */
    const crewWait = new Map<Group, number>();

    /** Build-state listeners (the tour's allInViewBuilt subscription). */
    const listeners = new Set<() => void>();
    const status = () => {
      const done = built.size >= total;
      const busy =
        sessions.some((s) => !s.done && !s.scrub) || scrubbing.size > 0;
      hud.set({
        built: built.size,
        total,
        status: done ? "done" : busy ? "building" : "idle",
      });
      if (done) {
        swarm.leave();
        // With the tour UI the HUD stays: it offers "↻ Replay build".
        if (AUTO_TOUR === "off" || BUILD_MODE !== "once")
          window.setTimeout(() => {
            if (built.size >= total) hud.set({ hidden: true });
          }, 2000);
      } else swarm.back();
      listeners.forEach((l) => l());
    };
    /** Built bookkeeping only (signals + HUD count). */
    const markBuilt = (u: Unit, value: boolean) => {
      if (u.id) setBuilt(u.id, value);
      if (value === built.has(u.el)) return;
      if (value) built.add(u.el);
      else built.delete(u.el);
      status();
    };
    const unitBuilt = (u: Unit, value: boolean) => {
      if (value) showUnit(u);
      else hideUnit(u);
      markBuilt(u, value);
    };

    /* ---- rendering ---- */
    const renderSession = (s: Session): AgentFrame[] => {
      const { plan, t } = s;
      s.units.forEach((u, i) => {
        const e = sampleElement(plan, i, t);
        const p = e.progress;
        // real element
        if (p >= 1) {
          if (!built.has(u.el)) unitBuilt(u, true);
        } else if (p <= 0) {
          if (built.has(u.el) || !u.el.hasAttribute("data-acb-pending"))
            unitBuilt(u, false);
        } else {
          // Partly revealed (also when scrub reverses): not built.
          markBuilt(u, false);
          u.el.setAttribute("data-acb-pending", "");
          if (u.type === "text") clipTopDown(u.el, p);
          else clipStepped(u.el, p);
          if (!u.clipOnly) u.el.style.opacity = String(Math.min(1, p * 2.2));
        }
        // wireframe
        const w = s.parts?.[i];
        if (!w) return;
        const key = `${e.scaffold.toFixed(3)}|${p.toFixed(3)}|${e.working}|${e.finish.toFixed(3)}`;
        if (s.keys[i] === key) return;
        s.keys[i] = key;
        const sc = e.scaffold;
        for (const l of w.h) l.style.transform = `scaleX(${sc})`;
        for (const l of w.v) l.style.transform = `scaleY(${sc})`;
        for (const h of w.handles) h.style.transform = `scale(${sc})`;
        const meta = sc * (1 - clamp01(e.finish * 2.5));
        for (const m of w.meta) m.style.opacity = String(meta);
        w.skel.style.opacity = String(u.type === "text" ? sc : sc * (1 - p));
        const nb = w.bars.length;
        w.bars.forEach(
          (b, k) => (b.style.opacity = String(clamp01(1 - (p * nb - k)))),
        );
        w.outline.style.opacity = String(
          e.working ? 1 : p >= 1 ? SETTLE_OPACITY : 0.6,
        );
        w.root.dataset.active = String(e.working);
        w.root.style.opacity = String(1 - clamp01((e.finish - 0.3) / 0.7));
      });
      const frames: AgentFrame[] = [];
      plan.agents.forEach((segs, id) => {
        const a = sampleAgent(segs, t, plan, s.boxes, s.section);
        frames.push({
          id,
          x: a.x,
          y: a.y,
          progress: a.progress,
          step: a.step,
        });
      });
      return frames;
    };

    /* ---- sessions ---- */
    const freeAgents = () =>
      agentSession
        .map((s, id) => ({ s, id }))
        // Free: unbound, or its last task in its session is done.
        .filter(
          ({ s, id }) => !s || s.done || s.t >= (s.plan.freeAt.get(id) ?? 0),
        )
        .map(({ id }) => id);

    const regroupFor = (g: Group, section: Box) => {
      const next = groups[groups.indexOf(g) + 1];
      const vb = scrollY + innerHeight - 90;
      if (next) {
        const nb = pageBox(next.root);
        return { x: nb.x + nb.w * 0.82, y: Math.min(nb.y + 24, vb) };
      }
      return {
        x: section.x + section.w * 0.82,
        y: Math.min(section.y + section.h - 40, vb),
      };
    };

    const startSession = (
      g: Group,
      units: Unit[],
      scrub: boolean,
    ): Session | null => {
      const ids = scrub ? agentSession.map((_, i) => i) : freeAgents();
      // Wait briefly for a crew rather than one agent doing everything.
      if (!scrub && ids.length < Math.min(MIN_CREW, units.length)) {
        const since = crewWait.get(g) ?? performance.now();
        crewWait.set(g, since);
        if (performance.now() - since < CREW_WAIT_MS) return null;
      }
      crewWait.delete(g);
      if (!ids.length) return null;
      const section = pageBox(g.root);
      const boxes = pageBoxes(units.map((u) => u.el));
      const pos = agentPagePositions(layer);
      const share = Math.max(0.55, units.length / g.units.length);
      const plan = makePlan({
        seed: `${g.id}:${seq}`,
        duration: durationFor(g) * share,
        section,
        elements: units.map((u, i) => ({
          box: boxes[i],
          type: u.type,
          priority: u.id === "hero-name" || u.id === "hero-roles",
        })),
        agents: ids.map((id, j) =>
          scrub
            ? { id, x: section.x + section.w + 40, y: section.y + 30 + j * 22 }
            : { id, ...pos[id] },
        ),
        regroup: regroupFor(g, section),
      });
      const s: Session = {
        id: `${g.id}-${seq++}`,
        group: g,
        units,
        plan,
        boxes,
        section,
        t: 0,
        scrub,
        done: false,
        parts: null,
        keys: [],
      };
      if (!scrub) plan.agents.forEach((_, id) => (agentSession[id] = s));
      sessions.push(s);
      setLayers((l) => [...l, s]);
      log(
        `assign ${s.id} (${units.length} units, ${plan.duration.toFixed(2)}s):`,
        plan.elements
          .map(
            (e, i) =>
              `${describe(units[i])}←${e.agents.map((a) => `Agent-${a + 1}`).join("+") || "—"}`,
          )
          .join(", "),
      );
      if (!scrub) loop();
      return s;
    };

    const endSession = (s: Session) => {
      if (s.done) return;
      s.t = s.plan.duration;
      swarm.render(renderSession(s));
      s.done = true;
      agentSession.forEach((x, i) => {
        if (x === s) agentSession[i] = null;
      });
      setLayers((l) => l.filter((x) => x !== s));
      const g = s.group;
      if (
        !sessions.some((x) => x.group === g && !x.done) &&
        !waiting.get(g)?.length &&
        state.get(g) === "building"
      ) {
        state.set(g, "built");
        log(
          `built ${g.id} in ${Math.round(performance.now() - (started.get(g) ?? 0))}ms`,
        );
      }
      status();
      pump();
    };

    /* ---- the one rAF loop ---- */
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = 0;
      // Clamped frame delta: janky frames (hydration, three.js) barely
      // stretch the build, and a hidden tab (no rAF) pauses it.
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const frames: AgentFrame[] = [];
      for (const s of sessions) {
        if (s.done || s.scrub) continue;
        s.t = Math.min(s.plan.duration, s.t + dt);
        const f = renderSession(s);
        // Agents already re-assigned to a newer session are drawn by it.
        frames.push(
          ...f.filter(
            (fr) => agentSession[fr.id] === s || !agentSession[fr.id],
          ),
        );
        if (s.t >= s.plan.duration) endSession(s);
      }
      if (frames.length) swarm.render(frames);
      // Groups waiting for a crew (units already near) retry every frame;
      // units that are merely off-screen don't keep the loop alive.
      const waitingGroups = groups.some(
        (g) => state.get(g) === "building" && waiting.get(g)?.some(near),
      );
      if (waitingGroups) pump();
      // loop(), not a bare requestAnimationFrame: a session started during
      // this tick (endSession → pump → assign) has already scheduled the
      // next frame, and overwriting `raf` here orphaned that request, so
      // tick chains piled up (several full renders per frame).
      if (sessions.some((s) => !s.done && !s.scrub) || waitingGroups) loop();
      else {
        last = 0;
        layer.dataset.moving = "false";
      }
    };
    function loop() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    /* ---- groups ---- */
    const near = (u: Unit) => {
      const r = u.el.getBoundingClientRect();
      return (
        r.bottom > -innerHeight * NEAR_VIEW &&
        r.top < innerHeight * (1 + NEAR_VIEW)
      );
    };
    const start = (g: Group) => {
      if (state.get(g) !== "pending") return;
      state.set(g, "building");
      started.set(g, performance.now());
      log(`start ${g.id} (${g.units.length} units)`);
      const now =
        BUILD_MODE === "once" && g.id !== "hero"
          ? g.units.filter(near)
          : g.units;
      waiting.set(
        g,
        g.units.filter((u) => !now.includes(u)),
      );
      if (!startSession(g, now.length ? now : g.units, false)) {
        waiting.set(g, g.units);
        loop(); // retried from the loop once agents are free
      }
      status();
    };
    /** Plan waiting units that came near / agents that got free. */
    const pump = () => {
      for (const g of groups) {
        const list = waiting.get(g);
        if (state.get(g) !== "building" || !list?.length) continue;
        const ready = list.filter(near);
        if (!ready.length) continue;
        if (startSession(g, ready, false))
          waiting.set(
            g,
            list.filter((u) => !ready.includes(u)),
          );
      }
    };
    const instant = (g: Group) => {
      const st = state.get(g);
      if (st === "built") return;
      if (st === "building") log(`fast-forward ${g.id}`);
      else log(`instant ${g.id} (jumped over)`);
      state.set(g, "built");
      for (const s of sessions)
        if (s.group === g && !s.done && !s.scrub) endSession(s);
      g.units.forEach((u) => unitBuilt(u, true));
      waiting.set(g, []);
      status();
    };

    hud.set({ agents, total });

    // Hero: build on load only if the gate armed it and we're still at the
    // top (a restored scroll position may have moved us since parsing).
    const hero = groups.find((g) => g.id === "hero");
    for (const g of groups) {
      state.set(g, "pending");
      if (g === hero && !heroPlays) continue;
      g.units.forEach(hideUnit);
    }
    if (getGateState()) setGateState("claimed");
    if (hero) {
      if (heroPlays) start(hero);
      else instant(hero);
    }

    /* ---- once mode: start / fast-forward / jump handling ---- */
    let rafCheck = 0;
    /** A tour scroll is under way: no "scrolled past" fast-forward. */
    let tourScrolling = false;
    let jumping = false;
    let settleTimer: number | undefined;
    let maxTimer: number | undefined;
    const check = () => {
      rafCheck = 0;
      // Nothing left to start or fast-forward (everything built, the
      // normal state after the first pass): no layout reads per scroll.
      if (groups.every((g) => state.get(g) === "built")) return;
      const vh = innerHeight;
      const passed =
        document.querySelector("body header")?.getBoundingClientRect().bottom ??
        0;
      const atBottom =
        scrollY + vh >= document.documentElement.scrollHeight - 2;
      // The tour starts sections as soon as they enter the viewport's
      // bottom band, so they're done while still visible.
      const line = tourScrolling ? TOUR_START_LINE : START_LINE;
      for (const g of groups) {
        const st = state.get(g);
        if (st === "built") continue;
        const r = g.root.getBoundingClientRect();
        if (st === "pending") {
          if (r.bottom <= passed)
            instant(g); // passed without being seen
          else if (!jumping && r.top < vh * line) start(g);
          else if (!jumping && atBottom && r.top < vh) start(g);
        } else if (st === "building") {
          if (tourScrolling) {
            // Tour: no "scrolled past" rule — only an element that reaches
            // the top unbuilt fast-forwards its section (no half-built
            // leftovers).
            if (
              g.units.some(
                (u) =>
                  !built.has(u.el) && u.el.getBoundingClientRect().top < passed,
              )
            )
              instant(g);
          } else if (r.bottom < 0 || r.top > vh) {
            instant(g); // scrolled out mid-build → fast-forward
          }
        }
      }
      if (!jumping) pump();
    };
    const schedule = () => {
      if (!rafCheck) rafCheck = requestAnimationFrame(check);
    };
    const settle = () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(maxTimer);
      jumping = false;
      schedule();
    };
    const onScroll = () => {
      schedule();
      if (jumping) {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settle, 180);
      }
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!a || e.button !== 0) return;
      jumping = true;
      window.clearTimeout(maxTimer);
      maxTimer = window.setTimeout(settle, 2500);
      settleTimer = window.setTimeout(settle, 250);
    };
    const onInput = (e: Event) => {
      const t = e.target as Node | null;
      for (const g of groups)
        if (
          state.get(g) === "building" &&
          t &&
          (g.root.contains(t) ||
            (g === hero && document.querySelector("body header")?.contains(t)))
        )
          instant(g);
    };
    const onResize = () => {
      for (const s of sessions)
        if (!s.done)
          engine.current?.updateBoxes(
            s.id,
            pageBoxes(s.units.map((u) => u.el)),
            pageBox(s.group.root),
          );
      schedule();
    };

    /* ---- scrub mode: one session per group, time = scroll progress ---- */
    const triggers: ScrollTrigger[] = [];
    if (BUILD_MODE === "scrub") {
      for (const g of groups) {
        if (g === hero) continue;
        state.set(g, "building");
        const s = startSession(g, g.units, true);
        if (!s) continue;
        const range = () => {
          const top = g.root.getBoundingClientRect().top + scrollY;
          const max = ScrollTrigger.maxScroll(window);
          const end = Math.min(top - innerHeight * SCRUB_RANGE.end, max);
          return {
            start: Math.min(top - innerHeight * SCRUB_RANGE.start, end - 1),
            end,
          };
        };
        triggers.push(
          ScrollTrigger.create({
            trigger: g.root,
            start: () => range().start,
            end: () => range().end,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              s.t = self.progress * s.plan.duration;
              swarm.render(renderSession(s));
            },
            onToggle: (self) => {
              if (self.isActive) scrubbing.add(g);
              else scrubbing.delete(g);
              status();
            },
          }),
        );
      }
    }

    if (BUILD_MODE === "once") {
      if (location.hash) {
        jumping = true;
        maxTimer = window.setTimeout(settle, 2500);
        settleTimer = window.setTimeout(settle, 250);
      }
      schedule();
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("scrollend", settle);
      document.addEventListener("click", onClick, true);
    }
    addEventListener("resize", onResize);
    for (const ev of ["pointerdown", "keydown", "focusin"])
      document.addEventListener(ev, onInput, true);

    /* ---- tour API ---- */
    const allInViewBuilt = () => {
      const top =
        document.querySelector("body header")?.getBoundingClientRect().bottom ??
        0;
      const vh = innerHeight;
      for (const g of groups) {
        if (state.get(g) === "pending") continue; // starts on the next step
        for (const u of g.units) {
          if (built.has(u.el)) continue;
          const r = u.el.getBoundingClientRect();
          if (r.bottom > top && r.top < vh) return false;
        }
      }
      return true;
    };
    /** Everything back to unbuilt (hidden + wireframes on rebuild), then
     *  the hero rebuilds. Our entrance-skip logic stays on (build active). */
    const resetAll = () => {
      for (const s of sessions) s.done = true;
      sessions.splice(0);
      agentSession.fill(null);
      setLayers([]);
      waiting.clear();
      started.clear();
      crewWait.clear();
      built.clear();
      for (const g of groups) {
        state.set(g, "pending");
        g.units.forEach((u) => {
          hideUnit(u);
          if (u.id) setBuilt(u.id, false);
        });
      }
      hud.set({ hidden: false });
      status();
      if (hero) start(hero);
    };
    let tour: Tour | null = null;
    if (BUILD_MODE === "once" && AUTO_TOUR !== "off") {
      tour = createTour(
        {
          heroPlayedOnLoad: heroPlays,
          heroBuilt: () => !hero || state.get(hero) === "built",
          allInViewBuilt,
          unbuiltInTop(share) {
            const top =
              document.querySelector("body header")?.getBoundingClientRect()
                .bottom ?? 0;
            const bottom = innerHeight * share;
            let n = 0;
            for (const g of groups)
              for (const u of g.units) {
                if (built.has(u.el)) continue;
                const r = u.el.getBoundingClientRect();
                if (r.bottom > top && r.top < bottom) n++;
              }
            return n;
          },
          subscribe(l) {
            listeners.add(l);
            return () => listeners.delete(l);
          },
          setTourScrolling(on) {
            tourScrolling = on;
            if (!on) schedule(); // normal rules resume at once
          },
          resetAll,
        },
        hud,
        log,
      );
      tourRef.current = tour;
    }

    engine.current = {
      sessions,
      registerParts(id, parts) {
        const s = sessions.find((x) => x.id === id);
        if (!s) return;
        s.parts = parts;
        s.keys = [];
        if (parts) renderSession(s); // initial state before first paint
      },
      updateBoxes(id, boxes, section) {
        const s = sessions.find((x) => x.id === id);
        if (!s) return;
        s.boxes = boxes;
        s.section = section;
        setLayers((l) => [...l]); // wires re-render at the new positions
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rafCheck);
      window.clearTimeout(settleTimer);
      window.clearTimeout(maxTimer);
      triggers.forEach((t) => t.kill());
      removeEventListener("scroll", onScroll);
      removeEventListener("scrollend", settle);
      removeEventListener("resize", onResize);
      document.removeEventListener("click", onClick, true);
      for (const ev of ["pointerdown", "keydown", "focusin"])
        document.removeEventListener(ev, onInput, true);
      engine.current = null;
      tour?.destroy();
      tourRef.current = null;
      setLayers([]);
      // Builds no longer allowed (narrow window, reduced motion, unmount):
      // the page goes back to normal, everything visible.
      groups.forEach((g) => g.units.forEach(showUnit));
      document.querySelectorAll(`[${SELECTOR_MARK}]`).forEach((el) => {
        el.removeAttribute("data-build");
        el.removeAttribute("data-build-type");
        el.removeAttribute(SELECTOR_MARK);
      });
      html.removeAttribute("data-acb-site");
      setBuildActive(false);
    };
  }, [groups, hud, agents, heroPlays]);

  const renderLayer = useCallback(
    (s: Session) => <SessionLayer key={s.id} session={s} engine={engine} />,
    [],
  );

  return (
    <>
      {layers.map(renderLayer)}
      <div ref={swarmLayer} className="acb-swarm" aria-hidden="true">
        {Array.from({ length: agents }, (_, k) => (
          <Agent
            key={k}
            index={k}
            color={AGENT_PALETTE[k % AGENT_PALETTE.length]}
          />
        ))}
      </div>
      <Hud
        store={hud as HudStore}
        onStop={() => tourRef.current?.stop("button")}
        onReplay={() => tourRef.current?.replay()}
      />
    </>
  );
}

/** Short element description for ?introDebug=1 logs. */
function describe(u: Unit) {
  const txt = (u.el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 16);
  return `${u.type}:${u.el.tagName.toLowerCase()}${txt ? `"${txt}"` : ""}`;
}

/** One session's wireframes (page coordinates, portal into <body>). */
function SessionLayer({
  session,
  engine,
}: {
  session: Session;
  engine: RefObject<Engine | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const parts = Array.from(
      ref.current!.querySelectorAll<HTMLElement>("[data-wire]"),
    ).map(wireParts);
    const eng = engine.current;
    eng?.registerParts(session.id, parts);
    return () => eng?.registerParts(session.id, null);
  }, [session, engine]);

  // Re-measure while mounted (fonts, images, layout changes).
  useEffect(() => {
    const update = () =>
      engine.current?.updateBoxes(
        session.id,
        pageBoxes(session.units.map((u) => u.el)),
        pageBox(session.group.root),
      );
    const ro = new ResizeObserver(update);
    ro.observe(session.group.root);
    return () => ro.disconnect();
  }, [session, engine]);

  return createPortal(
    <div ref={ref} className="acb-layer" aria-hidden="true">
      {session.units.map((u, i) => (
        <Wire
          key={i}
          box={session.boxes[i]}
          section={session.section}
          type={u.type}
          color={AGENT_PALETTE[i % AGENT_PALETTE.length]}
          seed={`${session.id}:${i}`}
        />
      ))}
    </div>,
    document.body,
  );
}
