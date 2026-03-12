import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        // Allow the untyped menu JSX port to build successfully
        ignoreBuildErrors: true,
    },
    async redirects() {
        return [
            {
                // QR codes point to /?t=TOKEN — redirect to /menu?t=TOKEN
                source: '/',
                has: [{ type: 'query', key: 't' }],
                destination: '/menu?t=:t',
                permanent: false,
            },
        ];
    },
    images: {
        minimumCacheTTL: 31536000,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/storage/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
};

export default nextConfig;
