import type { CSSProperties, ReactNode } from "react";
import { ArrowDownRight, Mail } from "lucide-react";
import { HeroBackground } from "@/components/backgrounds/hero-background";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/brand-icons";
import { Section } from "@/components/layout/section";
import { CreepyButton } from "@/components/ui/creepy-button";
import { FlipText } from "@/components/ui/flip-text";
import { MorphText } from "@/components/ui/morph-text";
import SocialFlipButton, {
  type SocialItem,
} from "@/components/ui/social-flip-button";
import { SOCIAL_COLORS } from "@/data/brand-colors";
import { profile, type SocialPlatform } from "@/data/profile";

/** Entrance stagger: each `.hero-reveal` element waits `--d` before animating in. */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Presentation for the hero's social tiles (links come from profile.socials). */
const SOCIAL_UI: Partial<
  Record<SocialPlatform, { letter: string; icon: ReactNode; ariaLabel: string }>
> = {
  github: { letter: "G", icon: <GitHubIcon />, ariaLabel: "GitHub profile" },
  linkedin: {
    letter: "in",
    icon: <LinkedInIcon />,
    ariaLabel: "LinkedIn profile",
  },
  email: { letter: "@", icon: <Mail />, ariaLabel: `Email ${profile.name}` },
};

const HERO_SOCIALS: SocialItem[] = (
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

export function Hero() {
  return (
    <Section
      id="hero"
      // Full-bleed and full-viewport; pulled up under the translucent navbar.
      className="relative isolate -mt-[var(--nav-height)] flex min-h-svh max-w-none flex-col items-center justify-center overflow-hidden px-0 pt-28 pb-24 sm:px-0 md:py-32"
    >
      <HeroBackground />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6">
        <p
          className="hero-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
          style={delay(100)}
        >
          <span className="relative flex size-2">
            <span className="hero-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Hi, I&apos;m
        </p>

        <h1
          className="hero-reveal text-[clamp(2.5rem,11vw,7rem)] leading-none font-bold tracking-tight"
          style={delay(250)}
        >
          {/* Vengeance UI flip-text: periodic 3D letter roll after the entrance. */}
          <FlipText duration={6} delay={2}>
            {profile.name}
          </FlipText>
        </h1>

        <div className="hero-reveal mt-4 w-full sm:mt-6" style={delay(550)}>
          <p className="sr-only">{profile.roles.join(", ")}</p>
          <div aria-hidden="true">
            <MorphText
              words={profile.roles}
              interval={2800}
              // Sized so the longest role fits one line down to 320px.
              fontSize="clamp(0.95rem, 4.6vw, 2rem)"
              textClassName="hero-roles font-semibold"
            />
          </div>
        </div>

        <p
          className="hero-reveal mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:mt-6 sm:text-lg"
          style={delay(850)}
        >
          {profile.tagline}
        </p>

        {/* Only CTA: a real <a href="#projects">, so the navbar's in-page
            scroll handling (smooth scroll + spotlight lock) applies. No
            magnetic wrapper — its pull fought the eye tracking. */}
        <div className="hero-reveal mt-9 sm:mt-11" style={delay(1050)}>
          <CreepyButton
            href="#projects"
            className="text-base sm:text-[1.05rem]"
          >
            View My Work
            <ArrowDownRight aria-hidden="true" className="size-4" />
          </CreepyButton>
        </div>

        <div className="hero-reveal mt-8 sm:mt-10" style={delay(1250)}>
          <SocialFlipButton items={HERO_SOCIALS} listLabel="Social links" />
        </div>
      </div>

      <a
        href="#about"
        aria-label="Scroll to About section"
        className="hero-reveal absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground [@media(max-height:640px)]:hidden"
        style={delay(1600)}
      >
        <span className="flex h-9 w-6 justify-center rounded-full border-2 border-current pt-1.5">
          <span className="hero-scroll-dot block size-1.5 rounded-full bg-current" />
        </span>
        Scroll
      </a>
    </Section>
  );
}
