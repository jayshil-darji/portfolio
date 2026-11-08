import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { CreepyButton } from "@/components/ui/creepy-button";
import { RotatingBorder } from "@/components/ui/rotating-border";

export const metadata: Metadata = {
  // → "Page not found · Jayshil Darji" (layout's title template).
  title: "Page not found",
};

/**
 * 404 (rendered inside the root layout: navbar + footer stay; navbar links
 * lead back to the home page's sections). Static, CSS-only: the "404"
 * fades in with the hero entrance (.hero-reveal, reduced-motion aware).
 */
export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-24 outline-none sm:px-6"
    >
      {/* Soft brand glow behind the code (decorative). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[36rem] max-w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--brand-blue)_22%,transparent),transparent_65%)]"
      />
      <div className="flex max-w-md flex-col items-center text-center">
        <div
          className="hero-reveal relative mb-8 grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/5 font-mono text-sm text-muted-foreground"
          style={{ "--d": "0ms" } as CSSProperties}
        >
          <RotatingBorder radius="1rem" speed={6} />
          404
        </div>
        <h1
          className="hero-reveal bg-linear-to-r from-brand-teal via-sky-200 to-brand-violet bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
          style={{ "--d": "80ms" } as CSSProperties}
        >
          Page not found
        </h1>
        <p
          className="hero-reveal mt-4 text-base text-muted-foreground sm:text-lg"
          style={{ "--d": "160ms" } as CSSProperties}
        >
          This page doesn&apos;t exist or has moved. Everything I do is on the
          home page.
        </p>
        <div
          className="hero-reveal mt-9"
          style={{ "--d": "240ms" } as CSSProperties}
        >
          <CreepyButton href="/" className="text-base">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back home
          </CreepyButton>
        </div>
      </div>
    </main>
  );
}
