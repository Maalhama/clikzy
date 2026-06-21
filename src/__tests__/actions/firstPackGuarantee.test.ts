import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  auth: { getUser: vi.fn() },
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

import { getFirstPackGuarantee, claimFirstPackGuarantee } from '@/actions/firstPackGuarantee'

describe('First pack guarantee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns the eligible status from the RPC', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [{ eligible: true, claimed: false, amount: 120, reason: 'ok', deadline: '2026-08-01T00:00:00Z' }],
    })
    const status = await getFirstPackGuarantee()
    expect(status).toEqual({
      eligible: true,
      claimed: false,
      amount: 120,
      reason: 'ok',
      deadline: '2026-08-01T00:00:00Z',
    })
  })

  it('credits the player on a successful claim', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [{ ok: true, reason: 'ok', credited: 120 }], error: null })
    const res = await claimFirstPackGuarantee()
    expect(res.success).toBe(true)
    expect(res.data?.credited).toBe(120)
  })

  it('maps the has_won reason to a clear message', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [{ ok: false, reason: 'has_won', credited: 0 }], error: null })
    const res = await claimFirstPackGuarantee()
    expect(res.success).toBe(false)
    expect(res.error).toContain('remporté')
  })

  it('rejects an unauthenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await claimFirstPackGuarantee()
    expect(res.success).toBe(false)
    expect(res.error).toBe('Non authentifié')
  })
})
