import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["unpdf", "pdf-parse"],
};

export default nextConfig;
