import { describe, it, expect } from 'vitest'
import { WHEEL_SEGMENTS, PACHINKO_SLOTS } from '@/types/miniGames'
import { SEGMENTS } from '@/components/mini-games/WheelOfFortune'
import { SLOTS } from '@/components/mini-games/Pachinko'

// RÉGRESSION HISTORIQUE : la roue affichait [0,0,1,1,2,3,3,10] et le pachinko
// [0,0,1,3,10,3,1,0,0] alors que le serveur tirait dans [0,0,0,1,1,2,2,5] /
// [0,0,1,2,5,2,1,0,0]. Le serveur renvoyant un INDICE, l'aiguille pointait un
// montant ≠ du gain réel. Ces tests verrouillent la parité affiché ↔ serveur.
describe('Parité visuelle des mini-jeux ↔ barème serveur', () => {
  it('la roue affiche exactement les valeurs serveur, dans le même ordre', () => {
    const visualValues = SEGMENTS.map((s) => s.value)
    expect(visualValues).toEqual([...WHEEL_SEGMENTS])
  })

  it('le pachinko affiche exactement les slots serveur, dans le même ordre', () => {
    expect(SLOTS).toEqual([...PACHINKO_SLOTS])
  })

  it('aucune valeur affichée ne dépasse le plafond serveur (5)', () => {
    const maxServer = Math.max(...WHEEL_SEGMENTS, ...PACHINKO_SLOTS)
    expect(Math.max(...SEGMENTS.map((s) => s.value))).toBeLessThanOrEqual(maxServer)
    expect(Math.max(...SLOTS)).toBeLessThanOrEqual(maxServer)
  })
})
