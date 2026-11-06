import { Clock, MapPin } from "lucide-react";
import { ContactReveal } from "@/components/contact/contact-reveal";
import { CopyEmailButton } from "@/components/contact/copy-email-button";
import { LocalTime } from "@/components/contact/local-time";
import { Section } from "@/components/layout/section";
import { LightLines } from "@/components/ui/light-lines";
import LineHoverLink from "@/components/ui/line-hover-link";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";
import { MagneticSpotlightMarquee } from "@/components/ui/magnetic-spotlight-marquee";
import SocialFlipButton from "@/components/ui/social-flip-button";
import { profile } from "@/data/profile";
import { SOCIAL_ITEMS } from "@/lib/social-items";

const EMAIL_ID = "contact-email";

const LABEL =
  "font-mono text-xs tracking-widest text-muted-foreground uppercase";

/**
 * Closing scene: a full-bleed "Let's work together ✦" marquee band, then a
 * left-aligned split — pitch + location/time on the left, a glowing card
 * with the email and socials on the right (stacked below lg).
 * Background: plain dark with faint light lines along the bottom.
 */
export function Contact() {
  const { contact, timeZone } = profile;
  return (
    <Section
      id="contact"
      title="Contact"
      background={
        <LightLines
          linesOpacity={0.07}
          lightsOpacity={0.55}
          className="absolute inset-x-0 bottom-0 -z-10 h-[55%] [mask-image:linear-gradient(to_top,#000_20%,transparent)]"
        />
      }
      className="pb-32 md:pb-44"
    >
      {/* Full-bleed: 100vw centred on the container. The section clips
          overflow, so a classic scrollbar's width never causes h-scroll. */}
      <ContactReveal
        x={80}
        y={0}
        amount={0.4}
        className="ml-[calc(50%-50vw)] w-screen"
      >
        <MagneticSpotlightMarquee
          text={contact.marquee}
          className="border-y border-[var(--glass-border)]"
        />
      </ContactReveal>

      <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16">
        <div>
          <ContactReveal delay={0.3}>
            <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl md:text-4xl">
              {contact.heading}
            </h3>
          </ContactReveal>
          <ContactReveal delay={0.42}>
            <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
              {contact.subline}
            </p>
          </ContactReveal>
          <ContactReveal delay={0.54}>
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4" />
                {profile.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-4" />
                <LocalTime timeZone={timeZone.iana} /> {timeZone.abbreviation} (
                {timeZone.utcOffset})
              </span>
            </p>
          </ContactReveal>
        </div>

        <ContactReveal delay={0.66} y={40} amount={0.3}>
          <InteractiveGlowCard
            borderRadius="1.25rem"
            className="border border-[var(--glass-border)]"
            contentClassName="p-5 sm:p-7"
          >
            <address className="not-italic">
              <p className={LABEL}>Email me</p>
              <div className="mt-3 flex items-center gap-3">
                <LineHoverLink
                  id={EMAIL_ID}
                  href={`mailto:${profile.email}`}
                  variant="double"
                  className="min-w-0 text-[clamp(1rem,4.6vw,1.5rem)] font-semibold tracking-tight [overflow-wrap:anywhere]"
                >
                  {profile.email}
                </LineHoverLink>
                <CopyEmailButton
                  text={profile.email}
                  selectTargetId={EMAIL_ID}
                />
              </div>

              <hr className="my-7 border-[var(--glass-border)]" />

              <p className={LABEL}>Find me online</p>
              <SocialFlipButton
                items={SOCIAL_ITEMS}
                listLabel="Social links"
                className="mt-4 w-fit"
                borderStartAngle={115}
              />
            </address>
          </InteractiveGlowCard>
        </ContactReveal>
      </div>
    </Section>
  );
}
