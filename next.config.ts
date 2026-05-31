import type { NextConfig } from "next";

// On GitHub Pages the app is served from /<repo>/, set via NEXT_PUBLIC_BASE_PATH
// in the deploy workflow. Locally the var is unset so dev/prod run at root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // fully static site (client-only / local-first app)
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true, // GitHub Pages serves /path/ as /path/index.html
};

export default nextConfig;
