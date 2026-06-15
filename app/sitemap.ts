import type { MetadataRoute } from "next";

// Only the landing page is canonically served on the marketing host; every other
// path 307s to app.laudai.vet (see proxy.ts), so it does not belong here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://laudai.vet/",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
