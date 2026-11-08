import { BuildRoot } from "@/components/experimental/agent-cursor/build-root";
import {
  About,
  Contact,
  Currently,
  Experience,
  Hero,
  Projects,
  Skills,
} from "@/components/sections";
import { profile } from "@/data/profile";
import { SITE_URL } from "@/lib/site-url";

/** schema.org Person (structured data for search engines). */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  givenName: profile.seo.firstName,
  familyName: profile.seo.lastName,
  jobTitle: profile.title,
  description: profile.seo.description,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image.png`,
  address: {
    "@type": "PostalAddress",
    addressRegion: profile.seo.address.region,
    addressCountry: profile.seo.address.country,
  },
  sameAs: profile.socials
    .filter((s) => s.platform === "linkedin" || s.platform === "github")
    .map((s) => s.href),
};

export default function Home() {
  return (
    // id + tabIndex: target of the "Skip to content" link (layout.tsx).
    <main id="main" tabIndex={-1} className="flex-1 outline-none">
      <script
        type="application/ld+json"
        // `<` escaped so the payload can never close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Hero />
      <About />
      <Currently />
      <Skills />
      <Experience />
      <Projects />
      <Contact />
      {/* EXPERIMENT (agent-cursor): inside the page so the builder only
          mounts after the page content has hydrated. Nothing when off. */}
      <BuildRoot />
    </main>
  );
}
