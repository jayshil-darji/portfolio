"use client";

import { useSyncExternalStore } from "react";

/** Re-render once per minute, aligned to the minute boundary. */
function subscribeMinute(cb: () => void) {
  let interval: number | undefined;
  const timeout = window.setTimeout(
    () => {
      cb();
      interval = window.setInterval(cb, 60_000);
    },
    60_000 - (Date.now() % 60_000) + 50,
  );
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
  };
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function format(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    });
    formatters.set(timeZone, f);
  }
  return f;
}

// Cache per minute: getSnapshot must return the same value between ticks.
let cache = { minute: -1, zone: "", text: "" };

/**
 * Current time in `timeZone` (e.g. "4:32 PM"), whatever the visitor's own
 * zone. Server + hydration render a fixed-width placeholder; the real time
 * fills in after mount (no mismatch), sized by an invisible template so
 * nothing shifts.
 */
export function LocalTime({ timeZone }: { timeZone: string }) {
  const text = useSyncExternalStore(
    subscribeMinute,
    () => {
      const minute = Math.floor(Date.now() / 60_000);
      if (minute !== cache.minute || cache.zone !== timeZone) {
        cache = {
          minute,
          zone: timeZone,
          text: format(timeZone).format(new Date()),
        };
      }
      return cache.text;
    },
    () => null,
  );

  return (
    <span className="inline-grid tabular-nums">
      {/* Width template: the widest possible value. */}
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        00:00 PM
      </span>
      <span className="text-right [grid-area:1/1]">
        {text ?? <span aria-hidden="true">--:-- --</span>}
      </span>
    </span>
  );
}
