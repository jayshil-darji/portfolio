"use client";

import { AnimatePresence, motion } from "motion/react";
import type { SkillGroupView } from "@/lib/skills-to-orbits";
import { cn } from "@/lib/utils";
import { SkillDetail } from "./skill-detail";

/**
 * Mobile / tablet layout (below lg): skills as chips grouped by skill group.
 * Below ~1000px the orbit's labelled planets can't stay readable (ring
 * spacing scales down, label pills don't), so this replaces it. The detail card opens inline under the group that holds the
 * selected chip (no scroll jumps). Groups animate in/out with the filter.
 */
export function SkillChips({
  groups,
  selectedId,
  onSelect,
}: {
  groups: SkillGroupView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      <AnimatePresence initial={false} mode="popLayout">
        {groups.map((group) => {
          const selected = group.items.find((i) => i.id === selectedId) ?? null;
          return (
            <motion.section
              key={group.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              aria-labelledby={`chips-${group.id}`}
            >
              <h3
                id={`chips-${group.id}`}
                className="mb-3 flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full",
                    group.learning
                      ? "border border-dashed border-violet-300"
                      : "bg-sky-300",
                  )}
                />
                {group.name}
              </h3>
              <motion.ul
                className="flex flex-wrap gap-2"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {group.items.map((item) => {
                  const active = item.id === selectedId;
                  return (
                    <motion.li
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelect(item.id)}
                        style={{ "--c": item.color } as React.CSSProperties}
                        className={cn(
                          "flex min-h-11 items-center gap-2 rounded-full border bg-white/[0.03] py-2 pr-4 pl-2.5 text-sm font-medium transition-[border-color,background-color,box-shadow,scale] duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          group.learning ? "border-dashed" : "",
                          // Selected: brand border at 60% + a faint tint and
                          // low-opacity glow (same mix for every brand colour).
                          active
                            ? "border-[color-mix(in_oklch,var(--c)_60%,transparent)] bg-[color-mix(in_oklch,var(--c)_8%,transparent)] shadow-[0_0_14px_-6px_color-mix(in_oklch,var(--c)_45%,transparent)]"
                            : "border-white/10 hover:border-white/25",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="size-[18px]"
                          style={{ color: item.color }}
                        >
                          {item.svg}
                        </span>
                        {item.label}
                        {item.badge && (
                          <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </motion.li>
                  );
                })}
              </motion.ul>

              <AnimatePresence initial={false}>
                {selected && (
                  <motion.div
                    key="detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    {/* Spacing on a wrapper, never on SkillDetail: its box
                        must equal the card's, or its RotatingBorder frames
                        the padding too (a second border 1rem above). */}
                    <div className="pt-4">
                      <SkillDetail item={selected} headingLevel="h4" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
