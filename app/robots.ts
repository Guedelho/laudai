import type { MetadataRoute } from "next";

// Served on the marketing host (laudai.vet) via proxy.ts passthrough.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://laudai.vet/sitemap.xml",
    host: "laudai.vet",
  };
}
