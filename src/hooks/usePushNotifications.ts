'use client'

import { useState, useEffect, useCallback } from 'react'

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

interface UsePushNotificationsReturn {
  permission: PushPermissionState
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  sendTestNotification: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Check support and current state
  useEffect(() => {
    async function checkSupport() {
      // Check if Push API is supported
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPermission('unsupported')
        setIsSupported(false)
        setIsLoading(false)
        return
      }

      setIsSupported(true)

      // Check current permission
      const currentPermission = Notification.permission as PushPermissionState
      setPermission(currentPermission)

      // Register service worker
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        setRegistration(reg)

        // Check if already subscribed
        const subscription = await reg.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Service worker registration failed:', error)
      }

      setIsLoading(false)
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      return false
    }

    setIsLoading(true)

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult as PushPermissionState)

      if (permissionResult !== 'granted') {
        setIsLoading(false)
        return false
      }

      // Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      }

      if (vapidKey) {
        subscribeOptions.applicationServerKey = vapidKey
      }

      const subscription = await registration.pushManager.subscribe(subscribeOptions)

      // Send subscription to server (optional - for server-side push)
      // await saveSubscription(subscription)

      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Push subscription failed:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported, registration])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) {
      return false
    }

    setIsLoading(true)

    try {
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }
      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Push unsubscription failed:', error)
      setIsLoading(false)
      return false
    }
  }, [registration])

  // Send a test notification (local)
  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (permission !== 'granted' || !registration) {
      return
    }

    await registration.showNotification('CLIKZY', {
      body: 'Les notifications sont activées !',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'test-notification',
    })
  }, [permission, registration])

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  }
}
