import 'server-only'
import { getServerStripe } from '@/lib/stripe/server'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

// Helpers « cadeau » partagés entre le webhook Stripe et la page de remerciement.
// Le code est DÉTERMINISTE (dérivé de la session Stripe) -> la création est
// idempotente : webhook et page success calculent le même code, la contrainte
// UNIQUE(stripe_session) empêche les doublons même en cas de course.

export interface GiftInfo {
  code: string
  kind: 'credits' | 'vip'
  credits: number
  vipDays: number
}

// Alphabet sans caractères ambigus (I, O, 0, 1, L) pour un code lisible/épelable.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function giftCodeFromSession(sessionId: string): string {
  const hex = createHash('sha256').update(sessionId).digest('hex').slice(0, 16)
  let n = BigInt('0x' + hex)
  const base = BigInt(CODE_ALPHABET.length)
  let out = ''
  while (out.length < 10) {
    out = CODE_ALPHABET[Number(n % base)] + out
    n = n / base
  }
  return out
}

/**
 * Garantit l'existence du code cadeau pour une session Stripe PAYÉE de type
 * « gift ». Idempotent. Retourne les infos du cadeau (ou null si session
 * invalide / non payée / pas un cadeau).
 */
export async function ensureGiftCodeForSession(sessionId: string): Promise<GiftInfo | null> {
  const stripe = getServerStripe()
  if (!stripe) return null

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') return null
  if (session.metadata?.type !== 'gift') return null

  const kind: 'credits' | 'vip' = session.metadata.giftKind === 'vip' ? 'vip' : 'credits'
  const credits = parseInt(session.metadata.credits || '0', 10)
  const vipDays = parseInt(session.metadata.vipDays || '0', 10)
  const code = giftCodeFromSession(sessionId)

  const svc = createServiceClient()
  await svc
    .from('gift_codes')
    .upsert(
      {
        code,
        gifter_id: session.metadata.gifterId || null,
        gifter_username: session.metadata.gifterUsername || null,
        kind,
        credits,
        vip_days: vipDays,
        pack_id: session.metadata.packId || null,
        amount_paid: session.amount_total ?? 0,
        stripe_session: sessionId,
      },
      { onConflict: 'stripe_session', ignoreDuplicates: true }
    )

  // Gift-to-unlock : bonus one-time au donneur de son 1er cadeau (idempotent côté RPC).
  if (session.metadata.gifterId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc.rpc as any)('claim_gift_unlock_bonus', { p_user_id: session.metadata.gifterId }).catch(() => {})
  }

  return { code, kind, credits, vipDays }
}
