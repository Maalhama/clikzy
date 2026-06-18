import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock Supabase (server client) ---
const { mockSignUp } = vi.hoisted(() => ({ mockSignUp: vi.fn() }))
const mockSupabase = {
  auth: {
    signUp: mockSignUp,
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

// Email de bienvenue (non-bloquant) — neutralisé.
vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn(() => Promise.resolve({ success: true })),
}))

// Rate-limit auth : mocké directement, succès par défaut.
const { mockAuthLimiter } = vi.hoisted(() => ({ mockAuthLimiter: vi.fn() }))
vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: { auth: mockAuthLimiter },
}))

import { signUp } from '@/actions/auth'

function fd(fields: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

const VALID = {
  email: 'new@example.com',
  password: 'password123',
  username: 'newplayer',
  ageConfirmed: 'true',
}

describe('signUp — attestation 18+ (protection des mineurs)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthLimiter.mockResolvedValue({ success: true, remaining: 9, resetIn: 60_000 })
    mockSignUp.mockResolvedValue({ data: {}, error: null })
  })

  it('refuse si ageConfirmed absent — supabase.auth.signUp NON appelé', async () => {
    const res = await signUp(fd({ email: VALID.email, password: VALID.password, username: VALID.username }))
    expect(res.success).toBe(false)
    expect(res.error).toBe('Tu dois confirmer avoir 18 ans ou plus pour créer un compte.')
    expect(mockSignUp).not.toHaveBeenCalled()
    // La garde 18+ passe AVANT le rate-limit/auth.
    expect(mockAuthLimiter).not.toHaveBeenCalled()
  })

  it("refuse si ageConfirmed = 'false' — signUp NON appelé", async () => {
    const res = await signUp(fd({ ...VALID, ageConfirmed: 'false' }))
    expect(res.success).toBe(false)
    expect(res.error).toBe('Tu dois confirmer avoir 18 ans ou plus pour créer un compte.')
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it("refuse une valeur ambiguë (ageConfirmed = 'on') — seul 'true' est accepté", async () => {
    const res = await signUp(fd({ ...VALID, ageConfirmed: 'on' }))
    expect(res.success).toBe(false)
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it("succès si ageConfirmed = 'true' — signUp appelé + age_confirmed_at stampé", async () => {
    const res = await signUp(fd(VALID))
    expect(res.success).toBe(true)
    expect(mockSignUp).toHaveBeenCalledTimes(1)
    const arg = mockSignUp.mock.calls[0][0]
    expect(arg.email).toBe(VALID.email)
    expect(arg.options.data.username).toBe(VALID.username)
    // L'attestation est tracée dans les metadata (preuve serveur).
    expect(typeof arg.options.data.age_confirmed_at).toBe('string')
    expect(() => new Date(arg.options.data.age_confirmed_at).toISOString()).not.toThrow()
  })

  it('avec ageConfirmed=true, un email invalide est toujours rejeté (signUp NON appelé)', async () => {
    const res = await signUp(fd({ ...VALID, email: 'notanemail' }))
    expect(res.success).toBe(false)
    expect(res.error).toBe('Email invalide')
    expect(mockSignUp).not.toHaveBeenCalled()
  })
})
