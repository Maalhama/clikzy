# Audit 05 — Performance frontend & architecture de rendu — Cleekzy

Date : 2026-06-18 · Périmètre : bundle, server/client, waterfalls de data, re-renders & boucles,
images/fonts, animations, realtime. Méthode : lecture adversariale du code + **build de production
réel** (`next build`, Next 16.2.9 Turbopack, build OK) avec analyse des chunks
(`.next/server/app/**/page_client-reference-manifest.js` → mapping route→chunks, puis grep des
signatures de libs dans `.next/static/chunks/*.js`).

## Vérification des fixes annoncés (06-17 / 06-12)

| Fix annoncé | Statut réel | Preuve |
|---|---|---|
| CookieConsent sans framer-motion (root layout) | ✅ tenu | `CookieConsent.tsx` = transitions CSS pures, 0 import framer |
| GSAP/ArenaAtmosphere sorti du baseline `(main)`/`(auth)` | ✅ tenu | `ArenaAtmosphereLazy.tsx` = `dynamic(... { ssr:false })` ; aucun chunk gsap dans `rootMainFiles` |
| GameCard : boucle RAF permanente par carte supprimée | ✅ tenu | `GameCard.tsx:68-80` = `setTimeout` adaptatif 1s/250ms, s'arrête à 0 |
| ItemGauge : filtre `brightness/saturate` en boucle supprimé | ✅ tenu | `globals.css:2574-2595` = anims sur `opacity`/`transform`/`background-position` (compositées) + garde `prefers-reduced-motion` (`:2598`) |
| useTimer : tick 100ms permanent supprimé | ✅ tenu | `useTimer.ts:31-48` = `setTimeout` adaptatif, stoppe à 0 |
| SSR Collection / Clans / Classement / VIP | ✅ tenu | pages `async`, clients consomment `initialData`/`initialRows` ; `LeaderboardClient.tsx:26-30` skip explicite du 1er fetch |
| getCurrentUser mémoïsé | ✅ tenu | `getCurrentUser.ts:13` = `cache(async …)` |
| `<Image sizes>` game-client + avatar profil | ✅ corrigé depuis | game-client `sizes="(min-width:1024px) 220px, 200px"` (`:380`,`:747`), profil `sizes="80px"` |

**Régression / fix incomplet détecté :** le fix « framer-motion hors du baseline » a été contourné
une couche plus bas — voir P1-1.

---

## Findings (triés par sévérité)

### [P1] framer-motion (~123 KB brut / ~40 KB gz) réinjecté dans TOUTES les routes `(main)` via le layout
- **Fichier** : `src/app/(main)/layout.tsx:61` (`<InstallBanner/>`) + `:19` (`ClientProviders` → `BadgeNotificationContainer`)
- **Chaîne** : `InstallBanner.tsx:4` (`import { motion, AnimatePresence } from 'framer-motion'`) + `IOSInstallTour.tsx:5` + `BadgeNotification.tsx:4` (`BadgeNotificationContainer` rendu inconditionnellement dans `ClientProviders.tsx:19`).
- **Impact** : framer-motion est chargé sur **chaque route `(main)`** (lobby, game, profile, collection, shop, clans, classement, mini-games, wrapped, admin, cadeau…), y compris des pages qui n'animent rien. C'est exactement la classe de bug « corrigée » pour `CookieConsent` au niveau root, réintroduite au niveau du layout `(main)`. Coût payé par 100 % des utilisateurs connectés à chaque navigation app.
- **Preuve (build réel)** : la page `/classement` n'importe **aucun** framer-motion dans sa source (`src/components/leaderboard/**` + `(main)/classement/**` = 0 hit `grep framer-motion`), pourtant son manifeste de chunks (`.next/server/app/(main)/classement/page_client-reference-manifest.js`) référence `static/chunks/0dpger1jih1_d.js` (**123,5 KB**), identifié comme le cœur framer-motion (contient `MotionConfig`, `whileHover`, `VisualElement`, `animateChanges`). La seule source possible est le layout `(main)`.
- **Correctif** :
  1. `InstallBanner` : convertir l'enter/exit en transitions CSS (comme `CookieConsent` l'a fait) — c'est un simple slide + fade, framer n'apporte rien. Idem `IOSInstallTour`.
  2. `BadgeNotificationContainer` : soit le passer en CSS (`@keyframes` + classes conditionnelles), soit le charger en `next/dynamic({ ssr:false })` (il ne s'affiche qu'au déblocage d'un badge, événement rare).
  3. Filet de sécurité global : ajouter `experimental: { optimizePackageImports: ['framer-motion', 'lucide-react'] }` dans `next.config.ts` (absent aujourd'hui) pour limiter la surface importée.
- **Statut** : ⬜ à corriger (régression du fix 06-17).

### [P1] framer-motion eagerement bundlé dans les routes lobby & game via imports statiques de modales conditionnelles
- **Fichiers** : `src/app/(main)/lobby/LobbyClient.tsx:14,19,23,15` (imports statiques de `LobbyChestsModal`, `PaymentSuccessModal`, `RewardsCalendarModal`, `LobbyTour`) ; `src/app/(main)/game/[id]/game-client.tsx:4,23,29` (`AnonGateModal`, `CreditPacksModal`, `VIPSubscriptionModal`).
- **Impact** : ces modales (chacune dépendante de framer-motion et parfois lourde, ex. `CaseOpeningModal` via `LobbyChestsModal`) sont **dans le bundle initial** des deux routes les plus chaudes du produit alors qu'elles ne s'affichent que sur action (ouverture de coffre, achat, gate anon). Aucune n'est `next/dynamic`. Preuve build : la page `/lobby` tire 6 chunks contenant `AnimatePresence`/`MotionConfig` dont le 123,5 KB framer + `2ya8ck05knbyx.js` (64 KB) + `1l7li9_bow798.js` (54 KB).
- **Correctif** : `const CreditPacksModal = dynamic(() => import('…'), { ssr:false })` (idem VIP, AnonGate, RewardsCalendar, LobbyChests/CaseOpening, LobbyTour). Le rendu reste gardé par un booléen `isOpen` → la modale ne télécharge son JS qu'à la première ouverture. Gain estimé : plusieurs centaines de KB hors du chemin critique des 2 routes principales.
- **Statut** : ⬜ à corriger (backlog P2 06-17, toujours ouvert).

### [P1] Sous-arbres mobile + desktop de la page de jeu montés EN MÊME TEMPS (doublons de realtime, d'intervals et d'image priority)
- **Fichier** : `src/app/(main)/game/[id]/game-client.tsx` — bloc mobile `lg:hidden` (`:331`→`:698`) et bloc desktop `hidden lg:block` (`:707`→`:1034`) sont **tous deux dans le DOM** ; le CSS n'en cache qu'un.
- **Impact** : tout ce qui vit dans ces deux sous-arbres est **monté en double** sur chaque page de jeu :
  - `GameContenders` ×2 → 2× `setInterval(load, 30_000)` (`GameContenders.tsx:22`), un invisible.
  - `GameClicksFeed` ×2 → chaque `FeedRow` lance un `setInterval(…,1000)` (`GameClicksFeed.tsx:49-54`) ; jusqu'à 10 lignes × 2 montages = ~20 timers/s dont la moitié invisibles.
  - `GameComments` ×2 (`:694`,`:812`).
  - `<Image … priority>` produit ×2 (`:376`/`:743`) → le navigateur **précharge les deux** images (gaspillage de bande passante LCP).
  - `useGame` n'est appelé qu'une fois (bien), mais les feeds/contenders sont des composants indépendants qui peuvent ouvrir leurs propres requêtes.
- **Correctif** : extraire UN seul arbre de sous-composants (`ProductCard`, `GameTimerCard`, `ClickButton`, `GameRules`, `GameContenders`, `GameClicksFeed`, `GameComments`) stylé en responsive Tailwind (`grid`/`flex` + classes `lg:`), comme le reste de l'app. La distinction mobile/desktop ne porte que sur l'agencement, pas sur le besoin de deux instances. (Refactor déjà identifié 06-17 mais le coût perf — double realtime/timers/priority — n'était pas chiffré.)
- **Statut** : ⬜ à corriger.

### [P2] useLobbyRealtime : double mécanisme d'ingestion (polling 5s + souscription realtime INSERT) sur chaque client lobby
- **Fichier** : `src/hooks/lobby/useLobbyRealtime.ts:64-107` (polling) ET `:296-326` (subscribe INSERT `games`).
- **Impact** : chaque onglet lobby ouvert exécute un `setInterval(pollForNewGames, 5000)` qui fait un `select *, item:items(*)` de jusqu'à **50 jeux toutes les 5 s**, EN PLUS d'une souscription realtime qui couvre déjà l'INSERT de nouveaux jeux. C'est redondant : le realtime suffit pour détecter les nouvelles parties. Coût = 12 requêtes lourdes/minute/visiteur (quota Supabase FREE déjà sous tension — cf. mémoire `cleekzy-supabase-billing`).
- **Correctif** : supprimer le polling et s'appuyer sur la souscription INSERT existante (déjà gérée `:296`), ou — si on veut un filet anti-désync — espacer le poll à 30-60 s et le limiter à un `select id` (diff léger) plutôt qu'un select complet de 50 lignes. Garder la souscription comme source primaire.
- **Statut** : ⬜ à corriger.

### [P2] Page de jeu : `recentClicks` fetché côté serveur puis JETÉ, re-fetché côté client (double travail + waterfall)
- **Fichiers** : `src/app/(main)/game/[id]/page.tsx:48-55` (requête `clicks` + join `profiles`, limit 10) → passé en prop `recentClicks` → **ignoré** : `game-client.tsx:69` le destructure en `recentClicks: _initialClicks` (préfixe `_` = non utilisé). `useGame.ts:35-61` re-fait un `fetch('/api/clicks/recent?game_id=…')` au montage.
- **Impact** : 1 requête serveur (avec join) gaspillée à chaque ouverture de jeu + 1 aller-retour client supplémentaire avant l'affichage du feed (waterfall serveur→client). Même observation pour `initialCredits` (`:66` = `_initialCredits`, le contexte `useCredits` fournit la valeur). Au final le SEO/SSR fait du travail dont l'UI ne se sert pas.
- **Correctif** : soit retirer le fetch serveur de `recentClicks`/`initialCredits` (et l'`Image priority` correspondante reste OK), soit — préférable — hydrater `useGame` avec `initialClicks` (`useState(initialClicks)`) et ne déclencher le `fetch` que si la prop est vide. Supprime un round-trip sur la route la plus chaude.
- **Statut** : ⬜ à corriger.

### [P2] LobbyPage : waterfall résiduel (getProgression séquentiel après le Promise.all + le fetch coffres)
- **Fichier** : `src/app/(main)/lobby/page.tsx` — `Promise.all` initial (`:83`), puis `await getCurrentUser()` (`:128`, gratuit car `cache()`), puis `Promise.all` coffres (`:131`), puis **`await getProgression()`** séquentiel (`:142`).
- **Impact** : la progression du joueur connecté est un 3ᵉ aller-retour DB en série après les coffres, alors qu'elle ne dépend d'aucun d'eux. Ajoute ~1 RTT au TTFB du lobby pour les connectés.
- **Correctif** : `getCurrentUser()` étant mémoïsé, le résoudre en tête puis fusionner coffres + progression dans le `Promise.all` principal (ou un seul `Promise.all` conditionnel `user ? [...] : []`). Tout part en parallèle.
- **Statut** : ⬜ à corriger.

### [P2] Profile : fetch `items` séquentiel après le Promise.all (waterfall)
- **Fichier** : `src/app/(main)/profile/page.tsx:55-58` — après le `Promise.all` de 9 requêtes (`:25`), un `await supabase.from('items').select('*').in('id', itemIds)` séquentiel car il dépend de `winnerRows`.
- **Impact** : 1 RTT supplémentaire en série sur la page profil. Mineur (1 seul saut, page non temps-réel).
- **Correctif** : faire renvoyer les items directement par la RPC `get_my_winners` (embed/jointure côté SQL) pour éliminer le saut. À défaut, laisser tel quel (impact faible).
- **Statut** : ⬜ optionnel.

### [P2] Aucun `optimizePackageImports` ni budget bundle ; modales lourdes statiques généralisées
- **Fichier** : `next.config.ts` (pas d'`experimental.optimizePackageImports`).
- **Impact** : `framer-motion` et `lucide-react` (37 importeurs framer recensés ; lucide importé un peu partout) ne bénéficient pas de l'optimisation d'imports de Next. `canvas-confetti` est correctement isolé à la route `mini-games` (`MiniGamesClient.tsx`), bien. `remotion` n'est PAS importé dans `src/` (vérifié : 0 hit) → pas dans le bundle app, bien. `simple-icons` est importé en **named imports** (`BrandMarquee.tsx:5-28`, 22 icônes) et le package expose `sideEffects:false` + `module` ESM → tree-shaké correctement, **non problématique** (contrairement à la crainte initiale).
- **Correctif** : ajouter `experimental.optimizePackageImports: ['framer-motion','lucide-react']`. Combiné aux P1, ramène le baseline `(main)` à un niveau sain.
- **Statut** : ⬜ à corriger (quick win).

### [P3] `createClient` serveur non mémoïsé (`cache()`)
- **Fichier** : `src/lib/supabase/server.ts:11` (`export async function createClient()` sans `cache`).
- **Impact** : faible. `createClient` lui-même ne fait pas d'I/O réseau (lit les cookies, construit le client) ; l'I/O coûteuse (`auth.getUser`) est déjà mémoïsée via `getCurrentUser`. Plusieurs `createClient()` par requête (layout + page) restent peu coûteux. La crainte « getUser deux fois en série » de l'audit (ex. `shop/page.tsx`) est **neutralisée** par le `cache()` de getCurrentUser.
- **Correctif** : wrapper en `cache()` si on veut un client unique par requête (cosmétique). Pas prioritaire.
- **Statut** : ⬜ optionnel.

### [P3] GameClicksFeed : un `setInterval` par ligne + recalcul d'`avatarGradient` à chaque rendu
- **Fichier** : `src/components/game/GameClicksFeed.tsx:49-54` (interval/ligne) et `:68` (`avatarGradient(click.username)` recalculé inline).
- **Impact** : jusqu'à 10 timers/s par feed (×2 à cause du double-mount P1-3 = ~20). `avatarGradient` recalculée à chaque render même si le username ne change pas. Faible mais évitable.
- **Correctif** : un seul timer parent (1s) qui force un re-render et calcule les « il y a Ns » de toutes les lignes ; mémoïser `avatarGradient` (`useMemo`/map de couleurs). Surtout, corriger d'abord le double-mount (P1-3) qui divise le coût par 2.
- **Statut** : ⬜ à corriger (gain après P1-3).

### [P3] GameCard : jusqu'à 3 setInterval additionnels par carte (au-dessus du timer)
- **Fichier** : `src/components/lobby/GameCard.tsx:111` (finalPhaseDuration 1s), `:130` (endedDuration 60s), `:169` (timeUntilStart 1s).
- **Impact** : faible et conditionnel — `finalPhaseDuration`/`timeUntilStart` ne tournent que pour les cartes urgentes/waiting, `endedDuration` à 60s est négligeable. Sur un lobby de ~30 cartes la plupart « actives normales » n'ont AUCUN de ces intervals (seulement le `setTimeout` du timer principal). Acceptable.
- **Correctif** : si optimisation poussée, fusionner finalPhaseDuration/endedDuration dans le tick principal du timer (même `setTimeout`). Bénéfice marginal.
- **Statut** : ⬜ optionnel.

### [P3] Animations CSS décoratives infinies permanentes (god-rays, arena-halo, text-electric) non pausées hors viewport
- **Fichier** : `src/app/globals.css` — `god-rays-spin` (`:1813`, conic-gradient géant en rotation sur la landing), `arena-halo` (`:2404`, blur 950×620 en boucle sur le lobby), `elec-flicker`/`text-electric` (`:2034`, text-shadow en flicker continu sur les titres hero).
- **Impact** : couches de compositing GPU maintenues en vie en continu ; `arena-halo` anime `opacity`+`transform` (composité, OK) mais le blur(42px) reste coûteux ; `text-electric` anime `text-shadow` (repaint). Contribue à la conso CPU/GPU de fond sur lobby/landing (LCP/INP). Pas une régression, déjà au backlog 06-17 (P2/P3).
- **Correctif** : `prefers-reduced-motion` déjà couvert pour reveal/grain/gauge ; étendre aux décors hero ; pauser via `IntersectionObserver` (`animation-play-state: paused` hors viewport) ; remplacer le flicker `text-shadow` par une variante `opacity` sur un pseudo-élément.
- **Statut** : ⬜ backlog (cohérent avec 06-17).

---

## Synthèse

- **Le gros des fixes 06-17/06-12 a bien atterri et tient** (RAF GameCard, filtre ItemGauge, tick useTimer, SSR des 4 pages, getCurrentUser `cache()`, GSAP lazy, CookieConsent CSS, `sizes` sur les images).
- **La régression majeure** : framer-motion est ressorti dans le baseline de toutes les routes `(main)` via `InstallBanner` + `BadgeNotificationContainer` du layout (P1-1) — même schéma que le bug CookieConsent « corrigé », une couche plus bas. Prouvé par build : `/classement` (zéro framer en source) embarque le chunk framer 123,5 KB.
- **Deux autres P1** structurels : modales lourdes en import statique sur lobby/game (P1-2) et le double-montage mobile/desktop de la page de jeu qui double realtime + timers + image priority (P1-3).
- `remotion` absent du bundle app (OK), `simple-icons` tree-shaké (OK), `canvas-confetti` isolé (OK) — ces craintes-là sont infondées.

**Comptes de migrations / quotas** : la redondance polling+realtime du lobby (P2) et le double-fetch clicks de la page jeu (P2) ajoutent de la charge Supabase évitable, à surveiller vu le billing FREE sous tension.
