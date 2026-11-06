"use client";

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useMemo, useRef, type ReactNode } from "react";
import { AsciiGlitchRipple } from "@/components/ui/ascii-glitch-ripple";
import { cn } from "@/lib/utils";

interface ScrollRevealTextProps {
  text: string;
  className?: string;
  /** Opacity of words not yet revealed. */
  dim?: number;
  /**
   * Phrases to emphasise. Matched verbatim (first occurrence each) and
   * rendered as Vengeance UI AsciiGlitchRipple spans; each reveals as one
   * unit.
   */
  highlights?: readonly string[];
  highlightClassName?: string;
}

type Token =
  | { kind: "space"; text: string }
  | { kind: "word"; text: string }
  | { kind: "highlight"; text: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Split into words, whitespace and highlight phrases, keeping all text. */
function tokenize(text: string, highlights: readonly string[]): Token[] {
  const phrases = [...new Set(highlights)]
    .filter((h) => h && text.includes(h))
    .sort((a, b) => b.length - a.length); // longest first
  const used = new Set<string>();
  const parts = phrases.length
    ? text.split(new RegExp(`(${phrases.map(escapeRe).join("|")})`))
    : [text];
  const tokens: Token[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (phrases.includes(part) && !used.has(part)) {
      used.add(part);
      tokens.push({ kind: "highlight", text: part });
      continue;
    }
    for (const piece of part.split(/(\s+)/)) {
      if (!piece) continue;
      tokens.push({ kind: /^\s+$/.test(piece) ? "space" : "word", text: piece });
    }
  }
  return tokens;
}

/**
 * Paragraph whose words brighten one by one, linked to scroll position
 * (starts when the top of the paragraph is 85% down the viewport, completes
 * when its bottom reaches 45%). Text stays in the DOM, so it's fully
 * readable by screen readers and crawlers. Reduced motion: words are fully
 * opaque via CSS (`.scroll-reveal-word` in globals.css) and highlights don't
 * scramble.
 */
export function ScrollRevealText({
  text,
  className,
  dim = 0.15,
  highlights = [],
  highlightClassName,
}: ScrollRevealTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });
  const tokens = useMemo(() => tokenize(text, highlights), [text, highlights]);
  const revealCount = tokens.filter((t) => t.kind !== "space").length;

  let n = 0;
  return (
    <p ref={ref} className={className}>
      {tokens.map((tok, i) => {
        if (tok.kind === "space") return tok.text;
        const index = n++;
        const range: [number, number] = [
          index / revealCount,
          (index + 1) / revealCount,
        ];
        return (
          <Word key={i} progress={scrollYProgress} range={range} dim={dim}>
            {tok.kind === "highlight" ? (
              <AsciiGlitchRipple
                as="span"
                dur={900}
                className={cn("whitespace-nowrap", highlightClassName)}
              >
                {tok.text}
              </AsciiGlitchRipple>
            ) : (
              tok.text
            )}
          </Word>
        );
      })}
    </p>
  );
}

function Word({
  children,
  progress,
  range,
  dim,
}: {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  dim: number;
}) {
  const opacity = useTransform(progress, range, [dim, 1]);
  return (
    <motion.span style={{ opacity }} className="scroll-reveal-word">
      {children}
    </motion.span>
  );
}
