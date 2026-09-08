const path = require("path")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  turbopack: {
    // le lien local vers /D/starknetFork/starknet.js est hors de ce projet,
    // Turbopack ne résout pas les modules situés hors de sa racine par défaut
    root: path.join(__dirname, "../.."),
  },
}

module.exports = nextConfig
