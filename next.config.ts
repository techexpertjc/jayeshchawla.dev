import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
    A production build and a running `next dev` share `.next` by default and
    will corrupt each other's chunks. Setting NEXT_DIST_DIR gives an isolated
    build its own directory, so verification never disturbs a live dev server.
  */
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // three.js ships untranspiled ESM examples; Next handles this via transpilePackages.
  transpilePackages: ["three"],
};

export default nextConfig;
