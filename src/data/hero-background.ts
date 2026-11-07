/**
 * Hero backdrop.
 * "ai":    one looping illustrated video (character on the right); on
 *          ≥1024px the hero content is left-aligned in the left half.
 * "coded": an intro video that plays once, then a seamless loop; centred
 *          layout. Poster only below 768px.
 * "rays":  the animated aurora rays + perspective grid (CSS, no video).
 * Only the selected option is rendered, so only its code and assets load.
 * Assets: public/videos/hero/{ai,coded}/.
 */
export type HeroBackgroundKind = "ai" | "coded" | "rays";

export const HERO_BACKGROUND: HeroBackgroundKind = "ai";
