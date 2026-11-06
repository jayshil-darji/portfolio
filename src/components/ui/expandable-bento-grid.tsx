"use client";

/*
 * Vengeance UI: @vengeanceui/expandable-bento-grid
 * Source: public/r/expandable-bento-grid.json @ 298075b (fetched via jsDelivr —
 * raw.githubusercontent.com was unreachable, so the shadcn CLI couldn't run).
 *
 * LOCAL PATCH — largely rewritten (agreed in step 6). Upstream:
 *  - expanded by morphing a clicked card into a centred MODAL (shared
 *    layoutId); the grid never reflowed. This version expands IN PLACE:
 *    the tile changes its grid span and every tile animates to its new
 *    position/size (motion `layout`, inside a LayoutGroup).
 *  - was a uniform 1/2/3-column grid; `className` was declared but never
 *    applied. Here `className` is applied and may be a function of the
 *    expansion state, so callers can build a real bento that re-packs
 *    without holes.
 *  - cards were clickable <div>s (no keyboard, no aria-expanded) inside a
 *    <ul> (invalid). Now: <li> → <h3> → <button aria-expanded aria-controls>
 *    + a labelled region; Escape collapses and returns focus.
 *  - imported `@/hooks/use-outside-click`, which the registry item doesn't
 *    ship (broken install). Not needed for an accordion — removed.
 *  - hard-coded "Visit" link to href="#" (white on light). Removed: links go
 *    in `actions`, rendered OUTSIDE the button (no nested interactives).
 *  - forced document.body.style.overflow = "auto" on every change. Removed.
 *  - framer-motion → motion/react.
 *  - Trigger restyling by state (`triggerClassName`, `headerClassName`,
 *    item `triggerLabel`): e.g. a full-card trigger when collapsed and a
 *    small labelled corner button when expanded; the region is then named
 *    by the item title. `panelFade={false}` lets the expanded content
 *    animate itself (e.g. a shared-layoutId cover must not fade while it
 *    moves). `BENTO_LAYOUT_TRANSITION` is exported for such elements.
 * Kept: the item props (id/title/subtitle/description/content/icon/
 * className) as a simple fallback rendering.
 */

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type Transition,
  type Variants,
} from "motion/react";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export interface BentoState {
  /** This tile is expanded. */
  expanded: boolean;
  /** Id of the expanded tile, if any (for re-packing siblings). */
  expandedId: string | null;
}

type Renderable = ReactNode | ((state: BentoState) => ReactNode);

export interface BentoItem {
  id: string;
  /** Plain-text name (used for ids/keys and the fallback rendering). */
  title: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  /** Fallback expanded body (upstream API). */
  content?: ReactNode;
  /**
   * LOCAL PATCH: grid classes for the tile (e.g. column spans). May depend
   * on the expansion state so the bento re-packs without holes.
   */
  className?: string | ((state: BentoState) => string);
  /**
   * LOCAL PATCH: decorative layer rendered as a direct child of the tile
   * <li> (e.g. a RotatingBorder). Must be a direct child: the inner
   * layout="position" wrapper is transformed during layout animations and
   * would become the containing block of anything absolute inside it.
   */
  decoration?: (state: BentoState) => ReactNode;
  /**
   * LOCAL PATCH: rich content for the trigger (always visible). Rendered
   * INSIDE a <button> → phrasing content only (spans, img), no links.
   */
  collapsed?: Renderable;
  /**
   * LOCAL PATCH: accessible name for the trigger <button> in a given state
   * (e.g. "Collapse Kero" when it shrinks to an icon). Undefined → its
   * text content.
   */
  triggerLabel?: (state: BentoState) => string | undefined;
  /** LOCAL PATCH: rich content of the expanded region (below the trigger). */
  expanded?: Renderable;
  /**
   * LOCAL PATCH: interactive content (links) shown when expanded, rendered
   * outside the trigger button.
   */
  actions?: Renderable;
}

export interface ExpandableBentoGridProps {
  items: BentoItem[];
  /** Grid container classes (columns, gap, dense flow…). */
  className?: string;
  /** Classes for every tile (border, background, hover…). */
  itemClassName?: string;
  /** Heading level wrapping each trigger (accordion pattern). */
  headingLevel?: "h3" | "h4";
  defaultExpandedId?: string | null;
  onExpandedChange?: (id: string | null) => void;
  /** LOCAL PATCH: extra classes for the trigger <button>, by state. */
  triggerClassName?: (state: BentoState) => string;
  /** LOCAL PATCH: extra classes for the trigger's wrapper, by state. */
  headerClassName?: (state: BentoState) => string;
  /**
   * LOCAL PATCH: fade the expanded region in/out (default true). False →
   * the region appears at once and its content animates itself.
   */
  panelFade?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const LAYOUT: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 32,
  mass: 0.9,
};
/** LOCAL PATCH: the tiles' layout spring, for shared elements inside. */
export const BENTO_LAYOUT_TRANSITION = LAYOUT;

const render = (r: Renderable | undefined, s: BentoState) =>
  typeof r === "function" ? r(s) : r;

export default function ExpandableBentoGrid({
  items,
  className,
  itemClassName,
  headingLevel: Heading = "h3",
  defaultExpandedId = null,
  onExpandedChange,
  triggerClassName,
  headerClassName,
  panelFade = true,
}: ExpandableBentoGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    defaultExpandedId,
  );
  const reduced = usePrefersReducedMotion();
  const uid = useId();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const tiles = useRef(new Map<string, HTMLLIElement>());
  const pendingScroll = useRef<string | null>(null);

  const setExpanded = useCallback(
    (id: string | null) => {
      setExpandedId(id);
      pendingScroll.current = id;
      onExpandedChange?.(id);
    },
    [onExpandedChange],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "Escape" || !expandedId) return;
    e.preventDefault();
    const id = expandedId;
    setExpanded(null);
    buttons.current.get(id)?.focus();
  };

  // After an expand, make sure the opened tile's top is on screen (it may
  // have moved while the grid re-packed).
  const revealTile = (id: string) => {
    if (pendingScroll.current !== id) return;
    pendingScroll.current = null;
    const el = tiles.current.get(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 72 || top > window.innerHeight * 0.55) {
      window.scrollTo({
        top: window.scrollY + top - 88,
        behavior: reduced ? "auto" : "smooth",
      });
    }
  };

  const layoutTransition: Transition = reduced ? { duration: 0 } : LAYOUT;
  const list: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
  };
  const tile: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.6, ease: EASE },
    },
  };

  return (
    <LayoutGroup id={uid}>
      <motion.ul
        role="list"
        className={cn("grid", className)}
        variants={list}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const expanded = expandedId === item.id;
          const state: BentoState = { expanded, expandedId };
          const btnId = `${uid}-trigger-${item.id}`;
          const panelId = `${uid}-panel-${item.id}`;
          const tileClass =
            typeof item.className === "function"
              ? item.className(state)
              : item.className;
          const label = item.triggerLabel?.(state);

          return (
            <motion.li
              key={item.id}
              ref={(el) => {
                if (el) tiles.current.set(item.id, el);
                else tiles.current.delete(item.id);
              }}
              layout
              transition={{ layout: layoutTransition }}
              variants={tile}
              data-expanded={expanded || undefined}
              className={cn("relative", itemClassName, tileClass)}
              onLayoutAnimationComplete={() => expanded && revealTile(item.id)}
            >
              {/* layout="position": children keep their real size while the
                  tile's box animates (no squashed text). */}
              <motion.div
                layout="position"
                transition={{ layout: layoutTransition }}
                className={cn("flex flex-1 flex-col", headerClassName?.(state))}
              >
                <Heading className="m-0 flex flex-1 flex-col">
                  <button
                    ref={(el) => {
                      if (el) buttons.current.set(item.id, el);
                      else buttons.current.delete(item.id);
                    }}
                    id={btnId}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    aria-label={label}
                    onClick={() => setExpanded(expanded ? null : item.id)}
                    className={cn(
                      "flex w-full flex-1 cursor-pointer flex-col text-left outline-none",
                      triggerClassName?.(state),
                    )}
                  >
                    {render(item.collapsed, state) ?? (
                      <span className="flex items-center gap-3 p-4">
                        {item.icon && (
                          <span aria-hidden="true">{item.icon}</span>
                        )}
                        <span>
                          <span className="block font-medium">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="block text-sm text-muted-foreground">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                      </span>
                    )}
                  </button>
                </Heading>
              </motion.div>

              {/* Region stays mounted only while expanded (so collapsed tiles
                  don't carry hidden focusable links). */}
              <AnimatePresence initial={false} mode="popLayout">
                {expanded && (
                  <motion.div
                    key="panel"
                    id={panelId}
                    role="region"
                    // A trigger with its own aria-label (e.g. "Collapse X")
                    // would mis-name the region: use the item title.
                    {...(label
                      ? { "aria-label": item.title }
                      : { "aria-labelledby": btnId })}
                    layout="position"
                    initial={
                      panelFade ? { opacity: 0, y: reduced ? 0 : 8 } : false
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: reduced || !panelFade ? 0 : 0.35,
                        delay: reduced || !panelFade ? 0 : 0.12,
                        ease: EASE,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: reduced ? 0 : 0.12 },
                    }}
                  >
                    {render(item.expanded, state) ??
                      (item.description || item.content ? (
                        <div className="px-4 pb-4 text-sm text-muted-foreground">
                          {item.description && <p>{item.description}</p>}
                          {item.content}
                        </div>
                      ) : null)}
                    {render(item.actions, state)}
                  </motion.div>
                )}
              </AnimatePresence>
              {item.decoration?.(state)}
            </motion.li>
          );
        })}
      </motion.ul>
    </LayoutGroup>
  );
}

export { ExpandableBentoGrid };
