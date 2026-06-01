/**
 * Plausible Analytics script — cookieless, GDPR-friendly, no consent
 * banner needed.
 *
 * No-op when NEXT_PUBLIC_PLAUSIBLE_DOMAIN isn't set, so local development
 * doesn't ping production stats.
 *
 * To enable: set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com` in your
 * Vercel environment and register that domain at plausible.io.
 */
import Script from "next/script";

export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
