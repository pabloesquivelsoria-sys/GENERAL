import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@clavonia/core",
    "@clavonia/ui",
    "@clavonia/editor",
    "@clavonia/templates",
    "@clavonia/design-engine",
    "@clavonia/db",
  ],
};

export default nextConfig;
