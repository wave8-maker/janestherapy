import type { NextConfig } from "next";

// The intake wizard lives on its own subdomain so the studio tablet can be
// locked to one address that has no path back into the marketing site. Both
// hosts are the same Vercel project; these host rules are what separate them.
const CLIENT_HOST = "client.janestherapy.com";

const nextConfig: NextConfig = {
  // `next dev` serves its assets only to the host it was started on, so opening
  // the dev server from a tablet on the LAN gets 403s on every script and the
  // page renders but never becomes interactive. Listing the private ranges lets
  // the real device test the wizard. Development only — production is unaffected.
  allowedDevOrigins: ["192.168.0.*", "192.168.1.*", "10.0.0.*", "*.local"],

  async rewrites() {
    return [
      { source: "/", has: [{ type: "host", value: CLIENT_HOST }], destination: "/intake" },
    ];
  },

  async redirects() {
    return [
      // The page moved when its hours section graduated to /availability.
      { source: "/location", destination: "/contact", permanent: true },

      // The intake form now belongs to the client subdomain.
      {
        source: "/intake",
        has: [{ type: "host", value: "janestherapy.com" }],
        destination: `https://${CLIENT_HOST}/`,
        permanent: true,
      },
      {
        source: "/intake",
        has: [{ type: "host", value: "www.janestherapy.com" }],
        destination: `https://${CLIENT_HOST}/`,
        permanent: true,
      },

      // On the tablet's host, anything that isn't the wizard goes back to it —
      // a client who taps a stray link should land on the form, not the site.
      {
        source: "/:path((?!intake|api|_next|favicon\\.ico).*)",
        has: [{ type: "host", value: CLIENT_HOST }],
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
