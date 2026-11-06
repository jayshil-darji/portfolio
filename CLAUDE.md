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

Installed + patched so far: `flip-fade-text` (hero name loop; grapheme-safe,
reserves the largest word's box, single-word replay, `alignTo` phase lock),
`animated-rays`, `morph-text`,
`stats-counter`, `stagger-text`, `border-beam`, `solar-system`,
`interactive-particles`, `ascii-glitch-ripple`, `expandable-bento-grid`
(largely rewritten: in-grid accordion expansion instead of upstream's
modal; see its header), `spotlight-navbar` (controlled `activeIndex`),
`creepy-button` (href support, CSS-driven), `social-flip-button`
(CSS-driven, icons passed in, icon on both faces — no letter monograms;
frame is a <div> whose border sweep is the shared RotatingBorder),
`glow-border-card` (token colours, `animate="hover"`; wrapped by our
`ui/interactive-glow-card.tsx` = ring + cursor highlight, shared by the
Contact and Experience cards), `line-hover-link` (CSS moved to
vengeance.css), `light-lines` (CSS
keyframes instead of a rAF loop; Contact background),
`expandable-bento-grid` also has a `decoration` slot (direct child of the
tile <li>, e.g. a RotatingBorder).
Our own shared primitives in `ui/`: `rotating-border.tsx` (rotating
gradient frame — hero + Contact socials, navbar monogram, Currently cards,
Skills detail card wrapper, project tiles; vary `startAngle`/`speed` per
instance), `interactive-glow-card.tsx`.
`magnetic-spotlight-marquee` (NOT in the registry — copied from source
@ 298075b and rewritten as a text marquee; see its header),
`staggered-grid` (Currently cards; written from the registry source, not
`shadcn add`, which would install gsap — rewritten as a generic
column-offset list with a middle-out entrance; see its header).
Tried and not kept: `liquid-text` (WebGL canvas text: not accessible,
131 KB gz with three.js, always-on render loop), `wave-grid-background`
(three.js + 1,600 shadowed instanced cubes + post-processing, render loop
never stops — lost to `light-lines` for the Contact background; evaluated
from the registry JSON, never installed). The project has no GSAP
dependency — port GSAP-based components to CSS/motion.
Removed once unused (no dead code): `interactive-hover-button`,
`animated-tooltip`, the Magnetic / Tilt primitives, `gooey-text-reveal`
(its SVG alpha-threshold filter rendered jagged, pixelated edges on large
desktop text), `flip-text` (replaced by `flip-fade-text`),
`animated-footer` (footer is now a slim © + "Back to top" row).

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
│   ├── contact/           # Contact client parts (copy button, local time, reveal)
│   ├── currently/         # Currently-section client parts (CurrentlyCards)
│   ├── experience/        # Scroll-drawn milestone timeline
│   ├── hero/              # Hero client parts (HeroName: name flips synced to the roles)
│   ├── skills/            # Skills UI: explorer, filter tabs, chips, detail, code block
│   ├── icons/             # Brand SVG icons (lucide v1 has no brand icons)
│   ├── layout/            # Navbar (spotlight + scroll-spy), MobileMenu, Section + SectionHeading, SiteFooter
│   ├── motion/            # Reusable Motion primitives (ScrollRevealText)
│   ├── projects/          # Projects UI: bento (+ span packing), covers (image or generated)
│   ├── providers/         # Client providers (MotionConfig, …)
│   ├── sections/          # ONE component per page section (+ index.ts barrel)
│   └── ui/                # shadcn / Vengeance UI components (CLI-managed)
├── data/
│   ├── brand-colors.ts    # Brand colours (skills + socials) — the only place for brand hex values
│   ├── nav.ts             # Section ids + nav items (navbar, mobile menu, headings)
│   └── profile.ts         # ALL personal content (typed; "TODO…" = placeholder)
├── fonts/                 # Self-hosted subset fonts for next/font/local (+ licences)
├── hooks/
│   ├── use-active-section.ts          # scroll-spy (IntersectionObserver) + click lock
│   ├── use-is-client.ts               # hydration-safe "mounted" flag
│   ├── use-page-visible.ts            # tab visibility (pause ambient loops)
│   └── use-prefers-reduced-motion.ts  # hydration-safe reduced-motion hook
├── lib/
│   ├── skill-icons.tsx    # Skill logos (simple-icons + monograms) as an SVG sprite
│   ├── skills-to-orbits.ts # profile.skills → SolarSystem rings + filter groups
│   ├── social-items.tsx   # GitHub/LinkedIn/Email tiles (hero + contact)
│   └── utils.ts           # cn() helper
└── styles/
    ├── hero.css           # Hero entrance stagger + background layers
    ├── solar-system.css   # Scoped styles for the patched SolarSystem
    ├── timeline.css       # Experience timeline (fill, nodes, card reveal)
    └── vengeance.css      # CSS that Vengeance UI components need but don't ship
```

Sections (in order, each with matching `id`): `hero`, `about`, `currently`,
`skills`, `experience`, `projects`, `contact`.

## Assets

- **Project images live in `public/images/projects/{slug}.jpg`;
  recommended 1600×1000** (16:10 — every cover box is 16:10, so the image
  shows uncropped). To use a real screenshot, overwrite the file: no code
  change. The current files are generated placeholders (abstract covers in
  the theme palette with the project name). `image` is set per project in
  `profile.ts`; without it a CSS cover is generated.
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
- Motion components keep inline values they've already applied: to switch
  to a static state (e.g. reduced motion), pass explicit values
  (`opacity: 1`), never `style={undefined}`.
- Full-bleed section backgrounds: `<Section background={…}>` (outer full-width
  wrapper + normal inner container). Contact uses `LightLines` there.
  A full-bleed band inside the container (Contact marquee):
  `ml-[calc(50%-50vw)] w-screen` — the section's `overflow-hidden` absorbs
  the scrollbar-width overshoot of `100vw`.
- `html { overflow-x: clip }` (globals.css) stops the page ever scrolling
  sideways, but `scrollWidth` still reports overflow — test for it
  (`scrollWidth > clientWidth`) and fix the component, don't rely on the
  guard.
- Tailwind v4 safe alignment: `justify-center-safe`, not
  `justify-[safe_center]` (the arbitrary form is silently not generated).
- SocialFlipButton: a `letter` front face is what every mouse/trackpad
  device sees at rest (`@media (hover: none)` only flips touch devices to
  the icon side). Leave `letter` out to show the icon on both faces.
- motion's `useInView` only updates after an element has entered view, so
  `initial` must match the real starting state (true only if on screen at
  load).
- Cache Components forbids `new Date()` etc. during static prerender; wrap it
  in a `"use cache"` function with `cacheLife(…)` (see SiteFooter year).
  Live, client-only values (e.g. the Contact clock) use
  `useSyncExternalStore` with a `null` server snapshot + fixed-width
  placeholder.
- Testing: don't take `fullPage` screenshots in mobile-emulated contexts —
  the giant temporary viewport makes three.js log `texImage3D` WebGL
  warnings that real visitors can't trigger.
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
- Splitting text into per-letter spans: use grapheme clusters
  (`Intl.Segmenter`), never `split("")` — Indic vowel signs (and emoji)
  are separate code points and render broken in their own inline-block.
- Two cycling text effects on screen (hero name loop + roles): phase-lock
  them. `HeroName` passes FlipFadeText an `alignTo` anchor = the roles
  MorphText's CSS animation `startTime` (Web Animations API), so the name
  only flips inside a role's fully-visible window; the name period (7s) is
  a whole multiple of the role period (3.5s).
- Continuous decorative animations: animate `transform`, not an
  `@property` value. RotatingBorder first animated a conic `from` angle
  via `@property`: every ring restyled + repainted each frame on the main
  thread (53 → 38 fps parked over 6 rings at 4× CPU throttle). Spinning a
  pre-drawn conic square with `transform: rotate` (sized ≥ the diagonal
  with `cqmax` units, masked to a ring) runs on the compositor — within
  noise of no rings. (GlowBorderCard's @property ring only runs on hover.)
- Dev-only DevTools Issues: 2× "DocumentCookie" performance issues come
  from Next 16 itself (the Instant Navigation testing API's inline script
  + the dev-tools overlay read `next-instant-navigation-testing`). Not in
  production builds; no dev opt-out. Don't chase them — check prod with
  CDP `Audits.issueAdded` instead.
- Scroll-linked reveals: drive them from raw `scrollY` against measured
  positions, not a spring-smoothed or clamped `scrollYProgress` (the spring
  made cards lag their nodes; the clamp at 0 pre-revealed the first card).
- Cycling text crossfades: make outgoing/incoming opacities complementary
  (MorphText: in over 0–20% of a slot, out over the next word's 0–20%).
  Fading both at once through the gooey threshold filter blanks the line.
- Slide-in offsets must stay below the page gutter (`px-4` = 1rem on
  mobile): a 1.5rem offset made unrevealed timeline cards overflow by 8px.
   - Use `next/image` and `next/font`; reserve space to keep CLS ≈ 0.
5. **Dark theme is the default** (`class="dark"` on `<html>`). Use the shadcn
   tokens (`bg-background`, `text-muted-foreground`, …), not raw colours.
6. Run `npm run lint` and `npm run build`, then load the page and confirm the
   browser console is clean (no hydration warnings), at 375px and desktop,
   with and without reduced motion, before calling a change done.
