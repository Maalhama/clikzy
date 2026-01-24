/**
 * Script pour créer un jeu de test avec un produit spécifique
 * Usage: npx tsx scripts/create-test-game.ts "iPhone 17 Pro Max"
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestGame(productName: string) {
  // 1. Trouver le produit
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .ilike('name', `%${productName}%`)
    .single()

  if (itemError || !item) {
    console.error('Produit non trouvé:', productName)
    console.error(itemError)
    process.exit(1)
  }

  console.log('✅ Produit trouvé:', item.name, '-', item.retail_value, '€')

  // 2. Calculer les horaires (début dans 1 minute, fin dans 5 minutes)
  const now = Date.now()
  const startTime = new Date(now + 1 * 60 * 1000) // +1 min
  const endTimeMs = now + 5 * 60 * 1000           // +5 min (en millisecondes)

  // 3. Créer le jeu
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      item_id: item.id,
      status: 'waiting',
      start_time: startTime.toISOString(),
      end_time: endTimeMs, // BIGINT en millisecondes
      total_clicks: 0,
    })
    .select()
    .single()

  if (gameError) {
    console.error('Erreur création jeu:', gameError)
    process.exit(1)
  }

  console.log('✅ Jeu créé!')
  console.log('   ID:', game.id)
  console.log('   Début:', startTime.toLocaleTimeString('fr-FR'))
  console.log('   Fin:', new Date(endTimeMs).toLocaleTimeString('fr-FR'))
  console.log('\n🎮 Va sur le lobby pour voir le rendu!')
}

const productName = process.argv[2] || 'iPhone 17 Pro Max'
createTestGame(productName)
