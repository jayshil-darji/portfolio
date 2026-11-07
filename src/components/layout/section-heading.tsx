import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { AsciiGlitchRipple } from "@/components/ui/ascii-glitch-ripple";
import { SectionTitleText } from "./section-title-text";
import { SECTIONS, type SectionId } from "@/data/nav";

export type TitleEffect = "stagger" | "glitch";

const TITLE_CLASS =
  "text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl";

/**
 * Numbered kicker ("01 / About") + large title.
 * - "stagger" (default): word-by-word reveal (Vengeance UI stagger-text).
 * - "glitch": Vengeance UI ascii-glitch-ripple rendered as the real <h2>;
 *   ripples once when scrolled into view and again on hover.
 */
export function SectionHeading({
  id,
  title,
  effect = "stagger",
}: {
  id: SectionId;
  title: string;
  effect?: TitleEffect;
}) {
  const index = SECTIONS.findIndex((s) => s.id === id);
  const label = SECTIONS[index]?.label ?? title;

  return (
    // EXPERIMENT (agent-cursor): eyebrow + heading = one build unit.
    <div className="mb-10 md:mb-14" {...agentBuildAttrs("text")}>
      <p className="mb-3 flex items-center gap-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        <span className="text-sky-300/80">
          {String(index).padStart(2, "0")}
        </span>
        <span aria-hidden="true" className="h-px w-8 bg-border" />
        {label}
      </p>
      {effect === "glitch" ? (
        <AsciiGlitchRipple
          as="h2"
          id={`${id}-heading`}
          triggerOnView
          dur={1100}
          className={TITLE_CLASS}
        >
          {title}
        </AsciiGlitchRipple>
      ) : (
        <h2 id={`${id}-heading`} className={TITLE_CLASS}>
          <SectionTitleText title={title} />
        </h2>
      )}
    </div>
  );
}
