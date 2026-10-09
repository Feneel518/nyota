import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

// Only public site content belongs here; never enumerate couples or guest links.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/privacy", "/terms", "/support"].map((path) => ({
    url: `${brand.url}${path}`,
  }));
}
