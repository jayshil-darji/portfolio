/*
 * Agent renderer (lazy chunk). The swarm lives in ONE fixed, viewport-space
 * layer (constant on-screen size). The builder's single rAF loop hands it
 * sampled page positions; it:
 *  - converts them to screen space with the current scroll offset and
 *    clamps them into the viewport (agents never work off-screen);
 *  - keeps CURSOR_GAP of empty space between cursors (idle agents are
 *    fixed obstacles);
 *  - tilts each cursor toward its travel direction, and fires a click
 *    ripple + a small press (scale 0.9) at every other scribble waypoint;
 *  - for the "orb" style, draws a short trail from a preallocated ring
 *    buffer of recent positions (collapses when the agent stops).
 * Each agent's position is its HOTSPOT (pointer/arrow tip, reticle/orb
 * centre): the scribble path and the ripples originate there.
 * Agents not driven by any build keep their last screen position (being
 * fixed, they travel with the user's scroll) and drift gently via CSS.
 * Only transforms (and the ripple's opacity) are animated, and a value is
 * only written when it changed: every inline-style / data-* write
 * invalidates style, and most agents sit still most of the frames.
 */

import { CURSOR_GAP, CURSOR_SIZE, SHOW_LABELS, TASK_LABELS } from "./config";

export interface AgentFrame {
  id: number;
  x: number; // page px (hotspot)
  y: number;
  /** Progress of the element being worked on; -1 when not working. */
  progress: number;
  step: number;
}

export interface Swarm {
  render(frames: AgentFrame[]): void;
  /** Wave off: fade out (everything built). */
  leave(): void;
  /** Come back (scrub mode: scrolling up un-builds). */
  back(): void;
}

/** Trail: dots at these frame lags behind the orb (ring buffer size). */
const TRAIL_LAGS = [3, 6, 9, 12];
const TRAIL_LEN = 13;

const RIPPLE: Keyframe[] = [
  { transform: "translate(-50%, -50%) scale(0.2)", opacity: 0.9 },
  { transform: "translate(-50%, -50%) scale(2.2)", opacity: 0 },
];
const RIPPLE_TIMING: KeyframeAnimationOptions = {
  duration: 520,
  easing: "ease-out",
};

export function createSwarm(layer: HTMLElement): Swarm {
  const agents = Array.from(layer.querySelectorAll<HTMLElement>(".acb-agent"));
  const n = agents.length;
  const bodies = agents.map((a) =>
    a.querySelector<HTMLElement>(".acb-agent-body")!,
  );
  const rings = agents.map((a) => a.querySelector<HTMLElement>(".acb-ring")!);
  const trails = agents.map((a) =>
    Array.from(a.querySelectorAll<HTMLElement>(".acb-trail")),
  );
  const lastStep = new Int16Array(n).fill(-1);
  // Last written values (skip unchanged writes).
  const lastMove: string[] = new Array(n).fill("");
  const lastBody: string[] = new Array(n).fill("");
  const lastFlags: string[] = new Array(n).fill("");
  const setAttr = (el: HTMLElement, key: string, value: string) => {
    if (el.dataset[key] !== value) el.dataset[key] = value;
  };
  const tilt = new Float32Array(n);
  const pressUntil = new Float64Array(n);
  // Orb trail history: TRAIL_LEN (x, y) pairs per agent, ring-indexed.
  const hist = new Float32Array(n * TRAIL_LEN * 2);
  const head = new Int16Array(n);

  // Labels (SHOW_LABELS only): text + collision widths.
  const pills = SHOW_LABELS
    ? agents.map((a) => a.querySelector<HTMLElement>(".acb-pill"))
    : [];
  const text: string[] = agents.map((_, i) => `Agent-${i + 1}`);
  const labelOf = (f: AgentFrame) =>
    f.progress < 0
      ? `Agent-${f.id + 1}`
      : `Agent-${f.id + 1} · ${TASK_LABELS[Math.min(TASK_LABELS.length - 1, Math.floor(f.progress * TASK_LABELS.length))]}`;
  const widthOf = (label: string) =>
    SHOW_LABELS ? 30 + label.length * 6.4 : CURSOR_SIZE + CURSOR_GAP;
  const rowH = SHOW_LABELS ? 28 : CURSOR_SIZE + CURSOR_GAP;
  const maxX = innerWidth - (SHOW_LABELS ? 130 : 30);

  // Start clustered mid-screen (like the reference); the first build fans
  // out from the centre.
  const screen = agents.map((_, i) => ({
    x: innerWidth / 2 + ((i % 4) - 1.5) * (SHOW_LABELS ? 96 : 36),
    y: innerHeight * 0.5 + (Math.floor(i / 4) - 1) * (SHOW_LABELS ? 30 : 36),
  }));
  agents.forEach((a, i) => {
    a.style.transform = `translate3d(${screen[i].x}px, ${screen[i].y}px, 0)`;
    for (let k = 0; k < TRAIL_LEN; k++) {
      hist[(i * TRAIL_LEN + k) * 2] = screen[i].x;
      hist[(i * TRAIL_LEN + k) * 2 + 1] = screen[i].y;
    }
  });

  return {
    render(frames) {
      const sx = scrollX;
      const sy = scrollY;
      const top = 64; // below the sticky navbar
      const bottom = innerHeight - 40;
      const now = performance.now();

      // Collision boxes anchored at the hotspot; idle agents are obstacles.
      type R = { x: number; y: number; w: number; free: boolean };
      const live = new Set(frames.map((f) => f.id));
      const boxes: R[] = frames.map((f) => ({
        x: Math.max(8, Math.min(maxX, f.x - sx)),
        y: Math.max(top, Math.min(bottom, f.y - sy)),
        w: widthOf(SHOW_LABELS ? labelOf(f) : ""),
        free: true,
      }));
      screen.forEach((p, i) => {
        if (!live.has(i))
          boxes.push({ x: p.x, y: p.y, w: widthOf(text[i]), free: false });
      });
      // A pile of N agents against an edge needs ~N passes to unstack.
      for (let pass = 0; pass < 20; pass++) {
        let moved = false;
        for (let a = 0; a < boxes.length; a++)
          for (let b = a + 1; b < boxes.length; b++) {
            const A = boxes[a];
            const B = boxes[b];
            const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
            const oy = Math.min(A.y + rowH, B.y + rowH) - Math.max(A.y, B.y);
            if (ox <= 0 || oy <= 0) continue;
            const [m, o] = B.free ? [B, A] : A.free ? [A, B] : [null, null];
            if (!m || !o) continue;
            // Move along the axis that needs less; flip at the viewport
            // edges; the other axis as the last resort.
            if (oy <= ox) {
              const dir = m.y >= o.y ? 1 : -1;
              let ny = o.y + dir * rowH;
              if (ny < top || ny > bottom) ny = o.y - dir * rowH;
              if (ny >= top && ny <= bottom) m.y = ny;
              else
                m.x = Math.max(
                  8,
                  Math.min(maxX, m.x >= o.x ? o.x + o.w : o.x - m.w),
                );
            } else {
              const nx = m.x >= o.x ? o.x + o.w : o.x - m.w;
              if (nx >= 8 && nx <= maxX) m.x = nx;
              else
                m.y = Math.max(
                  top,
                  Math.min(bottom, m.y >= o.y ? o.y + rowH : o.y - rowH),
                );
            }
            moved = true;
          }
        if (!moved) break;
      }

      setAttr(layer, "moving", "true");
      for (let k = 0; k < frames.length; k++) {
        const f = frames[k];
        const i = f.id;
        const p = boxes[k];
        const dx = p.x - screen[i].x;
        const dy = p.y - screen[i].y;
        const moving = Math.abs(dx) + Math.abs(dy) > 0.6;
        screen[i].x = p.x;
        screen[i].y = p.y;
        const move = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
        if (move !== lastMove[i]) agents[i].style.transform = lastMove[i] = move;
        const working = f.progress >= 0;
        const travel = moving && !working;
        const flags = `${working}${travel}`;
        if (flags !== lastFlags[i]) {
          lastFlags[i] = flags;
          agents[i].dataset.working = String(working);
          agents[i].dataset.travel = String(travel);
        }

        // Click ripple + press at every other scribble waypoint.
        if (f.step > lastStep[i] && f.step >= 0 && f.step % 2 === 0) {
          rings[i].animate(RIPPLE, RIPPLE_TIMING);
          pressUntil[i] = now + 140;
        }
        lastStep[i] = f.step;

        // Tilt toward the travel direction (eased), press scale.
        const want = moving ? Math.max(-14, Math.min(14, dx * 1.6)) : 0;
        tilt[i] += (want - tilt[i]) * 0.2;
        const scale = now < pressUntil[i] ? 0.9 : 1;
        // Snap a nearly settled tilt to 0 so a still agent stops writing.
        if (!moving && Math.abs(tilt[i]) < 0.05) tilt[i] = 0;
        const body = `rotate(${tilt[i].toFixed(2)}deg) scale(${scale})`;
        if (body !== lastBody[i]) bodies[i].style.transform = lastBody[i] = body;

        // Orb trail: push the current position; dots trail at fixed lags;
        // a stopped orb collapses its trail onto itself.
        if (trails[i].length) {
          const h = (head[i] = (head[i] + 1) % TRAIL_LEN);
          const base = i * TRAIL_LEN;
          if (!moving)
            for (let t = 0; t < TRAIL_LEN; t++) {
              hist[(base + t) * 2] = p.x;
              hist[(base + t) * 2 + 1] = p.y;
            }
          hist[(base + h) * 2] = p.x;
          hist[(base + h) * 2 + 1] = p.y;
          trails[i].forEach((dot, d) => {
            const at = (h - TRAIL_LAGS[d] + TRAIL_LEN) % TRAIL_LEN;
            const tx = hist[(base + at) * 2] - p.x;
            const ty = hist[(base + at) * 2 + 1] - p.y;
            dot.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) translate(-50%, -50%)`;
          });
        }

        if (SHOW_LABELS) {
          const label = labelOf(f);
          if (label !== text[i]) pills[i]!.textContent = text[i] = label;
        }
      }
    },
    leave() {
      setAttr(layer, "leaving", "true");
      setAttr(layer, "moving", "false");
    },
    back() {
      setAttr(layer, "leaving", "false");
    },
  };
}

/** Screen → page position of an agent's last rendered spot. */
export function agentPagePositions(
  layer: HTMLElement,
): { x: number; y: number }[] {
  return Array.from(layer.querySelectorAll<HTMLElement>(".acb-agent")).map(
    (a) => {
      const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(a.style.transform);
      return {
        x: (m ? +m[1] : innerWidth) + scrollX,
        y: (m ? +m[2] : innerHeight / 2) + scrollY,
      };
    },
  );
}
