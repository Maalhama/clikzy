# Feature: CLEEKZY - Plateforme d'enchères temps réel

## Vue d'ensemble

CLEEKZY est une plateforme web de jeu d'enchères interactif en temps réel. Le principe : le dernier utilisateur à cliquer sur un objet AVANT la fin du timer gagne l'objet.

### Règles du jeu
- Timer initial : **24 heures**
- Phase normale (>1 min restante) : les clics sont enregistrés mais n'affectent pas le timer
- Phase finale (<1 min restante) : chaque clic **remet le timer à 1 minute**
- Timer = 0 → le dernier clic gagne l'objet
- Un utilisateur ne peut pas cliquer deux fois de suite
- Cooldown : 1 seconde entre chaque clic
- 1 clic = 1 crédit

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15 App Router |
| Styling | Tailwind CSS |
| Backend | Next.js Server Actions |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (Magic Link + OAuth) |
| Realtime | Supabase Realtime (Broadcast + Postgres Changes) |
| Déploiement | Vercel |

---

## Spécifications fonctionnelles

### Authentification
- Magic Link (email sans mot de passe)
- OAuth : Google, GitHub
- 10 crédits offerts à l'inscription
- Session persistante avec refresh automatique

### Partie de jeu
- Une partie = un objet à gagner
- Statuts : `waiting` → `active` → `final_phase` → `ended`
- Transition automatique vers `final_phase` quand timer < 1 minute
- Validation serveur de chaque clic (anti-triche)

### Système de crédits
- 1 clic = 1 crédit dépensé
- Historique des dépenses
- Préparé pour monétisation future (achat de crédits)

### Temps réel
- Timer synchronisé sur tous les clients
- Affichage instantané du dernier clic
- Notification de changement de phase
- Animation de victoire

---

## Architecture technique

### Structure du projet

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              # Layout protégé
│   │   ├── page.tsx                # Lobby (liste parties)
│   │   ├── game/[id]/page.tsx      # Page de jeu
│   │   └── profile/page.tsx        # Profil + crédits
│   ├── auth/
│   │   └── callback/route.ts       # OAuth callback
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   └── globals.css
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── modal.tsx
│   ├── game/
│   │   ├── Timer.tsx               # Affichage timer animé
│   │   ├── ClickZone.tsx           # Zone cliquable
│   │   ├── ItemDisplay.tsx         # Objet à gagner
│   │   ├── LastClicker.tsx         # Dernier clic
│   │   ├── PlayerStatus.tsx        # Statut joueur
│   │   └── WinnerModal.tsx         # Modal victoire
│   └── layout/
│       ├── Header.tsx
│       └── AuthButton.tsx
│
├── actions/
│   ├── auth.ts                     # signIn, signOut
│   ├── game.ts                     # click, joinGame, getGame
│   └── credits.ts                  # getCredits, useCredits
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient
│   │   └── server.ts               # createServerClient
│   └── utils/
│       ├── timer.ts                # calculateTimeLeft, formatTime
│       └── constants.ts            # FINAL_PHASE_DURATION, etc.
│
├── hooks/
│   ├── useGame.ts                  # État partie temps réel
│   ├── useTimer.ts                 # Décompte local
│   └── useAuth.ts                  # État utilisateur
│
├── types/
│   ├── database.ts                 # Types générés Supabase
│   ├── game.ts                     # Game, Click, Item
│   └── user.ts                     # Profile, Session
│
└── middleware.ts                   # Protection routes
```

### Schéma Database

```sql
-- ================================
-- PROFILES (extension de auth.users)
-- ================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  credits INTEGER DEFAULT 10 CHECK (credits >= 0),
  total_wins INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================
-- ITEMS (objets à gagner)
-- ================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  retail_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- GAMES (parties)
-- ================================
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'final_phase', 'ended');

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  status game_status DEFAULT 'waiting',

  -- Timer (source de vérité serveur)
  start_time TIMESTAMPTZ,
  end_time BIGINT,                    -- Timestamp en millisecondes
  initial_duration INTEGER DEFAULT 86400000, -- 24h en ms
  final_phase_duration INTEGER DEFAULT 60000, -- 1 min en ms

  -- Dernier clic
  last_click_user_id UUID REFERENCES profiles(id),
  last_click_username TEXT,
  last_click_at TIMESTAMPTZ,

  -- Résultat
  winner_id UUID REFERENCES profiles(id),
  total_clicks INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_end_time ON games(end_time) WHERE status != 'ended';

-- ================================
-- CLICKS (historique des clics)
-- ================================
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  credits_spent INTEGER DEFAULT 1,

  -- Anti-triche : position dans la séquence
  sequence_number INTEGER NOT NULL
);

-- Index pour vérifier le dernier clic
CREATE INDEX idx_clicks_game_user ON clicks(game_id, user_id);
CREATE INDEX idx_clicks_game_sequence ON clicks(game_id, sequence_number DESC);

-- ================================
-- WINNERS (historique des gagnants)
-- ================================
CREATE TABLE winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID UNIQUE NOT NULL REFERENCES games(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  item_id UUID NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  item_value DECIMAL(10,2),
  total_clicks_in_game INTEGER,
  won_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Profiles : lecture publique, modification par propriétaire
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Items : lecture publique
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT TO authenticated USING (true);

-- Games : lecture publique
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT TO authenticated USING (true);

-- Clicks : lecture publique, insertion par authenticated
CREATE POLICY "Clicks are viewable by everyone"
  ON clicks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clicks"
  ON clicks FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Winners : lecture publique
CREATE POLICY "Winners are viewable by everyone"
  ON winners FOR SELECT TO authenticated USING (true);
```

### Flux temps réel (Supabase Realtime)

```typescript
// Channel par partie
const gameChannel = supabase.channel(`game:${gameId}`)

// Événements Broadcast (faible latence)
gameChannel.on('broadcast', { event: 'click' }, (payload) => {
  // { userId, username, clickedAt, timeLeft }
})

gameChannel.on('broadcast', { event: 'phase_change' }, (payload) => {
  // { newPhase: 'final_phase' | 'ended', timeLeft }
})

gameChannel.on('broadcast', { event: 'game_end' }, (payload) => {
  // { winnerId, winnerUsername, itemName }
})

// Postgres Changes (backup pour état)
gameChannel.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'games',
  filter: `id=eq.${gameId}`
}, (payload) => {
  // Sync état si déconnexion
})
```

---

## Direction artistique

### Palette de couleurs

```css
:root {
  --bg-primary: #0B0F1A;      /* Fond principal */
  --bg-secondary: #141B2D;    /* Cartes, modals */
  --neon-purple: #9B5CFF;     /* Accent principal */
  --neon-blue: #3CCBFF;       /* Accent secondaire */
  --neon-pink: #FF4FD8;       /* Highlights, alertes */
  --text-primary: #EDEDED;    /* Texte principal */
  --text-secondary: #8B9BB4;  /* Texte secondaire */
  --success: #00FF88;         /* Victoire */
  --danger: #FF4757;          /* Erreur, alerte */
}
```

### Effets visuels

```css
/* Glow néon */
.neon-glow {
  box-shadow: 0 0 20px var(--neon-purple),
              0 0 40px rgba(155, 92, 255, 0.3);
}

/* Pulse timer < 5s */
@keyframes pulse-danger {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.timer-critical {
  animation: pulse-danger 0.5s ease-in-out infinite;
  color: var(--danger);
  text-shadow: 0 0 20px var(--danger);
}

/* Flash au clic */
@keyframes click-flash {
  0% { background: rgba(155, 92, 255, 0.5); }
  100% { background: transparent; }
}
```

---

## Plan d'exécution

### Phase 1: Setup & Infrastructure
- [x] Initialiser projet Next.js 16 (mis à jour depuis 15)
- [x] Configurer Supabase clients (browser + server)
- [x] Créer le schéma database (migrations SQL)
- [ ] Configurer Supabase Auth (Magic Link + OAuth) → Phase 2
- [x] Setup Tailwind avec thème gaming (couleurs néon, animations)

### Phase 2: Authentification
- [ ] Créer les clients Supabase (browser + server)
- [ ] Implémenter middleware de protection
- [ ] Page login (Magic Link + OAuth buttons)
- [ ] Page register avec choix username
- [ ] Callback OAuth + création profil auto

### Phase 3: Core Backend (Server Actions)
- [ ] Action `createGame` (admin)
- [ ] Action `getActiveGames` (lobby)
- [ ] Action `getGame` (détail partie)
- [ ] Action `click` avec validations :
  - Utilisateur authentifié
  - Assez de crédits
  - Pas deux clics consécutifs
  - Cooldown respecté
  - Partie active
- [ ] Action `useCredits` (déduction atomique)

### Phase 4: Temps réel
- [ ] Hook `useGame` (subscribe au channel)
- [ ] Hook `useTimer` (décompte local)
- [ ] Broadcast des clics depuis Server Action
- [ ] Gestion changement de phase
- [ ] Détection fin de partie + winner

### Phase 5: Frontend - UI Gaming
- [ ] Layout principal (Header, fond sombre)
- [ ] Composant `Timer` (animé, pulse critique)
- [ ] Composant `ClickZone` (zone cliquable, feedback)
- [ ] Composant `ItemDisplay` (objet à gagner)
- [ ] Composant `LastClicker` (dernier clic)
- [ ] Composant `PlayerStatus` (crédits, position)
- [ ] Modal `WinnerModal` (animation victoire)
- [ ] Page Lobby (liste des parties)
- [ ] Page Game (assemblage complet)

### Phase 6: Polish & Sécurité
- [ ] Anti-double clic (debounce + server validation)
- [ ] Rate limiting sur Server Actions
- [ ] Gestion erreurs gracieuse
- [ ] États de chargement (skeletons)
- [ ] Responsive mobile
- [ ] Tests manuels des scénarios

---

## Validation des clics (anti-triche)

```typescript
// actions/game.ts
export async function click(gameId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Non authentifié')

  // 1. Vérifier les crédits
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < 1) {
    throw new Error('Crédits insuffisants')
  }

  // 2. Vérifier l'état de la partie
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (!game || game.status === 'ended' || game.status === 'waiting') {
    throw new Error('Partie non active')
  }

  // 3. Vérifier pas deux clics consécutifs
  if (game.last_click_user_id === user.id) {
    throw new Error('Vous ne pouvez pas cliquer deux fois de suite')
  }

  // 4. Vérifier cooldown (1 seconde)
  const { data: lastClick } = await supabase
    .from('clicks')
    .select('clicked_at')
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .order('clicked_at', { ascending: false })
    .limit(1)
    .single()

  if (lastClick) {
    const timeSinceLastClick = Date.now() - new Date(lastClick.clicked_at).getTime()
    if (timeSinceLastClick < 1000) {
      throw new Error('Cooldown actif')
    }
  }

  // 5. Transaction : déduire crédit + enregistrer clic
  // ... (voir implémentation complète)
}
```

---

## Logique du timer

```typescript
// lib/utils/timer.ts

export const INITIAL_DURATION = 24 * 60 * 60 * 1000 // 24h
export const FINAL_PHASE_THRESHOLD = 60 * 1000      // 1 minute
export const FINAL_PHASE_RESET = 60 * 1000          // Reset à 1 minute

export function calculateTimeLeft(endTime: number): number {
  return Math.max(0, endTime - Date.now())
}

export function isInFinalPhase(timeLeft: number): boolean {
  return timeLeft > 0 && timeLeft <= FINAL_PHASE_THRESHOLD
}

export function calculateNewEndTime(currentEndTime: number, clicked: boolean): number {
  const timeLeft = calculateTimeLeft(currentEndTime)

  // Si en phase finale et clic valide, reset à 1 minute
  if (clicked && isInFinalPhase(timeLeft)) {
    return Date.now() + FINAL_PHASE_RESET
  }

  return currentEndTime
}

export function formatTime(ms: number): string {
  if (ms <= 0) return '00:00:00'

  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((ms % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
```

---

## Notes importantes

### Performance
- Timer calculé côté client à partir de `end_time` serveur
- Broadcast pour les clics (latence ~6ms)
- Postgres Changes en backup pour resync

### Sécurité
- Toute validation côté serveur
- RLS sur toutes les tables
- Rate limiting sur les Server Actions
- `getUser()` jamais `getSession()` côté serveur

### Scalabilité
- Architecture prête pour plusieurs parties simultanées
- Channel par partie pour isolation
- Index optimisés sur les requêtes fréquentes

### Anti-triche
- Validation serveur de chaque clic
- Vérification cooldown
- Vérification double clic consécutif
- Séquence numérotée des clics
