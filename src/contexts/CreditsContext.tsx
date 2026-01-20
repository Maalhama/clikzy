'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreditsContextType {
  credits: number
  updateCredits: (newCredits: number) => void
  decrementCredits: (amount?: number) => void
  refreshCredits: () => Promise<void>
}

const CreditsContext = createContext<CreditsContextType | null>(null)

interface CreditsProviderProps {
  children: ReactNode
  initialCredits: number
  userId: string | null
}

export function CreditsProvider({ children, initialCredits, userId }: CreditsProviderProps) {
  const [credits, setCredits] = useState(initialCredits)

  const updateCredits = useCallback((newCredits: number) => {
    setCredits(newCredits)
  }, [])

  const decrementCredits = useCallback((amount: number = 1) => {
    setCredits(prev => Math.max(0, prev - amount))
  }, [])

  const refreshCredits = useCallback(async () => {
    if (!userId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (data) {
      setCredits((data as { credits: number }).credits)
    }
  }, [userId])

  // Ecoute les changements en temps reel sur le profil
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.credits === 'number') {
            setCredits(payload.new.credits)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return (
    <CreditsContext.Provider value={{ credits, updateCredits, decrementCredits, refreshCredits }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext)
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}

// Hook optionnel pour les composants qui peuvent etre hors du provider
export function useCreditsOptional() {
  return useContext(CreditsContext)
}
