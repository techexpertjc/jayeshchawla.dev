import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://jayeshchawla.dev", lastModified: new Date() }];
}
