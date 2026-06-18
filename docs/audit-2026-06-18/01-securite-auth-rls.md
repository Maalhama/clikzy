# Audit Cleekzy 2026-06-18 — Sécurité applicative : Auth, RLS, RPC, IDOR, secrets, headers

> Périmètre : Auth (login/register/reset/OAuth, session, middleware), RLS de toutes les tables,
> 59+ RPC SECURITY DEFINER, IDOR sur les server actions, gating admin, secrets, headers/CSP, rate-limit.
> Méthode : vérification adversariale du code et des migrations (pas confiance au doc). Branche `main`.
> Les audits antérieurs (`docs/AUDIT-2026-06-1[2-7]*.md`) ont été skimés ; ce rapport va plus profond
> sur la surface Auth/RLS/RPC et re-vérifie les corrections annoncées.

## Synthèse exécutive

La posture sécurité est globalement **forte** sur le cœur monétaire : `perform_click` /
`increment_item_gauge` sont réservés `service_role` (REVOKE authenticated + GRANT service_role,
`search_path` épinglé), le trigger `protect_profile_sensitive_columns` verrouille les colonnes
économiques de `profiles`, le webhook Stripe est signé + idempotent + clawback, le gating admin
re-vérifie `is_admin` côté serveur ET dans les RPC DEFINER, les secrets ne fuient pas côté client,
et le modèle `profiles` RLS own-row + `get_public_profile(s)` est correct.

**MAIS** il subsiste **un trou RLS exploitable financièrement** : la table `clicks` accepte les
INSERT directs `authenticated` (policy `WITH CHECK (user_id = auth.uid())` + GRANT INSERT par défaut
Supabase), sans aucune contrainte sur `credits_spent`, `is_bot`, `game_id` ni la participation
réelle. Cela permet de **manipuler à la baisse le prix « Rachat malin »** (item physique payé au
plancher de 40 % du retail), de **forger des badges créditant des `earned_credits`**, de **polluer
le feed live** et de **contourner le gate `can_comment`**. C'est le finding central de cet audit.

### Compte par sévérité
- **P0 : 1**
- **P1 : 2**
- **P2 : 4**
- **P3 : 5**

### Vérifié NON exploitable / déjà corrigé (re-vérification adversariale)
- `proxy.ts` (= middleware Next 16, voir §contexte) **EST bien actif en prod** : Next.js 16.2.7
  reconnaît le nom de fichier `proxy` (`PROXY_FILENAME='proxy'` dans `next/dist/lib/constants.js`),
  et le build de prod l'enregistre comme fonction Node.js dans
  `.next/server/functions-config-manifest.json` (`/_middleware`, matcher identique) avec la logique
  CSP+rate-limit+gating présente dans le chunk `[root-of-the-server]__1pmdzh2._.js`. Le
  `middleware-manifest.json` vide (`sortedMiddleware: []`) est un artefact Turbopack (manifest edge),
  PAS une régression. → la protection des routes, le nonce CSP et le rate-limit API tournent.
- `perform_click` / `increment_item_gauge` : REVOKE authenticated/anon confirmé, GRANT service_role
  uniquement, garde IDOR interne `auth.uid()`, `search_path` épinglé sur la définition FINALE
  (`20260609200001`). Appel via `createServiceClient()` après fraude + self-exclusion. Solide.
- `profiles` RLS own-row + grants colonne anon (level/xp/cosmetic_*) : aucune PII fuite pour anon ;
  `authenticated` ne lit que sa ligne ; lectures cross-user via `get_public_profile(s)` (DEFINER,
  colonnes publiques uniquement). Le secret provably-fair `fair_server_seed` a bien été déplacé dans
  `user_fairness` (RLS sans policy = service_role only) et DROP de `profiles`.
- `games` UPDATE / `winners` INSERT par `authenticated` : policies bien DROP en C1/C2, jamais
  recréées. Écriture exclusivement cron service_role.
- Admin (`src/actions/admin.ts`) : chaque action appelle `checkAdminStatus()` côté serveur AVANT
  d'utiliser le service client ; `admin_set_credits`/`admin_set_admin` re-vérifient `is_admin` du
  caller dans la RPC DEFINER. Robuste (pas seulement UI).
- Secrets : `.env.local` non tracké, `.gitignore` OK, `SUPABASE_SERVICE_ROLE_KEY`/`STRIPE_SECRET_KEY`/
  `CRON_SECRET` jamais en `NEXT_PUBLIC_`, jamais importés par un composant/hook client.
- Crons fail-closed (`Authorization: Bearer CRON_SECRET`, refus si absent/non concordant).
- Account deletion / export RGPD (`privacy.ts`) : complet (anonymise PII dénormalisée, inclut les
  tables jauge). `reset_daily_credits` idempotent (anti-farm). selfExclusion désormais fail-CLOSED.
- Faux positifs documentés (#103 plancher v_cost, #104 atomicité jauge, #107 waterfall profil) :
  non re-signalés ; rien de neuf trouvé pour les requalifier P0/P1 (cf. #103-bis en P2 ci-dessous,
  qui est une nuance distincte sur l'INPUT et non sur le plancher lui-même).

---

## Findings (tri par sévérité décroissante)

### [P0] INSERT direct sur `clicks` non contraint → manipulation du prix « Rachat malin » + farm de badges/crédits + pollution du feed

- **Fichier:ligne** :
  - `supabase/migrations/20260609160001_harden_clicks_insert.sql:17-20` (policy INSERT trop large)
  - `supabase/migrations/20260614150001_buy_it_now.sql:43-52` et
    `supabase/migrations/20260617120002_buy_it_now_idor_guard.sql:17-31` (prix = `retail − SUM(clicks.credits_spent)*0.10`, plancher 40 %)
  - `src/actions/buyItNow.ts:78-121` (checkout sur `quote_buy_it_now`)
  - `supabase/migrations/20260609180001_secure_definer_rpcs.sql:230` (badge « games » = `COUNT(DISTINCT game_id) FROM clicks`)
- **Impact** : exposition financière directe (app argent réel). La policy ne valide que
  `user_id = auth.uid()`. Aucune contrainte sur `credits_spent`, `is_bot`, `sequence_number`,
  `game_id`, `username`, `item_name`, ni sur la participation réelle. Supabase accorde l'INSERT à
  `authenticated` par défaut (aucun `REVOKE`/`ALTER DEFAULT PRIVILEGES` dans les migrations). Le seul
  trigger BEFORE INSERT (`block_self_excluded_clicks`, `20260615190001`) ne bloque QUE les joueurs
  auto-exclus (et se court-circuite si l'attaquant met `is_bot=true`). Conséquences :
  1. **Prix Rachat malin** : après (ou même sans) avoir cliqué dans une enchère qu'il n'a pas gagnée,
     un joueur insère une ligne `clicks` avec son `user_id` et `credits_spent` énorme. `get_buy_it_now_offers`
     somme ce champ → la remise sature et le prix tombe au plancher (40 % du retail). Le prix est
     bien recalculé côté serveur (anti-tampering du montant), mais l'**INPUT** du calcul est
     attaquable. Un objet physique est alors payé 40 % de sa valeur quelle que soit la dépense réelle.
     Pire : `cs.spent > 0` est la seule barrière de participation → un joueur peut forger un clic sur
     un jeu auquel il n'a **jamais** participé (FK `game_id` existe, mais aucune vérif de participation
     légitime) et débloquer l'offre.
  2. **Farm de badges** : `claim_eligible_badges` calcule le badge « games » via
     `COUNT(DISTINCT game_id) FROM clicks WHERE user_id = self`. Des INSERT forgés sur N `game_id`
     distincts débloquent des badges qui créditent `earned_credits` (crédits permanents = valeur réelle).
  3. **Pollution / fraude sociale** : `username`, `item_name`, `is_bot` libres → fausses entrées dans
     le feed live (`/api/clicks/recent`, `LiveClicksFeed`, `GameClicksFeed`), faux « N en lice »
     (`count_game_contenders`), bypass de `can_comment` (qui ne vérifie qu'un clic existe).
- **Preuve/repro** (client authentifié, clé anon) :
  ```js
  // baisse le prix de rachat d'une enchère perdue au plancher 40 %
  await supabase.from('clicks').insert({
    game_id: '<gameId perdu>', user_id: '<mon uid>',
    username: 'x', item_name: 'x', is_bot: false,
    sequence_number: 999999, credits_spent: 9_999_999
  })
  // puis createBuyItNowCheckout('<gameId>') → quote = 40% du retail
  ```
  RLS `WITH CHECK (user_id = (SELECT auth.uid()))` passe ; aucune autre barrière. Vérifié au niveau
  schéma/policy/trigger (grants par défaut Supabase non révoqués).
- **Correctif recommandé** :
  1. **Retirer l'INSERT client sur `clicks`** : `REVOKE INSERT ON public.clicks FROM authenticated, anon;`
     et `DROP POLICY "Authenticated users can insert own clicks" ON clicks;`. Tous les clics légitimes
     passent déjà par `perform_click` (service_role) ou le cron — l'INSERT client est mort/néfaste.
  2. À défaut (si un chemin client doit subsister), durcir la policy : `WITH CHECK (user_id = auth.uid()
     AND is_bot = false AND credits_spent = 1 AND EXISTS(select 1 from games where id = game_id and
     status in ('active','final_phase')))` — mais l'option 1 est nettement préférable.
  3. Faire calculer la remise Rachat malin sur une source autoritaire (somme des `credits_spent`
     écrits par `perform_click` uniquement, ou un compteur `games.total_clicks`/ledger dédié), pas sur
     une table librement insérable.
- **Statut** : **Vérifié exploitable** (au niveau policy/grant/trigger ; non exécuté en prod live).

---

### [P1] Rate-limiter fail-open vers la mémoire-process en cas d'erreur Redis (garde-fou clics et auth dégradé en serverless)

- **Fichier:ligne** : `src/lib/rateLimit.ts:124-128` (catch Redis → `checkRateLimitMemory`),
  `src/lib/rateLimit.ts:160-165` (`clicks: 90/min`), `src/lib/redis.ts:6-30`.
- **Impact** : sur erreur Redis (timeout/quota Upstash, panne réseau), TOUS les rate-limiters
  retombent sur un store **en mémoire par instance**. En déploiement serverless multi-instance
  (Vercel), ce store n'est pas partagé → le plafond effectif est multiplié par le nombre d'instances,
  et un attaquant qui force des instances froides contourne quasi totalement la limite. Cela dégrade
  précisément les protections sensibles : anti credential-stuffing (`auth` 10/min), anti-flood signup/
  reset, et le garde-fou de débit de clics distribué (#8, censé « résister au serverless multi-
  instance » — promesse cassée en cas d'erreur Redis). À noter que la détection de fraude au clic
  (`checkClickFraud`) est elle aussi en mémoire-process → en serverless, le garde-fou Redis était la
  seule barrière partagée.
- **Preuve/repro** : code — toute exception dans `checkRateLimitRedis` (`redis.incr/expire/ttl`)
  est avalée et bascule en mémoire (ligne 124-128). `redis.ts` ne lève qu'à l'init si les vars
  manquent ; une erreur runtime côté Upstash (rate-limit Upstash, 5xx) déclenche le fallback.
- **Correctif recommandé** : pour les actions monétaires/sensibles (auth, clicks, payment), traiter
  l'erreur Redis en **fail-closed** (refuser ou exiger un retry) plutôt que fallback mémoire ;
  ou utiliser `@upstash/ratelimit` (sliding window + ephemeral cache documenté). Logger/alerter sur le
  fallback pour ne pas tourner « ouvert » sans le savoir.
- **Statut** : Probable (comportement code vérifié ; l'amplitude dépend du nombre d'instances et de la
  fréquence d'erreurs Redis en prod).

---

### [P1] Fonctions DEFINER trigger sans `search_path` épinglé (`log_badge_earned`, `log_win_recorded`, `update_updated_at`, `handle_new_user` historique)

- **Fichier:ligne** :
  - `supabase/migrations/20260125000002_data_persistence.sql:93` (`log_player_event` — corrigé par
    `ALTER FUNCTION ... SET search_path` en `20260609180001:268`, OK),
  - `supabase/migrations/20260125000002_data_persistence.sql:110` (`log_badge_earned`) et `:132`
    (`log_win_recorded`) — **jamais** ré-altérés/pinnés,
  - `001_initial_schema.sql:48` (`update_updated_at`) — DEFINER non pinné, jamais ré-altéré.
- **Impact** : ce sont des fonctions `SECURITY DEFINER` (propriétaire postgres) déclenchées en trigger
  sur INSERT `user_badges` / `winners` (et UPDATE générique pour `update_updated_at`). Sans
  `SET search_path`, elles résolvent les objets non qualifiés selon le `search_path` de la session
  appelante. Classe d'escalade de privilèges DEFINER (CVE-style « function search_path mutable »
  signalé par l'advisor Supabase). Exploitabilité réelle faible ici (les inserts déclencheurs passent
  par du code de confiance/cron, et les fonctions n'utilisent que des tables qualifiables), mais c'est
  une régression d'hygiène par rapport au reste du codebase qui pinne systématiquement.
- **Preuve/repro** : revue des définitions ; aucune occurrence de `search_path` sur ces 3 fonctions,
  ni d'`ALTER FUNCTION ... SET search_path` ultérieur (grep exhaustif des migrations).
- **Correctif recommandé** : `ALTER FUNCTION public.log_badge_earned() SET search_path = pg_catalog, public;`
  idem `log_win_recorded()`, `update_updated_at()`, et recréer ces trois en `SECURITY INVOKER` si le
  DEFINER n'est pas nécessaire (un trigger d'audit/timestamp n'a généralement pas besoin de DEFINER).
- **Statut** : Vérifié (gap présent) ; exploitation Non vérifiée (faible).

---

### [P2] Garde anti-IDOR conditionnelle `auth.uid() IS NOT NULL AND ...` — fragile (defense-in-depth), couvre redeem_gift_code, perform_click, deduct_credits, etc.

- **Fichier:ligne** : `20260615120001_gift_codes.sql:61` (`redeem_gift_code`),
  `20260609180001_secure_definer_rpcs.sql:49,116,146,162,187` (perform_click/deduct/add_mini_game/
  reset_daily/collect_vip), `20260617120002_buy_it_now_idor_guard.sql:34`, `20260616120001_item_gauges`.
- **Impact** : le motif récurrent est `IF auth.uid() IS NOT NULL AND p_user_id <> auth.uid() THEN
  RAISE`. Quand `auth.uid()` est NULL (service_role / contexte sans JWT), la garde est **désactivée**
  et `p_user_id` est accepté tel quel. C'est volontaire (le cron/webhook agit pour autrui), et dans le
  flux normal les server actions passent toujours `user.id` issu de la session vérifiée — donc **pas
  exploitable aujourd'hui**. Mais c'est fragile : toute fonction qui adopte ce motif ET reste GRANTée
  à `authenticated` devient une IDOR si, un jour, elle est appelée via un client où `auth.uid()` peut
  être NULL (ex. PostgREST sans Authorization, ou bascule service_role par erreur). Pour `redeem_gift_code`
  (GRANT authenticated), un appel sans la garde créditerait un `p_user_id` arbitraire.
- **Preuve/repro** : revue ; pas de chemin d'appel actuel avec `auth.uid()` NULL côté authenticated.
- **Correctif recommandé** : pour les RPC réservées au client, forcer l'identité interne
  (`p_user_id := auth.uid()` ou `IF auth.uid() IS NULL THEN RAISE 'unauthenticated'`) au lieu d'un
  garde-fou conditionnel ; réserver le motif « NULL = service_role » strictement aux fonctions
  REVOKED de authenticated (perform_click, increment_item_gauge le sont déjà — bon ; redeem_gift_code
  ne l'est pas).
- **Statut** : Probable (latent) — pas d'exploit live, mais surface fragile.

---

### [P2] `redeem_gift_code` callable par `authenticated` avec `p_user_id` (IDOR latente)

- **Fichier:ligne** : `supabase/migrations/20260615120001_gift_codes.sql:56-92`, `src/actions/gift.ts:145`.
- **Impact** : la fonction prend `p_user_id` en paramètre et est `GRANT ... TO authenticated`. La seule
  barrière est la garde conditionnelle (cf. P2 ci-dessus). La server action passe bien `user.id`, mais
  un client appelant directement `supabase.rpc('redeem_gift_code', {p_code, p_user_id:<victime>})`
  bénéficierait de la garde (auth.uid() non NULL pour authenticated) → bloqué `forbidden`. Donc
  **non exploitable en pratique** tant que la garde tient. Reste un signal : l'API expose un `p_user_id`
  inutile (l'identité devrait être dérivée de `auth.uid()`).
- **Preuve/repro** : revue. Garde `IF auth.uid() IS NOT NULL AND p_user_id <> auth.uid()` → exception.
- **Correctif recommandé** : supprimer le paramètre `p_user_id` et utiliser `auth.uid()` à l'intérieur
  (le destinataire est forcément l'appelant connecté). Réduit la surface et supprime la dépendance à la
  garde conditionnelle.
- **Statut** : Vérifié non exploitable aujourd'hui ; durcissement recommandé.

---

### [P2] `style-src 'unsafe-inline'` conservé dans la CSP (XSS via styles / exfiltration limitée)

- **Fichier:ligne** : `src/proxy.ts:37` (`"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"`).
- **Impact** : `script-src` a bien été durci avec un nonce (plus de `'unsafe-inline'` script — bon,
  #0 confirmé), mais `style-src` garde `'unsafe-inline'`. Risque résiduel : injection de styles
  (CSS exfiltration, défacement, clickjacking d'éléments via overlays) si un point d'injection HTML
  existe. Moindre qu'un XSS script, mais ça affaiblit la CSP pour une app argent. Déjà listé P2/P3
  dans l'audit du 17 ; je le confirme et le maintiens P2 vu le contexte gambling.
- **Preuve/repro** : lecture de `buildCsp`. framer-motion/Tailwind injectent des styles inline → d'où
  le choix ; mais des alternatives existent (hash de styles, nonce style, `style-src-attr`).
- **Correctif recommandé** : migrer vers un nonce sur `style-src` (Next applique le nonce aux styles),
  ou au minimum `style-src-elem`/hash pour les styles connus ; ajouter un endpoint `report-to` pour
  détecter les violations avant durcissement complet.
- **Statut** : Vérifié (gap présent), impact limité.

---

### [P2] Plancher `GREATEST(1, …)` sur le cost-basis de jauge — sur-comptage par arrondi (input attaquable distinct du faux positif #103)

- **Fichier:ligne** : `supabase/migrations/20260616120003_gauge_cash_basis.sql`,
  `supabase/migrations/20260616120001_item_gauges.sql:73` (`v_target := GREATEST(1, ROUND(...))`).
- **Impact** : la feature jauge n'est PAS live sur `main` (dormante), donc pas d'exposition prod
  immédiate. Le doc classe « #103 plancher v_cost » en faux positif (le plancher seul) ; je ne le
  re-signale pas comme tel. Note distincte : la cible se resync à la baisse à chaque clic
  (`target = v_target`), donc une baisse de `retail_value` (admin) peut compléter une jauge avec un
  cost-basis sous-cible (déjà noté P3 « gauge_win frauduleux si retail baisse » au 17). À re-valider
  AVANT le merge de `feat/shop-redesign` + activation `GAUGE_ENABLED`, vu l'enjeu juridique ×2.
- **Preuve/repro** : lecture migrations ; feature non câblée en prod (GAUGE_ENABLED inerte sur main).
- **Correctif recommandé** : figer la cible à l'entrée de la jauge (snapshot du retail au 1er crédit)
  plutôt que resync continu ; valider juridiquement le multiplicateur avant activation.
- **Statut** : Non vérifié exploitable en prod (feature dormante) ; à traiter avant go-live jauge.

---

### [P3] Logs OAuth verbeux (`console.log` de `data`/`url`) en clair dans `signInWithOAuth`

- **Fichier:ligne** : `src/actions/auth.ts:80-105`.
- **Impact** : `console.log('[OAuth] Supabase response:', { data, error })` et l'URL de redirection
  loguent des détails du flux OAuth. `removeConsole` en prod (`next.config.ts:12-14`) **exclut**
  `error`/`warn` mais retire bien les `console.log` → en prod ces logs disparaissent. En préprod/dev
  ou si la config build changeait, fuite d'infos de flux. Mineur.
- **Preuve/repro** : lecture ; `next.config.ts` `removeConsole: { exclude: ['error','warn'] }`.
- **Correctif recommandé** : supprimer ces logs (déjà signalé au 17, toujours présents).
- **Statut** : Vérifié (présent), impact faible (retirés au build prod).

---

### [P3] Énumération de comptes possible à l'inscription (message « Cet email est déjà utilisé »)

- **Fichier:ligne** : `src/actions/auth.ts:162-164`.
- **Impact** : `signUp` renvoie un message distinct (« Cet email est déjà utilisé ») quand l'email
  existe → oracle d'énumération de comptes. Le login renvoie un message générique (bon), et le reset
  renvoie l'erreur Supabase brute. L'énumération facilite le ciblage (credential-stuffing, phishing).
  Le rate-limit signup (10/min/IP) atténue mais ne supprime pas. Pour une app argent, à corriger.
- **Preuve/repro** : lecture du handler signup.
- **Correctif recommandé** : message neutre à l'inscription (« Si cet email est disponible, tu vas
  recevoir un lien de confirmation ») et s'appuyer sur la confirmation email plutôt que sur un retour
  synchrone différencié ; uniformiser le reset password (`resetPassword` renvoie `error.message` brut
  ligne 238 — risque de fuite/énumération aussi).
- **Statut** : Vérifié (comportement présent).

---

### [P3] `resetPassword` renvoie l'erreur Supabase brute (fuite d'info + énumération potentielle)

- **Fichier:ligne** : `src/actions/auth.ts:236-239`, `updatePassword:258-261`.
- **Impact** : `return { success:false, error: error.message }` expose le message interne Supabase au
  client (peut révéler la politique de mot de passe, l'état du compte, rate-limit Supabase). Combiné
  au P3 énumération. Mineur mais à uniformiser sur les messages FR maîtrisés.
- **Correctif recommandé** : mapper vers des messages génériques FR ; pour le reset, toujours répondre
  succès (« Si un compte existe, un email a été envoyé »).
- **Statut** : Vérifié (présent).

---

### [P3] `/api/clicks/recent` lisible par anon et reflète les clics forgés (amplificateur du P0)

- **Fichier:ligne** : `src/app/api/clicks/recent/route.ts:21-49`, RLS `clicks` SELECT public
  (`003_clicks_for_bots.sql`, `20260611000003_anon_read_game_content.sql:17`).
- **Impact** : endpoint public (clé anon) qui ressort `username`/`item_name`/`is_bot` des clics. La
  lecture publique est un choix produit (feed live, rétention anon) — acceptable en soi. Mais couplé au
  P0 (INSERT forgeable), il devient le canal d'affichage des fausses entrées (fraude de preuve
  sociale). Pas de fuite PII (pas d'email/user_id ici). Devient sans objet une fois le P0 corrigé.
- **Correctif recommandé** : corriger le P0 ; éventuellement ne pas exposer `is_bot` au client.
- **Statut** : Vérifié (lecture publique par design) ; risque porté par le P0.

---

### [P3] Artefacts de build `.next/` contiennent des clés de chiffrement Server Actions / preview-mode

- **Fichier:ligne** : `.next/server/middleware-manifest.json` (env `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`,
  `__NEXT_PREVIEW_MODE_ENCRYPTION_KEY`, `__NEXT_PREVIEW_MODE_SIGNING_KEY`).
- **Impact** : ces clés sont générées au build et présentes dans `.next/`. `.next` est gitignoré
  (vérifié) → pas de commit. Risque uniquement si `.next` est partagé/uploadé hors CI (cache, artefact
  public). Informatif.
- **Correctif recommandé** : ne jamais publier `.next/` ; en cas de fuite, ces clés se régénèrent au
  prochain build (set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` explicitement en CI pour la rotation).
- **Statut** : Vérifié (présent en local, non commité).

---

## Notes de couverture (vérifié OK, pas de finding)

- **IDOR server actions** : seules `updateUserCredits`/`toggleUserAdmin` prennent un `userId` explicite,
  toutes deux gated par `checkAdminStatus` + RPC DEFINER re-vérifiant `is_admin`. Toutes les autres
  actions dérivent l'identité de `auth.getUser()`. `open_chest`/`equip_item`/`claim_daily_chest`/
  `claim_daily_login` scopent `user_id = auth.uid()` ou portent la garde self. Pas d'IDOR utilisateur.
- **RLS par table** : 36 tables, toutes `ENABLE ROW LEVEL SECURITY`. Tables `user_*` en own-row SELECT,
  écriture default-deny (via DEFINER/service_role). Catalogues (badges, items_catalog, cosmetics_catalog,
  daily_quests, clans, jackpot) en lecture publique non-sensible. `user_fairness`, `gift_codes`,
  `stripe_events`, `pack_purchases`, `buy_it_now_purchases`, `gauge_*` : écriture default-deny, lecture
  own-row ou DEFINER. Pas de fuite de soldes/paiements/seeds.
- **Stripe webhook** : signature `constructEvent`, idempotence via `stripe_events` (claim + release sur
  échec), clawback pack/gift/VIP sur refund/dispute, auto-refund si crédit non accordé. Solide.
- **Headers** : HSTS preload, X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff,
  Referrer-Policy, Permissions-Policy, `poweredByHeader:false`, CSP nonce script-src. Bon (sauf
  style-src, cf. P2).
