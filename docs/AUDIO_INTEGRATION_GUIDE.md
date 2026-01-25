# 🔊 Guide d'Intégration Audio - Mini-Jeux 3D

**Date:** 2026-01-26
**Status:** ✅ Infrastructure Créée | 🚧 Intégration en cours

---

## ✅ Infrastructure Créée

### Fichiers Ajoutés

1. **`/src/hooks/useAudio.ts`** - Hook de base pour jouer des sons
2. **`/src/contexts/AudioContext.tsx`** - Context pour les préférences utilisateur
3. **`/src/hooks/mini-games/useMiniGameAudio.ts`** - Hook spécifique mini-jeux
4. **`/src/components/settings/AudioSettings.tsx`** - Interface de paramètres
5. **`/public/sounds/`** - Structure de dossiers pour les fichiers audio
6. **`/app/layout.tsx`** - AudioProvider intégré

### AudioProvider Intégré

Le `AudioProvider` a été ajouté dans le layout principal :

```tsx
<AudioProvider>
  <SkipLink />
  {children}
  <CookieConsent />
  <Analytics />
  <WebVitalsReporter />
</AudioProvider>
```

**Tous les composants peuvent maintenant accéder aux paramètres audio.**

---

## 🎮 Exemple : CoinFlip3D (✅ Intégré)

### 1. Import du Hook

```tsx
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'
```

### 2. Utilisation dans le Composant

```tsx
function CoinFlipScene({ ... }: CoinFlip3DProps) {
  // Audio
  const sounds = useMiniGameAudio('coin')

  const handleFlip = () => {
    // Son de lancement
    sounds.flip.play()
  }

  const handleCoinLanded = () => {
    // Son d'atterrissage
    sounds.land.play()
  }
}
```

### 3. Sons Disponibles pour CoinFlip

- `sounds.flip` - Lancement de la pièce
- `sounds.spin` - Rotation (loop)
- `sounds.land` - Atterrissage

---

## 📋 Guide par Mini-Jeu

### Pachinko3D

**Imports :**
```tsx
import { useMiniGameAudio } from '@/hooks/mini-games/useMiniGameAudio'
```

**Hook :**
```tsx
const sounds = useMiniGameAudio('pachinko')
```

**Intégration :**

```tsx
// Quand la bille est lâchée
const handleBallDrop = () => {
  sounds.ballDrop.play()
}

// Quand la bille touche un peg (dans useFrame ou collision callback)
const handlePegCollision = () => {
  sounds.pegHit.play()
}

// Quand la bille arrive dans un slot gagnant
const handleSlotWin = () => {
  sounds.slotWin.play()
}
```

**Fichiers audio requis :**
- `/public/sounds/mini-games/pachinko/ball-drop.mp3`
- `/public/sounds/mini-games/pachinko/peg-hit.mp3`
- `/public/sounds/mini-games/pachinko/slot-win.mp3`

---

### WheelOfFortune3D

**Hook :**
```tsx
const sounds = useMiniGameAudio('wheel')
```

**Intégration :**

```tsx
// Quand la roue commence à tourner
const handleSpinStart = () => {
  sounds.spinStart.play()
}

// Pendant la rotation (useFrame, play tick à intervalles)
useFrame(() => {
  if (isSpinning && shouldPlayTick) {
    sounds.tick.play()
  }
})

// Quand la roue s'arrête sur un segment gagnant
const handleWin = () => {
  sounds.win.play()
}
```

**Fichiers audio requis :**
- `/public/sounds/mini-games/wheel/spin-start.mp3`
- `/public/sounds/mini-games/wheel/tick.mp3`
- `/public/sounds/mini-games/wheel/win.mp3`

---

### DiceRoll3D

**Hook :**
```tsx
const sounds = useMiniGameAudio('dice')
```

**Intégration :**

```tsx
// Quand les dés sont lancés
const handleRollStart = () => {
  sounds.roll.play()
}

// Quand un dé rebondit (détection de collision)
const handleBounce = () => {
  sounds.bounce.play()
}

// Quand les dés s'arrêtent complètement
const handleLanded = () => {
  sounds.land.play()
}
```

**Fichiers audio requis :**
- `/public/sounds/mini-games/dice/roll.mp3`
- `/public/sounds/mini-games/dice/bounce.mp3`
- `/public/sounds/mini-games/dice/land.mp3`

---

### SlotMachine3D

**Hook :**
```tsx
const sounds = useMiniGameAudio('slots')
```

**Intégration :**

```tsx
// Quand les rouleaux commencent à tourner
const handleSpinStart = () => {
  sounds.spin.play() // Loop
}

// Quand un rouleau s'arrête
const handleReelStop = () => {
  sounds.stop.play()
}

// Quand tous les rouleaux sont arrêtés
const handleAllStopped = () => {
  sounds.spin.stop() // Arrêter le loop

  // Si jackpot (3 symboles identiques)
  if (isJackpot) {
    sounds.jackpot.play()
  }
}
```

**Fichiers audio requis :**
- `/public/sounds/mini-games/slots/spin.mp3` (loop)
- `/public/sounds/mini-games/slots/stop.mp3`
- `/public/sounds/mini-games/slots/jackpot.mp3`

---

### ScratchCard3D

**Hook :**
```tsx
const sounds = useMiniGameAudio('scratch')
```

**Intégration :**

```tsx
// Quand l'utilisateur commence à gratter
const handleScratchStart = () => {
  sounds.scratch.play() // Loop
}

// Quand l'utilisateur arrête de gratter
const handleScratchStop = () => {
  sounds.scratch.stop()
}

// Quand le prix est révélé (55% gratté)
const handleReveal = () => {
  sounds.scratch.stop()
  sounds.reveal.play()
}
```

**Fichiers audio requis :**
- `/public/sounds/mini-games/scratch/scratch.mp3` (loop)
- `/public/sounds/mini-games/scratch/reveal.mp3`

---

## 🎨 Interface de Paramètres

### Utilisation du Composant AudioSettings

**Dans une page de settings :**

```tsx
import { AudioSettings } from '@/components/settings/AudioSettings'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Paramètres</h1>

      <AudioSettings />

      {/* Autres settings */}
    </div>
  )
}
```

**Dans un modal :**

```tsx
import { AudioSettings } from '@/components/settings/AudioSettings'

function SettingsModal() {
  return (
    <Modal>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Paramètres</h2>
        <AudioSettings />
      </div>
    </Modal>
  )
}
```

---

## 📦 Acquisition des Fichiers Audio

### Sources Gratuites

1. **Freesound.org** (CC0/CC-BY)
   - Recherche par mots-clés
   - Téléchargement gratuit
   - Attribution requise pour CC-BY

2. **Zapsplat.com**
   - Gratuit avec compte
   - Attribution requise

3. **Mixkit.co**
   - Gratuit sans attribution
   - Qualité correcte

### Sources Payantes (Recommandé)

1. **AudioJungle** ($1-5 par son)
   - Qualité professionnelle
   - Licence commerciale
   - ~$50-100 pour tous les sons

2. **Epidemic Sound** (Abonnement)
   - Bibliothèque illimitée
   - ~$15/mois

### Génération IA

1. **ElevenLabs Sound Effects**
   - Génération par prompt
   - Qualité variable
   - $5-20 selon utilisation

---

## 🎯 Optimisation des Fichiers

### Format Recommandé

**MP3 :**
- Compression universelle
- Bon compromis qualité/taille
- Support tous navigateurs

### Compression FFmpeg

```bash
# Installer FFmpeg
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Linux

# Convertir en MP3 optimisé (SFX)
ffmpeg -i input.wav -b:a 96k -ar 44100 output.mp3

# Normaliser le volume
ffmpeg -i input.mp3 -filter:a loudnorm output-normalized.mp3

# Fade in/out (éviter les clics)
ffmpeg -i input.mp3 -af "afade=t=in:d=0.1,afade=t=out:st=2.9:d=0.1" output-faded.mp3
```

### Tailles Recommandées

| Type | Bitrate | Durée | Taille |
|------|---------|-------|--------|
| SFX court | 64 kbps | 0.5s | ~4 KB |
| SFX moyen | 96 kbps | 2s | ~24 KB |
| SFX long | 128 kbps | 5s | ~80 KB |
| Musique | 192 kbps | 2min | ~2.8 MB |

---

## ✅ Checklist d'Intégration

### Par Mini-Jeu

**Pachinko3D**
- [ ] Import `useMiniGameAudio`
- [ ] Hook `useMiniGameAudio('pachinko')`
- [ ] `sounds.ballDrop.play()` au lancement
- [ ] `sounds.pegHit.play()` aux collisions
- [ ] `sounds.slotWin.play()` à la victoire
- [ ] Fichiers audio créés

**WheelOfFortune3D**
- [ ] Import `useMiniGameAudio`
- [ ] Hook `useMiniGameAudio('wheel')`
- [ ] `sounds.spinStart.play()` au début
- [ ] `sounds.tick.play()` pendant rotation
- [ ] `sounds.win.play()` à la victoire
- [ ] Fichiers audio créés

**DiceRoll3D**
- [ ] Import `useMiniGameAudio`
- [ ] Hook `useMiniGameAudio('dice')`
- [ ] `sounds.roll.play()` au lancement
- [ ] `sounds.bounce.play()` aux rebonds
- [ ] `sounds.land.play()` à l'arrêt
- [ ] Fichiers audio créés

**SlotMachine3D**
- [ ] Import `useMiniGameAudio`
- [ ] Hook `useMiniGameAudio('slots')`
- [ ] `sounds.spin.play()` (loop) au début
- [ ] `sounds.stop.play()` à chaque rouleau
- [ ] `sounds.jackpot.play()` si jackpot
- [ ] Fichiers audio créés

**CoinFlip3D**
- [x] Import `useMiniGameAudio`
- [x] Hook `useMiniGameAudio('coin')`
- [x] `sounds.flip.play()` au lancement
- [x] `sounds.land.play()` à l'atterrissage
- [ ] Fichiers audio créés

**ScratchCard3D**
- [ ] Import `useMiniGameAudio`
- [ ] Hook `useMiniGameAudio('scratch')`
- [ ] `sounds.scratch.play()` (loop) pendant grattage
- [ ] `sounds.reveal.play()` à la révélation
- [ ] Fichiers audio créés

### Infrastructure

- [x] `useAudio` hook créé
- [x] `AudioContext` créé
- [x] `useMiniGameAudio` créé
- [x] `AudioSettings` component créé
- [x] `AudioProvider` intégré dans layout
- [x] Structure `/public/sounds/` créée
- [ ] Fichiers audio ajoutés
- [ ] Tests desktop
- [ ] Tests mobile

---

## 🚀 Prochaines Étapes

### Phase 1 : Acquisition Audio (TODO)

1. Télécharger/générer les sons manquants
2. Optimiser avec FFmpeg
3. Placer dans `/public/sounds/`

### Phase 2 : Intégration (TODO)

1. Intégrer dans Pachinko3D
2. Intégrer dans WheelOfFortune3D
3. Intégrer dans DiceRoll3D
4. Intégrer dans SlotMachine3D
5. Compléter CoinFlip3D (ajouter son de spin)
6. Intégrer dans ScratchCard3D

### Phase 3 : UI Settings (TODO)

1. Ajouter AudioSettings dans la page de profil
2. Ou créer un bouton audio dans le header
3. Tester la sauvegarde localStorage

### Phase 4 : Tests (TODO)

1. Tester sur Chrome/Firefox/Safari
2. Tester sur mobile iOS/Android
3. Vérifier autoplay policies
4. Optimiser performances

---

## 💡 Astuces

### Autoplay Policy

Les navigateurs bloquent l'autoplay audio. Pour contourner :

1. **Ne pas jouer de son avant interaction utilisateur**
2. **Premier son** doit être déclenché par un clic/tap
3. **Après ça**, les sons fonctionnent normalement

### Performance

- Précharger (`preload: true`) les sons critiques
- Lazy load les sons optionnels (victoire, jackpot)
- Limiter le nombre de sons simultanés (max 3-4)

### Mobile

- Tester le volume (souvent plus bas sur mobile)
- Vérifier la compatibilité MP3
- Tester avec mode silencieux iOS

---

## 📊 Résumé

**Infrastructure : ✅ CRÉÉE**
- Hooks audio fonctionnels
- Context de préférences
- Provider intégré
- Component settings UI

**Intégration : 🚧 1/6 MINI-JEUX**
- CoinFlip3D : Partiellement intégré (sans fichiers audio)
- Autres : À faire

**Fichiers Audio : ⚠️ 0/22 CRÉÉS**
- Structure de dossiers créée
- Documentation complète
- Fichiers à acquérir/générer

**Temps Estimé Restant : 6-10 heures**
- Acquisition audio : 2-4h
- Intégration : 3-4h
- Tests : 1-2h

---

**Le système audio est prêt à être utilisé dès que les fichiers audio seront ajoutés ! 🎵**
