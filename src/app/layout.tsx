import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BuildGate } from "@/components/experimental/agent-cursor/gate";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { MotionProvider } from "@/components/providers/motion-provider";
import { profile } from "@/data/profile";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const { seo } = profile;

/** Set by Vercel at build time. */
const ON_VERCEL = process.env.VERCEL === "1";

/*
 * Icons and share images are file-based (src/app/favicon.ico, icon.png,
 * apple-icon.png, opengraph-image.png, twitter-image.png): Next adds their
 * <link>/<meta> tags, resolved against metadataBase.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: seo.title, template: seo.titleTemplate },
  description: seo.description,
  applicationName: seo.siteName,
  authors: [{ name: profile.name, url: SITE_URL }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: seo.siteName,
    locale: seo.locale,
    title: seo.title,
    description: seo.description,
    firstName: seo.firstName,
    lastName: seo.lastName,
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e19",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Dark theme is the default (and currently only) theme.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* First focusable element: jumps past the navbar (#main is
            tabIndex -1, so focus moves with it). */}
        <a
          href="#main"
          className="fixed top-3 left-3 z-[100] -translate-y-[200%] rounded-full border border-white/15 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg transition-transform focus-visible:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
        >
          Skip to content
        </a>
        {/* EXPERIMENT (agent-cursor): renders nothing when off. */}
        <BuildGate />
        <MotionProvider>
          <Navbar />
          {children}
          <SiteFooter />
        </MotionProvider>
        {/* Their scripts are served by Vercel (/_vercel/…): elsewhere
            (local `next start`) they would 404 in the console. */}
        {ON_VERCEL && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
