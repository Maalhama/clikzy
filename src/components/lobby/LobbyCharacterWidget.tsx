'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCollection } from '@/actions/collection'
import { CharacterAvatar } from '@/components/collection/CharacterAvatar'

type Slot = 'casque' | 'armure' | 'anneau' | 'artefact'
type Equipment = Partial<Record<Slot, { item: { id: string; slot: Slot; rarity: string; name: string } }>>

/** Widget personnage du lobby : aperçu pixel art du héros équipé → /collection. */
export function LobbyCharacterWidget() {
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment | null>(null)

  useEffect(() => {
    getCollection().then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((res as any)?.success && (res as any).data) setEquipment((res as any).data.equipment ?? {})
      else if ((res as any)?.equipment) setEquipment((res as any).equipment)
      else setEquipment({})
    }).catch(() => setEquipment({}))
  }, [])

  if (equipment === null) return null
  const count = (['casque', 'armure', 'anneau', 'artefact'] as Slot[]).filter((s) => equipment[s]).length

  return (
    <button
      type="button"
      onClick={() => router.push('/collection')}
      className="hero-live-card group flex items-center gap-3 px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
    >
      <div className="shrink-0">
        <CharacterAvatar equipment={equipment} size={44} compact />
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold text-white whitespace-nowrap">Mon personnage</div>
        <div className="mt-0.5 text-xs text-white/45">
          {count > 0 ? `${count}/4 équipement${count > 1 ? 's' : ''}` : 'Équipe-toi'}
        </div>
      </div>
    </button>
  )
}
