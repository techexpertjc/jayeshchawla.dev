import type { MetadataRoute } from "next";
import { profile } from "@/content/save-file";

/**
 * Only the pages worth indexing.
 *
 * `/lookdev` is deliberately absent — it is a development gate, not content,
 * and it already carries `robots: noindex`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();

  return [
    {
      url: profile.siteUrl,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      // The page a recruiter actually reads, and the one with real text on it.
      url: `${profile.siteUrl}/resume`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${profile.siteUrl}/play`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
