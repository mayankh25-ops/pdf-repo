import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev-tools badge out of print renders (the PDF route is loaded by
  // headless Chromium against the same server).
  devIndicators: false,
  // sharp and playwright-core stay external to the server bundle.
  serverExternalPackages: ["sharp", "playwright-core"],
};

export default nextConfig;
