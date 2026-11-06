import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionHeading, type TitleEffect } from "./section-heading";
import type { SectionId } from "@/data/nav";

interface SectionProps {
  id: SectionId;
  title?: string;
  titleEffect?: TitleEffect;
  className?: string;
  children?: ReactNode;
}

/** Shared wrapper giving every section a consistent id, spacing and heading. */
export function Section({
  id,
  title,
  titleEffect,
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-heading` : undefined}
      className={cn(
        "mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 md:py-28",
        className,
      )}
    >
      {title && <SectionHeading id={id} title={title} effect={titleEffect} />}
      {children}
    </section>
  );
}
