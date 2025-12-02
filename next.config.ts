import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.warframestat.us",
        pathname: "/img/**",
      },
    ],
  },
};

export default nextConfig;
