'use client'

import { useState, useCallback, useEffect } from 'react'
import { getMyFavorites, addFavorite as addFavoriteDb, removeFavorite as removeFavoriteDb } from '@/actions/favorites'

const STORAGE_KEY = 'cleekzy_favorites'

interface UseFavoritesReturn {
  favorites: string[]
  isFavorite: (gameId: string) => boolean
  toggleFavorite: (gameId: string) => void
  addFavorite: (gameId: string) => void
  removeFavorite: (gameId: string) => void
  clearFavorites: () => void
}

function readLocal(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
  }
  return []
}

/**
 * Favoris : persistés en base pour les joueurs connectés (le serveur peut alors
 * notifier « ton favori entre en phase finale »), localStorage pour les visiteurs
 * anonymes. À la connexion, les favoris locaux sont migrés une fois vers la base.
 * Les opérations DB sont idempotentes (upsert / delete), donc sûres en fire-and-forget.
 */
export function useFavorites(isLoggedIn: boolean = false): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>([])

  // Chargement initial selon l'état de connexion.
  useEffect(() => {
    let active = true
    if (isLoggedIn) {
      const local = readLocal()
      void (async () => {
        // Migration unique des favoris locaux vers la base.
        if (local.length > 0) {
          await Promise.allSettled(local.map((id) => addFavoriteDb(id)))
          try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
        }
        const db = await getMyFavorites()
        if (active) setFavorites(Array.from(new Set([...db, ...local])))
      })()
    } else {
      setFavorites(readLocal())
    }
    return () => { active = false }
  }, [isLoggedIn])

  // Persistance localStorage uniquement pour les anonymes.
  useEffect(() => {
    if (isLoggedIn) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)) } catch { /* noop */ }
  }, [favorites, isLoggedIn])

  const isFavorite = useCallback((gameId: string) => favorites.includes(gameId), [favorites])

  const addFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => {
      if (prev.includes(gameId)) return prev
      if (isLoggedIn) void addFavoriteDb(gameId)
      return [...prev, gameId]
    })
  }, [isLoggedIn])

  const removeFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => {
      if (!prev.includes(gameId)) return prev
      if (isLoggedIn) void removeFavoriteDb(gameId)
      return prev.filter((id) => id !== gameId)
    })
  }, [isLoggedIn])

  const toggleFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => {
      const has = prev.includes(gameId)
      if (isLoggedIn) void (has ? removeFavoriteDb(gameId) : addFavoriteDb(gameId))
      return has ? prev.filter((id) => id !== gameId) : [...prev, gameId]
    })
  }, [isLoggedIn])

  const clearFavorites = useCallback(() => {
    setFavorites((prev) => {
      if (isLoggedIn) void Promise.allSettled(prev.map((id) => removeFavoriteDb(id)))
      return []
    })
  }, [isLoggedIn])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  }
}
