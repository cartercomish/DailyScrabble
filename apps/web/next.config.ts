import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@daily-rack/engine"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
