import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** Single-page site: one URL (sections are #anchors, not pages). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 }];
}
