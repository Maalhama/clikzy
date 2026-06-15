import type { Metadata } from 'next'
import Link from 'next/link'
import { ensureGiftCodeForSession } from '@/lib/gift'
import { GiftCodeReveal } from '@/components/gift/GiftCodeReveal'

export const metadata: Metadata = {
  title: 'Ton cadeau · Cleekzy',
  robots: { index: false },
}

export default async function MerciPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams
  const gift = session ? await ensureGiftCodeForSession(session).catch(() => null) : null

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 py-10">
      <div className="mb-6 text-center">
        <span className="kicker mb-2">Merci !</span>
      </div>

      {gift ? (
        <GiftCodeReveal
          code={gift.code}
          reward={gift.kind === 'vip' ? `${gift.vipDays} jours de VIP` : `${gift.credits} crédits`}
        />
      ) : (
        <div className="panel p-8 text-center">
          <h1 className="font-display text-xl font-bold text-white">On prépare ton cadeau…</h1>
          <p className="mt-2 text-sm text-white/55">
            Si ton paiement vient d&apos;aboutir, ton code apparaît d&apos;ici quelques secondes — recharge la page.
            Tu peux aussi retrouver tes cadeaux à tout moment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/cadeau/merci" className="btn-arena px-5 py-2.5 text-sm">Recharger</Link>
            <Link href="/lobby" className="btn-arena-outline px-5 py-2.5 text-sm">Retour à l&apos;arène</Link>
          </div>
        </div>
      )}
    </main>
  )
}
