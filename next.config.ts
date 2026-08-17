import type { NextConfig } from 'next';

const mfDashboardUrl = process.env.NEXT_PUBLIC_MF_DASHBOARD_URL ?? 'http://127.0.0.1:4300';
const mfTransacoesUrl = process.env.NEXT_PUBLIC_MF_TRANSACOES_URL ?? 'http://127.0.0.1:4200';

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' as const }),
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];

    return [
      {
        source: '/mf-proxy/dashboard/:path*',
        destination: `${mfDashboardUrl}/:path*`,
      },
      {
        source: '/mf-proxy/transacoes/:path*',
        destination: `${mfTransacoesUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
