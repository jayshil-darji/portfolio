import { ExperienceTimeline } from "@/components/experience/experience-timeline";
import { Section } from "@/components/layout/section";
import { profile } from "@/data/profile";

export function Experience() {
  return (
    <Section id="experience" title="Experience">
      <ExperienceTimeline entries={profile.experience} />
    </Section>
  );
}
