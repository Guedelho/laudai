import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Derive the Supabase storage host from the env so next/image accepts signed
// URLs in whatever environment this deployment points at (prod, staging, local).
const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["pdfmake"],
  outputFileTracingIncludes: {
    "/api/reports/[id]/pdf": ["./public/logo.png"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default withBotId(nextConfig);
