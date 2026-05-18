import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["pdfmake"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rgemiayidnumeotplozm.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default withBotId(nextConfig);
