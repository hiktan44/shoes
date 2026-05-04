import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "kieai.redpandaai.co", pathname: "/**" },
      { protocol: "https", hostname: "**.kie.ai", pathname: "/**" },
      { protocol: "https", hostname: "**.aiquickdraw.com", pathname: "/**" },
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
