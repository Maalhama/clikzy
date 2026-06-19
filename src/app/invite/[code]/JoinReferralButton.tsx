'use client'

import { useRouter } from 'next/navigation'
import { storePendingReferral } from '@/lib/referralPending'

export function JoinReferralButton({ code }: { code: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => {
        storePendingReferral(code)
        router.push(`/register?ref=${encodeURIComponent(code)}`)
      }}
      className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink px-8 py-4 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
    >
      Créer mon compte et jouer →
    </button>
  )
}
