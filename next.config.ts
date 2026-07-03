import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// NEXT_PUBLIC_SUPABASE_URL is scoped to the staging branch in Vercel; other
// branches build without it, so absent must not throw.
function supabaseImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  return [
    {
      protocol: "https",
      hostname: new URL(url).hostname,
      pathname: "/storage/v1/object/**",
    },
  ];
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["pdfmake"],
  // Vendored PDF fonts are read with fs at runtime; trace them into the bundle.
  outputFileTracingIncludes: {
    "/api/reports/\\[id\\]/pdf": ["./lib/report/fonts/*.ttf"],
  },
  images: {
    remotePatterns: supabaseImagePatterns(),
  },
};

export default withBotId(nextConfig);
