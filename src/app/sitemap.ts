import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

// Only marketing content belongs here; never enumerate couples or guest links.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: brand.url }];
}
