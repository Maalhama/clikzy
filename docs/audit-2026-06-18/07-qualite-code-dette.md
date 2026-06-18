# Audit 07 — Qualité de code & dette technique

> Cleekzy · Next.js 16 / React 19 / TypeScript strict · branche `main` · 2026-06-18
> Périmètre : **santé du code** (type safety, lint, code mort, duplication, taille, gestion d'erreur, magic numbers, cohérence). Perf et sécu = autres agents.
> Méthode : `tsc --noEmit`, `eslint src`, `knip`, `ts-prune`, grep quantifié, lecture ciblée. Rien n'a été modifié.

---

## Métriques (tête de rapport)

| Métrique | Valeur | Note |
|----------|--------|------|
| `tsc --noEmit` (type-check) | **0 erreur** ✅ | confirmé, exit 0 |
| `eslint src` | **0 erreur / 0 warning** ✅ | confirmé, exit 0 |
| Fichiers TS/TSX (`src/`) | 290 | 46 084 lignes |
| `as any` | **94** | dont **70** = cast systématique `(supabase.rpc as any)` / `(supabase as any)` |
| `: any` (params/props explicites) | **13** | callbacks de mapping de lignes + 1 prop `progression?: any` |
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | **0** ✅ | très bon |
| `! ` non-null assertions risquées | quasi nulles (env vars `!` sur `process.env.*` uniquement) | acceptable |
| `eslint-disable` (inline) | **111** | dont **105** = `no-explicit-any` (corollaire des casts RPC), 5 `exhaustive-deps`, 1 `no-img-element` |
| `console.*` | **200** | log 48 / error 139 / warn 13 — surtout serveur (api 90, lib 44, actions 39, components 1) |
| `console.log` (debug potentiel) | 48 | concentré stripe webhook (14), email/send (10), crons |
| Sentry (`captureException`) | 4 usages seulement | erreurs majoritairement gérées par `console.*` brut |
| TODO/FIXME/HACK/XXX | **1 réel** (`admin.ts:60`) | les 8 autres = faux positifs (`XXXX` du pixel-art) |
| Fichiers > 400 lignes | **22** (dont 1 généré de 1957) | voir §[P2] taille |
| `catch {}` vides | 4 multilignes + plusieurs `.catch(() => {})` fire-and-forget | erreurs avalées |
| Server actions exportées | 91 | 26 fichiers `src/actions/*.ts` |
| `type ActionResult<T>` re-déclaré | **8 fois** | aucune définition partagée |
| Fichiers/exports morts (knip) | 80 fichiers (surtout `scripts/`+`remotion/`) + ~30 exports applicatifs réels | voir §code mort |

**Verdict global** : la base est **saine** sur les indicateurs durs (0 erreur tsc, 0 erreur/warning eslint, 0 `@ts-ignore`, imports 100 % en alias `@/`, structure de dossiers cohérente). La dette est concentrée sur **trois axes** : (1) le contournement `as any` systématique sur les RPC Supabase, (2) la duplication du boilerplate des server actions (`createClient` + `getUser` + `ActionResult`), (3) le code mort applicatif accumulé (exports/fichiers jamais importés). Pas de P0/P1. Tout est P2/P3.

---

## Findings (triés par sévérité)

### [P2] 70 casts `as any` sur les RPC Supabase — type safety perdue sur tout l'accès DB par fonction

- **Fichier:ligne** : `src/actions/*.ts` (transverse). Top : `collection.ts` (9), `admin.ts` (8), `app/api/stripe/webhook/route.ts` (7), `progression.ts`/`leaderboard.ts`/`game.ts` (4 chacun). Exemple `progression.ts:65` `const { data: questRows } = await (supabase.rpc as any)('daily_quests_status')`.
- **Impact** : sur **70** appels RPC, les arguments (`p_user_id`, montants, clés) et les valeurs de retour ne sont **pas vérifiés par le compilateur**. Une faute de frappe dans un nom de paramètre ou un mauvais type passe au build. Les `((data as any[]) || []).map((r) => r.xxx)` derrière (≈20 occurrences) lisent ensuite des champs non typés. C'est aussi la cause directe des **105 `eslint-disable no-explicit-any`** (bruit dans le diff).
- **Preuve (cause racine vérifiée)** : ce n'est PAS de la négligence. Test isolé : `supabase.rpc('award_xp', { p_user_id, p_amount })` **sans** cast → `error TS2345: Argument ... is not assignable to parameter of type 'undefined'`. Le bug est dans le typage de l'overload `.rpc` de `@supabase/ssr@0.5.2` + `supabase-js` (les `Args` résolvent à `undefined`). Confirmé aussi par 39/43 des RPC castés qui SONT pourtant présents dans `database.types.ts` (donc le cast n'est pas dû à des types stale, sauf pour 4 RPC : `add_purchased_value`, `clawback_gift_code`, `clawback_pack_credits`, `convert_abandoned_gauges` qui manquent vraiment des types → `npm run db:types` à relancer).
- **Correctif** : créer **un seul** helper typé wrapper, ex. `src/lib/supabase/rpc.ts` :
  ```ts
  type Fn = Database['public']['Functions']
  export function callRpc<K extends keyof Fn>(
    sb: SupabaseClient<Database>, name: K, args: Fn[K]['Args']
  ): Promise<{ data: Fn[K]['Returns'] | null; error: PostgrestError | null }> {
    return (sb.rpc as unknown as (n: string, a: unknown) => Promise<{ data: unknown; error: PostgrestError | null }>)(name, args) as never
  }
  ```
  Le cast `as unknown as` est isolé **une fois** ; les 70 sites d'appel deviennent typés (args + returns) et les 105 `eslint-disable` disparaissent. Régénérer les types pour les 4 RPC manquants.
- **Statut** : à corriger (P2 — fort gain de type safety, refacto mécanique, risque faible).

---

### [P2] Boilerplate des server actions dupliqué 91× : `createClient` + `getUser` + garde « Non authentifié » + `ActionResult` redéclaré 8×

- **Fichier:ligne** : `src/actions/*.ts`. Pattern répété dans presque chaque action, ex. `progression.ts:38-41`, `:87-89`, `:103-105` :
  ```ts
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }
  ```
- **Impact** : maintenabilité. `auth.getUser()` apparaît **56×** dans `src/actions/`, la chaîne d'erreur « Non authentifié »/« Non connecté » **44×**, et le type `ActionResult<T> = { success; data?; error? }` est **redéclaré localement dans 8 fichiers** (`comments`, `credits`, `stripe`, `gift`, `buyItNow`, `game`, `progression`, `miniGames`) sans **aucune** définition partagée (`grep export type ActionResult` = 0). 273 littéraux `{ success: … }` au total. Un helper `getCurrentUser` mémoïsé existe déjà (`src/lib/auth/getCurrentUser.ts`) mais n'est utilisé que dans les **pages/layouts**, jamais dans les actions.
- **Correctif** :
  1. Définir `export type ActionResult<T = void> = …` dans `src/lib/types/action.ts` (SSOT) et l'importer partout — supprime 8 redéfinitions.
  2. Helper `requireUser()` qui renvoie `{ supabase, user }` ou lève/retourne l'erreur standard ; les actions appellent une ligne au lieu de trois. Bonus : message d'erreur i18n centralisé au lieu de 44 littéraux.
- **Statut** : à corriger (P2 — DRY, réduit ~150 lignes répétitives).

---

### [P2] Code mort applicatif : exports/fichiers jamais importés (au-delà de la passe 2026-06-17)

- **Fichiers** (vérifiés un par un, hors faux positifs Next.js/`scripts/`/`remotion/`) :
  - **Server actions jamais appelées** : `getActiveGames` / `getGame` / `getGameClicks` (`src/actions/game.ts:243,265,287`), `getUserBadges` (`badges.ts:74`), `getUserWithProfile` (`auth.ts:198`), `canComment` (`comments.ts:80`), `createItem` (`admin.ts:416`). Vérifié : 0 référence hors de leur propre fichier.
  - **Fichiers entièrement morts** : `src/components/ui/Skeleton.tsx` (aucun importeur ; `StatsSkeleton`/`WinnerCardSkeleton`/`PlayerCountSkeleton`/`PrizeCardSkeleton` = 0 usage), `src/contexts/index.ts` (barrel jamais importé — les 5 consommateurs importent direct `@/contexts/CreditsContext`).
  - **Exports morts dans barrels landing/lobby** : `StatsCounter`, `ScrollIndicator`, `LiveClicksFeed`, `SearchBar`, `PrizeCarousel` (re-exportés dans `components/landing/index.ts` & `components/lobby/index.ts` mais jamais consommés).
  - **Helpers utilitaires non utilisés** : `src/lib/analytics.ts` → `trackEvent`/`trackPageView` (référencés seulement dans un commentaire), `src/lib/security/fraudDetection.ts` → `recordClick`/`clearPatterns`/`getUserRiskLevel`/`checkSpendingFraud`, `src/lib/constants/rotation.ts` → `getPreviousRotationTime`/`isInSoonWindow`/`shouldActivateGame`/`formatRotationHour`/`getTodayRotations` + const `TIMEZONE`, `src/lib/bots/usernameGenerator.ts` → `generateUsername`/`generateUniqueUsernames`/`ALL_USERNAMES`, `src/lib/utils/productImages.ts` → `slugify`/`DEFAULT_PRODUCT_IMAGE`.
- **Impact** : surface de maintenance et confusion (un dev peut croire que `getActiveGames` est le chemin officiel alors que tout passe par les pages SSR). `card.tsx`/`input.tsx` déjà retirés à la passe précédente — bonne hygiène à poursuivre.
- **Preuve** : `npx knip` (65 unused exports + 20 unused exported types), recoupé avec grep manuel pour écarter les faux positifs (exports conventionnels Next : `default`/`metadata`/`viewport`/`runtime` ; `scripts/`+`remotion/` = outils hors app).
- **Correctif** : supprimer les exports/fichiers ci-dessus après une dernière vérif grep. Ajouter un `knip.json` minimal (entry points app + `scripts/` en `project`) pour faire tourner knip en CI et empêcher la ré-accumulation.
- **Statut** : à corriger (P2 — nettoyage, faible risque ; tester `tsc`+`build` après suppression des barrels).

---

### [P2] Trois emplacements de constantes + double source de vérité pour `GameStatus`

- **Fichier:ligne** :
  - `src/lib/constants.ts` (re-export `* from './utils/constants'`),
  - `src/lib/utils/constants.ts` (timers/credits/`GAME_STATUS`),
  - `src/lib/constants/rotation.ts` (rotation + `DEFAULT_GAME_DURATION`).
  - `GameStatus` défini **deux fois** : `src/types/database.ts:7` (`Database['public']['Enums']['game_status']`, dérivé de la DB) ET `src/lib/utils/constants.ts:32` (`typeof GAME_STATUS[...]`, dérivé de l'objet const).
- **Impact** : ambiguïté d'import (`@/lib/constants` vs `@/lib/utils/constants` vs `@/lib/constants/rotation`) et deux types `GameStatus` qui peuvent diverger si un statut est ajouté en DB sans MAJ de l'objet const. Doublon de durée de jeu : `INITIAL_DURATION = 24h` (utils/constants) vs `DEFAULT_GAME_DURATION = 1h` (rotation) — valeurs différentes, intention pas évidente.
- **Correctif** : consolider en un dossier `src/lib/constants/` avec `index.ts` (timers/credits/gauge), `rotation.ts`, et **un seul** `GameStatus` (garder celui dérivé de l'enum DB, supprimer/aliaser l'autre). Supprimer le shim `src/lib/constants.ts`.
- **Statut** : à corriger (P2).

---

### [P3] `'Europe/Paris'` en dur 18× + bloc `Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris'})` copié 6× alors qu'une constante `TIMEZONE` existe (et est non importée)

- **Fichier:ligne** : 18 littéraux `'Europe/Paris'` dans `src/`, dont le calcul « jour du jour Paris » dupliqué verbatim 6× (ex. `progression.ts:61`). La constante `TIMEZONE = 'Europe/Paris'` (`src/lib/constants/rotation.ts:16`) est importée **0 fois** (donc flaggée morte par knip).
- **Impact** : magic string + logique de date copiée-collée → risque d'incohérence si un fuseau/format change. Aligne mal avec la règle projet « pas de hardcoding ».
- **Correctif** : exporter `TIMEZONE` depuis les constantes consolidées + une fonction `todayParis(): string` réutilisable ; remplacer les 18 littéraux et les 6 blocs Intl.
- **Statut** : à corriger (P3).

---

### [P3] Prix/montants en dur dispersés au lieu de la config Stripe

- **Fichier:ligne** : 24 occurrences de littéraux de prix (`12.99`, `9.99`, `4.99`, `19.99`…) dans `src/` (composants VIP/boutique + `actions/admin.ts` `packPrice[...]` pour le calcul de CA). Une config existe pourtant (`src/lib/stripe/config.ts` → `getCreditPack`).
- **Impact** : un changement de tarif oblige à éditer plusieurs fichiers ; risque que l'affichage UI diverge du prix réellement débité par Stripe. (Note : certains de ces littéraux sont des libellés marketing — à trier.)
- **Correctif** : centraliser les prix dans `stripe/config.ts` (déjà la SSOT pour les packs) et que l'UI + le calcul de CA admin les lisent de là. Pas de prix en dur dans les `.tsx`.
- **Statut** : à corriger (P3 — vérifier au cas par cas les libellés purement marketing).

---

### [P3] 13 `: any` explicites évitables (props + callbacks de mapping + client Supabase)

- **Fichier:ligne** :
  - `src/app/(main)/lobby/LobbyClient.tsx:45` `progression?: any` — **évitable** : le type `Progression` existe dans `@/actions/progression` et la page passe exactement cet objet (`page.tsx:153`). Remplacer par `progression?: Progression | null`.
  - `src/lib/selfExclusion.ts:7` `selfExcludedUntil(supabase: any, …)` — jette le type du client ; typer `SupabaseClient<Database>`.
  - `clans.ts:43,63`, `admin.ts:97-106`, `buyItNow.ts:34,59`, `collection.ts:42` → `(r: any) => …` sur le mapping de lignes Supabase. Découlent en partie du même problème de typage `.rpc`/`.select` ; le wrapper RPC du finding P2 #1 en supprime une bonne partie.
- **Impact** : perte de complétion/vérification sur des structures qu'on connaît pourtant.
- **Correctif** : typer la prop `progression`, typer le param `supabase`, et dériver les types de lignes de `database.types.ts` pour les callbacks de map.
- **Statut** : à corriger (P3).

---

### [P3] Erreurs avalées : `.catch(() => {})` et `catch {}` sans trace

- **Fichier:ligne** : 4 `catch {}` vides multilignes (`LobbyTour.tsx:105,113`, `referralPending.ts:10,24`) + nombreux `.catch(() => {})` fire-and-forget sur des `Promise` d'actions (`LobbyClient.tsx:127,279`, `game-client.tsx:141,148`, `JackpotWidget.tsx:29`, `BattlePassRail.tsx:30`, `FairnessPanel.tsx:22`, `GameContenders.tsx:20`, `CustomizationSection.tsx:36`, `reset-credits/route.ts:143`…).
- **Impact** : un échec réseau/serveur sur ces chargements secondaires (jauge, calendrier, jackpot, cosmétiques) est totalement silencieux — débogage difficile, pas de remontée Sentry. Certains sont légitimes (best-effort UI), mais l'uniformité « on ignore tout » masque de vraies pannes.
- **Correctif** : pour les `.catch` UI, au minimum un `console.warn` dev ou un `Sentry.captureException` (déjà dans le projet, 4 usages) plutôt que l'avalement total ; les `catch {}` de `referralPending`/`LobbyTour` (localStorage) peuvent rester mais gagneraient un commentaire « // accès localStorage indisponible (mode privé) — ignoré volontairement ».
- **Statut** : à corriger (P3 — au cas par cas, ne pas sur-logger les best-effort).

---

### [P3] Pas d'abstraction de logging : 200 `console.*` bruts, gestion d'erreur hétérogène

- **Fichier:ligne** : `console.*` = 200 (api 90, lib 44, actions 39, components 1). Aucun module logger (`grep export.*logger` = 0). Sentry n'est branché que sur 4 points.
- **Impact** : pas de niveau de log contrôlable par environnement (verbeux en dev / propre en prod, exigé par les guidelines projet), formats hétérogènes, `console.log` de debug laissés (14 dans le webhook Stripe, 10 dans `email/send.ts`). Côté serveur ce n'est pas bloquant, mais ça pollue les logs de prod et n'alimente pas Sentry.
- **Correctif** : un `src/lib/logger.ts` fin (wrap `console` + `Sentry.captureException` sur `error`, no-op `debug` en prod). Migrer au moins les routes API et actions. Purger les `console.log` de debug du webhook/email.
- **Statut** : à corriger (P3).

---

### [P3] Fichiers volumineux à découper (SRP)

- **Fichier:ligne** (hors `database.types.ts` généré, 1957 l.) :
  | Fichier | Lignes | Remarque |
  |---------|--------|----------|
  | `components/landing/LandingClient.tsx` | **1520** | composant client monolithique → extraire les sections en sous-composants (cf. retour `feedback_reuse_landing_sections`) |
  | `app/(main)/game/[id]/game-client.tsx` | 1064 | timer + clics + jauge + commentaires + animations dans un seul client |
  | `app/(main)/mini-games/MiniGamesClient.tsx` | 767 | orchestration des 6 mini-jeux |
  | mini-games `DiceRoll`/`Pachinko`/`ScratchCard`/`WheelOfFortune`/`SlotMachine` | 723→420 | canvas/anim — taille en partie justifiée, mais logique d'état dupliquée (voir ci-dessous) |
  | `app/(main)/admin/AdminDashboard.tsx` | 720 | tableau de bord multi-onglets monolithique |
  | `actions/admin.ts` | 510 (14 fns) | mélange stats / users / games / items / winners / shipping / gauge → scinder par domaine |
  | `app/api/stripe/webhook/route.ts` | 561 | handler unique multi-événements |
- **Sous-finding (incohérence d'abstraction)** : le hook `useMiniGameStateMachine` (state machine partagée des mini-jeux) n'est utilisé que par **1 des 6** mini-jeux (`CoinFlip.tsx`). Les 5 autres gèrent leur état à la main → abstraction créée puis non adoptée = duplication de la logique idle/playing/result.
- **Impact** : navigation, revue et tests plus difficiles ; SRP non respecté.
- **Correctif** : extraire les sections de `LandingClient`/`game-client`/`AdminDashboard` en sous-composants ; scinder `admin.ts` par sous-domaine ; soit généraliser `useMiniGameStateMachine` aux 6 jeux, soit le supprimer si l'abstraction ne tient pas.
- **Statut** : à corriger (P3 — gros chantier, faire par incréments).

---

### [P3] 1 TODO réel non tracé

- **Fichier:ligne** : `src/actions/admin.ts:60` `totalRevenue: 0, // TODO: Calculate from Stripe`.
- **Impact** : le CA total du dashboard admin est codé en dur à 0 (le détail par source est calculé plus bas mais ce champ agrégé ne l'est pas).
- **Correctif** : calculer `totalRevenue` (somme packRevenue + binRevenue + giftRevenue + VIP) ou retirer le champ s'il est mort. Tracer en issue.
- **Statut** : à corriger (P3).

---

## Points positifs (à préserver)

- **0 erreur tsc, 0 erreur/warning eslint** : le portail qualité est vert et tenu.
- **0 `@ts-ignore`/`@ts-expect-error`** : aucune suppression d'erreur de type cachée (les `any` sont au moins visibles via `eslint-disable`).
- **Imports 100 % en alias `@/`** (449 imports, 0 deep-relative `../..`) : navigation et refacto faciles.
- **SSOT des types DB** déjà en place (`src/types/database.ts` ré-exporte le généré, l'ancienne version manuelle a été supprimée — bon réflexe documenté en commentaire).
- **`getCurrentUser` mémoïsé** (`react cache`) côté pages : évite la re-validation JWT multiple par requête.
- **Hygiène de code mort déjà entamée** (`card.tsx`/`input.tsx`/Suspense lobby retirés à la passe 2026-06-17).

---

## Synthèse par sévérité

| Sévérité | Nombre | Items |
|----------|--------|-------|
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | 4 | casts `as any` RPC · boilerplate actions (`ActionResult`/`getUser`) · code mort applicatif · constantes éparpillées + double `GameStatus` |
| P3 | 7 | `'Europe/Paris'` ×18 · prix en dur ×24 · `: any` explicites ×13 · erreurs avalées (`catch {}`) · pas de logger / 200 console · fichiers >400 l. (SRP) · 1 TODO réel |

**Aucun blocage build/type.** Dette concentrée et mécanique à résorber : le wrapper RPC typé (P2 #1) tue à lui seul ~70 `as any` + 105 `eslint-disable`, et le helper `requireUser`/`ActionResult` partagé (P2 #2) déduplique ~150 lignes sur 91 actions.
