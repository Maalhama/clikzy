# Audit DB — Schéma, migrations, RPC, contraintes, intégrité (2026-06-18)

> Périmètre : hygiène structurelle de la base. Schéma & migrations (`supabase/migrations/`, 85 fichiers `.sql`),
> RPC `SECURITY DEFINER`, contraintes d'intégrité financière, index, schema drift (`src/lib/supabase/database.types.ts`),
> traçabilité `schema_migrations`. **PAS** la RLS policy-par-policy (autre agent) — mais signalement des tables sans RLS.
>
> Méthode : lecture intégrale des migrations financières/RPC + extraction programmatique (perl) du statut `search_path`
> sur chaque fonction `SECURITY DEFINER`, croisement avec les `database.types.ts` et le code appelant `src/`.
> Vérification adversariale du chaînage `fix_*` (jauge `120002→120004→120007`, clawback `230001→120000→120001`).
>
> **Bilan : 0 P0, 4 P1, 6 P2, 5 P3.** L'hygiène structurelle est **bonne** : tous les RPC DEFINER **live** épinglent
> `search_path` (l'escalade de schéma est fermée), les RPC argent sont transactionnels (`FOR UPDATE`), l'idempotence
> Stripe/cadeaux/rachat est correcte, les `fix_*` jauge convergent vers une logique cohérente et non contradictoire.
> Les points résiduels sont : drift de types massif sur la feature jauge/clawback (force le `as any` sur les RPC
> argent), absence de `CHECK >= 0` sur les colonnes monétaires récentes, migrations anciennes non ré-exécutables,
> et l'absence totale de traçabilité `schema_migrations` (application manuelle via Management API).

---

## Synthèse par sévérité

| Sévérité | Nombre | Sujets |
|----------|--------|--------|
| P0 | 0 | — |
| P1 | 4 | Drift types jauge/clawback (→ `as any` sur RPC argent) · `purchased_value_cents` live en prod (≠ hypothèse migration) · pas de `CHECK >= 0` sur colonnes monétaires récentes · pas de tracking `schema_migrations` |
| P2 | 6 | Migrations non idempotentes (CREATE TABLE/POLICY/TRIGGER sans garde) · plancher `GREATEST(1, v_cost)` jauge · `convert_abandoned_gauges` non concurrence-safe (pas d'advisory lock) · FK `winners.game_id`/`item_id` NO ACTION · `xp_to_level` recalc non verrouillé sur write concurrent · `decrement_credits` legacy retournée dans certains chemins |
| P3 | 5 | `paris_midnight` STABLE dans `WHERE` indexé · `gauge_wins.paid_credits` sans CHECK · `award_xp` re-derive level depuis `xp` (double source) · seeds insérés en migration de schéma · commentaires de migration périmés |

---

## P1

### [P1] Schema drift majeur : toute la feature jauge + clawback absente de `database.types.ts` → RPC argent appelées en `as any`
- **Fichier** : `src/lib/supabase/database.types.ts` (généré) vs `supabase/migrations/20260616120001…20260617120002`
- **Impact** : Les objets les plus sensibles financièrement n'existent pas dans les types générés, donc TOUTE leur invocation contourne le typage (`(supabase.rpc as any)(...)`). Une faute de frappe sur un nom de RPC, un mauvais nom de paramètre, ou une dérive de signature ne sont **plus détectés au build** — exactement sur le chemin argent (cost-basis, clawback remboursement/chargeback, conversion d'avoir). C'est la cause-racine du pattern « `(supabase.rpc as any)` ~90× » relevé en P3 par l'audit du 17 : ce n'est pas un nitpick de style, c'est une perte de garde-fou sur les mutations monétaires.
- **Preuve** : `grep` sur `database.types.ts` → **0 occurrence** pour : `user_item_gauges`, `gauge_wins`, `gauge_credit_refunds`, `increment_item_gauge`, `convert_abandoned_gauges`, `add_purchased_value`, `clawback_pack_credits`, `clawback_gift_code`, `purchased_value_cents`, `get_my_winners`, `block_self_excluded_clicks`. Pourtant ces 3 tables + 6 fonctions + 1 colonne existent bien dans les migrations. Appels réels non typés : `src/app/api/stripe/webhook/route.ts:260,521,541`, `src/app/api/cron/convert-abandoned-gauges/route.ts:26`.
- **Correctif** : Régénérer les types depuis la DB live (`supabase gen types typescript --linked > src/lib/supabase/database.types.ts`) APRÈS application des migrations, puis remplacer les `(supabase.rpc as any)` des chemins argent par des appels typés. Ajouter une étape CI « types à jour » (diff entre types committés et types régénérés) pour empêcher la re-dérive.
- **Statut** : ouvert.

### [P1] `purchased_value_cents` (cost-basis cash de la jauge) est ALIMENTÉ en prod `main`, contredisant l'hypothèse « dormant » des migrations
- **Fichier** : `src/app/api/stripe/webhook/route.ts:257-269` vs commentaires `supabase/migrations/20260616120003_gauge_cash_basis.sql:13-15`
- **Impact** : La migration `120003` affirme noir sur blanc : *« le webhook prod (main) n'appelle PAS add_purchased_value → purchased_value_cents reste 0 en prod → tous les décréments cash sont des no-op »*. C'est **faux sur le `main` actuel** : le webhook appelle `add_purchased_value(p_user_id, p_amount_cents, p_session)` à chaque achat de pack réussi. Donc `purchased_value_cents` **s'accumule réellement en prod**. Le consommateur (`increment_item_gauge`, qui draine ce cash et complète la jauge « payé 2× la valeur ») n'est, lui, **pas** câblé dans `src/` (présent uniquement en migrations/tests) — la jauge ne se vide donc pas encore. Conséquence : (a) la prémisse de sûreté juridique « tout est dormant » sur laquelle reposent les commentaires de migration n'est plus vraie ; (b) le jour où le code jauge est mergé, un cost-basis pré-accumulé (potentiellement gros) devient immédiatement drainable — il faudra décider si on remet `purchased_value_cents` à 0 au go-live ou si on l'honore.
- **Preuve** : `grep add_purchased_value src/` → 1 appelant live (`webhook/route.ts:260`). `grep increment_item_gauge src/` → aucun appelant applicatif (uniquement migrations + `__tests__`). Signature appelée (3 args) = signature déployée (`20260617120000_clawback_cost_basis.sql:23`) → l'appel **réussit** (pas un no-op silencieux).
- **Correctif** : Décider explicitement de la stratégie go-live jauge : soit gater `add_purchased_value` derrière `GAUGE_ENABLED` côté webhook, soit accepter l'accumulation et purger/honorer `purchased_value_cents` au merge. Mettre à jour les commentaires de migration `120003` (l'hypothèse documentée est trompeuse pour le prochain auditeur). Re-valider l'angle juridique du ×2 puisque le cost-basis n'est plus dormant.
- **Statut** : ouvert (décision produit/juridique requise).

### [P1] Absence de `CHECK (>= 0)` sur les colonnes monétaires/compteurs récents (intégrité financière au niveau DB)
- **Fichier** : `supabase/migrations/20260616120003_gauge_cash_basis.sql:19` (`purchased_value_cents`), `20260616120001_item_gauges.sql:20-21,41` (`progress`, `target`, `paid_credits`), `20260609200001_gamification_phase1.sql:12-14` (`xp`, `level`, `streak_count`)
- **Impact** : Seules `profiles.credits` (`001:13`) et `profiles.earned_credits` (`20260609190003:10`) ont une contrainte `CHECK >= 0`. Toutes les colonnes monétaires/compteurs ajoutées ensuite n'ont **aucun garde-fou DB** : `purchased_value_cents BIGINT NOT NULL DEFAULT 0` (sans CHECK), `user_item_gauges.progress/target`, `gauge_wins.paid_credits`, `xp/level/streak_count`. La sûreté repose **entièrement** sur le `greatest(0, …)` applicatif dans les RPC (clawback, deduct, increment). Si un futur RPC, un backfill manuel, ou un bug d'ordre d'opérations soustrait trop, la base **acceptera silencieusement un solde négatif** — exactement le type de corruption que `earned_credits_non_negative` a été ajouté pour empêcher. Defense-in-depth manquante sur la colonne qui finance la promesse « a payé 2× ».
- **Preuve** : `grep "CHECK (" *.sql | grep ">= 0"` → seulement 2 hits (`credits`, `earned_credits`). `purchased_value_cents` déclaré ligne 19 de `120003` sans CHECK. Les RPC compensent (`clawback_cost_basis.sql:77-78` `greatest(0, …)`) mais rien au niveau colonne.
- **Correctif** : `ALTER TABLE profiles ADD CONSTRAINT purchased_value_cents_non_negative CHECK (purchased_value_cents >= 0);` et idem pour `user_item_gauges.progress >= 0`, `target >= 0`, `gauge_wins.paid_credits >= 0`, `xp >= 0`, `level >= 1`, `streak_count >= 0`. (Précéder chaque ajout d'un `UPDATE … SET col = 0 WHERE col < 0` comme déjà fait pour `earned_credits`.)
- **Statut** : ouvert.

### [P1] Aucune traçabilité `schema_migrations` : application manuelle via Management API, risque de double-application / d'état non reproductible
- **Fichier** : `supabase/` (pas de `config.toml`, pas de `schema_migrations` référencée nulle part)
- **Impact** : `supabase/` ne contient ni `config.toml`, ni dossier `.branches`, et `grep schema_migrations` sur tout le repo = **0 hit**. Conjugué à la mémoire `supabase-pooler-bypass` (migrations appliquées en `curl` sur l'API Management pour contourner le circuit-breaker du pooler), cela signifie qu'**aucun registre fiable** ne dit quelles migrations sont réellement appliquées sur la DB partagée. Risques concrets : (a) ré-appliquer une migration non-idempotente (cf. P2) la fait échouer ou double-créditer un backfill ; (b) une migration « oubliée » laisse la prod désynchronisée du code (ex. exactement le cas du drift jauge ci-dessus) ; (c) impossible de reconstruire la DB à l'identique pour un environnement de test/DR. La note CLAUDE.md « 2 migrations appliquées à la DB partagée » se gère à la main, sans filet.
- **Preuve** : `ls supabase/` → `migrations/`, `seed*.sql`, `test_games.sql`, `.temp/` uniquement. Pas de `config.toml`. `grep -r schema_migrations supabase/ scripts/` → vide. Mémoire pooler-bypass = application hors-CLI.
- **Correctif** : Tenir un registre explicite (table `supabase_migrations.schema_migrations` ou un fichier `docs/MIGRATIONS-APPLIED.md` horodaté) renseigné à CHAQUE application manuelle, comme le recommande déjà la mémoire pooler. Idéalement, rendre toutes les migrations idempotentes (P2) pour que la ré-exécution soit sûre, puis adopter `supabase db push` quand le pooler le permet.
- **Statut** : ouvert (process).

---

## P2

### [P2] Migrations anciennes non idempotentes : `CREATE TABLE/POLICY/TRIGGER` sans garde → échec en cas de ré-exécution
- **Fichier** : `supabase/migrations/20260123000003_mini_games.sql:2` (`CREATE TABLE mini_game_plays` sans `IF NOT EXISTS`), `001_initial_schema.sql` (9 `CREATE POLICY` + 2 `CREATE TRIGGER` sans DROP), `20260123000004_referral_system.sql:26`, `20260125000002_data_persistence.sql:113,135`, `20260123000006_storage_policies.sql` (4 policies), `20260615180001_self_exclusion.sql:1 policy`
- **Impact** : Plusieurs migrations affirment être « sûres à ré-appliquer » (ex. `phase3_hardening`) mais les fondations ne le sont pas : un `CREATE TABLE` / `CREATE POLICY` / `CREATE TRIGGER` sans `IF NOT EXISTS` / `DROP … IF EXISTS` préalable **lève une erreur** au 2e passage (`already exists`). Couplé à l'absence de `schema_migrations` (P1), un replay défensif (DR, nouvel env) casse en milieu de chaîne, laissant la DB partiellement migrée.
- **Preuve** : `grep "CREATE TABLE " | grep -v "IF NOT EXISTS"` → `mini_game_plays`. Comptage `CREATE POLICY` vs `DROP POLICY` par fichier : `001`=9/0, `mini_games`=2/0, `storage_policies`=4/0, `data_persistence`=2/0, `self_exclusion`=1/0. Les migrations récentes (à partir de juin) sont, elles, correctement idempotentes (`DROP POLICY IF EXISTS` systématique).
- **Correctif** : Pour toute reconstruction, encadrer ces objets (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS … ; CREATE POLICY …`, `DROP TRIGGER IF EXISTS … ; CREATE TRIGGER …`). Tolérable de ne pas réécrire l'historique si la DB live est figée, mais à corriger dans un script « bootstrap from scratch ».
- **Statut** : ouvert.

### [P2] `increment_item_gauge` (cash) : plancher `GREATEST(1, …)` du coût peut compléter la jauge avec moins de cash que la cible (sur-comptage par arrondi)
- **Fichier** : `supabase/migrations/20260616120003_gauge_cash_basis.sql:96,108`
- **Impact** : `v_cost := LEAST(v_value, GREATEST(1, ROUND(v_value::numeric / (GREATEST(v_earned,0)+1))))`. Le plancher `GREATEST(1, …)` garantit ≥ 1 centime drainé même quand la quote-part réelle est < 1 ct. Sur un grand nombre de crédits earned (gros pack), la somme des planchers d'arrondi peut faire avancer la jauge de plus de centimes que le cash réellement disponible, c.-à-d. **compléter la cible avec un cost-basis effectif < target** → item « garanti » obtenu pour un cash réel légèrement inférieur au double annoncé. Idem `v_target = GREATEST(1, ROUND(retail*2*100))` (`:96`). Déjà identifié comme « faux positif vérifié à ne pas re-corriger » dans la mémoire `cleekzy-clawback-hardening` (#103) — je le **re-signale en P2** car l'écart est borné (≤ 1 ct × nb de spends) et la feature est dormante côté drain, mais l'argument « ne pas toucher » repose sur l'hypothèse « jauge non drainée en prod » qui devient fragile (cf. P1 `purchased_value_cents`).
- **Preuve** : `120003:108` plancher `GREATEST(1, …)` ; cible recalculée à chaque clic `:96` (resync à la baisse possible si `retail_value` baisse → cf. P3 connu #199 audit 17).
- **Correctif** : Au go-live jauge, soit accumuler le résidu fractionnaire (carry) au lieu de plancher à 1, soit ne déclarer `completed` que si `SUM(cost-basis réellement drainé) >= target` (suivi séparé du cash drainé, pas juste `progress >= target`). À trancher avec le juridique vu que ×2.
- **Statut** : ouvert (lié au gel de la feature).

### [P2] `convert_abandoned_gauges` : idempotent par état mais NON concurrence-safe (double exécution cron-job.org + Vercel simultanée)
- **Fichier** : `supabase/migrations/20260616120007_fix_gauge_abandon_double_mint.sql:25-49`
- **Impact** : La fonction est idempotente *séquentiellement* (elle ne traite que `progress > 0` puis remet `progress = 0`). Le `FOR UPDATE` verrouille chaque ligne `user_item_gauges`. MAIS deux exécutions **concurrentes** (le cron-job.org + un re-trigger Vercel/manuel) peuvent toutes deux entrer dans la boucle avant que la première ne commite le `progress = 0` : la 2e attend le verrou de ligne, puis relit `progress` — comme le `FOR UPDATE` est dans le `SELECT` du curseur et que la 2e transaction a démarré son scan avant le commit de la 1ère, le comportement dépend du niveau d'isolation (READ COMMITTED par défaut → la 2e re-évalue le prédicat après le verrou et verra `progress = 0`, donc OK en pratique). C'est **probablement safe en READ COMMITTED** mais non garanti par construction et non documenté ainsi. L'audit du 17 (#197 P3) note d'ailleurs « no idempotency guard against concurrent execution » côté route cron.
- **Preuve** : `convert-abandoned-gauges/route.ts` ne pose aucun verrou applicatif ; la sûreté repose uniquement sur le `FOR UPDATE` ligne-à-ligne + le re-scan READ COMMITTED.
- **Correctif** : Ajouter un `pg_advisory_xact_lock(hashtext('convert_abandoned_gauges'))` en tête de fonction pour sérialiser franchement les exécutions concurrentes. Coût nul, supprime toute ambiguïté d'isolation.
- **Statut** : ouvert.

### [P2] FK `winners.game_id` et `winners.item_id` en NO ACTION : orphelins/blocage possibles, asymétrie avec la migration RGPD
- **Fichier** : `supabase/migrations/001_initial_schema.sql:139-141` ; non corrigé par `20260615170001_fk_delete_set_null.sql`
- **Impact** : La migration RGPD `fk_delete_set_null` a passé `winners.user_id` en `ON DELETE SET NULL` mais **pas** `winners.game_id` (UNIQUE NOT NULL REFERENCES games) ni `winners.item_id` (NOT NULL REFERENCES items). En pratique games/items ne sont pas supprimés (pas de flux de delete), donc pas d'orphelin aujourd'hui. Mais : (a) c'est une incohérence de politique FK non documentée ; (b) si un jour on purge de vieilles `games` (RGPD/rétention), la suppression **échouera** (NO ACTION sur `winners.game_id` NOT NULL) ou laissera des winners pointant dans le vide. Même remarque pour `clicks.game_id` qui est `ON DELETE CASCADE` (`001:120`) — supprimer une game efface ses clics, ce qui pourrait être voulu ou non selon la politique de rétention.
- **Preuve** : `001:139` `game_id UUID UNIQUE NOT NULL REFERENCES games(id)` (pas de ON DELETE). `fk_delete_set_null.sql` ne touche que les 5 FK vers `profiles`, pas celles vers `games`/`items`.
- **Correctif** : Décider d'une politique de rétention des `games` ; si purge envisagée, passer `winners.game_id`/`item_id` en cohérence (probablement `ON DELETE RESTRICT` explicite pour protéger l'historique, ou archivage avant purge). Au minimum documenter le choix.
- **Statut** : ouvert (décision rétention).

### [P2] `award_xp` recalcule `level` depuis `xp` non verrouillé en lecture → double source de vérité sur write concurrent
- **Fichier** : `supabase/migrations/20260609200001_gamification_phase1.sql:34-37`
- **Impact** : `award_xp` fait `SELECT level … FOR UPDATE` (verrou OK) puis `UPDATE … SET xp = xp + p_amount, level = xp_to_level(xp + p_amount)`. Le `xp` lu dans l'expression `xp_to_level(xp + p_amount)` est l'`xp` **avant** update (correct car même requête). C'est cohérent. Le risque réel est ailleurs : `level` est une **colonne dérivée stockée** de `xp` via `xp_to_level`, recalculée dans *plusieurs* RPC (`award_xp`, `claim_daily_login:79`, `open_chest`, `claim_quest`). Si l'un d'eux met à jour `xp` sans recalculer `level` (ou inversement), les deux divergent silencieusement. Le trigger `protect_profile_sensitive_columns` protège les deux contre l'écriture client, mais rien ne garantit la **cohérence interne** xp↔level entre RPC.
- **Preuve** : `xp_to_level` appelé dans `200001:35,79`, `chests_items:115`, etc. — recalcul répété, aucune contrainte/trigger ne force `level = xp_to_level(xp)`.
- **Correctif** : Soit faire de `level` une colonne **générée** (`GENERATED ALWAYS AS (xp_to_level(xp)) STORED` — nécessite `xp_to_level` IMMUTABLE, ce qu'elle est déjà `:23`), supprimant toute dérive ; soit un trigger `BEFORE UPDATE OF xp` qui force `NEW.level = xp_to_level(NEW.xp)`. La colonne générée est la plus propre.
- **Statut** : ouvert.

### [P2] Chemins legacy retournant `-1` sur insuffisance, mélangés avec des chemins qui lèvent `EXCEPTION`
- **Fichier** : `supabase/migrations/20260616120003_gauge_cash_basis.sql:159` (`deduct_credits` RETURN -1), `20260609180001:125`
- **Impact** : Convention d'erreur **incohérente** entre RPC argent : `deduct_credits` renvoie `-1` sur fonds insuffisants (sentinel), `perform_click` renvoie `(ok=false, reason='insufficient_credits')` (struct), `grant_pack_credits` renvoie `jsonb{error}`, et d'autres `RAISE EXCEPTION 'forbidden'`. Un appelant qui ne teste pas le bon canal d'erreur pour la bonne fonction peut traiter un échec comme un succès (ex. `-1` interprété comme « nouveau solde = -1 » au lieu de « refus »). Risque de mauvaise gestion côté `src/` plus que de corruption DB, mais la surface est le chemin argent.
- **Preuve** : `deduct_credits … RETURN -1` (`120003:159`) vs `perform_click … reason='insufficient_credits'` (`180001:67`) vs `RAISE EXCEPTION` (admin/forbidden). 3 conventions distinctes.
- **Correctif** : Harmoniser (idéalement tout en JSONB `{ok, error}` ou tout en EXCEPTION typée). À défaut, auditer chaque appelant `src/` de `deduct_credits` pour vérifier le test `=== -1`.
- **Statut** : ouvert.

---

## P3

### [P3] `paris_midnight()` (STABLE) appelée dans le `WHERE` de `reset_daily_credits` → re-évaluation par ligne, pas d'usage d'index
- **Fichier** : `supabase/migrations/20260609120001_credit_economy_rpcs.sql:12-15`, usages `reset_daily_credits` (`180001:170`, `phase3:31`)
- **Impact** : `paris_midnight()` est `STABLE` (correct), mais l'appel cible toujours une seule ligne par `id` (PK), donc l'impact perf est nul ici. Signalé pour exhaustivité : si un jour un reset **batch** (`WHERE last_credits_reset < paris_midnight()` sur toute la table) est introduit, l'index partiel `idx_profiles_last_reset` (`20260124000002`) ne sera pas exploité de façon optimale et la fonction sera ré-appelée. Aucun bug actuel.
- **Preuve** : `paris_midnight` STABLE `:15` ; reset par PK uniquement.
- **Correctif** : Aucun pour l'instant ; si batch reset un jour, capturer `paris_midnight()` dans une variable avant la requête.
- **Statut** : non bloquant.

### [P3] `gauge_wins.paid_credits` / `target` / `progress` sans CHECK — couvert par P1 (intégrité monétaire)
- **Fichier** : `supabase/migrations/20260616120001_item_gauges.sql:20-21,41`
- **Impact** : Doublon volontaire du P1 pour les colonnes jauge spécifiquement ; voir le correctif P1 (`CHECK >= 0`).
- **Statut** : voir P1.

### [P3] Seeds de données insérés dans des migrations de schéma (`items`, `daily_quests`, `cosmetics_catalog`, `badges`)
- **Fichier** : `001_initial_schema.sql:280-287` (item de test iPhone), `20260609200001:101-106` (quêtes), `phase3:256-260` (cosmétiques), `20260610090002:9` (UPDATE badges)
- **Impact** : Mélange schéma + données de seed dans les mêmes fichiers. L'item de test « iPhone 15 Pro » avec image `placehold.co` (`001:281`) finit potentiellement en prod si la migration `001` est rejouée telle quelle. Les `ON CONFLICT DO NOTHING` limitent la casse, mais c'est un anti-pattern (les seeds devraient vivre dans `seed.sql`/`seed_items.sql`, déjà présents).
- **Preuve** : `001:280` `INSERT INTO items … 'iPhone 15 Pro' … placehold.co`. `seed.sql` + `seed_items.sql` existent en parallèle.
- **Correctif** : Retirer les `INSERT` de données de démo des migrations de schéma ; concentrer les seeds dans les fichiers dédiés non rejoués en prod.
- **Statut** : ouvert (cosmétique/hygiène).

### [P3] `award_xp` re-derive `level` — couvert par P2 (double source de vérité)
- **Fichier** : `20260609200001_gamification_phase1.sql:35`
- **Impact** : voir P2 ; classé P3 en doublon car le risque concret est faible (toutes les RPC qui touchent `xp` recalculent `level` dans la même requête).
- **Statut** : voir P2.

### [P3] Commentaires de migration périmés / trompeurs (jauge « dormante en prod »)
- **Fichier** : `supabase/migrations/20260616120001_item_gauges.sql:8-10`, `20260616120003_gauge_cash_basis.sql:13-15`
- **Impact** : Les en-têtes affirment que le code jauge « N'EST PAS mergé sur main » et que `add_purchased_value` n'est pas appelé en prod. Sur le `main` actuel, `add_purchased_value` **est** appelé (cf. P1). Un futur auditeur/dev se fiant à ces commentaires pourrait prendre une mauvaise décision de sûreté. La doc dans le code de migration doit refléter l'état réel.
- **Preuve** : `120003:13` « le webhook prod (main) n'appelle PAS add_purchased_value » contredit `webhook/route.ts:260`.
- **Correctif** : Mettre à jour les en-têtes de `120001`/`120003` au prochain passage (ou via une migration de note), en cohérence avec la décision P1.
- **Statut** : ouvert (doc).

---

## Points VÉRIFIÉS et SAINS (anti-régression — ne pas « re-corriger »)

- **`search_path` sur TOUS les RPC DEFINER live** : extraction programmatique de chaque bloc `CREATE FUNCTION … SECURITY DEFINER`. Les seuls flaggés sans `search_path` sont les versions **anciennes** ensuite soit `DROP` (`refund_credits`, `decrement_credits`, `get_next_sequence`, `get_total_credits`), soit recréées AVEC `search_path` (`perform_click`, `deduct_credits`, `reset_daily_credits`, `collect_vip_bonus`, `claim_eligible_badges`, `add_mini_game_credits`), soit corrigées par `ALTER FUNCTION … SET search_path` (`handle_new_user`, `can_play_mini_game`, `log_player_event`, `apply_referral_code`, `admin_set_credits`, `admin_set_admin`, `paris_midnight`, `log_badge_earned`, `log_win_recorded`). **L'escalade par injection de schéma est fermée sur la surface live.** (`20260609180001`, `20260614140001`).
- **Atomicité argent** : `perform_click` (verrou game + profil `FOR UPDATE`, déduction daily→earned, séquence sous verrou), `deduct_credits`, `grant_pack_credits`, `apply_referral_code` (verrou filleul + parrain), `distribute_jackpot` (verrou ligne pot), `end_game` (verrou + re-check `end_time` sous verrou, anti-TOCTOU), `increment_total_wins` — tous transactionnels et verrouillés. Volatilité cohérente (`STABLE`/`IMMUTABLE` corrects : `paris_midnight`, `xp_to_level`, `get_leaderboard`, `count_game_contenders`).
- **Idempotence des mutations argent** : Stripe events (PK `stripe_events.id`), `credit_grant_sessions.stripe_session` (PK, defense-in-depth vs double-grant), `pack_purchases (user_id, month, pack_id)` UNIQUE + `ON CONFLICT`, `gift_codes.stripe_session` UNIQUE, `buy_it_now_purchases (user_id, game_id)` UNIQUE, clawback via `clawed_back_at` + `FOR UPDATE`. Colonne `clawed_back_at` créée (`230001`) AVANT son usage (`120000`) → pas de colonne manquante.
- **Chaîne `fix_*` jauge cohérente** : `120002` (mint × crédits) → `120003` (passage centimes) → `120004` (fix double-mint, ajoutait restauration cost-basis) → `120007` (fix recyclage : UNE seule restitution en crédits, PAS de restauration cost-basis). L'état final (`120007`) est **logiquement cohérent et non contradictoire** : un seul canal de restitution, non recyclable. La signature 3-arg `increment_item_gauge` est bien `DROP`-ée avant recréation 2-arg (`120003:80`).
- **Garde IDOR self** sur toutes les RPC à `p_user_id` exposées à `authenticated` (`auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid()` → `forbidden`), y compris la correction `get_buy_it_now_offers` (`120002` idor guard, garde dans le `WHERE` pour `LANGUAGE sql`).
- **RLS activée sur toutes les tables sensibles** : `profiles`, `items`, `games`, `clicks`, `winners`, `badges`, `user_badges`, `stripe_events`, `credit_grant_sessions`, `gift_codes`, `user_fairness`, `user_item_gauges`, `gauge_wins`, `gauge_credit_refunds`, `xp_events`, `buy_it_now_purchases`, `mini_game_plays`. Tables d'écriture-via-DEFINER en default-deny (aucune policy). **Aucune table métier sans RLS détectée.** (Détail policy = périmètre de l'agent RLS.)
- **FK RGPD** : `fk_delete_set_null` passe `games.last_click_user_id`, `games.winner_id`, `clicks.user_id`, `winners.user_id`, `player_data_audit.user_id` en `ON DELETE SET NULL` → suppression de compte effective sans casser l'historique. (Reste l'asymétrie `winners.game_id`/`item_id` = P2.)
- **Index chemins chauds** : `clicks(game_id, clicked_at DESC)`, `clicks(game_id, user_id)`, `clicks(game_id, sequence_number DESC)`, `games(status, end_time) WHERE active/final`, leaderboard `profiles(xp DESC, total_wins DESC)`, `xp_events(created_at)` + `(user_id, created_at)`, feeds comments/winners. **Pas de scan sur les tables qui grossissent (`clicks`, `games`).** Le doublon de nom `idx_mini_game_plays_user_date` est géré par `DROP INDEX IF EXISTS` (`20260124000003:5`) → pas un bug.
