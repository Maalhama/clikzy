import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * ============================================
 * CRON UNIFIÉ DE GESTION DES JEUX - Clikzy v13.0
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

// ============================================
// GÉNÉRATEUR DE PSEUDOS DÉTERMINISTE
// (Réplique de src/lib/bots/usernameGenerator.ts)
// ============================================

// Pseudos réalistes inspirés des réseaux sociaux (Instagram, TikTok, gaming)
// Synchronisé avec src/lib/bots/usernameGenerator.ts
const REALISTIC_USERNAMES = [
  // Style simple (prénom + chiffres)
  'music.emma', 'music.lucas', 'music.theo', 'vibes.hugo', 'music.lea',
  'lena.music', 'music.maxime', 'clara.music', 'tom.music', 'julie.music',
  // Style année de naissance
  'emma2004', 'lucas2003', 'theo2005', 'hugo99', 'lea2002', 'nathan01',
  'chloe2004', 'enzo2003', 'manon2001', 'jade2005', 'louis2000', 'sarah03',
  'clara2002', 'tom2004', 'julie2001', 'marie2003', 'paul2000', 'leo2005',
  // Style gamer/pseudo court
  'emm4', 'lcs_', 'th3o', 'hug0', 'l3a_', 'nath_', 'enz0_', 'mxm',
  'clra', 'jde_', 'srh_', 'lna_', 'ryn_', 'adm_', 'tom_', 'julz',
  // Style underscore
  '_emma', '_lucas', '_theo', '_hugo', '_lea', '_nathan', '_enzo',
  'emma_', 'lucas_', 'theo_', 'hugo_', 'lea_', 'nathan_', 'enzo_',
  '_clara', '_tom', '_julie', '_marie', '_paul', '_leo', '_lena',
  // Style point
  'em.ma', 'lu.cas', 'the.o', 'hu.go', 'le.a', 'na.than', 'en.zo',
  'cl.ara', 'to.m', 'ju.lie', 'ma.rie', 'pa.ul', 'le.o', 'le.na',
  // Prénoms maghrébins réalistes
  'ryanbzh', 'adam.dz', 'yasmine.fr', 'nour_75', 'lina.93', 'sara_92',
  'mehdi_77', 'amine.94', 'karim_95', 'youssef.dz', 'nadia_31', 'amina.ma',
  'rayan.fr', 'sofiane_', 'walid.93', 'bilal_75', 'hamza.dz', 'ismail_',
  // Prénoms africains réalistes
  'moussa_sn', 'ibra_221', 'mamadou.sn', 'fatou_', 'awa.221', 'ousmane_',
  'seydou.sn', 'cheikh_', 'modou.221', 'pape_sn', 'aliou_', 'demba.sn',
  // Style lettres doublées
  'emmaa', 'lucass', 'theoo', 'hugoo', 'leaa', 'nathann', 'enzoo',
  'claraa', 'tomm', 'juliee', 'mariee', 'paull', 'leoo', 'lenaa',
  // Style chiffre au milieu
  'em4a', 'luc4s', 'the0', 'hug0o', 'le4', 'n4than', 'enz0o',
  'cl4ra', 't0m', 'jul1e', 'm4rie', 'p4ul', 'l3o', 'l3na',
  // Style x devant
  'xemma', 'xlucas', 'xtheo', 'xhugo', 'xlea', 'xnathan', 'xenzo',
  'xclara', 'xtom', 'xjulie', 'xmarie', 'xpaul', 'xleo', 'xlena',
  // Mix réaliste varié
  'music.mxm', 'music_tom', 'jade_vibes', 'vibes.clara',
  'chloe.music', 'sarah_music', 'laura_music', 'marie.music', 'zoey_',
  'music.paul', 'leo.vibes', 'lena.music', 'tom.vibes', 'julie_vibes',
  // Pseudos courts populaires
  'lcs', 'thm', 'hgo', 'ntn', 'enz', 'mxm', 'clr', 'jde', 'srh', 'lna',
  'emm', 'tom', 'leo', 'pul', 'mre', 'jul', 'ryn', 'adm', 'sfn', 'wld',
  // Style TikTok/Insta
  'real.nathan', 'just.enzo', 'its.maxime', 'hey.clara', 'the.jade',
  'real.emma', 'just.lucas', 'its.theo', 'hey.hugo', 'the.lea',
  'just.tom', 'its.julie', 'hey.marie', 'the.paul', 'real.leo',
  // Style ibérique
  'pablo.es', 'diego_', 'carlos.es', 'miguel_', 'maria.es', 'carmen_',
  'lucia.es', 'ana_', 'sofia.es', 'elena_', 'marta.es', 'alba_',
  // Style gaming
  'dark.emma', 'ice.lucas', 'fire.theo', 'shadow.hugo', 'light.lea',
  'storm.nathan', 'frost.enzo', 'blaze.tom', 'nova.clara', 'venom.paul',

  // ========== 100 NOUVEAUX PSEUDOS ==========

  // Style Discord/Gaming moderne
  'zKenzo', 'xMatis', 'iLouna', 'oRaphael', 'zAya', 'xKillian', 'iMaelys',
  'NotLiam', 'NotMila', 'ImAxel', 'ImZoe', 'itzGabin', 'itzLola',
  // Style TikTok français
  'camille.off', 'arthur.ofc', 'oceane.ttv', 'mathis.live', 'romane.vlog',
  'jules.daily', 'alice.snap', 'ethan.gram', 'celia.tkt', 'nolan.yt',
  // Style numéro département
  'alex_13', 'marine_69', 'kevin_59', 'laura_33', 'dylan_44', 'melissa_06',
  'jordan_31', 'anais_34', 'florian_67', 'oceane_35', 'bastien_38', 'eva_83',
  // Style prénom rare français
  'titouan_', 'garance.fr', 'apolline_', 'marius.off', 'celestin_', 'capucine.music',
  'augustin_', 'victorine.fr', 'leandre_', 'ambroise.off', 'clementine_', 'elouan.bzh',
  // Style Belgique/Suisse
  'maxence.be', 'eloise_ch', 'baptiste.be', 'agathe_ch', 'corentin.be', 'margaux_ch',
  'thibault.be', 'justine_ch', 'quentin.be', 'clemence_ch', 'valentin.be', 'amelie_ch',
  // Style Quebec
  'alexis.qc', 'laurie_mtl', 'gabriel.qc', 'audrey_514', 'olivier.qc', 'maude_mtl',
  'philippe.qc', 'karine_418', 'simon.qc', 'melanie_qc', 'mathieu.mtl', 'catherine_qc',
  // Style Maghreb étendu
  'sami_dz', 'amira.ma', 'yacine_tn', 'salma.dz', 'anis_ma', 'ines.tn',
  'zakaria_dz', 'asma.ma', 'oussama_tn', 'meryem.dz', 'aymen_ma', 'chaima.tn',
  // Style Afrique de l'Ouest étendu
  'abdou_ml', 'mariam.ci', 'amadou_bf', 'aissatou.gn', 'boubacar_ne', 'kadiatou.sn',
  'souleymane_ml', 'fatoumata.ci', 'lamine_bf', 'mariama.gn', 'diallo_ne', 'binta.sn',
  // Style lettres répétées moderne
  'axeel_', 'noaah', 'liaam_', 'maellee', 'evaaa_', 'louiss',
  'huugo', 'inees_', 'yaann', 'louuise', 'raphhael', 'cloee_',
  // Style minimaliste
  'mths', 'cml', 'jls', 'mrn', 'ncls', 'vltn', 'rmn', 'pln', 'clt', 'fbn',
  // Style emoji/symbole (sans emoji)
  'la.vie.en.rose', 'petit.soleil', 'coeur.de.lion', 'etoile.filante', 'fleur.de.lys',
  // Style anglicisme français
  'french.boy', 'paris.girl', 'lyon.vibes', 'marseille.life', 'nice.mood',
  'bordeaux.style', 'toulouse.gang', 'nantes.crew', 'lille.spirit', 'strasbourg.kid',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function generateDeterministicUsername(seed: string): string {
  const hash = hashString(seed)
  return REALISTIC_USERNAMES[hash % REALISTIC_USERNAMES.length]
}

interface GameData {
  id: string
  item_id: string
  status: string
  end_time: number
  total_clicks: number
  last_click_username: string | null
  last_click_user_id: string | null
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
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
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
        last_click_username, last_click_user_id, battle_start_time,
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
              // Timer sous le seuil de ce jeu - bot clique
              updates.last_click_username = botUsername
              updates.last_click_user_id = null
              updates.end_time = now + 90000 // Reset à 90s
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
          // Phase normale - les bots cliquent comme des vrais joueurs
          updates.last_click_username = botUsername
          updates.last_click_user_id = null // Bot prend le lead
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

        results.push({
          gameId: game.id,
          action
        })
      }
    }

    const endedCount = results.filter(r => r.action === 'ended').length

    return NextResponse.json({
      message: `Activated ${activatedCount}, checked ${results.length} games, ${endedCount} ended`,
      activated: activatedCount,
      processed: results.length,
      ended: endedCount,
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
  const winnerId = game.last_click_user_id || null
  const winnerUsername = game.last_click_username || 'Bot'
  const isBot = !winnerId

  // Update avec protection contre les race conditions
  const { data: updateResult } = await supabase
    .from('games')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      winner_id: winnerId,
    })
    .eq('id', game.id)
    .in('status', ['active', 'final_phase'])
    .select('id')

  if (!updateResult || updateResult.length === 0) {
    return false
  }

  // Créer le record du gagnant
  let finalUsername = winnerUsername
  if (winnerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', winnerId)
      .single()
    finalUsername = profile?.username || winnerUsername
  }

  // Récupérer la valeur de l'item
  const { data: itemData } = await supabase
    .from('items')
    .select('retail_value')
    .eq('id', game.item_id)
    .single()
  const itemValue = itemData?.retail_value || 0

  if (game.total_clicks > 0 || winnerUsername) {
    await supabase.from('winners').insert({
      game_id: game.id,
      user_id: winnerId,
      username: finalUsername,
      item_id: game.item_id,
      item_name: itemName,
      item_value: itemValue,
      total_clicks_in_game: game.total_clicks || 0,
      is_bot: isBot,
    })

    // Incrémenter les wins si joueur réel
    if (winnerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_wins')
        .eq('id', winnerId)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_wins: (profile.total_wins ?? 0) + 1 })
          .eq('id', winnerId)
      }
    }
  }

  return true
}
