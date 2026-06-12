// Source unique de vérité pour les emplacements d'équipement du personnage.
// (Les types riches InventoryItem/Collection vivent dans src/actions/collection.ts.)

export type Slot = 'casque' | 'armure' | 'anneau' | 'artefact'

export const EQUIPMENT_SLOTS: readonly Slot[] = ['casque', 'armure', 'anneau', 'artefact'] as const
