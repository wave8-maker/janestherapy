import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The page moved when its hours section graduated to /availability.
      { source: "/location", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
