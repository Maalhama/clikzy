import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'CLIKZY - Le dernier clic gagne',
  description: 'Plateforme de jeu d\'enchères interactif en temps réel. Le dernier à cliquer avant la fin du timer remporte l\'objet.',
  keywords: ['jeu', 'enchères', 'temps réel', 'clic', 'gaming'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-bg-primary text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  )
}
