#!/usr/bin/env python3
"""Supprime le fond d'une image avec rembg"""

import sys
from rembg import remove

if len(sys.argv) != 3:
    print("Usage: remove_bg.py <input> <output>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, 'rb') as f:
    input_data = f.read()

output_data = remove(input_data)

with open(output_path, 'wb') as f:
    f.write(output_data)

print('OK')
