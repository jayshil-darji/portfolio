"use client";

import { Pause, Play } from "lucide-react";
import { useInView } from "motion/react";
import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useBuildHold } from "@/components/experimental/agent-cursor/build-state";
import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { usePageVisible } from "@/hooks/use-page-visible";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type Variant = "ai" | "coded";

const BASE = "/videos/hero";
/** "ai" switches to the portrait crop below this; "coded" shows its poster. */
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

/** The first visual (server-rendered, high priority): the build reveals
 *  it, and the video fades in over it. */
function Poster({ variant }: { variant: Variant }) {
  if (variant === "coded")
    return (
      <Image
        src={`${BASE}/coded/hero-poster.jpg`}
        width={1280}
        height={720}
        alt=""
        sizes="100vw"
        preload
        className="absolute inset-0 size-full object-cover"
      />
    );
  // "ai": art direction (portrait crop below 768px) → <picture>, which
  // can't be preloaded without loading both crops: high fetch priority.
  const common = {
    alt: "",
    sizes: "100vw",
    fetchPriority: "high" as const,
    loading: "eager" as const,
  };
  const { props: desktop } = getImageProps({
    ...common,
    src: `${BASE}/ai/hero-poster.jpg`,
    width: 1280,
    height: 720,
  });
  const {
    props: { srcSet: mobile },
  } = getImageProps({
    ...common,
    src: `${BASE}/ai/hero-poster-mobile.jpg`,
    width: 540,
    height: 720,
  });
  return (
    <picture>
      <source media={MOBILE_QUERY} srcSet={mobile} sizes="100vw" />
      <img
        {...desktop}
        alt=""
        className="absolute inset-0 size-full object-cover md:object-right"
      />
    </picture>
  );
}

/* ---------- player ---------- */

/** Reveal a clip once its first frame is presented (then `then`). */
function showOnFrame(v: HTMLVideoElement, then?: () => void) {
  const reveal = () => {
    v.dataset.shown = "true";
    then?.();
  };
  if (typeof v.requestVideoFrameCallback === "function")
    v.requestVideoFrameCallback(reveal);
  else v.addEventListener("playing", reveal, { once: true });
}

function rewind(v: HTMLVideoElement) {
  v.pause();
  v.currentTime = 0;
  delete v.dataset.shown;
}

function start(v: HTMLVideoElement, then?: () => void) {
  if (v.dataset.shown !== "true") showOnFrame(v, then);
  v.play().catch(() => {
    // Autoplay refused (rare for muted video): stay on the poster.
  });
}

interface Clip {
  name: string;
  loop: boolean;
}

/**
 * Stacked clips played in order; the last one loops ("ai": one looping
 * clip; "coded": intro once → loop). Each clip is hidden (poster shows)
 * until its first frame is presented; the next clip is preloaded and only
 * shown once it has a frame up, over the previous clip's last (held) frame
 * → no black frame on the hand-off.
 */
function Player({
  dir,
  clips,
  play,
  held,
  onError,
  className,
}: {
  dir: string;
  clips: Clip[];
  play: boolean;
  held: boolean;
  onError: () => void;
  className: string;
}) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const stage = useRef(0);
  const playRef = useRef(play);

  // Held by the build (or Replay): back to the poster, rewound to 0.
  useEffect(() => {
    if (!held) return;
    stage.current = 0;
    refs.current.forEach((v) => v && rewind(v));
  }, [held]);

  useEffect(() => {
    playRef.current = play;
    const v = refs.current[stage.current];
    if (!v) return;
    if (play) start(v);
    else v.pause();
  }, [play]);

  /** Hand-off: the next clip (preloaded) starts at 0 and covers the
   *  previous one's held last frame once its own first frame is up. */
  const ended = (i: number) => {
    const next = refs.current[i + 1];
    if (!next || stage.current !== i) return;
    stage.current = i + 1;
    next.currentTime = 0;
    if (playRef.current) start(next);
  };

  return clips.map((c, i) => (
    <video
      key={c.name}
      ref={(el) => {
        refs.current[i] = el;
        if (el) el.muted = true;
      }}
      className={className}
      muted
      playsInline
      loop={c.loop}
      preload="auto"
      disablePictureInPicture
      tabIndex={-1}
      onEnded={c.loop ? undefined : () => ended(i)}
    >
      <source src={`${dir}/${c.name}.webm`} type="video/webm" />
      {/* All sources failed → poster only. */}
      <source src={`${dir}/${c.name}.mp4`} type="video/mp4" onError={onError} />
    </video>
  ));
}

const CLIPS: Record<Variant, Clip[]> = {
  ai: [{ name: "hero-loop", loop: true }],
  coded: [
    { name: "hero-intro", loop: false },
    { name: "hero-loop", loop: true },
  ],
};

/**
 * Decorative hero video ("ai" | "coded", src/data/hero-background.ts).
 * The poster is the server-rendered first visual (high fetch priority);
 * the video loads after the window `load` event and fades in over it once
 * it has a frame. Poster only with reduced motion, Save-Data, a failed
 * load, or ("coded") below 768px. Paused off-screen / in a hidden tab /
 * by the visitor (toggle, remembered for the session).
 *
 * EXPERIMENT (agent-cursor): this layer is the hero's background build unit
 * ("image"); the build reveals the poster and the video starts from 0 only
 * after that (useBuildHold). Replay rewinds it to the poster. Flag off →
 * the hold is always false.
 */
export function HeroVideoBackground({ variant }: { variant: Variant }) {
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

  const enabled =
    loaded &&
    !reduced &&
    !saveData &&
    !failed &&
    !(variant === "coded" && mobile);
  const dir = `${BASE}/${variant}`;
  const clips =
    variant === "ai" && mobile
      ? [{ name: "hero-loop-mobile", loop: true }]
      : CLIPS[variant];

  return (
    <>
      <div
        ref={ref}
        aria-hidden="true"
        {...agentBuildAttrs("image", BUILD_ID)}
        className="hero-video pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background"
      >
        <Poster variant={variant} />
        {enabled && (
          <Player
            // New sources (desktop ↔ mobile crop) → fresh elements.
            key={clips[0].name}
            dir={dir}
            clips={clips}
            play={!held && inView && visible && !userPaused}
            held={held}
            onError={() => setFailed(true)}
            className={
              "hero-video-clip absolute inset-0 size-full object-cover" +
              (variant === "ai" ? " md:object-right" : "")
            }
          />
        )}
        <div className={`hero-scrim hero-scrim-${variant} absolute inset-0`} />
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
