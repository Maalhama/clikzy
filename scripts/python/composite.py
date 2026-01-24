#!/usr/bin/env python3
"""Compose un produit sur un fond avec les bons paramètres"""

import sys
import json
from PIL import Image

if len(sys.argv) != 5:
    print("Usage: composite.py <product> <background> <output> <params_json>")
    sys.exit(1)

product_path = sys.argv[1]
background_path = sys.argv[2]
output_path = sys.argv[3]
params = json.loads(sys.argv[4])

# Charger les images
background = Image.open(background_path).convert('RGBA')
product = Image.open(product_path).convert('RGBA')

# Recadrer le produit pour enlever l'espace transparent
bbox = product.getbbox()
if bbox:
    product = product.crop(bbox)

bg_width, bg_height = background.size

# Calculer la taille du produit
product_scale = params.get('productScale', 0.55)
y_position = params.get('yPosition', 0.15)
padding_bottom = params.get('paddingBottom', 0.10)

target_width = int(bg_width * product_scale)
aspect_ratio = product.height / product.width
target_height = int(target_width * aspect_ratio)

# Si trop haut, ajuster
max_height = int(bg_height * 0.75)
if target_height > max_height:
    target_height = max_height
    target_width = int(target_height / aspect_ratio)

product_resized = product.resize((target_width, target_height), Image.Resampling.LANCZOS)

# Positionner le produit
x = (bg_width - target_width) // 2
y = int(bg_height * y_position)

# S'assurer que le produit ne dépasse pas en bas
if y + target_height > bg_height * (1 - padding_bottom):
    y = int(bg_height * (1 - padding_bottom) - target_height)

# Composite
result = background.copy()
result.paste(product_resized, (x, y), product_resized)

# Sauvegarder
result.save(output_path)
print('OK')
