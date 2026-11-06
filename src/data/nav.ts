/**
 * Single source of truth for page sections and navigation.
 * Order = page order. `hero` is the top of the page (not a nav item).
 */
export const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "currently", label: "Now" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export interface NavItem {
  id: Exclude<SectionId, "hero">;
  label: string;
  href: `#${string}`;
}

/** Navbar + mobile menu items (every section except the hero). */
export const NAV_ITEMS: NavItem[] = SECTIONS.filter(
  (s): s is Exclude<(typeof SECTIONS)[number], { id: "hero" }> =>
    s.id !== "hero",
).map((s) => ({ id: s.id, label: s.label, href: `#${s.id}` }));
