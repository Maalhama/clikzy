import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cleekzy.com'

export const revalidate = 3600 // régénéré toutes les heures

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/lobby`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/gagnants`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/classement`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    // NOTE : /shop, /vip et /mini-games sont volontairement EXCLUS du sitemap.
    // Ces routes font redirect('/login') pour un visiteur non connecté (donc pour
    // Googlebot) : les soumettre à l'indexation produit des pages « mortes »
    // (soft-404 / contenu vide). Elles sont aussi en Disallow dans robots.txt.
    {
      url: `${BASE_URL}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Legal pages
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cgv`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/comment-ca-marche`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/jeu-responsable`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]

  // Profils publics des gagnants récents (pages /joueur/[username] indexables).
  // Lecture anonyme : la table winners est en lecture publique (RLS).
  let playerPages: MetadataRoute.Sitemap = []
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && anonKey) {
      const supabase = createClient(supabaseUrl, anonKey)
      const { data: winners } = await supabase
        .from('winners')
        .select('username, is_bot, created_at')
        .eq('is_bot', false)
        .order('created_at', { ascending: false })
        .limit(200)

      const seen = new Set<string>()
      playerPages = (winners || [])
        .filter((w) => w.username && !seen.has(w.username) && seen.add(w.username))
        .slice(0, 100)
        .map((w) => ({
          url: `${BASE_URL}/joueur/${encodeURIComponent(w.username)}`,
          lastModified: new Date(w.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.4,
        }))
    }
  } catch {
    // sitemap statique en secours : ne jamais faire échouer la génération
  }

  return [...staticPages, ...playerPages]
}
