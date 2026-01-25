import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/security', () => ({
  checkClickFraud: vi.fn(() => ({ allowed: true })),
  auditLog: vi.fn(),
}))

vi.mock('@/actions/badges', () => ({
  checkAndAwardBadges: vi.fn(() => ({ newBadges: [] })),
}))

// Import après les mocks
import { clickGame } from '@/actions/game'

describe('Game Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('clickGame', () => {
    it('should reject unauthenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

      const result = await clickGame('game-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Non authentifié')
    })

    it('should reject users with insufficient credits', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          credits: 0,
          earned_credits: 0,
          username: 'testuser',
          total_clicks: 10,
        },
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      const result = await clickGame('game-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Crédits insuffisants')
    })

    it('should reject clicks on inactive games', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({
          data: {
            credits: 10,
            earned_credits: 5,
            username: 'testuser',
            total_clicks: 10,
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'game-1',
            status: 'ended',
            end_time: Date.now() + 60000,
            total_clicks: 50,
            item: { name: 'iPhone' },
          },
        })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      const result = await clickGame('game-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cette partie n\'accepte plus de clics')
    })

    it('should successfully process click and deduct credits', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({
          data: {
            credits: 10,
            earned_credits: 5,
            username: 'testuser',
            total_clicks: 10,
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'game-1',
            status: 'active',
            end_time: Date.now() + 60000,
            total_clicks: 50,
            item: { name: 'iPhone' },
          },
        })

      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnThis()

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      // Mock RPC calls
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 123, error: null }) // get_next_sequence
        .mockResolvedValueOnce({ data: 1, error: null }) // deduct_credits

      const result = await clickGame('game-1')

      expect(result.success).toBe(true)

      // Vérifier que deduct_credits a été appelé
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'deduct_credits',
        expect.objectContaining({
          p_user_id: 'user-1',
          p_amount: 1,
        })
      )

      // Vérifier que le clic a été enregistré
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          game_id: 'game-1',
          user_id: 'user-1',
          username: 'testuser',
          is_bot: false,
          credits_spent: 1,
        })
      )
    })

    it('should reset timer to 1 minute when entering final phase', async () => {
      const now = Date.now()
      const endTimeSoon = now + 30000 // 30 seconds left

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
      })

      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({
          data: {
            credits: 10,
            earned_credits: 5,
            username: 'testuser',
            total_clicks: 10,
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'game-1',
            status: 'active',
            end_time: endTimeSoon,
            total_clicks: 50,
            item: { name: 'iPhone' },
          },
        })

      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnThis()

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      })

      mockSelect.mockReturnValue({
        eq: mockEq,
      })

      mockEq.mockReturnValue({
        single: mockSingle,
      })

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 123, error: null })
        .mockResolvedValueOnce({ data: 1, error: null })

      const result = await clickGame('game-1')

      expect(result.success).toBe(true)
      expect(result.data?.newEndTime).toBeDefined()
      // Timer should be reset to 90 seconds (FINAL_PHASE_RESET constant)
      const timeDifference = result.data!.newEndTime! - now
      expect(timeDifference).toBeGreaterThan(85000) // At least 85 seconds
      expect(timeDifference).toBeLessThan(95000) // At most 95 seconds
    })
  })
})
