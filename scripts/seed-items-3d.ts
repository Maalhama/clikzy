/**
 * Seed avec des produits RÉELS pour lesquels des modèles 3D existent
 * Sources: Sketchfab, Apple USDZ, CGTrader
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
  image_url: string
  retail_value: number
}

const PRODUCTS: Product[] = [
  // ============================================
  // APPLE - Modèles USDZ officiels disponibles
  // ============================================
  {
    name: 'iPhone 15 Pro Max',
    description: 'Le smartphone ultime Apple avec puce A17 Pro et titane',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=90',
    retail_value: 1479
  },
  {
    name: 'iPhone 15 Pro',
    description: 'iPhone Pro avec Action Button et USB-C',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=90',
    retail_value: 1229
  },
  {
    name: 'iPhone 15',
    description: 'iPhone avec Dynamic Island et USB-C',
    image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=90',
    retail_value: 969
  },
  {
    name: 'iPhone 14',
    description: 'iPhone avec mode Action et détection accident',
    image_url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=90',
    retail_value: 769
  },
  {
    name: 'MacBook Pro 16" M3 Max',
    description: 'Le laptop le plus puissant Apple avec puce M3 Max',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90',
    retail_value: 4299
  },
  {
    name: 'MacBook Pro 14" M3 Pro',
    description: 'MacBook Pro compact avec puce M3 Pro',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90',
    retail_value: 2399
  },
  {
    name: 'MacBook Air M3',
    description: 'Le laptop le plus fin au monde avec puce M3',
    image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=90',
    retail_value: 1299
  },
  {
    name: 'MacBook Air M2',
    description: 'MacBook Air redesigné avec puce M2',
    image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=90',
    retail_value: 1199
  },
  {
    name: 'iMac 24" M3',
    description: 'iMac tout-en-un avec écran 4.5K Retina',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=90',
    retail_value: 1499
  },
  {
    name: 'iPad Pro 12.9" M2',
    description: 'iPad Pro avec puce M2 et écran Liquid Retina XDR',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90',
    retail_value: 1479
  },
  {
    name: 'iPad Air M2',
    description: 'iPad Air avec puce M2 et écran 10.9"',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90',
    retail_value: 699
  },
  {
    name: 'iPad 10e génération',
    description: 'iPad avec USB-C et écran 10.9"',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90',
    retail_value: 439
  },
  {
    name: 'Apple Watch Ultra 2',
    description: 'La montre la plus robuste Apple avec GPS double fréquence',
    image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=90',
    retail_value: 899
  },
  {
    name: 'Apple Watch Series 9',
    description: 'Apple Watch avec puce S9 et Double Tap',
    image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=90',
    retail_value: 449
  },
  {
    name: 'Apple Watch SE',
    description: 'Apple Watch essentielle à prix accessible',
    image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=90',
    retail_value: 249
  },
  {
    name: 'AirPods Pro 2',
    description: 'Écouteurs avec réduction de bruit adaptative et USB-C',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90',
    retail_value: 279
  },
  {
    name: 'AirPods Max',
    description: 'Casque audio haute fidélité Apple',
    image_url: 'https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=800&q=90',
    retail_value: 579
  },
  {
    name: 'AirPods 3',
    description: 'AirPods avec audio spatial et boîtier MagSafe',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90',
    retail_value: 179
  },
  {
    name: 'HomePod mini',
    description: 'Enceinte intelligente compacte avec Siri',
    image_url: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=90',
    retail_value: 99
  },
  {
    name: 'Apple TV 4K',
    description: 'Boîtier streaming avec puce A15 Bionic',
    image_url: 'https://images.unsplash.com/photo-1528928441742-b4ccac1bb04c?w=800&q=90',
    retail_value: 169
  },
  {
    name: 'AirTag',
    description: 'Traceur Bluetooth avec réseau Localiser',
    image_url: 'https://images.unsplash.com/photo-1621330396173-e41b1cafd17f?w=800&q=90',
    retail_value: 35
  },
  {
    name: 'Apple Pencil Pro',
    description: 'Stylet avec détection de pression et Find My',
    image_url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&q=90',
    retail_value: 149
  },
  {
    name: 'Magic Keyboard iPad Pro',
    description: 'Clavier flottant avec trackpad pour iPad Pro',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=90',
    retail_value: 349
  },

  // ============================================
  // SAMSUNG - Modèles 3D disponibles sur Sketchfab
  // ============================================
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship Samsung avec S Pen et Galaxy AI',
    image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=90',
    retail_value: 1469
  },
  {
    name: 'Samsung Galaxy S24+',
    description: 'Galaxy S24 avec grand écran 6.7"',
    image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=90',
    retail_value: 1169
  },
  {
    name: 'Samsung Galaxy S24',
    description: 'Galaxy S24 compact avec écran 6.2"',
    image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=90',
    retail_value: 899
  },
  {
    name: 'Samsung Galaxy Z Fold 5',
    description: 'Smartphone pliable avec écran 7.6"',
    image_url: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=90',
    retail_value: 1899
  },
  {
    name: 'Samsung Galaxy Z Flip 5',
    description: 'Smartphone pliable compact avec Flex Window',
    image_url: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=90',
    retail_value: 1199
  },
  {
    name: 'Samsung Galaxy Tab S9 Ultra',
    description: 'Tablette Android premium avec écran 14.6"',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90',
    retail_value: 1279
  },
  {
    name: 'Samsung Galaxy Watch 6 Classic',
    description: 'Montre connectée avec lunette rotative',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90',
    retail_value: 399
  },
  {
    name: 'Samsung Galaxy Buds 2 Pro',
    description: 'Écouteurs avec audio Hi-Fi 24bit',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=90',
    retail_value: 229
  },

  // ============================================
  // SONY - PlayStation et Audio
  // ============================================
  {
    name: 'PlayStation 5',
    description: 'Console next-gen Sony avec SSD ultra-rapide',
    image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=90',
    retail_value: 549
  },
  {
    name: 'PlayStation 5 Digital',
    description: 'PS5 édition digitale sans lecteur',
    image_url: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=90',
    retail_value: 449
  },
  {
    name: 'DualSense PS5',
    description: 'Manette PS5 avec retour haptique',
    image_url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90',
    retail_value: 69
  },
  {
    name: 'DualSense Edge',
    description: 'Manette PS5 pro personnalisable',
    image_url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90',
    retail_value: 239
  },
  {
    name: 'PlayStation VR2',
    description: 'Casque VR nouvelle génération pour PS5',
    image_url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=90',
    retail_value: 599
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Casque à réduction de bruit référence',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90',
    retail_value: 379
  },
  {
    name: 'Sony WF-1000XM5',
    description: 'Écouteurs true wireless premium',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=90',
    retail_value: 299
  },
  {
    name: 'Sony Alpha 7 IV',
    description: 'Appareil photo hybride plein format 33MP',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
    retail_value: 2799
  },
  {
    name: 'Sony Alpha 7C II',
    description: 'Hybride plein format compact',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
    retail_value: 2399
  },

  // ============================================
  // MICROSOFT / XBOX
  // ============================================
  {
    name: 'Xbox Series X',
    description: 'Console Microsoft la plus puissante',
    image_url: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=90',
    retail_value: 499
  },
  {
    name: 'Xbox Series S',
    description: 'Console Xbox compacte et abordable',
    image_url: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=90',
    retail_value: 299
  },
  {
    name: 'Manette Xbox Elite Series 2',
    description: 'Manette Xbox pro avec palettes',
    image_url: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=90',
    retail_value: 179
  },
  {
    name: 'Manette Xbox Wireless',
    description: 'Manette Xbox sans fil standard',
    image_url: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=90',
    retail_value: 59
  },

  // ============================================
  // NINTENDO
  // ============================================
  {
    name: 'Nintendo Switch OLED',
    description: 'Switch avec écran OLED 7 pouces',
    image_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=90',
    retail_value: 349
  },
  {
    name: 'Nintendo Switch',
    description: 'Console hybride portable/salon',
    image_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=90',
    retail_value: 269
  },
  {
    name: 'Nintendo Switch Lite',
    description: 'Switch 100% portable',
    image_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=90',
    retail_value: 199
  },
  {
    name: 'Joy-Con Nintendo',
    description: 'Paire de manettes Joy-Con',
    image_url: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=90',
    retail_value: 79
  },
  {
    name: 'Pro Controller Nintendo',
    description: 'Manette Pro pour Nintendo Switch',
    image_url: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=90',
    retail_value: 69
  },

  // ============================================
  // META / VR
  // ============================================
  {
    name: 'Meta Quest 3',
    description: 'Casque VR autonome avec réalité mixte',
    image_url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=90',
    retail_value: 549
  },
  {
    name: 'Meta Quest 2',
    description: 'Casque VR autonome accessible',
    image_url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=90',
    retail_value: 349
  },

  // ============================================
  // VALVE
  // ============================================
  {
    name: 'Steam Deck OLED',
    description: 'PC gaming portable avec écran OLED',
    image_url: 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=800&q=90',
    retail_value: 569
  },
  {
    name: 'Steam Deck LCD',
    description: 'PC gaming portable Valve',
    image_url: 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=800&q=90',
    retail_value: 419
  },

  // ============================================
  // GOOGLE
  // ============================================
  {
    name: 'Google Pixel 8 Pro',
    description: 'Smartphone Google avec IA Gemini',
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=90',
    retail_value: 1099
  },
  {
    name: 'Google Pixel 8',
    description: 'Pixel compact avec puce Tensor G3',
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=90',
    retail_value: 799
  },
  {
    name: 'Google Pixel Watch 2',
    description: 'Montre Google avec Fitbit intégré',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90',
    retail_value: 399
  },
  {
    name: 'Google Pixel Buds Pro',
    description: 'Écouteurs Google avec ANC',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=90',
    retail_value: 229
  },
  {
    name: 'Google Nest Hub Max',
    description: 'Écran connecté avec caméra Nest',
    image_url: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&q=90',
    retail_value: 229
  },

  // ============================================
  // DJI - Drones
  // ============================================
  {
    name: 'DJI Mavic 3 Pro',
    description: 'Drone pro avec triple caméra Hasselblad',
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=90',
    retail_value: 2199
  },
  {
    name: 'DJI Air 3',
    description: 'Drone avec double caméra et détection obstacles',
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=90',
    retail_value: 1099
  },
  {
    name: 'DJI Mini 4 Pro',
    description: 'Mini drone 249g avec caméra 4K',
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=90',
    retail_value: 799
  },
  {
    name: 'DJI Osmo Pocket 3',
    description: 'Caméra stabilisée de poche',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
    retail_value: 519
  },
  {
    name: 'DJI Action 4',
    description: 'Caméra action 4K 120fps',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
    retail_value: 399
  },

  // ============================================
  // GOPRO
  // ============================================
  {
    name: 'GoPro Hero 12 Black',
    description: 'Action cam 5.3K avec HDR',
    image_url: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&q=90',
    retail_value: 449
  },
  {
    name: 'GoPro Hero 11 Black',
    description: 'Action cam avec capteur plus grand',
    image_url: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&q=90',
    retail_value: 349
  },

  // ============================================
  // BOSE
  // ============================================
  {
    name: 'Bose QuietComfort Ultra',
    description: 'Casque premium avec audio immersif',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90',
    retail_value: 449
  },
  {
    name: 'Bose QuietComfort 45',
    description: 'Casque à réduction de bruit',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90',
    retail_value: 329
  },
  {
    name: 'Bose SoundLink Flex',
    description: 'Enceinte Bluetooth portable waterproof',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 149
  },
  {
    name: 'Bose QuietComfort Earbuds II',
    description: 'Écouteurs true wireless avec ANC',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=90',
    retail_value: 299
  },

  // ============================================
  // JBL
  // ============================================
  {
    name: 'JBL Charge 5',
    description: 'Enceinte Bluetooth avec powerbank',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 179
  },
  {
    name: 'JBL Flip 6',
    description: 'Enceinte portable compacte',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 129
  },
  {
    name: 'JBL Go 3',
    description: 'Mini enceinte Bluetooth',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 39
  },

  // ============================================
  // DYSON
  // ============================================
  {
    name: 'Dyson V15 Detect',
    description: 'Aspirateur sans fil avec laser',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=90',
    retail_value: 749
  },
  {
    name: 'Dyson V12 Detect Slim',
    description: 'Aspirateur léger avec détection',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=90',
    retail_value: 549
  },
  {
    name: 'Dyson Airwrap',
    description: 'Coiffeur multi-styles Dyson',
    image_url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=90',
    retail_value: 549
  },
  {
    name: 'Dyson Supersonic',
    description: 'Sèche-cheveux intelligent',
    image_url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=90',
    retail_value: 449
  },
  {
    name: 'Dyson Pure Cool',
    description: 'Purificateur et ventilateur',
    image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=90',
    retail_value: 549
  },

  // ============================================
  // CANON
  // ============================================
  {
    name: 'Canon EOS R6 Mark II',
    description: 'Hybride plein format 24MP',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
    retail_value: 2799
  },
  {
    name: 'Canon EOS R8',
    description: 'Hybride plein format compact',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
    retail_value: 1699
  },
  {
    name: 'Canon EOS R50',
    description: 'Hybride APS-C pour créateurs',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
    retail_value: 799
  },

  // ============================================
  // RAZER / GAMING ACCESSORIES
  // ============================================
  {
    name: 'Razer BlackWidow V4 Pro',
    description: 'Clavier mécanique gaming RGB',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=90',
    retail_value: 249
  },
  {
    name: 'Razer DeathAdder V3 Pro',
    description: 'Souris gaming sans fil légère',
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=90',
    retail_value: 169
  },
  {
    name: 'Razer Kraken V3 Pro',
    description: 'Casque gaming avec retour haptique',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90',
    retail_value: 199
  },

  // ============================================
  // LOGITECH
  // ============================================
  {
    name: 'Logitech G Pro X Superlight',
    description: 'Souris gaming ultra-légère 63g',
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=90',
    retail_value: 149
  },
  {
    name: 'Logitech G915 TKL',
    description: 'Clavier mécanique sans fil low profile',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=90',
    retail_value: 229
  },
  {
    name: 'Logitech MX Master 3S',
    description: 'Souris ergonomique premium',
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=90',
    retail_value: 119
  },

  // ============================================
  // MARSHALL
  // ============================================
  {
    name: 'Marshall Stanmore III',
    description: 'Enceinte Bluetooth au look vintage',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 379
  },
  {
    name: 'Marshall Emberton II',
    description: 'Enceinte portable compacte',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 169
  },
  {
    name: 'Marshall Major IV',
    description: 'Casque Bluetooth iconique',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90',
    retail_value: 149
  },

  // ============================================
  // GARMIN
  // ============================================
  {
    name: 'Garmin Fenix 7X Pro',
    description: 'Montre GPS multisports premium',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90',
    retail_value: 899
  },
  {
    name: 'Garmin Forerunner 965',
    description: 'Montre running avec écran AMOLED',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90',
    retail_value: 649
  },
  {
    name: 'Garmin Venu 3',
    description: 'Smartwatch sport et santé',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90',
    retail_value: 449
  },

  // ============================================
  // SONOS
  // ============================================
  {
    name: 'Sonos Arc',
    description: 'Barre de son Dolby Atmos premium',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90',
    retail_value: 899
  },
  {
    name: 'Sonos Beam Gen 2',
    description: 'Barre de son compacte Dolby Atmos',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90',
    retail_value: 499
  },
  {
    name: 'Sonos Era 300',
    description: 'Enceinte avec audio spatial',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 499
  },
  {
    name: 'Sonos Move 2',
    description: 'Enceinte portable haute fidélité',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90',
    retail_value: 449
  },
]

async function main() {
  console.log('🚀 Seed des produits RÉELS avec modèles 3D disponibles\n')

  // Supprimer les anciens
  console.log('🗑️  Suppression des anciens items...')
  await supabase.from('winners').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('game_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('games').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Insérer les nouveaux
  console.log(`📦 Insertion de ${PRODUCTS.length} produits...\n`)

  const { error } = await supabase.from('items').insert(PRODUCTS)

  if (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }

  console.log(`✅ Seed terminé avec succès!`)
  console.log(`📊 ${PRODUCTS.length} produits insérés`)

  // Stats
  const premium = PRODUCTS.filter(p => p.retail_value >= 200).length
  const budget = PRODUCTS.filter(p => p.retail_value < 200).length
  const total = PRODUCTS.reduce((acc, p) => acc + p.retail_value, 0)

  console.log(`\n💰 Valeur totale: ${total.toLocaleString()}€`)
  console.log(`📱 Produits premium (≥200€): ${premium}`)
  console.log(`💸 Produits budget (<200€): ${budget}`)
}

main().catch(console.error)
