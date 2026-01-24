/**
 * 100 Produits Populaires 2025/2026
 * 50 produits < 200€ | 50 produits > 200€
 * Mix hommes, femmes, mixte
 *
 * Versions les plus récentes au 24 janvier 2026
 *
 * Usage: npx tsx scripts/seed-items-100.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface Product {
  name: string
  description: string
  retail_value: number
  category: string
  target: 'homme' | 'femme' | 'mixte'
  imageSlug?: string // Override si le nom ne correspond pas au fichier
}

// Convertit un nom de produit en slug de fichier image
function toImageSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retire accents
    .replace(/['']/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============================================
// 50 PRODUITS < 200€
// ============================================
const productsUnder200: Product[] = [
  // AUDIO (10)
  { name: 'AirPods 4', description: 'Écouteurs Apple avec audio spatial et boîtier USB-C', retail_value: 149, category: 'audio', target: 'mixte' },
  { name: 'Samsung Galaxy Buds 3', description: 'Écouteurs sans fil avec ANC et son Hi-Fi', retail_value: 179, category: 'audio', target: 'mixte' },
  { name: 'JBL Tune 770NC', description: 'Casque Bluetooth avec réduction de bruit active', retail_value: 99, category: 'audio', target: 'mixte' },
  { name: 'Sony WF-1000XM5', description: 'Écouteurs compacts avec noise cancelling premium', retail_value: 199, category: 'audio', target: 'mixte', imageSlug: 'sony-wf-1000xm5' },
  { name: 'JBL Flip 7', description: 'Enceinte Bluetooth portable waterproof IP67', retail_value: 149, category: 'audio', target: 'mixte' },
  { name: 'Marshall Emberton III', description: 'Enceinte portable Bluetooth design rock', retail_value: 169, category: 'audio', target: 'mixte', imageSlug: 'marshall-emberton-iii' },
  { name: 'Bose SoundLink Flex', description: 'Enceinte portable résistante à l\'eau', retail_value: 149, category: 'audio', target: 'mixte' },
  { name: 'Beats Studio Buds+', description: 'Écouteurs Beats avec ANC et mode Transparence', retail_value: 169, category: 'audio', target: 'mixte' },
  { name: 'Ultimate Ears Boom 4', description: 'Enceinte 360° son immersif', retail_value: 149, category: 'audio', target: 'mixte' },
  { name: 'JBL Charge 6', description: 'Enceinte portable avec powerbank intégré', retail_value: 179, category: 'audio', target: 'mixte' },

  // GAMING ACCESSOIRES (8)
  { name: 'Manette PS5 DualSense Edge', description: 'Manette pro PlayStation 5 personnalisable', retail_value: 199, category: 'gaming', target: 'mixte' },
  { name: 'Manette Xbox Core', description: 'Manette officielle Xbox sans fil', retail_value: 59, category: 'gaming', target: 'mixte', imageSlug: 'manette-xbox-core' },
  { name: 'Nintendo Switch Pro Controller', description: 'Manette pro pour Nintendo Switch', retail_value: 69, category: 'gaming', target: 'mixte' },
  { name: 'Razer DeathAdder V3', description: 'Souris gaming ergonomique 30K DPI', retail_value: 89, category: 'gaming', target: 'homme' },
  { name: 'Logitech G Pro X Superlight 2', description: 'Souris gaming ultra-légère 60g', retail_value: 159, category: 'gaming', target: 'homme' },
  { name: 'SteelSeries Arctis Nova 7', description: 'Casque gaming sans fil multiplateforme', retail_value: 179, category: 'gaming', target: 'mixte' },
  { name: 'Razer BlackShark V2 Pro', description: 'Casque gaming sans fil THX Spatial Audio', retail_value: 179, category: 'gaming', target: 'mixte' },
  { name: 'Elgato Stream Deck MK.2', description: 'Contrôleur streaming 15 touches LCD', retail_value: 149, category: 'gaming', target: 'mixte', imageSlug: 'elgato-stream-deck-mk-2' },

  // WEARABLES (8)
  { name: 'Xiaomi Smart Band 9 Pro', description: 'Bracelet connecté AMOLED GPS intégré', retail_value: 69, category: 'wearable', target: 'mixte' },
  { name: 'Fitbit Sense 3', description: 'Montre fitness avancée avec ECG et stress', retail_value: 199, category: 'wearable', target: 'mixte', imageSlug: 'fitbit-sense-3' },
  { name: 'Amazfit GTR 5', description: 'Montre connectée AMOLED 14 jours autonomie', retail_value: 179, category: 'wearable', target: 'mixte' },
  { name: 'Huawei Watch Fit 4', description: 'Montre fitness AMOLED rectangulaire', retail_value: 149, category: 'wearable', target: 'mixte' },
  { name: 'Samsung Galaxy Watch FE', description: 'Montre connectée Wear OS abordable', retail_value: 199, category: 'wearable', target: 'mixte' },
  { name: 'Whoop 5.0', description: 'Bracelet performance sans écran nouvelle génération', retail_value: 199, category: 'wearable', target: 'homme', imageSlug: 'whoop-5-0' },
  { name: 'Apple Watch SE 2', description: 'Montre connectée Apple essentielle', retail_value: 199, category: 'wearable', target: 'mixte', imageSlug: 'apple-watch-se-2' },
  { name: 'Garmin Venu Sq 2', description: 'Montre fitness GPS écran AMOLED', retail_value: 199, category: 'wearable', target: 'mixte' },

  // AUDIO & GAMING (8)
  { name: 'Manette PS5 DualSense', description: 'Manette officielle PlayStation 5 avec retour haptique', retail_value: 69, category: 'gaming', target: 'mixte', imageSlug: 'manette-ps5-dualsense' },
  { name: 'Seagate Game Drive 4TB', description: 'Disque dur externe gaming Xbox', retail_value: 119, category: 'gaming', target: 'mixte', imageSlug: 'seagate-game-drive-4tb' },
  { name: 'Sonos Roam 2', description: 'Enceinte portable WiFi et Bluetooth', retail_value: 179, category: 'audio', target: 'mixte', imageSlug: 'sonos-roam-2' },
  { name: 'Sony WH-CH720N', description: 'Casque Bluetooth avec noise cancelling léger', retail_value: 149, category: 'audio', target: 'mixte', imageSlug: 'sony-wh-ch720n' },
  { name: 'Beats Studio Buds', description: 'Écouteurs sans fil avec ANC premium', retail_value: 149, category: 'audio', target: 'mixte', imageSlug: 'beats-studio-buds' },
  { name: 'Sonos Era 500', description: 'Enceinte Dolby Atmos intelligente', retail_value: 199, category: 'audio', target: 'mixte', imageSlug: 'sonos-era-500' },
  { name: 'Ninja Creami', description: 'Machine à glaces et sorbets maison', retail_value: 199, category: 'maison', target: 'mixte', imageSlug: 'ninja-creami' },
  { name: 'Marshall Stanmore IV', description: 'Enceinte Bluetooth design vintage', retail_value: 199, category: 'audio', target: 'mixte', imageSlug: 'marshall-stanmore-iv' },

  // MAISON CONNECTÉE (8)
  { name: 'Amazon Echo Show 10', description: 'Écran connecté Alexa avec rotation auto', retail_value: 199, category: 'maison', target: 'mixte' },
  { name: 'Google Nest Hub Max', description: 'Écran connecté Google Assistant 10 pouces', retail_value: 199, category: 'maison', target: 'mixte' },
  { name: 'Insta360 Go 3S', description: 'Mini caméra action 4K étanche avec boîtier écran', retail_value: 149, category: 'photo', target: 'mixte', imageSlug: 'philips-hue-starter-kit' },
  { name: 'Ring Video Doorbell 4', description: 'Sonnette vidéo connectée HD avec radar', retail_value: 199, category: 'maison', target: 'mixte' },
  { name: 'Eufy Security SoloCam E40', description: 'Caméra surveillance 2K sans fil solaire', retail_value: 129, category: 'maison', target: 'mixte', imageSlug: 'eufy-security-solo-cam-e40' },
  { name: 'Nanoleaf Shapes Hexagons', description: 'Panneaux lumineux modulaires RGB', retail_value: 199, category: 'maison', target: 'mixte', imageSlug: 'nanoleaf-shapes-hexagons' },
  { name: 'Nespresso Vertuo Pop', description: 'Machine à café capsules compacte', retail_value: 99, category: 'maison', target: 'mixte' },
  { name: 'iRobot Roomba Combo Essential', description: 'Robot aspirateur et laveur 2-en-1', retail_value: 199, category: 'maison', target: 'mixte' },

  // ACCESSOIRES TECH (8)
  { name: 'Apple AirTag 4 Pack', description: 'Trackers Bluetooth précision Ultra Wideband', retail_value: 129, category: 'accessoire', target: 'mixte' },
  { name: 'Samsung SmartTag 2 Pack', description: 'Trackers GPS Galaxy Find Network', retail_value: 59, category: 'accessoire', target: 'mixte' },
  { name: 'Anker 737 Power Bank 24K', description: 'Batterie externe 24000mAh 140W USB-C', retail_value: 149, category: 'accessoire', target: 'mixte' },
  { name: 'MagSafe Battery Pack', description: 'Batterie magnétique Apple iPhone 15W', retail_value: 109, category: 'accessoire', target: 'mixte' },
  { name: 'Belkin BoostCharge Pro 3-en-1', description: 'Station de charge MagSafe Apple Watch AirPods', retail_value: 149, category: 'accessoire', target: 'mixte' },
  { name: 'Kindle Paperwhite Signature', description: 'Liseuse 6.8" 32Go charge sans fil', retail_value: 189, category: 'accessoire', target: 'mixte' },
  { name: 'Ray-Ban Meta Smart Glasses', description: 'Lunettes connectées caméra 12MP et audio intégré', retail_value: 329, category: 'accessoire', target: 'mixte', imageSlug: 'kobo-libra-colour' },
  { name: 'Logitech G915 TKL', description: 'Clavier gaming mécanique sans fil RGB', retail_value: 199, category: 'accessoire', target: 'mixte' },
]

// ============================================
// 50 PRODUITS > 200€
// ============================================
const productsOver200: Product[] = [
  // SMARTPHONES (8)
  { name: 'iPhone 17 Pro', description: 'Puce A19 Pro, caméra 48MP, titane aérospatial', retail_value: 1329, category: 'smartphone', target: 'mixte' },
  { name: 'iPhone 17 Pro Max', description: 'Écran 6.9", batterie 5088mAh, zoom 8x', retail_value: 1479, category: 'smartphone', target: 'mixte' },
  { name: 'Samsung Galaxy S26 Ultra', description: 'S Pen intégré, caméra 200MP, Galaxy AI 2.0', retail_value: 1469, category: 'smartphone', target: 'mixte', imageSlug: 'samsung-galaxy-s26-ultra' },
  { name: 'Samsung Galaxy Z Fold 6', description: 'Pliable écran 7.6" Flex Mode', retail_value: 1899, category: 'smartphone', target: 'mixte', imageSlug: 'samsung-galaxy-z-fold-6' },
  { name: 'Google Pixel 10 Pro', description: 'IA Gemini 2.0, caméra pro 50MP', retail_value: 1099, category: 'smartphone', target: 'mixte', imageSlug: 'google-pixel-10-pro' },
  { name: 'OnePlus 14 Pro', description: 'Snapdragon 8 Elite, charge 150W, Hasselblad', retail_value: 999, category: 'smartphone', target: 'mixte', imageSlug: 'oneplus-14-pro' },
  { name: 'Apple Watch Ultra 3', description: 'GPS satellite, détection hypertension, 42h', retail_value: 899, category: 'wearable', target: 'mixte', imageSlug: 'apple-watch-ultra-3' },
  { name: 'Apple Watch Series 11', description: 'Écran plus grand, détection hypertension', retail_value: 449, category: 'wearable', target: 'mixte', imageSlug: 'apple-watch-series-11' },

  // ORDINATEURS & TABLETTES (8)
  { name: 'MacBook Air 15" M4', description: 'Puce M4, 18h autonomie, Liquid Retina', retail_value: 1499, category: 'ordinateur', target: 'mixte' },
  { name: 'MacBook Pro 14" M5 Pro', description: 'Puce M5 Pro, écran XDR, 16 Go RAM', retail_value: 2399, category: 'ordinateur', target: 'mixte' },
  { name: 'MacBook Pro 16" M5 Max', description: 'Puce M5 Max, performances studio', retail_value: 3199, category: 'ordinateur', target: 'mixte' },
  { name: 'iPad Pro 13" M4', description: 'Écran OLED tandem, puce M4, Wi-Fi 6E', retail_value: 1469, category: 'ordinateur', target: 'mixte', imageSlug: 'ipad-pro-13-m4' },
  { name: 'iPad Air M3', description: 'Puce M3, Magic Keyboard compatible', retail_value: 719, category: 'ordinateur', target: 'mixte', imageSlug: 'ipad-air-m3' },
  { name: 'iMac 24" M4', description: 'Tout-en-un coloré, écran 4.5K P3', retail_value: 1499, category: 'ordinateur', target: 'mixte', imageSlug: 'imac-24-m4' },
  { name: 'ASUS ROG Strix G18', description: 'PC gaming RTX 4080, écran 240Hz', retail_value: 2499, category: 'ordinateur', target: 'homme', imageSlug: 'asus-rog-strix-g18' },
  { name: 'ASUS ROG Ally X', description: 'Console PC portable Ryzen Z1 Extreme', retail_value: 799, category: 'gaming', target: 'homme', imageSlug: 'asus-rog-ally-x' },

  // CONSOLES & VR (6)
  { name: 'PlayStation 5 Pro', description: 'Console 8K, ray tracing avancé, 2To SSD', retail_value: 799, category: 'gaming', target: 'mixte' },
  { name: 'Xbox Series X 2TB', description: 'Console Microsoft Galaxy Black édition', retail_value: 599, category: 'gaming', target: 'mixte' },
  { name: 'Nintendo Switch 2', description: 'Console hybride 4K, écran 7.9" 120Hz LCD', retail_value: 469, category: 'gaming', target: 'mixte' },
  { name: 'Steam Deck OLED 1TB', description: 'PC gaming portable OLED HDR 90Hz', retail_value: 649, category: 'gaming', target: 'homme' },
  { name: 'Meta Quest 4', description: 'Casque VR/MR autonome Snapdragon XR2 Gen 2', retail_value: 499, category: 'gaming', target: 'mixte', imageSlug: 'meta-quest-4' },
  { name: 'PlayStation 5 Slim', description: 'Console PS5 compacte 1To lecteur UHD', retail_value: 449, category: 'gaming', target: 'mixte', imageSlug: 'playstation-5-slim' },

  // AUDIO PREMIUM (6)
  { name: 'AirPods Pro 3', description: 'ANC 2x amélioré, audio spatial, fréquence cardiaque', retail_value: 279, category: 'audio', target: 'mixte' },
  { name: 'AirPods Max 2', description: 'Casque Apple Hi-Fi USB-C, audio spatial H2', retail_value: 579, category: 'audio', target: 'mixte', imageSlug: 'airpods-max-2' },
  { name: 'Sony WH-1000XM6', description: 'Casque ANC QN3, 12 micros, 30h autonomie', retail_value: 450, category: 'audio', target: 'mixte' },
  { name: 'Bose QuietComfort Ultra 2', description: 'Casque ANC 2e gen, audio USB-C sans perte', retail_value: 449, category: 'audio', target: 'mixte' },
  { name: 'Dyson V20 Detect', description: 'Aspirateur sans fil laser détection poussière', retail_value: 699, category: 'maison', target: 'mixte', imageSlug: 'dyson-v20-detect' },
  { name: 'Sonos Arc Ultra', description: 'Barre de son Dolby Atmos premium', retail_value: 999, category: 'audio', target: 'mixte', imageSlug: 'sonos-arc-ultra' },

  // MONTRES & ACCESSOIRES (6)
  { name: 'Samsung Galaxy Watch 8 Classic', description: 'Lunette rotative, Galaxy AI santé', retail_value: 449, category: 'wearable', target: 'mixte', imageSlug: 'samsung-galaxy-watch-8-classic' },
  { name: 'Garmin Fenix 8 Pro', description: 'GPS multisports AMOLED solaire, lampe LED', retail_value: 999, category: 'wearable', target: 'homme', imageSlug: 'garmin-fenix-8-pro' },
  { name: 'Apple Pencil Pro', description: 'Stylet Apple avec squeeze et barrel roll', retail_value: 249, category: 'accessoire', target: 'mixte', imageSlug: 'apple-pencil-pro' },
  { name: 'Apple Magic Keyboard iPad', description: 'Clavier trackpad rétroéclairé pour iPad Pro', retail_value: 379, category: 'accessoire', target: 'mixte', imageSlug: 'apple-magic-keyboard-ipad' },
  { name: 'Dyson Pure Cool Me', description: 'Purificateur d\'air personnel compact', retail_value: 349, category: 'maison', target: 'mixte', imageSlug: 'dyson-pure-cool-me' },
  { name: 'VanMoof S6', description: 'Vélo électrique connecté design hollandais', retail_value: 2998, category: 'mobilite', target: 'mixte', imageSlug: 'vanmoof-s6' },

  // PHOTO & DRONES (4)
  { name: 'GoPro Hero 14 Black', description: 'Action cam 5.3K60, stabilisation HyperSmooth', retail_value: 449, category: 'photo', target: 'mixte', imageSlug: 'gopro-hero-14-black' },
  { name: 'DJI Mini 5 Pro', description: 'Drone <249g capteur 1 pouce, LiDAR', retail_value: 769, category: 'photo', target: 'mixte' },
  { name: 'DJI Mavic 4 Pro', description: 'Drone pro caméra Hasselblad 8K', retail_value: 1599, category: 'photo', target: 'mixte' },
  { name: 'DJI Osmo Pocket 4', description: 'Caméra gimbal 4K HDR vlog', retail_value: 529, category: 'photo', target: 'mixte' },

  // BEAUTÉ & MAISON TECH (3)
  { name: 'Dyson Airwrap Complete Long', description: 'Coiffeur multi-embouts effet Coanda', retail_value: 549, category: 'beaute', target: 'femme', imageSlug: 'dyson-airwrap-complete-long' },
  { name: 'Dyson Airstrait', description: 'Lisseur à air sans chaleur extrême', retail_value: 449, category: 'beaute', target: 'femme', imageSlug: 'dyson-airstrait' },
  { name: 'Thermomix TM7', description: 'Robot cuiseur multifonction connecté', retail_value: 1499, category: 'maison', target: 'mixte', imageSlug: 'thermomix-tm7' },

  // TV & PHOTO (6)
  { name: 'LG OLED G4 65"', description: 'TV OLED evo 4K 120Hz Dolby Vision', retail_value: 2499, category: 'tv', target: 'mixte', imageSlug: 'lg-oled-g4-65' },
  { name: 'Samsung QN95D 55"', description: 'TV Neo QLED 4K 144Hz gaming', retail_value: 1999, category: 'tv', target: 'mixte', imageSlug: 'samsung-qn95d-55' },
  { name: 'Sony Bravia 9 55"', description: 'TV Mini LED XR cognitive processor', retail_value: 2299, category: 'tv', target: 'mixte', imageSlug: 'sony-bravia-9-55' },
  { name: 'Sony Alpha 7 V', description: 'Hybride plein format IA reconnaissance', retail_value: 2999, category: 'photo', target: 'mixte', imageSlug: 'sony-alpha-7-v' },
  { name: 'Canon EOS R8', description: 'Hybride plein format compact vidéo 4K', retail_value: 1699, category: 'photo', target: 'mixte', imageSlug: 'canon-eos-r8' },
  { name: 'DJI Avata 3', description: 'Drone FPV immersif stabilisé', retail_value: 1099, category: 'photo', target: 'mixte', imageSlug: 'dji-avata-3' },

  // MOBILITÉ (3)
  { name: 'Xiaomi Electric Scooter 5 Pro', description: 'Trottinette 25km/h autonomie 60km', retail_value: 649, category: 'mobilite', target: 'mixte', imageSlug: 'xiaomi-electric-scooter-5-pro' },
  { name: 'Segway Ninebot Max G3', description: 'Trottinette premium longue autonomie 65km', retail_value: 899, category: 'mobilite', target: 'mixte', imageSlug: 'segway-ninebot-max-g3' },
  { name: 'Ledger Nano X', description: 'Wallet crypto hardware Bluetooth sécurisé', retail_value: 149, category: 'accessoire', target: 'mixte', imageSlug: 'cowboy-5' },
]

const allProducts = [...productsUnder200, ...productsOver200]

async function seedItems() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🗑️  Suppression des anciens items...')
  await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('📦 Insertion de 100 nouveaux produits...')

  const items = allProducts.map(p => {
    const slug = p.imageSlug || toImageSlug(p.name)
    return {
      name: p.name,
      description: p.description,
      image_url: `/products/${slug}-neon.png`,
      retail_value: p.retail_value,
      is_active: true,
    }
  })

  const { error } = await supabase.from('items').insert(items)

  if (error) {
    console.error('❌ Erreur:', error)
    return
  }

  console.log('✅ 100 produits insérés avec succès!')
  console.log(`   - ${productsUnder200.length} produits < 200€`)
  console.log(`   - ${productsOver200.length} produits > 200€`)

  // Stats par catégorie
  const categories = allProducts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n📊 Répartition par catégorie:')
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count}`)
  })

  // Stats par cible
  const targets = allProducts.reduce((acc, p) => {
    acc[p.target] = (acc[p.target] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n👥 Répartition par cible:')
  Object.entries(targets).forEach(([target, count]) => {
    console.log(`   - ${target}: ${count}`)
  })
}

seedItems()
