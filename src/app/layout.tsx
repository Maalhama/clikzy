import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Unbounded, JetBrains_Mono } from 'next/font/google'
import { SkipLink } from '@/components/ui/SkipLink'
import { CookieConsent } from '@/components/common/CookieConsent'
import { Analytics } from '@/components/common/Analytics'
import { WebVitalsReporter } from '@/components/analytics/WebVitalsReporter'
import { SWRegister } from '@/components/pwa/SWRegister'
import './globals.css'

// Body : grotesque moderne et lisible (remplace Inter)
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
})

// Display : géométrique et énergique pour les titres, le wordmark et les gros chiffres
const display = Unbounded({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  fallback: ['var(--font-sans)', 'system-ui', 'sans-serif'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false, // Not critical for LCP
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // PWA iOS standalone : active les variables env(safe-area-*) pour ne pas passer sous
  // la barre d'état translucide (le header utilise pt-[env(safe-area-inset-top)]).
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0F1A' },
    { media: '(prefers-color-scheme: light)', color: '#0B0F1A' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cleekzy.com'),
  title: {
    default: 'CLEEKZY - Le dernier clic gagne',
    template: '%s | CLEEKZY',
  },
  description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour. iPhone, PS5, MacBook et plus à gagner.',
  keywords: ['jeu gratuit', 'gagner des lots', 'concours', 'temps réel', 'clic', 'gaming', 'iPhone', 'PS5', 'lots gratuits'],
  authors: [{ name: 'CLEEKZY' }],
  creator: 'CLEEKZY',
  publisher: 'CLEEKZY',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.cleekzy.com',
    siteName: 'CLEEKZY',
    title: 'CLEEKZY - Le dernier clic gagne',
    description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour. iPhone, PS5, MacBook et plus à gagner.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLEEKZY - Le dernier clic gagne',
    description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour.',
    creator: '@cleekzy_fr',
  },
  manifest: '/manifest.json',
  category: 'gaming',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    // apple-touch-icon : icône de l'app une fois ajoutée à l'écran d'accueil iOS
    // (sinon iOS prend une capture floue de la page).
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'CLEEKZY',
    statusBarStyle: 'black-translucent',
  },
}

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CLEEKZY',
  description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour.',
  url: 'https://www.cleekzy.com',
  applicationCategory: 'Game',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  author: {
    '@type': 'Organization',
    name: 'CLEEKZY',
    url: 'https://www.cleekzy.com',
  },
  potentialAction: {
    '@type': 'PlayAction',
    target: 'https://www.cleekzy.com/lobby',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-bg-primary text-text-primary min-h-screen">
        <SkipLink />
        {children}
        <CookieConsent />
        <Analytics />
        <WebVitalsReporter />
        <SWRegister />
      </body>
    </html>
  )
}
