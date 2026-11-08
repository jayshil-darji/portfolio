/**
 * Absolute site origin (no trailing slash) for metadataBase, canonical,
 * sitemap, robots and JSON-LD.
 * 1. NEXT_PUBLIC_SITE_URL: set it in Vercel to the production domain.
 * 2. Vercel's production domain (set automatically on Vercel builds), so a
 *    forgotten variable never ships share links pointing at localhost.
 * 3. http://localhost:3000 for local development.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
