"use client";

import {
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
} from "lucide-react";
import { motion, type Transition } from "motion/react";
import { useState, type ReactNode } from "react";
import { GitHubIcon } from "@/components/icons/brand-icons";
import { RotatingBorder } from "@/components/ui/rotating-border";
import ExpandableBentoGrid, {
  BENTO_LAYOUT_TRANSITION,
  type BentoItem,
  type BentoState,
} from "@/components/ui/expandable-bento-grid";
import type { Project } from "@/data/profile";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import { bentoSpans } from "./bento-layout";
import { ProjectCover } from "./project-cover";

const typeLabel = (p: Project) =>
  `${p.type === "professional" ? "Professional" : "Personal"}${p.typeNote ? ` · ${p.typeNote}` : ""}`;

/** Shared-layout id: the cover morphs between its collapsed and expanded
 *  boxes (same element identity across the two renders). */
const coverId = (p: Project) => `project-cover-${p.slug}`;

function TypeBadges({ p }: { p: Project }) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
      <span
        className={cn(
          "size-1.5 rounded-full",
          p.type === "professional" ? "bg-sky-300" : "bg-violet-300",
        )}
        aria-hidden="true"
      />
      {typeLabel(p)}
      {p.award && (
        <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 tracking-wider text-amber-200 normal-case">
          <Award className="size-3" aria-hidden="true" />
          {p.award}
        </span>
      )}
    </span>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-foreground/80">
      {children}
    </span>
  );
}

/**
 * Trigger content (inside the <button>: spans only, no links).
 * Tiles spanning a full row (open, or widened to avoid a gap) switch to a
 * horizontal layout — cover left — so a wide tile doesn't get a giant cover.
 */
function Collapsed({
  p,
  s,
  span,
  coverTransition,
}: {
  p: Project;
  s: BentoState;
  span: string;
  coverTransition: Transition;
}) {
  // Expanded: the trigger is a small corner button (labelled via
  // triggerLabel); the cover + details live in the expanded region.
  if (s.expanded) {
    return <ChevronUp aria-hidden="true" className="size-5" />;
  }
  const topStack = p.stack.slice(0, p.featured ? 4 : 3);
  const mdWide = span.includes("md:col-span-2");
  const lgWide = span.includes("lg:col-span-6");
  return (
    <span
      className={cn(
        "flex flex-1 flex-col",
        mdWide && "md:flex-row",
        lgWide ? "lg:flex-row" : mdWide && "lg:flex-col",
      )}
    >
      {/* Cover: always 16:10 — the image files' own ratio (1600×1000), so
          screenshots show uncropped — in every state, collapsed or open
          (no layout shift). Wide (full-row) tiles put it left, framed.
          Zooms on hover. */}
      <motion.span
        layoutId={coverId(p)}
        transition={{ layout: coverTransition }}
        className={cn(
          "relative block aspect-[16/10] shrink-0 overflow-hidden bg-white/[0.03]",
          mdWide && "md:m-5 md:mr-0 md:w-[38%] md:self-start md:rounded-xl",
          lgWide
            ? "lg:m-5 lg:mr-0 lg:w-[38%] lg:self-start lg:rounded-xl"
            : mdWide && "lg:m-0 lg:w-auto lg:self-auto lg:rounded-none",
        )}
      >
        <ProjectCover
          project={p}
          sizes={
            p.featured
              ? "(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw"
              : "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          }
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </motion.span>

      <span className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <TypeBadges p={p} />

        <span className="mt-3 block text-xl font-semibold tracking-tight sm:text-2xl">
          {p.name}
          {p.tagline && (
            <span className="block text-sm font-normal text-muted-foreground sm:text-base">
              {p.tagline}
            </span>
          )}
        </span>

        <span className="mt-3 line-clamp-2 block text-sm leading-relaxed text-foreground/75">
          {p.summary}
        </span>

        {/* Full stack is listed (and read out) in the expanded region. */}
        <span className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
          {topStack.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
          {p.stack.length > topStack.length && (
            <span className="px-1 text-xs text-muted-foreground">
              +{p.stack.length - topStack.length}
            </span>
          )}
        </span>

        <span
          aria-hidden="true"
          className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-sky-200"
        >
          <span className="[@media(hover:none)]:hidden">Click to expand</span>
          <span className="hidden [@media(hover:none)]:inline">
            Tap to expand
          </span>
          <ChevronDown className="size-3.5" />
        </span>
      </span>
    </span>
  );
}

/**
 * Expanded region (outside the button). ≥1024px: cover left (~45%, 16:10,
 * the same shared-layout element as the collapsed cover, so it morphs into
 * place), details right. Below: stacked. The details fade in on their own
 * (the grid's panel fade is off so the moving cover never fades).
 */
function Expanded({
  p,
  coverTransition,
  reduced,
}: {
  p: Project;
  coverTransition: Transition;
  reduced: boolean;
}) {
  const hasLinks = !!(p.links?.live || p.links?.repo || p.links?.caseStudy);
  return (
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,45%)_minmax(0,1fr)] lg:gap-8 lg:p-7">
      <motion.div
        layoutId={coverId(p)}
        transition={{ layout: coverTransition }}
        className="relative aspect-[16/10] self-start overflow-hidden rounded-xl bg-white/[0.03]"
      >
        <ProjectCover
          project={p}
          sizes="(min-width: 1024px) 520px, 100vw"
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 8 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: reduced ? 0 : 0.35,
            delay: reduced ? 0 : 0.15,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        className="min-w-0"
      >
        {/* pr: room for the corner collapse button. */}
        <div className="pr-12">
          <TypeBadges p={p} />
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {p.name}
        </p>
        {p.tagline && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {p.tagline}
          </p>
        )}
        <p className="mt-4 text-base leading-relaxed text-foreground/90">
          {p.summary}
        </p>

        <h4 className="mt-6 text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Highlights
        </h4>
        <ul className="mt-3 space-y-2.5">
          {p.highlights.map((h) => (
            <li
              key={h}
              className="flex gap-3 text-sm leading-relaxed text-foreground/85"
            >
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-300/80"
              />
              {h}
            </li>
          ))}
        </ul>

        {(p.role || p.company) && (
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            {p.role && (
              <div>
                <dt className="text-xs tracking-widest text-muted-foreground uppercase">
                  Role
                </dt>
                <dd className="mt-1 font-medium">{p.role}</dd>
              </div>
            )}
            {p.company && (
              <div>
                <dt className="text-xs tracking-widest text-muted-foreground uppercase">
                  Company
                </dt>
                <dd className="mt-1 font-medium">{p.company}</dd>
              </div>
            )}
          </dl>
        )}

        <h4 className="mt-6 text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Stack
        </h4>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {p.stack.map((t) => (
            <li key={t}>
              <Chip>{t}</Chip>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {p.type === "professional" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-4" aria-hidden="true" />
              Client project · code under NDA
            </p>
          ) : hasLinks ? (
            <div className="flex flex-wrap gap-2">
              {p.links?.live && (
                <ProjectLink
                  href={p.links.live}
                  icon={<ExternalLink className="size-4" />}
                >
                  Live
                </ProjectLink>
              )}
              {p.links?.repo && (
                <ProjectLink
                  href={p.links.repo}
                  icon={<GitHubIcon className="size-4" />}
                >
                  GitHub
                </ProjectLink>
              )}
              {p.links?.caseStudy && (
                <ProjectLink
                  href={p.links.caseStudy}
                  icon={<ExternalLink className="size-4" />}
                >
                  Case study
                </ProjectLink>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

function ProjectLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:border-sky-300/50 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span aria-hidden="true">{icon}</span>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * Projects bento built on the (patched) Vengeance UI ExpandableBentoGrid.
 * One tile open at a time; tiles re-pack without holes (bento-layout.ts).
 */
export function ProjectsBento({ projects }: { projects: Project[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const spans = bentoSpans(projects, expandedId);
  const reduced = usePrefersReducedMotion();
  const coverTransition: Transition = reduced
    ? { duration: 0 }
    : BENTO_LAYOUT_TRANSITION;

  const items: BentoItem[] = projects.map((p, i) => ({
    id: p.slug,
    title: p.name,
    className: spans.get(p.slug),
    collapsed: (s) => (
      <Collapsed
        p={p}
        s={s}
        span={spans.get(p.slug) ?? ""}
        coverTransition={coverTransition}
      />
    ),
    expanded: () => (
      <Expanded p={p} coverTransition={coverTransition} reduced={reduced} />
    ),
    triggerLabel: (s) => (s.expanded ? `Collapse ${p.name}` : undefined),
    // Thin rotating frame just inside the tile's 1px border (the tile clips
    // overflow). A direct child of the <li>, so it follows the layout
    // animation in both states. De-synced per tile (speed 6–8.25s).
    decoration: () => (
      <RotatingBorder
        opacity={0.4}
        speed={6 + (i % 4) * 0.75}
        startAngle={(i * 73) % 360}
      />
    ),
  }));

  return (
    <ExpandableBentoGrid
      items={items}
      onExpandedChange={setExpandedId}
      panelFade={false}
      // Expanded: the trigger shrinks to a small corner button.
      headerClassName={(s) =>
        s.expanded ? "absolute top-3 right-3 z-20 flex-none" : ""
      }
      triggerClassName={(s) =>
        s.expanded
          ? "size-11 flex-none items-center justify-center rounded-full border border-white/15 bg-background/70 text-foreground/80 backdrop-blur-sm transition-colors hover:border-sky-300/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          : ""
      }
      className="grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-5"
      itemClassName={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]",
        "transition-[translate,border-color,box-shadow,background-color] duration-300",
        "hover:-translate-y-1 hover:border-sky-300/30 hover:bg-white/[0.04] hover:shadow-[0_24px_60px_-28px_oklch(0.6_0.16_250/0.55)]",
        "has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring",
        "data-[expanded]:border-sky-300/25 data-[expanded]:hover:translate-y-0",
        "motion-reduce:hover:translate-y-0",
      )}
    />
  );
}
