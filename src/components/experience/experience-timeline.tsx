"use client";

import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { Medal, Trophy, type LucideIcon } from "lucide-react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";
import TextAnimation from "@/components/ui/stagger-text";
import type {
  ExperienceEntry,
  ExperienceNow,
  ExperienceRole,
  MilestoneIcon,
} from "@/data/profile";
import { useBuildActive } from "@/components/experimental/agent-cursor/build-state";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const MILESTONE_ICONS: Record<MilestoneIcon, LucideIcon> = {
  trophy: Trophy,
  medal: Medal,
};

// Glow ring colours: theme tokens (teal → blue → violet).
const GLOW = ["var(--brand-teal)", "var(--brand-blue)", "var(--brand-violet)"];

/** Cards reveal / nodes light as they cross this fraction of the viewport
 *  height (0.8 = entering the bottom 20%). The drawn line uses it too. */
const TRIGGER_LINE = 0.8;

const years = (e: ExperienceEntry) =>
  e.kind === "now"
    ? "Now"
    : `${e.start} – ${e.end === "present" ? "Present" : e.end}`;

/**
 * Scroll-drawn milestone timeline.
 * - The line fill (scaleY) and its leading dot (translateY) follow scroll
 *   progress through the list — motion values only, no React state per
 *   scroll tick.
 * - Trigger line = 80% of the viewport height (the bottom 20%). As a node
 *   crosses it, its card finishes fading/sliding in (over the last 80px)
 *   and the node lights (last 16px). Card + node read the RAW page scrollY
 *   against each node's measured trigger position (unclamped — a progress
 *   value clamped at 0 had the first card half-revealed at load), so they
 *   never lag; only the drawn line/dot is spring-smoothed (it may trail
 *   slightly on fast scrolls). Re-measured on resize only.
 * - ≥1024px: line centred, cards alternate left/right; below: line on the
 *   left, cards full width to its right.
 * - Reduced motion: static values (line fully drawn, every node lit, every
 *   card in place). Passed explicitly — motion keeps inline values it has
 *   already applied, so dropping the style prop wouldn't reset them.
 */
export function ExperienceTimeline({
  entries,
}: {
  entries: ExperienceEntry[];
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll({
    target: listRef,
    // Line tip on the trigger line (TRIGGER_LINE = 0.8).
    offset: ["start 0.8", "end 0.8"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  });
  const dotY = useTransform(progress, (v) => `${v * 100}%`);

  // scrollY at which each node's centre reaches the trigger line.
  // Fallback until measured (same on server and client): never reached.
  const [triggers, setTriggers] = useState<number[]>(() =>
    entries.map(() => Number.MAX_SAFE_INTEGER),
  );
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      // Measure the dot itself — its grid cell stretches to the card height.
      const nodes = list.querySelectorAll<HTMLElement>("[data-timeline-dot]");
      const line = window.innerHeight * TRIGGER_LINE;
      setTriggers(
        [...nodes].map((n) => {
          const r = n.getBoundingClientRect();
          return window.scrollY + r.top + r.height / 2 - line;
        }),
      );
    };
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="relative">
      {/* Decorative line: track, drawn fill, leading dot. */}
      <div
        aria-hidden="true"
        {...agentBuildAttrs("image")}
        className="pointer-events-none absolute top-0 bottom-0 left-5 w-0.5 -translate-x-1/2 [mask-image:linear-gradient(to_bottom,black_88%,transparent)] lg:left-1/2"
      >
        <div className="absolute inset-0 rounded-full bg-white/10" />
        <motion.div
          className="tl-fill absolute inset-0 origin-top rounded-full"
          style={{ scaleY: reduced ? 1 : progress }}
        />
        {!reduced && (
          <motion.div className="absolute inset-0" style={{ y: dotY }}>
            <span className="tl-head absolute top-0 left-1/2 block size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" />
          </motion.div>
        )}
      </div>

      <ol ref={listRef} className="relative space-y-12 lg:space-y-16">
        {entries.map((entry, i) => (
          <TimelineItem
            key={
              entry.kind === "role" ? `${entry.company}-${entry.start}` : "now"
            }
            entry={entry}
            side={i % 2 === 0 ? "left" : "right"}
            scrollY={scrollY}
            trigger={triggers[i] ?? Number.MAX_SAFE_INTEGER}
            reduced={reduced}
          />
        ))}
      </ol>
    </div>
  );
}

function TimelineItem({
  entry,
  side,
  scrollY,
  trigger,
  reduced,
}: {
  entry: ExperienceEntry;
  side: "left" | "right";
  /** Raw page scroll position. */
  scrollY: MotionValue<number>;
  /** scrollY at which this node reaches the trigger line. */
  trigger: number;
  reduced: boolean;
}) {
  // 0 → 1 as this node approaches the trigger line: the card over the last
  // 80px, the node over the last 16px — both done as the node crosses it.
  const lit = useTransform(scrollY, [trigger - 16, trigger], [0, 1]);
  const reveal = useTransform(scrollY, [trigger - 80, trigger], [0, 1]);
  const nodeScale = useTransform(lit, [0, 1], [1, 1.3]);
  const buildActive = useBuildActive();

  const left = side === "left";

  return (
    <li
      data-side={side}
      className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 lg:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] lg:gap-x-6"
    >
      {/* Years (mobile: above the card; desktop: opposite the card). */}
      <p
        className={cn(
          "col-start-2 row-start-1 mb-2 self-end font-mono text-xs tracking-wider text-muted-foreground lg:row-start-1 lg:mb-0 lg:self-start lg:pt-[1.35rem]",
          left ? "lg:col-start-3" : "lg:col-start-1 lg:text-right",
        )}
      >
        {years(entry)}
      </p>

      {/* Node on the line (decorative). */}
      <span
        aria-hidden="true"
        className="col-start-1 row-span-2 row-start-1 flex justify-center pt-[1.6rem] lg:col-start-2 lg:row-span-1 lg:pt-[1.1rem]"
      >
        <span
          data-timeline-dot=""
          className="tl-node relative grid size-5 place-items-center rounded-full border border-white/20 bg-background"
        >
          <motion.span
            className="tl-node-glow absolute -inset-2 rounded-full"
            style={{ opacity: reduced ? 1 : lit }}
          />
          <motion.span
            className="tl-node-core relative block size-2 rounded-full"
            style={
              reduced
                ? { scale: 1, opacity: 1 }
                : { scale: nodeScale, opacity: lit }
            }
          />
        </span>
      </span>

      {/* Card: fades/slides in as the line approaches. */}
      <motion.div
        {...agentBuildAttrs("block")}
        className={cn(
          "tl-card col-start-2 row-start-2 lg:row-start-1",
          left ? "lg:col-start-1" : "lg:col-start-3",
        )}
        // EXPERIMENT (agent-cursor): inside the build the card is revealed
        // by the build — no slide-in.
        style={
          {
            "--reveal": reduced || buildActive ? 1 : reveal,
          } as unknown as CSSProperties
        }
      >
        {entry.kind === "role" ? (
          <RoleCard role={entry} />
        ) : (
          <NowCard now={entry} />
        )}
      </motion.div>
    </li>
  );
}

const milestoneList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const milestoneItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

/** The one card used by every stop (roles and "Now"): glow border + the
 *  shared interactive hover. */
function TimelineCard({ children }: { children: ReactNode }) {
  return (
    <InteractiveGlowCard
      borderRadius="1rem"
      gradientColors={GLOW}
      borderWidth="0.9em"
      inset="-0.6em"
      className="border border-white/10"
      contentClassName="p-5 sm:p-6"
    >
      {children}
    </InteractiveGlowCard>
  );
}

const CARD_TITLE = "text-xl font-semibold tracking-tight sm:text-2xl";

function RoleCard({ role }: { role: ExperienceRole }) {
  return (
    <TimelineCard>
      <h3 className={CARD_TITLE}>
        <TextAnimation>{role.company}</TextAnimation>
      </h3>
      <p className="mt-1 text-sm font-medium text-sky-200/85">{role.role}</p>
      {role.summary && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          {role.summary}
        </p>
      )}

      {role.milestones.length > 0 && (
        <motion.ul
          className="tl-milestones relative mt-5 space-y-4 pl-6"
          variants={milestoneList}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          {/* Connector for the sub-nodes (decorative). */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[5px] w-px bg-linear-to-b from-brand-teal/50 via-brand-blue/40 to-brand-violet/30"
          />
          {role.milestones.map((m) => {
            const Icon = m.icon ? MILESTONE_ICONS[m.icon] : null;
            return (
              <motion.li
                key={m.title}
                variants={milestoneItem}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className="tl-subnode absolute top-1.5 -left-6 block size-[11px] rounded-full border-2 border-background"
                />
                <p className="font-medium leading-snug">{m.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{m.text}</p>
                {m.badge && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                    {Icon && <Icon aria-hidden="true" className="size-3" />}
                    {m.badge}
                  </span>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </TimelineCard>
  );
}

/** Same card as the roles; the pulsing "In progress" label is the only
 *  differentiator. */
function NowCard({ now }: { now: ExperienceNow }) {
  return (
    <TimelineCard>
      <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        <span aria-hidden="true" className="relative flex size-2">
          <span className="live-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        In progress
      </p>
      <h3 className={CARD_TITLE}>
        <TextAnimation>{now.title}</TextAnimation>
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        {now.text}
      </p>
    </TimelineCard>
  );
}
