/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For Server Actions and formData() in API routes
    },
  },
  // megajs should be treated as external (not bundled)
  serverExternalPackages: ['megajs'],
  // Turbopack config (empty to silence warning)
  turbopack: {},
  // Headers for CORS - only allow same origin in production
  async headers() {
    const allowedOrigin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
