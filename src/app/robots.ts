/**
 * Generated /robots.txt — Next.js 14 picks this up automatically.
 *
 * We're permissive: index everything except /api/* (no SEO value, and we
 * don't want bots POSTing to /api/waitlist).
 */
import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
