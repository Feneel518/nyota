import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import { brand } from "@/lib/brand";
export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  applicationName: brand.name,
  title: {
    default: "Nyota — Indian wedding invitations, made personal",
    template: "%s · Nyota",
  },
  description: brand.description,
  openGraph: { siteName: brand.name, type: "website", locale: "en_IN" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
