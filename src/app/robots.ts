import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    // Pages with noindex must remain crawlable for that directive to be read.
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${brand.url}/sitemap.xml`,
  };
}
