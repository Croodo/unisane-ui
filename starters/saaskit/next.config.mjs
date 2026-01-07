/** @type {import('next').NextConfig} */
const projectRoot = process.cwd();

const nextConfig = {
  reactStrictMode: true,
  // Disable typedRoutes to avoid invalid .next/dev/types generation interfering with tsc
  typedRoutes: false,
  turbopack: {
    // Force the workspace root to the project folder to avoid
    // root inference picking an upper-level lockfile
    root: projectRoot,
  },
  async redirects() {
    return [
      { source: '/admin', destination: '/admin/tenants', permanent: false },
    ];
  },
};

export default nextConfig;
