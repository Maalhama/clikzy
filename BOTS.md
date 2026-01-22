# 🤖 Documentation Système de Bots - Clikzy v5.0

## 📋 Vue d'ensemble

Le système de bots simule des joueurs réalistes avec une **architecture hybride**:

1. **Backend (Cron)**: Enregistre les vrais clics en base de données toutes les 60s
2. **Frontend (Simulation)**: Affiche les clics en temps réel pour une expérience fluide

Chaque jeu est **UNIQUE** avec son propre comportement aléatoire.

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

## 🖥️ Simulation Frontend

### Architecture Hybride

```
┌─────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                          │
│                    (voit les clics en temps réel)           │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                     FRONTEND (React)                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           useBotSimulation Hook                      │  │
│  │  - Calcule les timings des clics (même logique)     │  │
│  │  - Affiche les clics visuellement                   │  │
│  │  - Met à jour le timer optimistiquement             │  │
│  └─────────────────────────────────────────────────────┘  │
│                              ▲                             │
│                              │ Sync Realtime               │
└──────────────────────────────┼────────────────────────────┘
                               │
┌──────────────────────────────┴────────────────────────────┐
│                      BACKEND (Cron)                        │
│  - Enregistre les vrais clics en DB toutes les 60s        │
│  - Met à jour le timer officiellement                      │
│  - Gère la fin du jeu                                      │
└───────────────────────────────────────────────────────────┘
```

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/hooks/useBotSimulation.ts` | Hook de simulation frontend |
| `src/app/api/cron/bot-clicks/route.ts` | Backend cron (vrais clics) |

### Fonctionnement

1. **Frontend**: Calcule quand les bots devraient cliquer
2. **Frontend**: Affiche les clics visuellement avec `addClick()`
3. **Frontend**: Met à jour le timer avec `optimisticUpdate()`
4. **Backend**: Cron enregistre les vrais clics toutes les 60s
5. **Supabase Realtime**: Synchronise le frontend avec les vrais clics

### Avantages

- ✅ Expérience temps réel fluide (pas d'attente de 60s)
- ✅ Clics espacés aléatoirement (réaliste)
- ✅ Synchronisation automatique avec le backend
- ✅ Pas de coût supplémentaire (pas de serveur dédié)

---

## 🔧 Configuration Technique

### Cron (Backend)
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

**Version**: 5.0
**Dernière mise à jour**: 22/01/2026

---

## 📁 Fichiers du Système

```
src/
├── hooks/
│   └── useBotSimulation.ts      # Simulation frontend temps réel
├── app/
│   └── api/
│       └── cron/
│           └── bot-clicks/
│               └── route.ts     # Backend cron (vrais clics DB)
└── lib/
    └── bots/
        └── usernameGenerator.ts # Génération de pseudos réalistes
```
