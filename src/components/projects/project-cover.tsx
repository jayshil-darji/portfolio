import Image from "next/image";
import type { Project } from "@/data/profile";
import { cn } from "@/lib/utils";

/** Teal → blue → violet pairs from the site palette, picked per project. */
const PALETTES = [
  ["oklch(0.55 0.12 195)", "oklch(0.35 0.14 255)"],
  ["oklch(0.5 0.16 265)", "oklch(0.32 0.15 295)"],
  ["oklch(0.55 0.11 210)", "oklch(0.33 0.13 280)"],
  ["oklch(0.52 0.15 285)", "oklch(0.34 0.12 225)"],
  ["oklch(0.56 0.1 180)", "oklch(0.36 0.14 240)"],
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** "OMG EV Vehicles" → "OE", "TripSplit" → "TS", "Kero" → "K". */
export function projectInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  const caps = name.match(/[A-Z]/g);
  return caps && caps.length > 1
    ? caps.slice(0, 2).join("")
    : name[0].toUpperCase();
}

/**
 * Project cover: `project.image` (public/images/projects/{slug}.jpg,
 * 1600×1000 — overwrite the file to swap in a screenshot) if set, otherwise
 * a CSS-generated cover (gradient + initials + faint grid). Decorative — the
 * project name is always in the text next to it. Fills its parent, which
 * owns the aspect ratio (no layout shift either way).
 */
export function ProjectCover({
  project,
  sizes,
  className,
}: {
  project: Project;
  sizes: string;
  className?: string;
}) {
  if (project.image) {
    return (
      // Below the fold: lazy (next/image default), responsive `sizes`.
      <Image
        src={project.image}
        alt=""
        fill
        sizes={sizes}
        loading="lazy"
        className={cn("object-cover", className)}
      />
    );
  }
  const [from, to] = PALETTES[hash(project.slug) % PALETTES.length];
  return (
    <span
      aria-hidden="true"
      className={cn("absolute inset-0 block", className)}
      style={{
        background: `radial-gradient(120% 90% at 15% 10%, ${from}, transparent 60%), linear-gradient(135deg, ${to}, oklch(0.16 0.02 260))`,
      }}
    >
      <span className="absolute inset-0 block bg-[linear-gradient(to_right,oklch(1_0_0/0.07)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.07)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_75%)]" />
      <span className="absolute right-5 bottom-3 block text-[clamp(3rem,9vw,6.5rem)] leading-none font-bold tracking-tighter text-white/15 select-none">
        {projectInitials(project.name)}
      </span>
    </span>
  );
}
