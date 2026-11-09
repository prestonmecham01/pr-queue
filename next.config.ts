import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strictly client-side: static export, no server features (see docs/PLAN.md section 2).
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
