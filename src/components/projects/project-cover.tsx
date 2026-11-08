import Image from "next/image";
import type { Project } from "@/data/profile";
import { cn } from "@/lib/utils";

/**
 * Project cover: `project.image` (public/images/projects/{slug}.jpg,
 * 1600×1000 — the 16:10 boxes show it uncropped). Decorative — the project
 * name is always in the text next to it. Fills its parent, which owns the
 * aspect ratio (no layout shift).
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
