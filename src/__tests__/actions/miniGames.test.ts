import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  WHEEL_SEGMENTS,
  SCRATCH_VALUES,
  PACHINKO_SLOTS,
  SLOTS_PAYOUTS,
} from '@/types/miniGames'

// --- Mocks ---
const mockAuth = { getUser: vi.fn() }
const mockInsert = vi.fn()
const mockRpc = vi.fn()

// Chaîne select().eq().eq().gte().order() pour getMiniGameEligibility
function makeSelectChain(plays: unknown[]) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.gte = vi.fn(() => chain)
  chain.order = vi.fn(() => Promise.resolve({ data: plays, error: null }))
  chain.single = vi.fn(() => Promise.resolve({ data: { credits: 7 }, error: null }))
  chain.insert = mockInsert
  return chain
}

let playsReturned: unknown[] = []

const mockSupabase = {
  auth: mockAuth,
  from: vi.fn(() => makeSelectChain(playsReturned)),
}

const mockServiceClient = { rpc: mockRpc }

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
}))

import { playMiniGame } from '@/actions/miniGames'

describe('playMiniGame — intégrité économique', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    playsReturned = []
    mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
    mockInsert.mockResolvedValue({ error: null })
    // add_mini_game_credits renvoie le nouveau total ; on renvoie 42 par défaut
    mockRpc.mockResolvedValue({ data: 42, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refuse un utilisateur non authentifié', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Non authentifié')
  })

  it('refuse si le jeu gratuit a déjà été joué aujourd’hui (gate JS)', async () => {
    playsReturned = [{ game_type: 'wheel', played_at: new Date().toISOString() }]
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/déjà joué/)
  })

  it('refuse en cas de conflit 23505 (gate atomique DB fait autorité)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } })
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/déjà joué/)
  })

  // INVARIANT CLÉ : le montant gagné = la valeur de la table à l'index tiré.
  // C'est la régression qui avait fait afficher "10" sur un segment valant 5.
  describe('le gain correspond exactement à la table serveur tirée', () => {
    const cases: Array<['wheel' | 'scratch' | 'pachinko', readonly number[], 'segmentIndex' | 'slotIndex']> = [
      ['wheel', WHEEL_SEGMENTS, 'segmentIndex'],
      ['pachinko', PACHINKO_SLOTS, 'slotIndex'],
    ]

    for (const [game, table, idxKey] of cases) {
      it(`${game} : index tiré → gain = table[index]`, async () => {
        // Force Math.random à pointer le dernier segment (la valeur "jackpot")
        const targetIndex = table.length - 1
        vi.spyOn(Math, 'random').mockReturnValue(targetIndex / table.length)
        const res = await playMiniGame(game)
        expect(res.success).toBe(true)
        // L'index renvoyé au client pointe la bonne valeur
        const idx = (res.data as unknown as Record<string, number>)[idxKey]
        expect(idx).toBe(targetIndex)
        expect(res.data?.creditsWon).toBe(table[targetIndex])
        // Et le RPC a crédité exactement ce montant (si > 0)
        if (table[targetIndex] > 0) {
          expect(mockRpc).toHaveBeenCalledWith('add_mini_game_credits', {
            p_user_id: 'u-1',
            p_amount: table[targetIndex],
          })
        }
      })
    }

    it('scratch : gain = SCRATCH_VALUES[index] sur tout l’intervalle', async () => {
      for (let i = 0; i < SCRATCH_VALUES.length; i++) {
        vi.clearAllMocks()
        mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
        mockInsert.mockResolvedValue({ error: null })
        mockRpc.mockResolvedValue({ data: 1, error: null })
        playsReturned = []
        vi.spyOn(Math, 'random').mockReturnValue(i / SCRATCH_VALUES.length)
        const res = await playMiniGame('scratch')
        expect(res.data?.creditsWon).toBe(SCRATCH_VALUES[i])
        vi.restoreAllMocks()
      }
    })
  })

  it('aucun gain ne dépasse jamais le plafond de 5 crédits', async () => {
    const tables = [WHEEL_SEGMENTS, SCRATCH_VALUES, PACHINKO_SLOTS, SLOTS_PAYOUTS]
    for (const t of tables) {
      expect(Math.max(...t)).toBeLessThanOrEqual(5)
    }
  })

  it('un gain nul ne déclenche aucun crédit serveur', async () => {
    // Indice 0 = valeur 0 sur la roue
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(true)
    expect(res.data?.creditsWon).toBe(0)
    expect(mockRpc).not.toHaveBeenCalled()
  })
})
