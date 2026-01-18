/**
 * Script de seed pour ajouter 50 produits populaires en France
 * Usage: npx tsx scripts/seed-items.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Product {
  name: string
  description: string
  image_url: string
  retail_value: number
  category: string
}

const PRODUCTS: Product[] = [
  // ============================================
  // SMARTPHONES (5)
  // ============================================
  {
    name: 'iPhone 15 Pro Max',
    description: "Le smartphone ultime d'Apple avec puce A17 Pro, ecran 6.7\" Super Retina XDR et camera 48MP",
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=90&fit=crop',
    retail_value: 1479,
    category: 'smartphone'
  },
  {
    name: 'iPhone 15 Pro',
    description: 'Puissance et design premium avec titane, Action Button et USB-C',
    image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=90&fit=crop',
    retail_value: 1229,
    category: 'smartphone'
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Le flagship Samsung avec S Pen integre, camera 200MP et Galaxy AI',
    image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=90&fit=crop',
    retail_value: 1469,
    category: 'smartphone'
  },
  {
    name: 'Samsung Galaxy Z Fold 5',
    description: 'Smartphone pliable nouvelle generation avec ecran 7.6" depliant',
    image_url: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=90&fit=crop',
    retail_value: 1899,
    category: 'smartphone'
  },
  {
    name: 'Google Pixel 8 Pro',
    description: "L'IA Google dans votre poche avec le meilleur appareil photo Android",
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=90&fit=crop',
    retail_value: 1099,
    category: 'smartphone'
  },

  // ============================================
  // GAMING (7)
  // ============================================
  {
    name: 'PlayStation 5',
    description: 'Console next-gen Sony avec SSD ultra-rapide et DualSense',
    image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=90&fit=crop',
    retail_value: 549,
    category: 'gaming'
  },
  {
    name: 'PlayStation 5 Digital',
    description: 'PS5 edition digitale sans lecteur de disque',
    image_url: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=90&fit=crop',
    retail_value: 449,
    category: 'gaming'
  },
  {
    name: 'Xbox Series X',
    description: 'La console Microsoft la plus puissante avec 12 teraflops',
    image_url: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=90&fit=crop',
    retail_value: 499,
    category: 'gaming'
  },
  {
    name: 'Nintendo Switch OLED',
    description: 'Console hybride Nintendo avec ecran OLED 7 pouces',
    image_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=90&fit=crop',
    retail_value: 349,
    category: 'gaming'
  },
  {
    name: 'Steam Deck OLED',
    description: 'PC gaming portable de Valve avec ecran OLED HDR',
    image_url: 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=800&q=90&fit=crop',
    retail_value: 569,
    category: 'gaming'
  },
  {
    name: 'Meta Quest 3',
    description: 'Casque VR autonome avec realite mixte',
    image_url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=90&fit=crop',
    retail_value: 549,
    category: 'gaming'
  },
  {
    name: 'Manette PS5 DualSense Edge',
    description: 'Manette pro personnalisable pour PS5',
    image_url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90&fit=crop',
    retail_value: 239,
    category: 'gaming'
  },

  // ============================================
  // ORDINATEURS & TABLETTES (7)
  // ============================================
  {
    name: 'MacBook Pro 16" M3 Max',
    description: 'Le laptop Apple le plus puissant avec puce M3 Max',
    image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=90&fit=crop',
    retail_value: 4499,
    category: 'computer'
  },
  {
    name: 'MacBook Pro 14" M3 Pro',
    description: 'Performance pro dans un format compact',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90&fit=crop',
    retail_value: 2499,
    category: 'computer'
  },
  {
    name: 'MacBook Air 15" M3',
    description: 'Le MacBook Air grand ecran ultrafin',
    image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=90&fit=crop',
    retail_value: 1599,
    category: 'computer'
  },
  {
    name: 'iPad Pro 12.9" M2',
    description: 'La tablette pro ultime avec puce M2 et ecran Liquid Retina XDR',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90&fit=crop',
    retail_value: 1469,
    category: 'tablet'
  },
  {
    name: 'iPad Air M2',
    description: 'Puissance M2 dans le design Air',
    image_url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=90&fit=crop',
    retail_value: 769,
    category: 'tablet'
  },
  {
    name: 'iMac 24" M3',
    description: "L'ordinateur tout-en-un colore d'Apple",
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=90&fit=crop',
    retail_value: 1699,
    category: 'computer'
  },
  {
    name: 'ASUS ROG Zephyrus G16',
    description: 'PC portable gaming haut de gamme avec RTX 4090',
    image_url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=90&fit=crop',
    retail_value: 3299,
    category: 'computer'
  },

  // ============================================
  // AUDIO (6)
  // ============================================
  {
    name: 'AirPods Pro 2',
    description: 'Ecouteurs sans fil Apple avec reduction de bruit active et USB-C',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90&fit=crop',
    retail_value: 279,
    category: 'audio'
  },
  {
    name: 'AirPods Max',
    description: 'Casque audio haut de gamme Apple avec audio spatial',
    image_url: 'https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=800&q=90&fit=crop',
    retail_value: 579,
    category: 'audio'
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Le meilleur casque a reduction de bruit du marche',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90&fit=crop',
    retail_value: 379,
    category: 'audio'
  },
  {
    name: 'Bose QuietComfort Ultra',
    description: 'Casque Bose avec audio immersif Bose Immersive',
    image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=90&fit=crop',
    retail_value: 449,
    category: 'audio'
  },
  {
    name: 'Sonos Era 300',
    description: 'Enceinte connectee avec audio spatial Dolby Atmos',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 499,
    category: 'audio'
  },
  {
    name: 'Marshall Stanmore III',
    description: 'Enceinte Bluetooth au design iconique Marshall',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90&fit=crop',
    retail_value: 379,
    category: 'audio'
  },

  // ============================================
  // MONTRES & WEARABLES (4)
  // ============================================
  {
    name: 'Apple Watch Ultra 2',
    description: 'La montre Apple la plus robuste pour les athletes',
    image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=90&fit=crop',
    retail_value: 899,
    category: 'watch'
  },
  {
    name: 'Apple Watch Series 9',
    description: 'La montre connectee la plus avancee',
    image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=90&fit=crop',
    retail_value: 449,
    category: 'watch'
  },
  {
    name: 'Samsung Galaxy Watch 6 Classic',
    description: 'Montre connectee Samsung avec lunette rotative',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 399,
    category: 'watch'
  },
  {
    name: 'Garmin Fenix 7 Pro',
    description: 'Montre GPS multisports premium',
    image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=90&fit=crop',
    retail_value: 799,
    category: 'watch'
  },

  // ============================================
  // PHOTO & VIDEO (4)
  // ============================================
  {
    name: 'Sony Alpha 7 IV',
    description: 'Hybride plein format polyvalent 33MP',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90&fit=crop',
    retail_value: 2799,
    category: 'photo'
  },
  {
    name: 'Canon EOS R6 Mark II',
    description: 'Hybride Canon rapide et polyvalent',
    image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=90&fit=crop',
    retail_value: 2599,
    category: 'photo'
  },
  {
    name: 'GoPro Hero 12 Black',
    description: "Camera d'action 5.3K avec stabilisation HyperSmooth",
    image_url: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&q=90&fit=crop',
    retail_value: 449,
    category: 'photo'
  },
  {
    name: 'DJI Pocket 3',
    description: 'Camera gimbal de poche pour vlogs',
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=90&fit=crop',
    retail_value: 519,
    category: 'photo'
  },

  // ============================================
  // DRONES (3)
  // ============================================
  {
    name: 'DJI Mavic 3 Pro',
    description: 'Drone professionnel avec triple camera Hasselblad',
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=90&fit=crop',
    retail_value: 2199,
    category: 'drone'
  },
  {
    name: 'DJI Mini 4 Pro',
    description: 'Drone compact sous 249g avec camera 4K',
    image_url: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&q=90&fit=crop',
    retail_value: 959,
    category: 'drone'
  },
  {
    name: 'DJI Avata 2',
    description: 'Drone FPV immersif pour debutants',
    image_url: 'https://images.unsplash.com/photo-1521405924368-64c5b84bec60?w=800&q=90&fit=crop',
    retail_value: 579,
    category: 'drone'
  },

  // ============================================
  // TV & HOME CINEMA (4)
  // ============================================
  {
    name: 'LG OLED C3 65"',
    description: 'TV OLED 4K 65 pouces avec processeur Alpha 9 Gen 6',
    image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=90&fit=crop',
    retail_value: 1799,
    category: 'tv'
  },
  {
    name: 'Samsung QN90C 55"',
    description: 'TV Neo QLED 4K avec Quantum Matrix',
    image_url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=90&fit=crop',
    retail_value: 1299,
    category: 'tv'
  },
  {
    name: 'Sony Bravia XR A80L 55"',
    description: 'TV OLED Google TV avec Cognitive Processor XR',
    image_url: 'https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=800&q=90&fit=crop',
    retail_value: 1599,
    category: 'tv'
  },
  {
    name: 'Sonos Arc',
    description: 'Barre de son premium Dolby Atmos',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90&fit=crop',
    retail_value: 899,
    category: 'audio'
  },

  // ============================================
  // MOBILITE ELECTRIQUE (4)
  // ============================================
  {
    name: 'Xiaomi Electric Scooter 4 Pro',
    description: 'Trottinette electrique 25km/h autonomie 55km',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90&fit=crop',
    retail_value: 599,
    category: 'mobility'
  },
  {
    name: 'Segway Ninebot Max G2',
    description: 'Trottinette premium longue autonomie 70km',
    image_url: 'https://images.unsplash.com/photo-1604868189265-219ba7ffc595?w=800&q=90&fit=crop',
    retail_value: 949,
    category: 'mobility'
  },
  {
    name: 'VanMoof S5',
    description: 'Velo electrique connecte design hollandais',
    image_url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=90&fit=crop',
    retail_value: 2998,
    category: 'mobility'
  },
  {
    name: 'Cowboy 4',
    description: 'Velo electrique urbain connecte made in Belgium',
    image_url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=90&fit=crop',
    retail_value: 2990,
    category: 'mobility'
  },

  // ============================================
  // MOTOS & SCOOTERS (3)
  // ============================================
  {
    name: 'Vespa Elettrica',
    description: 'Le scooter italien iconique en version electrique',
    image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=90&fit=crop',
    retail_value: 7490,
    category: 'moto'
  },
  {
    name: 'BMW CE 04',
    description: 'Scooter electrique futuriste BMW',
    image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=90&fit=crop',
    retail_value: 12100,
    category: 'moto'
  },
  {
    name: 'Zero SR/F',
    description: 'Moto electrique sportive 190km/h',
    image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=90&fit=crop',
    retail_value: 21990,
    category: 'moto'
  },

  // ============================================
  // ELECTROMENAGER PREMIUM (3)
  // ============================================
  {
    name: 'Dyson V15 Detect',
    description: 'Aspirateur sans fil avec detection laser des poussieres',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=90&fit=crop',
    retail_value: 749,
    category: 'home'
  },
  {
    name: 'Thermomix TM6',
    description: 'Robot cuiseur multifonction Vorwerk',
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=90&fit=crop',
    retail_value: 1499,
    category: 'home'
  },
  {
    name: 'Dyson Airwrap Complete',
    description: 'Coiffeur multi-embouts sans chaleur extreme',
    image_url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=90&fit=crop',
    retail_value: 549,
    category: 'home'
  },
]

async function seedItems() {
  console.log('🚀 Debut du seed des produits...\n')

  // Supprimer les anciens items
  console.log('🗑️  Suppression des anciens items...')
  const { error: deleteError } = await supabase
    .from('items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.error('Erreur lors de la suppression:', deleteError)
  }

  // Inserer les nouveaux produits
  console.log('📦 Insertion de', PRODUCTS.length, 'produits...\n')

  const itemsToInsert = PRODUCTS.map(({ name, description, image_url, retail_value }) => ({
    name,
    description,
    image_url,
    retail_value,
    is_active: true
  }))

  const { data, error } = await supabase
    .from('items')
    .insert(itemsToInsert)
    .select()

  if (error) {
    console.error('❌ Erreur lors de l\'insertion:', error)
    process.exit(1)
  }

  console.log('✅ Seed termine avec succes!')
  console.log(`📊 ${data?.length} produits inseres\n`)

  // Afficher un resume par categorie
  const categories = PRODUCTS.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('📋 Resume par categorie:')
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count}`)
  })

  // Calculer la valeur totale
  const totalValue = PRODUCTS.reduce((sum, p) => sum + p.retail_value, 0)
  console.log(`\n💰 Valeur totale des lots: ${totalValue.toLocaleString()}€`)
}

seedItems()
