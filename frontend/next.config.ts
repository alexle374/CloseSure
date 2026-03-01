import path from "path";
import type { NextConfig } from "next";

const appDir = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  devIndicators: false,
  // Force tailwindcss to resolve from frontend/node_modules (fixes parent-dir resolve error)
  turbopack: {
    resolveAlias: {
      tailwindcss: path.join(appDir, "node_modules", "tailwindcss"),
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.join(appDir, "node_modules", "tailwindcss"),
    };
    return config;
  },
};

export default nextConfig;
