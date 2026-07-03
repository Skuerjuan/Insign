import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgs.search.brave.com"
      },
      {
        protocol: "https",
        hostname: "dcdn-us.mitiendanube.com"
      }
    ]
  }
};

export default nextConfig;
