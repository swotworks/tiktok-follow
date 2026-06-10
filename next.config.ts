import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.PORT === "3001" ? ".next-admin" : ".next",
  turbopack: {
    root: __dirname,
  }
};

export default nextConfig;
