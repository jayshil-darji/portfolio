"use client";

import { Award, ChevronDown, ExternalLink, Lock } from "lucide-react";
import { useState } from "react";
import { GitHubIcon } from "@/components/icons/brand-icons";
import ExpandableBentoGrid, {
  type BentoItem,
  type BentoState,
} from "@/components/ui/expandable-bento-grid";
import type { Project } from "@/data/profile";
import { cn } from "@/lib/utils";
import { bentoSpans } from "./bento-layout";
import { ProjectCover } from "./project-cover";

const typeLabel = (p: Project) =>
  `${p.type === "professional" ? "Professional" : "Personal"}${p.typeNote ? ` · ${p.typeNote}` : ""}`;

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
}: {
  p: Project;
  s: BentoState;
  span: string;
}) {
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
      {/* Cover: fixed aspect → no layout shift. Zooms on hover. */}
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden",
          p.featured ? "aspect-[16/9]" : "aspect-[2/1]",
          mdWide && "md:aspect-auto md:min-h-52 md:w-[38%] md:self-stretch",
          lgWide
            ? "lg:aspect-auto lg:min-h-52 lg:w-[38%] lg:self-stretch"
            : mdWide &&
                (p.featured
                  ? "lg:aspect-[16/9] lg:min-h-0 lg:w-auto lg:self-auto"
                  : "lg:aspect-[2/1] lg:min-h-0 lg:w-auto lg:self-auto"),
        )}
      >
        <ProjectCover
          project={p}
          sizes={
            p.featured
              ? "(min-width: 1024px) 600px, 100vw"
              : "(min-width: 1024px) 400px, 100vw"
          }
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
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

        <span className="mt-3 block text-xl font-semibold tracking-tight sm:text-2xl">
          {p.name}
          {p.tagline && (
            <span className="block text-sm font-normal text-muted-foreground sm:text-base">
              {p.tagline}
            </span>
          )}
        </span>

        {!s.expanded && (
          <span className="mt-3 line-clamp-2 block text-sm leading-relaxed text-foreground/75">
            {p.summary}
          </span>
        )}

        {!s.expanded && (
          // Full stack is listed (and read out) in the expanded region.
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
        )}

        <span
          aria-hidden="true"
          className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-sky-200"
        >
          <span className="[@media(hover:none)]:hidden">
            {s.expanded ? "Click to collapse" : "Click to expand"}
          </span>
          <span className="hidden [@media(hover:none)]:inline">
            {s.expanded ? "Tap to collapse" : "Tap to expand"}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-300",
              s.expanded && "rotate-180",
            )}
          />
        </span>
      </span>
    </span>
  );
}

/** Expanded region (outside the button). */
function Expanded({ p }: { p: Project }) {
  const hasLinks = !!(p.links?.live || p.links?.repo || p.links?.caseStudy);
  return (
    <div className="grid gap-8 border-t border-white/10 px-5 pt-6 pb-6 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
      <div>
        <p className="text-base leading-relaxed text-foreground/90">
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
      </div>

      <div className="space-y-6">
        {(p.role || p.company) && (
          <dl className="grid grid-cols-2 gap-4 text-sm">
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

        <div>
          <h4 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Stack
          </h4>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {p.stack.map((t) => (
              <li key={t}>
                <Chip>{t}</Chip>
              </li>
            ))}
          </ul>
        </div>

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
    </div>
  );
}

function ProjectLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
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

  const items: BentoItem[] = projects.map((p) => ({
    id: p.slug,
    title: p.name,
    className: spans.get(p.slug),
    collapsed: (s) => <Collapsed p={p} s={s} span={spans.get(p.slug) ?? ""} />,
    expanded: () => <Expanded p={p} />,
  }));

  return (
    <ExpandableBentoGrid
      items={items}
      onExpandedChange={setExpandedId}
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
