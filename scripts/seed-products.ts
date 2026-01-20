import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Products to seed
const products = [
  { name: 'iPhone 15 Pro Max', description: 'Le smartphone ultime d\'Apple avec puce A17 Pro', retail_value: 1479 },
  { name: 'PlayStation 5', description: 'Console next-gen avec SSD ultra-rapide', retail_value: 549 },
  { name: 'MacBook Pro 14"', description: 'Puissance M3 Pro pour les creatifs', retail_value: 2499 },
  { name: 'AirPods Pro 2', description: 'Audio spatial et reduction de bruit active', retail_value: 279 },
  { name: 'Apple Watch Ultra 2', description: 'La montre la plus robuste d\'Apple', retail_value: 899 },
  { name: 'iPad Pro 12.9"', description: 'Tablette pro avec puce M2', retail_value: 1449 },
  { name: 'Nintendo Switch OLED', description: 'Console hybride avec ecran OLED 7 pouces', retail_value: 349 },
  { name: 'Xbox Series X', description: '12 teraflops de puissance gaming', retail_value: 499 },
  { name: 'Samsung Galaxy S24 Ultra', description: 'Smartphone Android premium avec S Pen', retail_value: 1469 },
  { name: 'Dyson V15 Detect', description: 'Aspirateur sans fil avec laser', retail_value: 699 },
  { name: 'DJI Mini 4 Pro', description: 'Drone compact 4K avec evitement d\'obstacles', retail_value: 999 },
  { name: 'GoPro Hero 12', description: 'Camera d\'action 5.3K stabilisee', retail_value: 449 },
  { name: 'Sony WH-1000XM5', description: 'Casque audio haut de gamme avec ANC', retail_value: 399 },
  { name: 'Bose SoundLink Max', description: 'Enceinte portable premium', retail_value: 449 },
  { name: 'Clavier Logitech G Pro X', description: 'Clavier mecanique RGB pour esport', retail_value: 229 },
  { name: 'Souris Logitech G Pro X Superlight', description: 'Souris gaming ultra-legere 63g', retail_value: 159 },
  { name: 'Samsung TV OLED 55"', description: 'TV 4K OLED avec Neural Quantum Processor', retail_value: 1499 },
  { name: 'Meta Quest 3', description: 'Casque VR mixte nouvelle generation', retail_value: 549 },
  { name: 'Rolex Submariner', description: 'Montre de plongee iconique', retail_value: 9150 },
  { name: 'Sac Louis Vuitton Neverfull', description: 'Sac cabas en toile Monogram', retail_value: 1850 },
  { name: 'Nike Air Jordan 1 Retro', description: 'Sneakers legendaires Chicago', retail_value: 180 },
  { name: 'Canon EOS R6 Mark II', description: 'Appareil photo hybride plein format', retail_value: 2799 },
  { name: 'JBL Charge 5', description: 'Enceinte Bluetooth etanche', retail_value: 179 },
  { name: 'Steam Deck OLED', description: 'PC gaming portable avec ecran HDR', retail_value: 679 },
  { name: 'Ray-Ban Meta Wayfarer', description: 'Lunettes connectees avec camera', retail_value: 329 },
  { name: 'Tesla Model Car', description: 'Maquette Tesla Cybertruck 1:18', retail_value: 250 },
  { name: 'Carte cadeau Amazon 500€', description: 'Bon d\'achat Amazon', retail_value: 500 },
  { name: 'Chaise SecretLab Titan', description: 'Siege gaming ergonomique premium', retail_value: 549 },
  { name: 'Ecran Samsung Odyssey G9', description: 'Moniteur gaming 49" 240Hz', retail_value: 1299 },
  { name: 'Trottinette Xiaomi Pro 2', description: 'Trottinette electrique 45km autonomie', retail_value: 449 },
]

async function seedProducts() {
  console.log('Seeding products...')

  for (const product of products) {
    // Check if product already exists
    const { data: existing } = await supabase
      .from('items')
      .select('id')
      .eq('name', product.name)
      .single()

    if (existing) {
      console.log(`Skipping "${product.name}" - already exists`)
      continue
    }

    // Insert item
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert({
        name: product.name,
        description: product.description,
        image_url: '/products/placeholder.svg', // Will be matched by name in GameCard
        retail_value: product.retail_value,
        is_active: true,
      })
      .select()
      .single()

    if (itemError) {
      console.error(`Error inserting item "${product.name}":`, itemError)
      continue
    }

    console.log(`Created item: ${product.name}`)

    // Create a game for this item with random duration
    const now = Date.now()
    const durationMinutes = Math.floor(Math.random() * 55) + 5 // 5-60 minutes
    const endTime = now + durationMinutes * 60 * 1000

    const { error: gameError } = await supabase.from('games').insert({
      item_id: item.id,
      status: 'active',
      start_time: new Date().toISOString(),
      end_time: endTime,
      initial_duration: 300000, // 5 minutes
      final_phase_duration: 60000, // 1 minute
      total_clicks: Math.floor(Math.random() * 50), // Random initial clicks
    })

    if (gameError) {
      console.error(`Error creating game for "${product.name}":`, gameError)
    } else {
      console.log(`Created game for: ${product.name} (ends in ${durationMinutes} minutes)`)
    }
  }

  console.log('\nSeeding complete!')
}

seedProducts().catch(console.error)
