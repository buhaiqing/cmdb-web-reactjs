/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/nextjs-registry'],
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  // Next.js 15: Turbopack is now default in dev mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow cross-origin requests from localhost in development
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
}

export default nextConfig
