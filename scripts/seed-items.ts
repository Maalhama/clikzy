/**
 * Script de seed pour ajouter 100 produits populaires en France (2026)
 * - 50 produits premium
 * - 50 produits budget (< 200€)
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
  // SMARTPHONES PREMIUM (6)
  // ============================================
  {
    name: 'iPhone 17 Pro Max',
    description: "Le smartphone ultime d'Apple avec puce A19 Pro, écran 6.9\" ProMotion et caméra 48MP",
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=90&fit=crop',
    retail_value: 1479,
    category: 'smartphone'
  },
  {
    name: 'iPhone 17 Pro',
    description: "Puissance et design premium avec titane, Action Button et USB-C 3.2",
    image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=90&fit=crop',
    retail_value: 1229,
    category: 'smartphone'
  },
  {
    name: 'Samsung Galaxy S26 Ultra',
    description: 'Le flagship Samsung avec S Pen intégré, caméra 200MP et Galaxy AI 2.0',
    image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=90&fit=crop',
    retail_value: 1399,
    category: 'smartphone'
  },
  {
    name: 'Samsung Galaxy Z Fold 6',
    description: 'Smartphone pliable nouvelle génération avec écran 8" dépliant',
    image_url: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=90&fit=crop',
    retail_value: 1999,
    category: 'smartphone'
  },
  {
    name: 'Google Pixel 10 Pro',
    description: "L'IA Gemini dans votre poche avec le meilleur appareil photo Android",
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=90&fit=crop',
    retail_value: 1099,
    category: 'smartphone'
  },
  {
    name: 'OnePlus 14 Pro',
    description: 'Flagship killer avec Snapdragon 8 Elite et charge 150W',
    image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=90&fit=crop',
    retail_value: 999,
    category: 'smartphone'
  },

  // ============================================
  // GAMING (8)
  // ============================================
  {
    name: 'PlayStation 5 Pro',
    description: 'Console next-gen Sony avec GPU RDNA 3, SSD 2TB et support 8K',
    image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=90&fit=crop',
    retail_value: 799,
    category: 'gaming'
  },
  {
    name: 'PlayStation 5 Slim',
    description: 'PS5 édition compacte avec lecteur de disque',
    image_url: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=90&fit=crop',
    retail_value: 549,
    category: 'gaming'
  },
  {
    name: 'Xbox Series X 2TB',
    description: 'La console Microsoft avec 2TB de stockage et Game Pass Ultimate',
    image_url: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=90&fit=crop',
    retail_value: 599,
    category: 'gaming'
  },
  {
    name: 'Nintendo Switch 2',
    description: 'La nouvelle génération Nintendo avec écran 1080p et DLSS',
    image_url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=90&fit=crop',
    retail_value: 449,
    category: 'gaming'
  },
  {
    name: 'Steam Deck OLED 1TB',
    description: 'PC gaming portable de Valve avec écran OLED HDR 90Hz',
    image_url: 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=800&q=90&fit=crop',
    retail_value: 679,
    category: 'gaming'
  },
  {
    name: 'Meta Quest 4',
    description: 'Casque VR autonome avec réalité mixte et Snapdragon XR3',
    image_url: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800&q=90&fit=crop',
    retail_value: 599,
    category: 'gaming'
  },
  {
    name: 'Manette PS5 DualSense Edge',
    description: 'Manette pro personnalisable pour PS5 avec palettes',
    image_url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90&fit=crop',
    retail_value: 239,
    category: 'gaming'
  },
  {
    name: 'ASUS ROG Ally X',
    description: 'Console portable gaming avec Ryzen Z1 Extreme et 1TB SSD',
    image_url: 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=800&q=90&fit=crop',
    retail_value: 799,
    category: 'gaming'
  },

  // ============================================
  // ORDINATEURS & TABLETTES (7)
  // ============================================
  {
    name: 'MacBook Pro 16" M5 Max',
    description: 'Le laptop Apple le plus puissant avec puce M5 Max 16 coeurs',
    image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=90&fit=crop',
    retail_value: 4499,
    category: 'computer'
  },
  {
    name: 'MacBook Pro 14" M5 Pro',
    description: 'Performance pro dans un format compact avec M5 Pro',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=90&fit=crop',
    retail_value: 2499,
    category: 'computer'
  },
  {
    name: 'MacBook Air 15" M4',
    description: 'Le MacBook Air grand écran ultrafin avec puce M4',
    image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=90&fit=crop',
    retail_value: 1599,
    category: 'computer'
  },
  {
    name: 'iPad Pro 13" M4',
    description: 'La tablette pro ultime avec puce M4 et écran OLED tandem',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90&fit=crop',
    retail_value: 1499,
    category: 'tablet'
  },
  {
    name: 'iPad Air M3',
    description: 'Puissance M3 dans le design Air avec écran 11" ou 13"',
    image_url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=90&fit=crop',
    retail_value: 799,
    category: 'tablet'
  },
  {
    name: 'iMac 24" M4',
    description: "L'ordinateur tout-en-un coloré d'Apple avec puce M4",
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=90&fit=crop',
    retail_value: 1699,
    category: 'computer'
  },
  {
    name: 'ASUS ROG Strix G18',
    description: 'PC portable gaming haut de gamme avec RTX 5090',
    image_url: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=90&fit=crop',
    retail_value: 3499,
    category: 'computer'
  },

  // ============================================
  // AUDIO (6)
  // ============================================
  {
    name: 'AirPods Pro 3',
    description: 'Écouteurs sans fil Apple avec audio spatial adaptatif et puce H3',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90&fit=crop',
    retail_value: 299,
    category: 'audio'
  },
  {
    name: 'AirPods Max 2',
    description: 'Casque audio haut de gamme Apple avec USB-C et audio spatial',
    image_url: 'https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=800&q=90&fit=crop',
    retail_value: 549,
    category: 'audio'
  },
  {
    name: 'Sony WH-1000XM6',
    description: 'Le meilleur casque à réduction de bruit avec 40h d\'autonomie',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90&fit=crop',
    retail_value: 399,
    category: 'audio'
  },
  {
    name: 'Bose QuietComfort Ultra 2',
    description: 'Casque Bose avec audio immersif et ANC de nouvelle génération',
    image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=90&fit=crop',
    retail_value: 449,
    category: 'audio'
  },
  {
    name: 'Sonos Era 500',
    description: 'Enceinte connectée avec audio spatial Dolby Atmos',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 549,
    category: 'audio'
  },
  {
    name: 'Marshall Stanmore IV',
    description: 'Enceinte Bluetooth au design iconique Marshall',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90&fit=crop',
    retail_value: 399,
    category: 'audio'
  },

  // ============================================
  // MONTRES & WEARABLES (4)
  // ============================================
  {
    name: 'Apple Watch Ultra 3',
    description: 'La montre Apple la plus robuste avec écran MicroLED',
    image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=90&fit=crop',
    retail_value: 999,
    category: 'watch'
  },
  {
    name: 'Apple Watch Series 11',
    description: 'La montre connectée la plus avancée avec capteur de pression',
    image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=90&fit=crop',
    retail_value: 499,
    category: 'watch'
  },
  {
    name: 'Samsung Galaxy Watch 8 Classic',
    description: 'Montre connectée Samsung avec lunette rotative et Wear OS 5',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 429,
    category: 'watch'
  },
  {
    name: 'Garmin Fenix 8 Pro',
    description: 'Montre GPS multisports premium avec écran AMOLED',
    image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=90&fit=crop',
    retail_value: 899,
    category: 'watch'
  },

  // ============================================
  // PHOTO & VIDEO (4)
  // ============================================
  {
    name: 'Sony Alpha 7 V',
    description: 'Hybride plein format 50MP avec autofocus IA',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90&fit=crop',
    retail_value: 2999,
    category: 'photo'
  },
  {
    name: 'Canon EOS R8',
    description: 'Hybride Canon plein format compact et polyvalent',
    image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=90&fit=crop',
    retail_value: 1699,
    category: 'photo'
  },
  {
    name: 'GoPro Hero 14 Black',
    description: "Caméra d'action 8K avec stabilisation HyperSmooth 7.0",
    image_url: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&q=90&fit=crop',
    retail_value: 499,
    category: 'photo'
  },
  {
    name: 'DJI Osmo Pocket 4',
    description: 'Caméra gimbal de poche 4K 120fps pour vlogs',
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=90&fit=crop',
    retail_value: 599,
    category: 'photo'
  },

  // ============================================
  // DRONES (3)
  // ============================================
  {
    name: 'DJI Mavic 4 Pro',
    description: 'Drone professionnel avec triple caméra Hasselblad et autonomie 50min',
    image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=90&fit=crop',
    retail_value: 2299,
    category: 'drone'
  },
  {
    name: 'DJI Mini 5 Pro',
    description: 'Drone compact sous 249g avec caméra 4K HDR',
    image_url: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&q=90&fit=crop',
    retail_value: 999,
    category: 'drone'
  },
  {
    name: 'DJI Avata 3',
    description: 'Drone FPV immersif avec lunettes Goggles 3',
    image_url: 'https://images.unsplash.com/photo-1521405924368-64c5b84bec60?w=800&q=90&fit=crop',
    retail_value: 699,
    category: 'drone'
  },

  // ============================================
  // TV & HOME CINEMA (4)
  // ============================================
  {
    name: 'LG OLED G4 65"',
    description: 'TV OLED 4K 65 pouces avec processeur Alpha 11 et MLA',
    image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=90&fit=crop',
    retail_value: 2499,
    category: 'tv'
  },
  {
    name: 'Samsung QN95D 55"',
    description: 'TV Neo QLED 4K avec AI Upscaling et anti-reflet',
    image_url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=90&fit=crop',
    retail_value: 1599,
    category: 'tv'
  },
  {
    name: 'Sony Bravia 9 55"',
    description: 'TV Mini LED avec Cognitive Processor XR et Google TV',
    image_url: 'https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=800&q=90&fit=crop',
    retail_value: 1899,
    category: 'tv'
  },
  {
    name: 'Sonos Arc Ultra',
    description: 'Barre de son premium Dolby Atmos avec Sound Motion',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=90&fit=crop',
    retail_value: 999,
    category: 'audio'
  },

  // ============================================
  // MOBILITE ELECTRIQUE (4)
  // ============================================
  {
    name: 'Xiaomi Electric Scooter 5 Pro',
    description: 'Trottinette électrique 30km/h autonomie 60km',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90&fit=crop',
    retail_value: 699,
    category: 'mobility'
  },
  {
    name: 'Segway Ninebot Max G3',
    description: 'Trottinette premium longue autonomie 80km',
    image_url: 'https://images.unsplash.com/photo-1604868189265-219ba7ffc595?w=800&q=90&fit=crop',
    retail_value: 999,
    category: 'mobility'
  },
  {
    name: 'VanMoof S6',
    description: 'Vélo électrique connecté design hollandais',
    image_url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=90&fit=crop',
    retail_value: 3298,
    category: 'mobility'
  },
  {
    name: 'Cowboy 5',
    description: 'Vélo électrique urbain connecté made in Belgium',
    image_url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=90&fit=crop',
    retail_value: 3190,
    category: 'mobility'
  },

  // ============================================
  // ELECTROMENAGER PREMIUM (4)
  // ============================================
  {
    name: 'Dyson V20 Detect',
    description: 'Aspirateur sans fil avec détection laser et écran LCD',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=90&fit=crop',
    retail_value: 899,
    category: 'home'
  },
  {
    name: 'Thermomix TM7',
    description: 'Robot cuiseur multifonction Vorwerk nouvelle génération',
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=90&fit=crop',
    retail_value: 1599,
    category: 'home'
  },
  {
    name: 'Dyson Airstrait',
    description: 'Lisseur sans chaleur extrême avec technologie Coanda',
    image_url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=90&fit=crop',
    retail_value: 499,
    category: 'home'
  },
  {
    name: 'Dyson Airwrap Complete Long',
    description: 'Coiffeur multi-embouts pour cheveux longs',
    image_url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=90&fit=crop',
    retail_value: 599,
    category: 'home'
  },

  // ============================================
  // ============================================
  // PRODUITS BUDGET (< 200€) - 50 produits
  // ============================================
  // ============================================

  // GAMING ACCESSORIES (10)
  {
    name: 'Manette Xbox Core',
    description: 'Manette officielle Xbox sans fil Bluetooth',
    image_url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90&fit=crop',
    retail_value: 59,
    category: 'gaming'
  },
  {
    name: 'Manette PS5 DualSense',
    description: 'Manette officielle PlayStation 5 avec retour haptique',
    image_url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90&fit=crop',
    retail_value: 69,
    category: 'gaming'
  },
  {
    name: 'Nintendo Switch Pro Controller',
    description: 'Manette pro officielle Nintendo avec 40h autonomie',
    image_url: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800&q=90&fit=crop',
    retail_value: 69,
    category: 'gaming'
  },
  {
    name: 'Razer BlackShark V2 Pro',
    description: 'Casque gaming sans fil THX Spatial Audio',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90&fit=crop',
    retail_value: 179,
    category: 'gaming'
  },
  {
    name: 'Logitech G Pro X Superlight 2',
    description: 'Souris gaming sans fil ultra-légère 60g',
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=90&fit=crop',
    retail_value: 159,
    category: 'gaming'
  },
  {
    name: 'SteelSeries Arctis Nova 7',
    description: 'Casque gaming multi-plateforme avec ANC',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90&fit=crop',
    retail_value: 189,
    category: 'gaming'
  },
  {
    name: 'Razer DeathAdder V3',
    description: 'Souris gaming ergonomique 30K DPI',
    image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=90&fit=crop',
    retail_value: 89,
    category: 'gaming'
  },
  {
    name: 'Logitech G915 TKL',
    description: 'Clavier gaming mécanique sans fil RGB',
    image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'gaming'
  },
  {
    name: 'Seagate Game Drive 4TB',
    description: 'Disque dur externe pour PS5/Xbox 4TB',
    image_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&q=90&fit=crop',
    retail_value: 119,
    category: 'gaming'
  },
  {
    name: 'Elgato Stream Deck MK.2',
    description: 'Contrôleur de streaming avec 15 touches LCD',
    image_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'gaming'
  },

  // AUDIO BUDGET (12)
  {
    name: 'AirPods 4',
    description: 'Écouteurs Apple avec audio spatial et boîtier USB-C',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'audio'
  },
  {
    name: 'Samsung Galaxy Buds 3',
    description: 'Écouteurs true wireless avec ANC intelligent',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'audio'
  },
  {
    name: 'Sony WF-1000XM5',
    description: 'Écouteurs true wireless premium avec LDAC',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'audio'
  },
  {
    name: 'JBL Flip 7',
    description: 'Enceinte Bluetooth portable IP67 waterproof',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 129,
    category: 'audio'
  },
  {
    name: 'JBL Charge 6',
    description: 'Enceinte Bluetooth puissante avec powerbank intégré',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 179,
    category: 'audio'
  },
  {
    name: 'Bose SoundLink Flex',
    description: 'Enceinte portable Bose avec IP67',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'audio'
  },
  {
    name: 'Marshall Emberton III',
    description: 'Enceinte portable au design Marshall iconique',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 169,
    category: 'audio'
  },
  {
    name: 'Beats Studio Buds +',
    description: 'Écouteurs Apple/Android avec ANC et Spatial Audio',
    image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=90&fit=crop',
    retail_value: 169,
    category: 'audio'
  },
  {
    name: 'Sony WH-CH720N',
    description: 'Casque Bluetooth avec ANC et 50h autonomie',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90&fit=crop',
    retail_value: 99,
    category: 'audio'
  },
  {
    name: 'JBL Tune 770NC',
    description: 'Casque Bluetooth avec ANC adaptatif',
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=90&fit=crop',
    retail_value: 99,
    category: 'audio'
  },
  {
    name: 'Ultimate Ears Boom 4',
    description: 'Enceinte 360° waterproof avec son immersif',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'audio'
  },
  {
    name: 'Sonos Roam 2',
    description: 'Enceinte portable Sonos avec WiFi et Bluetooth',
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=90&fit=crop',
    retail_value: 179,
    category: 'audio'
  },

  // WEARABLES BUDGET (8)
  {
    name: 'Apple Watch SE 2',
    description: 'Montre Apple connectée abordable avec watchOS 11',
    image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'watch'
  },
  {
    name: 'Samsung Galaxy Watch FE',
    description: 'Montre Samsung abordable avec suivi santé complet',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'watch'
  },
  {
    name: 'Amazfit GTR 5',
    description: 'Montre connectée avec GPS et 24 jours autonomie',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 179,
    category: 'watch'
  },
  {
    name: 'Garmin Venu Sq 3',
    description: 'Montre GPS fitness avec écran AMOLED',
    image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'watch'
  },
  {
    name: 'Fitbit Sense 3',
    description: 'Montre santé avancée avec ECG et stress',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 179,
    category: 'watch'
  },
  {
    name: 'Xiaomi Smart Band 9 Pro',
    description: 'Bracelet connecté avec écran AMOLED 1.74"',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 69,
    category: 'watch'
  },
  {
    name: 'Huawei Watch Fit 4',
    description: 'Montre fitness avec écran AMOLED rectangulaire',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'watch'
  },
  {
    name: 'WHOOP 5.0',
    description: 'Bracelet fitness avancé pour athlètes',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'watch'
  },

  // TECH ACCESSORIES (10)
  {
    name: 'Apple AirTag 4 Pack',
    description: 'Trackers Apple Find My pour objets',
    image_url: 'https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=800&q=90&fit=crop',
    retail_value: 129,
    category: 'accessory'
  },
  {
    name: 'Samsung SmartTag 2 Pack',
    description: 'Trackers Samsung Galaxy SmartThings',
    image_url: 'https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=800&q=90&fit=crop',
    retail_value: 59,
    category: 'accessory'
  },
  {
    name: 'Anker 737 Power Bank 24K',
    description: 'Batterie externe 24000mAh 140W USB-C',
    image_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'accessory'
  },
  {
    name: 'MagSafe Battery Pack',
    description: 'Batterie Apple magnétique pour iPhone',
    image_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&q=90&fit=crop',
    retail_value: 109,
    category: 'accessory'
  },
  {
    name: 'Belkin BoostCharge Pro 3-en-1',
    description: 'Chargeur sans fil iPhone + Watch + AirPods',
    image_url: 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'accessory'
  },
  {
    name: 'Apple Magic Keyboard iPad',
    description: 'Clavier avec trackpad pour iPad Pro/Air',
    image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'accessory'
  },
  {
    name: 'Apple Pencil Pro',
    description: 'Stylet Apple avec retour haptique et squeeze',
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'accessory'
  },
  {
    name: 'Kindle Paperwhite Signature',
    description: 'Liseuse Amazon 6.8" avec charge sans fil',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90&fit=crop',
    retail_value: 189,
    category: 'accessory'
  },
  {
    name: 'Kobo Libra Colour',
    description: 'Liseuse couleur E-Ink Kaleido 7"',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'accessory'
  },
  {
    name: 'Ray-Ban Meta Smart Glasses',
    description: 'Lunettes connectées avec caméra et AI',
    image_url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'accessory'
  },

  // HOME & LIFESTYLE (10)
  {
    name: 'Amazon Echo Show 10',
    description: 'Écran connecté Alexa avec rotation auto',
    image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'home'
  },
  {
    name: 'Google Nest Hub Max',
    description: 'Écran connecté Google avec caméra Nest',
    image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=90&fit=crop',
    retail_value: 179,
    category: 'home'
  },
  {
    name: 'Philips Hue Starter Kit',
    description: 'Kit 3 ampoules connectées + Bridge',
    image_url: 'https://images.unsplash.com/photo-1558089687-f282ffcbc0d6?w=800&q=90&fit=crop',
    retail_value: 149,
    category: 'home'
  },
  {
    name: 'Nanoleaf Shapes Hexagons',
    description: 'Panneau LED modulaire 9 pièces',
    image_url: 'https://images.unsplash.com/photo-1558089687-f282ffcbc0d6?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'home'
  },
  {
    name: 'Ring Video Doorbell 4',
    description: 'Sonnette vidéo connectée avec pré-roll',
    image_url: 'https://images.unsplash.com/photo-1558089687-f282ffcbc0d6?w=800&q=90&fit=crop',
    retail_value: 179,
    category: 'home'
  },
  {
    name: 'Eufy Security Solo Cam E40',
    description: 'Caméra surveillance 2K sans abonnement',
    image_url: 'https://images.unsplash.com/photo-1558089687-f282ffcbc0d6?w=800&q=90&fit=crop',
    retail_value: 99,
    category: 'home'
  },
  {
    name: 'iRobot Roomba Combo Essential',
    description: 'Robot aspirateur et laveur 2-en-1',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'home'
  },
  {
    name: 'Nespresso Vertuo Pop',
    description: 'Machine à café Nespresso compacte',
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=90&fit=crop',
    retail_value: 99,
    category: 'home'
  },
  {
    name: 'Ninja Creami',
    description: 'Machine à glace et sorbets maison',
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'home'
  },
  {
    name: 'Dyson Pure Cool Me',
    description: 'Purificateur d\'air personnel compact',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=90&fit=crop',
    retail_value: 199,
    category: 'home'
  },
]

async function seedItems() {
  console.log('🚀 Début du seed des produits 2026...\n')

  // Supprimer les anciens items
  console.log('🗑️  Suppression des anciens items...')
  const { error: deleteError } = await supabase
    .from('items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.error('Erreur lors de la suppression:', deleteError)
  }

  // Insérer les nouveaux produits
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

  console.log('✅ Seed terminé avec succès!')
  console.log(`📊 ${data?.length} produits insérés\n`)

  // Afficher un résumé par catégorie
  const categories = PRODUCTS.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('📋 Résumé par catégorie:')
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count}`)
  })

  // Calculer les stats
  const totalValue = PRODUCTS.reduce((sum, p) => sum + p.retail_value, 0)
  const premiumProducts = PRODUCTS.filter(p => p.retail_value >= 200)
  const budgetProducts = PRODUCTS.filter(p => p.retail_value < 200)

  console.log(`\n💰 Valeur totale des lots: ${totalValue.toLocaleString()}€`)
  console.log(`📱 Produits premium (≥200€): ${premiumProducts.length}`)
  console.log(`💸 Produits budget (<200€): ${budgetProducts.length}`)
  console.log(`   Valeur moyenne budget: ${Math.round(budgetProducts.reduce((s, p) => s + p.retail_value, 0) / budgetProducts.length)}€`)
}

seedItems()
