import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
}

// Depuis le fix d'audit, le clic appelle perform_click (+ increment_item_gauge) via
// service_role -> on mocke aussi le client service.
const mockServiceSupabase = {
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockServiceSupabase),
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
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
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
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      })

      const result = await clickGame('game-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cette partie n\'accepte plus de clics')
    })

    it('should reject a player with wins on a beginners-only game', async () => {
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
            total_wins: 3, // a déjà gagné -> plus un débutant
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'game-1',
            status: 'active',
            end_time: Date.now() + 60000,
            total_clicks: 50,
            beginners_only: true,
            item: { name: 'iPhone' },
          },
        })

      mockSupabase.from.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle, maybeSingle: vi.fn().mockResolvedValue({ data: null }) })

      const result = await clickGame('game-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('débutants')
      // le clic ne doit PAS partir
      expect(mockServiceSupabase.rpc).not.toHaveBeenCalled()
    })

    it('should allow a beginner (0 win) on a beginners-only game', async () => {
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
            total_wins: 0, // débutant
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'game-1',
            status: 'active',
            end_time: Date.now() + 60000,
            total_clicks: 50,
            beginners_only: true,
            item: { name: 'iPhone' },
          },
        })

      mockSupabase.from.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle, maybeSingle: vi.fn().mockResolvedValue({ data: null }) })

      mockServiceSupabase.rpc.mockResolvedValue({
        data: [{ ok: true, new_total: 14, new_end_time: Date.now() + 90000, reason: 'ok' }],
        error: null,
      })

      const result = await clickGame('game-1')

      expect(result.success).toBe(true)
      expect(mockServiceSupabase.rpc).toHaveBeenCalledWith('perform_click', expect.any(Object))
    })

    it('should successfully process a click via the perform_click RPC', async () => {
      // Depuis I5, le clic est ATOMIQUE : un seul appel RPC perform_click
      // (déduction + insertion + maj partie). Plus d'insert/update côté TS.
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

      mockSupabase.from.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle, maybeSingle: vi.fn().mockResolvedValue({ data: null }) })

      mockServiceSupabase.rpc.mockResolvedValue({
        data: [{ ok: true, new_total: 14, new_end_time: Date.now() + 90000, reason: 'ok' }],
        error: null,
      })

      const result = await clickGame('game-1')

      expect(result.success).toBe(true)
      expect(mockServiceSupabase.rpc).toHaveBeenCalledWith(
        'perform_click',
        expect.objectContaining({
          p_game_id: 'game-1',
          p_user_id: 'user-1',
          p_username: 'testuser',
          p_item_name: 'iPhone',
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

      mockSupabase.from.mockReturnValue({ select: mockSelect })
      mockSelect.mockReturnValue({ eq: mockEq })
      mockEq.mockReturnValue({ single: mockSingle, maybeSingle: vi.fn().mockResolvedValue({ data: null }) })

      mockServiceSupabase.rpc.mockResolvedValue({
        data: [{ ok: true, new_total: 14, new_end_time: now + 90000, reason: 'ok' }],
        error: null,
      })

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
