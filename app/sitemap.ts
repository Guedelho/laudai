import type { MetadataRoute } from "next";

// Other paths 307 to app.laudai.vet, so only the landing belongs on this host.
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
