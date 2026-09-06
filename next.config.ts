import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a wasm binary; keep it external so the server bundle works on Vercel.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
