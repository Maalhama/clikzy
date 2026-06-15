import 'server-only'
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

// Envoi de notifications Web Push (VAPID). Volontairement très sobre :
// uniquement des événements à haute valeur (victoire, coffres du jour).

let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@cleekzy.com'
  if (!pub || !priv) return false
  webpush.setVapidDetails(subject, pub, priv)
  configured = true
  return true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
}

type SubRow = { endpoint: string; p256dh: string; auth: string }

async function sendToSubscriptions(subs: SubRow[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured() || subs.length === 0) return
  const service = createServiceClient()
  const body = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        )
      } catch (err) {
        // 404/410 = abonnement mort -> on le purge
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          await service.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    })
  )
}

/** Notifie tous les navigateurs abonnés d'un utilisateur. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return
  const service = createServiceClient()
  const { data } = await service
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
  await sendToSubscriptions((data as SubRow[]) ?? [], payload)
}

/** Diffusion à tous les abonnés (réservé aux événements quotidiens à faible volume). */
export async function broadcastPush(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return
  const service = createServiceClient()
  const { data } = await service
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .limit(5000)
  await sendToSubscriptions((data as SubRow[]) ?? [], payload)
}
