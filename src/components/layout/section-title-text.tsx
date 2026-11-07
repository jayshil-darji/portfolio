"use client";

import { useBuildActive } from "@/components/experimental/agent-cursor/build-state";
import TextAnimation from "@/components/ui/stagger-text";

/**
 * Section title words: the Vengeance UI stagger reveal — except while the
 * agent-cursor build (EXPERIMENT) drives the page: the build reveals the
 * heading, so the words render static in TextAnimation's own span
 * structure (inline-block word boxes + trailing NBSP) → same wrapping and
 * box, no layout shift when switching.
 */
export function SectionTitleText({ title }: { title: string }) {
  if (!useBuildActive()) return <TextAnimation>{title}</TextAnimation>;
  return (
    <span style={{ display: "inline-block" }}>
      {title.split(" ").map((part, i) => (
        <span
          key={i}
          className="relative inline-block overflow-hidden"
          style={{ verticalAlign: "top" }}
        >
          <span className="inline-block">{part + "\u00A0"}</span>
        </span>
      ))}
    </span>
  );
}
