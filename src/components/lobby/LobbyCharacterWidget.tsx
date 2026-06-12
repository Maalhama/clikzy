'use client'

import { useEffect, useState } from 'react'
import { getCollection, type Collection } from '@/actions/collection'
import { CharacterAvatar } from '@/components/collection/CharacterAvatar'
import { LobbyCharacterModal } from '@/components/lobby/LobbyCharacterModal'

type Slot = 'casque' | 'armure' | 'anneau' | 'artefact'

/** Widget personnage du lobby : aperçu pixel art du héros équipé → modal personnage. */
export function LobbyCharacterWidget() {
  // On démarre avec un équipement vide -> le widget est TOUJOURS rendu (jamais
  // absent pendant le chargement), puis on l'enrichit dès que la collection arrive.
  const [equipment, setEquipment] = useState<Collection['equipment']>({})
  const [bonuses, setBonuses] = useState<Collection['bonuses'] | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getCollection().then((res) => {
      if (res.success && res.data) {
        setEquipment(res.data.equipment ?? {})
        setBonuses(res.data.bonuses)
      }
    }).catch(() => {})
  }, [])

  const count = (['casque', 'armure', 'anneau', 'artefact'] as Slot[]).filter((s) => equipment[s]).length

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hero-live-card group flex flex-1 items-center justify-center gap-0 px-2 py-2 text-left transition-transform hover:-translate-y-0.5 sm:flex-none sm:justify-start sm:gap-3 sm:px-4 sm:py-3"
      >
        <div className="shrink-0">
          <CharacterAvatar equipment={equipment} size={44} compact />
        </div>
        <div className="ml-3 hidden min-w-0 sm:block">
          <div className="font-display text-sm font-semibold text-white whitespace-nowrap">Mon personnage</div>
          <div className="mt-0.5 text-xs text-white/45">
            {count > 0 ? `${count}/4 équipement${count > 1 ? 's' : ''}` : 'Équipe-toi'}
          </div>
        </div>
      </button>

      {open && <LobbyCharacterModal equipment={equipment} bonuses={bonuses} onClose={() => setOpen(false)} />}
    </>
  )
}
