import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = { getUser: vi.fn() }
const mockInsert = vi.fn()
const mockRpc = vi.fn()

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
const mockSupabase = { auth: mockAuth, from: vi.fn(() => makeSelectChain(playsReturned)) }
const mockServiceClient = { rpc: mockRpc }

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => Promise.resolve(mockSupabase)) }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn(() => mockServiceClient) }))

import { playMiniGame } from '@/actions/miniGames'

describe('playMiniGame — flux & garde-fous', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    playsReturned = []
    mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
    mockInsert.mockResolvedValue({ error: null })
    // consume_fairness renvoie des seeds ; add_mini_game_credits renvoie un total
    mockRpc.mockImplementation((name: string) =>
      name === 'consume_fairness'
        ? Promise.resolve({ data: [{ server_seed: 'srv', client_seed: 'cli', nonce: 0 }], error: null })
        : Promise.resolve({ data: 42, error: null })
    )
  })

  it('refuse un utilisateur non authentifié', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Non authentifié')
  })

  it('refuse si déjà joué aujourd’hui (gate JS)', async () => {
    playsReturned = [{ game_type: 'wheel', played_at: new Date().toISOString() }]
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/déjà joué/)
  })

  it('refuse sur conflit 23505 (gate atomique DB)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } })
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/déjà joué/)
  })

  it('joue avec succès et consomme l’état provably-fair', async () => {
    const res = await playMiniGame('wheel')
    expect(res.success).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('consume_fairness', { p_user: 'u-1' })
    expect(typeof res.data?.creditsWon).toBe('number')
  })
})
