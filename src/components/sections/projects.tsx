import { agentBuildAttrs } from "@/components/experimental/agent-cursor/config";
import { Section } from "@/components/layout/section";
import { ProjectsBento } from "@/components/projects/projects-bento";
import { profile } from "@/data/profile";

export function Projects() {
  return (
    <Section id="projects" title={profile.projectsIntro.title} className="max-w-6xl">
      <p
        className="-mt-6 mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg md:-mt-8"
        {...agentBuildAttrs("text")}
      >
        {profile.projectsIntro.description}
      </p>
      <ProjectsBento projects={profile.projects} />
    </Section>
  );
}
