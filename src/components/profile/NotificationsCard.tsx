'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { savePushSubscription, removePushSubscription } from '@/actions/push'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

type State = 'unsupported' | 'idle' | 'loading' | 'enabled' | 'denied'

/**
 * Opt-in notifications push : victoires + coffres quotidiens.
 * Abonnement par navigateur, stocké côté serveur (RLS owner).
 */
export function NotificationsCard() {
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription()
      setState(sub ? 'enabled' : 'idle')
    })
  }, [])

  const enable = useCallback(async () => {
    setState('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'idle')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) { setState('idle'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      })
      const json = sub.toJSON()
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
      })
      setState(res.success ? 'enabled' : 'idle')
    } catch {
      setState('idle')
    }
  }, [])

  const disable = useCallback(async () => {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
    } finally {
      setState('idle')
    }
  }, [])

  if (state === 'unsupported') return null

  return (
    <div className="panel flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
        state === 'enabled'
          ? 'border-success/50 bg-success/10 text-success shadow-[0_0_16px_-4px_rgba(0,255,136,0.6)]'
          : 'border-neon-purple/40 bg-neon-purple/10 text-neon-purple'
      }`}>
        {state === 'enabled' ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-white">Notifications</p>
        <p className="text-xs text-white/50">
          {state === 'enabled'
            ? 'Activées : victoires et coffres du jour'
            : state === 'denied'
            ? 'Bloquées par le navigateur (réglages du site)'
            : 'Sois prévenu de tes victoires et de tes coffres du jour'}
        </p>
      </div>
      {state !== 'denied' && (
        <button
          onClick={state === 'enabled' ? disable : enable}
          disabled={state === 'loading'}
          className={state === 'enabled' ? 'btn-arena-ghost px-4 py-2 text-xs' : 'btn-arena px-4 py-2 text-xs'}
        >
          {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : state === 'enabled' ? 'Désactiver' : 'Activer'}
        </button>
      )}
    </div>
  )
}
