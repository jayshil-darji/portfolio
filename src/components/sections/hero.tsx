import type { CSSProperties } from "react";
import { ArrowDownRight } from "lucide-react";
import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { HeroName } from "@/components/hero/hero-name";
import { HeroVideoBackground } from "@/components/hero/hero-video-background";
import { Section } from "@/components/layout/section";
import { CreepyButton } from "@/components/ui/creepy-button";
import { MorphText } from "@/components/ui/morph-text";
import SocialFlipButton from "@/components/ui/social-flip-button";
import { HERO_BACKDROPS, HERO_BACKGROUND } from "@/data/hero-background";
import { profile } from "@/data/profile";
import { SOCIAL_ITEMS } from "@/lib/social-items";
import { cn } from "@/lib/utils";

/** Entrance stagger: each `.hero-reveal` element waits `--d` before animating in. */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Roles cycle (MorphText). The name loop (2 slots = 7s) is phase-locked
 *  to it so the two never animate at the same moment. */
const ROLE_INTERVAL_MS = 3500;

/** The backdrop's subject sits on the right → content in the left half (lg+). */
const LEFT = HERO_BACKDROPS[HERO_BACKGROUND].align === "left";

export function Hero() {
  return (
    <Section
      id="hero"
      // Full-bleed and full-viewport; pulled up under the translucent navbar.
      className="relative isolate -mt-[var(--nav-height)] flex min-h-svh max-w-none flex-col items-center justify-center overflow-hidden px-0 pt-28 pb-24 sm:px-0 md:py-32"
    >
      <HeroVideoBackground variant={HERO_BACKGROUND} />

      <div
        className={cn(
          "mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-6",
          LEFT &&
            "hero-content-left lg:mx-0 lg:w-[54%] lg:max-w-none lg:items-start lg:self-start lg:pr-0 lg:pl-[max(3rem,calc(50vw-36rem))] lg:text-left",
        )}
      >
        <p
          {...agentBuildAttrs("block")}
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
          {...agentBuildAttrs("text", "hero-name")}
          className={cn(
            "hero-reveal text-[clamp(2.5rem,11vw,7rem)] leading-none font-bold tracking-tight",
            // Half-width column: sized so the name fits it.
            LEFT && "lg:text-[clamp(3.5rem,5.6vw,6rem)]",
          )}
          style={delay(250)}
        >
          {/* The real name for SEO / screen readers; the looping flip-fade
              (Vengeance UI flip-fade-text) is visual only. */}
          <span className="sr-only">{profile.name}</span>
          <HeroName
            name={profile.name}
            rolePeriodMs={ROLE_INTERVAL_MS}
            syncSelector=".hero-roles .morph-word"
          />
        </h1>

        <div
          {...agentBuildAttrs("text", "hero-roles")}
          className="hero-reveal mt-4 w-full sm:mt-6"
          style={delay(550)}
        >
          <p className="sr-only">{profile.roles.join(", ")}</p>
          <div aria-hidden="true">
            <MorphText
              words={profile.roles}
              interval={ROLE_INTERVAL_MS}
              // Sized so the longest role fits one line down to 320px.
              fontSize="clamp(0.95rem, 4.6vw, 2rem)"
              textClassName="hero-roles font-semibold"
            />
          </div>
        </div>

        <p
          {...agentBuildAttrs("text")}
          className={cn(
            "hero-reveal mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:mt-6 sm:text-lg",
            // Wraps short of the character's face at 1024–1279px.
            LEFT && "lg:max-w-md xl:max-w-xl",
          )}
          style={delay(850)}
        >
          {profile.tagline}
        </p>

        {/* Only CTA: a real <a href="#projects">, so the navbar's in-page
            scroll handling (smooth scroll + spotlight lock) applies. No
            magnetic wrapper — its pull fought the eye tracking. */}
        <div
          {...agentBuildAttrs("block")}
          className="hero-reveal mt-9 sm:mt-11"
          style={delay(1050)}
        >
          <CreepyButton
            href="#projects"
            className="text-base sm:text-[1.05rem]"
          >
            View My Work
            <ArrowDownRight aria-hidden="true" className="size-4" />
          </CreepyButton>
        </div>

        <div
          {...agentBuildAttrs("block")}
          className="hero-reveal mt-8 sm:mt-10"
          style={delay(1250)}
        >
          <SocialFlipButton items={SOCIAL_ITEMS} listLabel="Social links" />
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
