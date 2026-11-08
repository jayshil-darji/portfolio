"use client";

import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import {
  BookOpen,
  Compass,
  Hammer,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { RotatingBorder } from "@/components/ui/rotating-border";
import { StaggeredGrid } from "@/components/ui/staggered-grid";
import type { CurrentlyItem } from "@/data/profile";

// Decorative icon per label; unknown labels fall back to Sparkles.
const ICONS: Record<string, LucideIcon> = {
  learning: BookOpen,
  exploring: Compass,
  building: Hammer,
};

/**
 * Learning / Exploring / Building cards in a Vengeance UI StaggeredGrid:
 * column offsets on ≥768px, single column below; columns rise in from the
 * middle out on scroll. Hover: lift, brighter border, glow and a BorderBeam
 * tracing the edge (its animation only runs while hovered).
 * Reduced motion: no entrance animation, no lift.
 */
export function CurrentlyCards({ items }: { items: CurrentlyItem[] }) {
  return (
    <StaggeredGrid
      items={items}
      getKey={(item) => item.label}
      offset="2.5rem"
      label="What I'm doing now"
      renderItem={(item, i) => {
        const Icon = ICONS[item.label.toLowerCase()] ?? Sparkles;
        return (
          <div
            {...agentBuildAttrs("block")}
            className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-[translate,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_10px_40px_-10px_oklch(0.6_0.15_240/0.35)] motion-reduce:hover:translate-y-0 sm:p-6"
          >
            <BorderBeam
              size={90}
              duration={6}
              borderWidth={1.5}
              colorFrom="var(--brand-teal)"
              colorTo="var(--brand-violet)"
              className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 after:[animation-play-state:paused] group-hover:after:[animation-play-state:running]"
            />
            {/* Subtle frame just inside the 1px border (the card clips
                overflow); de-synced per card. */}
            <RotatingBorder
              opacity={0.45}
              speed={7 + i * 0.8}
              startAngle={40 + i * 110}
            />

            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                <span className="relative flex size-2">
                  <span className="live-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                {item.label}
              </span>
              <Icon
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-brand-teal"
              />
            </div>

            <p className="text-base leading-snug text-foreground/90 sm:text-lg">
              {item.href ? (
                <a
                  href={item.href}
                  className="underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.text}
                </a>
              ) : (
                item.text
              )}
            </p>
          </div>
        );
      }}
    />
  );
}
