import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { SkipLink } from '@/components/ui/SkipLink'
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
    default: 'CLIKZY - Le dernier clic gagne',
    template: '%s | CLIKZY',
  },
  description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour. iPhone, PS5, MacBook et plus à gagner.',
  keywords: ['jeu gratuit', 'gagner des lots', 'concours', 'temps réel', 'clic', 'gaming', 'iPhone', 'PS5', 'lots gratuits'],
  authors: [{ name: 'CLIKZY' }],
  creator: 'CLIKZY',
  publisher: 'CLIKZY',
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
    url: 'https://clikzy.fr',
    siteName: 'CLIKZY',
    title: 'CLIKZY - Le dernier clic gagne',
    description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour. iPhone, PS5, MacBook et plus à gagner.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CLIKZY - Le dernier clic gagne des lots premium',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLIKZY - Le dernier clic gagne',
    description: 'Jeu gratuit en temps réel : le dernier à cliquer remporte le lot. 10 clics gratuits chaque jour.',
    images: ['/og-image.png'],
    creator: '@clikzy_fr',
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
      </body>
    </html>
  )
}
