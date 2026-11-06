import { Section } from "@/components/layout/section";
import { SkillsExplorer } from "@/components/skills/skills-explorer";
import { profile } from "@/data/profile";
import { SkillIconSprite } from "@/lib/skill-icons";
import { skillsToOrbits } from "@/lib/skills-to-orbits";

const { orbits, groups } = skillsToOrbits(profile.skills);

const initials = profile.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase();

export function Skills() {
  return (
    <Section
      id="skills"
      title={profile.skillsIntro.title}
      className="max-w-7xl"
    >
      <p className="-mt-6 mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg md:-mt-8">
        {profile.skillsIntro.description}
      </p>
      <SkillIconSprite skills={profile.skills.flatMap((g) => g.skills)} />
      <SkillsExplorer
        orbits={orbits}
        groups={groups}
        centerInitials={initials}
        centerAlt={profile.name}
        defaultSelectedId={profile.skills[0]?.skills[0]?.id}
      />
    </Section>
  );
}
