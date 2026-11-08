"use client";

import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { SolarSystem } from "@/components/ui/solar-system";
import type { SkillGroupView, SkillOrbit } from "@/lib/skills-to-orbits";
import { cn } from "@/lib/utils";
import { SkillChips } from "./skill-chips";
import { SkillDetail } from "./skill-detail";

const ALL = "all";

/**
 * Skills UI around the Vengeance UI SolarSystem.
 * LOCAL (not in upstream): filter tabs, click-to-select, the code "editor"
 * sidebar and the mobile chip layout — the Vengeance docs describe these but
 * the published component doesn't implement them.
 *
 * - lg+: 3D orbit (4 rings; planets outside the active filter recede) +
 *   detail sidebar (side-by-side from xl, stacked at lg).
 * - below lg: chips grouped by skill group, with the same filter tabs.
 * Filters are the 6 profile groups even though some groups share a ring.
 */
export function SkillsExplorer({
  orbits,
  groups,
  centerInitials,
  centerAlt,
  defaultSelectedId,
}: {
  orbits: SkillOrbit[];
  groups: SkillGroupView[];
  centerInitials: string;
  centerAlt: string;
  defaultSelectedId?: string;
}) {
  const [filter, setFilter] = useState<string>(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultSelectedId ?? groups[0]?.items[0]?.id ?? null,
  );

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const selected = allItems.find((i) => i.id === selectedId) ?? null;
  const activeGroup = groups.find((g) => g.id === filter) ?? null;
  const visibleGroups = activeGroup ? [activeGroup] : groups;
  const highlightIds = useMemo(
    () => (activeGroup ? activeGroup.items.map((i) => i.id) : null),
    [activeGroup],
  );

  function applyFilter(id: string) {
    setFilter(id);
    // Keep the selection inside the filter: jump to the group's first skill.
    if (id !== ALL && selected?.groupId !== id) {
      setSelectedId(groups.find((g) => g.id === id)?.items[0]?.id ?? null);
    }
  }

  const tabs = [
    { id: ALL, name: "All", count: allItems.length },
    ...groups.map((g) => ({ id: g.id, name: g.name, count: g.items.length })),
  ];

  return (
    <div>
      {/* Filter tabs (toggle buttons). Scrolls horizontally on small screens. */}
      <div
        role="group"
        aria-label="Filter skills by area"
        {...agentBuildAttrs("block")}
        className="-mx-4 mb-8 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => applyFilter(tab.id)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                active
                  ? "text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="skills-filter-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {tab.name}
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    active ? "text-background/60" : "text-muted-foreground/60",
                  )}
                >
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop: orbit + sidebar */}
      <div className="hidden items-center gap-8 lg:grid xl:grid-cols-[minmax(0,1fr)_340px]">
        <SolarSystem
          orbits={orbits}
          label="Skills orbit: rings from core frontend skills outward to what I'm learning"
          centerLogo={<CenterMonogram initials={centerInitials} />}
          centerLogoAlt={centerAlt}
          selectedId={selectedId}
          onSelectItem={(item) => setSelectedId(item.id)}
          highlightIds={highlightIds}
          tilt={60}
          perspective={2000}
          designWidth={960}
        />
        <SkillDetail
          item={selected}
          className="mx-auto w-full max-w-xl xl:max-w-none"
        />
      </div>

      {/* Mobile / tablet: grouped chips */}
      <div className="lg:hidden">
        <SkillChips
          groups={visibleGroups}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
        />
      </div>
    </div>
  );
}

function CenterMonogram({ initials }: { initials: string }) {
  return (
    <span className="bg-linear-to-br from-white to-sky-200 bg-clip-text text-[clamp(1.25rem,2.4cqw,1.75rem)] font-bold tracking-tight text-transparent [filter:drop-shadow(0_0_10px_oklch(0.75_0.12_210/0.55))]">
      {initials}
    </span>
  );
}
