"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Status = "idle" | "copied" | "manual";

/** Last-resort copy for browsers / contexts without the async Clipboard API. */
function legacyCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

/**
 * Copies `text`, morphs to a check + "Copied!" for ~2s, and announces the
 * result via aria-live. Fallbacks: Clipboard API → execCommand → select the
 * address (`selectTargetId`) and ask the user to press Ctrl/⌘+C.
 */
export function CopyEmailButton({
  text,
  selectTargetId,
}: {
  text: string;
  selectTargetId?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const settle = (next: Status) => {
    setStatus(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setStatus("idle"),
      next === "copied" ? 2000 : 4000,
    );
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard api");
      await navigator.clipboard.writeText(text);
      return settle("copied");
    } catch {
      if (legacyCopy(text)) return settle("copied");
      // Couldn't copy: select the address so the user can copy it.
      const el = selectTargetId
        ? document.getElementById(selectTargetId)
        : null;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      settle("manual");
    }
  };

  const copied = status === "copied";
  return (
    // Status text is absolutely positioned under the button so it never
    // widens/re-centres the email row (no shift) or overflows at 320px.
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Email address copied" : "Copy email address"}
        className={cn(
          "relative grid size-11 shrink-0 place-items-center rounded-xl border bg-[var(--glass-surface)] text-muted-foreground backdrop-blur-sm transition-colors",
          "hover:border-white/25 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          copied
            ? "border-emerald-400/50 text-emerald-300"
            : "border-[var(--glass-border)]",
        )}
      >
        <Copy
          aria-hidden="true"
          className={cn(
            "size-[18px] transition-[opacity,scale] duration-200",
            copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Check
          aria-hidden="true"
          className={cn(
            "absolute size-[18px] transition-[opacity,scale] duration-200",
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        />
      </button>
      {/* Visible confirmation + screen-reader announcement. */}
      <span
        aria-live="polite"
        className={cn(
          "pointer-events-none absolute top-full right-0 mt-1.5 text-xs font-medium whitespace-nowrap transition-opacity duration-200",
          status === "idle" ? "opacity-0" : "opacity-100",
          status === "manual" ? "text-amber-200" : "text-emerald-300",
        )}
      >
        {status === "copied"
          ? "Copied!"
          : status === "manual"
            ? "Press Ctrl/⌘+C to copy"
            : ""}
      </span>
    </span>
  );
}
