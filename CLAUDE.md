@AGENTS.md

# Jayshil Portfolio — Project Guide

Personal portfolio / professional intro site for a Senior Software Engineer
(Angular / React / Node / TypeScript, 10 yrs). The site's goal is **heavy,
polished animation** that is still fast and accessible.

## Tech stack (fixed — do not swap)

| Concern            | Choice                                                        |
| ------------------ | ------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, TypeScript, `src/` dir, Turbopack)    |
| Styling            | Tailwind CSS v4 (CSS-first config in `src/app/globals.css`)   |
| Component registry | shadcn CLI (`components.json`, style `base-nova`)             |
| Animated components| Vengeance UI — https://www.vengenceui.com                     |
| Custom animation   | Motion (Framer Motion) — import from `motion/react`           |
| Icons              | lucide-react                                                  |
| Hosting            | Vercel (free tier)                                            |

### Adding Vengeance UI components

The registry is configured in `components.json`:

```json
"registries": {
  "@vengeanceui": "https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/public/r/{name}.json"
}
```

Install with `npx shadcn@latest add @vengeanceui/<component>` → lands in
`src/components/ui/`.

After adding a component, always review it — registry code is copied into
the repo and is ours to maintain. Checklist:

- **Missing CSS:** some items rely on global CSS from the Vengeance UI repo
  (or missing upstream entirely, e.g. `animated-rays`). Vendor it into
  `src/styles/vengeance.css` (prefix keyframes `vui-`, add a
  `prefers-reduced-motion` fallback).
- **`framer-motion` imports:** rewrite to `motion/react` and
  `npm uninstall framer-motion` afterwards (shadcn re-adds it). One runtime.
- **Hydration hazards:** `Math.random()`, unrounded float math (e.g.
  `Math.sin` differs between Node and Chrome in the last digit), `window`
  reads during render, setState-in-effect "mounted" flags.
- **Runtime font `@import`s / external requests:** remove (Lighthouse).
- **A11y:** buttons used for navigation → `<a>`, no nested interactive
  elements, decorative layers `aria-hidden`.
- Mark every change with a `LOCAL PATCH:` comment so re-adding the component
  (`--overwrite`) doesn't silently lose fixes.

Installed + patched so far: `flip-text`, `animated-rays`, `morph-text`,
`stats-counter`, `stagger-text`, `border-beam`, `solar-system`,
`interactive-particles`, `ascii-glitch-ripple`, `expandable-bento-grid`
(largely rewritten: in-grid accordion expansion instead of upstream's
modal; see its header), `spotlight-navbar` (controlled `activeIndex`),
`creepy-button` (href support, CSS-driven), `social-flip-button`
(CSS-driven, icons passed in).
Removed once unused (no dead code): `interactive-hover-button`,
`animated-tooltip`, `glow-border-card`, and the Magnetic / Tilt
primitives.

**Don't blindly re-run `shadcn add` on an installed component** — it
overwrites the file and silently drops every `LOCAL PATCH`. Diff the
registry JSON against the local file first.

If `raw.githubusercontent.com` is unreachable (it was during step 5), fetch
the registry JSON from jsDelivr pinned to a commit SHA (get it from
`api.github.com/repos/Ashutoshx7/VengeanceUI/commits/main`):
`https://cdn.jsdelivr.net/gh/Ashutoshx7/VengeanceUI@<sha>/public/r/<name>.json`.

**Not every documented component is in the registry.** `solar-system` 404s
(`public/r/solar-system.json` doesn't exist on any branch); it was copied from
`src/components/ui/solar-system.tsx` @ `3be420d`. Its docs also describe props
and features (title/description, `code`, editor sidebar, ring filters) that
the source doesn't implement — those live in `src/components/skills/`. Before
building on a component, check the registry JSON exists and diff the docs'
props table against the actual source.

## Folder structure

```
src/
├── app/
│   ├── globals.css        # Tailwind v4 + shadcn theme tokens + global motion rules
│   ├── layout.tsx         # <html class="dark">, fonts, metadata, Navbar, MotionProvider
│   └── page.tsx           # Single page: composes the sections in order
├── components/
│   ├── about/             # About-section client parts (AboutPhoto)
│   ├── backgrounds/       # Decorative animated backdrops (e.g. hero-background)
│   ├── currently/         # Currently-section client parts (CurrentlyCards)
│   ├── skills/            # Skills UI: explorer, filter tabs, chips, detail, code block
│   ├── icons/             # Brand SVG icons (lucide v1 has no brand icons)
│   ├── layout/            # Navbar (spotlight + scroll-spy), MobileMenu, Section + SectionHeading
│   ├── motion/            # Reusable Motion primitives (ScrollRevealText)
│   ├── projects/          # Projects UI: bento (+ span packing), generated covers
│   ├── providers/         # Client providers (MotionConfig, …)
│   ├── sections/          # ONE component per page section (+ index.ts barrel)
│   └── ui/                # shadcn / Vengeance UI components (CLI-managed)
├── data/
│   ├── brand-colors.ts    # Brand colours (skills + socials) — the only place for brand hex values
│   ├── nav.ts             # Section ids + nav items (navbar, mobile menu, headings)
│   └── profile.ts         # ALL personal content (typed; "TODO…" = placeholder)
├── hooks/
│   ├── use-active-section.ts          # scroll-spy (IntersectionObserver) + click lock
│   ├── use-is-client.ts               # hydration-safe "mounted" flag
│   └── use-prefers-reduced-motion.ts  # hydration-safe reduced-motion hook
├── lib/
│   ├── skill-icons.tsx    # Skill logos (simple-icons + monograms) as an SVG sprite
│   ├── skills-to-orbits.ts # profile.skills → SolarSystem rings + filter groups
│   └── utils.ts           # cn() helper
└── styles/
    ├── hero.css           # Hero entrance stagger + background layers
    ├── solar-system.css   # Scoped styles for the patched SolarSystem
    └── vengeance.css      # CSS that Vengeance UI components need but don't ship
```

Sections (in order, each with matching `id`): `hero`, `about`, `currently`,
`skills`, `experience`, `projects`, `contact`.

## Rules

1. **Content lives in one file.** All personal content — name, roles,
   experience, projects, skills, links, SEO text — lives in
   `src/data/profile.ts`. Components import `profile` and **never hardcode**
   personal details. Extend the types there when new content is needed.
2. **One section = one component** in `src/components/sections/`, exported via
   `src/components/sections/index.ts`, wrapped in the shared `<Section id=…>`.
   Section ids must come from `src/data/nav.ts` (`SectionId` type); adding a
   section there adds it to the navbar, mobile menu and scroll-spy.
   Sections stay server components; client-only parts go in a folder named
   after the section (e.g. `components/about/`).
3. **Respect `prefers-reduced-motion` for all heavy animation.**
   - Prefer CSS: `@media (prefers-reduced-motion: reduce)` fallbacks need no
     JS and can't cause hydration mismatches.
   - Motion: `MotionConfig reducedMotion="user"` is set globally. For JS
     behaviour (pointer effects, timers, canvas/WebGL) use
     `usePrefersReducedMotion()` from `src/hooks/`. **Do not** branch markup
     on motion's `useReducedMotion()` — it returns `null` on the server and a
     boolean on the client → hydration mismatch.
   - CSS animations: add a `@media (prefers-reduced-motion: reduce)` fallback.
     `globals.css` has a global safety net, but don't rely on it alone.
4. **Mobile-first, Lighthouse-aware.**
   - Write base styles for mobile, then `sm:` / `md:` / `lg:` up.
   - Default to Server Components; add `"use client"` only to the smallest
     leaf that needs it.
   - Lazy-load heavy/below-the-fold animated components
     (`next/dynamic`, intersection-triggered mounting); avoid shipping
     WebGL/canvas on first paint.
   - Animate `transform` / `opacity` only; avoid layout thrash.
   - Above-the-fold entrance animations are CSS (`.hero-reveal` + `--d`
     delay) so the LCP text doesn't wait for hydration.
   - Pause off-screen ambient loops (see `HeroBackground` + `data-paused`).

### Gotchas learned the hard way
- Never `typeof window` / `typeof document` in render or setState-in-effect
  "mounted" flags — use `useIsClient()`.
- `useInView` / `whileInView`: don't put the observed element inside a
  `preserve-3d` / tilt context or an overflow-clipped card — observe a plain
  outer wrapper and drive `animate` from it. Use vertical-only `margin`
  (e.g. `"0px 0px -10% 0px"`); a uniform negative margin also shrinks the
  viewport horizontally and narrow elements near the edge never trigger.
- `position: fixed` inside an element with `backdrop-filter`/`transform` is
  trapped by it — portal overlays to `<body>` (see `MobileMenu`).
- `mix-blend-mode` inside a stacking context with a transparent backdrop
  paints raw colour — give the context an opaque background.
- Animated layouts with many labels: measure, don't eyeball. The skills orbit
  was tuned by scrubbing every animation with the Web Animations API and
  counting overlapping label boxes (6 rings → avg 5.7 overlaps; 4 rings,
  60° tilt, perspective 2000 → ~1). The static reduced-motion frame matters
  too: ring `phase` offsets took it from 10 overlaps to 0. Note: a CSS
  animation's `currentTime` excludes its (negative) `animation-delay`.
- Heavy client libs (three.js ≈ 132 KB gz) must be `next/dynamic` +
  `ssr:false` AND mounted only when needed (in-view + motion allowed). Keep
  the trigger margin small for sections right below the hero — a big margin
  is already "near" at page load. Always provide a static fallback (photo)
  and handle WebGL failure / low FPS (`InteractiveParticles` onError /
  onLowFps).
- Animated numbers: odometer cells (one span per digit position, leading
  ones `invisible`) keep width AND text-node positions fixed → CLS 0.
  Padding with U+2007 is not safe: Geist lacks the glyph.
- Text scramble effects must keep the real text in the DOM (SSR, a11y,
  layout) and draw the scramble in an aria-hidden overlay — see
  `ascii-glitch-ripple` patches.
- Testing WebGL headlessly: default headless Chrome uses SwiftShader (CPU,
  ~2 fps with particles) — it trips the low-FPS fallback. Launch with
  `--enable-gpu --use-angle=gl` to use the real GPU.
- Brand-tinted UI (skill planets/chips, social buttons) reads colours ONLY
  from `src/data/brand-colors.ts` and highlights with the shared recipe in
  globals.css (`--brand-glow-shade`, `--brand-glow-blur`,
  `--brand-glow-mix`). Per-element colour goes in a CSS var (`--c` /
  `--brand`), never in duplicated rule sets. Check ≥3:1 contrast for new
  brand tints on the dark surface. Glass surface tokens: `--glass-surface`,
  `--glass-border` (navbar pill, social tiles).
- Brand accents are theme tokens: `--brand-teal`, `--brand-blue`,
  `--brand-violet` (globals.css; Tailwind `brand-*`). Use them (or
  `color-mix` of them) for accent colours — never hard-code the oklch
  values or upstream component colours.
- Removing a flex/grid child with `display:none` (e.g. `hidden md:block`)
  takes it out of the layout entirely — a grid then re-flows the remaining
  children into different columns. The header is flex below md, grid above.
- Navbar height lives in one CSS var, `--nav-height` (globals.css): header
  height, `section[id]` scroll-margin-top and the hero's pull-up all use
  it. `NAV_HEIGHT_PX` in navbar.tsx must match.
- In-page navigation goes through `navigate()` in navbar.tsx (smooth
  scroll, `history.replaceState` hash, scroll-spy `lockTo`). Plain
  `<a href="#section">` links anywhere on the page are picked up by its
  delegated click listener automatically — no extra wiring needed.
- Section headings all use the shared stagger reveal (`<Section title>`);
  the ASCII glitch is reserved for inline keywords (About bio).
- Expandable grids: never use `grid-auto-flow: dense` to fill holes (it
  breaks keyboard/reading order). Compute spans in DOM order instead —
  see `components/projects/bento-layout.ts`. A collapsed tile that has to
  span a full row switches to a horizontal layout so it doesn't balloon.
- Repeated SVG logos: use a sprite (`<symbol>` once, `<use href>` per
  instance). Props passed from server to client components are serialised
  into the RSC payload, so inline SVG gets shipped once per usage *plus*
  once per prop.
- Testing scroll effects: drive the page with real wheel input
  (`page.mouse.wheel`), not `scrollTo()`. Programmatic scroll doesn't end the
  LCP measurement, so Next warns that below-the-fold images are the LCP.
   - Use `next/image` and `next/font`; reserve space to keep CLS ≈ 0.
5. **Dark theme is the default** (`class="dark"` on `<html>`). Use the shadcn
   tokens (`bg-background`, `text-muted-foreground`, …), not raw colours.
6. Run `npm run lint` and `npm run build`, then load the page and confirm the
   browser console is clean (no hydration warnings), at 375px and desktop,
   with and without reduced motion, before calling a change done.
