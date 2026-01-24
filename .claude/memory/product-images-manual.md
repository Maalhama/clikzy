# Mise à jour manuelle des images produits

## Contexte
77 images produits sont incorrectes et doivent être remplacées par des images haute qualité depuis les press kits officiels.

## Workflow
1. User télécharge l'image depuis le press kit officiel
2. User place l'image dans `tmp/images-raw/`
3. Claude traite l'image (suppression fond, redimensionnement)
4. User valide le résultat
5. Claude déplace vers `public/products/` avec le bon nom

## Dossiers
- **Raw images** : `tmp/images-raw/`
- **Final images** : `public/products/`

## Techniques de traitement

### Suppression watermark (GSMArena, etc.)
```python
from PIL import Image, ImageDraw
img = Image.open('image.jpg').convert('RGBA')
draw = ImageDraw.Draw(img)
# Couvrir le watermark avec du blanc (ajuster les coords selon l'image)
draw.rectangle([x1, y1, x2, y2], fill=(255, 255, 255, 255))
```

### Suppression fond
```python
from rembg import remove
output = remove(input_img)
```

### Sources d'images recommandées
- **GSMArena** : Bonnes photos mais watermark + résolution moyenne
- **Press kits officiels** : Meilleure qualité, pas de watermark
- **Amazon product pages** : Haute résolution mais difficile à scraper

---

## Liste des 77 produits à traiter

### Smartphones & Tablettes (5)
- [x] 1. `google-pixel-10-pro-neon.png` - Google Pixel 10 Pro ✅
- [x] 2. `ipad-pro-13-m4-neon.png` - iPad Pro 13 M4 ✅
- [x] 3. `kindle-paperwhite-signature-neon.png` - Kindle Paperwhite ✅
- [x] 4. `kobo-libra-colour-neon.png` - Ray-Ban Meta Smart Glasses ✅ (remplacé Kobo)
- [x] 5. `huawei-watch-fit-4-neon.png` - Huawei Watch Fit 4 ✅

### Montres & Trackers (8)
- [x] 6. `apple-watch-ultra-3-neon.png` - Apple Watch Ultra 3 ✅
- [x] 7. `fitbit-sense-3-neon.png` - Fitbit Sense 3 ✅ (utilisé Versa 4)
- [x] 8. `garmin-fenix-8-pro-neon.png` - Garmin Fenix 8 Pro ✅
- [x] 9. `garmin-venu-sq-2-neon.png` - Garmin Venu Sq 2 ✅
- [x] 10. `samsung-galaxy-watch-8-classic-neon.png` - Samsung Galaxy Watch 8 ✅
- [x] 11. `samsung-galaxy-watch-fe-neon.png` - Samsung Galaxy Watch FE ✅
- [x] 12. `whoop-5-0-neon.png` - Whoop 5.0 ✅
- [x] 13. `xiaomi-smart-band-9-pro-neon.png` - Xiaomi Smart Band 9 Pro ✅

### Casques & Écouteurs (6)
- [x] 14. `beats-studio-buds-neon.png` - Beats Studio Buds ✅
- [x] 15. `jbl-tune-770nc-neon.png` - JBL Tune 770NC ✅
- [x] 16. `razer-blackshark-v2-pro-neon.png` - Razer BlackShark V2 Pro ✅
- [x] 17. `samsung-galaxy-buds-3-neon.png` - Samsung Galaxy Buds 3 ✅
- [x] 18. `sony-wf-1000xm5-neon.png` - Sony WF-1000XM5 ✅
- [x] 19. `steelseries-arctis-nova-7-neon.png` - SteelSeries Arctis Nova 7 ✅

### Enceintes (8)
- [x] 20. `bose-soundlink-flex-neon.png` - Bose SoundLink Flex ✅
- [x] 21. `marshall-emberton-iii-neon.png` - Marshall Emberton III ✅
- [x] 22. `marshall-stanmore-iv-neon.png` - Marshall Stanmore IV ✅
- [x] 23. `sonos-arc-ultra-neon.png` - Sonos Arc Ultra ✅
- [x] 24. `sonos-era-500-neon.png` - Sonos Era 500 ✅ (Era 300)
- [x] 25. `sonos-roam-2-neon.png` - Sonos Roam 2 ✅
- [x] 26. `ultimate-ears-boom-4-neon.png` - Ultimate Ears Boom 4 ✅
- [x] 27. `jbl-flip-7-neon.png` - JBL Flip 7 ✅

### Gaming (10)
- [x] 28. `asus-rog-ally-x-neon.png` - ASUS ROG Ally X ✅
- [x] 29. `asus-rog-strix-g18-neon.png` - ASUS ROG Strix G18 ✅
- [x] 30. `manette-ps5-dualsense-edge-neon.png` - DualSense Edge ✅
- [x] 31. `manette-ps5-dualsense-neon.png` - DualSense ✅
- [x] 32. `manette-xbox-core-neon.png` - Manette Xbox Core ✅
- [x] 33. `meta-quest-4-neon.png` - Meta Quest 4 ✅
- [x] 34. `nintendo-switch-pro-controller-neon.png` - Switch Pro Controller ✅
- [x] 35. `playstation-5-pro-neon.png` - PlayStation 5 Pro ✅
- [x] 36. `playstation-5-slim-neon.png` - PlayStation 5 Slim ✅ (même que Pro)
- [x] 37. `steam-deck-oled-1tb-neon.png` - Steam Deck OLED ✅

### Ordinateurs (4)
- [x] 38. `imac-24-m4-neon.png` - iMac 24 M4 ✅
- [x] 39. `macbook-air-15-m4-neon.png` - MacBook Air 15 M4 ✅
- [x] 40. `macbook-pro-14-m5-pro-neon.png` - MacBook Pro 14 M5 Pro ✅
- [x] 41. `macbook-pro-16-m5-max-neon.png` - MacBook Pro 16 M5 Max ✅

### TV & Écrans (3)
- [x] 42. `lg-oled-g4-65-neon.png` - LG OLED G4 65" ✅
- [x] 43. `samsung-qn95d-55-neon.png` - Samsung QN95D 55" ✅
- [x] 44. `sony-bravia-9-55-neon.png` - Sony Bravia 9 55" ✅

### Drones & Caméras (6)
- [x] 45. `canon-eos-r8-neon.png` - Canon EOS R8 ✅
- [x] 46. `dji-avata-3-neon.png` - DJI Avata 3 ✅
- [x] 47. `dji-mavic-4-pro-neon.png` - DJI Mavic 4 Pro ✅
- [x] 48. `dji-osmo-pocket-4-neon.png` - DJI Osmo Pocket 4 ✅
- [x] 49. `gopro-hero-14-black-neon.png` - GoPro Hero 14 Black ✅
- [x] 50. `sony-alpha-7-v-neon.png` - Sony Alpha 7 V ✅

### Accessoires Apple (3)
- [x] 51. `apple-magic-keyboard-ipad-neon.png` - Magic Keyboard iPad ✅
- [x] 52. `apple-pencil-pro-neon.png` - Apple Pencil Pro ✅
- [x] 53. `magsafe-battery-pack-neon.png` - MagSafe Battery Pack ✅

### Smart Home (6)
- [x] 54. `amazon-echo-show-10-neon.png` - Amazon Echo Show 10 ✅
- [x] 55. `eufy-security-solo-cam-e40-neon.png` - Eufy Solo Cam ✅
- [x] 56. `google-nest-hub-max-neon.png` - Google Nest Hub Max ✅
- [x] 57. `nanoleaf-shapes-hexagons-neon.png` - Nanoleaf Shapes ✅
- [x] 58. `philips-hue-starter-kit-neon.png` - Insta360 Go 3S ✅ (remplacé Philips Hue)
- [x] 59. `ring-video-doorbell-4-neon.png` - Ring Video Doorbell 4 ✅

### Électroménager (7)
- [x] 60. `dyson-airstrait-neon.png` - Dyson Airstrait ✅
- [x] 61. `dyson-airwrap-complete-long-neon.png` - Dyson Airwrap ✅
- [x] 62. `dyson-pure-cool-me-neon.png` - Dyson Pure Cool Me ✅
- [x] 63. `dyson-v20-detect-neon.png` - Dyson V20 Detect ✅
- [x] 64. `nespresso-vertuo-pop-neon.png` - Nespresso Vertuo Pop ✅
- [x] 65. `ninja-creami-neon.png` - Ninja Creami ✅
- [x] 66. `thermomix-tm7-neon.png` - Thermomix TM7 ✅

### Accessoires divers (7)
- [x] 67. `anker-737-power-bank-24k-neon.png` - Anker 737 Power Bank ✅
- [x] 68. `belkin-boostcharge-pro-3-en-1-neon.png` - Belkin BoostCharge Pro ✅
- [x] 69. `elgato-stream-deck-mk-2-neon.png` - Elgato Stream Deck MK2 ✅
- [x] 70. `logitech-g915-tkl-neon.png` - Logitech G915 TKL ✅
- [x] 71. `razer-deathadder-v3-neon.png` - Razer DeathAdder V3 ✅
- [x] 72. `samsung-smarttag-2-pack-neon.png` - Samsung SmartTag 2 Pack ✅
- [x] 73. `seagate-game-drive-4tb-neon.png` - Seagate Game Drive 4TB ✅

### Mobilité (4)
- [x] 74. `cowboy-5-neon.png` - Ledger Nano X ✅ (remplacé Cowboy 5)
- [x] 75. `segway-ninebot-max-g3-neon.png` - Segway Ninebot Max G3 ✅
- [x] 76. `xiaomi-electric-scooter-5-pro-neon.png` - Xiaomi Electric Scooter 5 Pro ✅
- [x] 77. `vanmoof-s6-neon.png` - VanMoof S6 ✅

---

## Progression
- **Total** : 77 produits
- **Terminés** : 77 ✅
- **Restants** : 0

## Standard images
- **Taille** : 800x800px
- **Format** : PNG avec fond transparent
- **Centrage** : Horizontal ET Vertical (centre absolu vérifié)

### Process de traitement
```python
from rembg import remove
from PIL import Image

def process_product_image(input_path, output_path):
    # 1. Load and remove background (if needed)
    img = Image.open(input_path)
    if img.mode != 'RGBA' or not has_transparency(img):
        img = remove(img)

    # 2. Crop to actual content (double crop pour être sûr)
    bbox = img.getbbox()
    cropped = img.crop(bbox)
    bbox2 = cropped.getbbox()
    if bbox2:
        cropped = cropped.crop(bbox2)

    # 3. Resize to fit in 700x700 max
    target_size = 800
    max_content = 700
    ratio = min(max_content / cropped.width, max_content / cropped.height)
    resized = cropped.resize((int(cropped.width * ratio), int(cropped.height * ratio)), Image.LANCZOS)

    # 4. Paste on canvas
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    x = (target_size - resized.width) // 2
    y = (target_size - resized.height) // 2
    canvas.paste(resized, (x, y), resized)

    # 5. VERIFY and recenter based on actual content
    final_bbox = canvas.getbbox()
    if final_bbox:
        content = canvas.crop(final_bbox)
        canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
        new_x = (target_size - content.width) // 2
        new_y = (target_size - content.height) // 2
        canvas.paste(content, (new_x, new_y), content)

    canvas.save(output_path, 'PNG')
```

## Produits remplacés
| Original | Nouveau | Raison |
|----------|---------|--------|
| Cowboy 5 | Ledger Nano X | Changement de produit demandé |
| Philips Hue Starter Kit | Insta360 Go 3S | Changement de produit demandé |
| Kobo Libra Colour | Ray-Ban Meta Smart Glasses | Changement de produit demandé |

## Dernière mise à jour
2026-01-24
