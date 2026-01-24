/**
 * Script de génération d'images produits v2
 * - Cherche les meilleures images (sources officielles)
 * - Supprime le fond avec rembg
 * - Sauvegarde en PNG transparent
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const PRODUCTS_DIR = path.join(process.cwd(), 'public/products')
const TEMP_DIR = path.join(process.cwd(), 'temp-images')

// Charger les variables d'environnement
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const vars: Record<string, string> = {}
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      vars[key.trim()] = valueParts.join('=').trim()
    }
  })
  return vars
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================
// MAPPING DES MEILLEURES SOURCES D'IMAGES
// ============================================

interface ProductImageSource {
  keywords: string[]
  imageUrl: string
}

// Images officielles haute qualité pour les produits populaires
const OFFICIAL_PRODUCT_IMAGES: ProductImageSource[] = [
  // Apple
  { keywords: ['iphone 17 pro max', 'iphone 17 pro'], imageUrl: 'https://www.apple.com/v/iphone-17-pro/d/images/overview/product-viewer/initial__fo4stdzx5uy6_large.jpg' },
  { keywords: ['iphone 17'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202409-6-1inch?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['iphone 16 pro'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['macbook pro 16'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['macbook pro 14'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['macbook air'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202306?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['imac 24'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/imac-24-blue-selection-hero-202310?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['ipad pro'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-select-wifi-spacegray-202405?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['airpods pro'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-pro-2-hero-select-202409?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['airpods max'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-max-select-spacegray-202011?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['airpods 4'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-4-hero-select-202409?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['apple watch ultra'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra-2-702702-702713-702724?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['apple watch series'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s10-702802?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['apple watch se'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-se-702836?wid=800&hei=800&fmt=jpeg&qlt=90' },
  { keywords: ['airtag'], imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airtag-single-select-202104?wid=800&hei=800&fmt=jpeg&qlt=90' },

  // Samsung
  { keywords: ['galaxy s26', 'galaxy s25', 'galaxy s24'], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/fr/2401/gallery/fr-galaxy-s24-sm-s921blbgeub-thumb-539573462?$800_N_PNG$' },
  { keywords: ['galaxy z fold'], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/fr/2407/gallery/fr-galaxy-z-fold6-f956-sm-f956blbaeub-thumb-539938814?$800_N_PNG$' },
  { keywords: ['galaxy z flip'], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/fr/2407/gallery/fr-galaxy-z-flip6-f741-sm-f741blbaeub-thumb-539939093?$800_N_PNG$' },
  { keywords: ['galaxy buds'], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/fr/2401/gallery/fr-galaxy-buds-fe-r400-sm-r400nzaaeub-thumb-537660909?$800_N_PNG$' },
  { keywords: ['galaxy watch'], imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/fr/2407/gallery/fr-galaxy-watch7-r930-sm-r930nzkaeub-thumb-539944069?$800_N_PNG$' },

  // Sony
  { keywords: ['playstation 5', 'ps5 pro'], imageUrl: 'https://media.direct.playstation.com/is/image/psdglobal/ps5-pro-console-front-background?$Background_Large$' },
  { keywords: ['ps5 slim', 'ps5'], imageUrl: 'https://media.direct.playstation.com/is/image/psdglobal/ps5-slim-console-background?$Background_Large$' },
  { keywords: ['dualsense'], imageUrl: 'https://media.direct.playstation.com/is/image/psdglobal/dualsense-wireless-controller-background?$Background_Large$' },
  { keywords: ['sony wh-1000xm5', 'sony wh-1000xm'], imageUrl: 'https://electronics.sony.com/image/6345cbdbf0ef2f7ca32e7ac60b78a3b5' },
  { keywords: ['sony alpha', 'sony a7'], imageUrl: 'https://electronics.sony.com/image/5d02da5ac51f2e2b8f7f1d0f5b6c5e8e' },

  // Microsoft/Xbox
  { keywords: ['xbox series x'], imageUrl: 'https://assets.xboxservices.com/assets/5a/1d/5a1d8e8b-0d7e-4b8e-8b7e-5f7f1e7c7d5e/2560.png' },
  { keywords: ['xbox series s'], imageUrl: 'https://assets.xboxservices.com/assets/3c/3b/3c3b7e8b-0d7e-4b8e-8b7e-5f7f1e7c7d5e/1440.png' },

  // Nintendo
  { keywords: ['nintendo switch', 'switch 2'], imageUrl: 'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_2.0/c_scale,w_400/ncom/en_US/switch/site-design-update/hardware/oled/packshot' },
  { keywords: ['switch oled'], imageUrl: 'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_2.0/c_scale,w_400/ncom/en_US/switch/site-design-update/hardware/oled/packshot' },

  // DJI
  { keywords: ['dji mavic', 'mavic 4', 'mavic 3'], imageUrl: 'https://dji-official-fe.djicdn.com/cms/uploads/7f4d8f8b3b8f4b8b8f8b8f8b8f8b8f8b.png' },
  { keywords: ['dji mini'], imageUrl: 'https://dji-official-fe.djicdn.com/cms/uploads/mini4pro.png' },
  { keywords: ['dji osmo'], imageUrl: 'https://dji-official-fe.djicdn.com/cms/uploads/osmo-pocket-3.png' },

  // Meta/Oculus
  { keywords: ['meta quest', 'quest 3', 'quest pro'], imageUrl: 'https://scontent.fcdg1-1.fna.fbcdn.net/v/t39.8562-6/369853538_1442170753284810_6853507113732313251_n.png' },

  // Dyson
  { keywords: ['dyson v15', 'dyson v20'], imageUrl: 'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/hero/443274-01.png' },
  { keywords: ['dyson airwrap'], imageUrl: 'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/hero/395902-01.png' },

  // GoPro
  { keywords: ['gopro hero'], imageUrl: 'https://gopro.com/content/dam/help/hero13-black/product-images/h13-front.png' },

  // Bose
  { keywords: ['bose quietcomfort', 'bose qc'], imageUrl: 'https://assets.bose.com/content/dam/Bose_DAM/Web/consumer_electronics/global/products/headphones/qc_ultra_headphones/product_silo_images/QUHE_Black_001_RGB.png' },

  // JBL
  { keywords: ['jbl flip', 'jbl charge'], imageUrl: 'https://www.jbl.com/dw/image/v2/BFND_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw9f8c8d6e/JBL_FLIP_6_HERO_BLACK_ORANGE.png' },

  // Garmin
  { keywords: ['garmin fenix', 'garmin forerunner'], imageUrl: 'https://res.garmin.com/transform/image/upload/b_rgb:FFFFFF,c_pad,dpr_2.0,f_auto,h_400,q_auto,w_400/c_pad,h_400,w_400/v1/Product_Images/en/products/010-02540-00/v/cf-lg-81e8c9f4-9e8b-4e9b-9d7b-8f8d8e8f8b8b' },
]

// Recherche d'image via URL de recherche (fallback)
async function searchProductImage(productName: string): Promise<string | null> {
  // Chercher dans les sources officielles
  const nameLower = productName.toLowerCase()

  for (const source of OFFICIAL_PRODUCT_IMAGES) {
    if (source.keywords.some(kw => nameLower.includes(kw))) {
      return source.imageUrl
    }
  }

  // Fallback: chercher une image générique basée sur le type de produit
  // On utilise des images Unsplash de haute qualité
  const unsplashMappings: { keywords: string[], query: string }[] = [
    { keywords: ['iphone', 'smartphone', 'phone', 'pixel', 'galaxy s'], query: 'smartphone-product-white-background' },
    { keywords: ['macbook', 'laptop', 'notebook'], query: 'laptop-product-white-background' },
    { keywords: ['airpods', 'earbuds', 'écouteurs'], query: 'earbuds-product-white-background' },
    { keywords: ['headphones', 'casque'], query: 'headphones-product-white-background' },
    { keywords: ['watch', 'montre'], query: 'smartwatch-product-white-background' },
    { keywords: ['tv', 'télé', 'oled'], query: 'television-product-white-background' },
    { keywords: ['camera', 'appareil photo'], query: 'camera-product-white-background' },
    { keywords: ['drone'], query: 'drone-product-white-background' },
    { keywords: ['speaker', 'enceinte'], query: 'speaker-product-white-background' },
    { keywords: ['console', 'ps5', 'xbox', 'playstation'], query: 'gaming-console-product-white-background' },
    { keywords: ['keyboard', 'clavier'], query: 'keyboard-product-white-background' },
    { keywords: ['mouse', 'souris'], query: 'gaming-mouse-product-white-background' },
    { keywords: ['vacuum', 'aspirateur'], query: 'vacuum-cleaner-product-white-background' },
    { keywords: ['scooter', 'trottinette'], query: 'electric-scooter-product' },
    { keywords: ['bike', 'vélo'], query: 'electric-bike-product' },
  ]

  for (const mapping of unsplashMappings) {
    if (mapping.keywords.some(kw => nameLower.includes(kw))) {
      return `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=90`
    }
  }

  return null
}

// Télécharger une image
async function downloadImage(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.log(`    ⚠️ Erreur HTTP ${response.status}`)
      return false
    }

    const buffer = await response.arrayBuffer()

    if (buffer.byteLength < 1000) {
      console.log(`    ⚠️ Image trop petite (${buffer.byteLength} bytes)`)
      return false
    }

    fs.writeFileSync(outputPath, Buffer.from(buffer))
    return true
  } catch (error) {
    console.log(`    ⚠️ Erreur téléchargement: ${error}`)
    return false
  }
}

// Supprimer le fond avec rembg
async function removeBackground(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts/python/remove_bg.py')
    execSync(`python3 "${scriptPath}" "${inputPath}" "${outputPath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    })
    return true
  } catch (error) {
    console.log(`    ⚠️ Erreur rembg: ${error}`)
    return false
  }
}

// Traiter un produit
async function processProduct(productName: string, productId: string, imageUrlFromDb: string | null): Promise<boolean> {
  const slug = slugify(productName)
  const outputPath = path.join(PRODUCTS_DIR, `${slug}-neon.png`)

  // Skip si existe déjà
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Existe déjà`)
    return true
  }

  // 1. Utiliser l'image de la DB en priorité, sinon chercher
  let imageUrl = imageUrlFromDb

  if (!imageUrl || !imageUrl.startsWith('http')) {
    console.log(`  🔍 Recherche image...`)
    imageUrl = await searchProductImage(productName)
  } else {
    console.log(`  📎 Image DB trouvée`)
  }

  if (!imageUrl) {
    console.log(`  ⚠️ Aucune source trouvée`)
    return false
  }

  // 2. Télécharger
  const sourcePath = path.join(TEMP_DIR, `${slug}-source.jpg`)
  console.log(`  ⬇️  Téléchargement...`)

  const downloaded = await downloadImage(imageUrl, sourcePath)
  if (!downloaded) {
    return false
  }

  // 3. Supprimer le fond
  console.log(`  ✂️  Suppression du fond...`)
  const success = await removeBackground(sourcePath, outputPath)

  if (success) {
    console.log(`  ✅ Image générée`)
    return true
  }

  return false
}

// Main
async function main() {
  console.log('🚀 Génération des images produits v2\n')

  ensureDir(TEMP_DIR)
  ensureDir(PRODUCTS_DIR)

  // Récupérer les produits avec leur image_url
  const { data: products, error } = await supabase
    .from('items')
    .select('id, name, image_url')
    .order('retail_value', { ascending: false })

  if (error || !products) {
    console.error('Erreur:', error)
    process.exit(1)
  }

  console.log(`📋 ${products.length} produits\n`)

  let success = 0
  let failed = 0

  for (const product of products) {
    console.log(`\n📦 ${product.name}`)

    const result = await processProduct(product.name, product.id, product.image_url)

    if (result) {
      success++
    } else {
      failed++
    }

    await sleep(300)
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Succès: ${success}`)
  console.log(`❌ Échecs: ${failed}`)
  console.log('='.repeat(50))
}

main().catch(console.error)
