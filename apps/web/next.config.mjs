/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@voiceops/shared', 'gsap', 'ogl', 'lucide-react'],
  async rewrites() {
    // Only proxy to local Python backend when explicitly configured (local dev).
    // On hosted deployments (Vercel etc.), skip the rewrite so Next.js API routes handle /api/v1/*.
    if (!process.env.INTERNAL_API_URL) {
      return [];
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.INTERNAL_API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
