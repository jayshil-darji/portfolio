"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NavItem } from "@/data/nav";
import { profile } from "@/data/profile";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const overlay: Variants = {
  closed: { opacity: 0, transition: { duration: 0.25, when: "afterChildren" } },
  open: { opacity: 1, transition: { duration: 0.3, when: "beforeChildren" } },
};

const list: Variants = {
  closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const item: Variants = {
  closed: { opacity: 0, y: 24, transition: { duration: 0.2 } },
  open: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen mobile navigation (below md).
 * - Toggle button morphs hamburger ⇄ X. The overlay sits *under* the sticky
 *   header (z-40 vs z-50), so the brand + toggle stay visible on top.
 * - Overlay is portalled to <body> (the header's backdrop-filter would
 *   otherwise become the containing block for position: fixed).
 * - Closes on link click, Escape, any hash navigation, and resize to md+.
 * - Body scroll is locked while open; focus is trapped between the toggle
 *   button and the overlay links, and returned to the toggle on close.
 * - Nothing is rendered in the overlay until opened, so SSR and hydration
 *   markup are identical.
 * - Shares the desktop nav config and scroll-spy: the section in view is
 *   marked (aria-current) and links navigate via the same `onNavigate`
 *   (smooth scroll + hash update + indicator lock).
 */
export function MobileMenu({
  items,
  activeId,
  onNavigate,
}: {
  items: readonly NavItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const isClient = useIsClient();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Scroll lock, Escape, focus trap, auto-close at md+.
  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    // Move focus into the menu once it has rendered.
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [
        buttonRef.current,
        ...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
      ].filter(Boolean) as HTMLElement[];
      if (items.length === 0) return;
      // Fully manual cycling: the toggle lives in the header but the panel is
      // portalled to the end of <body>, so native DOM tab order would escape
      // from the toggle into the page content behind the overlay.
      e.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const step = e.shiftKey ? -1 : 1;
      const next =
        index === -1
          ? e.shiftKey
            ? items.length - 1
            : 0
          : (index + step + items.length) % items.length;
      items[next].focus();
    }

    const mql = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (e: MediaQueryListEvent) => e.matches && close(false);

    const onHashChange = () => close(false);

    document.addEventListener("keydown", onKeyDown);
    mql.addEventListener("change", onBreakpoint);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      cancelAnimationFrame(raf);
      root.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mql.removeEventListener("change", onBreakpoint);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="relative -mr-2 flex size-10 items-center justify-center rounded-md text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
      >
        <span aria-hidden="true" className="relative block h-3.5 w-5">
          <span
            className={cn(
              "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-[top,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              open ? "top-1.5 rotate-45" : "top-0",
            )}
          />
          <span
            className={cn(
              "absolute top-1.5 left-0 block h-0.5 w-5 rounded-full bg-current transition-opacity duration-200 motion-reduce:transition-none",
              open ? "opacity-0" : "opacity-100",
            )}
          />
          <span
            className={cn(
              "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-[top,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              open ? "top-1.5 -rotate-45" : "top-3",
            )}
          />
        </span>
      </button>

      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                id={panelId}
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
                className="fixed inset-0 z-40 flex flex-col bg-background/95 px-6 pt-24 pb-10 backdrop-blur-xl md:hidden"
                variants={overlay}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <nav aria-label="Primary">
                  <motion.ul variants={list} className="flex flex-col gap-1">
                    {items.map((link, i) => {
                      const active = activeId === link.id;
                      return (
                        <motion.li key={link.id} variants={item}>
                          <a
                            href={link.href}
                            aria-current={active ? "location" : undefined}
                            onClick={(e) => {
                              if (
                                e.metaKey ||
                                e.ctrlKey ||
                                e.shiftKey ||
                                e.altKey
                              )
                                return;
                              e.preventDefault();
                              close(false);
                              // Navigate once the scroll lock is released (next frames).
                              requestAnimationFrame(() =>
                                requestAnimationFrame(() =>
                                  onNavigate(link.id),
                                ),
                              );
                            }}
                            className={cn(
                              "group flex items-baseline gap-4 rounded-lg py-3 text-3xl font-semibold tracking-tight transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none",
                              active ? "text-foreground" : "text-foreground/65",
                            )}
                          >
                            <span
                              className={cn(
                                "font-mono text-xs tabular-nums",
                                active
                                  ? "text-sky-300"
                                  : "text-muted-foreground",
                              )}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span
                              className={cn(
                                "bg-linear-to-r from-current to-current bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-300 group-hover:bg-[length:100%_2px] group-focus-visible:bg-[length:100%_2px]",
                                active
                                  ? "bg-[length:100%_2px]"
                                  : "bg-[length:0%_2px]",
                              )}
                            >
                              {link.label}
                            </span>
                          </a>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </nav>

                <motion.div
                  variants={item}
                  className="mt-auto border-t border-border pt-6 text-sm text-muted-foreground"
                >
                  <a
                    href={`mailto:${profile.email}`}
                    onClick={() => close(false)}
                    className="truncate hover:text-foreground"
                  >
                    {profile.email}
                  </a>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
