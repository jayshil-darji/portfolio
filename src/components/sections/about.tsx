import { existsSync } from "node:fs";
import path from "node:path";
import { AboutPhoto } from "@/components/about/about-photo";
import { Section } from "@/components/layout/section";
import { ScrollRevealText } from "@/components/motion/scroll-reveal-text";
import StatsCounter from "@/components/ui/stats-counter";
import { profile } from "@/data/profile";

const initials = profile.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

/**
 * Build-time checks (server only — they log in the build output, never in
 * the visitor's console):
 *  - photoCutout missing on disk → fall back to the regular photo.
 *  - an aboutHighlights phrase not found verbatim in the bio.
 */
function resolveParticleSource(): string {
  const cutout = profile.photoCutout;
  if (cutout && existsSync(path.join(process.cwd(), "public", cutout))) {
    return cutout;
  }
  console.warn(
    `[about] photoCutout ${cutout ? `"${cutout}" not found in /public` : "not set"} — particles will use ${profile.photo}.`,
  );
  return profile.photo;
}

const bio = profile.about.join("\n");
for (const phrase of profile.aboutHighlights) {
  if (!bio.includes(phrase)) {
    console.warn(
      `[about] aboutHighlights phrase "${phrase}" does not appear in profile.about — it won't be highlighted.`,
    );
  }
}

const particleSrc = resolveParticleSource();

export function About() {
  return (
    <Section id="about" title="About me">
      <div className="grid items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        <AboutPhoto
          photo={profile.photo}
          particleSrc={particleSrc}
          label={`Portrait of ${profile.name}`}
          initials={initials}
        />

        <div>
          <div className="space-y-5">
            {profile.about.map((paragraph, i) => (
              <ScrollRevealText
                key={i}
                text={paragraph}
                highlights={profile.aboutHighlights}
                highlightClassName="font-medium text-sky-200 underline decoration-sky-400/60 decoration-dotted decoration-[1.5px] underline-offset-[6px] transition-colors hover:text-sky-100 hover:decoration-sky-300"
                className="text-lg leading-relaxed text-foreground sm:text-xl md:text-[1.375rem] md:leading-relaxed"
              />
            ))}
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8 sm:gap-6">
            {profile.stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1">
                <dt className="text-xs leading-snug text-muted-foreground sm:text-sm">
                  {stat.label}
                </dt>
                <dd className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  <StatsCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={2}
                    delay={i * 0.15}
                    className="bg-linear-to-br from-white to-sky-200 bg-clip-text text-transparent"
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
