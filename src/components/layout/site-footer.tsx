import { ArrowUp } from "lucide-react";
import { cacheLife } from "next/cache";
import LineHoverLink from "@/components/ui/line-hover-link";
import { profile } from "@/data/profile";

/**
 * Current year for the copyright line. Cache Components forbids reading the
 * clock during static prerendering (the value would silently freeze at
 * build time); a cached function with a lifetime puts it in the static shell
 * and revalidates it daily, so it rolls over on its own.
 */
async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/**
 * Slim site footer (outside every scroll-spy section): © line left, "Back
 * to top" right; stacked and centred on mobile. "Back to top" is a plain
 * #hero anchor, so the navbar's delegated handler routes it through the
 * shared smooth-scroll path (no hash left in the URL).
 */
export async function SiteFooter() {
  const year = await getCurrentYear();
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <p>
          © {year} {profile.name}
        </p>
        <LineHoverLink
          href="#hero"
          variant="slide"
          className="items-center gap-1.5 hover:text-foreground"
        >
          Back to top
          <ArrowUp aria-hidden="true" className="size-3.5" />
        </LineHoverLink>
      </div>
    </footer>
  );
}
