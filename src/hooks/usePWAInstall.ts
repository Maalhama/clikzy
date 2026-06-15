'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAInstallReturn {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  /** iOS dans un navigateur in-app (réseaux) ou non-Safari : install standalone KO,
   *  on guide vers Safari. */
  isInAppBrowser: boolean
  install: () => Promise<boolean>
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIOSStandalone = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isIOSStandalone)

      // Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
      setIsIOS(isIOSDevice)

      // Navigateur in-app (réseaux) ou iOS non-Safari : l'install standalone n'y marche
      // pas -> le tuto guidera d'abord vers Safari. Vrai Safari = "safari" + "version/"
      // dans l'UA, sans marqueur CriOS/FxiOS/EdgiOS ni app in-app.
      const rawUA = window.navigator.userAgent
      const inAppMarker = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|Twitter|TikTok|musical_ly|Bytedance|Snapchat|Pinterest|LinkedInApp|GSA\/|MicroMessenger/i.test(rawUA)
      const realSafari = /Safari/i.test(rawUA) && /Version\//i.test(rawUA) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(rawUA)
      setIsInAppBrowser(isIOSDevice && (inAppMarker || !realSafari))
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false
    }

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        setInstallPrompt(null)
        return true
      }
    } catch (error) {
      console.error('Install error:', error)
    }

    return false
  }, [installPrompt])

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    isIOS,
    isInAppBrowser,
    install,
  }
}
