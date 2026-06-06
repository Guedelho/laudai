import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Allow next/image to load signed Supabase storage URLs. NEXT_PUBLIC_SUPABASE_URL
// is scoped per-branch in Vercel, so guard against it being absent — otherwise a
// branch without it (e.g. a feature preview) crashes config load and the whole
// build fails before it can even serve the env-free public landing page.
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
  images: {
    remotePatterns: supabaseImagePatterns(),
  },
};

export default withBotId(nextConfig);
