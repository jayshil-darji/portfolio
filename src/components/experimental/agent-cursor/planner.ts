/*
 * Work planner (pure; lazy chunk). Given a section's elements, the agents
 * available and a duration, it plans who builds what, when — then any
 * moment of that plan can be sampled with `sample(plan, t)`. Once mode
 * drives `t` with a clock, scrub mode with scroll progress: same plan,
 * same picture.
 *
 *   scaffold (PHASES.scaffold): every wireframe draws in, slightly staggered
 *   work     (PHASES.work):     a queue sorted top→bottom, left→right;
 *            agents take elements round-robin (large ones get up to
 *            MAX_AGENTS_PER_ELEMENT), and when an agent finishes it takes
 *            the nearest unclaimed element. Travel = eased arc, duration by
 *            distance (≥ TRAVEL.min); work = seeded scribble inside the box.
 *   finish   (PHASES.finish):   labels/guides/outlines fade, agents regroup.
 *
 * Positions are anchors relative to element / section boxes, resolved
 * against the CURRENT boxes at sample time, so a re-measure (resize) never
 * needs a re-plan.
 */

import {
  LARGE_AREA_SHARE,
  MAX_AGENTS_PER_ELEMENT,
  PHASES,
  TEMPO,
  TRAVEL,
  DEPART_STAGGER,
  type AgentBuildType,
} from "./config";

/** Work slot (s) for priority elements (hero name / roles). */
const PRIORITY_WORK = 0.55 * TEMPO;
import { seeded } from "./seeded";
import type { Box } from "./wire";

/** Point relative to a box: ref ≥ 0 element, -1 section, -2 absolute page px. */
export interface Anchor {
  ref: number;
  fx: number;
  fy: number;
}

export interface PlanElement {
  /** Index into the session's element list (and its boxes). */
  index: number;
  type: AgentBuildType;
  priority: boolean;
  large: boolean;
  scaffoldAt: number;
  workStart: number;
  workEnd: number;
  agents: number[];
}

type Segment =
  | {
      kind: "travel";
      t0: number;
      t1: number;
      from: Anchor;
      to: Anchor;
      bend: number;
    }
  | { kind: "work"; t0: number; t1: number; el: number; way: Anchor[] }
  | { kind: "idle"; t0: number; t1: number; at: Anchor };

export interface Plan {
  duration: number;
  scaffoldEnd: number;
  finishStart: number;
  elements: PlanElement[];
  /** Agent id → its segments in time order (only agents that got work). */
  agents: Map<number, Segment[]>;
  /** Agent id → when its last task ends (it may join another session then). */
  freeAt: Map<number, number>;
}

export interface PlanInput {
  seed: string;
  duration: number;
  section: Box;
  elements: { box: Box; type: AgentBuildType; priority: boolean }[];
  /** Free agents with their current page position. */
  agents: { id: number; x: number; y: number }[];
  /** Where agents regroup in the finish (page px). */
  regroup: { x: number; y: number };
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export function resolve(a: Anchor, boxes: Box[], section: Box) {
  const b = a.ref >= 0 ? boxes[a.ref] : a.ref === -1 ? section : null;
  if (!b) return { x: a.fx, y: a.fy };
  return { x: b.x + a.fx * b.w, y: b.y + a.fy * b.h };
}

export function makePlan(input: PlanInput): Plan {
  const { duration: D, section, elements, agents } = input;
  const rand = seeded(input.seed);
  const scaffoldEnd = D * PHASES.scaffold;
  const finishStart = D * (PHASES.scaffold + PHASES.work);
  const sectionArea = Math.max(1, section.w * section.h);

  // Queue: priority first (hero name / roles), then top→bottom, left→right.
  const order = elements
    .map((e, index) => ({ ...e, index }))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      const row = Math.round(a.box.y / 40) - Math.round(b.box.y / 40);
      return row || a.box.x - b.box.x;
    });
  const n = order.length;
  const planned: PlanElement[] = elements.map((e, index) => ({
    index,
    type: e.type,
    priority: e.priority,
    large:
      e.type === "image" ||
      (e.box.w * e.box.h) / sectionArea > LARGE_AREA_SHARE,
    // Scaffold: all wireframes within the first 60% of the phase.
    scaffoldAt: 0,
    workStart: 0,
    workEnd: 0,
    agents: [],
  }));
  order.forEach((e, i) => {
    planned[e.index].scaffoldAt = (n > 1 ? i / (n - 1) : 0) * scaffoldEnd * 0.4;
  });
  // Per-element work weight: bigger and image elements take longer.
  const weight = planned.map((p) => {
    const b = elements[p.index].box;
    // Narrow range: elements of one session work side by side rather than
    // small ones finishing long before big ones.
    const size = Math.min(
      1.25,
      0.9 + 0.5 * Math.sqrt((b.w * b.h) / sectionArea),
    );
    return size * (0.9 + rand() * 0.2);
  });
  // Seeded per-agent jitter used by every simulation pass (deterministic).
  const jitter = agents.map(() => ({
    fx: 0.12 + rand() * 0.3,
    fy: 0.3 + rand() * 0.4,
    bend: (rand() * 2 - 1) * 0.22,
    ways: 2 + Math.floor(rand() * 3),
    seed: rand(),
  }));

  // Simulate with work unit W; adjust W so the work ends by finishStart.
  const simulate = (W: number) => {
    const els = planned.map((p) => ({ ...p, agents: [] as number[] }));
    const helpersLeft = els.map((e) =>
      e.large ? MAX_AGENTS_PER_ELEMENT - 1 : 0,
    );
    const segs = new Map<number, Segment[]>();
    const st = agents.map((a, j) => ({
      id: a.id,
      j,
      t: scaffoldEnd * 0.5 + j * DEPART_STAGGER,
      pos: { x: a.x, y: a.y },
      at: { ref: -2, fx: a.x, fy: a.y } as Anchor,
    }));
    st.forEach((s) => segs.set(s.id, []));
    const unclaimed = order.map((e) => e.index);

    const centre = (i: number) => {
      const b = elements[i].box;
      return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    };
    const go = (s: (typeof st)[number], i: number, helper: boolean) => {
      const jt = jitter[s.j];
      const target: Anchor = {
        ref: i,
        fx: helper ? 1 - jt.fx : jt.fx,
        fy: jt.fy,
      };
      const tp = resolve(
        target,
        elements.map((e) => e.box),
        section,
      );
      const d = dist(s.pos, tp);
      const dur = Math.min(TRAVEL.max, Math.max(TRAVEL.min, d / TRAVEL.speed));
      segs.get(s.id)!.push({
        kind: "travel",
        t0: s.t,
        t1: s.t + dur,
        from: s.at,
        to: target,
        bend: jt.bend,
      });
      s.t += dur;
      const e = els[i];
      if (!helper) {
        e.workStart = s.t;
        // Priority elements (hero name / roles) get a short fixed slot so
        // they're readable early; the rest share the work phase.
        e.workEnd = e.priority
          ? s.t + PRIORITY_WORK
          : s.t + (W * weight[i]) / (helpersLeft[i] > 0 || e.large ? 1.3 : 1);
      }
      const t1 = Math.max(s.t + 0.15 * TEMPO, e.workEnd);
      // Scribble: 2–4 seeded waypoints inside the element.
      const r2 = seeded(`${input.seed}:${s.id}:${i}`);
      const way: Anchor[] = [target];
      for (let k = 0; k < jt.ways; k++)
        way.push({ ref: i, fx: 0.1 + r2() * 0.8, fy: 0.2 + r2() * 0.6 });
      segs.get(s.id)!.push({ kind: "work", t0: s.t, t1, el: i, way });
      e.agents.push(s.id);
      s.t = t1;
      s.at = way[way.length - 1];
      s.pos = resolve(
        s.at,
        elements.map((x) => x.box),
        section,
      );
    };

    // Round-robin: one agent per element in queue order, then helpers on
    // large elements, the rest idle.
    for (const s of st) {
      if (unclaimed.length) {
        go(s, unclaimed.shift()!, false);
        continue;
      }
      const big = order.find(
        (e) => helpersLeft[e.index] > 0 && els[e.index].workEnd > s.t + 0.3,
      );
      if (big) {
        helpersLeft[big.index]--;
        go(s, big.index, true);
      }
    }
    // When an agent finishes, it takes the nearest unclaimed element.
    while (unclaimed.length) {
      const s = st.reduce((a, b) => (b.t < a.t ? b : a));
      let best = 0;
      for (let k = 1; k < unclaimed.length; k++)
        if (
          dist(s.pos, centre(unclaimed[k])) <
          dist(s.pos, centre(unclaimed[best]))
        )
          best = k;
      go(s, unclaimed.splice(best, 1)[0], false);
    }
    const end = Math.max(...els.map((e) => e.workEnd));
    return { els, segs, st, end };
  };

  let W = 1.1 * TEMPO;
  let sim = simulate(W);
  for (let k = 0; k < 4; k++) {
    const first = Math.min(...sim.els.map((e) => e.workStart));
    const want = finishStart - first;
    const got = sim.end - first;
    if (got <= 0 || Math.abs(got - want) < 0.03) break;
    W = Math.max(0.15 * TEMPO, W * (want / got));
    sim = simulate(W);
  }

  // Agents that got no work stay out of this plan (free for other
  // sessions). The rest idle near their last element, then regroup.
  const reg: Anchor = { ref: -2, fx: input.regroup.x, fy: input.regroup.y };
  const freeAt = new Map<number, number>();
  for (const s of sim.st) {
    const list = sim.segs.get(s.id)!;
    if (!list.some((g) => g.kind === "work")) {
      sim.segs.delete(s.id);
      continue;
    }
    freeAt.set(s.id, s.t);
    const leave = Math.max(s.t, finishStart);
    if (leave > s.t) list.push({ kind: "idle", t0: s.t, t1: leave, at: s.at });
    // Regroup grid keyed by agent id (unique across sessions): 3 columns
    // a pill-width apart, rows 30px apart.
    const off: Anchor = {
      ...reg,
      fx: reg.fx + (s.id % 3) * 96 - 192,
      fy: reg.fy + Math.floor(s.id / 3) * 30 - 60,
    };
    list.push({
      kind: "travel",
      t0: leave,
      t1: Math.max(leave + TRAVEL.min, D),
      from: s.at,
      to: off,
      bend: jitter[s.j].bend,
    });
  }

  return {
    duration: Math.max(D, sim.end),
    scaffoldEnd,
    finishStart,
    elements: sim.els,
    agents: sim.segs,
    freeAt,
  };
}

/* ---------- sampling ---------- */

const ease = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export interface AgentSample {
  x: number;
  y: number;
  /** Element being worked on (index) or -1. */
  el: number;
  /** Progress (0–1) of the element being worked on, -1 when not working. */
  progress: number;
  /** Scribble waypoint index (changes → click pulse). */
  step: number;
}

export function sampleAgent(
  segs: Segment[],
  t: number,
  plan: Plan,
  boxes: Box[],
  section: Box,
): AgentSample {
  const seg = segs.find((s) => t < s.t1) ?? segs[segs.length - 1];
  const R = (a: Anchor) => resolve(a, boxes, section);
  if (seg.kind === "idle") {
    const p = R(seg.at);
    // Gentle drift near the last element.
    return {
      x: p.x + Math.sin(t * 1.3) * 6,
      y: p.y + Math.cos(t * 1.1) * 5,
      el: -1,
      progress: -1,
      step: -1,
    };
  }
  const f = clamp01((t - seg.t0) / Math.max(0.001, seg.t1 - seg.t0));
  if (seg.kind === "travel") {
    const a = R(seg.from);
    const b = R(seg.to);
    const e = ease(f);
    // Quadratic arc: control point offset perpendicular to the path.
    const mx = (a.x + b.x) / 2 - (b.y - a.y) * seg.bend;
    const my = (a.y + b.y) / 2 + (b.x - a.x) * seg.bend;
    const u = 1 - e;
    return {
      x: u * u * a.x + 2 * u * e * mx + e * e * b.x,
      y: u * u * a.y + 2 * u * e * my + e * e * b.y,
      el: -1,
      progress: -1,
      step: -1,
    };
  }
  // Working: ease between scribble waypoints.
  const pts = seg.way.map(R);
  const span = f * (pts.length - 1);
  const k = Math.min(pts.length - 2, Math.floor(span));
  const lf = ease(span - k);
  const el = plan.elements[seg.el];
  const prog = clamp01(
    (t - el.workStart) / Math.max(0.001, el.workEnd - el.workStart),
  );
  return {
    x: pts[k].x + (pts[k + 1].x - pts[k].x) * lf,
    y: pts[k].y + (pts[k + 1].y - pts[k].y) * lf,
    el: seg.el,
    progress: prog,
    step: k,
  };
}

export interface ElementSample {
  /** 0→1 wireframe draw-in. */
  scaffold: number;
  /** 0→1 real-element reveal. */
  progress: number;
  working: boolean;
  /** 0→1 finish fade (labels/guides first, then the whole wire). */
  finish: number;
}

export function sampleElement(plan: Plan, i: number, t: number): ElementSample {
  const e = plan.elements[i];
  const scaffold = clamp01(
    (t - e.scaffoldAt) / Math.max(0.001, plan.scaffoldEnd * 0.6),
  );
  const progress = clamp01(
    (t - e.workStart) / Math.max(0.001, e.workEnd - e.workStart),
  );
  return {
    scaffold: ease(scaffold),
    progress,
    working: t >= e.workStart && t < e.workEnd,
    finish: clamp01(
      (t - plan.finishStart) /
        Math.max(0.001, plan.duration - plan.finishStart),
    ),
  };
}
