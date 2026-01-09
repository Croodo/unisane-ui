import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const __dirname = dirname(fileURLToPath(import.meta.url));
// Monorepo root for turbopack resolution
const monorepoRoot = resolve(__dirname, '../..');

const nextConfig = {
  reactStrictMode: true,

  // Performance: Enable compression (gzip/brotli)
  compress: true,

  // Performance: Disable source maps in production
  productionBrowserSourceMaps: false,

  // Security: Remove X-Powered-By header
  poweredByHeader: false,

  // Performance: Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  turbopack: {
    // Set root to monorepo root where node_modules is hoisted
    root: monorepoRoot,
  },

  async redirects() {
    return [
      { source: '/admin', destination: '/admin/tenants', permanent: false },
    ];
  },
};

export default nextConfig;
