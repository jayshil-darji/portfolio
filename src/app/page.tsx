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
    </main>
  );
}
