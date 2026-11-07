"use client";

import dynamic from "next/dynamic";
import { HERO_BACKGROUND } from "@/data/hero-background";

/*
 * Picks the hero backdrop (src/data/hero-background.ts). Each option is its
 * own lazy chunk, still server-rendered: only the selected one's JS + CSS
 * is requested (a static import of both would ship the unused one too).
 */
const Rays = dynamic(() =>
  import("@/components/backgrounds/hero-background").then(
    (m) => m.HeroBackground,
  ),
);
const Video = dynamic(() =>
  import("./hero-video-background").then((m) => m.HeroVideoBackground),
);

export function HeroBackdrop() {
  return HERO_BACKGROUND === "rays" ? (
    <Rays />
  ) : (
    <Video variant={HERO_BACKGROUND} />
  );
}
