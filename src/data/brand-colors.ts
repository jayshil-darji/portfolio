/**
 * Brand colours — single source of truth for every brand-tinted element
 * (Skills solar system + chips + detail panel, hero social buttons).
 *
 * `color` is the DISPLAY value for the dark theme: icon tint, border and
 * glow base. Where a brand's official colour is unreadable on dark it's
 * replaced by a lighter, recognisable tint (official value in `brand`).
 *
 * How it's applied (same recipe everywhere, see globals.css tokens
 * --brand-glow-*): icon tinted `color`; on hover/focus a 1px `color`
 * border + an outer glow of `color` mixed at `glow`% over a soft dark
 * shadow. Omitting `glow` uses the CSS default (--brand-glow-mix: 35%, the
 * solar-system planets).
 */

export interface BrandColor {
  /** Dark-theme display colour (icon, border, glow). */
  color: string;
  /** Official brand colour, when `color` differs from it. */
  brand?: string;
  /** Glow strength: % of `color` in the glow (default: CSS 35%). */
  glow?: number;
}

/** Skills (keys = skill ids in profile.ts). */
export const SKILL_COLORS = {
  angular: { color: "#DD0031", brand: "#0F0F11" }, // official mark is near-black
  typescript: { color: "#3178C6" },
  javascript: { color: "#F7DF1E" },
  react: { color: "#61DAFB" },
  nextjs: { color: "#FFFFFF", brand: "#000000" },
  tailwind: { color: "#06B6D4" },
  nodejs: { color: "#5FA04E" },
  express: { color: "#E5E5E5", brand: "#0A0A0A" },
  java: { color: "#E76F00" },
  kotlin: { color: "#7F52FF" },
  postgresql: { color: "#4169E1" },
  mysql: { color: "#4479A1" },
  mssql: { color: "#CC2927" },
  supabase: { color: "#3FCF8E" },
  playwright: { color: "#2EAD33" },
  jest: { color: "#C21325" },
  postman: { color: "#FF6C37" },
  docker: { color: "#2496ED" },
  kubernetes: { color: "#326CE5" },
  "github-actions": { color: "#2088FF" },
  "gitlab-ci": { color: "#FC6D26" },
  aws: { color: "#FF9900" },
  gcp: { color: "#4285F4" },
  keycloak: { color: "#00B8E3", brand: "#4D4D4D" },
  python: { color: "#3776AB" },
  langchain: { color: "#7FC8FF" },
} satisfies Record<string, BrandColor>;

/** Unknown skill ids. */
export const FALLBACK_COLOR: BrandColor = { color: "#64748B" };

/**
 * Social links (keys = SocialPlatform in profile.ts). Contrast of `color`
 * against the hovered tile surface is checked in the step-9 report
 * (all ≥ 3:1 for non-text UI).
 */
export const SOCIAL_COLORS = {
  // GitHub dark-mode foreground; the official #181717 is invisible on dark.
  // Soft silver glow.
  github: { color: "#F0F6FC", brand: "#181717", glow: 22 },
  // Brighter tint of LinkedIn blue for contrast on dark.
  linkedin: { color: "#3B8FE0", brand: "#0A66C2" },
  // Gmail red; glow toned down so it doesn't fight the teal/violet theme.
  email: { color: "#EA4335", glow: 20 },
} satisfies Record<string, BrandColor>;

export function skillColor(id: string): BrandColor {
  return (SKILL_COLORS as Record<string, BrandColor>)[id] ?? FALLBACK_COLOR;
}
