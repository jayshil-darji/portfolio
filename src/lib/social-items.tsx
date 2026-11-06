import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/brand-icons";
import type { SocialItem } from "@/components/ui/social-flip-button";
import { SOCIAL_COLORS } from "@/data/brand-colors";
import { profile, type SocialPlatform } from "@/data/profile";

/**
 * Presentation for the social tiles (links come from profile.socials).
 * No `letter`: both faces show the real icon (neutral front, brand-coloured
 * back) — a letter front face is what pointer devices see at rest.
 */
const SOCIAL_UI: Partial<
  Record<SocialPlatform, { icon: ReactNode; ariaLabel: string }>
> = {
  github: { icon: <GitHubIcon />, ariaLabel: "GitHub profile" },
  linkedin: { icon: <LinkedInIcon />, ariaLabel: "LinkedIn profile" },
  email: { icon: <Mail />, ariaLabel: `Email ${profile.name}` },
};

/**
 * GitHub / LinkedIn / Email tiles for SocialFlipButton — shared by the hero
 * and the Contact section (brand colours from data/brand-colors.ts).
 */
export const SOCIAL_ITEMS: SocialItem[] = (
  ["github", "linkedin", "email"] as const
).flatMap((platform) => {
  const link = profile.socials.find((s) => s.platform === platform);
  const ui = SOCIAL_UI[platform];
  const { color, glow } = SOCIAL_COLORS[platform] as {
    color: string;
    glow?: number;
  };
  return link && ui
    ? [{ ...ui, label: link.label, href: link.href, color, glow }]
    : [];
});
