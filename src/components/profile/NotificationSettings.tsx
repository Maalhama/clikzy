'use client'

import { motion } from 'framer-motion'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationSettings() {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <BellOffIcon className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <div className="text-white font-medium">Notifications</div>
            <div className="text-white/40 text-sm">Non supportées sur ce navigateur</div>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 rounded-xl bg-danger/10 border border-danger/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/20 flex items-center justify-center">
            <BellOffIcon className="w-5 h-5 text-danger" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">Notifications bloquées</div>
            <div className="text-white/40 text-sm">
              Active les notifications dans les paramètres de ton navigateur
            </div>
          </div>
        </div>
      </div>
    )
  }

  async function handleToggle() {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      const success = await subscribe()
      if (success) {
        // Send test notification on first subscribe
        setTimeout(() => sendTestNotification(), 500)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-bg-secondary/50 border border-white/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isSubscribed ? 'bg-neon-purple/20' : 'bg-white/10'
          }`}>
            {isSubscribed ? (
              <BellIcon className="w-5 h-5 text-neon-purple" />
            ) : (
              <BellOffIcon className="w-5 h-5 text-white/40" />
            )}
          </div>
          <div>
            <div className="text-white font-medium">Notifications push</div>
            <div className="text-white/40 text-sm">
              {isSubscribed
                ? 'Tu recevras des alertes pour les parties'
                : 'Active pour ne rien manquer'}
            </div>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            isSubscribed ? 'bg-neon-purple' : 'bg-white/20'
          } ${isLoading ? 'opacity-50' : ''}`}
        >
          <motion.div
            layout
            className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
            style={{ left: isSubscribed ? 'calc(100% - 28px)' : '4px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {isSubscribed && (
        <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onClick={sendTestNotification}
          className="mt-3 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
        >
          Tester les notifications
        </motion.button>
      )}
    </motion.div>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function BellOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
