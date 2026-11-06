import { Section } from "@/components/layout/section";
import { profile } from "@/data/profile";

export function Contact() {
  return (
    <Section id="contact" title="Contact">
      <a href={`mailto:${profile.email}`} className="text-lg underline">
        {profile.email}
      </a>
      <ul className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {profile.socials.map((s) => (
          <li key={s.platform}>
            <a
              href={s.href}
              className="hover:text-foreground"
              {...(s.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
