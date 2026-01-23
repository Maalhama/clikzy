/**
 * Centralized product-to-SVG mapping utility
 * Used across: Lobby (GameCard), Game page, Landing page (PrizeCarousel, FloatingPrizes)
 */

// Liste des SVG produits disponibles localement
export const LOCAL_PRODUCTS = [
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
] as const

// Mapping des noms de produits vers les SVG (dictionnaire pour lookup rapide)
const PRODUCT_SVG_MAP: Record<string, string> = {
  // ============ SMARTPHONES ============
  'iphone 17 pro max': '/products/iphone-15-pro.svg',
  'iphone 17 pro': '/products/iphone-15-pro.svg',
  'iphone 17': '/products/iphone-15-pro.svg',
  'iphone': '/products/iphone-15-pro.svg',
  'samsung galaxy s26 ultra': '/products/samsung-galaxy.svg',
  'samsung galaxy z fold 6': '/products/samsung-galaxy.svg',
  'samsung galaxy z fold': '/products/samsung-galaxy.svg',
  'samsung galaxy': '/products/samsung-galaxy.svg',
  'galaxy s26': '/products/samsung-galaxy.svg',
  'galaxy z fold': '/products/samsung-galaxy.svg',
  'google pixel 10 pro': '/products/google-pixel.svg',
  'google pixel': '/products/google-pixel.svg',
  'pixel': '/products/google-pixel.svg',
  'oneplus 14 pro': '/products/samsung-galaxy.svg',
  'oneplus': '/products/samsung-galaxy.svg',

  // ============ GAMING CONSOLES ============
  'playstation 5 pro': '/products/ps5.svg',
  'playstation 5 slim': '/products/ps5.svg',
  'playstation 5': '/products/ps5.svg',
  'playstation': '/products/ps5.svg',
  'ps5': '/products/ps5.svg',
  'xbox series x 2tb': '/products/xbox-series-x.svg',
  'xbox series x': '/products/xbox-series-x.svg',
  'xbox series s': '/products/xbox-series-x.svg',
  'xbox': '/products/xbox-series-x.svg',
  'manette xbox': '/products/xbox-series-x.svg',
  'nintendo switch 2': '/products/nintendo-switch.svg',
  'nintendo switch': '/products/nintendo-switch.svg',
  'nintendo': '/products/nintendo-switch.svg',
  'switch': '/products/nintendo-switch.svg',
  'steam deck oled 1tb': '/products/steam-deck.svg',
  'steam deck oled': '/products/steam-deck.svg',
  'steam deck': '/products/steam-deck.svg',
  'asus rog ally x': '/products/steam-deck.svg',
  'rog ally': '/products/steam-deck.svg',
  'meta quest 4': '/products/meta-quest.svg',
  'meta quest': '/products/meta-quest.svg',
  'quest': '/products/meta-quest.svg',
  'oculus': '/products/meta-quest.svg',
  'manette ps5 dualsense edge': '/products/ps5-controller.svg',
  'manette ps5 dualsense': '/products/ps5-controller.svg',
  'manette ps5': '/products/ps5-controller.svg',
  'dualsense': '/products/ps5-controller.svg',

  // ============ ORDINATEURS & TABLETTES ============
  'macbook pro 16" m5 max': '/products/macbook-pro.svg',
  'macbook pro 14" m5 pro': '/products/macbook-pro.svg',
  'macbook pro 16"': '/products/macbook-pro.svg',
  'macbook pro 14"': '/products/macbook-pro.svg',
  'macbook pro': '/products/macbook-pro.svg',
  'macbook air 15" m4': '/products/macbook-pro.svg',
  'macbook air 15"': '/products/macbook-pro.svg',
  'macbook air': '/products/macbook-pro.svg',
  'macbook': '/products/macbook-pro.svg',
  'ipad pro 13" m4': '/products/ipad-pro.svg',
  'ipad pro 13"': '/products/ipad-pro.svg',
  'ipad pro': '/products/ipad-pro.svg',
  'ipad air m3': '/products/ipad-pro.svg',
  'ipad air': '/products/ipad-pro.svg',
  'ipad': '/products/ipad-pro.svg',
  'imac 24" m4': '/products/imac.svg',
  'imac 24"': '/products/imac.svg',
  'imac': '/products/imac.svg',
  'asus rog strix g18': '/products/gaming-laptop.svg',
  'asus rog strix': '/products/gaming-laptop.svg',
  'asus rog zephyrus': '/products/gaming-laptop.svg',
  'asus rog': '/products/gaming-laptop.svg',
  'rog strix': '/products/gaming-laptop.svg',
  'rog zephyrus': '/products/gaming-laptop.svg',
  'pc portable gaming': '/products/gaming-laptop.svg',
  'pc portable gamer': '/products/gaming-laptop.svg',
  'gaming laptop': '/products/gaming-laptop.svg',

  // ============ AUDIO ============
  'airpods pro 3': '/products/airpods-pro.svg',
  'airpods pro': '/products/airpods-pro.svg',
  'airpods 4': '/products/airpods-pro.svg',
  'airpods': '/products/airpods-pro.svg',
  'airpods max 2': '/products/airpods-max.svg',
  'airpods max': '/products/airpods-max.svg',
  'sony wh-1000xm6': '/products/sony-headphones.svg',
  'sony wh-1000xm5': '/products/sony-headphones.svg',
  'sony wf-1000xm5': '/products/airpods-pro.svg',
  'sony wh-ch720n': '/products/sony-headphones.svg',
  'sony wh': '/products/sony-headphones.svg',
  'casque sony': '/products/sony-headphones.svg',
  'bose quietcomfort ultra 2': '/products/bose-speaker.svg',
  'bose quietcomfort ultra': '/products/bose-speaker.svg',
  'bose quietcomfort': '/products/bose-speaker.svg',
  'bose soundlink flex': '/products/bose-speaker.svg',
  'bose': '/products/bose-speaker.svg',
  'sonos era 500': '/products/sonos-speaker.svg',
  'sonos era': '/products/sonos-speaker.svg',
  'sonos arc ultra': '/products/soundbar.svg',
  'sonos arc': '/products/soundbar.svg',
  'sonos roam 2': '/products/sonos-speaker.svg',
  'sonos': '/products/sonos-speaker.svg',
  'marshall stanmore iv': '/products/jbl-speaker.svg',
  'marshall stanmore': '/products/jbl-speaker.svg',
  'marshall emberton iii': '/products/jbl-speaker.svg',
  'marshall': '/products/jbl-speaker.svg',
  'jbl flip 7': '/products/jbl-speaker.svg',
  'jbl charge 6': '/products/jbl-speaker.svg',
  'jbl tune 770nc': '/products/sony-headphones.svg',
  'jbl': '/products/jbl-speaker.svg',
  'beats studio buds': '/products/airpods-pro.svg',
  'beats': '/products/airpods-pro.svg',
  'ultimate ears boom 4': '/products/jbl-speaker.svg',
  'ultimate ears': '/products/jbl-speaker.svg',
  'samsung galaxy buds 3': '/products/airpods-pro.svg',
  'galaxy buds': '/products/airpods-pro.svg',
  'barre de son': '/products/soundbar.svg',
  'soundbar': '/products/soundbar.svg',

  // ============ MONTRES & WEARABLES ============
  'apple watch ultra 3': '/products/apple-watch.svg',
  'apple watch ultra': '/products/apple-watch.svg',
  'apple watch series 11': '/products/apple-watch.svg',
  'apple watch series': '/products/apple-watch.svg',
  'apple watch se 2': '/products/apple-watch.svg',
  'apple watch se': '/products/apple-watch.svg',
  'apple watch': '/products/apple-watch.svg',
  'samsung galaxy watch 8 classic': '/products/garmin-watch.svg',
  'samsung galaxy watch 8': '/products/garmin-watch.svg',
  'samsung galaxy watch fe': '/products/garmin-watch.svg',
  'samsung galaxy watch': '/products/garmin-watch.svg',
  'galaxy watch': '/products/garmin-watch.svg',
  'garmin fenix 8 pro': '/products/garmin-watch.svg',
  'garmin fenix 8': '/products/garmin-watch.svg',
  'garmin fenix': '/products/garmin-watch.svg',
  'garmin venu sq 3': '/products/garmin-watch.svg',
  'garmin': '/products/garmin-watch.svg',
  'amazfit gtr 5': '/products/garmin-watch.svg',
  'amazfit': '/products/garmin-watch.svg',
  'fitbit sense 3': '/products/garmin-watch.svg',
  'fitbit': '/products/garmin-watch.svg',
  'xiaomi smart band 9': '/products/garmin-watch.svg',
  'huawei watch fit 4': '/products/garmin-watch.svg',
  'whoop 5.0': '/products/garmin-watch.svg',
  'whoop': '/products/garmin-watch.svg',

  // ============ PHOTO & VIDEO ============
  'sony alpha 7 v': '/products/sony-camera.svg',
  'sony alpha 7': '/products/sony-camera.svg',
  'sony alpha': '/products/sony-camera.svg',
  'canon eos r8': '/products/canon-camera.svg',
  'canon eos': '/products/canon-camera.svg',
  'canon': '/products/canon-camera.svg',
  'gopro hero 14 black': '/products/gopro-hero.svg',
  'gopro hero 14': '/products/gopro-hero.svg',
  'gopro hero': '/products/gopro-hero.svg',
  'gopro': '/products/gopro-hero.svg',
  'dji osmo pocket 4': '/products/sony-camera.svg',
  'dji osmo pocket': '/products/sony-camera.svg',
  'dji pocket': '/products/sony-camera.svg',
  'appareil photo': '/products/sony-camera.svg',

  // ============ DRONES ============
  'dji mavic 4 pro': '/products/dji-drone.svg',
  'dji mavic 4': '/products/dji-drone.svg',
  'dji mavic': '/products/dji-drone.svg',
  'dji mini 5 pro': '/products/dji-drone.svg',
  'dji mini 5': '/products/dji-drone.svg',
  'dji mini': '/products/dji-drone.svg',
  'dji avata 3': '/products/dji-drone.svg',
  'dji avata': '/products/dji-drone.svg',
  'dji': '/products/dji-drone.svg',
  'drone': '/products/dji-drone.svg',

  // ============ TV & HOME CINEMA ============
  'lg oled g4 65"': '/products/lg-tv.svg',
  'lg oled g4': '/products/lg-tv.svg',
  'lg oled': '/products/lg-tv.svg',
  'lg tv': '/products/lg-tv.svg',
  'tv lg': '/products/lg-tv.svg',
  'samsung qn95d 55"': '/products/samsung-tv.svg',
  'samsung qn95d': '/products/samsung-tv.svg',
  'samsung tv': '/products/samsung-tv.svg',
  'tv samsung': '/products/samsung-tv.svg',
  'sony bravia 9 55"': '/products/lg-tv.svg',
  'sony bravia 9': '/products/lg-tv.svg',
  'sony bravia': '/products/lg-tv.svg',
  'bravia': '/products/lg-tv.svg',

  // ============ MOBILITÉ ÉLECTRIQUE ============
  'xiaomi electric scooter 5 pro': '/products/electric-scooter.svg',
  'xiaomi electric scooter': '/products/electric-scooter.svg',
  'xiaomi scooter': '/products/electric-scooter.svg',
  'segway ninebot max g3': '/products/electric-scooter.svg',
  'segway ninebot max': '/products/electric-scooter.svg',
  'segway ninebot': '/products/electric-scooter.svg',
  'segway': '/products/electric-scooter.svg',
  'ninebot': '/products/electric-scooter.svg',
  'trottinette': '/products/electric-scooter.svg',
  'scooter électrique': '/products/electric-scooter.svg',
  'vanmoof s6': '/products/electric-bike.svg',
  'vanmoof': '/products/electric-bike.svg',
  'cowboy 5': '/products/electric-bike.svg',
  'cowboy': '/products/electric-bike.svg',
  'vélo électrique': '/products/electric-bike.svg',
  'velo electrique': '/products/electric-bike.svg',
  'vélo': '/products/electric-bike.svg',
  'velo': '/products/electric-bike.svg',

  // ============ MOTOS & SCOOTERS ============
  'vespa elettrica': '/products/vespa.svg',
  'vespa': '/products/vespa.svg',
  'bmw ce 04': '/products/electric-moto.svg',
  'bmw ce': '/products/electric-moto.svg',
  'bmw moto': '/products/electric-moto.svg',
  'zero sr/f': '/products/electric-moto.svg',
  'zero sr': '/products/electric-moto.svg',
  'zero moto': '/products/electric-moto.svg',
  'moto électrique': '/products/electric-moto.svg',
  'moto electrique': '/products/electric-moto.svg',
  'moto': '/products/electric-moto.svg',
  'scooter': '/products/vespa.svg',

  // ============ ÉLECTROMÉNAGER PREMIUM ============
  'dyson v20 detect': '/products/dyson-vacuum.svg',
  'dyson v20': '/products/dyson-vacuum.svg',
  'dyson v15': '/products/dyson-vacuum.svg',
  'dyson pure cool me': '/products/dyson-vacuum.svg',
  'aspirateur dyson': '/products/dyson-vacuum.svg',
  'aspirateur': '/products/dyson-vacuum.svg',
  'thermomix tm7': '/products/thermomix.svg',
  'thermomix': '/products/thermomix.svg',
  'dyson airwrap complete long': '/products/dyson-airwrap.svg',
  'dyson airwrap': '/products/dyson-airwrap.svg',
  'dyson airstrait': '/products/dyson-airwrap.svg',
  'airwrap': '/products/dyson-airwrap.svg',
  'nespresso vertuo pop': '/products/thermomix.svg',
  'nespresso': '/products/thermomix.svg',
  'ninja creami': '/products/thermomix.svg',
  'irobot roomba': '/products/dyson-vacuum.svg',
  'roomba': '/products/dyson-vacuum.svg',

  // ============ HOME SMART ============
  'amazon echo show 10': '/products/sonos-speaker.svg',
  'echo show': '/products/sonos-speaker.svg',
  'google nest hub max': '/products/sonos-speaker.svg',
  'nest hub': '/products/sonos-speaker.svg',
  'philips hue starter kit': '/products/sonos-speaker.svg',
  'philips hue': '/products/sonos-speaker.svg',
  'nanoleaf shapes hexagons': '/products/sonos-speaker.svg',
  'nanoleaf': '/products/sonos-speaker.svg',
  'ring video doorbell 4': '/products/sonos-speaker.svg',
  'ring': '/products/sonos-speaker.svg',
  'eufy security': '/products/sonos-speaker.svg',

  // ============ GAMING ACCESSORIES ============
  'razer blackshark v2 pro': '/products/sony-headphones.svg',
  'steelseries arctis nova 7': '/products/sony-headphones.svg',
  'logitech g pro x superlight 2': '/products/gaming-mouse.svg',
  'logitech g915 tkl': '/products/gaming-keyboard.svg',
  'razer deathadder v3': '/products/gaming-mouse.svg',
  'seagate game drive': '/products/gaming-keyboard.svg',
  'elgato stream deck': '/products/gaming-keyboard.svg',

  // ============ TECH ACCESSORIES ============
  'apple airtag': '/products/airpods-pro.svg',
  'airtag': '/products/airpods-pro.svg',
  'samsung smarttag': '/products/airpods-pro.svg',
  'smarttag': '/products/airpods-pro.svg',
  'anker 737 power bank': '/products/airpods-pro.svg',
  'anker power bank': '/products/airpods-pro.svg',
  'magsafe battery pack': '/products/airpods-pro.svg',
  'belkin boostcharge': '/products/airpods-pro.svg',
  'apple magic keyboard': '/products/gaming-keyboard.svg',
  'apple pencil pro': '/products/ipad-pro.svg',
  'apple pencil': '/products/ipad-pro.svg',
  'kindle paperwhite': '/products/ipad-pro.svg',
  'kindle': '/products/ipad-pro.svg',
  'kobo libra': '/products/ipad-pro.svg',
  'kobo': '/products/ipad-pro.svg',
  'ray-ban meta smart glasses': '/products/rayban-smart.svg',

  // ============ AUTRES ============
  'carte cadeau': '/products/gift-card.svg',
  'gift card': '/products/gift-card.svg',
  'louis vuitton': '/products/louis-vuitton-bag.svg',
  'sac': '/products/louis-vuitton-bag.svg',
  'nike': '/products/nike-jordan.svg',
  'jordan': '/products/nike-jordan.svg',
  'ray-ban': '/products/rayban-smart.svg',
  'rayban': '/products/rayban-smart.svg',
  'rolex': '/products/rolex-watch.svg',
}

// Keywords pour le fallback (utilisés si pas de match exact dans le dictionnaire)
const KEYWORD_MAPPINGS: Array<{ keywords: string[]; svg: string }> = [
  // Apple
  { keywords: ['iphone'], svg: '/products/iphone-15-pro.svg' },
  { keywords: ['macbook'], svg: '/products/macbook-pro.svg' },
  { keywords: ['airpods max'], svg: '/products/airpods-max.svg' },
  { keywords: ['airpods'], svg: '/products/airpods-pro.svg' },
  { keywords: ['ipad'], svg: '/products/ipad-pro.svg' },
  { keywords: ['apple watch'], svg: '/products/apple-watch.svg' },
  { keywords: ['imac'], svg: '/products/imac.svg' },
  { keywords: ['apple pencil'], svg: '/products/ipad-pro.svg' },
  { keywords: ['magic keyboard'], svg: '/products/gaming-keyboard.svg' },
  { keywords: ['airtag'], svg: '/products/airpods-pro.svg' },

  // Google
  { keywords: ['pixel', 'google'], svg: '/products/google-pixel.svg' },

  // Gaming consoles
  { keywords: ['dualsense', 'manette ps5', 'controller ps5'], svg: '/products/ps5-controller.svg' },
  { keywords: ['playstation', 'ps5'], svg: '/products/ps5.svg' },
  { keywords: ['xbox', 'manette xbox'], svg: '/products/xbox-series-x.svg' },
  { keywords: ['nintendo', 'switch'], svg: '/products/nintendo-switch.svg' },
  { keywords: ['steam deck'], svg: '/products/steam-deck.svg' },
  { keywords: ['rog ally'], svg: '/products/steam-deck.svg' },
  { keywords: ['quest', 'vr', 'meta', 'oculus'], svg: '/products/meta-quest.svg' },

  // Gaming laptops
  { keywords: ['rog', 'asus', 'gaming laptop', 'razer', 'alienware', 'zephyrus', 'strix'], svg: '/products/gaming-laptop.svg' },

  // Gaming peripherals
  { keywords: ['blackshark', 'arctis'], svg: '/products/sony-headphones.svg' },
  { keywords: ['superlight', 'deathadder', 'souris', 'mouse'], svg: '/products/gaming-mouse.svg' },
  { keywords: ['g915', 'clavier', 'keyboard', 'stream deck', 'elgato'], svg: '/products/gaming-keyboard.svg' },
  { keywords: ['chaise', 'chair', 'secretlab'], svg: '/products/gaming-chair.svg' },
  { keywords: ['ecran', 'monitor', 'odyssey'], svg: '/products/gaming-monitor.svg' },

  // TV
  { keywords: ['lg', 'oled'], svg: '/products/lg-tv.svg' },
  { keywords: ['samsung', 'qn'], svg: '/products/samsung-tv.svg' },
  { keywords: ['bravia'], svg: '/products/lg-tv.svg' },
  { keywords: ['tv', 'television', 'qled'], svg: '/products/samsung-tv.svg' },

  // Samsung phones/watches
  { keywords: ['galaxy watch', 'galaxy buds'], svg: '/products/apple-watch.svg' },
  { keywords: ['samsung', 'galaxy'], svg: '/products/samsung-galaxy.svg' },
  { keywords: ['smarttag'], svg: '/products/airpods-pro.svg' },

  // Audio
  { keywords: ['sonos arc'], svg: '/products/soundbar.svg' },
  { keywords: ['sonos'], svg: '/products/sonos-speaker.svg' },
  { keywords: ['soundbar', 'barre de son'], svg: '/products/soundbar.svg' },
  { keywords: ['marshall'], svg: '/products/bose-speaker.svg' },
  { keywords: ['sony', 'casque', 'headphone', 'wh-1000', 'wf-1000', 'wh-ch'], svg: '/products/sony-headphones.svg' },
  { keywords: ['bose'], svg: '/products/bose-speaker.svg' },
  { keywords: ['jbl'], svg: '/products/jbl-speaker.svg' },
  { keywords: ['beats'], svg: '/products/airpods-pro.svg' },
  { keywords: ['ultimate ears', 'boom'], svg: '/products/jbl-speaker.svg' },

  // Cameras
  { keywords: ['sony', 'alpha', 'a7'], svg: '/products/sony-camera.svg' },
  { keywords: ['drone', 'dji', 'mavic', 'avata', 'osmo', 'mini 5'], svg: '/products/dji-drone.svg' },
  { keywords: ['gopro', 'action cam', 'hero'], svg: '/products/gopro-hero.svg' },
  { keywords: ['canon', 'appareil photo', 'eos'], svg: '/products/canon-camera.svg' },

  // Watches
  { keywords: ['garmin', 'fenix', 'venu'], svg: '/products/garmin-watch.svg' },
  { keywords: ['amazfit', 'fitbit', 'whoop', 'huawei watch'], svg: '/products/garmin-watch.svg' },
  { keywords: ['xiaomi', 'band'], svg: '/products/garmin-watch.svg' },
  { keywords: ['watch', 'montre'], svg: '/products/apple-watch.svg' },

  // Dyson
  { keywords: ['dyson', 'airwrap', 'airstrait'], svg: '/products/dyson-airwrap.svg' },
  { keywords: ['dyson', 'aspirateur', 'v15', 'v20', 'pure cool'], svg: '/products/dyson-vacuum.svg' },

  // Kitchen
  { keywords: ['thermomix', 'vorwerk', 'robot cuisine', 'tm6', 'tm7'], svg: '/products/thermomix.svg' },
  { keywords: ['nespresso', 'ninja', 'creami'], svg: '/products/thermomix.svg' },

  // Home smart
  { keywords: ['echo', 'alexa', 'nest hub'], svg: '/products/sonos-speaker.svg' },
  { keywords: ['philips hue', 'nanoleaf'], svg: '/products/sonos-speaker.svg' },
  { keywords: ['ring', 'eufy', 'doorbell'], svg: '/products/sonos-speaker.svg' },
  { keywords: ['roomba', 'irobot'], svg: '/products/dyson-vacuum.svg' },

  // E-readers
  { keywords: ['kindle', 'kobo', 'liseuse'], svg: '/products/ipad-pro.svg' },

  // Electric mobility
  { keywords: ['vespa'], svg: '/products/vespa.svg' },
  { keywords: ['bmw ce', 'zero', 'moto électrique', 'moto electrique', 'sr/f'], svg: '/products/electric-moto.svg' },
  { keywords: ['vanmoof', 'cowboy', 'vélo électrique', 'velo electrique', 'e-bike'], svg: '/products/electric-bike.svg' },
  { keywords: ['tesla', 'voiture', 'model car'], svg: '/products/tesla-model.svg' },
  { keywords: ['trottinette', 'scooter', 'ninebot', 'segway', 'xiaomi'], svg: '/products/electric-scooter.svg' },

  // Fashion/Luxury
  { keywords: ['rolex', 'submariner'], svg: '/products/rolex-watch.svg' },
  { keywords: ['louis vuitton', 'neverfull', 'sac'], svg: '/products/louis-vuitton-bag.svg' },
  { keywords: ['jordan', 'nike', 'sneaker', 'air'], svg: '/products/nike-jordan.svg' },
  { keywords: ['ray-ban', 'wayfarer', 'lunettes', 'smart glasses'], svg: '/products/rayban-smart.svg' },

  // Gift cards & accessories
  { keywords: ['carte', 'gift', 'bon', 'amazon'], svg: '/products/gift-card.svg' },
  { keywords: ['anker', 'power bank', 'batterie', 'magsafe', 'belkin', 'chargeur'], svg: '/products/airpods-pro.svg' },

  // OnePlus
  { keywords: ['oneplus'], svg: '/products/samsung-galaxy.svg' },
]

/**
 * Génère un hash déterministe à partir d'une chaîne
 */
function hashString(str: string): number {
  return str.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
}

/**
 * Retourne le chemin SVG pour un produit donné
 * Utilise d'abord le dictionnaire, puis les keywords, puis un fallback par hash
 */
export function getProductSvg(itemName: string, itemId?: string): string {
  const normalizedName = itemName.toLowerCase().trim()

  // 1. Essai de match exact dans le dictionnaire
  if (PRODUCT_SVG_MAP[normalizedName]) {
    return PRODUCT_SVG_MAP[normalizedName]
  }

  // 2. Essai de match partiel dans le dictionnaire
  for (const [key, value] of Object.entries(PRODUCT_SVG_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value
    }
  }

  // 3. Essai de match par keywords
  for (const mapping of KEYWORD_MAPPINGS) {
    if (mapping.keywords.some(keyword => normalizedName.includes(keyword))) {
      return mapping.svg
    }
  }

  // 4. Fallback par hash déterministe
  const hash = itemId ? hashString(itemId) : hashString(itemName)
  return LOCAL_PRODUCTS[Math.abs(hash) % LOCAL_PRODUCTS.length]
}

/**
 * Helper pour convertir un nom de produit en slug
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Retourne le chemin de l'image neon PNG (pour le lobby)
 */
export function getNeonImagePath(itemName: string): string {
  return `/products/${slugify(itemName)}-neon.png`
}

/**
 * Retourne les chemins primary (neon) et fallback (SVG)
 */
export function getProductImageWithFallback(itemName: string, itemId: string): { primary: string; fallback: string } {
  return {
    primary: getNeonImagePath(itemName),
    fallback: getProductSvg(itemName, itemId)
  }
}
