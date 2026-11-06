import type { Project } from "@/data/profile";

/**
 * Column spans for the Projects bento — no empty cells in any state.
 *
 * Desktop (lg, 6 cols):
 *   collapsed: featured tiles pair up (3+3); personal tiles go in threes
 *              (2+2+2), a leftover pair is 3+3, a single leftover is 6.
 *   expanded:  the open tile is full width (6); the rest pair up (3+3) in
 *              DOM order. A tile that would be left alone on its row —
 *              right before the open tile or at the end — goes full width.
 * Tablet (md, 2 cols): same pairing with 1+1 / 2; featured tiles are full
 *   width while nothing is open.
 * Mobile: one column.
 *
 * DOM order is never changed (no `grid-auto-flow: dense`), so keyboard /
 * screen-reader order always matches the visual order.
 */

// Literal class strings so Tailwind generates them.
const LG = {
  half: "lg:col-span-3",
  full: "lg:col-span-6",
  third: "lg:col-span-2",
};
const MD = { half: "md:col-span-1", full: "md:col-span-2" };

type Span = "half" | "full" | "third";

/** Pair tiles in order; `breaks` (open tile, or featured) take a full row. */
function pairUp(ids: string[], breaks: Set<string>): Map<string, Span> {
  const out = new Map<string, Span>();
  let pending: string | null = null;
  for (const id of ids) {
    if (breaks.has(id)) {
      if (pending) out.set(pending, "full");
      pending = null;
      out.set(id, "full");
    } else if (pending) {
      out.set(pending, "half");
      out.set(id, "half");
      pending = null;
    } else {
      pending = id;
    }
  }
  if (pending) out.set(pending, "full");
  return out;
}

function lgCollapsed(projects: Project[]): Map<string, Span> {
  const out = new Map<string, Span>();
  const featured = projects.filter((p) => p.featured).map((p) => p.slug);
  const rest = projects.filter((p) => !p.featured).map((p) => p.slug);
  pairUp(featured, new Set()).forEach((v, k) => out.set(k, v));
  const tail = rest.length % 3;
  rest.forEach((id, i) => {
    const inTail = i >= rest.length - tail;
    out.set(id, !inTail ? "third" : tail === 2 ? "half" : "full");
  });
  return out;
}

export function bentoSpans(
  projects: Project[],
  expandedId: string | null,
): Map<string, string> {
  const ids = projects.map((p) => p.slug);
  const open = new Set(expandedId ? [expandedId] : []);
  const lg = expandedId ? pairUp(ids, open) : lgCollapsed(projects);
  const md = expandedId
    ? pairUp(ids, open)
    : pairUp(
        ids,
        new Set(projects.filter((p) => p.featured).map((p) => p.slug)),
      );
  return new Map(
    ids.map((id) => [
      id,
      `${MD[md.get(id) as "half" | "full"]} ${LG[lg.get(id)!]}`,
    ]),
  );
}
