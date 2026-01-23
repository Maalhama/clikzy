// Service Worker for Push Notifications - CLIKZY
const CACHE_NAME = 'clikzy-v1'

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  event.waitUntil(clients.claim())
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  let data = {
    title: 'CLIKZY',
    body: 'Nouvelle notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'clikzy-notification',
    data: { url: '/lobby' }
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'clikzy-notification',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: data.data || { url: '/lobby' },
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)
  event.notification.close()

  const url = event.notification.data?.url || '/lobby'

  if (event.action === 'close') {
    return
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})
