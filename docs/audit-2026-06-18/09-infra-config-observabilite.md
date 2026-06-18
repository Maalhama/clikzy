# Audit Cleekzy 2026-06-18 — Infra / Config / Crons / Observabilité / Résilience

> Périmètre : env & secrets (`.env.example`/`.env.local` vs `process.env`), 5 routes cron
> (`bot-clicks`, `convert-abandoned-gauges`, `create-rotation`, `reset-credits`, `streak-reminder`),
> Sentry (`sentry.*.config.ts` + `instrumentation.ts`), Redis/Upstash (`redis.ts`/`rateLimit.ts`),
> `next.config.ts` / `vercel.json`, résilience (Supabase down, health, error boundaries), build/déploiement.
> Méthode : lecture adversariale du code + cross-check `grep process.env` ↔ `.env.example` ↔ `.env.local`,
> re-vérification des points déjà soulevés par `AUDIT-2026-06-17.md`. Branche `main`. **Aucune modification.**

## Synthèse exécutive

La posture infra est **solide sur les fondamentaux critiques** : les **5 routes cron sont toutes
fail-closed** (refus si `CRON_SECRET` absent OU header `Authorization: Bearer` ≠ secret) — aucun
endpoint métier (création de rotation, reset crédits, conversion de jauges) n'est déclenchable par
un anonyme. Le webhook Stripe est signé + idempotent. **Aucun secret n'est exposé via `NEXT_PUBLIC_`**
(grep exhaustif : 0 occurrence de `NEXT_PUBLIC_*SECRET/SERVICE/PRIVATE/TOKEN`). `.env.example` est
**parfaitement aligné** avec ce que le code lit (0 var manquante, 0 var stale). `.env.local` n'a
**jamais été commité** (absent de l'historique git, correctement gitignored). Sentry est en
capture d'erreurs seule côté client (tracing 0, replay 0) pour conformité CNIL.

**MAIS** deux points méritent attention immédiate :
1. **`.env.local` contient des secrets de PRODUCTION RÉELS sur le disque** (clé service_role 219c,
   clé OpenAI 164c, Resend, VAPID, CRON_SECRET 64c) — non commités mais présents en clair localement
   et donc dans tout backup/sync de la machine. Déjà signalé 06-17, **toujours présent**.
2. **Incohérence de planification reset-credits** : `vercel.json` déclenche à **01:10 UTC** et la doc
   cron-job.org à **00:00 UTC** — or **minuit Paris = 22:00/23:00 UTC** (été/hiver). Les crédits ne
   sont donc PAS reset à minuit Paris mais 1 à 3 h plus tard. Pas un bug de sécurité (la RPC garde
   `paris_midnight()` empêche le double reset), mais un décalage produit + un risque de **fenêtre où
   l'utilisateur a 0 crédit après minuit local**.

Le reste = durcissements P2/P3 (Sentry sans `beforeSend` PII scrub, divergence tracesSampleRate
client 0 / serveur 0.1, health endpoint à liveness faible, dépendance mono-source à cron-job.org
pour bot-clicks/create-rotation, fail-open Redis confirmé, GAUGE_ENABLED hardcodé).

### Compte par sévérité
- **P0 : 1** (secrets de prod réels en clair dans `.env.local` sur disque)
- **P1 : 2** (planification reset-credits hors minuit Paris ; dépendance mono-source cron-job.org sur bot-clicks/create-rotation → lobby vide / crédits non reset si panne)
- **P2 : 5**
- **P3 : 5**

### Vérifié NON exploitable / déjà corrigé (re-vérification adversariale)
- **Crons fail-closed** : `bot-clicks:103`, `convert-abandoned-gauges:19`, `create-rotation:176`,
  `reset-credits:22`, `streak-reminder:19` → tous `if (!CRON_SECRET || authHeader !== \`Bearer ${CRON_SECRET}\`) → 401`.
  Le commentaire `create-rotation:173` note explicitement que `x-vercel-cron` est forgeable et n'est
  PAS utilisé comme preuve. **Aucun cron ouvert.**
- **Double-mint jauge abandonnée** : `convert_abandoned_gauges` (migration `20260616120007_fix_gauge_abandon_double_mint.sql`)
  utilise `SELECT … FOR UPDATE` + `progress=0` dans la même transaction → un 2ᵉ passage concurrent
  (Vercel + cron-job.org au même `30 2 * * *`) bloque sur le verrou puis trouve `progress=0`.
  **Idempotent, NON re-signalé** malgré la double-planification (voir P2 ci-dessous pour la nuance).
- **Double reset crédits** : `reset-credits:82` filtre `last_credits_reset IS NULL OR < paris_midnight()`
  → un 2ᵉ passage le même jour traite 0 user. **Idempotent.**
- **`.env.local` jamais commité** : `git log --all -- .env.local` = vide, `git check-ignore` OK.
- **Pas de fuite de secret client** : seuls 8 `NEXT_PUBLIC_*` (DSN Sentry, Umami, Stripe publishable,
  Supabase URL+anon, VAPID public, site URL) — tous légitimement publics.
- **`.vercel/`** : gitignored ; `project.json` ne contient que `projectId`/`orgId`/`projectName`
  (identifiants non secrets), pas de token.
- **Source maps** : `next.config.ts:111` `sourcemaps.disable: true` ; les 1292 `.map` trouvés sont
  dans `.next/` (gitignored, artefacts de build local, reconstruits par Vercel — non publiés).
- **Pas de Sentry auth token / `.sentryclirc`** dans le repo (cohérent avec upload désactivé).

---

## P0 — Secrets de PRODUCTION réels présents en clair dans `.env.local`

**Fichier** : `/.env.local` (12 clés, toutes non vides)
**Impact** : `.env.local` contient des valeurs qui ne sont **pas** des placeholders mais des
secrets de production réels — confirmé par leur forme : `SUPABASE_SERVICE_ROLE_KEY` (219 caractères,
= JWT service_role complet → bypass total des RLS, lecture/écriture de toute la DB y compris
`auth.users`, soldes, VIP), `OPENAI_API_KEY` (164c), `RESEND_API_KEY` (`re_…`, 36c → envoi d'emails
au nom du domaine cleekzy.com), `CRON_SECRET` (64c → déclenchement de tous les crons), `VAPID_PRIVATE_KEY`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Le fichier n'est ni commité ni dans l'historique git (bon point),
**mais** : il vit en clair sur le disque, est aspiré par tout backup Time Machine / iCloud / sync,
et toute commande qui imprime le fichier (ou un futur `git add -f` accidentel) le divulguerait. La
clé service_role en clair sur un poste de dev est le pire scénario : sa fuite = compromission totale
de la base argent réel.
**Preuve** : `grep -cE '^[A-Z_]+=.+' .env.local` → 12 (toutes renseignées) ; longueurs cohérentes
avec des secrets réels et non des `your-…`/`xxx`. Déjà relevé dans `AUDIT-2026-06-17.md:186,303`
(« Clés API live (OpenAI, Resend) présentes dans .env.local »).
**Correctif** :
1. Considérer ces secrets comme potentiellement exposés : **rotation recommandée** côté Supabase
   (regénérer la clé service_role), Resend, OpenAI, et regénérer `CRON_SECRET` + `VAPID` si le poste
   a été partagé/synchronisé. La source de vérité doit être **uniquement** les env vars Vercel.
2. Pour le dev local, n'y laisser que des secrets de **test** (Supabase projet de dev, `sk_test_`,
   Resend test). Ne jamais y stocker la clé service_role de prod.
3. (Process) ne pas recopier les valeurs hors de la machine ; ce rapport ne les reproduit pas.
**Statut** : ⚠️ OUVERT (action Mehdi : rotation + purge des secrets prod du `.env.local`). Hors-code.

---

## P1 — Reset des crédits déclenché hors minuit Paris (décalage 1–3 h)

**Fichier** : `vercel.json:5-7` (`reset-credits` à `10 1 * * *` = **01:10 UTC**) ;
`docs/CRON_JOBS.md:29` + `CLAUDE.md` (cron-job.org à `0 0 * * *` = **00:00 UTC**)
**Impact** : minuit Europe/Paris correspond à **23:00 UTC en hiver** et **22:00 UTC en été**. Or les
deux planifications tirent à 00:00 et 01:10 UTC, soit **1 h (hiver) à 3 h (été) APRÈS minuit Paris**.
Conséquence produit : un joueur qui épuise ses crédits à 23h59 Paris reste à **0 crédit jusqu'à
01:10–03:10 du matin** (selon DST) au lieu d'être rechargé « à minuit » comme promis par l'UI et la
doc. La RPC `reset_daily_credits` garde bien `paris_midnight()` (donc pas de double reset, DST-safe
côté Postgres), mais le *déclenchement* reste tardif. La doc `CRON_JOBS.md:32` mentionne `0 23`/`0 22`
comme « pour minuit Paris » sans que `vercel.json` ni la conf décrite suivent cette consigne.
**Preuve** : `vercel.json` crons `reset-credits=10 1 * * *`, `streak-reminder=0 18 * * *` (= 18:00 UTC
= 19h/20h Paris, doc dit « 20h Paris » → décalé d'1 h en hiver), `convert-abandoned-gauges=30 2 * * *`.
`reset-credits/route.ts:42` appelle `paris_midnight()` (guard correct), mais le cron ne tire pas à
cette heure.
**Correctif** : aligner les schedules sur l'heure Paris réelle. Comme les crons Vercel n'ont pas de
timezone (UTC only), choisir **`0 23 * * *`** (couvre l'hiver) ou accepter le léger décalage estival ;
idéalement piloter via cron-job.org qui supporte un fuseau et y mettre Europe/Paris 00:05. Documenter
qu'un reset « à minuit » exact en DST nécessite un cron timezone-aware. Corriger aussi le 18:00 UTC
de streak-reminder pour viser réellement 20h Paris (`0 18`→ envisager `0 18`/`0 19` selon DST).
**Statut** : OUVERT (1 ligne de schedule dans `vercel.json` + conf cron-job.org).

## P1 — Dépendance mono-source à cron-job.org pour `bot-clicks` et `create-rotation` (pas de filet Vercel)

**Fichier** : `vercel.json:3-16` (ne contient QUE `reset-credits`, `streak-reminder`,
`convert-abandoned-gauges`) ; `CLAUDE.md` § crons (bot-clicks `* * * * *` et create-rotation
`45 …` uniquement sur cron-job.org)
**Impact** : les deux crons les plus critiques pour que le produit **fonctionne** ne sont planifiés
**que** sur cron-job.org, sans filet de sécurité Vercel (contrairement aux 3 autres, doublés). Si
cron-job.org tombe (panne, compte suspendu, quota free dépassé, IP bloquée) :
- **`create-rotation` muet** → aucun nouveau jeu `waiting` créé → après la fin de la rotation
  courante, le **lobby se vide** (plus de parties). Panne silencieuse, sans alerte.
- **`bot-clicks` muet** → les parties `active` ne sont plus animées ni clôturées : timers figés,
  parties jamais terminées (`endGame` jamais appelé), gagnants jamais désignés, emails/push de
  victoire jamais envoyés, crédits/XP jamais attribués. **Le jeu s'arrête entièrement.**
Le commentaire `CLAUDE.md` justifie l'absence de filet par « fréquence trop élevée pour Vercel
Hobby » (vrai : `* * * * *` dépasse les crons Hobby). Mais il n'existe **aucun monitoring** détectant
que bot-clicks/create-rotation ne tournent plus (pas de heartbeat, pas de Sentry cron monitor, pas
d'alerte « 0 jeu actif depuis X »).
**Preuve** : `vercel.json` n'a que 3 crons ; bot-clicks/create-rotation absents. `CRON_JOBS.md:10`
marque bot-clicks « CRITIQUE » mais aucun fallback. Aligné avec la mémoire `cleekzy-audit-2026-06`
(« dépendance cron-job.org »).
**Correctif** :
1. Ajouter un **monitoring de heartbeat** : Sentry Cron Monitors (check-in à chaque exécution de
   bot-clicks/create-rotation → alerte si manqué) ou un cron Vercel de surveillance `*/15` qui
   vérifie « ≥1 jeu `active` ET ≤30 min depuis le dernier `created_at` waiting » et alerte
   `ADMIN_ALERT_EMAIL` sinon.
2. Évaluer un passage Vercel **Pro** (crons fréquents autorisés) pour rapatrier bot-clicks comme
   second déclencheur, OU un 2ᵉ fournisseur cron (redondance) pour ces deux jobs.
3. À court terme : configurer l'alerte d'échec native de cron-job.org (email si un job échoue N fois).
**Statut** : OUVERT (résilience). Recoupe la mémoire (dépendance cron-job.org connue).

---

## P2 — Sentry sans `beforeSend` ni allow-list : risque de capture PII (emails, user_id, montants)

**Fichier** : `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`,
`instrumentation.ts:21` (`Sentry.captureException(error, { extra: { url, method, … } })`)
**Impact** : aucun `beforeSend` ni `sendDefaultPii: false` explicite n'est posé. Or les erreurs
serveur capturées par `onRequestError` (`instrumentation.ts:15`) et `captureException` peuvent
embarquer dans le message/stack/`extra` des données sensibles : `url` complète (peut contenir des
query params, tokens de reset, `?ref=`, ids), et surtout les erreurs venant du webhook Stripe / des
crons / des server actions loggent `user ${userId}`, emails (`winnerEmail`, `to`), montants
(`amount_total`, `price`). Les messages d'erreur Supabase peuvent aussi contenir des fragments de
ligne. Sur un produit argent réel + RGPD (la mémoire `cleekzy-go-live-readiness` insiste sur le
RGPD), c'est un risque de fuite de PII vers un sous-traitant US (Sentry) sans minimisation.
**Preuve** : `grep "beforeSend|sendDefaultPii|setUser|scrub"` sur les 3 configs + instrumentation =
0 résultat. `instrumentation.ts:22-28` joint `url`/`method`/route au contexte sans filtrage.
**Correctif** : ajouter un `beforeSend` dans `sentry.server.config.ts` (et client) qui (a) supprime
les query strings sensibles de `event.request.url`, (b) scrubbe les patterns email/`userId`/montant
des messages, (c) ne joint pas l'URL brute dans `instrumentation.ts`. Documenter ce traitement pour
la conformité (DPA Sentry + minimisation). Confirmer `sendDefaultPii: false` (défaut Sentry v10, mais
l'expliciter).
**Statut** : OUVERT.

## P2 — Divergence `tracesSampleRate` : client 0 (CNIL) mais serveur/edge 0.1

**Fichier** : `sentry.client.config.ts:9` (`tracesSampleRate: 0`) vs `sentry.server.config.ts:7` &
`sentry.edge.config.ts:7` (`tracesSampleRate: 0.1`)
**Impact** : le commentaire client justifie `0` par la conformité CNIL (« le tracing de perf est un
traceur soumis à consentement »). Mais le **serveur** et l'**edge** tracent 10 % des transactions —
ce qui, côté serveur, génère des spans incluant potentiellement des données de requête. Deux problèmes :
(1) incohérence avec l'intention affichée (tracing désactivé pour conformité) ; (2) consommation de
quota Sentry (plan gratuit 5000 évts/mois — `SENTRY.md:5`) par des transactions de perf alors que
seules les erreurs sont voulues. Le tracing serveur n'est pas soumis au consentement navigateur, mais
si l'objectif est « capture d'ERREURS seule », `0.1` côté serveur est une fuite d'intention + de quota.
**Preuve** : valeurs littérales dans les 3 fichiers ; `SENTRY.md:47` documente `0.1` comme « optimisé »,
en contradiction avec le commentaire client `tracesSampleRate: 0`.
**Correctif** : décider explicitement — soit `tracesSampleRate: 0` partout (cohérent avec « erreurs
seules » + économie de quota), soit assumer le tracing serveur et mettre à jour les commentaires +
`SENTRY.md`. Recommandé : `0` partout vu le plan gratuit et l'intention CNIL.
**Statut** : OUVERT.

## P2 — Health endpoint : signal de liveness faible (toujours « ok » tant que la connexion répond)

**Fichier** : `src/app/api/health/route.ts:25`
**Impact** : le check fait `supabase.from('profiles').select('id').limit(1)` avec le client **anon**
(`@/lib/supabase/server`). Or `profiles` est en **RLS own-row** pour `authenticated` et l'appel
health est **anonyme** → la requête renvoie **0 ligne SANS erreur** (RLS = filtre, pas une erreur).
Le endpoint conclut donc `database: true` dès que la connexion réseau aboutit, même si la DB est en
lecture seule partielle, si les RLS sont cassées, ou si la table est vide. Il détecte bien une **panne
de connexion** (timeout/refus → `catch` → 503), ce qui couvre le scénario « Supabase down » de la
mémoire billing. Mais comme signal de santé applicative il est faible (faux « ok »). Déjà noté
`AUDIT-2026-06-17.md:196`.
**Preuve** : `route.ts:25-31` traite `error` comme seul signal d'échec ; un `select` anon sur une
table RLS own-row ne renvoie jamais d'erreur, juste `data: []`.
**Correctif** : interroger une ressource lisible par anon et révélatrice de l'état réel — p.ex. une
RPC `SELECT 1` dédiée, ou `get_public_profiles`/un `count` sur une table publique (items/winners).
Optionnellement ajouter un check « écriture » léger pour distinguer DB read-only. Garder le 503 sur
catch (correct).
**Statut** : OUVERT (signal faible, pas une vuln).

## P2 — `convert-abandoned-gauges` planifié simultanément sur Vercel ET cron-job.org (`30 2 * * *`)

**Fichier** : `vercel.json:12-15` (`30 2 * * *`) + `CLAUDE.md` (cron-job.org `30 2 * * *`)
**Impact** : le job tourne **deux fois à la même minute** (Vercel + cron-job.org). La RPC est
idempotente et verrouillée (`FOR UPDATE`, `progress=0` atomique — voir migration `…double_mint`),
donc **pas de double-crédit** : le second appel bloque sur le verrou puis trouve `progress=0`. Le
risque résiduel est mineur : (a) double invocation = double coût de fonction serverless + double
connexion DB inutile ; (b) si jamais la RPC évoluait sans `FOR UPDATE`, la course deviendrait
exploitable. C'est un anti-pattern de planification (même heure exacte sur deux ordonnanceurs) plutôt
qu'un bug actif. Idem reset-credits/streak-reminder doublés (eux protégés par leurs guards de date).
**Preuve** : schedules identiques `30 2 * * *` dans les deux sources ; idempotence confirmée par la
migration `20260616120007`.
**Correctif** : ne garder qu'**une** source par job (le filet Vercel suffit pour les 3 jobs
quotidiens → retirer ces 3 de cron-job.org, OU décaler les heures pour éviter la collision exacte).
Documenter que la double-planification est volontaire (filet) si on la garde, et s'assurer que tout
nouveau cron reste idempotent.
**Statut** : OUVERT (gaspillage + dette, pas exploitable aujourd'hui).

## P2 — Fail-open silencieux du rate-limit si Redis absent/erreur (impact infra confirmé)

**Fichier** : `src/lib/rateLimit.ts:88-92,124-128`, `src/lib/redis.ts:14-21`
**Impact** : `redis.ts` **throw** en production si `UPSTASH_*` manquent (`redis.ts:15`) — bon garde-fou
au boot via `getRedis()`. MAIS `rateLimit.ts:140` ne passe en chemin Redis que si `isRedisAvailable()`
(les deux env vars présentes) ; si elles sont **absentes**, il bascule **silencieusement** sur le
rate-limit **in-memory** (par instance serverless) sans jamais lever d'erreur. En prod multi-instance
Vercel, le in-memory est contournable (chaque instance a sa Map → `REDIS_MIGRATION.md` chiffre
×N le débit réel). De plus, sur **erreur Redis runtime** (`rateLimit.ts:125`), fallback in-memory
silencieux aussi. Conséquence : si les vars Upstash ne sont pas configurées sur Vercel (Redis marqué
« optionnel » dans `.env.example:24`), le rate-limit anti-bot/anti-flood des clics (`clicks: 90/min`)
devient inefficace en multi-instance — vecteur d'automatisation des clics sur un jeu argent réel.
Déjà confirmé côté sécu (fail-open). `.env.local` ne contient **pas** `UPSTASH_*` → en l'état le dev
(et un déploiement qui copierait ce set) tourne en in-memory.
**Preuve** : `rateLimit.ts:88-91` (`if (!redis) return checkRateLimitMemory(...)`),
`rateLimit.ts:124-128` (catch → memory), `redis.ts:18-20` (warn + return null hors prod).
`.env.local` keys : `UPSTASH_*` **absent**.
**Correctif** : (1) rendre `UPSTASH_*` **requis** en prod dans `envValidation.ts` (aujourd'hui non
listé du tout dans `ENV_VARS` → un déploiement sans Upstash ne déclenche aucun warning au boot).
(2) Optionnel : sur erreur Redis runtime, choisir fail-closed sur les routes argent (clics/paiement)
plutôt que fail-open. (3) Confirmer que `UPSTASH_*` sont bien settées sur Vercel prod (action Mehdi).
**Statut** : OUVERT (config + 1 garde-fou).

---

## P3 — `UPSTASH_*`, `VAPID_*`, `ADMIN_ALERT_EMAIL`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_UMAMI_*` absents de `envValidation.ts`

**Fichier** : `src/lib/security/envValidation.ts:12-35`
**Impact** : la liste `ENV_VARS` validée au boot (`instrumentation.ts:5`) ne couvre **pas** plusieurs
vars que le code lit pourtant : `UPSTASH_REDIS_REST_URL/TOKEN` (rate-limit prod), `VAPID_PRIVATE_KEY`/
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_SUBJECT` (push), `ADMIN_ALERT_EMAIL` (alertes paiement critiques),
`NEXT_PUBLIC_UMAMI_*` (analytics). Conséquence : un déploiement sans Upstash (rate-limit dégradé), sans
VAPID (push silencieusement no-op) ou sans `ADMIN_ALERT_EMAIL` (alertes paiement parties vers le défaut
`support@cleekzy.com`) **ne génère aucun avertissement au boot**. Le fail-fast existe mais a des angles
morts sur des dépendances de prod réelles.
**Preuve** : `envValidation.ts` liste 11 vars ; le grep `process.env` du code en trouve 21 (dont les
ci-dessus, non listées). `.env.example` documente bien tout (cohérent), mais la **validation runtime**
ne les couvre pas.
**Correctif** : ajouter ces vars à `ENV_VARS` avec `required` selon le besoin (UPSTASH required en
prod, VAPID/UMAMI optional avec warning). Aligner sur `.env.example`.
**Statut** : OUVERT.

## P3 — `removeConsole` exclut `error`/`warn` : fuite potentielle d'infos sensibles en prod

**Fichier** : `next.config.ts:12-14`
**Impact** : `removeConsole` garde `console.error` et `console.warn` en prod (intentionnel, pour le
diagnostic Vercel). Or les crons et le webhook Stripe loggent abondamment des PII/montants en
`console.error` (`reset-credits`, `streak-reminder`, `webhook` : `user ${userId}`, emails, `amount`,
`session.id`). Ces logs partent dans les logs Vercel (accessibles à l'équipe + rétention). Pas une
fuite publique, mais une accumulation de PII dans les logs serverless sans minimisation, à considérer
RGPD. Cohérent avec le P2 Sentry PII.
**Preuve** : `next.config.ts:13` `exclude: ['error','warn']` ; multiples `console.error('… user ${userId} …')`
dans `webhook/route.ts`, `reset-credits`, `streak-reminder`.
**Correctif** : minimiser les logs d'erreur (ids tronqués, pas d'email en clair) ou router via un
logger qui scrubbe. Au minimum, documenter la rétention des logs Vercel dans la politique RGPD.
**Statut** : OUVERT (mineur / RGPD).

## P3 — `GAUGE_ENABLED` / `GAUGE_MULTIPLIER` hardcodés (kill-switch non piloté par env)

**Fichier** : `src/lib/utils/constants.ts:17-18` (`GAUGE_ENABLED = true`, `GAUGE_MULTIPLIER = 2`)
**Impact** : la jauge (feature à fort enjeu **juridique** — la mémoire `cleekzy-gauge-pivot` note que
le ×2 « casse le garde-fou » et que le multiplicateur doit rester ajustable pour repasser à ×1) est
pilotée par des constantes en dur, pas par une variable d'environnement. En cas d'alerte juridique,
désactiver ou repasser à ×1 nécessite un **commit + redéploiement** au lieu d'un toggle env instantané.
Pour une feature aussi sensible sur de l'argent réel, un kill-switch runtime serait prudent. Déjà
relevé `AUDIT-2026-06-17.md:119`.
**Preuve** : `constants.ts:17-18` valeurs littérales ; aucun `process.env.GAUGE_*` lu.
**Correctif** : `GAUGE_ENABLED = process.env.GAUGE_ENABLED === 'true'` et
`GAUGE_MULTIPLIER = Number(process.env.GAUGE_MULTIPLIER ?? 1)` (défaut conservateur), documentés dans
`.env.example`. Permet un kill instantané via Vercel sans redeploy de code.
**Statut** : OUVERT (résilience produit/juridique).

## P3 — `db:types` script expose le project-id Supabase dans `package.json` ; pas de `maxDuration` sur les crons

**Fichier** : `package.json` (`db:types` : `--project-id wloyztidhbgumtdirdya`) ; routes cron (aucun
`export const maxDuration`)
**Impact** : (a) le project-id Supabase est en clair dans `package.json` commité — non secret en soi
(il est déjà dans `NEXT_PUBLIC_SUPABASE_URL`), mais c'est une fuite mineure d'identifiant d'infra.
(b) Aucune route cron ne déclare `maxDuration` : `bot-clicks` itère sur toutes les parties actives +
fait des appels Supabase + emails/push séquencés ; sur le plan Vercel Hobby le timeout par défaut est
court (~10 s) — si le nombre de parties grossit, `bot-clicks` peut **timeout en plein traitement**
(parties partiellement animées, `endGame` non atteint pour les dernières). Pas de finding actif mais
un risque de scalabilité non borné explicitement.
**Preuve** : `package.json` `db:types` ; `grep maxDuration src/app` = 0.
**Correctif** : (a) acceptable de laisser le project-id (déjà public via l'URL) ; (b) ajouter
`export const maxDuration = 60` (et `dynamic = 'force-dynamic'`) aux routes cron lourdes, en cohérence
avec le plan Vercel choisi, et borner le nombre de parties traitées par tick si nécessaire.
**Statut** : OUVERT (mineur / scalabilité).

## P3 — `next.config.ts` images : `remotePatterns` larges (`*.apple.com`, `*.unsplash.com`, picsum, pexels)

**Fichier** : `next.config.ts:20-62`
**Impact** : le composant `next/image` autorise l'optimisation d'images depuis de nombreux domaines
wildcard (`*.apple.com`, `*.unsplash.com`, `*.secretlab.*`, `picsum.photos`, `images.pexels.com`).
`next/image` proxifie ces URLs via `/_next/image` — des domaines trop larges = surface d'**SSRF/abus
de bande passante** (un attaquant peut faire optimiser/servir des images arbitraires depuis ces hôtes,
voire via open-redirect sur un sous-domaine wildcard). Pour un site argent réel en prod, les images
produit devraient idéalement venir uniquement du storage Supabase (`*.supabase.co`, déjà listé).
picsum/pexels/unsplash sentent le placeholder de dev resté en prod.
**Preuve** : `next.config.ts:30-49` (picsum/pexels/unsplash/`*.apple.com`).
**Correctif** : restreindre aux domaines réellement servis en prod (Supabase storage + éventuellement
le CDN Apple précis pour les visuels produit), retirer picsum/pexels/unsplash et les wildcards larges,
ou ajouter `pathname` restrictif. Réduit la surface SSRF + le coût d'optimisation.
**Statut** : OUVERT (durcissement).

---

## Annexe — Inventaire env (cross-check)

**Vars lues par le code (`process.env`, hors `NODE_ENV`/`NEXT_RUNTIME`) — 19** :
`ADMIN_ALERT_EMAIL`, `CRON_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_UMAMI_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_REST_URL`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

- **`.env.example` vs code** : ✅ 0 var manquante, ✅ 0 var stale (parité parfaite).
- **`.env.local` (keys) vs `.env.example`** : ✅ aucune clé hors-référentiel.
- **`.env.local` MANQUE (vs code)** : `STRIPE_*`, `UPSTASH_*`, `RESEND_FROM_EMAIL`, `ADMIN_ALERT_EMAIL`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SENTRY_DSN` → en dev local : Stripe, Redis et les
  alertes admin ne sont **pas** configurés (rate-limit in-memory, paiement KO en local). Cohérent avec
  un poste de dev, mais à ne PAS reprendre tel quel pour un déploiement (voir P2 Redis, P3 envValidation).
- **Fuite `NEXT_PUBLIC_`** : ✅ aucune (0 `NEXT_PUBLIC_*SECRET/SERVICE/PRIVATE/TOKEN`).

## Annexe — Headers de sécurité (`next.config.ts:64-101`) : ✅ bons
HSTS (2 ans + preload + includeSubDomains), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options:
nosniff`, `Referrer-Policy`, `Permissions-Policy` (camera/mic/geo off), `poweredByHeader: false`. CSP
posé par requête dans le middleware (`src/proxy.ts`) avec nonce (commenté `next.config.ts:65-67`) —
non re-déclaré ici (correct, évite l'intersection de deux CSP).
