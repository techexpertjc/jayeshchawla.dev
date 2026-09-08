import type { MetadataRoute } from "next";
import { profile } from "@/content/save-file";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A development gate with no content on it; keep it out of results.
      disallow: "/lookdev",
    },
    sitemap: `${profile.siteUrl}/sitemap.xml`,
  };
}
