#!/usr/bin/env node
/**
 * Script pour créer les jeux d'une rotation
 *
 * Usage:
 *   node scripts/create-rotation.js           # Crée pour la prochaine rotation
 *   node scripts/create-rotation.js --now     # Crée et active immédiatement
 *   node scripts/create-rotation.js --hour 15 # Crée pour la rotation de 15h
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuration
const ROTATION_HOURS = [0, 3, 6, 9, 12, 15, 18, 21]
const TIMEZONE = 'Europe/Paris'
const DEFAULT_GAME_DURATION = 1 * 60 * 60 * 1000 // 1 heure
const GAMES_PER_ROTATION = 18 // Nombre de jeux par rotation (2 pages de 9)

// Parse arguments
const args = process.argv.slice(2)
const isNow = args.includes('--now')
const hourIndex = args.indexOf('--hour')
const specificHour = hourIndex !== -1 ? parseInt(args[hourIndex + 1], 10) : null

/**
 * Obtient le décalage horaire de Paris
 */
function getParisOffset(date) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const parisDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return parisDate.getTime() - utcDate.getTime()
}

/**
 * Calcule le start_time pour une rotation
 */
function getRotationStartTime(hour, forToday = true) {
  const now = new Date()
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))

  const rotationTime = new Date(parisTime)
  rotationTime.setHours(hour, 0, 0, 0)

  // Si l'heure est passée et qu'on veut aujourd'hui, prendre demain
  if (!forToday || parisTime.getHours() > hour || (parisTime.getHours() === hour && parisTime.getMinutes() > 0)) {
    rotationTime.setDate(rotationTime.getDate() + 1)
  }

  // Convertir en UTC
  const parisOffset = getParisOffset(rotationTime)
  return new Date(rotationTime.getTime() - parisOffset)
}

/**
 * Calcule la prochaine rotation
 */
function getNextRotation() {
  const now = new Date()
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const currentHour = parisTime.getHours()

  // Trouver la prochaine heure de rotation
  let nextHour = ROTATION_HOURS.find(h => h > currentHour)

  if (nextHour === undefined) {
    nextHour = ROTATION_HOURS[0] // Demain
  }

  return { hour: nextHour, startTime: getRotationStartTime(nextHour) }
}

async function createRotation() {
  console.log('🎮 Création d\'une rotation de jeux\n')

  // Déterminer le start_time
  let startTime
  let targetHour

  if (isNow) {
    startTime = new Date()
    targetHour = new Date().getHours()
    console.log('⚡ Mode immédiat: les jeux seront actifs immédiatement')
  } else if (specificHour !== null) {
    if (!ROTATION_HOURS.includes(specificHour)) {
      console.error(`❌ Heure invalide: ${specificHour}. Heures valides: ${ROTATION_HOURS.join(', ')}`)
      process.exit(1)
    }
    startTime = getRotationStartTime(specificHour)
    targetHour = specificHour
    console.log(`🕐 Rotation programmée pour ${specificHour}:00 (Paris)`)
  } else {
    const next = getNextRotation()
    startTime = next.startTime
    targetHour = next.hour
    console.log(`🕐 Prochaine rotation: ${targetHour}:00 (Paris)`)
  }

  console.log(`📅 Start time: ${startTime.toISOString()}`)
  console.log(`📅 Start time (Paris): ${startTime.toLocaleString('fr-FR', { timeZone: TIMEZONE })}`)

  // Calculer end_time (3h après start_time)
  const endTime = startTime.getTime() + DEFAULT_GAME_DURATION

  // Récupérer des items aléatoires qui n'ont pas de jeu actif
  const { data: availableItems, error: itemsError } = await supabase
    .from('items')
    .select('id, name')
    .limit(50)

  if (itemsError) {
    console.error('❌ Erreur lors de la récupération des items:', itemsError)
    process.exit(1)
  }

  if (!availableItems || availableItems.length === 0) {
    console.error('❌ Aucun item disponible')
    process.exit(1)
  }

  // Vérifier les items qui ont déjà un jeu actif ou en attente
  const { data: existingGames } = await supabase
    .from('games')
    .select('item_id')
    .in('status', ['waiting', 'active', 'final_phase'])

  const usedItemIds = new Set((existingGames || []).map(g => g.item_id))
  const freeItems = availableItems.filter(item => !usedItemIds.has(item.id))

  if (freeItems.length === 0) {
    console.error('❌ Tous les items ont déjà un jeu actif')
    process.exit(1)
  }

  // Sélectionner aléatoirement des items
  const shuffled = freeItems.sort(() => Math.random() - 0.5)
  const selectedItems = shuffled.slice(0, Math.min(GAMES_PER_ROTATION, shuffled.length))

  console.log(`\n📦 Création de ${selectedItems.length} jeux:\n`)

  // Créer les jeux
  const games = selectedItems.map(item => ({
    item_id: item.id,
    status: isNow ? 'active' : 'waiting',
    start_time: startTime.toISOString(),
    end_time: endTime,
    initial_duration: DEFAULT_GAME_DURATION,
    total_clicks: 0,
  }))

  const { data: createdGames, error: createError } = await supabase
    .from('games')
    .insert(games)
    .select('id, item:items(name), status, start_time')

  if (createError) {
    console.error('❌ Erreur lors de la création des jeux:', createError)
    process.exit(1)
  }

  // Afficher les résultats
  createdGames.forEach(game => {
    const status = game.status === 'active' ? '🟢 ACTIF' : '🟡 EN ATTENTE'
    console.log(`${status} ${game.item?.name}`)
  })

  console.log(`\n✅ ${createdGames.length} jeux créés avec succès!`)

  if (!isNow) {
    const timeUntilStart = startTime.getTime() - Date.now()
    const minutes = Math.round(timeUntilStart / 60000)
    console.log(`⏰ Les jeux seront actifs dans ${minutes} minutes`)
  }
}

createRotation()
