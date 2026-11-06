import { CurrentlyCards } from "@/components/currently/currently-cards";
import { Section } from "@/components/layout/section";
import { profile } from "@/data/profile";

export function Currently() {
  return (
    <Section id="currently" title="Currently" className="md:py-20">
      <CurrentlyCards items={profile.currently} />
    </Section>
  );
}
