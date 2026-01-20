import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// SVG products disponibles localement
const LOCAL_PRODUCTS = [
  '/products/iphone-15-pro.svg',
  '/products/ps5.svg',
  '/products/macbook-pro.svg',
  '/products/airpods-pro.svg',
  '/products/apple-watch.svg',
  '/products/ipad-pro.svg',
  '/products/nintendo-switch.svg',
  '/products/xbox-series-x.svg',
  '/products/samsung-galaxy.svg',
  '/products/dyson-vacuum.svg',
  '/products/dji-drone.svg',
  '/products/gopro-hero.svg',
  '/products/sony-headphones.svg',
  '/products/bose-speaker.svg',
  '/products/gaming-keyboard.svg',
  '/products/gaming-mouse.svg',
  '/products/samsung-tv.svg',
  '/products/meta-quest.svg',
  '/products/rolex-watch.svg',
  '/products/louis-vuitton-bag.svg',
  '/products/nike-jordan.svg',
  '/products/canon-camera.svg',
  '/products/jbl-speaker.svg',
  '/products/steam-deck.svg',
  '/products/rayban-smart.svg',
  '/products/tesla-model.svg',
  '/products/gift-card.svg',
  '/products/gaming-chair.svg',
  '/products/gaming-monitor.svg',
  '/products/electric-scooter.svg',
  // New products
  '/products/google-pixel.svg',
  '/products/imac.svg',
  '/products/gaming-laptop.svg',
  '/products/airpods-max.svg',
  '/products/sonos-speaker.svg',
  '/products/garmin-watch.svg',
  '/products/sony-camera.svg',
  '/products/soundbar.svg',
  '/products/electric-bike.svg',
  '/products/vespa.svg',
  '/products/electric-moto.svg',
  '/products/thermomix.svg',
  '/products/dyson-airwrap.svg',
  '/products/lg-tv.svg',
  '/products/ps5-controller.svg',
]

function getProductImage(itemName: string, itemId: string): { svg: string; matched: boolean } {
  const nameLower = itemName.toLowerCase()

  // Apple products
  if (nameLower.includes('iphone')) return { svg: '/products/iphone-15-pro.svg', matched: true }
  if (nameLower.includes('macbook')) return { svg: '/products/macbook-pro.svg', matched: true }
  if (nameLower.includes('airpods max')) return { svg: '/products/airpods-max.svg', matched: true }
  if (nameLower.includes('airpods')) return { svg: '/products/airpods-pro.svg', matched: true }
  if (nameLower.includes('ipad')) return { svg: '/products/ipad-pro.svg', matched: true }
  if (nameLower.includes('apple watch')) return { svg: '/products/apple-watch.svg', matched: true }
  if (nameLower.includes('imac')) return { svg: '/products/imac.svg', matched: true }

  // Google products
  if (nameLower.includes('pixel') || nameLower.includes('google'))
    return { svg: '/products/google-pixel.svg', matched: true }

  // Gaming consoles & accessories
  if (nameLower.includes('dualsense') || nameLower.includes('manette ps5') || nameLower.includes('controller ps5'))
    return { svg: '/products/ps5-controller.svg', matched: true }
  if (nameLower.includes('playstation') || nameLower.includes('ps5'))
    return { svg: '/products/ps5.svg', matched: true }
  if (nameLower.includes('xbox')) return { svg: '/products/xbox-series-x.svg', matched: true }
  if (nameLower.includes('nintendo') || nameLower.includes('switch'))
    return { svg: '/products/nintendo-switch.svg', matched: true }
  if (nameLower.includes('steam deck')) return { svg: '/products/steam-deck.svg', matched: true }
  if (nameLower.includes('quest') || nameLower.includes('vr') || nameLower.includes('meta'))
    return { svg: '/products/meta-quest.svg', matched: true }

  // Gaming laptops / PC
  if (nameLower.includes('rog') || nameLower.includes('asus') || nameLower.includes('gaming laptop') || nameLower.includes('razer') || nameLower.includes('alienware'))
    return { svg: '/products/gaming-laptop.svg', matched: true }

  // TVs - specific brands first
  if (nameLower.includes('lg') && (nameLower.includes('tv') || nameLower.includes('oled')))
    return { svg: '/products/lg-tv.svg', matched: true }
  if (nameLower.includes('samsung') && nameLower.includes('tv'))
    return { svg: '/products/samsung-tv.svg', matched: true }
  if (nameLower.includes('sony') && (nameLower.includes('bravia') || nameLower.includes('tv')))
    return { svg: '/products/samsung-tv.svg', matched: true }

  // Samsung phones
  if (nameLower.includes('samsung') || nameLower.includes('galaxy'))
    return { svg: '/products/samsung-galaxy.svg', matched: true }

  // Audio - specific products first
  if (nameLower.includes('sonos')) return { svg: '/products/sonos-speaker.svg', matched: true }
  if (nameLower.includes('soundbar') || nameLower.includes('barre de son') || nameLower.includes('arc'))
    return { svg: '/products/soundbar.svg', matched: true }
  if (nameLower.includes('marshall')) return { svg: '/products/bose-speaker.svg', matched: true }
  if (nameLower.includes('sony') && (nameLower.includes('casque') || nameLower.includes('headphone') || nameLower.includes('wh-1000')))
    return { svg: '/products/sony-headphones.svg', matched: true }
  if (nameLower.includes('bose')) return { svg: '/products/bose-speaker.svg', matched: true }
  if (nameLower.includes('jbl')) return { svg: '/products/jbl-speaker.svg', matched: true }

  // Gaming peripherals
  if (nameLower.includes('clavier') || nameLower.includes('keyboard'))
    return { svg: '/products/gaming-keyboard.svg', matched: true }
  if (nameLower.includes('souris') || nameLower.includes('mouse'))
    return { svg: '/products/gaming-mouse.svg', matched: true }
  if (nameLower.includes('chaise') || nameLower.includes('chair') || nameLower.includes('secretlab'))
    return { svg: '/products/gaming-chair.svg', matched: true }
  if (nameLower.includes('ecran') || nameLower.includes('monitor') || nameLower.includes('odyssey'))
    return { svg: '/products/gaming-monitor.svg', matched: true }

  // Camera/Video - specific brands
  if (nameLower.includes('sony') && (nameLower.includes('alpha') || nameLower.includes('a7') || nameLower.includes('camera')))
    return { svg: '/products/sony-camera.svg', matched: true }
  if (nameLower.includes('drone') || nameLower.includes('dji') || nameLower.includes('mavic') || nameLower.includes('avata') || nameLower.includes('pocket'))
    return { svg: '/products/dji-drone.svg', matched: true }
  if (nameLower.includes('gopro') || nameLower.includes('action cam') || nameLower.includes('hero'))
    return { svg: '/products/gopro-hero.svg', matched: true }
  if (nameLower.includes('canon') || nameLower.includes('appareil photo') || nameLower.includes('eos'))
    return { svg: '/products/canon-camera.svg', matched: true }

  // Watches - specific brands
  if (nameLower.includes('garmin') || nameLower.includes('fenix')) return { svg: '/products/garmin-watch.svg', matched: true }
  if (nameLower.includes('apple watch')) return { svg: '/products/apple-watch.svg', matched: true }

  // Lifestyle - Dyson products
  if (nameLower.includes('dyson') && (nameLower.includes('airwrap') || nameLower.includes('coiffure') || nameLower.includes('cheveux')))
    return { svg: '/products/dyson-airwrap.svg', matched: true }
  if (nameLower.includes('dyson') || nameLower.includes('aspirateur'))
    return { svg: '/products/dyson-vacuum.svg', matched: true }

  // Kitchen appliances
  if (nameLower.includes('thermomix') || nameLower.includes('vorwerk') || nameLower.includes('robot cuisine'))
    return { svg: '/products/thermomix.svg', matched: true }

  // Electric mobility - specific first
  if (nameLower.includes('vespa')) return { svg: '/products/vespa.svg', matched: true }
  if (nameLower.includes('bmw ce') || nameLower.includes('zero') || nameLower.includes('moto électrique') || nameLower.includes('moto electrique') || nameLower.includes('sr/f'))
    return { svg: '/products/electric-moto.svg', matched: true }
  if (nameLower.includes('vanmoof') || nameLower.includes('cowboy') || nameLower.includes('vélo électrique') || nameLower.includes('velo electrique') || nameLower.includes('e-bike'))
    return { svg: '/products/electric-bike.svg', matched: true }
  if (nameLower.includes('tesla') || nameLower.includes('voiture') || nameLower.includes('model car'))
    return { svg: '/products/tesla-model.svg', matched: true }
  if (nameLower.includes('trottinette') || nameLower.includes('scooter') || nameLower.includes('ninebot') || nameLower.includes('segway') || nameLower.includes('xiaomi'))
    return { svg: '/products/electric-scooter.svg', matched: true }

  // Fashion/Luxury
  if (nameLower.includes('rolex') || nameLower.includes('submariner') || (nameLower.includes('montre') && !nameLower.includes('apple') && !nameLower.includes('garmin') && !nameLower.includes('samsung')))
    return { svg: '/products/rolex-watch.svg', matched: true }
  if (nameLower.includes('louis vuitton') || nameLower.includes('neverfull') || nameLower.includes('sac'))
    return { svg: '/products/louis-vuitton-bag.svg', matched: true }
  if (nameLower.includes('jordan') || nameLower.includes('nike') || nameLower.includes('sneaker') || nameLower.includes('air'))
    return { svg: '/products/nike-jordan.svg', matched: true }
  if (nameLower.includes('ray-ban') || nameLower.includes('wayfarer') || nameLower.includes('lunettes'))
    return { svg: '/products/rayban-smart.svg', matched: true }

  // Gift cards
  if (nameLower.includes('carte') || nameLower.includes('gift') || nameLower.includes('bon') || nameLower.includes('amazon'))
    return { svg: '/products/gift-card.svg', matched: true }

  // TV fallback
  if (nameLower.includes('tv') || nameLower.includes('television') || nameLower.includes('oled') || nameLower.includes('qled'))
    return { svg: '/products/samsung-tv.svg', matched: true }

  // Watch fallback (after specific checks)
  if (nameLower.includes('watch') || nameLower.includes('montre'))
    return { svg: '/products/rolex-watch.svg', matched: true }

  const hash = itemId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return { svg: LOCAL_PRODUCTS[hash % LOCAL_PRODUCTS.length], matched: false }
}

async function checkMappings() {
  const { data: items, error } = await supabase
    .from('items')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('=== VÉRIFICATION DES MAPPINGS SVG ===\n')

  const unmatched: string[] = []
  const matched: { name: string; svg: string }[] = []

  items.forEach(item => {
    const result = getProductImage(item.name, item.id)
    if (!result.matched) {
      unmatched.push(item.name)
      console.log(`❌ ${item.name} → FALLBACK: ${result.svg}`)
    } else {
      matched.push({ name: item.name, svg: result.svg })
    }
  })

  console.log(`\n=== RÉSUMÉ ===`)
  console.log(`✓ Mappés correctement: ${matched.length}`)
  console.log(`✗ Non mappés (fallback): ${unmatched.length}`)

  if (unmatched.length > 0) {
    console.log('\n=== ITEMS SANS MAPPING ===')
    unmatched.forEach(name => console.log(`- ${name}`))
  }
}

checkMappings()
