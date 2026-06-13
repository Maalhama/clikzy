'use server'

import { createClient } from '@/lib/supabase/server'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export type GameComment = {
  id: string
  username: string
  content: string
  created_at: string
}

export type CommentFeedItem = GameComment & {
  game_id: string
  item_name: string
  item_image: string
}

type PostResult = {
  ok: boolean
  error?: string
  id?: string
  username?: string
  content?: string
  created_at?: string
}

const POST_ERRORS: Record<string, string> = {
  must_play_first: 'Clique au moins une fois dans la partie pour commenter.',
  too_fast: 'Doucement ! Attends quelques secondes avant de recommenter.',
  empty: 'Écris quelque chose avant d’envoyer.',
  not_authenticated: 'Connecte-toi pour commenter.',
}

/** Poste un commentaire (le serveur valide que le joueur a cliqué dans la partie). */
export async function postComment(gameId: string, content: string): Promise<ActionResult<GameComment>> {
  const trimmed = content.trim()
  if (!trimmed) return { success: false, error: POST_ERRORS.empty }
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('post_comment', { p_game_id: gameId, p_content: trimmed })
    if (error) return { success: false, error: 'Impossible d’envoyer le commentaire.' }
    const res = data as PostResult | null
    if (!res?.ok) {
      return { success: false, error: POST_ERRORS[res?.error ?? ''] ?? 'Impossible de commenter.' }
    }
    return {
      success: true,
      data: { id: res.id!, username: res.username!, content: res.content!, created_at: res.created_at! },
    }
  } catch {
    return { success: false, error: 'Impossible d’envoyer le commentaire.' }
  }
}

/** Commentaires d'une partie (lecture publique). Fail-soft si la table n'existe pas encore. */
export async function getGameComments(gameId: string): Promise<GameComment[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('comments')
      .select('id, username, content, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error || !data) return []
    return data as GameComment[]
  } catch {
    return []
  }
}

/** Le joueur connecté a-t-il le droit de commenter cette partie (a-t-il cliqué) ? */
export async function canComment(gameId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('can_comment', { p_game_id: gameId })
    if (error) return false
    return data === true
  } catch {
    return false
  }
}

/** Feed global des derniers commentaires (lobby) : qui a dit quoi sous quel item. */
export async function getRecentComments(limit = 20): Promise<CommentFeedItem[]> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_recent_comments', { p_limit: limit })
    if (error || !data) return []
    return data as CommentFeedItem[]
  } catch {
    return []
  }
}
