/*
 * The only place GSAP is imported. Only reachable through next/dynamic
 * chunk (builder), so it is never in the main bundle.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
