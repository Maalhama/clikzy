import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { SkipLink } from '@/components/ui/SkipLink'
import { CookieConsent } from '@/components/common/CookieConsent'
import { Analytics } from '@/components/common/Analytics'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0F1A' },
    { media: '(prefers-color-scheme: light)', color: '#0B0F1A' },
  ],
}

export const metadata: Metadata = {
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
    url: 'https://cleekzy.com',
    siteName: 'CLEEKZY',
    title: 'CLEEKZY - Le dernier clic gagne',
    description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour. iPhone, PS5, MacBook et plus à gagner.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CLEEKZY - Le dernier clic gagne des lots premium',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLEEKZY - Le dernier clic gagne',
    description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour.',
    images: ['/og-image.png'],
    creator: '@cleekzy_fr',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  category: 'gaming',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-bg-primary text-text-primary min-h-screen">
        <SkipLink />
        {children}
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  )
}
