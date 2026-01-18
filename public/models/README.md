# 3D Models

Ce dossier contient les modeles 3D pour le showcase produits.

## Format attendu

- **Format**: `.glb` (GLTF Binary)
- **Taille recommandee**: < 5MB par modele
- **Optimisation**: Utiliser des textures compressees (JPEG/WebP)

## Fichiers attendus

| Fichier | Produit |
|---------|---------|
| `iphone.glb` | iPhone 15 Pro |
| `ps5.glb` | PlayStation 5 |
| `macbook.glb` | MacBook Pro |
| `airpods-max.glb` | AirPods Max |
| `apple-watch.glb` | Apple Watch Ultra |

## Ou trouver des modeles gratuits

### Sources recommandees

1. **Sketchfab** (gratuit avec attribution)
   - https://sketchfab.com/search?type=models&q=iphone&features=downloadable

2. **CGTrader** (certains gratuits)
   - https://www.cgtrader.com/free-3d-models

3. **Poly Pizza** (CC0)
   - https://poly.pizza

4. **Turbosquid** (filtrer par gratuit)
   - https://www.turbosquid.com/Search/3D-Models/free

### Outils de conversion

Si le modele est en `.obj`, `.fbx` ou autre format:

1. **Blender** (gratuit) - Importer puis exporter en `.glb`
2. **Online converter**: https://products.aspose.app/3d/conversion/obj-to-glb

## Configuration dans le code

Les modeles sont configures dans `src/components/3d/ProductShowcase3D.tsx`:

```typescript
const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    modelUrl: '/models/iphone.glb',  // Ajouter cette ligne quand le modele existe
    fallbackType: 'phone',
    fallbackColor: '#1a1a1a',
    scale: 2,
    value: 1299,
  },
  // ...
]
```

## Fallback 3D

Si aucun modele `.glb` n'est fourni, le systeme affiche automatiquement
une forme 3D stylisee (telephone, console, laptop, etc.) avec des effets
de lumiere neon.

## Notes importantes

- Les modeles de produits Apple/Sony/etc. peuvent etre soumis a des droits d'auteur
- Preferer des modeles "stylises" ou "generiques" pour eviter les problemes legaux
- Toujours verifier la licence du modele avant utilisation commerciale
