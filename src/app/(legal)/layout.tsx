import Link from 'next/link'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background Effects - Neon glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-neon-purple/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-neon-pink/8 rounded-full blur-[80px]" />
        <div className="absolute top-[50%] right-[20%] w-32 h-32 bg-neon-blue/5 rounded-full blur-[60px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            <span className="text-neon-purple">CLIK</span>
            <span className="text-neon-pink">ZY</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 md:p-8 rounded-2xl bg-bg-secondary/30 border border-white/10 backdrop-blur-sm">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <Link href="/terms" className="hover:text-neon-purple transition-colors">CGU</Link>
            <Link href="/privacy" className="hover:text-neon-purple transition-colors">Confidentialité</Link>
            <Link href="/legal" className="hover:text-neon-purple transition-colors">Mentions légales</Link>
            <Link href="/cgv" className="hover:text-neon-purple transition-colors">CGV</Link>
          </div>
          <p className="text-center text-white/30 text-xs mt-4">
            © 2026 CLEEKZY. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
