# 🤖 Documentation Système de Bots - Clikzy v4.0

## 📋 Vue d'ensemble

Le système de bots simule des joueurs réalistes. Chaque jeu est **UNIQUE** avec son propre comportement aléatoire.

---

## ⏱️ Phases du Jeu

### Timeline complète

```
[1h → 30min]     [30min → 15min]    [15min → 1min]     [< 1min]
Positioning       Building            Active             Phase Finale
1 clic / 3min     1 clic / 1.5min    1 clic / 1min      3 clics / min
```

### Phase 1: Positioning (1h → 30min)
- **Fréquence**: 1 clic toutes les ~3 minutes
- **Comportement**: Les bots se positionnent, activité légère
- **Probabilité par tour de cron**: ~33%

### Phase 2: Building (30min → 15min)
- **Fréquence**: 1 clic toutes les ~1min30
- **Comportement**: L'intérêt monte, plus de clics
- **Probabilité par tour de cron**: ~67%

### Phase 3: Active (15min → 1min)
- **Fréquence**: 1 clic par minute
- **Comportement**: Engagement fort
- **Probabilité par tour de cron**: ~100%

### Phase 4: Phase Finale (< 1min)
- **Fréquence**: 3 clics par minute
- **Comportement**: Bataille intense entre bots
- **Timer reset**: EXACTEMENT 60 secondes après chaque clic

---

## 🎯 Comportement des 3 Clics en Phase Finale

Les 3 clics sont **espacés aléatoirement** dans la minute:

```
Exemple:
- Bot1 clique après 13s → Timer reset à 60s
- Bot2 clique 9s après Bot1 → Timer à 51s
- Bot3 clique 32s après Bot2 → Timer à 28s

Total: 13 + 9 + 32 = 54s (< 60s)
```

**Résultat**: Les clics arrivent à des moments variés (pas tous en même temps)

---

## ⚔️ Système de Bataille

### Durée
- **Minimum**: 30 minutes
- **Maximum**: 1h59 minutes
- **Déterministe**: Chaque jeu a sa propre durée (basée sur gameId)

### Progression
1. **0% → 90% de la bataille**: 3 clics/min constants
2. **90% → 100% de la bataille**: Clics diminuent progressivement
3. **Bataille terminée**: Les bots arrêtent de cliquer → Timer descend à 0

### Fin du Jeu
- Le timer atteint **0 pile**
- Le dernier cliqueur est déclaré **gagnant**
- Le jeu passe en statut **"ended"**

---

## 🎲 Personnalité Unique par Jeu

Chaque jeu a un **facteur de personnalité** (0.7 à 1.3):
- **0.7**: Jeu calme, bots moins actifs
- **1.0**: Jeu normal
- **1.3**: Jeu intense, bots très actifs

Ce facteur multiplie les probabilités de clic.

---

## 🔧 Configuration Technique

### Cron
- **Fréquence**: Toutes les 60 secondes (cron-job.org)
- **URL**: `https://clikzy.vercel.app/api/cron/bot-clicks`
- **Auth**: `Authorization: Bearer ${CRON_SECRET}`

### Probabilités par Phase

| Phase | Timer | Prob/tour | Clics |
|-------|-------|-----------|-------|
| Positioning | 1h → 30min | 33% | 1 |
| Building | 30min → 15min | 67% | 1 |
| Active | 15min → 1min | 100% | 1 |
| Finale | < 1min | 100% | 3 |

---

## 🛡️ Protections

### Race Conditions
```typescript
// Update SEULEMENT si le jeu est encore actif
await supabase
  .from('games')
  .update(data)
  .eq('id', game.id)
  .in('status', ['active', 'final_phase'])
```

### Timer Reset
```typescript
// EXACTEMENT 60 secondes, pas de variance
newEndTime = now + 60000
```

---

## 📊 Base de Données

### Table `games`
- `status`: 'active' | 'final_phase' | 'ended'
- `end_time`: Timestamp en millisecondes
- `battle_start_time`: Début de la phase finale
- `last_click_username`: Dernier cliqueur
- `total_clicks`: Nombre total de clics

### Table `clicks`
- `is_bot`: true pour les clics de bots
- `user_id`: null pour les bots
- `clicked_at`: Timestamp du clic

---

## ✅ Checklist de Test

1. ✅ Timer affiche EXACTEMENT 01:00 après un clic en phase finale
2. ✅ Les clics arrivent à des moments variés (pas synchronisés)
3. ✅ Chaque jeu a un comportement différent
4. ✅ La bataille dure 30min à 1h59min
5. ✅ Les clics diminuent vers la fin de la bataille
6. ✅ Le jeu se termine quand timer = 0

---

**Version**: 4.0
**Dernière mise à jour**: 22/01/2026
