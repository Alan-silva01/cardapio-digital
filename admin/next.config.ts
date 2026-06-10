import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
    async redirects() {
        return [
            {
                // QR codes point to /?t=TOKEN
                // → passa pela rota /mesa/[token] (Server Component com OG tags)
                // → que redireciona pro /menu?t=TOKEN
                source: '/',
                has: [{ type: 'query', key: 't' }],
                destination: '/mesa/:t',
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
