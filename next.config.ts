import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` serves its assets only to the host it was started on, so opening
  // the dev server from a tablet on the LAN gets 403s on every script and the
  // page renders but never becomes interactive. Listing the private ranges lets
  // the real device test the wizard. Development only — production is unaffected.
  allowedDevOrigins: ["192.168.0.*", "192.168.1.*", "10.0.0.*", "*.local"],

  async redirects() {
    return [
      // The page moved when its hours section graduated to /availability.
      { source: "/location", destination: "/contact", permanent: true },
      // The signature service was reworked into a one-hour facial session.
      {
        source: "/services/glow-from-head-to-toe",
        destination: "/services/sculpting-facial-myofascial-release",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
