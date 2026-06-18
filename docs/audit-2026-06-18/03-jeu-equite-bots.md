# Audit 2026-06-18 — Volet 03 : Correctness & anti-triche du jeu (game integrity / bots)

Auditeur : game integrity / anti-cheat senior — analyse adversariale.
Périmètre : `perform_click`, `end_game`/désignation gagnant, provably-fair, bots/cron, sources de crédits gratuits, leaderboard/collection.
Méthode : re-vérification adversariale des corrections des audits 2026-06-15/16/17 (exploit `fair_server_seed`, TOCTOU `end_game`) + recherche de nouveaux vecteurs « gagner sans payer / lot indu / prédire l'issue ».

## Verdict global

Le cœur de l'équité est **solide**. Les deux corrections critiques revendiquées par la mémoire sont **réellement en place et tiennent à l'analyse adversariale** :

- **Exploit `fair_server_seed` FERMÉ** (`20260615160002_fairness_secret_table.sql`) : le secret est déplacé dans `user_fairness` (RLS activée, **aucune policy** → service_role/DEFINER uniquement, `REVOKE ALL` sur anon/authenticated) et la colonne est **DROP** de `profiles`. Le joueur ne lit que `fair_server_seed_hash` (commit) + `client_seed` + `nonce` → impossible de prédire l'issue. ✅ Vérifié.
- **TOCTOU `end_game` CORRIGÉ** (`20260615160001_audit_hardening.sql`) : `SELECT … FOR UPDATE` + revérif `end_time > now()` **sous le même verrou** que `perform_click`. Un clic de dernière seconde qui prolonge la partie ⇒ `closed=false`, pas de winner écrit. Double-clôture impossible (`status NOT IN ('active','final_phase')` sous verrou + `winners.game_id UNIQUE`). ✅ Vérifié.

`perform_click` est atomique et verrouillé, n'est plus appelable par `authenticated` (service_role only), les écritures `games`/`winners`/`clicks` sont fermées à `authenticated` par RLS, et toutes les sources de crédits gratuits sont idempotentes/cappées côté SQL. Les bots prennent toujours `last_click_user_id = NULL` → un bot gagnant n'expédie jamais de lot réel (`is_bot=true`, `user_id=null`).

Aucun **P0** trouvé. Les findings sont des durabilité/cohérence (P2), un commentaire trompeur (P3), et un point transparence/divulgation des bots (P2, à trancher par le volet légal).

---

## Findings (triés par sévérité)

### [P2] Fenêtre non-atomique entre `end_game` et l'écriture du gagnant — un vrai gagnant peut perdre sa victoire enregistrée
- **Fichier** : `src/app/api/cron/bot-clicks/route.ts:320-409` (fonction `endGame`)
- **Impact** : pas un exploit « gagner sans payer », mais une **perte d'intégrité au détriment du joueur**. `end_game` (RPC) passe `games.status='ended'` **dans sa transaction**, puis le cron écrit la ligne `winners`, `increment_total_wins`, `award_xp`, email/push **APRÈS, hors transaction**. Si le process cron crashe / timeout Vercel / erreur réseau entre les deux, la partie est définitivement close (`status='ended'`, donc `end_game` renverra `closed=false` au prochain passage) **sans aucune ligne `winners` ni `total_wins` crédité**. Le gagnant légitime ne reçoit ni lot, ni victoire, ni email.
- **Preuve/repro** : `end_game` commit le `UPDATE games SET status='ended'` (ligne 58-59 de `20260615160001`). Le retour `closed=true` est consommé en TS, puis ~70 lignes plus loin l'`INSERT winners` (route.ts:374). Toute exception entre les deux (ex. `auth.admin.getUserById` qui throw, ligne 361) est attrapée par le `try` global du `GET` → la partie reste `ended`, sans winner. Aucun mécanisme de rejeu.
- **Correctif** : déplacer l'écriture du gagnant **dans** la RPC `end_game` (INSERT `winners` + `increment_total_wins` + `award_xp` sous le même `FOR UPDATE`), et ne garder hors-transaction QUE les effets best-effort (email/push). Alternative : table de réconciliation / cron de rattrapage qui détecte `games.status='ended'` sans ligne `winners` correspondante.
- **Statut** : OUVERT (régression de robustesse, pas un exploit). Déjà partiellement noté dans `AUDIT-2026-06-17.md` pour la jauge mais pas pour le winner principal.

### [P2] `perform_click` et `increment_item_gauge` non atomiques (cost-basis cash corruptible)
- **Fichier** : `src/actions/game.ts:120-191`
- **Impact** : le clic (`perform_click`, débite earned + insère clic) et l'avancée de jauge (`increment_item_gauge`, retire `purchased_value_cents` et avance la jauge cash) sont **deux appels service_role séparés**, sans transaction commune. Un crash entre les deux laisse l'incohérence : crédit dépensé sans avancée de jauge, ou (selon l'ordre) cost-basis retiré sans clic. **Inerte en prod aujourd'hui** car la feature jauge n'est pas mergée sur `main` et `purchased_value_cents` reste 0 (les décréments sont no-op), mais devient un vecteur de corruption économique dès que la jauge passe live à ×2.
- **Preuve/repro** : `await rpc('perform_click', …)` (l.120) puis, plus loin, `await rpc('increment_item_gauge', …)` (l.163) dans un `try` best-effort distinct. Aucun rollback du clic si la jauge échoue (par design « best-effort »), mais aussi aucune compensation si `increment_item_gauge` retire le cost-basis puis l'écriture de `user_item_gauges` échoue partiellement.
- **Correctif** : fusionner en une seule RPC (le clic appelle la logique jauge **dans** la transaction de `perform_click`, sous le même verrou profil `FOR UPDATE`), ou rendre `increment_item_gauge` idempotent/rejouable et déclenché par trigger sur insertion de `clicks` payants.
- **Statut** : OUVERT, faible priorité tant que la jauge n'est pas live (déjà tracé dans `AUDIT-2026-06-17.md`). À traiter AVANT tout merge de la jauge.

### [P2] Bots non divulgués comme participants/gagnants dans les CGU (transparence — arbitrage légal)
- **Fichier** : `src/app/(legal)/terms/page.tsx:98` ; `BOTS.md:5,77`
- **Impact** : Cleekzy fait tourner des bots qui **simulent des joueurs**, prennent le lead, maintiennent le timer en phase finale 30 min–1 h 59, et **peuvent être déclarés gagnants** d'une enchère réelle (`winners.is_bot=true`). Les CGU ne mentionnent « bot » que pour **interdire aux joueurs** d'en utiliser (« Ne pas utiliser de bots, scripts ou outils automatisés ») — **aucune divulgation** que l'opérateur lui-même injecte des participants automatisés. Sur une plateforme d'argent réel « dernier clic gagne », l'absence de divulgation de joueurs fictifs qui influencent l'issue (et donc la durée/le coût d'une enchère pour un vrai joueur) est un risque de pratique commerciale trompeuse.
- **Preuve/repro** : `bot-clicks/route.ts:201-241` (les bots écrivent `last_click_username`, prolongent `end_time`) ; `endGame` insère un gagnant bot quand `last_click_user_id` est NULL à la clôture (route.ts:343-346, 373-383). Côté joueur, rien ne distingue un bot d'un humain dans le feed / les « derniers gagnants ».
- **Correctif** : décision du volet légal. Techniquement, prévoir soit une divulgation explicite dans les CGU/« Comment ça marche » (participants simulés tant qu'aucun humain n'est en lice), soit un marquage visuel. **Ne pas trancher ici** — le signaler au volet légal.
- **Statut** : OUVERT — à escalader au volet légal (note : pas de bug de code, c'est une question de conformité).

### [P3] Commentaire de migration trompeur : `perform_click` n'a PAS la garde `auth.uid() <> p_user_id` annoncée
- **Fichier** : `supabase/migrations/20260616120006_perform_click_service_only.sql:10-11` vs `20260609130001_perform_click_rpc.sql:9-82`
- **Impact** : aucun impact exploitable actuel (la RPC est `service_role` only, le client ne peut pas l'appeler ni spoofer `p_user_id`). Mais le commentaire affirme « la garde `auth.uid() <> p_user_id` interne reste valable » alors que **le corps de `perform_click` ne contient aucune vérification d'identité** (contrairement à `deduct_credits`, `claim_daily_login`, etc. qui ont `IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE 'forbidden'`). Risque futur : si quelqu'un re-`GRANT` `perform_click` à `authenticated` en se fiant au commentaire, un joueur pourrait débiter/cliquer **au nom d'un autre user** (`p_user_id` arbitraire).
- **Preuve/repro** : lecture du corps de `perform_click` — il prend `p_user_id` en paramètre et l'utilise tel quel pour `UPDATE profiles … WHERE id = p_user_id`, sans le rapprocher de `auth.uid()`.
- **Correctif** : soit ajouter réellement la garde `IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN RAISE 'forbidden'; END IF;` (défense en profondeur, cohérent avec les autres RPC), soit corriger le commentaire pour qu'il dise « protégé uniquement par le REVOKE de authenticated ».
- **Statut** : OUVERT (défense en profondeur + doc trompeuse).

### [P3] `add_mini_game_credits` crédite `profiles.credits` (quotidien) au lieu de `earned_credits` (permanent)
- **Fichier** : `supabase/migrations/20260123000003_mini_games.sql:23-35`
- **Impact** : incohérence avec la règle produit (CLAUDE.md : « les récompenses → `earned_credits` »). Les gains de mini-jeux atterrissent dans `credits` (reset chaque minuit) au lieu de `earned_credits`. Pas un exploit (la RPC est `service_role` only, montant recalculé serveur, valeurs faibles), mais : (a) les gains de mini-jeux disparaissent au reset quotidien — comportement non documenté côté joueur ; (b) puisque `perform_click` consomme `credits` AVANT `earned_credits`, ces gains ne déclenchent jamais l'avancée de jauge cash (ce qui est cohérent/voulu, mais c'est un effet de bord à connaître).
- **Preuve/repro** : `UPDATE profiles SET credits = credits + p_amount` (l.29). Comparé à badges/quêtes/streak/referral qui écrivent tous `earned_credits`.
- **Correctif** : aligner sur `earned_credits` si l'intention est de rendre les gains permanents ; sinon documenter explicitement que les gains de mini-jeux sont « quotidiens » (volatiles).
- **Statut** : OUVERT (cohérence économique, non sécuritaire).

### [P3] `checkClickFraud` est un compteur en mémoire par instance — quasi inopérant en serverless
- **Fichier** : `src/lib/security/fraudDetection.ts:9` (`const clickPatterns = new Map(...)`) appelé depuis `src/actions/game.ts:55`
- **Impact** : la détection de fraude au clic (30 clics/min, vitesse inhumaine <200 ms, variance de cadence) repose sur une `Map` **locale au worker**. En serverless multi-instance (Vercel), les clics d'un même joueur se répartissent sur des workers différents et chaque worker repart d'un état vide → la détection n'accumule presque jamais assez d'historique pour déclencher. **Le vrai garde-fou est le rate-limiter Redis partagé (90/min, `rateLimit.ts:165`)** et surtout le fait que **les crédits bornent le volume de clics** (on ne peut pas cliquer sans crédit). Donc pas d'exploit « gagner sans payer » : le coût d'un clic est figé serveur (`perform_click` débite toujours 1 crédit, `credits_spent=1`, non falsifiable client). Mais la promesse « détection de fraude au clic » est largement illusoire en l'état.
- **Preuve/repro** : `Map` au niveau module + commentaire interne « use Redis in production » jamais honoré. Le rate-limiter Redis (90/min) est, lui, correctement partagé.
- **Correctif** : porter `checkClickFraud` sur Redis (sorted set des timestamps par user) si on veut une vraie détection de cadence/variance, ou assumer que le rate-limit Redis + le bornage par crédits suffisent et retirer/atténuer la prétention de `checkClickFraud` (éviter le faux sentiment de sécurité). Le seuil Redis 90/min reste sain (les crédits sont la vraie borne).
- **Statut** : OUVERT (défense en profondeur dégradée, pas d'exploit économique).

---

## Vérifications adversariales menées et SANS finding (faux positifs à NE PAS « corriger »)

- **Prédiction provably-fair** : impossible. `consume_fairness` (`20260615160002`) fait `UPDATE … fair_nonce = fair_nonce + 1 RETURNING fair_nonce - 1` → le verrou de ligne Postgres **sérialise** les appels concurrents, chaque play obtient un nonce **distinct** (pas de réutilisation de nonce entre deux mini-jeux parallèles). Le `server_seed` n'est révélé que via `rotateFairness` (et il est alors **retiré** : nouveau seed commité, nonce remis à 0) → un seed révélé ne sert jamais à prédire un tirage futur. `computeMiniGameOutcome` est déterministe mais le client n'a pas le seed avant révélation. ✅ Sûr.
- **Clic concurrent / double-débit / clic sans crédit par race** : `perform_click` prend `FOR UPDATE` sur la partie (l.28-29), revérifie le statut, lit/débite les crédits et insère le clic **sous le même verrou** ; `sequence_number = MAX+1` est calculé sous verrou (pas de doublon). Deux clics concurrents du même joueur sont sérialisés. Le clic après fin de partie est rejeté (`v_status NOT IN ('active','final_phase')`). ✅ Sûr.
- **Coût du clic falsifiable client** : non. Le client n'envoie que `gameId` ; `credits_spent=1` est figé dans la RPC ; `perform_click` n'est pas appelable par `authenticated` (REVOKE + service_role, `20260616120006`). ✅ Sûr.
- **Forger un gagnant / une victoire / un faux clic de bot** : RLS ferme `games` UPDATE et `winners` INSERT à `authenticated` (`20260609140001`), et `clicks` INSERT est limité à `user_id = auth.uid()` (`20260609160001`, plus de bypass `user_id IS NULL`). La Server Action `endGame` côté client a été supprimée (code mort + vecteur). ✅ Sûr.
- **Bot qui fait gagner un lot réel à Cleekzy** : les bots posent toujours `last_click_user_id = NULL` ; un gagnant bot est inséré avec `user_id=null, is_bot=true` → aucun `increment_total_wins`, aucun email/lot. Un humain ne gagne que s'il est `last_click_user_id` à la clôture, c.-à-d. s'il a réellement out-cliqué le bot dans la fenêtre finale (65-85 s déterministe par partie). Pas de chemin où un humain « gagne sans payer ». ✅ Sûr.
- **Mint de crédits via sources gratuites** : toutes idempotentes et cappées côté SQL —
  - referral : `referred_by` posé une seule fois, cap parrain 50 (`20260611020001`/`20260611040001`) ;
  - badges : `NOT EXISTS user_badges` + `ON CONFLICT DO NOTHING`, stats recalculées serveur (`20260610090002`) ;
  - quêtes : PK `(user_id, quest_key, quest_day)` + progression recalculée depuis `clicks`/`mini_game_plays` réels (`20260609200001`) ;
  - daily login / daily chest : guard `streak_last_day`/`chest_last_claim_day` sous `FOR UPDATE`, idempotent par jour Paris ;
  - mini-jeux : index unique partiel `(user_id, game_type, play_day) WHERE is_free_play` (le 23505 fait autorité, pas le check JS) ; `add_mini_game_credits`/`deduct_credits` service_role/self-guard ;
  - gift codes : `redeem_gift_code` atomique avec `already_redeemed`/`own_gift` ;
  - chests : `open_chest` vérifie `opened=false` sous `FOR UPDATE`. ✅ Tous sûrs.
- **Leaderboard / collection manipulables** : leaderboard = lecture via `get_leaderboard` + bots déterministes d'affichage (aucun compte réel, aucune écriture éco) ; rangs des vrais joueurs au mérite (tri par XP). XP/level protégés par trigger + RPC DEFINER. Pas de vecteur d'écriture client. ✅ Sûr.
- **Endpoints cron protégés** : `bot-clicks`, `create-rotation`, `reset-credits` sont fail-closed (`if (!CRON_SECRET || authHeader !== Bearer …) → 401`), `x-vercel-cron` non utilisé (forgeable). ✅ Sûr.

---

## Résumé par sévérité

| Sévérité | Nombre | Items |
|----------|--------|-------|
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | 3 | end_game↔winners non atomique ; perform_click↔gauge non atomique (jauge non-live) ; divulgation bots CGU (→ légal) |
| P3 | 3 | commentaire `perform_click` trompeur (garde absente) ; `add_mini_game_credits`→`credits` ; `checkClickFraud` in-memory/serverless |

Les fixes critiques des audits précédents (fairness `user_fairness`, TOCTOU `end_game`) sont **confirmés réellement appliqués et robustes**. Aucun chemin « gagner sans payer », « lot indu » ou « prédire l'issue » n'a été trouvé.
