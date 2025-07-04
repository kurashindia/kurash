/** @type {import('next').NextConfig} */
const nextConfig = {
  // Change from static export to standard mode
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  // Generate fallback versions for dynamic routes
  trailingSlash: true,
  distDir: '.next',
  // Simplify configuration to focus on core functionality
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['@/components'],
  }
};

module.exports = nextConfig;
