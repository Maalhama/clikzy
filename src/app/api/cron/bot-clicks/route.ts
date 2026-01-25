import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { sendWinnerEmail } from '@/lib/email'

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

// ============================================
// GÉNÉRATEUR DE PSEUDOS DÉTERMINISTE
// (Réplique de src/lib/bots/usernameGenerator.ts)
// ============================================

// 300 pseudos réalistes ultra-variés
// Synchronisé avec src/lib/bots/usernameGenerator.ts
const REALISTIC_USERNAMES = [
  // === Gaming/Twitch Style (40 pseudos) ===
  'xXDarkKnightXx', 'ProGamerHD', 'NinjaStyle_', 'ShadowHunter99', 'IceWolf42',
  'FireDragon88', 'ThunderStrike_', 'BlazeFury', 'NightRaven_', 'StormBreaker_',
  'GhostRider_92', 'SilentKiller_', 'RapidFire_88', 'DeadShot99', 'WarMachine_',
  'IronFist_77', 'TitanSlayer', 'NoMercy_', 'LegendKiller_', 'BeastMode99',
  'xXSniperXx', 'ProPlayer_94', 'EliteGamer_', 'xXAceXx', 'MasterChief_',
  'Headhunter_', 'Quickscope_', 'FragMaster_', 'xXViperXx', 'GodMode_88',
  'xXPhantomXx', 'Destroyeur_', 'xXReaperXx', 'KillerInstinct_', 'xXBladeXx',
  'SoloKing_', 'CrownVictor_', 'xXJokerXx', 'WildCard_99', 'xXToxicXx',

  // === Twitch/YouTube Streamers Style (30 pseudos) ===
  'lucas.ttv', 'emma.yt', 'maxime.live', 'lea.stream', 'theo.tv',
  'sarah_ttv', 'kevin.twitch', 'marie.yt', 'nathan_live', 'chloe.tv',
  'hugo.ttv', 'julie_stream', 'tom.yt', 'clara.live', 'paul_ttv',
  'lena.twitch', 'enzo.yt', 'jade_tv', 'louis.stream', 'manon.ttv',
  'arthur.yt', 'oceane_ttv', 'ethan.live', 'camille.tv', 'nolan_stream',
  'mathis.ttv', 'alice.yt', 'romane_live', 'jules.tv', 'celia_ttv',

  // === Instagram/TikTok Influencers Style (40 pseudos) ===
  'emma.off', 'lucas.ofc', 'theo.official', 'lea.daily', 'maxime.gram',
  'sarah_off', 'hugo.snap', 'chloe.insta', 'nathan.vlog', 'marie_daily',
  'tom.off', 'julie.vibes', 'paul.mood', 'clara_gram', 'leo.pic',
  'just.emma', 'its.lucas', 'real.theo', 'hey.lea', 'the.maxime',
  'just.sarah', 'its.hugo', 'real.chloe', 'hey.nathan', 'the.marie',
  'only.tom', 'just.julie', 'its.paul', 'real.clara', 'hey.leo',
  'vibes.emma', 'mood.lucas', 'vibes.theo', 'mood.lea', 'vibes.max',
  'aesthetic.sarah', 'vibe.hugo', 'mood.chloe', 'vibes.nathan', 'aesthetic.marie',

  // === Années de Naissance (35 pseudos) ===
  'emma2004', 'lucas2003', 'theo2005', 'lea2002', 'maxime2004',
  'sarah2003', 'hugo2005', 'chloe2002', 'nathan2001', 'marie2004',
  'tom2003', 'julie2005', 'paul2002', 'clara2001', 'leo2004',
  'lena2003', 'enzo2005', 'jade2002', 'louis2001', 'manon2000',
  'arthur99', 'oceane00', 'ethan01', 'camille02', 'nolan03',
  'mathis04', 'alice05', 'romane00', 'jules01', 'celia02',
  'bastien03', 'eva04', 'gabin05', 'lola00', 'gabriel01',

  // === Numéros Départements France (30 pseudos) ===
  'alex_75', 'marine_69', 'kevin_13', 'laura_33', 'dylan_59',
  'melissa_31', 'jordan_44', 'anais_06', 'florian_67', 'oceane_35',
  'bastien_38', 'eva_83', 'lucas_92', 'emma_93', 'theo_94',
  'lea_77', 'maxime_78', 'sarah_95', 'hugo_91', 'chloe_76',
  'nathan_34', 'marie_54', 'tom_29', 'julie_56', 'paul_22',
  'clara_14', 'leo_17', 'lena_85', 'enzo_86', 'jade_49',

  // === Style Underscore/Point (35 pseudos) ===
  '_emma', '_lucas', '_theo', '_lea', '_maxime',
  'emma_', 'lucas_', 'theo_', 'lea_', 'maxime_',
  '_sarah_', '_hugo_', '_chloe_', '_nathan_', '_marie_',
  'em.ma', 'lu.cas', 'the.o', 'le.a', 'max.ime',
  'sa.rah', 'hu.go', 'chlo.e', 'na.than', 'ma.rie',
  'tom.', 'julie.', 'paul.', 'clara.', 'leo.',
  '.lena', '.enzo', '.jade', '.louis', '.manon',

  // === Style Lettres Répétées/Modifiées (30 pseudos) ===
  'emmaa', 'lucass', 'theoo', 'leaa', 'maximee',
  'sarahh', 'hugoo', 'chloee', 'nathann', 'mariee',
  'tomm', 'juliee', 'paull', 'claraa', 'leoo',
  'em4a', 'luc4s', 'the0', 'le4', 'maxim3',
  's4rah', 'hug0', 'chl0e', 'n4than', 'm4rie',
  't0m', 'jul1e', 'p4ul', 'cl4ra', 'l3o',

  // === Style Minimaliste/Court (25 pseudos) ===
  'emm', 'lcs', 'thm', 'lea', 'mxm',
  'srh', 'hgo', 'chl', 'ntn', 'mre',
  'tom', 'jul', 'pul', 'clr', 'leo',
  'lna', 'enz', 'jde', 'lus', 'mnn',
  'art', 'ocn', 'eth', 'cml', 'nln',

  // === Style x/z Préfixe Gaming (25 pseudos) ===
  'xemma', 'xlucas', 'xtheo', 'xlea', 'xmax',
  'zsarah', 'zhugo', 'xchloe', 'znathan', 'xmarie',
  'xtom', 'zjulie', 'xpaul', 'zclara', 'xleo',
  'zlena', 'xenzo', 'zjade', 'xlouis', 'zmanon',
  'xarthur', 'zoceane', 'xethan', 'zcamille', 'xnolan',

  // === Style Discord (30 pseudos) ===
  'NotEmma', 'NotLucas', 'NotTheo', 'NotLea', 'NotMax',
  'ImSarah', 'ImHugo', 'ImChloe', 'ImNathan', 'ImMarie',
  'itzTom', 'itzJulie', 'itzPaul', 'itzClara', 'itzLeo',
  'iLena', 'iEnzo', 'iJade', 'iLouis', 'iManon',
  'oArthur', 'oOceane', 'oEthan', 'oCamille', 'oNolan',
  'zKenzo', 'zAya', 'zGabin', 'zLola', 'zRaphael',

  // === Prénoms Français Rares (25 pseudos) ===
  'titouan_', 'garance.fr', 'apolline_', 'marius.off', 'celestin_',
  'capucine.music', 'augustin_', 'victorine.fr', 'leandre_', 'ambroise.off',
  'clementine_', 'elouan.bzh', 'agathe_', 'baptiste.off', 'margaux_',
  'corentin.fr', 'eloise_', 'quentin.off', 'clemence_', 'thibault.fr',
  'valentin_', 'justine.off', 'maxence_', 'amelie.fr', 'axelle_',

  // === Belgique/Suisse/Luxembourg (20 pseudos) ===
  'maxence.be', 'eloise.ch', 'baptiste.be', 'agathe.ch', 'corentin.be',
  'margaux.ch', 'thibault.be', 'justine.ch', 'quentin.be', 'clemence.ch',
  'valentin.be', 'amelie.ch', 'laurent.lu', 'sophie.be', 'nicolas.ch',
  'marie.lu', 'pierre.be', 'anne.ch', 'francois.be', 'julie.lu',

  // === Quebec/Canada (20 pseudos) ===
  'alexis.qc', 'laurie_mtl', 'gabriel.qc', 'audrey_514', 'olivier.qc',
  'maude_mtl', 'philippe.qc', 'karine_418', 'simon.qc', 'melanie_qc',
  'mathieu.mtl', 'catherine_qc', 'marc_514', 'isabelle.qc', 'daniel_mtl',
  'julie_qc', 'patrick.mtl', 'nathalie_514', 'francois.qc', 'veronique_mtl',

  // === Maghreb (Maroc, Algérie, Tunisie) (30 pseudos) ===
  'adam.dz', 'yasmine.ma', 'mehdi.tn', 'lina.dz', 'amine.ma',
  'nour.tn', 'karim.dz', 'sara.ma', 'youssef.tn', 'amina.dz',
  'sami.ma', 'ines.tn', 'hamza.dz', 'salma.ma', 'aymen.tn',
  'rayan_dz', 'amira_ma', 'yacine_tn', 'nadia_dz', 'anis_ma',
  'chaima_tn', 'bilal_dz', 'meryem_ma', 'oussama_tn', 'ismail_dz',
  'asma_ma', 'zakaria_tn', 'sofiane_dz', 'walid_ma', 'ryanbzh',

  // === Afrique de l'Ouest (Sénégal, Mali, Côte d'Ivoire) (25 pseudos) ===
  'moussa_sn', 'fatou_ml', 'mamadou.ci', 'awa_sn', 'ibrahima_ml',
  'mariam.ci', 'ousmane_sn', 'kadiatou_ml', 'amadou.ci', 'aissatou_sn',
  'boubacar_ml', 'binta.ci', 'seydou_sn', 'fatoumata_ml', 'lamine.ci',
  'mariama_sn', 'souleymane_ml', 'diallo.ci', 'aliou_sn', 'cheikh_ml',
  'modou.ci', 'pape_sn', 'abdou_ml', 'ibra_221', 'demba.sn',

  // === Espagne/Portugal (20 pseudos) ===
  'pablo.es', 'maria.pt', 'diego.es', 'ana.pt', 'carlos.es',
  'sofia.pt', 'miguel.es', 'lucia.pt', 'javier.es', 'ines.pt',
  'antonio.es', 'beatriz.pt', 'rafael.es', 'catarina.pt', 'manuel.es',
  'mariana.pt', 'fernando.es', 'joana.pt', 'alberto.es', 'rita.pt',

  // === Italie/Grèce (15 pseudos) ===
  'lorenzo.it', 'giulia.gr', 'matteo.it', 'maria.gr', 'alessandro.it',
  'sofia.gr', 'francesco.it', 'elena.gr', 'marco.it', 'anna.gr',
  'luca.it', 'christina.gr', 'andrea.it', 'dimitri.gr', 'giovanni.it',

  // === Style Aesthetic/Vibes (20 pseudos) ===
  'sunset.vibes', 'moon.child', 'star.dust', 'ocean.waves', 'night.sky',
  'golden.hour', 'soft.aesthetic', 'dark.mood', 'light.energy', 'pure.vibes',
  'cool.breeze', 'warm.soul', 'free.spirit', 'wild.heart', 'gentle.mind',
  'calm.waters', 'bright.days', 'quiet.nights', 'loud.dreams', 'sweet.life',

  // === Style Gaming Pro (15 pseudos) ===
  'ProMax_', 'EliteSniper_', 'TopFragger_', 'KingSlayer_', 'BossRush_',
  'MegaKill_', 'UltraRare_', 'SuperStar_', 'HyperActive_', 'TurboMode_',
  'NitroBoost_', 'PowerUp_', 'LevelMax_', 'RankOne_', 'ChampMode_',

  // === Mix International Réaliste (15 pseudos) ===
  'alex.uk', 'sophie.de', 'max.nl', 'lisa.se', 'tim.dk',
  'emma.no', 'john.us', 'kate.au', 'mike.nz', 'anna.fi',
  'tom.ie', 'lucy.ca', 'ben.za', 'mia.br', 'leo.ar',
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
  const isBot = !winnerId
  // Si pas de username, générer un pseudo de bot cohérent
  const winnerUsername = game.last_click_username || generateDeterministicUsername(`${game.id}-winner`)

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
  let winnerEmail: string | null = null
  if (winnerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', winnerId)
      .single()
    finalUsername = profile?.username || winnerUsername
    winnerEmail = profile?.email || null
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

      // Envoyer l'email de victoire (non-bloquant)
      if (winnerEmail) {
        sendWinnerEmail(winnerEmail, finalUsername, itemName, itemValue).catch((err) => {
          console.error('[CRON] Failed to send winner email:', err)
        })
        console.log(`[CRON] Winner email queued for ${winnerEmail}`)
      }
    }
  }

  return true
}
