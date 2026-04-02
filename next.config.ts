import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfmake"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rgemiayidnumeotplozm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
