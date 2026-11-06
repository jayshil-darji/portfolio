"use client";

import { motion, useInView } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

// three.js only loads when the section nears the viewport and motion is
// allowed; never during SSR.
const InteractiveParticles = dynamic(
  () =>
    import("@/components/ui/interactive-particles").then(
      (m) => m.InteractiveParticles,
    ),
  { ssr: false },
);

interface AboutPhotoProps {
  /** Regular portrait: SSR placeholder, reduced-motion and fallback image. */
  photo: string;
  /** Source sampled into particles (ideally background-removed). */
  particleSrc: string;
  /** Accessible description of the portrait. */
  label: string;
  /** Shown in the fallback monogram when the image can't load. */
  initials: string;
}

const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/**
 * Particle tuning. The whole source image is used as-is (no subject mask —
 * the office background is part of the look). A low threshold keeps the
 * facial shading.
 */
const PARTICLES_POINTER = {
  threshold: 20,
  size: 1.4,
  maxDimension: 320,
  touchRadius: 0.18,
};
// Touch / no-hover: ~45% fewer particles, slightly larger, same idle drift.
const PARTICLES_TOUCH = {
  threshold: 20,
  size: 1.7,
  maxDimension: 240,
  touchRadius: 0.22,
};

const COARSE_QUERY = "(hover: none), (pointer: coarse)";
function subscribeCoarse(cb: () => void) {
  const mql = window.matchMedia(COARSE_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

type ParticleState = "idle" | "ready" | "no-webgl" | "low-fps";

/**
 * Portrait, shown uncropped: the box uses the source image's own aspect
 * ratio (912×1177), so neither the photo nor the particles are cut off.
 * 1. SSR / first paint: the real photo (next/image), clip-path wipe reveal.
 * 2. Near the viewport (and motion allowed): lazily mounts Vengeance UI
 *    InteractiveParticles over it; once its first frame renders, the photo
 *    cross-fades out. Fixed-ratio box → no layout shift at any point.
 * 3. Reduced motion, no WebGL, or < 15fps: stays on the real photo.
 * The render loop pauses itself off-screen / in hidden tabs (component).
 */
export function AboutPhoto({
  photo,
  particleSrc,
  label,
  initials,
}: AboutPhotoProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const [particles, setParticles] = useState<ParticleState>("idle");
  const reduced = usePrefersReducedMotion();
  const coarse = useSyncExternalStore(
    subscribeCoarse,
    () => window.matchMedia(COARSE_QUERY).matches,
    () => false,
  );

  // Observed on a plain outer wrapper (IntersectionObserver is unreliable
  // for targets inside clipped / transformed children).
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapperRef, { once: true, amount: 0.35 });
  // About sits right under the full-height hero, so a large margin would be
  // "near" at page load and pull three.js into the critical path. 150px
  // starts loading ~1 scroll-step before the photo appears.
  const nearView = useInView(wrapperRef, { once: true, margin: "150px 0px" });

  const failed = particles === "no-webgl" || particles === "low-fps";
  const wantParticles = nearView && !reduced && !failed;
  const showParticles = wantParticles && particles === "ready";

  // An image that errors *before* hydration never fires React's onError, so
  // also check the element's state when it attaches.
  const checkBroken = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setPhotoFailed(true);
  }, []);

  const settings = coarse ? PARTICLES_TOUCH : PARTICLES_POINTER;

  return (
    <div
      ref={wrapperRef}
      className="mx-auto w-full max-w-[20rem] md:max-w-none"
    >
      <motion.div
        role="img"
        aria-label={label}
        data-particles={showParticles ? "on" : particles}
        className="reveal-clip relative aspect-[912/1177] w-full overflow-hidden rounded-2xl bg-neutral-900"
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        animate={{
          clipPath: inView ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
        }}
        transition={{ duration: 1.2, ease: EASE_IN_OUT }}
      >
        {/* Real photo: placeholder → fallback. Decorative inside role=img. */}
        {photoFailed ? (
          <Fallback initials={initials} />
        ) : (
          <motion.div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              showParticles && "opacity-0",
            )}
            initial={{ scale: 1.25 }}
            animate={{ scale: inView ? 1 : 1.25 }}
            transition={{ duration: 1.6, ease: EASE_IN_OUT }}
          >
            <Image
              ref={checkBroken}
              src={photo}
              alt=""
              fill
              sizes="(min-width: 768px) 360px, 80vw"
              className="object-contain"
              onError={() => setPhotoFailed(true)}
            />
          </motion.div>
        )}

        {wantParticles && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 touch-pan-y transition-opacity duration-700",
              showParticles ? "opacity-100" : "opacity-0",
            )}
          >
            <InteractiveParticles
              src={particleSrc}
              allowUpload={false}
              background="transparent"
              color="#f0f9ff"
              maxPixelRatio={coarse ? 1 : 1.5}
              {...settings}
              onReady={() => setParticles("ready")}
              onError={() => setParticles("no-webgl")}
              onLowFps={() => setParticles("low-fps")}
            />
          </div>
        )}

        {/* Soft vignette so the photo sits into the dark theme. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/50 via-transparent to-transparent"
        />
      </motion.div>
    </div>
  );
}

function Fallback({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,oklch(0.45_0.12_220),transparent_60%),radial-gradient(circle_at_80%_90%,oklch(0.4_0.15_290),transparent_55%)] bg-neutral-900"
    >
      <span className="text-6xl font-bold tracking-tight text-white/90 md:text-7xl">
        {initials}
      </span>
    </div>
  );
}
