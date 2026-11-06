import type {
  OrbitConfig,
  SolarSystemItem,
} from "@/components/ui/solar-system";
import type { CodeSample, Skill, SkillGroup } from "@/data/profile";
import { getSkillBrand } from "@/lib/skill-icons";

/**
 * Maps profile.skills (content, 6 groups) to the Skills UI:
 *  - `groups`: one per profile group — used by the filter tabs and the
 *    mobile chip layout.
 *  - `orbits`: rings for the SolarSystem. Several groups can share a ring.
 *
 * Why share rings: with 6 labelled rings in a ~470px radius, neighbouring
 * rings are ~46px apart but a label pill is ~110px wide, so pills overlapped
 * constantly (measured: avg 5.7 overlapping pairs, worst 10, across a full
 * revolution). 4 rings → avg 1.0, worst 3, at the same label size.
 */

/** Ring composition, inner → outer, by profile group id. */
export const RING_LAYOUT: string[][] = [
  ["frontend"],
  ["backend", "data"],
  ["testing", "devops"],
  ["learning"],
];

// Geometry/motion, in design-px (1:1 at the SolarSystem designWidth, 960 in
// SkillsExplorer; scales down with the container).
const INNER_RADIUS = 150;
const OUTER_RADIUS = 405;
const SPEEDS = [70, 95, 120, 140];
const LEARNING_SPEED = 190;
/**
 * Starting angle per ring (fraction of a turn). Found by brute-force search
 * over the static reduced-motion layout (1/12-turn grid): with all rings at
 * 0 their first planets line up and 10 label pairs overlap; these give 0.
 */
const RING_PHASES = [0, 1 / 3, 1 / 6, 0];
/** Readability limit established above — more rings overlap constantly. */
export const MAX_RINGS = 4;

export interface SkillItem extends SolarSystemItem {
  sample: CodeSample;
  groupId: string;
  ringId: string;
}

export interface SkillOrbit extends OrbitConfig {
  items: SkillItem[];
  learning: boolean;
}

export interface SkillGroupView {
  id: string;
  name: string;
  learning: boolean;
  items: SkillItem[];
}

function toItem(skill: Skill, group: SkillGroup, ringId: string): SkillItem {
  const brand = getSkillBrand(skill.id);
  return {
    id: skill.id,
    label: skill.name,
    type: group.name,
    badge:
      skill.badge ?? (group.status === "learning" ? "Learning" : undefined),
    desc: skill.desc,
    color: brand.color,
    svg: brand.icon,
    code: skill.code.source,
    sample: skill.code,
    groupId: group.id,
    ringId,
  };
}

export function skillsToOrbits(groups: SkillGroup[]): {
  orbits: SkillOrbit[];
  groups: SkillGroupView[];
} {
  const byId = new Map(groups.map((g) => [g.id, g]));

  // Validate the layout against the data: every group on exactly one ring.
  const placed = RING_LAYOUT.flat();
  const unknown = placed.filter((id) => !byId.has(id));
  const missing = groups.filter((g) => !placed.includes(g.id)).map((g) => g.id);
  if (unknown.length || missing.length || RING_LAYOUT.length > MAX_RINGS) {
    throw new Error(
      `skillsToOrbits: RING_LAYOUT out of sync with profile.skills ` +
        `(unknown: ${unknown.join(", ") || "-"}; unplaced: ${missing.join(", ") || "-"}; ` +
        `rings: ${RING_LAYOUT.length}/${MAX_RINGS})`,
    );
  }

  const orbits: SkillOrbit[] = RING_LAYOUT.map((ids, i) => {
    const ringGroups = ids.map((id) => byId.get(id)!);
    const ringId = ids.join("+");
    const learning = ringGroups.every((g) => g.status === "learning");
    const t = RING_LAYOUT.length === 1 ? 1 : i / (RING_LAYOUT.length - 1);
    return {
      id: ringId,
      name: ringGroups.map((g) => g.name).join(" & "),
      radiusPx: Math.round(INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * t),
      speed: learning ? LEARNING_SPEED : (SPEEDS[i] ?? 140),
      direction: i % 2 === 0 ? 1 : -1,
      phase: RING_PHASES[i] ?? 0,
      variant: learning ? "muted" : "default",
      learning,
      items: ringGroups.flatMap((g) =>
        g.skills.map((s) => toItem(s, g, ringId)),
      ),
    };
  });

  const itemById = new Map(
    orbits.flatMap((o) => o.items).map((it) => [it.id, it]),
  );
  const groupViews: SkillGroupView[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    learning: g.status === "learning",
    items: g.skills.map((s) => itemById.get(s.id)!),
  }));

  return { orbits, groups: groupViews };
}
