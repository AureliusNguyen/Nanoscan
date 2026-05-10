import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow large multipart uploads through the API proxy routes (max 10MB
    // matches the backend cap).
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
