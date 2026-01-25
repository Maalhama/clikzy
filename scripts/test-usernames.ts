#!/usr/bin/env tsx

/**
 * Script de test des pseudos bots
 * Usage: npx tsx scripts/test-usernames.ts
 */

import {
  generateUsername,
  generateDeterministicUsername,
  generateUniqueUsernames,
  ALL_USERNAMES,
} from '../src/lib/bots/usernameGenerator'

console.log('🎮 Test des Pseudos Bots - Cleekzy\n')
console.log('=' .repeat(60))

// Test 1: Nombre total
console.log(`\n📊 Total de pseudos disponibles: ${ALL_USERNAMES.length}`)

// Test 2: Génération aléatoire
console.log('\n🎲 10 pseudos aléatoires:')
for (let i = 0; i < 10; i++) {
  console.log(`  ${i + 1}. ${generateUsername()}`)
}

// Test 3: Génération déterministe
console.log('\n🔒 Pseudos déterministes (toujours les mêmes pour la même seed):')
const seeds = ['game-123', 'game-456', 'game-789']
seeds.forEach((seed) => {
  console.log(`  ${seed} → ${generateDeterministicUsername(seed)}`)
  // Vérifier que c'est vraiment déterministe
  const second = generateDeterministicUsername(seed)
  if (generateDeterministicUsername(seed) !== second) {
    console.error('  ❌ ERREUR: Non déterministe!')
  }
})

// Test 4: Distribution par style
console.log('\n📈 Exemples par style:')

const styles = {
  'Gaming Hardcore': ALL_USERNAMES.filter(u => u.includes('xX') || u.includes('_')).slice(0, 5),
  'Streamers': ALL_USERNAMES.filter(u => u.includes('.ttv') || u.includes('.yt')).slice(0, 5),
  'Instagram/TikTok': ALL_USERNAMES.filter(u => u.includes('.off') || u.includes('.ofc')).slice(0, 5),
  'Français avec Année': ALL_USERNAMES.filter(u => /\d{2,4}$/.test(u)).slice(0, 5),
  'Départements': ALL_USERNAMES.filter(u => /_\d{2}$/.test(u)).slice(0, 5),
  'Maghreb': ALL_USERNAMES.filter(u => u.includes('.dz') || u.includes('.ma') || u.includes('.tn')).slice(0, 5),
  'International': ALL_USERNAMES.filter(u => u.includes('.uk') || u.includes('.de') || u.includes('.es')).slice(0, 5),
}

Object.entries(styles).forEach(([style, usernames]) => {
  if (usernames.length > 0) {
    console.log(`\n  ${style}:`)
    usernames.forEach(u => console.log(`    • ${u}`))
  }
})

// Test 5: Unicité
console.log('\n✅ Test d\'unicité:')
const uniqueSet = new Set(ALL_USERNAMES)
if (uniqueSet.size === ALL_USERNAMES.length) {
  console.log(`  ✓ Tous les ${ALL_USERNAMES.length} pseudos sont uniques`)
} else {
  console.log(`  ❌ ERREUR: ${ALL_USERNAMES.length - uniqueSet.size} doublons détectés`)
  // Trouver les doublons
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  ALL_USERNAMES.forEach(u => {
    if (seen.has(u)) duplicates.add(u)
    seen.add(u)
  })
  console.log(`  Doublons: ${Array.from(duplicates).join(', ')}`)
}

// Test 6: Distribution avec le système de hash (simulation 1 heure)
console.log('\n⏱️  Simulation 1 heure (60 minutes, 60 pseudos):')
const gameId = 'test-game-123'
const simulatedUsernames = []
for (let minute = 0; minute < 60; minute++) {
  const seed = `${gameId}-cron-${minute}`
  simulatedUsernames.push(generateDeterministicUsername(seed))
}

const uniqueInHour = new Set(simulatedUsernames)
console.log(`  • Pseudos uniques sur 1h: ${uniqueInHour.size}/60`)
console.log(`  • Échantillon (10 premiers):`)
simulatedUsernames.slice(0, 10).forEach((u, i) => {
  console.log(`    ${i + 1}min: ${u}`)
})

// Test 7: Longueurs
console.log('\n📏 Analyse des longueurs:')
const lengths = ALL_USERNAMES.map(u => u.length)
const minLength = Math.min(...lengths)
const maxLength = Math.max(...lengths)
const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length

console.log(`  • Plus court: ${minLength} caractères (${ALL_USERNAMES.find(u => u.length === minLength)})`)
console.log(`  • Plus long: ${maxLength} caractères (${ALL_USERNAMES.find(u => u.length === maxLength)})`)
console.log(`  • Moyenne: ${avgLength.toFixed(1)} caractères`)

// Test 8: Caractères spéciaux
console.log('\n🔤 Caractères utilisés:')
const hasUnderscore = ALL_USERNAMES.filter(u => u.includes('_')).length
const hasDot = ALL_USERNAMES.filter(u => u.includes('.')).length
const hasNumber = ALL_USERNAMES.filter(u => /\d/.test(u)).length
const hasUppercase = ALL_USERNAMES.filter(u => /[A-Z]/.test(u)).length

console.log(`  • Avec underscore (_): ${hasUnderscore} (${(hasUnderscore / ALL_USERNAMES.length * 100).toFixed(1)}%)`)
console.log(`  • Avec point (.): ${hasDot} (${(hasDot / ALL_USERNAMES.length * 100).toFixed(1)}%)`)
console.log(`  • Avec chiffres: ${hasNumber} (${(hasNumber / ALL_USERNAMES.length * 100).toFixed(1)}%)`)
console.log(`  • Avec majuscules: ${hasUppercase} (${(hasUppercase / ALL_USERNAMES.length * 100).toFixed(1)}%)`)

console.log('\n' + '='.repeat(60))
console.log('✅ Tests terminés!\n')
