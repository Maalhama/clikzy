import type { Metadata } from 'next'
import { GiftClaim } from '@/components/gift/GiftClaim'
import { getGiftInfo } from '@/actions/gift'

export const metadata: Metadata = {
  title: 'Réclamer un cadeau · Cleekzy',
  description: 'Réclame ton cadeau Cleekzy : crédits ou VIP offerts par un ami.',
}

export default async function CadeauPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const decoded = code ? decodeURIComponent(code) : ''
  const info = decoded ? await getGiftInfo(decoded) : null

  return (
    <main className="relative z-10 mx-auto max-w-md px-4 py-10">
      <div className="mb-6 text-center">
        <span className="kicker mb-2">Carte cadeau</span>
      </div>
      <GiftClaim initialCode={decoded} initialInfo={info} />
    </main>
  )
}
