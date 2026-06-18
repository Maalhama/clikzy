# Audit Cleekzy — 2026-06-18 — Couverture de tests, fiabilité, CI

Périmètre : qualité/couverture des tests, fiabilité (flakiness), pipeline CI.
Cible : penny-auction argent réel. Stack : Next.js 16, Vitest, Playwright, GitHub Actions.
Branche : `main`. Aucune modification de code/test (audit lecture seule).

---

## État

### Exécution locale (2026-06-18)

| Commande | Résultat | Durée |
|----------|----------|-------|
| `npm run test:run` (Vitest) | **86 tests / 11 fichiers — tous PASS** | 1.29 s |
| `npm run type-check` (`tsc --noEmit`) | **0 erreur** | OK |
| Playwright e2e | non exécuté (consigne) — specs lues | — |

`test-results/` est **vide** (aucun échec Playwright récent persisté). Pas de fichier de couverture committé.

### Inventaire des tests

**Unit (Vitest) — 86 tests, 11 fichiers** (`src/__tests__/`)
- `actions/auth.test.ts` (validations pures email/password/username — **ne teste aucune action serveur**)
- `actions/credits.test.ts` (mapping `checkAndResetDailyCredits`)
- `actions/game.test.ts` (`clickGame` : auth, crédits insuffisants, partie inactive, perform_click happy-path, reset timer)
- `actions/miniGames.test.ts` (`playMiniGame` : auth, double-play, conflit 23505, succès)
- `actions/referral.test.ts` (`applyReferralCode` : mapping des `reason`)
- `api/stripe-webhook.test.ts` (`handleStripeEvent` : crédits, pass, VIP, refund/dispute/clawback, idempotence applicative)
- `lib/economy.test.ts` (espérance mini-jeux < coût replay ; cohérence packs)
- `lib/provablyFair.test.ts` (déterminisme `fairFloat`/`computeMiniGameOutcome`)
- `lib/rateLimit.test.ts` (fallback in-memory)
- `lib/miniGamesVisualParity.test.ts`, `lib/utils.test.ts` (`cn`)

**E2E (Playwright) — 37 tests, 7 fichiers** (`e2e/`)
- 100 % **smoke non authentifié** : landing, SEO/meta, légal, headers sécu, health, redirections login.
- **Zéro** test de parcours connecté, **zéro** parcours argent (achat, clic réel, jauge, cadeau, fin de partie).

### Ce qui tourne en CI

`ci.yml` (push/PR sur `main` + `develop`), 5 jobs **indépendants, sans `needs`** : `lint`, `type-check`, `test` (`npm run test:run`), `build`, `security` (`npm audit --omit=dev --audit-level=high`). Tous bloquants (`continue-on-error: false` sur security ; défaut bloquant ailleurs).
`e2e.yml` : push/PR sur `main` (**pas `develop`**) + cron quotidien 3h UTC, contre `https://fake.supabase.co`.
`claude-pr-review.yml` : review LLM informative (commentaire PR), non bloquante.
**Aucun seuil de couverture** : `vitest.config.ts` configure `coverage` mais aucun `thresholds`, et `test:coverage` n'est lancé par aucun workflow.

---

## Findings

### [P0] Le webhook Stripe POST (vérification de signature + idempotence DB) n'est PAS testé
- **Fichier** : `src/app/api/stripe/webhook/route.ts:41-104` ; test : `src/__tests__/api/stripe-webhook.test.ts` (appelle uniquement `handleStripeEvent`).
- **Impact** : tout le rempart anti-fraude/anti-replay de l'argent réel n'a aucune couverture. Non testés : `constructEvent` (rejet signature invalide → 400), absence de `stripe-signature` (400), `STRIPE_WEBHOOK_SECRET` absent (500), **claim d'idempotence** via insert `stripe_events` (conflit 23505 → `duplicate`), et surtout le **relâchement de la réclamation** sur échec (`route.ts:99-101` : `delete stripe_events` si `status >= 400`). Une régression sur cette logique = soit double-crédit sur retry Stripe, soit event bloqué à jamais — directement monétaire. Le mock `stripe` (test:28-35) n'expose même pas `webhooks.constructEvent`, donc le POST est structurellement hors test.
- **Preuve** : `grep constructEvent|stripe-signature|whsec src/__tests__/` → aucun résultat. Le mock Supabase du test (`mockAdmin`, test:9-14) n'a pas de `.from().insert()` ni `.delete()` → la table `stripe_events` n'existe pas dans l'univers de test.
- **Correctif / test recommandé** : test d'intégration sur `POST` : (1) signature manquante → 400 ; (2) `constructEvent` qui throw → 400 sans toucher la DB ; (3) insert `stripe_events` en conflit 23505 → `{duplicate:true}` sans appel métier ; (4) handler qui renvoie 500 → `delete stripe_events` appelé (réclamation relâchée). Mocker `webhooks.constructEvent` pour renvoyer un event forgé.
- **Statut** : ouvert.

### [P0] Jauge « cash réel » (increment / double-mint / abandon) totalement non testée
- **Fichier** : `src/actions/game.ts:151-191` (`increment_item_gauge`, branche `usedEarnedCredit`, complétion → `gauge_wins` + alerte admin) ; `src/app/api/cron/convert-abandoned-gauges/route.ts` (`convert_abandoned_gauges`).
- **Impact** : la jauge fait payer 2× la valeur d'un item réel ; un bug de double-mint sur abandon a déjà été corrigé en P0 (`AUDIT-2026-06-17.md` : `convert_abandoned_gauges double-mint`). Aucun garde-fou de non-régression n'existe en test. `game.test.ts` ne met jamais `GAUGE_ENABLED=true` et n'assère jamais `increment_item_gauge` : la condition critique `usedEarnedCredit = (profile.credits ?? 0) < CREDIT_COST_PER_CLICK` (game.ts:157) — qui décide si un clic est « payant » et fait avancer la jauge — n'est couverte sur **aucune** branche.
- **Preuve** : `grep increment_item_gauge|convert_abandoned_gauges|gauge src/__tests__/` → aucun résultat hors `game.test.ts` (qui ne l'exerce pas).
- **Correctif / test recommandé** : (a) unit `clickGame` avec `GAUGE_ENABLED=true` + `profile.credits=0` → vérifier que `increment_item_gauge` est appelé ; avec `credits>=coût` → vérifier qu'il ne l'est PAS (clic gratuit n'avance pas la jauge) ; (b) vérifier que `gauge.completed` déclenche l'alerte admin une seule fois ; (c) tests SQL/integration sur l'idempotence de `convert_abandoned_gauges` (un abandon ne mint qu'une fois). La logique cash-basis vit en RPC SQL : prévoir un test d'intégration DB (cf. `scripts/test-c3-trigger.mjs`).
- **Statut** : ouvert.

### [P0] Codes cadeau : génération + redeem + clawback non testés (chemin argent → crédits/VIP)
- **Fichier** : `src/actions/gift.ts` (`createGiftCheckout`, `redeemGift` → `redeem_gift_code`) ; `src/lib/gift.ts` (`ensureGiftCodeForSession`) ; webhook `route.ts:179-191`.
- **Impact** : un cadeau = argent réel converti en crédits/VIP transférables. Risques non couverts : double-redeem (`already_redeemed`), redeem de son propre cadeau (`own_gift`), cadeau expiré, et surtout la **génération du code sur `checkout.session.completed`** (`ensureGiftCodeForSession`) qui renvoie 500 si la session n'est pas payée. Le clawback cadeau (`clawback_gift_code`, P0 #102 de l'audit précédent) n'est testé qu'au niveau du branchement webhook (test:250-265) mais jamais via `redeemGift`/`getGiftInfo`. Aucun test ne garantit qu'un code remboursé/void devient irréclamable.
- **Preuve** : `grep redeemGift|redeem_gift_code|createGiftCheckout|ensureGiftCodeForSession src/__tests__/` → aucun résultat.
- **Correctif / test recommandé** : unit `redeemGift` mappant chaque `reason` de `redeem_gift_code` (invalid/already_redeemed/expired/own_gift/ok) ; unit `gift` webhook branch (`type:'gift'`) → `ensureGiftCodeForSession` retourne null → 500, ok → 200 ; integration DB : redeem deux fois le même code → 2e échec.
- **Statut** : ouvert.

### [P0] Buy-It-Now : le recalcul de prix côté serveur n'est pas testé (anti-manipulation montant)
- **Fichier** : `src/actions/buyItNow.ts:78-128` (`createBuyItNowCheckout` : `quote_buy_it_now` → `unit_amount: Math.round(price*100)`).
- **Impact** : la garantie centrale (« le client n'envoie que le gameId, le prix est recalculé serveur ») n'a aucun test. Une régression qui ferait confiance à un prix client = vente d'items réels à prix arbitraire. Le webhook BIN (`type:'buy_it_now'`) est testé côté `handleStripeEvent` (test:294-316) mais le chemin **création de session** (où le montant est fixé) ne l'est pas. La garde `selfExcludedUntil` (jeu responsable) sur BIN/gift n'est pas testée non plus.
- **Preuve** : `grep createBuyItNowCheckout|quote_buy_it_now|checkout.sessions.create src/__tests__/` → aucun résultat.
- **Correctif / test recommandé** : unit avec Stripe mocké → vérifier `unit_amount === Math.round(quote.price*100)` et que le `price` de la metadata vient du quote serveur, pas d'un input client ; cas `price<=0` → erreur ; cas self-exclu → refus.
- **Statut** : ouvert.

### [P1] `end_game` / désignation gagnant / double-clôture non testés
- **Fichier** : `src/app/api/cron/bot-clicks/route.ts:320+` (`endGame` → RPC `end_game`, garde `row.closed`, écriture `winners`, `increment_total_wins`, `award_xp`, emails/push).
- **Impact** : `end_game` désigne le gagnant d'un objet réel et est protégé contre la double-clôture par `closed=false` (clic de dernière seconde / déjà close). C'est LE point de bascule argent→objet. Aucun test ne vérifie qu'une partie déjà close ne ré-écrit pas de winner ni ne re-crédite XP/wins, ni que `closed=false` court-circuite tout. La route cron entière (auth `Bearer CRON_SECRET`, activation, bataille finale) est hors couverture.
- **Preuve** : `grep end_game|bot-clicks|CRON_SECRET|Bearer src/__tests__/` → aucun résultat (cron auth « NONE - untested »).
- **Correctif / test recommandé** : extraire `endGame` testable (comme `handleStripeEvent`) et tester : `closed:true` → 1 winner inséré + 1 `increment_total_wins` + 1 `award_xp` ; `closed:false` → 0 écriture. Test d'auth cron : header absent/mauvais → 401.
- **Statut** : ouvert.

### [P1] Les e2e ne couvrent aucun parcours authentifié ni argent — et tournent contre une fausse DB
- **Fichier** : `e2e/*.spec.ts` ; `.github/workflows/e2e.yml:31-44` (`NEXT_PUBLIC_SUPABASE_URL: https://fake.supabase.co`).
- **Impact** : les 37 e2e ne valident que des pages publiques (titres, meta, headers, redirections). Les redirections « protégées » (`security.spec.ts`, `lobby.spec.ts`) passent **parce que** `supabase.auth.getUser()` échoue contre une fausse URL → redirige toujours vers `/login` : le test ne prouve donc PAS que l'auth fonctionne, seulement que la page redirige quand il n'y a pas de session (vrai même app cassée). `health.spec.ts` accepte `database:false` (fausse DB) → ne teste pas la connexion réelle. Aucun parcours achat/clic/jauge/cadeau n'est jamais joué de bout en bout. La valeur anti-régression sur les chemins argent est quasi nulle.
- **Preuve** : aucune des 7 specs ne se connecte ; `security.spec.ts` n'assère que `URL(/login/)`. CI e2e injecte des clés `fake`.
- **Correctif / test recommandé** : (1) au moins un e2e authentifié avec un user de test seedé (storageState) couvrant clic → débit crédit → feed ; (2) e2e checkout en mode Stripe test (carte `4242…`) → webhook test → crédits visibles ; sinon documenter explicitement que les e2e sont du smoke public et ne sont PAS un filet sur l'argent.
- **Statut** : ouvert.

### [P1] CI : aucun seuil de couverture, et lint scope ≠ test scope
- **Fichier** : `.github/workflows/ci.yml` ; `vitest.config.ts:13-18` (coverage sans `thresholds`).
- **Impact** : `test:coverage` n'est jamais lancé en CI et aucun plancher n'est imposé → la couverture peut chuter sans rien casser la CI. La majorité des chemins argent (cf. P0 ci-dessus) restent à 0 % sans alerte. `lint` ne couvre que `src` (`"lint": "eslint src"`) → e2e/scripts/remotion non lintés. Les 5 jobs sans `needs` consomment 5× l'install (acceptable, mais build/test/lint peuvent passer indépendamment d'un type-check rouge — pas de gate composite).
- **Preuve** : `grep thresholds vitest.config.ts` → aucun ; aucun job n'invoque `test:coverage`.
- **Correctif / test recommandé** : ajouter `coverage.thresholds` (ex. lignes 70 % global, 90 % sur `src/app/api/stripe`, `src/actions/game.ts`, `src/lib/gift.ts`, `src/actions/buyItNow.ts`) et lancer `npm run test:coverage` en CI (bloquant). Optionnel : un seuil par-fichier sur les chemins argent.
- **Statut** : ouvert.

### [P1] RLS / permissions jamais vérifiées par les tests (mock Supabase ne reflète pas la RLS)
- **Fichier** : tous les mocks (`game.test.ts:4-24`, `credits.test.ts:3-11`, etc.).
- **Impact** : les mocks Supabase renvoient les données qu'on leur dicte → ils ne reproduisent **ni la RLS own-row sur `profiles`** (cf. mémoire `cleekzy-profiles-rls` : lire un autre profil renvoie 0 ligne), ni le `REVOKE` de `perform_click`/`end_game` à `authenticated` (qui force le passage par service_role). Un test « vert » ne prouve donc rien sur les permissions réelles : une RLS cassée ou une RPC ouverte par erreur à `anon`/`authenticated` (exploit du type `fair_server_seed`/`user_fairness` déjà rencontré) ne serait pas détectée. La fidélité du mock est la limite structurelle de toute cette suite.
- **Preuve** : aucun test n'utilise un vrai client Supabase ni ne vérifie une policy ; les mocks sont des stubs de chaîne (`select().eq().single()`).
- **Correctif / test recommandé** : un petit jeu de tests d'intégration DB (déjà amorcé via `scripts/test-c3-trigger.mjs`) ciblant : profil tiers via client `authenticated` → 0 ligne ; `perform_click`/`end_game` via client `authenticated` → permission denied ; `get_public_profile` → ligne OK. À défaut de DB en CI, au moins un harness manuel documenté.
- **Statut** : ouvert.

### [P2] `auth.test.ts` est tautologique — il teste des littéraux, pas le code de l'app
- **Fichier** : `src/__tests__/actions/auth.test.ts:27-105`.
- **Impact** : les « tests d'auth » réimplémentent les règles dans le test (`email.includes('@')`, `password.length >= 6`, regex username) et assèrent sur cette réimplémentation. Le module mocké (`@/lib/supabase/server`, `@/lib/email/resend`) n'est jamais importé ni appelé. Ces 6 tests donnent une fausse impression de couverture sur signup/login : si la vraie `signUp`/`signIn` change sa validation, ces tests restent verts. Couverture réelle de l'authentification serveur = 0.
- **Preuve** : le fichier n'importe aucune action de `@/actions/auth` ; il définit ses propres regex.
- **Correctif / test recommandé** : importer les vraies actions `signUp`/`signIn` et tester leurs retours d'erreur (email invalide, mdp court, username pris via mock `getUser`/`from`), ou supprimer ces tests pour ne pas masquer le manque.
- **Statut** : ouvert.

### [P2] Tests qui n'assèrent que le happy-path des RPC sans erreurs/races DB
- **Fichier** : `actions/referral.test.ts`, `actions/credits.test.ts`, `actions/miniGames.test.ts`, `api/stripe-webhook.test.ts`.
- **Impact** : la logique métier sensible vit en SQL (SECURITY DEFINER) ; les tests TS mockent le `rpc` et n'assèrent que le mapping `reason → message`. Les branches d'erreur transport sont inégalement couvertes : `credits.test.ts` teste l'erreur RPC, mais `referral.test.ts` ne teste **pas** le cas `error != null` (RPC qui throw), et `miniGames.test.ts` ne teste pas l'échec de `add_mini_game_credits` (seulement `consume_fairness` OK). Les races réelles (double-clic concurrent, replay webhook simultané) ne sont par nature pas atteignables avec ces mocks séquentiels.
- **Preuve** : `referral.test.ts` n'a aucun `mockResolvedValue({error:...})` ; `miniGames.test.ts` ne fait jamais échouer `add_mini_game_credits`.
- **Correctif / test recommandé** : ajouter pour chaque action un cas « RPC renvoie `{error}` » → `success:false` propre, et un cas RPC partiellement échouée. Les vraies races → tests d'intégration DB (P0/P1 ci-dessus).
- **Statut** : ouvert.

### [P2] `game.test.ts` dépend de `Date.now()` réel (timer non gelé)
- **Fichier** : `src/__tests__/actions/game.test.ts:103-108, 184-229`.
- **Impact** : le test « reset timer en phase finale » calcule `result.data.newEndTime - now` et borne entre 85 000 et 95 000 ms, avec `Date.now()` réel non mocké. Marge large donc improbable de flaker, mais c'est un anti-pattern : l'horloge réelle s'invite dans l'assertion. `clickGame` appelle `Date.now()` en interne (game.ts:103) sans `vi.useFakeTimers` côté test → toute logique fine de seuil temporel (`FINAL_PHASE_THRESHOLD`) reste fragile si les valeurs sont resserrées.
- **Preuve** : `grep Date.now src/__tests__` → game.test.ts:108/155/166/185 hors `useFakeTimers`.
- **Correctif / test recommandé** : `vi.useFakeTimers()` + `vi.setSystemTime(fixed)` dans ce test pour une assertion exacte sur `newEndTime`.
- **Statut** : ouvert.

### [P3] `e2e.yml` ne tourne pas sur les PR vers `develop` ; review LLM informative seulement
- **Fichier** : `.github/workflows/e2e.yml:3-8` (triggers `main` only) ; `claude-pr-review.yml`.
- **Impact** : `ci.yml` cible `main` + `develop`, mais `e2e.yml` seulement `main` → une PR `feature → develop` ne déclenche aucun e2e. La review Claude poste un commentaire mais n'est pas un gate (pas de `REQUEST_CHANGES` bloquant) — informatif, ce qui est OK tant que ce n'est pas pris pour une barrière qualité.
- **Preuve** : `e2e.yml` `branches: [main]` ; `claude-pr-review.yml` écrit `review.md` → commentaire.
- **Correctif / test recommandé** : aligner les triggers e2e sur `develop` si `develop` reçoit du code argent ; documenter que la review LLM est advisory.
- **Statut** : ouvert.

### [P3] Secrets de test CI : valeurs `fake` cohérentes mais e2e silencieusement dégradés
- **Fichier** : `ci.yml` (job build) + `e2e.yml` env.
- **Impact** : bonne pratique (pas de vrais secrets, build sans clés). Mais conséquence directe du P1 e2e : avec `STRIPE_*=fake`/Supabase `fake`, aucun flux serveur réel n'est exercé. Le `STRIPE_WEBHOOK_SECRET: whsec_fake` n'est utilisé par aucun test (le seul test webhook bypasse la signature). À documenter pour ne pas surestimer la CI e2e.
- **Preuve** : env `e2e.yml:31-44` ; `STRIPE_WEBHOOK_SECRET` absent de `src/__tests__/`.
- **Correctif / test recommandé** : si on veut tester le webhook réel en CI, utiliser un vrai `whsec_test` en secret GitHub + `stripe trigger` ou payload signé fixe.
- **Statut** : ouvert.

---

## Synthèse priorisée — top tests à ajouter (chemin argent/jeu)

1. **Webhook POST réel** : signature invalide → 400, idempotence `stripe_events` (conflit 23505 → duplicate, échec → release). *(P0)*
2. **Jauge** : `increment_item_gauge` appelé ssi clic payant (`credits=0`) ; idempotence `convert_abandoned_gauges` (pas de double-mint). *(P0)*
3. **Cadeau** : `redeemGift` (chaque `reason`) + génération webhook + irréclamabilité après void. *(P0)*
4. **Buy-It-Now** : `createBuyItNowCheckout` recalcule `unit_amount` serveur, ignore tout prix client, refuse self-exclu. *(P0)*
5. **`end_game`** : `closed:true` → 1 winner/wins/xp ; `closed:false` → 0 écriture (anti double-clôture) + auth cron `CRON_SECRET`. *(P1)*
6. **RLS/permissions (intégration DB)** : profil tiers → 0 ligne ; `perform_click`/`end_game` en `authenticated` → denied. *(P1)*
7. **Branches d'erreur RPC** pour `applyReferralCode` / `playMiniGame` (RPC throw, crédit échoué). *(P2)*
8. **Remplacer `auth.test.ts`** par de vrais tests des actions `signUp`/`signIn`. *(P2)*
9. **Coverage gate** : `test:coverage` en CI + `thresholds` (90 % sur `api/stripe`, `actions/game|buyItNow`, `lib/gift`). *(P1)*
10. **Au moins 1 e2e authentifié** (clic → débit) avec user seedé + DB réelle de test. *(P1)*
