/**
 * Script de génération d'images produits avec fond néon cyberpunk
 *
 * Workflow:
 * 1. Catégorise les produits par taille (small/medium/large)
 * 2. Génère des fonds adaptés à chaque catégorie
 * 3. Télécharge les images produits réelles
 * 4. Supprime les fonds (rembg)
 * 5. Compose produit + fond néon
 * 6. Sauvegarde dans public/products/
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

// Config
const PRODUCTS_DIR = path.join(process.cwd(), 'public/products')
const TEMP_DIR = path.join(process.cwd(), 'temp-images')
const OUTPUT_SIZE = 1024

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
const OPENAI_API_KEY = env.OPENAI_API_KEY
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)

// ============================================
// CATÉGORIES DE PRODUITS PAR TAILLE
// ============================================

type ProductSize = 'small' | 'medium' | 'large' | 'xlarge'

const SIZE_CATEGORIES: Record<string, ProductSize> = {
  // SMALL - Accessoires, écouteurs, montres
  'airpods': 'small',
  'airtag': 'small',
  'earbuds': 'small',
  'buds': 'small',
  'watch': 'small',
  'montre': 'small',
  'bracelet': 'small',
  'ring': 'small',
  'souris': 'small',
  'mouse': 'small',
  'manette': 'small',
  'controller': 'small',
  'dualsense': 'small',
  'joycon': 'small',
  'pencil': 'small',
  'stylet': 'small',
  'chargeur': 'small',
  'charger': 'small',
  'power bank': 'small',
  'batterie': 'small',

  // MEDIUM - Téléphones, enceintes, casques, caméras compactes
  'iphone': 'medium',
  'phone': 'medium',
  'pixel': 'medium',
  'galaxy s': 'medium',
  'oneplus': 'medium',
  'smartphone': 'medium',
  'speaker': 'medium',
  'enceinte': 'medium',
  'jbl': 'medium',
  'sonos': 'medium',
  'bose': 'medium',
  'headphones': 'medium',
  'casque': 'medium',
  'wh-1000': 'medium',
  'airpods max': 'medium',
  'gopro': 'medium',
  'action cam': 'medium',
  'kindle': 'medium',
  'liseuse': 'medium',
  'echo': 'medium',
  'homepod': 'medium',
  'nest': 'medium',
  'clavier': 'medium',
  'keyboard': 'medium',
  'stream deck': 'medium',
  'ray-ban': 'medium',
  'lunettes': 'medium',

  // LARGE - Consoles, laptops, tablettes, drones, appareils photo
  'playstation': 'large',
  'ps5': 'large',
  'xbox': 'large',
  'switch': 'large',
  'nintendo': 'large',
  'steam deck': 'large',
  'rog ally': 'large',
  'quest': 'large',
  'vr': 'large',
  'laptop': 'large',
  'macbook': 'large',
  'notebook': 'large',
  'ipad': 'large',
  'tablet': 'large',
  'tablette': 'large',
  'drone': 'large',
  'mavic': 'large',
  'dji': 'large',
  'camera': 'large',
  'appareil photo': 'large',
  'alpha': 'large',
  'canon eos': 'large',
  'nikon': 'large',
  'soundbar': 'large',
  'barre de son': 'large',
  'dyson': 'large',
  'aspirateur': 'large',
  'thermomix': 'large',
  'robot': 'large',
  'airwrap': 'large',

  // XLARGE - TVs, moniteurs, iMac, véhicules électriques
  'tv': 'xlarge',
  'télé': 'xlarge',
  'oled': 'xlarge',
  'qled': 'xlarge',
  'monitor': 'xlarge',
  'écran': 'xlarge',
  'imac': 'xlarge',
  'pc': 'xlarge',
  'desktop': 'xlarge',
  'scooter': 'xlarge',
  'trottinette': 'xlarge',
  'vélo': 'xlarge',
  'bike': 'xlarge',
  'vespa': 'xlarge',
  'moto': 'xlarge',
  'tesla': 'xlarge',
  'gaming chair': 'xlarge',
  'chaise': 'xlarge',
  'fauteuil': 'xlarge',
}

function getProductSize(productName: string): ProductSize {
  const nameLower = productName.toLowerCase()

  for (const [keyword, size] of Object.entries(SIZE_CATEGORIES)) {
    if (nameLower.includes(keyword)) {
      return size
    }
  }

  // Par défaut: medium
  return 'medium'
}

// ============================================
// PROMPTS DE FOND PAR TAILLE
// ============================================

const BACKGROUND_PROMPTS: Record<ProductSize, string> = {
  small: `Empty product photography scene with a small elegant circular pedestal in center,
    ultra minimalist, 4K, dark moody background, subtle pink and purple neon ambient lighting,
    cyberpunk aesthetic, professional studio, reflective glossy black floor,
    intimate close-up scene for small luxury items, no product`,

  medium: `Empty product photography background with sleek black glossy pedestal in center,
    4K ultra-detailed, dark moody atmosphere, dramatic pink and purple neon rim lighting from sides,
    cyberpunk aesthetic, professional studio lighting, reflective glossy floor surface,
    volumetric light rays, medium-sized display platform, no product just the scene`,

  large: `Empty product photography studio with wide black glossy display platform in center,
    4K cinematic, dark moody atmosphere, dramatic pink and purple neon lighting,
    cyberpunk futuristic aesthetic, professional studio setup, large reflective floor,
    volumetric fog effects, spacious scene for large electronics, no product`,

  xlarge: `Empty product photography studio with extra wide sleek platform,
    4K cinematic wide shot, very dark moody atmosphere, dramatic pink purple and blue neon accents,
    cyberpunk futuristic showroom aesthetic, professional lighting rig,
    large reflective floor extending to edges, ambient fog, spacious scene for large items, no product`
}

// Paramètres de composition par taille
const COMPOSITION_PARAMS: Record<ProductSize, {
  productScale: number,  // % de la largeur du fond
  yPosition: number,     // % depuis le haut
  paddingBottom: number  // espace sous le produit en %
}> = {
  small:  { productScale: 0.35, yPosition: 0.25, paddingBottom: 0.15 },
  medium: { productScale: 0.55, yPosition: 0.15, paddingBottom: 0.10 },
  large:  { productScale: 0.70, yPosition: 0.10, paddingBottom: 0.08 },
  xlarge: { productScale: 0.85, yPosition: 0.05, paddingBottom: 0.05 },
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============================================
// GÉNÉRATION DE FOND AVEC DALL-E 3
// ============================================

async function generateBackground(size: ProductSize): Promise<string> {
  const prompt = BACKGROUND_PROMPTS[size]

  console.log(`  🎨 Génération fond ${size}...`)

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd'
    })
  })

  const result = await response.json()

  if (result.error) {
    throw new Error(`DALL-E error: ${result.error.message}`)
  }

  return result.data[0].url
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  fs.writeFileSync(outputPath, Buffer.from(buffer))
}

// ============================================
// RECHERCHE D'IMAGE PRODUIT
// ============================================

interface ProductImageSource {
  name: string
  searchUrl: (query: string) => string
}

async function findProductImage(productName: string): Promise<string | null> {
  // Pour l'instant, on utilise les URLs Unsplash déjà dans la DB
  // ou on peut chercher sur les sites officiels

  const searchQuery = encodeURIComponent(productName + ' product photo transparent background')

  // Essayer de trouver une image via une recherche
  // Pour ce script, on va utiliser les images existantes ou générer des placeholders

  console.log(`  🔍 Recherche image pour: ${productName}`)

  // Retourner null pour l'instant - on gèrera les sources d'images manuellement
  return null
}

// ============================================
// SUPPRESSION DE FOND AVEC REMBG
// ============================================

async function removeBackground(inputPath: string, outputPath: string): Promise<void> {
  console.log(`  ✂️  Suppression du fond...`)

  const scriptPath = path.join(process.cwd(), 'scripts/python/remove_bg.py')

  execSync(`python3 "${scriptPath}" "${inputPath}" "${outputPath}"`, {
    encoding: 'utf-8',
    stdio: 'pipe'
  })
}

// ============================================
// COMPOSITION PRODUIT + FOND
// ============================================

async function compositeImage(
  productPath: string,
  backgroundPath: string,
  outputPath: string,
  size: ProductSize
): Promise<void> {
  console.log(`  🖼️  Composition de l'image...`)

  const params = COMPOSITION_PARAMS[size]
  const scriptPath = path.join(process.cwd(), 'scripts/python/composite.py')
  const paramsJson = JSON.stringify(params)

  execSync(`python3 "${scriptPath}" "${productPath}" "${backgroundPath}" "${outputPath}" '${paramsJson}'`, {
    encoding: 'utf-8',
    stdio: 'pipe'
  })
}

// ============================================
// PROCESS PRINCIPAL
// ============================================

interface Product {
  id: string
  name: string
  image_url: string
}

async function processProduct(
  product: Product,
  backgrounds: Record<ProductSize, string>
): Promise<boolean> {
  const slug = slugify(product.name)
  const size = getProductSize(product.name)

  console.log(`\n📦 ${product.name} (${size})`)

  const outputPath = path.join(PRODUCTS_DIR, `${slug}-neon.png`)

  // Vérifier si l'image existe déjà
  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  Image déjà existante, skip`)
    return true
  }

  try {
    // 1. Télécharger l'image source
    const sourcePath = path.join(TEMP_DIR, `${slug}-source.jpg`)

    if (product.image_url && product.image_url.startsWith('http')) {
      console.log(`  ⬇️  Téléchargement de l'image source...`)
      await downloadImage(product.image_url, sourcePath)
    } else {
      console.log(`  ⚠️  Pas d'URL d'image, skip`)
      return false
    }

    // 2. Supprimer le fond
    const transparentPath = path.join(TEMP_DIR, `${slug}-transparent.png`)
    await removeBackground(sourcePath, transparentPath)

    // 3. Composer avec le fond
    await compositeImage(transparentPath, backgrounds[size], outputPath, size)

    console.log(`  ✅ Image générée: ${outputPath}`)
    return true

  } catch (error) {
    console.error(`  ❌ Erreur: ${error}`)
    return false
  }
}

async function main() {
  console.log('🚀 Génération des images produits avec fond néon\n')

  // Créer les dossiers
  ensureDir(TEMP_DIR)
  ensureDir(PRODUCTS_DIR)

  // 1. Générer les fonds pour chaque taille
  console.log('📸 Génération des fonds...\n')

  const backgrounds: Record<ProductSize, string> = {
    small: '',
    medium: '',
    large: '',
    xlarge: ''
  }

  for (const size of ['small', 'medium', 'large', 'xlarge'] as ProductSize[]) {
    const bgPath = path.join(PRODUCTS_DIR, `_background-${size}.png`)

    if (fs.existsSync(bgPath)) {
      console.log(`  ⏭️  Fond ${size} existe déjà`)
      backgrounds[size] = bgPath
    } else {
      const url = await generateBackground(size)
      await downloadImage(url, bgPath)
      backgrounds[size] = bgPath
      console.log(`  ✅ Fond ${size} généré`)

      // Pause pour éviter le rate limiting
      await sleep(2000)
    }
  }

  // 2. Récupérer tous les produits
  console.log('\n📋 Récupération des produits...')

  const { data: products, error } = await supabase
    .from('items')
    .select('id, name, image_url')
    .order('retail_value', { ascending: false })

  if (error || !products) {
    console.error('Erreur récupération produits:', error)
    process.exit(1)
  }

  console.log(`  ${products.length} produits trouvés\n`)

  // 3. Traiter chaque produit
  let success = 0
  let failed = 0

  for (const product of products) {
    const result = await processProduct(product, backgrounds)
    if (result) {
      success++
    } else {
      failed++
    }

    // Pause entre chaque produit
    await sleep(500)
  }

  // 4. Résumé
  console.log('\n' + '='.repeat(50))
  console.log(`✅ Succès: ${success}`)
  console.log(`❌ Échecs: ${failed}`)
  console.log('='.repeat(50))

  // Nettoyage
  // fs.rmSync(TEMP_DIR, { recursive: true, force: true })

  console.log('\n🎉 Terminé!')
}

main().catch(console.error)
