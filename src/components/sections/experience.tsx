import { Section } from "@/components/layout/section";
import { profile } from "@/data/profile";

export function Experience() {
  return (
    <Section id="experience" title="Experience">
      <ol className="space-y-6">
        {profile.experience.map((job) => (
          <li key={`${job.company}-${job.start}`}>
            <p className="font-medium">
              {job.role} · {job.company}
            </p>
            <p className="text-sm text-muted-foreground">
              {job.start} — {job.end}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
