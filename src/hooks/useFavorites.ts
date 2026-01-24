'use client'

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'cleekzy_favorites'

interface UseFavoritesReturn {
  favorites: string[]
  isFavorite: (gameId: string) => boolean
  toggleFavorite: (gameId: string) => void
  addFavorite: (gameId: string) => void
  removeFavorite: (gameId: string) => void
  clearFavorites: () => void
}

/**
 * Hook pour gérer les favoris avec persistance localStorage
 */
export function useFavorites(): UseFavoritesReturn {
  // Initialize with empty array, load from localStorage in useEffect
  const [favorites, setFavorites] = useState<string[]>([])

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setFavorites(parsed)
        }
      }
    } catch {
      // Invalid data, reset
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Save to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // Storage full or unavailable
    }
  }, [favorites])

  const isFavorite = useCallback(
    (gameId: string) => favorites.includes(gameId),
    [favorites]
  )

  const addFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => {
      if (prev.includes(gameId)) return prev
      return [...prev, gameId]
    })
  }, [])

  const removeFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== gameId))
  }, [])

  const toggleFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => {
      if (prev.includes(gameId)) {
        return prev.filter((id) => id !== gameId)
      }
      return [...prev, gameId]
    })
  }, [])

  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  }
}
