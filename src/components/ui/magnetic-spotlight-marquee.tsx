"use client";

/*
 * Vengeance UI: magnetic-spotlight-marquee
 * Source: src/components/ui/magnetic-spotlight-marquee.tsx @ 298075b.
 * NOT in the registry (public/r/magnetic-spotlight-marquee.json 404s on
 * every branch) — copied from the repo source, then REWRITTEN.
 *
 * Upstream is a full-viewport (100vh, min 800px) <section> with an <h1>, an
 * image strip of Unsplash photos scrolled by GSAP, a strip that follows the
 * pointer vertically ("magnetic") and text lines that ride its "wake" —
 * driven by a requestAnimationFrame loop that never stops.
 *
 * LOCAL PATCHES (the component keeps the concept, not the code):
 *  1. Text marquee instead of images: huge outlined phrase + separator,
 *     repeated. The spotlight under the pointer fills the letters with a
 *     teal→violet gradient (theme tokens) — a masked second copy of the
 *     track, scrolled by the same CSS animation so the two stay in sync.
 *  2. gsap removed: the scroll is a CSS keyframe (transform only); the
 *     magnetic pull is a motion spring (`useSpring`), only on fine pointers.
 *     No rAF loop, no resize listeners, no clones computed from
 *     window.innerWidth after mount (hydration-safe: fixed repeat count).
 *  3. Removed the nav/footer/subtitle/paragraph slots, external images and
 *     the runtime 'Instrument Sans/Serif' font-family (fonts never loaded;
 *     Geist via next/font instead). Not a <section>/<h1>: it's a band
 *     inside the Contact section.
 *  4. A11y: the band is aria-hidden; one visually-hidden copy of the text
 *     (`srText`) is read instead of the repeated phrase.
 *  5. Paused off-screen and while the tab is hidden (`data-paused`).
 *  6. prefers-reduced-motion: static (no scroll, no magnetic pull); the
 *     spotlight fill still follows the pointer (a hover highlight, not
 *     motion).
 *  7. CSS lives in styles/vengeance.css (`.msm-*`, `vui-msm-scroll`).
 */

import { motion, useInView, useSpring } from "motion/react";
import { useRef, type PointerEvent } from "react";
import { usePageVisible } from "@/hooks/use-page-visible";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export interface MagneticSpotlightMarqueeProps {
  /** Phrase repeated along the band. */
  text: string;
  /** Glyph between repeats. */
  separator?: string;
  /** Phrases per half-track; each half must be wider than the viewport. */
  repeat?: number;
  /** Visually-hidden sentence for screen readers (defaults to `text`). */
  srText?: string;
  /** Max magnetic offset in px (fine pointers only). */
  magnetStrength?: number;
  className?: string;
}

function Track({
  text,
  separator,
  repeat,
}: {
  text: string;
  separator: string;
  repeat: number;
}) {
  return (
    <div className="msm-track">
      {[0, 1].map((half) => (
        <div key={half} className="msm-group">
          {Array.from({ length: repeat }, (_, i) => (
            <span key={i} className="msm-phrase">
              {text}
              <span className="msm-sep">{separator}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function MagneticSpotlightMarquee({
  text,
  separator = "✦",
  repeat = 3,
  srText,
  magnetStrength = 14,
  className,
}: MagneticSpotlightMarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  // Below the fold at load → initial false (useInView updates on entry).
  const inView = useInView(ref, { initial: false });
  const visible = usePageVisible();
  const reduced = usePrefersReducedMotion();
  const y = useSpring(0, { stiffness: 140, damping: 16, mass: 0.5 });

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const band = ref.current;
    const fill = fillRef.current;
    if (e.pointerType !== "mouse" || !band || !fill) return;
    // Mask coordinates are relative to the fill layer (which rides the
    // magnetic offset), so measure it rather than the band.
    const r = fill.getBoundingClientRect();
    fill.style.setProperty("--mx", `${e.clientX - r.left}px`);
    fill.style.setProperty("--my", `${e.clientY - r.top}px`);
    band.dataset.spot = "on";
    if (!reduced) {
      const b = band.getBoundingClientRect();
      const pull = (e.clientY - (b.top + b.height / 2)) * 0.25;
      y.set(Math.max(-magnetStrength, Math.min(magnetStrength, pull)));
    }
  };

  const onPointerLeave = () => {
    if (ref.current) delete ref.current.dataset.spot;
    y.set(0);
  };

  return (
    <div
      ref={ref}
      data-paused={!(inView && visible)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("msm", className)}
    >
      <p className="sr-only">{srText ?? text}</p>
      <motion.div aria-hidden="true" className="msm-strip" style={{ y }}>
        <div className="msm-layer msm-outline">
          <Track text={text} separator={separator} repeat={repeat} />
        </div>
        <div ref={fillRef} className="msm-layer msm-fill">
          <Track text={text} separator={separator} repeat={repeat} />
        </div>
      </motion.div>
    </div>
  );
}

export default MagneticSpotlightMarquee;
