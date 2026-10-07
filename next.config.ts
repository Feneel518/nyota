import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  skipProxyUrlNormalize: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["pg", "sharp"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.razorpay.com; font-src 'self'; media-src 'self'; connect-src 'self' https://*.razorpay.com https://*.r2.cloudflarestorage.com; frame-src 'self' https://*.razorpay.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'",
          },
        ],
      },
      {
        source: "/rsvp/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};
export default config;
