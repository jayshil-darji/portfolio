"use client";

import {
  useCallback,
  useEffect,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { RotatingBorder } from "@/components/ui/rotating-border";
import { SpotlightNavbar } from "@/components/ui/spotlight-navbar";
import { NAV_ITEMS, SECTIONS } from "@/data/nav";
import { profile } from "@/data/profile";
import { useActiveSection } from "@/hooks/use-active-section";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";

/** Must match `--nav-height` (3.5rem) in globals.css. */
const NAV_HEIGHT_PX = 56;
const SECTION_IDS = SECTIONS.map((s) => s.id);

const initials = profile.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}

/**
 * Sticky site header.
 * - md+: Vengeance UI SpotlightNavbar (patched, controlled) driven by
 *   scroll-spy; below md: the full-screen MobileMenu. Both read NAV_ITEMS.
 * - Layout: flex justify-between below md (JD left, hamburger right);
 *   a 3-column grid from md so the nav stays centred. (A grid on mobile put
 *   the hamburger in the centre: the hidden nav is display:none, so it isn't
 *   a grid item and the menu wrapper fell into the middle `auto` column.)
 * - Transparent over the hero; blurred glass + border once scrolled. The
 *   border is always 1px (transparent at the top) → no layout shift.
 * - Navigation: smooth scroll (instant with reduced motion), hash updated
 *   via replaceState (no jump), indicator locked to the target while the
 *   programmatic scroll runs.
 */
export function Navbar() {
  const { active, lockTo } = useActiveSection({
    ids: SECTION_IDS,
    offset: NAV_HEIGHT_PX,
  });
  const reduced = usePrefersReducedMotion();
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 8,
    () => false,
  );

  const activeIndex = active
    ? NAV_ITEMS.findIndex((i) => i.id === active)
    : null;

  const navigate = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      lockTo(id);
      el.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
      const url =
        id === "hero" ? location.pathname + location.search : `#${id}`;
      history.replaceState(history.state, "", url);
    },
    [lockTo, reduced],
  );

  // Route every in-page section link on the page (hero CTA, scroll cue,
  // future ones) through navigate(), so the scroll-spy lock applies and
  // the spotlight doesn't flicker through the sections in between. Links
  // that handle themselves (navbar, mobile menu) call preventDefault first.
  useEffect(() => {
    const onClick = (e: globalThis.MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      const id = a?.getAttribute("href")?.slice(1);
      if (!id || !(SECTION_IDS as readonly string[]).includes(id)) return;
      e.preventDefault();
      navigate(id);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  const onBrandClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return;
    e.preventDefault();
    navigate("hero");
  };

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        "sticky top-0 z-50 h-[var(--nav-height)] w-full border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-white/10 bg-background/60 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <a
          href="#hero"
          onClick={onBrandClick}
          aria-label={`${profile.name}, back to top`}
          className="relative grid size-9 shrink-0 place-items-center justify-self-start rounded-lg border border-white/15 bg-white/5 text-xs font-bold tracking-tight text-foreground shadow-[0_0_16px_-4px_oklch(0.75_0.12_210/0.6)] transition-colors hover:border-white/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span aria-hidden="true">{initials}</span>
          {/* Thin rotating frame over the 1px border (radius inherited). */}
          <RotatingBorder inset="-1px" speed={6} startAngle={200} />
        </a>

        <SpotlightNavbar
          items={NAV_ITEMS}
          activeIndex={activeIndex}
          onItemClick={(item, _i, e) => {
            e.preventDefault();
            navigate(item.id);
          }}
          className="hidden md:block"
        />

        <div className="md:hidden">
          <MobileMenu
            items={NAV_ITEMS}
            activeId={active}
            onNavigate={navigate}
          />
        </div>
      </div>
    </header>
  );
}
