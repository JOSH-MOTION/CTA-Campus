import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  experimental: {
    allowedDevOrigins: [
      '**.' + process.env.GITPOD_WORKSPACE_ID + '.gitpod.io',
      process.env.NEXT_PUBLIC_VERCEL_URL || '',
      'http://localhost:3000',
      'https://6000-firebase-studio-1753697219378.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev',
    ].filter(Boolean),
  }
};

export default nextConfig;
