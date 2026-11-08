"use client";

import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { AnimatePresence, motion } from "motion/react";
import { RotatingBorder } from "@/components/ui/rotating-border";
import type { SkillItem } from "@/lib/skills-to-orbits";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

/**
 * Detail card for the selected skill: icon, name, ring + badge, how I use
 * it, and a short code sample in an editor frame. Content cross-fades when
 * the selection changes; the region is aria-live so screen-reader users
 * hear the new selection.
 */
export function SkillDetail({
  item,
  className,
  headingLevel: H = "h3",
}: {
  item: SkillItem | null;
  className?: string;
  headingLevel?: "h3" | "h4";
}) {
  return (
    <div
      className={cn("relative", className)}
      aria-live="polite"
      {...agentBuildAttrs("block")}
    >
      <AnimatePresence mode="wait" initial={false}>
        {item ? (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
            style={{ "--c": item.color } as React.CSSProperties}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 p-2 shadow-[0_0_24px_-6px_var(--c)]"
                style={{ color: item.color }}
              >
                {item.svg}
              </span>
              <div className="min-w-0">
                <H className="text-lg leading-tight font-semibold">
                  {item.label}
                </H>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{item.type}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase",
                        item.badge === "Core"
                          ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                          : "border-dashed border-violet-400/40 bg-violet-400/10 text-violet-200",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-foreground/85">
              {item.desc}
            </p>
            <CodeBlock sample={item.sample} />
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-muted-foreground"
          >
            Select a skill to see how I use it.
          </motion.p>
        )}
      </AnimatePresence>
      {/* Rotating frame on the card wrapper only (wrapper = card box). */}
      <RotatingBorder
        radius="1rem"
        opacity={0.5}
        speed={8.5}
        startAngle={300}
      />
    </div>
  );
}
