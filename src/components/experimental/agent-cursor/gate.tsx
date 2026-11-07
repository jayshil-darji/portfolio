/*
 * Pre-paint hero gate (SERVER component, first in <body>). Its inline
 * script runs during parsing and — only if `eligibility().hero` — appends
 * <style id="acb-gate" data-state="pending"> to <head>, hiding the navbar
 * and hero units before first paint (no flash before the hero build).
 * Head <style>, not an <html> attribute: React reports attributes it didn't
 * render as hydration mismatches. Not claimed by the builder within
 * GATE_TIMEOUT_MS → removed again: the hero shows with its normal
 * entrance. JS disabled → nothing hidden. Flag off → renders nothing.
 */

import {
  AGENT_CURSOR_ENABLED,
  AGENT_CURSOR_QUERY,
  GATE_TIMEOUT_MS,
} from "./config";
import { eligibility, GATE_ID, gateCss } from "./gate-shared";

const j = JSON.stringify;
const timeout =
  process.env.NODE_ENV === "development"
    ? GATE_TIMEOUT_MS.development
    : GATE_TIMEOUT_MS.production;

const script = `(function(){try{if(!(${eligibility.toString()})(window,${j(AGENT_CURSOR_QUERY)}).hero)return;var s=document.createElement("style");s.id=${j(GATE_ID)};s.setAttribute("data-state","pending");s.textContent=${j(gateCss("pending"))};document.head.appendChild(s);setTimeout(function(){if(s.getAttribute("data-state")==="pending")s.remove()},${timeout})}catch(e){}})();`;

export function BuildGate() {
  if (!AGENT_CURSOR_ENABLED) return null;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
