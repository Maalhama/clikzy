import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // M7 — retire les console.log/info/debug du build de PRODUCTION (garde
  // error/warn pour le diagnostic). Évite le bruit et toute fuite d'info en prod.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    qualities: [75, 90, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'store.storeimages.cdn-apple.com',
      },
      {
        protocol: 'https',
        hostname: '*.apple.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '*.secretlab.co',
      },
      {
        protocol: 'https',
        hostname: 'secretlab.co',
      },
      {
        protocol: 'https',
        hostname: '*.secretlab.eu',
      },
    ],
  },
  async headers() {
    // NB : le Content-Security-Policy est désormais posé PAR REQUÊTE dans le
    // middleware (src/proxy.ts) car il embarque un nonce aléatoire (#0). Ne pas
    // le redéclarer ici : deux en-têtes CSP s'appliqueraient en intersection.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Cache static assets for 1 year
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache JS/CSS for 1 year (Next.js adds hash to filenames).
      // PROD UNIQUEMENT : en dev les chunks Turbopack ne sont pas hashés par contenu,
      // un header immutable fait servir au navigateur des bundles périmés (CSS/JS stale).
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/_next/static/(.*)',
              headers: [
                { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
              ],
            },
          ]
        : []),
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Supprime les logs de build Sentry
  silent: true,

  // Désactive le télémétrie Sentry
  telemetry: false,

  // Désactive l'upload des source maps (pas besoin pour le plan gratuit)
  sourcemaps: {
    disable: true,
  },
})
