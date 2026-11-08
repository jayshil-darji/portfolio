"use client";

import { Pause, Play } from "lucide-react";
import { useInView } from "motion/react";
import { getImageProps } from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { useBuildHold } from "@/components/experimental/agent-cursor/build-state";
import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { usePageVisible } from "@/hooks/use-page-visible";
import {
  HERO_BACKDROPS,
  type BackdropLayout,
  type HeroBackgroundKind,
  type Responsive,
} from "@/data/hero-background";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const BASE = "/videos/hero";
/** Portrait clip + poster below this. */
const MOBILE_QUERY = "(max-width: 767px)";
/** Build unit id (agent-cursor experiment): the video waits for its reveal. */
const BUILD_ID = "hero-bg";
const PAUSE_KEY = "hero-video-paused";

/* ---------- small hydration-safe external stores ---------- */

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** True once the window `load` event has fired (videos load after it). */
function usePageLoaded(): boolean {
  return useSyncExternalStore(
    (cb) => {
      addEventListener("load", cb);
      return () => removeEventListener("load", cb);
    },
    () => document.readyState === "complete",
    () => false,
  );
}

type Connection = EventTarget & { saveData?: boolean };
const connection = () =>
  (navigator as Navigator & { connection?: Connection }).connection;

function useSaveData(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const c = connection();
      c?.addEventListener("change", cb);
      return () => c?.removeEventListener("change", cb);
    },
    () => connection()?.saveData === true,
    () => false,
  );
}

/** The visitor's pause choice, remembered for the session. */
const pauseListeners = new Set<() => void>();
function readPaused() {
  try {
    return sessionStorage.getItem(PAUSE_KEY) === "1";
  } catch {
    return false;
  }
}
function writePaused(value: boolean) {
  try {
    if (value) sessionStorage.setItem(PAUSE_KEY, "1");
    else sessionStorage.removeItem(PAUSE_KEY);
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  memoPaused = value;
  pauseListeners.forEach((l) => l());
}
let memoPaused: boolean | null = null;
function useUserPaused(): boolean {
  return useSyncExternalStore(
    (cb) => {
      pauseListeners.add(cb);
      return () => pauseListeners.delete(cb);
    },
    () => (memoPaused ??= readPaused()),
    () => false,
  );
}

/* ---------- poster ---------- */

/** Per-breakpoint CSS vars (--{name}, --{name}-md, --{name}-lg); hero.css
 *  resolves them with fallbacks to the next smaller breakpoint. */
function responsiveVars(name: string, v: Responsive<string>) {
  return {
    [`--${name}`]: v.base,
    ...(v.md ? { [`--${name}-md`]: v.md } : {}),
    ...(v.lg ? { [`--${name}-lg`]: v.lg } : {}),
  } as CSSProperties;
}

/**
 * The first visual (server-rendered): the build reveals it, and the video
 * fades in over it. Art direction (portrait crop below 768px) → <picture>,
 * which can't be preloaded without loading both crops: high fetch
 * priority instead.
 */
function Poster({
  dir,
  poster,
}: {
  dir: string;
  poster: BackdropLayout["poster"];
}) {
  const common = {
    alt: "",
    sizes: "100vw",
    fetchPriority: "high" as const,
    loading: "eager" as const,
  };
  const { props: desktop } = getImageProps({
    ...common,
    src: `${dir}/hero-poster.jpg`,
    ...poster.desktop,
  });
  const {
    props: { srcSet: mobile },
  } = getImageProps({
    ...common,
    src: `${dir}/hero-poster-mobile.jpg`,
    ...poster.mobile,
  });
  return (
    <picture>
      <source media={MOBILE_QUERY} srcSet={mobile} sizes="100vw" />
      <img
        {...desktop}
        alt=""
        className="hero-media absolute inset-0 size-full object-cover"
      />
    </picture>
  );
}

/* ---------- player ---------- */

/** Reveal the clip once its first frame is presented. */
function showOnFrame(v: HTMLVideoElement) {
  const reveal = () => {
    v.dataset.shown = "true";
  };
  if (typeof v.requestVideoFrameCallback === "function")
    v.requestVideoFrameCallback(reveal);
  else v.addEventListener("playing", reveal, { once: true });
}

/**
 * One muted, looping clip. Hidden (the poster shows) until its first frame
 * is up; held by the build (or Replay) → paused, rewound, poster again.
 */
function Player({
  src,
  play,
  held,
  onError,
}: {
  /** Path without extension (.webm, then .mp4). */
  src: string;
  play: boolean;
  held: boolean;
  onError: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || !held) return;
    v.pause();
    v.currentTime = 0;
    delete v.dataset.shown;
  }, [held]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!play) {
      v.pause();
      return;
    }
    if (v.dataset.shown !== "true") showOnFrame(v);
    v.play().catch(() => {
      // Autoplay refused (rare for muted video): stay on the poster.
    });
  }, [play]);

  return (
    <video
      ref={ref}
      className="hero-media hero-video-clip absolute inset-0 size-full object-cover"
      muted
      playsInline
      loop
      // Nothing is fetched while it can't play (held by the build,
      // off-screen, paused by the visitor); play() starts the download.
      preload={play ? "auto" : "none"}
      disablePictureInPicture
      tabIndex={-1}
    >
      <source src={`${src}.webm`} type="video/webm" />
      {/* All sources failed → poster only. */}
      <source src={`${src}.mp4`} type="video/mp4" onError={onError} />
    </video>
  );
}

/**
 * Decorative hero video ("ai" | "office"); posters, object-position and
 * overlay come from HERO_BACKDROPS (src/data/hero-background.ts).
 * The poster is the server-rendered first visual (high fetch priority);
 * the video loads after the window `load` event and fades in over it once
 * it has a frame. Desktop clip from 768px, portrait clip below (chosen
 * after mount, live). Poster only with reduced motion, Save-Data or a
 * failed load. Paused off-screen / in a hidden tab / by the visitor
 * (toggle, remembered for the session).
 *
 * EXPERIMENT (agent-cursor): this layer is the hero's background build unit
 * ("image"); the build reveals the poster and the video starts from 0 only
 * after that (useBuildHold). Replay rewinds it to the poster. Flag off →
 * the hold is always false.
 */
export function HeroVideoBackground({
  variant,
}: {
  variant: HeroBackgroundKind;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { initial: true });
  const visible = usePageVisible();
  const reduced = usePrefersReducedMotion();
  const saveData = useSaveData();
  const loaded = usePageLoaded();
  const mobile = useMedia(MOBILE_QUERY);
  const held = useBuildHold(BUILD_ID);
  const userPaused = useUserPaused();
  const [failed, setFailed] = useState(false);
  const { scrim, poster, position } = HERO_BACKDROPS[variant];

  const enabled = loaded && !reduced && !saveData && !failed;
  const dir = `${BASE}/${variant}`;
  const src = `${dir}/${mobile ? "hero-loop-mobile" : "hero-loop"}`;

  return (
    <>
      <div
        ref={ref}
        aria-hidden="true"
        {...agentBuildAttrs("image", BUILD_ID)}
        className="hero-video pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background"
        style={{
          ...responsiveVars("pos", position),
          ...responsiveVars("scrim", scrim),
        }}
      >
        <Poster dir={dir} poster={poster} />
        {enabled && (
          <Player
            // New source (desktop ↔ portrait crop) → a fresh element.
            key={src}
            src={src}
            play={!held && inView && visible && !userPaused}
            held={held}
            onError={() => setFailed(true)}
          />
        )}
        <div className="hero-scrim absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background" />
      </div>
      {enabled && !held && (
        <button
          type="button"
          onClick={() => writePaused(!userPaused)}
          aria-label={
            userPaused ? "Play background video" : "Pause background video"
          }
          className="hero-video-toggle absolute right-4 bottom-4 z-10 grid size-9 place-items-center rounded-full border border-white/15 bg-black/35 text-white/70 backdrop-blur-sm transition-colors hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:right-6 sm:bottom-6"
        >
          {userPaused ? (
            <Play aria-hidden="true" className="size-4" />
          ) : (
            <Pause aria-hidden="true" className="size-4" />
          )}
        </button>
      )}
    </>
  );
}
