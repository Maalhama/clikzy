import type { Metadata } from 'next'
import { JoinReferralButton } from './JoinReferralButton'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const c = decodeURIComponent(code).toUpperCase()
  const title = 'Rejoins-moi sur Cleekzy'
  const description = `Utilise mon code ${c} : des crédits offerts pour tenter de remporter des lots au dernier clic.`
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const c = decodeURIComponent(code).toUpperCase()

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f] px-6 text-center">
      <div className="pointer-events-none absolute -top-40 right-[-120px] h-[420px] w-[420px] rounded-full bg-neon-pink/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-120px] h-[420px] w-[420px] rounded-full bg-neon-purple/20 blur-3xl" />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6">
        <span className="text-3xl font-black tracking-tight">
          <span className="text-neon-purple">CLEEK</span><span className="text-neon-pink">ZY</span>
        </span>

        <h1 className="text-3xl font-black text-white sm:text-4xl">Un ami t&apos;invite à jouer</h1>

        <p className="text-white/70">
          Inscris-toi avec le code parrain ci-dessous et reçois des crédits pour tenter de
          remporter des lots réels — le dernier clic gagne.
        </p>

        <div className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4">
          <p className="text-xs uppercase tracking-widest text-white/40">Code parrain</p>
          <p className="font-display text-3xl font-black tracking-[0.2em] text-neon-purple">{c}</p>
        </div>

        <JoinReferralButton code={c} />

        <p className="text-xs text-white/40">
          Déjà un compte ?{' '}
          <a href="/lobby" className="text-neon-purple underline">Accéder au lobby</a>
        </p>
      </div>
    </main>
  )
}
