import type { MetadataRoute } from "next";
import { profile } from "@/data/profile";

/** Theme / background colour: matches `viewport.themeColor` (layout.tsx). */
const INK = "#0a0e19";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: profile.seo.title,
    short_name: profile.seo.shortName,
    description: profile.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: INK,
    theme_color: INK,
    icons: [
      { src: "/favicon.ico", sizes: "48x48 32x32 16x16", type: "image/x-icon" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
