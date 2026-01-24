/**
 * Seed avec 100 produits réels 2025/2026 - Prix réels du marché français
 * 10 catégories × 10 produits
 * 50 produits < 200€ / 50 produits >= 200€
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Product {
  name: string
  description: string
  retail_value: number
  category: string
}

const PRODUCTS: Product[] = [
  // ============================================
  // 1. TÉLÉPHONIE (Smartphones) - 10 produits
  // 4 premium (>=200€) + 6 budget (<200€)
  // ============================================
  {
    name: 'iPhone 16 Pro Max',
    description: 'Smartphone Apple avec puce A18 Pro, écran 6.9" Super Retina XDR',
    retail_value: 1479,
    category: 'smartphones'
  },
  {
    name: 'Samsung Galaxy S25 Ultra',
    description: 'Flagship Samsung avec S Pen intégré et Galaxy AI',
    retail_value: 1469,
    category: 'smartphones'
  },
  {
    name: 'Google Pixel 9 Pro',
    description: 'Smartphone Google avec IA Gemini et triple caméra 50MP',
    retail_value: 1099,
    category: 'smartphones'
  },
  {
    name: 'iPhone 16',
    description: 'iPhone avec Dynamic Island, puce A18 et USB-C',
    retail_value: 969,
    category: 'smartphones'
  },
  {
    name: 'Xiaomi Redmi Note 13',
    description: 'Smartphone Xiaomi abordable avec écran AMOLED 120Hz',
    retail_value: 219,
    category: 'smartphones'
  },
  {
    name: 'Samsung Galaxy A15',
    description: 'Smartphone Samsung avec écran Super AMOLED 90Hz',
    retail_value: 179,
    category: 'smartphones'
  },
  {
    name: 'Xiaomi Redmi 13C',
    description: 'Smartphone entrée de gamme avec batterie 5000mAh',
    retail_value: 129,
    category: 'smartphones'
  },
  {
    name: 'Motorola Moto G24',
    description: 'Smartphone avec écran 90Hz et son Dolby Atmos',
    retail_value: 119,
    category: 'smartphones'
  },
  {
    name: 'Realme C67',
    description: 'Smartphone avec caméra 108MP et charge rapide 33W',
    retail_value: 149,
    category: 'smartphones'
  },
  {
    name: 'POCO M6 Pro',
    description: 'Smartphone Xiaomi avec Helio G99 et écran AMOLED',
    retail_value: 169,
    category: 'smartphones'
  },

  // ============================================
  // 2. ÉCOUTEURS & CASQUES AUDIO - 10 produits
  // 3 premium (>=200€) + 7 budget (<200€)
  // ============================================
  {
    name: 'Sony WH-1000XM5',
    description: 'Casque référence avec réduction de bruit et 30h d\'autonomie',
    retail_value: 399,
    category: 'ecouteurs'
  },
  {
    name: 'Bose QuietComfort Ultra',
    description: 'Casque premium Bose avec audio spatial immersif',
    retail_value: 449,
    category: 'ecouteurs'
  },
  {
    name: 'AirPods Pro 3',
    description: 'Écouteurs Apple avec réduction de bruit adaptative et puce H3',
    retail_value: 279,
    category: 'ecouteurs'
  },
  {
    name: 'AirPods 4',
    description: 'AirPods avec audio spatial personnalisé',
    retail_value: 149,
    category: 'ecouteurs'
  },
  {
    name: 'Samsung Galaxy Buds FE',
    description: 'Écouteurs Samsung avec ANC à prix accessible',
    retail_value: 99,
    category: 'ecouteurs'
  },
  {
    name: 'JBL Tune 770NC',
    description: 'Casque Bluetooth avec ANC et 70h d\'autonomie',
    retail_value: 99,
    category: 'ecouteurs'
  },
  {
    name: 'Sony WF-C700N',
    description: 'Écouteurs Sony true wireless avec ANC',
    retail_value: 119,
    category: 'ecouteurs'
  },
  {
    name: 'JBL Tune Buds',
    description: 'Écouteurs true wireless avec ANC et 48h d\'autonomie',
    retail_value: 79,
    category: 'ecouteurs'
  },
  {
    name: 'Xiaomi Redmi Buds 5',
    description: 'Écouteurs Xiaomi avec ANC et 46dB de réduction',
    retail_value: 49,
    category: 'ecouteurs'
  },
  {
    name: 'JBL Tune 520BT',
    description: 'Casque Bluetooth on-ear avec 57h d\'autonomie',
    retail_value: 49,
    category: 'ecouteurs'
  },

  // ============================================
  // 3. ORDINATEURS - 10 produits
  // 10 premium (>=200€) + 0 budget
  // ============================================
  {
    name: 'MacBook Pro 16" M4 Max',
    description: 'Le laptop le plus puissant Apple avec puce M4 Max',
    retail_value: 4299,
    category: 'ordinateurs'
  },
  {
    name: 'MacBook Pro 14" M4 Pro',
    description: 'MacBook Pro compact avec puce M4 Pro',
    retail_value: 2399,
    category: 'ordinateurs'
  },
  {
    name: 'MacBook Air 15" M4',
    description: 'MacBook Air grand écran ultra-fin avec puce M4',
    retail_value: 1499,
    category: 'ordinateurs'
  },
  {
    name: 'MacBook Air 13" M4',
    description: 'Le laptop le plus fin au monde avec puce M4',
    retail_value: 1199,
    category: 'ordinateurs'
  },
  {
    name: 'Dell XPS 15 (2025)',
    description: 'Ultrabook premium avec Intel Core Ultra 9 et OLED 3.5K',
    retail_value: 2199,
    category: 'ordinateurs'
  },
  {
    name: 'ASUS ROG Zephyrus G16',
    description: 'PC gaming portable avec RTX 5080 et écran 240Hz',
    retail_value: 2799,
    category: 'ordinateurs'
  },
  {
    name: 'HP Spectre x360 14',
    description: 'Convertible premium avec écran OLED tactile',
    retail_value: 1699,
    category: 'ordinateurs'
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon',
    description: 'Ultrabook professionnel avec Intel vPro',
    retail_value: 1899,
    category: 'ordinateurs'
  },
  {
    name: 'iMac 24" M4',
    description: 'iMac tout-en-un avec écran 4.5K Retina',
    retail_value: 1499,
    category: 'ordinateurs'
  },
  {
    name: 'Mac mini M4 Pro',
    description: 'Mac mini compact et puissant avec puce M4 Pro',
    retail_value: 1399,
    category: 'ordinateurs'
  },

  // ============================================
  // 4. CONSOLES DE JEUX - 10 produits
  // 4 premium (>=200€) + 6 budget (<200€)
  // ============================================
  {
    name: 'PlayStation 5 Pro',
    description: 'Console PS5 Pro avec GPU amélioré et SSD 2To',
    retail_value: 799,
    category: 'consoles'
  },
  {
    name: 'Xbox Series X',
    description: 'Console Microsoft la plus puissante avec 12 TFLOPs',
    retail_value: 599,
    category: 'consoles'
  },
  {
    name: 'Nintendo Switch 2',
    description: 'Nouvelle génération Nintendo avec écran LCD 8"',
    retail_value: 469,
    category: 'consoles'
  },
  {
    name: 'Steam Deck OLED',
    description: 'PC gaming portable Valve avec écran OLED HDR',
    retail_value: 569,
    category: 'consoles'
  },
  {
    name: 'Nintendo Switch Lite',
    description: 'Switch portable compacte et légère',
    retail_value: 219,
    category: 'consoles'
  },
  {
    name: 'Backbone One',
    description: 'Manette mobile gaming pour iPhone et Android',
    retail_value: 119,
    category: 'consoles'
  },
  {
    name: 'Razer Kishi V2',
    description: 'Manette mobile gaming avec boutons mécaniques',
    retail_value: 99,
    category: 'consoles'
  },
  {
    name: '8BitDo Ultimate C',
    description: 'Manette sans fil compatible PC, Switch et mobile',
    retail_value: 29,
    category: 'consoles'
  },
  {
    name: 'Manette Pro Switch',
    description: 'Manette officielle Nintendo Switch Pro',
    retail_value: 69,
    category: 'consoles'
  },
  {
    name: 'GameSir G7 SE',
    description: 'Manette filaire Xbox/PC avec palettes',
    retail_value: 49,
    category: 'consoles'
  },

  // ============================================
  // 5. MONTRES CONNECTÉES - 10 produits
  // 4 premium (>=200€) + 6 budget (<200€)
  // ============================================
  {
    name: 'Apple Watch Ultra 2',
    description: 'Montre Apple la plus robuste avec GPS double fréquence',
    retail_value: 899,
    category: 'montres'
  },
  {
    name: 'Apple Watch Series 10',
    description: 'Apple Watch avec écran plus grand et détection apnée',
    retail_value: 449,
    category: 'montres'
  },
  {
    name: 'Samsung Galaxy Watch Ultra',
    description: 'Montre Samsung outdoor avec 100h d\'autonomie GPS',
    retail_value: 699,
    category: 'montres'
  },
  {
    name: 'Garmin Fenix 8',
    description: 'Montre GPS multisports premium avec écran AMOLED',
    retail_value: 899,
    category: 'montres'
  },
  {
    name: 'Amazfit GTR 4',
    description: 'Montre connectée avec 14 jours d\'autonomie et GPS',
    retail_value: 179,
    category: 'montres'
  },
  {
    name: 'Xiaomi Watch 2 Pro',
    description: 'Montre Xiaomi avec Wear OS et GPS double bande',
    retail_value: 229,
    category: 'montres'
  },
  {
    name: 'Samsung Galaxy Fit3',
    description: 'Bracelet connecté Samsung avec écran AMOLED',
    retail_value: 59,
    category: 'montres'
  },
  {
    name: 'Xiaomi Smart Band 8',
    description: 'Bracelet connecté avec écran AMOLED et 16 jours',
    retail_value: 35,
    category: 'montres'
  },
  {
    name: 'Amazfit Band 7',
    description: 'Bracelet fitness avec 120 modes sport',
    retail_value: 49,
    category: 'montres'
  },
  {
    name: 'Huawei Band 9',
    description: 'Bracelet connecté avec suivi sommeil avancé',
    retail_value: 59,
    category: 'montres'
  },

  // ============================================
  // 6. TABLETTES - 10 produits
  // 5 premium (>=200€) + 5 budget (<200€)
  // ============================================
  {
    name: 'iPad Pro 13" M4',
    description: 'iPad Pro avec puce M4 et écran OLED tandem',
    retail_value: 1469,
    category: 'tablettes'
  },
  {
    name: 'iPad Pro 11" M4',
    description: 'iPad Pro compact avec puce M4',
    retail_value: 1099,
    category: 'tablettes'
  },
  {
    name: 'Samsung Galaxy Tab S10 Ultra',
    description: 'Tablette Samsung 14.6" avec S Pen et Galaxy AI',
    retail_value: 1299,
    category: 'tablettes'
  },
  {
    name: 'iPad Air 11" M3',
    description: 'iPad Air avec puce M3 et Apple Pencil Pro',
    retail_value: 719,
    category: 'tablettes'
  },
  {
    name: 'iPad 10e génération',
    description: 'iPad avec USB-C et puce A14',
    retail_value: 409,
    category: 'tablettes'
  },
  {
    name: 'Amazon Fire HD 10',
    description: 'Tablette Amazon 10.1" avec Alexa intégré',
    retail_value: 149,
    category: 'tablettes'
  },
  {
    name: 'Samsung Galaxy Tab A9',
    description: 'Tablette Samsung 8.7" avec écran LCD',
    retail_value: 169,
    category: 'tablettes'
  },
  {
    name: 'Lenovo Tab M10 Plus',
    description: 'Tablette Lenovo 10.6" avec Dolby Atmos',
    retail_value: 179,
    category: 'tablettes'
  },
  {
    name: 'Amazon Fire HD 8',
    description: 'Tablette Amazon 8" compacte avec Alexa',
    retail_value: 99,
    category: 'tablettes'
  },
  {
    name: 'Xiaomi Redmi Pad SE',
    description: 'Tablette Xiaomi 11" avec écran 90Hz',
    retail_value: 189,
    category: 'tablettes'
  },

  // ============================================
  // 7. TV & ÉCRANS - 10 produits
  // 5 premium (>=200€) + 5 budget (<200€)
  // ============================================
  {
    name: 'LG OLED 55" C4',
    description: 'TV OLED evo 4K 120Hz avec processeur α9 AI Gen7',
    retail_value: 1199,
    category: 'tv'
  },
  {
    name: 'LG OLED 65" G4',
    description: 'TV OLED evo Gallery Edition avec MLA',
    retail_value: 2499,
    category: 'tv'
  },
  {
    name: 'Samsung QN90D 55"',
    description: 'TV Neo QLED 4K avec Neural Quantum Processor',
    retail_value: 1299,
    category: 'tv'
  },
  {
    name: 'Sony Bravia XR A95L 55"',
    description: 'TV QD-OLED 4K avec Acoustic Surface Audio+',
    retail_value: 1999,
    category: 'tv'
  },
  {
    name: 'TCL 55" C645',
    description: 'TV QLED 4K avec Google TV et Dolby Vision',
    retail_value: 449,
    category: 'tv'
  },
  {
    name: 'Xiaomi TV A Pro 43"',
    description: 'TV LED 4K avec Google TV et Dolby Audio',
    retail_value: 279,
    category: 'tv'
  },
  {
    name: 'TCL 32" S5400A',
    description: 'TV Full HD avec Google TV',
    retail_value: 169,
    category: 'tv'
  },
  {
    name: 'Xiaomi TV A2 32"',
    description: 'TV HD avec Android TV',
    retail_value: 149,
    category: 'tv'
  },
  {
    name: 'Amazon Fire TV Stick 4K Max',
    description: 'Lecteur streaming 4K avec Alexa',
    retail_value: 69,
    category: 'tv'
  },
  {
    name: 'Google Chromecast 4K',
    description: 'Lecteur streaming avec Google TV',
    retail_value: 69,
    category: 'tv'
  },

  // ============================================
  // 8. ENCEINTES & AUDIO - 10 produits
  // 2 premium (>=200€) + 8 budget (<200€)
  // ============================================
  {
    name: 'Sonos Arc',
    description: 'Barre de son Dolby Atmos premium avec Trueplay',
    retail_value: 899,
    category: 'enceintes'
  },
  {
    name: 'Sonos Era 300',
    description: 'Enceinte avec audio spatial Dolby Atmos',
    retail_value: 499,
    category: 'enceintes'
  },
  {
    name: 'JBL Charge 5',
    description: 'Enceinte Bluetooth étanche avec powerbank',
    retail_value: 179,
    category: 'enceintes'
  },
  {
    name: 'JBL Flip 6',
    description: 'Enceinte Bluetooth compacte et étanche IP67',
    retail_value: 139,
    category: 'enceintes'
  },
  {
    name: 'JBL Go 4',
    description: 'Mini enceinte Bluetooth ultra-portable',
    retail_value: 49,
    category: 'enceintes'
  },
  {
    name: 'Amazon Echo Dot 5',
    description: 'Enceinte connectée avec Alexa',
    retail_value: 59,
    category: 'enceintes'
  },
  {
    name: 'Google Nest Mini',
    description: 'Enceinte connectée compacte avec Google Assistant',
    retail_value: 59,
    category: 'enceintes'
  },
  {
    name: 'Ultimate Ears Wonderboom 3',
    description: 'Enceinte 360° étanche et flottante',
    retail_value: 99,
    category: 'enceintes'
  },
  {
    name: 'JBL Clip 5',
    description: 'Mini enceinte avec mousqueton intégré',
    retail_value: 69,
    category: 'enceintes'
  },
  {
    name: 'Xiaomi Mi Speaker',
    description: 'Enceinte Bluetooth compacte avec 12h d\'autonomie',
    retail_value: 29,
    category: 'enceintes'
  },

  // ============================================
  // 9. DRONES & CAMÉRAS - 10 produits
  // 5 premium (>=200€) + 5 budget (<200€)
  // ============================================
  {
    name: 'DJI Mavic 4 Pro',
    description: 'Drone pro avec triple caméra Hasselblad',
    retail_value: 2299,
    category: 'drones'
  },
  {
    name: 'DJI Air 3S',
    description: 'Drone compact avec double caméra',
    retail_value: 1099,
    category: 'drones'
  },
  {
    name: 'DJI Mini 4 Pro',
    description: 'Drone ultra-léger (<249g) avec caméra 4K',
    retail_value: 799,
    category: 'drones'
  },
  {
    name: 'GoPro Hero 13 Black',
    description: 'Action cam 5.3K avec HDR et HyperSmooth 6.0',
    retail_value: 449,
    category: 'drones'
  },
  {
    name: 'DJI Osmo Action 5 Pro',
    description: 'Action cam avec capteur 1/1.3" et RockSteady',
    retail_value: 379,
    category: 'drones'
  },
  {
    name: 'Insta360 GO 3',
    description: 'Mini caméra d\'action ultra-compacte',
    retail_value: 299,
    category: 'drones'
  },
  {
    name: 'GoPro Hero',
    description: 'Action cam 4K d\'entrée de gamme',
    retail_value: 229,
    category: 'drones'
  },
  {
    name: 'DJI Osmo Mobile 6',
    description: 'Stabilisateur smartphone avec suivi automatique',
    retail_value: 169,
    category: 'drones'
  },
  {
    name: 'Insta360 Flow',
    description: 'Stabilisateur smartphone avec trépied intégré',
    retail_value: 149,
    category: 'drones'
  },
  {
    name: 'DJI Mic Mini',
    description: 'Micro sans fil compact pour smartphone',
    retail_value: 59,
    category: 'drones'
  },

  // ============================================
  // 10. ACCESSOIRES GAMING - 10 produits
  // 3 premium (>=200€) + 7 budget (<200€)
  // ============================================
  {
    name: 'Razer Kraken V4 Pro',
    description: 'Casque gaming sans fil avec hub OLED',
    retail_value: 449,
    category: 'gaming'
  },
  {
    name: 'DualSense Edge',
    description: 'Manette PS5 pro personnalisable avec palettes',
    retail_value: 239,
    category: 'gaming'
  },
  {
    name: 'Logitech G Pro X Superlight 2',
    description: 'Souris gaming sans fil 63g avec capteur Hero 2',
    retail_value: 169,
    category: 'gaming'
  },
  {
    name: 'Razer DeathAdder V3',
    description: 'Souris gaming ergonomique filaire 59g',
    retail_value: 89,
    category: 'gaming'
  },
  {
    name: 'DualSense PS5',
    description: 'Manette PS5 avec retour haptique',
    retail_value: 69,
    category: 'gaming'
  },
  {
    name: 'Manette Xbox Wireless',
    description: 'Manette Xbox sans fil avec grip texturé',
    retail_value: 59,
    category: 'gaming'
  },
  {
    name: 'SteelSeries Arctis 1',
    description: 'Casque gaming sans fil polyvalent',
    retail_value: 79,
    category: 'gaming'
  },
  {
    name: 'Razer Kraken X',
    description: 'Casque gaming léger avec son surround 7.1',
    retail_value: 49,
    category: 'gaming'
  },
  {
    name: 'Logitech G203',
    description: 'Souris gaming filaire avec éclairage RGB',
    retail_value: 39,
    category: 'gaming'
  },
  {
    name: 'HyperX Cloud Stinger 2',
    description: 'Casque gaming confortable avec micro pivotant',
    retail_value: 49,
    category: 'gaming'
  },
]

async function main() {
  console.log('🚀 Seed des 100 produits réels 2025/2026\n')
  console.log('📊 10 catégories × 10 produits\n')

  // Vérification préalable du nombre de produits < 200€
  const under200 = PRODUCTS.filter(p => p.retail_value < 200).length
  console.log(`🎯 Vérification: ${under200} produits < 200€ (objectif: 50)\n`)

  // Supprimer les anciens
  console.log('🗑️  Suppression des anciens items...')
  await supabase.from('winners').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('game_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insérer les nouveaux
  console.log(`📦 Insertion de ${PRODUCTS.length} produits...\n`)

  const productsToInsert = PRODUCTS.map((product) => ({
    name: product.name,
    description: product.description,
    retail_value: product.retail_value,
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90'
  }))

  const { error } = await supabase.from('items').insert(productsToInsert)

  if (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }

  console.log(`✅ Seed terminé avec succès!`)
  console.log(`📊 ${PRODUCTS.length} produits insérés`)

  // Stats par catégorie
  const categories = [...new Set(PRODUCTS.map(p => p.category))]
  console.log(`\n📂 ${categories.length} catégories:`)
  categories.forEach(cat => {
    const catProducts = PRODUCTS.filter(p => p.category === cat)
    const total = catProducts.reduce((acc, p) => acc + p.retail_value, 0)
    const avg = Math.round(total / catProducts.length)
    const catUnder200 = catProducts.filter(p => p.retail_value < 200).length
    console.log(`   • ${cat}: ${catProducts.length} produits (moyenne: ${avg}€, <200€: ${catUnder200})`)
  })

  // Stats globales
  const premium = PRODUCTS.filter(p => p.retail_value >= 1000).length
  const budget = PRODUCTS.filter(p => p.retail_value < 200).length
  const middle = PRODUCTS.filter(p => p.retail_value >= 200 && p.retail_value < 1000).length
  const total = PRODUCTS.reduce((acc, p) => acc + p.retail_value, 0)
  const min = Math.min(...PRODUCTS.map(p => p.retail_value))
  const max = Math.max(...PRODUCTS.map(p => p.retail_value))

  console.log(`\n💰 Statistiques:`)
  console.log(`   • Valeur totale: ${total.toLocaleString()}€`)
  console.log(`   • Moyenne: ${Math.round(total / PRODUCTS.length)}€`)
  console.log(`   • Min: ${min}€ / Max: ${max}€`)
  console.log(`   • Produits premium (≥1000€): ${premium}`)
  console.log(`   • Produits milieu (200-999€): ${middle}`)
  console.log(`   • Produits budget (<200€): ${budget}`)
}

main().catch(console.error)
