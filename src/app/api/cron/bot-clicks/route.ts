import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { sendWinnerEmail } from '@/lib/email'
import { sendPushToUser } from '@/lib/push'
// M6 — générateur de pseudos partagé (plus de copie locale dupliquée ; aligné
// avec la simulation visuelle frontend qui utilise déjà cette même source).
import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

/**
 * ============================================
 * CRON UNIFIÉ DE GESTION DES JEUX - Cleekzy v13.0
 * ============================================
 *
 * Ce cron gère TOUT le cycle de vie des jeux:
 * 1. Activation des jeux en attente (waiting → active)
 * 2. Simulation de l'activité des bots (mise à jour des leaders)
 * 3. Système de bataille en phase finale (30min à 1h59min)
 * 4. Fin des jeux (timer = 0) et création des records de gagnants
 *
 * Système de bataille:
 * - Phase normale: bots cliquent pour simuler l'activité
 * - Phase finale: bots maintiennent le timer jusqu'à fin de bataille
 * - Bataille terminée sans joueur réel: timer descend à 0
 *
 * Fréquence: 1 cron par minute sur cron-job.org
 * URL: /api/cron/bot-clicks
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET


function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}


interface GameData {
  id: string
  item_id: string
  status: string
  end_time: number
  total_clicks: number
  last_click_username: string | null
  last_click_user_id: string | null
  last_click_at: string | null
  battle_start_time: string | null
  item: { name: string }[] | { name: string } | null
}

// ============================================
// SYSTÈME DE BATAILLE (durée limitée de la phase finale)
// ============================================

const BATTLE_MIN_DURATION = 30 * 60 * 1000  // 30 minutes min
const BATTLE_MAX_DURATION = 119 * 60 * 1000 // 1h59 max

function getBattleDuration(gameId: string): number {
  // Durée déterministe basée sur gameId (30min à 1h59min)
  const hash = hashString(gameId + '-battle')
  return BATTLE_MIN_DURATION + (hash % (BATTLE_MAX_DURATION - BATTLE_MIN_DURATION))
}

function getBattleProgress(gameId: string, battleStartTime: string | null): number {
  if (!battleStartTime) return 0

  const battleStart = new Date(battleStartTime).getTime()
  const elapsed = Date.now() - battleStart
  const totalDuration = getBattleDuration(gameId)

  return Math.min(1, elapsed / totalDuration)
}

function shouldBotClick(gameId: string, battleProgress: number, hasRealPlayer: boolean): boolean {
  // Tant que la bataille n'est pas terminée (< 100%), les bots DOIVENT cliquer
  // pour maintenir le timer et faire durer la bataille 30min à 1h59min

  if (battleProgress < 1) {
    // Bataille en cours - toujours cliquer pour maintenir le timer
    return true
  }

  // Bataille terminée (>= 100%)
  // Continuer seulement si un joueur réel est présent
  return hasRealPlayer
}

function getItemName(item: GameData['item']): string {
  if (Array.isArray(item) && item[0]?.name) return item[0].name
  if (item && typeof item === 'object' && 'name' in item) return item.name
  return 'Unknown'
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = Date.now()
    const nowISO = new Date().toISOString()

    // ============================================
    // ÉTAPE 1: Activer les jeux en attente
    // ============================================
    const { data: gamesToActivate } = await supabase
      .from('games')
      .select('id, item:items(name)')
      .eq('status', 'waiting')
      .lte('start_time', nowISO)

    let activatedCount = 0
    if (gamesToActivate && gamesToActivate.length > 0) {
      const gameIds = gamesToActivate.map(g => g.id)
      const { error: activateError } = await supabase
        .from('games')
        .update({ status: 'active' })
        .in('id', gameIds)

      if (!activateError) {
        activatedCount = gamesToActivate.length
        console.log(`[CRON] Activated ${activatedCount} games`)
      }
    }

    // ============================================
    // ÉTAPE 2: Gérer les jeux actifs
    // ============================================
    // Récupérer les jeux actifs
    const { data: activeGames, error: fetchError } = await supabase
      .from('games')
      .select(`
        id, item_id, status, end_time, total_clicks,
        last_click_username, last_click_user_id, last_click_at, battle_start_time,
        item:items(name)
      `)
      .in('status', ['active', 'final_phase'])

    if (fetchError) {
      console.error('[CRON] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    if (!activeGames || activeGames.length === 0) {
      return NextResponse.json({
        message: activatedCount > 0 ? `Activated ${activatedCount} games, no active games to process` : 'No active games',
        activated: activatedCount,
        processed: 0
      })
    }

    console.log(`[CRON] Checking ${activeGames.length} games`)

    const results: Array<{ gameId: string; action: string }> = []
    // Parties qui basculent en phase finale pendant ce run -> notif "ton favori..." après la boucle.
    const enteredFinalPhase: Array<{ gameId: string; itemName: string }> = []

    for (const game of activeGames as GameData[]) {
      const timeLeft = game.end_time - now

      if (timeLeft <= 0) {
        // Terminer le jeu
        const itemName = getItemName(game.item)
        console.log(`[CRON] Game ${game.id.substring(0, 8)} ended`)

        const ended = await endGame(supabase, game, itemName)
        results.push({
          gameId: game.id,
          action: ended ? 'ended' : 'already_ended'
        })
      } else {
        // Jeu encore actif - simuler l'activité des bots
        const updates: Record<string, unknown> = {}
        let action = `active (${Math.floor(timeLeft / 1000)}s left)`
        const isInFinalPhase = timeLeft <= 90000 // 90s - gives 1 cron cycle to maintain

        // Entrer en phase finale si nécessaire
        if (isInFinalPhase && game.status !== 'final_phase') {
          updates.status = 'final_phase'
          enteredFinalPhase.push({ gameId: game.id, itemName: getItemName(game.item) })
        }

        // Toujours définir battle_start_time si en phase finale et pas encore défini
        if (isInFinalPhase && !game.battle_start_time) {
          updates.battle_start_time = new Date().toISOString()
          console.log(`[CRON] Setting battle_start_time for game ${game.id.substring(0, 8)}`)
        }

        // Calculer la progression de la bataille
        const battleProgress = getBattleProgress(game.id, game.battle_start_time)
        const battleDurationMin = Math.round(getBattleDuration(game.id) / 60000)

        // Logique de clic des bots
        const minuteSeed = Math.floor(now / 60000)
        const botUsername = generateDeterministicUsername(`${game.id}-cron-${minuteSeed}`)
        const hasRealPlayer = !!game.last_click_user_id

        if (isInFinalPhase) {
          // Phase finale - vérifier si les bots doivent encore cliquer
          // shouldBotClick retourne true si joueur réel présent (même après durée max)
          if (shouldBotClick(game.id, battleProgress, hasRealPlayer)) {
            // Tant que la bataille est en cours (< 100%), le bot DOIT cliquer pour maintenir le timer
            // Priorité absolue: maintenir le timer au-dessus de 0

            // Seuil aléatoire FIXE par jeu entre 65-85s pour désynchroniser les clics
            // Gap entre crons = 60s, donc seuil minimum = 65s pour garantir survie du timer
            const clickThresholdSeed = hashString(`${game.id}-click-threshold`)
            const clickThreshold = 65000 + (clickThresholdSeed % 20000) // 65s à 85s par jeu

            if (timeLeft <= clickThreshold) {
              // Timer sous le seuil de ce jeu - bot clique (simule plusieurs bots qui se battent)
              updates.last_click_username = botUsername
              updates.last_click_user_id = null
              // Reset 90s + jitter DÉTERMINISTE par partie (0-30s) : sinon toutes les parties
              // traitées dans le même tick reçoivent le même end_time et leurs fins se regroupent.
              updates.end_time = now + 90000 + (hashString(game.id) % 30000)
              updates.total_clicks = (game.total_clicks || 0) + Math.floor(Math.random() * 5) + 2 // +2 à +6 : bataille intense
              action = `bot_click_final (${botUsername}) SAVED at ${Math.floor(timeLeft/1000)}s! (threshold: ${Math.floor(clickThreshold/1000)}s) [battle: ${Math.round(battleProgress * 100)}%/${battleDurationMin}min]`
            } else {
              // Timer > seuil - laisser descendre
              action = `waiting (threshold: ${Math.floor(clickThreshold/1000)}s) - ${Math.floor(timeLeft/1000)}s left [battle: ${Math.round(battleProgress * 100)}%/${battleDurationMin}min]`
            }
          } else {
            // Bataille terminée ET pas de joueur réel - laisser timer descendre
            action = `battle_ended (${Math.round(battleProgress * 100)}%) - no real player, letting timer run down`
          }
        } else {
          // Phase normale - les bots cliquent comme des vrais joueurs (activité simulée)
          updates.last_click_username = botUsername
          updates.last_click_user_id = null // Bot prend le lead
          updates.total_clicks = (game.total_clicks || 0) + Math.floor(Math.random() * 3) + 1 // +1 à +3
          action = hasRealPlayer
            ? `bot_took_lead (${botUsername}) from ${game.last_click_username}`
            : `bot_click (${botUsername})`
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('games')
            .update(updates)
            .eq('id', game.id)
        }

        // Si un bot a pris le lead ce tick, enregistrer le clic dans `clicks`
        // (alimente le feed live /api/clicks/recent — sinon la table reste vide pour les bots)
        if (updates.last_click_username === botUsername) {
          // sequence_number = MAX+1 (cohérent avec perform_click, pas un compteur fabriqué)
          const { data: maxRow } = await supabase
            .from('clicks')
            .select('sequence_number')
            .eq('game_id', game.id)
            .order('sequence_number', { ascending: false })
            .limit(1)
            .maybeSingle()
          const nextSeq = ((maxRow?.sequence_number as number | null) ?? 0) + 1
          await supabase.from('clicks').insert({
            game_id: game.id,
            user_id: null,
            username: botUsername,
            item_name: getItemName(game.item),
            is_bot: true,
            sequence_number: nextSeq,
            credits_spent: 0,
          })
        }

        // Push « on t'a dépassé » : un bot vient de reprendre le lead à un joueur
        // réel ABSENT. Throttle naturel : on ne détecte l'outbid que si l'ancien
        // leader était réel ; une fois dépassé il n'est plus leader, donc pas de
        // re-push tant qu'il ne reclique pas. Le filtre last_click_at (>90s) évite
        // de notifier un joueur encore actif (qui voit déjà qu'on le dépasse).
        if (
          game.last_click_user_id &&
          updates.last_click_username === botUsername &&
          updates.last_click_user_id === null &&
          game.last_click_at &&
          now - new Date(game.last_click_at).getTime() > 90000
        ) {
          sendPushToUser(game.last_click_user_id, {
            title: 'On vient de te dépasser !',
            body: `Quelqu'un a repris la tête sur ${getItemName(game.item)}. Reviens vite pour reprendre ton clic gagnant.`,
            url: `/game/${game.id}`,
            tag: `outbid-${game.id}`,
          }).catch((err) => console.error('[CRON] Failed to send outbid push:', err))
        }

        results.push({
          gameId: game.id,
          action
        })
      }
    }

    const endedCount = results.filter(r => r.action === 'ended').length

    // Notif « ton favori entre en phase finale » aux joueurs ayant ce jeu en favori.
    let favNotified = 0
    for (const fp of enteredFinalPhase) {
      const { data: favs } = await supabase
        .from('user_favorites')
        .select('user_id')
        .eq('game_id', fp.gameId)
      for (const f of favs ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uid = (f as any).user_id as string
        await sendPushToUser(uid, {
          title: 'Ton favori entre en phase finale !',
          body: `${fp.itemName} : c'est le moment de te battre pour le remporter.`,
          url: `/game/${fp.gameId}`,
          tag: `fav-final-${fp.gameId}`,
        }).catch((err) => console.error('[CRON] Failed to send favorite push:', err))
        favNotified += 1
      }
    }

    return NextResponse.json({
      message: `Activated ${activatedCount}, checked ${results.length} games, ${endedCount} ended`,
      activated: activatedCount,
      processed: results.length,
      ended: endedCount,
      favNotified,
      games: results
    })

  } catch (error) {
    console.error('[CRON] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

async function endGame(
  supabase: SupabaseClient,
  game: GameData,
  itemName: string
): Promise<boolean> {
  // Clôture ATOMIQUE verrouillée (anti-TOCTOU, P1.6) : la RPC revérifie end_time
  // sous FOR UPDATE (le même verrou que perform_click) et renvoie le gagnant
  // autoritaire. closed=false si un clic de dernière seconde a prolongé la partie
  // ou si elle est déjà close -> on n'écrit ni winner ni récompense.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('end_game', { p_game_id: game.id })
  const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as {
    closed: boolean
    out_winner_id: string | null
    out_winner_username: string | null
    out_is_bot: boolean
    out_item_id: string
    out_total_clicks: number
  } | null
  if (rpcError || !row?.closed) {
    return false
  }

  const winnerId = row.out_winner_id || null
  const isBot = row.out_is_bot
  // Si pas de username, générer un pseudo de bot cohérent
  const winnerUsername = row.out_winner_username || generateDeterministicUsername(`${game.id}-winner`)
  const itemId = row.out_item_id || game.item_id
  const totalClicks = row.out_total_clicks ?? game.total_clicks ?? 0

  // Créer le record du gagnant
  let finalUsername = winnerUsername
  let winnerEmail: string | null = null
  if (winnerId) {
    // username vit dans profiles ; l'email vit dans auth.users (pas profiles.email).
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', winnerId)
      .single()
    finalUsername = profile?.username || winnerUsername
    const { data: authUser } = await supabase.auth.admin.getUserById(winnerId)
    winnerEmail = authUser?.user?.email ?? null
  }

  // Récupérer la valeur de l'item
  const { data: itemData } = await supabase
    .from('items')
    .select('retail_value')
    .eq('id', itemId)
    .single()
  const itemValue = itemData?.retail_value || 0

  if (totalClicks > 0 || winnerUsername) {
    await supabase.from('winners').insert({
      game_id: game.id,
      user_id: winnerId,
      username: finalUsername,
      item_id: itemId,
      item_name: itemName,
      item_value: itemValue,
      total_clicks_in_game: totalClicks,
      is_bot: isBot,
    })

    // Incrémenter les wins si joueur réel (incrément ATOMIQUE, donnée permanente)
    if (winnerId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_total_wins', { p_user_id: winnerId })
      // Gamification : +200 XP pour une victoire (progression, n'affecte pas les tirages)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('award_xp', { p_user_id: winnerId, p_amount: 200 })

      // Notification push de victoire (non-bloquant)
      sendPushToUser(winnerId, {
        title: 'Victoire !',
        body: `Tu as remporté ${itemName} (${itemValue}€), bravo !`,
        url: '/profile',
        tag: 'win',
      }).catch((err) => console.error('[CRON] Failed to send winner push:', err))

      // Envoyer l'email de victoire (non-bloquant)
      if (winnerEmail) {
        sendWinnerEmail(winnerEmail, finalUsername, itemName, itemValue).catch((err) => {
          console.error('[CRON] Failed to send winner email:', err)
        })
        console.log(`[CRON] Winner email queued for ${winnerEmail}`)
      }
    }
  }

  // Push « offre de rachat » aux participants réels qui ont perdu (non-bloquant).
  // Pointe vers /profile où la section « Rachat malin » affiche l'offre si éligible.
  // endGame ne s'exécute qu'une fois par partie (garde atomique de statut) -> 1 push/perdant.
  try {
    const { data: participants } = await supabase
      .from('clicks')
      .select('user_id')
      .eq('game_id', game.id)
      .eq('is_bot', false)
      .not('user_id', 'is', null)
    const losers = [
      ...new Set(
        ((participants ?? []) as { user_id: string | null }[])
          .map((r) => r.user_id)
          .filter((id): id is string => !!id && id !== winnerId)
      ),
    ]
    for (const uid of losers) {
      sendPushToUser(uid, {
        title: 'Tu y étais presque !',
        body: `${itemName} t'a échappé de peu — récupère-le à prix réduit avant que l'offre n'expire.`,
        url: '/profile',
        tag: 'buy-it-now-offer',
      }).catch((err) => console.error('[CRON] Failed to send buy-it-now push:', err))
    }
  } catch (e) {
    console.error('[CRON] buy-it-now push error:', e)
  }

  return true
}
