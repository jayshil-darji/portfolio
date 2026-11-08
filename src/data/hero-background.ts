/**
 * Hero backdrop: a looping, decorative video (subject on the right; on
 * ≥1024px the hero content is left-aligned in the left half).
 * "ai":     an illustrated, dark scene.
 * "office": a live-action office scene (brighter → stronger overlay below
 *           1024px).
 * Assets in public/videos/hero/{kind}/: hero-loop.{webm,mp4} (desktop),
 * hero-loop-mobile.{webm,mp4} (portrait crop, below 768px),
 * hero-poster.jpg, hero-poster-mobile.jpg.
 */
export type HeroBackgroundKind = "ai" | "office";

export const HERO_BACKGROUND: HeroBackgroundKind = "office";

/** A value per breakpoint: base (<768px), md (768–1023px), lg (≥1024px).
 *  A missing breakpoint inherits the next smaller one. */
export interface Responsive<T> {
  base: T;
  md?: T;
  lg?: T;
}

export interface Size {
  width: number;
  height: number;
}

export interface BackdropLayout {
  /** Hero content alignment at ≥1024px (always centred below). */
  align: "center" | "left";
  /** Readability overlay (CSS background) over the video. */
  scrim: Responsive<string>;
  /** Intrinsic sizes of hero-poster.jpg / hero-poster-mobile.jpg. */
  poster: { desktop: Size; mobile: Size };
  /** object-position of the poster and the video. */
  position: Responsive<string>;
}

/** rgb(5 8 15) ≈ the page background, tinted blue. */
const ink = (a: number) => `rgb(5 8 15 / ${a})`;
const vertical = (top: number, mid: number, bottom: number) =>
  `linear-gradient(to bottom, ${ink(top)} 0%, ${ink(mid)} 45%, ${ink(bottom)} 100%)`;
/** A soft dark ellipse behind the centred text block (height = % of the
 *  hero's half-height it reaches). */
const halo = (a: number, height = 34) =>
  `radial-gradient(ellipse 80% ${height}% at 50% 50%, ${ink(a)}, transparent 100%)`;

const FHD = { width: 1280, height: 720 };

/** Per-option layout + overlay settings (read by the hero and the video). */
export const HERO_BACKDROPS: Record<HeroBackgroundKind, BackdropLayout> = {
  ai: {
    align: "left",
    scrim: {
      base: `${halo(0.7)}, ${vertical(0.6, 0.5, 0.7)}`,
      lg: `linear-gradient(to right, ${ink(0.7)} 0%, ${ink(0.62)} 42%, transparent 72%)`,
    },
    poster: { desktop: FHD, mobile: { width: 540, height: 720 } },
    position: { base: "center", md: "right center" },
  },
  office: {
    align: "left",
    // A brighter, live-action scene: below 1024px the overlay's top is
    // stronger (the "Hi, I'm" pill sits over the lit office windows).
    scrim: {
      base: `${halo(0.6, 44)}, ${vertical(0.72, 0.6, 0.72)}`,
      md: `${halo(0.62, 44)}, ${vertical(0.72, 0.58, 0.72)}`,
      lg: `linear-gradient(to right, ${ink(0.7)} 0%, ${ink(0.45)} 50%, transparent 62%)`,
    },
    poster: { desktop: FHD, mobile: { width: 540, height: 698 } },
    position: { base: "center top", md: "right center" },
  },
};
