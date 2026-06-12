import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default server build. Force dynamic for the heavy client graph to avoid
  // React context issues during static prerender of error infrastructure.
};

export default nextConfig;
