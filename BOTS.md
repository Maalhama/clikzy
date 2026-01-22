# 🤖 Documentation Système de Bots - Clikzy

## 📋 Vue d'ensemble

Le système de bots de Clikzy simule des joueurs réalistes pour maintenir l'engagement et l'activité des jeux. Les bots sont **100% côté serveur** via un cron job.

### 🔑 Principes Fondamentaux

1. **Serveur-Side Only** : Les bots s'exécutent sur le serveur (Vercel), pas dans le navigateur
2. **Persistance Garantie** : Les jeux continuent même si aucun utilisateur n'a la page ouverte
3. **Synchronisation Automatique** : Landing, Lobby, et Page Game affichent tous les mêmes données en temps réel
4. **Réalisme Maximal** : Progression naturelle des clics, usernames variés, délais aléatoires
5. **Protection Anti-Joueur** : Les bots empêchent les joueurs réels de gagner
6. **Durée des Jeux** : Timer initial 1h → Phase finale (bataille 30min-1h59min) → Durée totale max 2h59min

### 🌐 Synchronisation Landing / Lobby / Game

**Architecture Real-Time** :
```
Cron (serveur) → Supabase DB → Real-Time Broadcast
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
              Landing Page        Lobby Page       Game Page
           (useRealtime)       (useRealtime)    (useRealtime)
```

**Comment ça marche** :
1. Le **cron serveur** génère les clics de bots
2. Les clics sont **insérés dans Supabase** (`clicks` table)
3. Supabase **broadcaste en temps réel** via Postgres Changes
4. **Toutes les pages** reçoivent instantanément les updates
5. Même si **aucune page n'est ouverte**, le cron continue de générer des clics

**Hooks de Synchronisation** :
- `useLandingRealtime.ts` : Écoute les winners + featured game
- `useLobbyRealtime.ts` : Écoute tous les jeux actifs + feed clics
- `useGame.ts` : Écoute un jeu spécifique + ses clics

**Garantie** : Peu importe où l'utilisateur se trouve (landing, lobby, game), il voit TOUJOURS les mêmes données à la milliseconde près.

---

## 🏗️ Architecture

```
Cron-job.org (toutes les 1 minute)
    ↓
/api/cron/bot-clicks (Vercel Serverless)
    ↓
    ├─ generateUsername() → Usernames déterministes
    ├─ generateRealisticTimestamp() → Délais entre clics
    └─ shouldBotClick() → Intelligence des bots
         ↓
    INSERT INTO clicks (is_bot = true, user_id = null)
    UPDATE games (end_time = gameNow + 60000)
         ↓
    Supabase Real-Time Broadcast
         ↓
    ┌────────────┼─────────────┐
    ↓            ↓             ↓
 Landing      Lobby         Game
  Page        Page          Page
```

### 🎮 Persistance des Jeux (Pages Fermées)

**Problème** : Que se passe-t-il si personne n'a la page ouverte ?

**Solution** : Les jeux s'exécutent **100% côté serveur** :
1. Le **cron s'exécute toutes les minutes** (indépendamment des clients)
2. Les **bots cliquent sur le serveur** (pas besoin de navigateur ouvert)
3. Les **timers sont calculés côté serveur** (end_time dans la DB)
4. Les **batailles continuent** même la nuit sans aucun utilisateur connecté

**Résultat** : Un jeu lancé à 2h du matin commence avec 1h de timer, puis entre en phase finale avec une bataille de 30min à 1h59min (durée totale max 2h59min), et se termine naturellement même si personne ne regarde.

---

## ⏱️ Structure de Durée des Jeux

### Timeline complète d'un jeu

```
[PHASE ACTIVE]          [PHASE FINALE - BATAILLE]
      1h                    30min à 1h59min
  ┌────────┐           ┌─────────────────────┐
  │        │           │                     │
  │  60min │  ───────→ │  Resets à 60s       │  ───→  FIN
  │        │           │  (bataille intense) │
  └────────┘           └─────────────────────┘

  Durée totale maximum = 1h + 1h59min = 2h59min
```

### Phases détaillées

**Phase 1 : Active (1h)**
- Timer initial = 60 minutes
- Clics occasionnels des bots (progression réaliste)
- Quand timer < 60s → Entrée en phase finale

**Phase 2 : Finale - Bataille (30min-1h59min)**
- Timer reset à 60s à chaque clic
- Durée de bataille aléatoire par jeu (déterministe selon gameId)
- Clics intensifs des bots (98% de chance)
- Wind-down dans les 5 dernières minutes (30% de chance)
- Après la durée de bataille → 0% de clics (laisse gagner)

**Exemple concret** :
- Jeu A : `battleDuration = 45min`
  - Phase active : 1h
  - Phase finale : 45min de bataille
  - **Durée totale : 1h45min**

- Jeu B : `battleDuration = 1h59min`
  - Phase active : 1h
  - Phase finale : 1h59min de bataille
  - **Durée totale : 2h59min (maximum possible)**

---

## ⚙️ Configuration

### Fichier : `/src/app/api/cron/bot-clicks/route.ts`

#### Constantes Principales

```typescript
// Durée de bataille EN PHASE FINALE (resets à 60s)
// Note: Jeu commence avec 1h, puis bataille 30min-1h59min = max 2h59min total
MIN_BATTLE_DURATION = 30 * 60 * 1000   // 30 min
MAX_BATTLE_DURATION = 119 * 60 * 1000  // 1h59 max

// Seuils de temps
FINAL_PHASE_THRESHOLD = 60 * 1000      // < 1 minute
INTERESTED_THRESHOLD = 5 * 60 * 1000   // < 5 minutes
CASUAL_THRESHOLD = 60 * 60 * 1000      // < 1 heure

// Probabilités de clic
FINAL_PHASE_CLICK_CHANCE = 100%        // TOUJOURS cliquer
INTERESTED_CLICK_CHANCE = 0.7          // 70%
CASUAL_CLICK_CHANCE = 0.3              // 30%
RARE_CLICK_CHANCE = 0.05               // 5%

// Cron
CRON_INTERVAL = 1 * 60 * 1000          // 1 minute
CLICKS_PER_CRON_MAX = 3                // Max 3 clics par exécution
```

---

## 🎯 Logique des Bots

### 1. Intelligence de Décision (`shouldBotClick`)

Les bots décident de cliquer selon :

#### **Phase Finale (<60s) SANS bataille**
```typescript
→ 100% de clic (TOUJOURS)
→ Raison : "final_phase_maintain"
```

#### **Phase Finale AVEC bataille active**
```typescript
Si bataille terminée (>30min à 1h59min en phase finale) → 0% (laisser gagner)
Si wind-down (5 dernières min) → 30%
Si réponse à joueur réel → 98%
Sinon → 98% (maintenir la bataille)
```

#### **Hors Phase Finale - Progression Réaliste**

| Tranche de Temps | Probabilité de Clic | Comportement |
|------------------|---------------------|--------------|
| **30-60 min** | 5% | Très peu de clics (calme) |
| **15-30 min** | 30% | Clics occasionnels |
| **5-15 min** | 70% | Clics fréquents (intérêt croissant) |
| **1-5 min** | 70% | Très actif |
| **0-1 min** | 100% | BATAILLE FINALE (clics constants) |

**Exemple de timeline** :
```
60min ────────── 30min ────────── 15min ────────── 5min ────────── 1min ────── 0
 │                 │                 │                │               │         │
5% clics      5% clics         30% clics        70% clics      100% clics   FIN
(calme)       (calme)       (occasionnel)      (actif)      (bataille)
```

#### **🚨 RÈGLE ABSOLUE : NE JAMAIS LAISSER GAGNER UN JOUEUR RÉEL**

```typescript
// Détection d'un joueur réel
if (isRealPlayerClick(last_click_user_id)) {
  // Bots répondent à 98% pour maintenir le jeu
  if (Math.random() < PLAYER_RESPONSE_CHANCE) { // 0.98
    return { shouldClick: true, reason: 'response_to_player' }
  }
}
```

**Stratégies anti-joueur** :
- Détection des clics réels (user_id !== null)
- Réponse dans les 30 secondes (REAL_PLAYER_WINDOW)
- 98% de chance de répondre immédiatement
- En phase finale : réponse GARANTIE (100%)

**Résultat** : Les joueurs réels ne gagnent JAMAIS (sauf si tous les bots sont en wind-down)

---

### 2. Timer Reset

**RÈGLE ABSOLUE** : Le timer reset TOUJOURS à **EXACTEMENT 60 secondes**.

```typescript
newEndTime = gameNow + 60000  // EXACTEMENT 60s, pas de variance
```

**Pourquoi pas `lastClickTimestamp + 60000` ?**
- Les clics ont des délais (0.5-5s) pour le feed live
- Si on utilise `lastClickTimestamp`, le timer afficherait 61-65s
- Solution : `gameNow + 60000` → Timer affiché = 01:00 pile ✅

---

### 3. Usernames Déterministes

```typescript
generateDeterministicUsername(seed: string)
```

**Seed** : `${gameId}-${timestamp}`

**Avantages** :
- Cohérence entre les utilisateurs
- Pas de random() → Même seed = même username
- Usernames réalistes : `lucas75`, `emma_off`, `TheRealNaïm`

**Pool** : 400+ prénoms (français, ibériques, maghrébins, africains)

---

### 4. Délais Entre Clics

```typescript
generateRealisticTimestamp(baseTime, clickIndex, timeLeftMs)
```

**Délais selon la phase** :

| Phase | Délai | Usage |
|-------|-------|-------|
| Critique (<10s) | 0.5-2s | Feed live uniquement |
| Urgent (<30s) | 1-3s | Feed live uniquement |
| Phase finale (<60s) | 1.5-5s | Feed live uniquement |
| Normal | 3-10s | Feed live uniquement |

**IMPORTANT** : Ces délais n'affectent PAS le timer (qui reset toujours à 60s).

---

### 5. Décalage Entre Jeux

```typescript
gameProcessingDelay += Math.floor(Math.random() * 20000) // 0-20s
const gameNow = now + gameProcessingDelay
```

**Effet** :
- Jeu 1 traité à `now + 3s`
- Jeu 2 traité à `now + 15s`
- Jeu 3 traité à `now + 22s`
- → Les timers sont décalés de 3s, 15s, 22s

---

## 🗄️ Base de Données

### Table `clicks`

```sql
user_id         UUID    NULL (pour les bots)
username        TEXT    'lucas75', 'emma_off', etc.
is_bot          BOOLEAN true
credits_spent   INTEGER 0
clicked_at      TIMESTAMP
```

### Table `games`

```sql
last_click_username   TEXT
last_click_user_id    UUID (NULL pour bots)
last_click_at         TIMESTAMP
end_time              BIGINT (ms timestamp)
total_clicks          INTEGER
battle_start_time     TIMESTAMP (début phase finale)
```

---

## 🐛 Bugs Historiques (RÉSOLUS)

### Bug 1 : Timer à 68-74s au lieu de 60s
**Cause** : `newEndTime = lastClickTimestamp + 60000`
**Solution** : `newEndTime = gameNow + 60000`

### Bug 2 : Jeux terminés prématurément
**Cause** : 5% de chance de ne pas cliquer en phase finale
**Solution** : 100% de clics en phase finale

### Bug 3 : Tous les bots cliquent en même temps
**Cause** : Tous les jeux utilisaient le même `now`
**Solution** : Délai cumulatif 0-20s entre chaque jeu

---

## 📊 Métriques & Surveillance

### Requête : Voir les clics de bots récents

```sql
SELECT username, item_name, clicked_at, game_id
FROM clicks
WHERE is_bot = true
ORDER BY clicked_at DESC
LIMIT 20;
```

### Requête : Voir les jeux actifs

```sql
SELECT id, status, end_time, total_clicks, last_click_username
FROM games
WHERE status IN ('active', 'final_phase')
ORDER BY end_time ASC;
```

---

## 🔧 Configuration Cron-job.org

**URL** : `https://clikzy.vercel.app/api/cron/bot-clicks`
**Fréquence** : `* * * * *` (toutes les minutes)
**Header** : `Authorization: Bearer ${CRON_SECRET}`

**Où trouver CRON_SECRET** :
- Production : Variables d'environnement Vercel
- Local : `.env.local`

---

## ✅ Checklist de Test

Quand tu testes les bots :

1. ✅ Les timers affichent EXACTEMENT 01:00
2. ✅ Les timers sont légèrement décalés entre les jeux (0-20s)
3. ✅ Les usernames sont variés et réalistes
4. ✅ Les clics apparaissent dans le feed live avec des délais naturels
5. ✅ Les jeux NE se terminent PAS prématurément en phase finale
6. ✅ Les compteurs de clics augmentent progressivement

---

## 🚨 Points Critiques à NE JAMAIS MODIFIER

### 1. Timer Reset
```typescript
// ✅ CORRECT
newEndTime = gameNow + 60000

// ❌ INCORRECT
newEndTime = lastClickTimestamp + 60000  // Affiche 61-65s
```

### 2. Clics en Phase Finale
```typescript
// ✅ CORRECT - 100% de clics
if (isInFinalPhase) {
  return { shouldClick: true, reason: 'final_phase_maintain' }
}

// ❌ INCORRECT - Risque de fin prématurée
if (Math.random() < 0.95) { ... }
```

### 3. Délai Entre Jeux
```typescript
// ✅ CORRECT - Décalage réaliste
gameProcessingDelay += Math.floor(Math.random() * 20000) // 0-20s

// ❌ INCORRECT - Tous synchronisés
const gameNow = now  // Pas de décalage
```

---

## 📝 Logs & Debugging

### Activer les logs détaillés

Dans le cron, ajoute des `console.log` :

```typescript
console.log(`Bot intelligence: ${totalClicks} clicks on ${clickedGames}/${results.length} games`)
```

### Voir les logs sur Vercel

1. Va sur **vercel.com** → Projet Clikzy
2. **Logs** → Filtre par `/api/cron/bot-clicks`
3. Regarde les réponses JSON

---

## 🎯 Prochaines Évolutions Possibles

- [ ] Adapter le nombre de clics selon l'heure (moins de bots la nuit)
- [ ] Bots "premium" qui cliquent plus souvent
- [ ] Pattern de clics selon le type de produit
- [ ] Simulation de "streaks" (un bot qui clique plusieurs fois de suite)

---

## 📚 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `/src/app/api/cron/bot-clicks/route.ts` | Logique principale des bots |
| `/src/lib/bots/usernameGenerator.ts` | Génération de usernames |
| `/src/lib/utils/constants.ts` | Constantes (FINAL_PHASE_RESET, etc.) |
| `CLAUDE.md` | Config crons (fréquence, URL) |

---

## 🔐 Sécurité

### Authentification
- Header `Authorization: Bearer ${CRON_SECRET}` obligatoire
- Rejet avec 401 si header incorrect

### Rate Limiting
- Exécution toutes les 1 minute (pas plus fréquent)
- Max 3 clics par jeu par exécution

### Validation
- Vérification `status IN ('active', 'final_phase')`
- Vérification `end_time > now`
- Séquence anti-triche (`sequence_number`)

---

**Dernière mise à jour** : 22/01/2026
**Version** : 2.0 (Timer exact 60s + 100% clics phase finale)
