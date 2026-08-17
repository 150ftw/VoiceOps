/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@voiceops/shared', 'gsap', 'ogl', 'lucide-react'],
};

export default nextConfig;
