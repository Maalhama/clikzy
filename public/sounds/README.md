# 🔊 Sons Cleekzy

Structure des fichiers audio pour les mini-jeux et l'interface.

## 📁 Structure

```
sounds/
├── mini-games/          # Sons des mini-jeux
│   ├── pachinko/
│   ├── wheel/
│   ├── dice/
│   ├── slots/
│   ├── coin/
│   └── scratch/
├── ui/                  # Sons de l'interface
└── ambient/             # Musique d'ambiance
```

## 🎮 Mini-Jeux

### Pachinko
- `ball-drop.mp3` - Son du lancement de la bille
- `peg-hit.mp3` - Son quand la bille tape un peg (court, subtil)
- `slot-win.mp3` - Son de victoire quand la bille arrive dans un slot

### Roue de la Fortune
- `spin-start.mp3` - Son au début de la rotation
- `tick.mp3` - Son du tic-tac pendant la rotation
- `win.mp3` - Son de victoire

### Dés
- `roll.mp3` - Son au lancement des dés
- `bounce.mp3` - Son des rebonds (peut être joué plusieurs fois)
- `land.mp3` - Son final quand les dés s'arrêtent

### Machine à Sous
- `spin.mp3` - Son des rouleaux qui tournent (loop)
- `stop.mp3` - Son quand un rouleau s'arrête
- `jackpot.mp3` - Son de jackpot (3 symboles identiques)

### Pièce
- `flip.mp3` - Son au lancement de la pièce
- `spin.mp3` - Son de la pièce qui tourne (loop)
- `land.mp3` - Son quand la pièce atterrit

### Carte à Gratter
- `scratch.mp3` - Son du grattage (loop pendant le grattage)
- `reveal.mp3` - Son de révélation du prix

## 🎨 Interface (UI)

- `click.mp3` - Clic sur un bouton
- `hover.mp3` - Survol d'un élément interactif
- `success.mp3` - Action réussie (générique)
- `error.mp3` - Erreur (générique)
- `notification.mp3` - Nouvelle notification

## 🎵 Ambiance

- `lobby-music.mp3` - Musique de fond du lobby (loop, optionnel)

## 📥 Sources Recommandées

### Gratuit
- [Freesound.org](https://freesound.org/) - CC0/CC-BY
- [Zapsplat.com](https://zapsplat.com/) - Gratuit avec attribution
- [Mixkit.co](https://mixkit.co/free-sound-effects/) - Gratuit sans attribution

### Payant (Qualité Pro)
- [AudioJungle](https://audiojungle.net/) - $1-5 par son
- [Epidemic Sound](https://epidemicsound.com/) - Abonnement
- [Artlist](https://artlist.io/) - Abonnement

### IA Génération
- [ElevenLabs](https://elevenlabs.io/) - Génération par prompt
- [Loudly](https://loudly.com/) - AI Music & SFX

## 🎯 Format Recommandé

**MP3 (universel) :**
- SFX : 64-96 kbps
- Musique : 128-192 kbps
- Sample rate : 44.1 kHz

**Compression FFmpeg :**
```bash
ffmpeg -i input.wav -b:a 96k -ar 44100 output.mp3
```

## ⚙️ Intégration

Les sons sont automatiquement chargés par le hook `useMiniGameAudio()`.

**Exemple :**
```typescript
const sounds = useMiniGameAudio('pachinko')
sounds.ballDrop.play()
```

Le volume est géré par les préférences utilisateur (AudioContext).

## ✅ Checklist

### Mini-Jeux
- [ ] Pachinko (3 sons)
- [ ] Roue (3 sons)
- [ ] Dés (3 sons)
- [ ] Slots (3 sons)
- [ ] Pièce (3 sons)
- [ ] Carte à Gratter (2 sons)

### UI
- [ ] Click
- [ ] Hover
- [ ] Success
- [ ] Error
- [ ] Notification

### Ambiance
- [ ] Lobby music (optionnel)

**Total : ~22 sons à créer/télécharger**
