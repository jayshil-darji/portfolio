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

export default function Home() {
  return (
    <main className="flex-1">
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
