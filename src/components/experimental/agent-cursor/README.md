# Agent-cursor site build (EXPERIMENT, branch `test/agentic-ai`)

The real site builds itself section by section as you scroll. One
persistent swarm of 12 agent cursors travels with you and divides the work
of each section (choreography modelled on the stills in `reference/`).

Each section runs through three phases:

1. **Scaffold** (~15%): every wireframe draws in together, slightly
   staggered. Each gets a neon outline with corner handles, long hairline
   guides across the section, a placeholder (text → seeded skeleton bars,
   image → box with an X, block → skeleton block) and a size label
   ("336 × 268", real px).
2. **Divided work** (~75%): agents claim elements from a queue and work on
   them in parallel. The real element is revealed as the work progresses:
   text line by line as its skeleton bars go, images and cards left→right
   in clip steps with a negative bleed. The outline brightens while it's
   being worked on, then settles at 0.15.
3. **Finish** (~10%): labels, guides and outlines fade, and the agents
   regroup toward the next section.

Switch: `AGENT_CURSOR_ENABLED` in `config.ts`. Other settings there:

- `BUILD_MODE` (`"once"` | `"scrub"`);
- `TEMPO`: one multiplier for every timing (hero 2.5s, section 3.5s,
  footer 2s, cap 4.5s at TEMPO 1);
- agents (12, max 20), `TASK_LABELS`, `MAX_AGENTS_PER_ELEMENT`, `MIN_CREW`;
- palette, start line / scrub range, gate timeouts;
- `?introDebug=1`, which logs build start/finish per section plus the agent
  assignments.

## How it runs

- **Gate** (`gate.tsx`, server; first in `<body>`). An inline script runs
  during parsing. If `eligibility().hero` holds, it appends
  `<style id="acb-gate" data-state="pending">` to `<head>`, which hides
  the navbar and hero units before first paint and turns off the hero's
  CSS entrance stagger.
  - `eligibility()` (`gate-shared.ts`) is the ONE rule shared with the
    builder; it's serialised into the script with `Function#toString`.
  - It's a head `<style>`, not an `<html>` attribute, because React reports
    the attribute as a hydration mismatch.
  - If the builder doesn't claim it within 3.5s (12s in dev), the style is
    removed and the hero shows normally.
- **Root** (`build-root.tsx`). Rendered at the end of the page's `<main>`,
  not in the layout: the page segment hydrates after the layout, and the
  builder must not touch the hero's DOM before React has hydrated it (that
  caused a dev hydration warning). It prefetches the builder chunk when
  the gate is armed and mounts it while builds may run (≥768px, motion
  allowed; re-evaluated live).
- **Builder** (`builder.tsx`, lazy).
  - **Groups:** navbar + hero (on load, time-based, both modes; the name
    and roles go first to dedicated agents), every top-level `<section>`,
    and the footer.
  - **Units:** `[data-build]` elements plus `SELECTOR_UNITS` for spots that
    can't carry attributes (navbar, Vengeance roots, footer), ≤ 11 per
    group.
  - **Sessions:** a group builds in work sessions planned by `planner.ts`.
    In "once" mode only elements in or near the viewport are planned
    (agents never work off-screen; cursors are clamped to the view), and
    the rest get their own session when they come near. A session waits up
    to 600ms for a crew of ≥ 3 free agents, so one agent never works
    through a section alone.
  - **One rAF loop** renders every running session and the swarm. It runs
    only while something builds, and frame deltas are clamped, so a hidden
    tab pauses the build.
  - **"once":** a group starts when its top crosses 75% of the viewport.
    **"scrub":** one session per group, whose time is ScrollTrigger
    progress (top 80% → top 20%, clamped to the max scroll); up reverses.
  - **Never blocks:** a group scrolled out mid-build, or any input inside
    it, fast-forwards. In-page jumps (anchor clicks, hash on load, restored
    scroll) mark jumped-over groups built instantly and animate only the
    destination.
- **Planner** (`planner.ts`, pure). It turns elements + free agents +
  duration into a deterministic plan:
  - the queue runs top→bottom, left→right;
  - agents are assigned round-robin, and large elements (image, or > 25%
    of the section) get 2 agents;
  - a finished agent takes the nearest unclaimed element;
  - travel is an eased arc, with duration by distance (≥ 0.35s) and
    staggered departures;
  - work is a 2–4-point seeded scribble with the pill task cycling through
    `TASK_LABELS`;
  - work units are scaled so the work ends at 90% of the duration.

  `sampleAgent` / `sampleElement` render any moment `t`. Positions are
  anchored to element/section boxes, so a resize needs no re-plan.

- **Tour** (`tour.ts`, `AUTO_TOUR`): a self-building tour in one
  continuous, smooth scroll.
  - **States:** idle → countdown → touring → returning → done | stopped.
  - **"auto":** on a fresh visit (top, no hash, once per session) a 3s HUD
    countdown runs after the hero is built.
  - **The glide:** one rAF loop, velocity × dt into a float accumulator,
    with `scroll-behavior: auto` while it runs. Speed is ≈ height /
    `TOUR_DURATION_S`, compensated for the 1s ease-in and the 400px
    glide-out (≈ 220 px/s at 1440×900), clamped to 120–320. It never drops
    below 1px per frame.
  - **Adaptive speed:** while elements in the top 60% of the view are
    unbuilt, the speed eases (~300ms) toward 35% of base, then back. It
    never stops.
  - **Builder during the tour:** sections start as soon as they enter the
    viewport. Only a section whose element reaches the top unbuilt is
    fast-forwarded.
  - **Finish:** at the built footer it holds 1.2s, then an eased 2.5s
    return to the top.
  - **The user always wins:** any wheel / touch / key / mouse / pointer /
    in-page link input stops it instantly, and it never restarts by
    itself.
  - **HUD buttons:** "Stop" (the HUD never auto-hides during a tour), "↻
    Replay build" (`resetAll()` + tour), "▶ Watch it build".
- **Signals** (`build-state.ts`, tiny, statically imported).
  - `useBuildActive()`: our own entrances skip — the hero stagger (gate
    CSS), About bio, About photo wipe, Contact reveals, Experience card
    slide-ins and section-title stagger. The Vengeance entrances (Currently
    StaggeredGrid, project tiles) are neutralised with `!important` CSS
    while the builder runs.
  - `useBuilt(id)`: the stats count-up and the name loop start on reveal.
  - `[data-acb-pending]` pauses CSS animations inside unbuilt units: roles
    morph, rays, marquee, light-lines and rotating borders start when built.
- **Swarm** (`swarm.ts`): one fixed viewport layer.
  - It converts sampled page positions with the current scroll, from rects
    cached per session start/resize — never measured per frame.
  - It resolves pill collisions with boxes sized to each label; idle agents
    are fixed obstacles.
  - It fires a click ripple at scribble waypoints, and waves off when
    everything is built.
- **HUD** (`hud.tsx`): bottom-left, with agent-coloured dots, "{agents}
  agents · {built}/{total} layers · building / idle / done" and a thin
  progress bar. It hides whenever it would overlap content or the hero
  scroll cue.

## Files

| File             | Loaded               | Role                                                       |
| ---------------- | -------------------- | ---------------------------------------------------------- |
| `config.ts`      | always (server-safe) | flag, `TEMPO` + settings, `agentBuildAttrs`, lazy loader*  |
| `gate-shared.ts` | always               | `eligibility()`, gate CSS/state                            |
| `gate.tsx`       | server               | pre-paint hero gate                                        |
| `build-state.ts` | always (tiny)        | `useBuildActive`, `useBuilt`                               |
| `build-root.tsx` | always               | prefetch + lazy mount                                      |
| `builder.tsx`    | lazy                 | groups, sessions, the rAF loop, jumps, fast-forward, scrub |
| `planner.ts`     | lazy                 | work queue, assignments, travel/scribble, sampling         |
| `swarm.ts`       | lazy                 | agent renderer (separation, pills, ripples)                |
| `wire.tsx`       | lazy                 | `Wire` (outline, guides, size label, placeholder), `Agent` |
| `hud.tsx`        | lazy                 | HUD + progress bar + tour buttons                          |
| `tour.ts`        | lazy                 | self-building tour state machine                           |
| `gsap.ts`        | lazy                 | GSAP + ScrollTrigger (scrub mode)                          |
| `seeded.ts`      | lazy                 | deterministic PRNG                                         |
| `build.css`      | lazy                 | all styles (no Tailwind classes)                           |
| `reference/`     | —                    | reference stills (not bundled)                             |

\* The loader sits next to the literal flag. Two reasons:

- Turbopack only folds a constant condition within one module.
- It's also guarded by `typeof window`. Server components import
  `config.ts`, and an RSC-graph `import()` of a client module makes Next
  preload it as a page `<script>`.

## Integration points outside this folder

- **Entry points:**
  - `app/layout.tsx`: `<BuildGate />`;
  - `app/page.tsx`: `<BuildRoot />`.
- **Units (`agentBuildAttrs`):**
  - `sections/hero.tsx`;
  - `backgrounds/hero-background.tsx`;
  - `layout/section-heading.tsx` (eyebrow + heading);
  - `sections/about.tsx` + `about/about-photo.tsx` (`wrapperProps`);
  - `currently/currently-cards.tsx`;
  - `sections/skills.tsx`, `skills/skills-explorer.tsx`,
    `skills/skill-detail.tsx` (attributes only);
  - `experience/experience-timeline.tsx`;
  - `sections/projects.tsx`;
  - `sections/contact.tsx` + `contact/contact-reveal.tsx` (`build` prop).
- **Skip own entrance / start on built:**
  - `layout/section-title-text.tsx` (new);
  - `motion/scroll-reveal-text.tsx`;
  - `about/about-photo.tsx`;
  - `about/about-stat.tsx` (new);
  - `hero/hero-name.tsx`;
  - `experience/experience-timeline.tsx`;
  - `contact/contact-reveal.tsx`.
- **Dependencies:** `package.json` adds `gsap`.

With the flag off, nothing extra renders, and the markup is identical to
main apart from React `useId` values.

## Removal

1. Delete `src/components/experimental/`.
2. Remove `<BuildGate />` from `layout.tsx` and `<BuildRoot />` from
   `page.tsx`, with their imports.
3. Remove every `agentBuildAttrs` import and spread in the files above.
   Also:
   - `about-photo.tsx`: drop `wrapperProps` and the `useBuildActive` lines;
   - `contact-reveal.tsx`: drop the `build` prop and `useBuildActive`;
   - `contact.tsx`: drop the `build` props.
4. Revert the entrance skips:
   - `section-heading.tsx`: back to `<TextAnimation>{title}</TextAnimation>`;
     delete `section-title-text.tsx`;
   - `scroll-reveal-text.tsx`: remove `settled`;
   - `experience-timeline.tsx`: remove `buildActive`;
   - `hero-name.tsx`: `static={reduced}`;
   - `about.tsx`: `AboutStat` → `StatsCounter` with `duration={2}`; delete
     `about-stat.tsx`.
5. `npm uninstall gsap`.

`git diff main -- src package.json` lists every touched line.
