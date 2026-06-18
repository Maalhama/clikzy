# Audit 2026-06-18 — Intégrité du chemin argent (paiement / économie / jauge / clawback)

Périmètre : webhook Stripe, octroi de valeur, jauge, clawback (remboursement/chargeback), buy-it-now, codes cadeau, soldes.
Méthode : relecture adversariale du code + migrations SQL, vérification que les correctifs de `AUDIT-2026-06-17.md` bouchent réellement les trous (faux positifs #103 v_cost / #104 atomicité jauge NON re-signalés tels quels).

## Synthèse

Le socle est solide : signature Stripe vérifiée, idempotence à double détente (`stripe_events` PK + ledgers `credit_grant_sessions`/`pack_purchases`/`gift_codes.stripe_session`/`buy_it_now_purchases (user,game)`), RPC monétaires toutes `service_role`-only, x2 et clawback cost-basis bien appliqués, double-mint d'abandon de jauge réellement fermé (`120004`→`120007`), IDOR buy-it-now gardé. La majorité des findings restants concernent des **lots PHYSIQUES non révoqués au remboursement** (item gratuit + argent rendu) et des cas non couverts par le clawback (pass, buy-it-now). Ce sont des pertes d'argent réelles pour Cleekzy, exploitables, même si certaines sont atténuées par le fulfillment manuel.

---

### [P0] Remboursement/chargeback d'un pack ne révoque PAS l'item physique gagné via la jauge (item gratuit + argent rendu)

- **Fichier** : `src/app/api/stripe/webhook/route.ts:444-557` (handler `charge.refunded` / `charge.dispute.created`) ; `supabase/migrations/20260617120000_clawback_cost_basis.sql` (`clawback_pack_credits`) ; `supabase/migrations/20260616120003_gauge_cash_basis.sql:119-128` (écriture `gauge_wins`) ; `supabase/migrations/20260616120005_gauge_wins_fulfillment.sql`.
- **Impact** : perte de marchandise physique pour Cleekzy. La jauge se complète parce que l'utilisateur a « payé 2× la valeur » via un pack. Le clawback reprend `earned_credits` + `purchased_value_cents`, mais la ligne `gauge_wins` (item dû, `shipping_status='pending'`) reste intacte et part en livraison via l'onglet admin Jauge. Résultat : item physique reçu **gratuitement** + remboursement intégral du pack.
- **Preuve/repro** :
  1. Acheter un pack (`amount_total` stampé sur `credit_grant_sessions`, `purchased_value_cents += amount_total`).
  2. Cliquer jusqu'à compléter la jauge d'un item → `increment_item_gauge` insère `gauge_wins(user, item, paid_credits=target)`.
  3. Demander un remboursement (ou chargeback) du pack → `clawback_pack_credits` met `earned_credits` et `purchased_value_cents` à 0/réduits, mais **aucune** requête ne touche `gauge_wins`. `grep gauge_wins` dans les migrations clawback = 0 résultat.
  4. L'admin expédie l'item `pending`.
- **Correctif** : au clawback d'une session pack, marquer les `gauge_wins` financés par ce paiement (ou tous ceux postérieurs au grant non encore `shipped`) en `shipping_status='clawed_back'`/`cancelled` et bloquer leur fulfillment ; alerter l'admin. À défaut d'attribution session→win précise, geler tout `gauge_wins` non expédié de l'utilisateur lors d'un remboursement/chargeback et statuer manuellement.
- **Statut** : OUVERT (atténué : GAUGE_ENABLED non encore mergé en prod main ; mais la jauge est la feature phare en cours de ship, et le fulfillment manuel + fenêtre chargeback ~90 j laissent le temps d'expédier avant le litige).

---

### [P0] Remboursement/chargeback d'un achat « Rachat malin » (buy-it-now) ne l'annule pas → item physique gratuit + argent rendu

- **Fichier** : `src/app/api/stripe/webhook/route.ts:444-557` ; `supabase/migrations/20260614150001_buy_it_now.sql` + `20260615250001_buy_it_now_dup_refund.sql` (`buy_it_now_purchases`, aucune RPC de clawback).
- **Impact** : perte de marchandise physique. Le buy-it-now est un **lot physique** acheté à prix réduit. Sur `charge.refunded`/`dispute`, le handler tente `clawback_gift_code` (→ `not_a_gift`) puis `clawback_pack_credits` (→ `session_not_found`, car les sessions BIN ne sont jamais insérées dans `credit_grant_sessions`). Rien ne touche `buy_it_now_purchases` : la ligne reste `shipping_status='pending'` et l'item part en livraison. L'utilisateur garde l'objet et récupère son argent.
- **Preuve/repro** :
  1. Perdre une enchère, racheter l'item via buy-it-now (`record_buy_it_now` insère `buy_it_now_purchases`).
  2. Refund/chargeback de la charge → handler : `clawback_gift_code`=`not_a_gift`, `clawback_pack_credits`=`session_not_found` (`return ok:false, reason:'session_not_found'`), aucune écriture sur `buy_it_now_purchases`.
  3. L'admin expédie l'item `pending`.
- **Correctif** : ajouter une branche de clawback BIN dans le handler refund/dispute : si la session correspond à un `buy_it_now_purchases.stripe_session`, passer `shipping_status` en `cancelled`/`clawed_back` (idempotent) si non encore expédié, sinon alerte admin. Ordre suggéré : gift → buy-it-now → pack.
- **Statut** : OUVERT.

---

### [P1] Remboursement/chargeback de la Passe d'Arène (battle pass) : aucun retrait des avantages

- **Fichier** : `src/app/api/stripe/webhook/route.ts:114-132` (octroi) et `:444-557` (refund) ; `supabase/migrations/20260611010001_battle_pass.sql` (`grant_battle_pass`, `claim_pass_tier`).
- **Impact** : valeur conservée + argent rendu. Une passe remboursée/contestée laisse `battle_passes(user,month)` actif → l'utilisateur continue de réclamer les paliers (`claim_pass_tier` : crédits permanents, coffres légendaires, artefact épique/légendaire en inventaire). Le handler refund ne reconnaît pas la session pass (`clawback_pack_credits` → `session_not_found`), donc aucun retrait. `grep battle_passes` dans les clawback = 0 résultat.
- **Preuve/repro** : acheter la passe (4,99 €), réclamer paliers 10/20 (25 crédits + artefact), chargeback → passe et récompenses conservées.
- **Correctif** : sur refund/dispute, si la session est un `battle_passes.stripe_session`, supprimer/invalider la passe du mois et idéalement reprendre les récompenses déjà claim (au minimum désactiver les futurs claims + alerte admin). Coût modeste (one-shot 4,99 €) mais récompenses à forte valeur perçue.
- **Statut** : OUVERT.

---

### [P1] `redeem_gift_code` : aucune garde d'auto-exclusion ni rate-limit sur la réclamation (jeu responsable + brute-force)

- **Fichier** : `src/actions/gift.ts:136-153` (`redeemGift`) ; à comparer aux autres actions monétaires qui appellent `selfExcludedUntil` (`stripe.ts:31`, `buyItNow.ts:83`, `gift.ts:23` côté achat).
- **Impact** : (a) un joueur **auto-exclu** (jeu responsable) peut quand même créditer son compte (crédits/VIP) en réclamant un code → contourne la mesure de protection, risque de conformité. (b) Seul `getGiftInfo` (lookup) est rate-limité (30/min) ; `redeemGift` ne l'est pas → tentatives de réclamation brute-force de codes valides à débit illimité (espace de codes = 30^10, large, mais aucune barrière côté redeem).
- **Preuve/repro** : s'auto-exclure via `/jeu-responsable`, puis `redeemGift(code)` → crédite `earned_credits`/VIP sans blocage (aucun appel `selfExcludedUntil` dans `redeemGift`).
- **Correctif** : ajouter `selfExcludedUntil` en tête de `redeemGift` (refuser si exclu) et un `checkRateLimit` par user/IP sur la réclamation comme sur le lookup.
- **Statut** : OUVERT.

---

### [P1] Cadeau VIP déjà réclamé puis remboursé : jours VIP NON repris (alerte manuelle seulement)

- **Fichier** : `supabase/migrations/20260617120001_clawback_gift_codes.sql:93-95` (`clawback_gift_code`, branche `kind='vip'` déjà réclamé) ; webhook `route.ts:526-532` (`vip_manual` → email admin).
- **Impact** : valeur conservée + argent rendu. Pour un cadeau **crédits**, le clawback reprend `earned_credits` chez le destinataire ; pour un cadeau **VIP déjà réclamé**, il se contente de stamper `clawed_back_at` et d'alerter l'admin — les jours VIP (et `is_vip=true`, remises -10 %, 20 cr/jour, lots premium) restent acquis jusqu'à expiration naturelle. La reprise « ambiguë » est compréhensible mais reste un trou exploitable (offrir un VIP à un complice, le faire réclamer, puis chargeback).
- **Preuve/repro** : acheter un cadeau VIP, le faire réclamer par un compte ami (`redeem_gift_code` kind=vip → `vip_expires_at += 30j`), chargeback → seul `clawed_back_at` posé, `vip_manual:true`, VIP du destinataire intact jusqu'à J+30.
- **Correctif** : réduire `vip_expires_at` du destinataire de `g.vip_days` (borné à `now()`) et repasser `is_vip=false` si l'expiration retombe dans le passé, dans la branche VIP de `clawback_gift_code` — plutôt que de tout déléguer au manuel.
- **Statut** : OUVERT (partiellement traité : détection + alerte OK, exécution manuelle).

---

### [P2] `add_purchased_value` (cost-basis jauge) hors transaction de `grant_pack_credits` : crédit accordé sans cost-basis si l'appel échoue

- **Fichier** : `src/app/api/stripe/webhook/route.ts:257-269` (try/catch « best-effort », non-bloquant) ; `supabase/migrations/20260617120000_clawback_cost_basis.sql:23-45`.
- **Impact** : faible et **en faveur de Cleekzy** (pas une perte) — si `add_purchased_value` échoue après un `grant_pack_credits` réussi, l'utilisateur a ses crédits mais `purchased_value_cents`/`credit_grant_sessions.amount_cents` ne sont pas stampés. Conséquence : (a) jauge n'avance pas pour ces crédits (l'utilisateur a payé mais sa jauge ignore ce cash), (b) au clawback, `amount_cents=0` → seul `earned_credits` repris. Asymétrie au détriment du joueur, pas de gain frauduleux. Signalé pour cohérence : le cost-basis devrait être posé dans la même transaction que le grant (idéalement `grant_pack_credits` reçoit `p_amount_cents` et stampe tout atomiquement).
- **Preuve/repro** : simuler une erreur réseau sur le 2e RPC ; le 1er a déjà commité (deux `supabase.rpc` séparés, pas de transaction commune).
- **Correctif** : passer `amount_cents` à `grant_pack_credits` et y faire le stamp + l'incrément `purchased_value_cents` dans la même fonction (une transaction), supprimer l'appel séparé `add_purchased_value` côté webhook.
- **Statut** : OUVERT (non urgent — sens de l'asymétrie protège Cleekzy).

---

### [P2] Événements de remboursement/litige et de paiement échoué non documentés dans la config Stripe attendue

- **Fichier** : `docs/STRIPE_TESTING.md:33-39` (liste des events à activer) vs `src/app/api/stripe/webhook/route.ts:407,444` (handlers `invoice.payment_failed`, `checkout.session.async_payment_failed`, `charge.refunded`, `charge.dispute.created`).
- **Impact** : tout l'anti-fraude clawback (P0/P1 ci-dessus) et les relances de paiement échoué **ne se déclenchent que si ces events sont abonnés dans le dashboard Stripe**. La doc ne liste que `checkout.session.completed` + les 3 `customer.subscription.*`. Si `charge.refunded`/`charge.dispute.created` ne sont pas abonnés en prod, AUCUN clawback ne tourne → remboursement = crédits/cost-basis conservés (la faille que tout ce code est censé fermer).
- **Preuve/repro** : vérifier le endpoint webhook Stripe en prod ; si la liste d'events ne contient pas `charge.refunded`, `charge.dispute.created`, `invoice.payment_failed`, `checkout.session.async_payment_failed`, le clawback est mort-code en prod.
- **Correctif** : Action Mehdi — abonner explicitement ces 4 events sur l'endpoint Stripe + mettre à jour `STRIPE_TESTING.md`. Vérifiable via `stripe webhook_endpoints retrieve`.
- **Statut** : OUVERT (action infra/Mehdi, code prêt).

---

### [P3] `get_gift_code` n'expose pas l'état `voided` (incohérence d'affichage, pas d'exploit)

- **Fichier** : `supabase/migrations/20260615120001_gift_codes.sql:35-53` (`get_gift_code` renvoie `redeemed`/`expired` mais pas `voided_at`) ; la colonne `voided_at` est ajoutée par `20260617120001_clawback_gift_codes.sql:15-17`.
- **Impact** : cosmétique. Un code invalidé par clawback (`voided_at`) s'affiche encore comme valide sur la page de réclamation ; la réclamation échoue ensuite proprement (`redeem_gift_code` vérifie bien `voided_at:32` → `error:'voided'`). Pas de gain de valeur, juste une UX trompeuse.
- **Preuve/repro** : voider un code (refund d'un cadeau non réclamé), appeler `getGiftInfo` → `redeemed:false, expired:false`, l'UI propose de réclamer, puis refus.
- **Correctif** : ajouter `'voided', g.voided_at IS NOT NULL` au JSON de `get_gift_code` et l'afficher.
- **Statut** : OUVERT (mineur).

---

### [P3] TOCTOU bénin : `usedEarnedCredit` calculé sur un solde lu hors verrou (la jauge peut rater/déclencher un increment cash no-op)

- **Fichier** : `src/actions/game.ts:66-79,157-191`.
- **Impact** : aucune perte d'argent. `usedEarnedCredit = (profile.credits ?? 0) < 1` est calculé à partir d'un `SELECT` antérieur à `perform_click` (qui, lui, décrémente atomiquement daily puis earned sous `FOR UPDATE`). En cas de clics concurrents, la décision « a-t-on dépensé un earned ? » côté app peut diverger de la réalité de `perform_click`. Comme `increment_item_gauge` (version cash) ne fait avancer la jauge **que si `purchased_value_cents>0`** et borne `v_cost = LEAST(v_value, …)`, une décision erronée donne au pire un increment no-op ou un increment manqué — jamais de double drain ni de cash inventé. C'est l'angle déjà classé faux positif #104 ; confirmé non exploitable financièrement, mais l'app pourrait afficher une progression de jauge incohérente.
- **Preuve/repro** : deux `clickGame` concurrents avec `credits=1, earned=5` ; les deux lisent `credits=1` → les deux calculent `usedEarnedCredit=false` alors qu'un seul a consommé le daily. Le 2e n'incrémente pas la jauge bien qu'il ait dépensé un earned.
- **Correctif** : faire retourner par `perform_click` l'info « earned dépensé » (booléen) et baser l'appel `increment_item_gauge` dessus, plutôt que sur un read pré-clic. Ou intégrer l'increment dans `perform_click`.
- **Statut** : OUVERT (cohérent avec la classification faux-positif #104 ; sans impact argent, à corriger pour la fiabilité d'affichage).

---

## Vérifications adversariales PASSÉES (trous confirmés bouchés — ne pas re-signaler)

- **Signature webhook** : `constructEvent` avec `STRIPE_WEBHOOK_SECRET`, rejet 400 sans signature, 500 si secret absent (`route.ts:45-63`). OK.
- **Idempotence webhook** : claim `stripe_events(id PK)` AVANT traitement, `23505` → ack idempotent ; relâche sur échec (`status>=400`) pour autoriser le retry (`route.ts:65-103`). Défense en profondeur additionnelle : ledgers par session (`credit_grant_sessions`, `pack_purchases`, `gift_codes.stripe_session UNIQUE`, `buy_it_now_purchases(user,game)`). Double-crédit par rejeu **fermé** des deux côtés.
- **Octroi exactement une fois** : `grant_pack_credits` est l'autorité (insert `credit_grant_sessions ON CONFLICT DO NOTHING` → `already_processed`), x2 atomique via `pack_purchases ON CONFLICT (user,month,pack)`. Replay = succès silencieux sans re-crédit ni remboursement (`route.ts:229-232`, testé). OK.
- **Métadonnées non falsifiables** : metadata posée server-side dans les server actions (`stripe.ts`, `gift.ts`, `buyItNow.ts`), relue via event signé. `credits<=0` / `userId` manquant → 400 (`route.ts:200`). Aucun endpoint ne laisse le client poser credits/packId/price arbitraires. OK.
- **Prix buy-it-now anti-tampering** : recalculé server-side par `quote_buy_it_now` (DEFINER), le client n'envoie que `gameId` ; `unit_amount` Stripe = quote (`buyItNow.ts:87-119`). OK.
- **IDOR buy-it-now** : `get_buy_it_now_offers`/`quote_buy_it_now` gardés par `auth.uid() IS NULL OR p_user_id = auth.uid()` (`20260617120002`). OK.
- **Double-paiement buy-it-now** (2 sessions, même item) : `record_buy_it_now` renvoie `ok:false, duplicate_purchase` sur conflit `(user,game)` → remboursement auto (`20260615250001`, `route.ts:157-172`). OK.
- **Double-mint jauge abandonnée** : `convert_abandoned_gauges` ne restitue QUE des crédits d'avoir, NE restaure PLUS le cost-basis (`120004`→`120007`) → crédits d'avoir non recyclables (cost-basis nul → jauge n'avance pas). Recyclage infini **fermé**. OK.
- **x2 jauge contournable à x1 ?** : `v_multiplier:=2` hardcodé dans `increment_item_gauge` SQL (DEFINER, non paramétrable par l'appelant) ; le client ne fournit ni multiplicateur ni target ; `getItemGauge` (affichage) recalcule la cible mais n'écrit rien. Non contournable côté client. OK (le levier x1/x2 reste un choix interne, pas une faille technique).
- **perform_click non appelable en direct** : `REVOKE … FROM authenticated` (`120006`), appel via `service_role` après `checkClickFraud`/auto-exclusion/rate-limit. OK.
- **Solde négatif** : `perform_click` vérifie `(daily+earned)>=1` sous verrou ; `deduct_credits` vérifie `>= p_amount` et refuse `p_amount<0` ; clawback borné `greatest(0, …)`. Pas de solde négatif. OK.
- **Chargeback VIP** : `charge.refunded`/`dispute` remonte l'invoice → metadata sub → `is_vip=false` + `subscriptions.cancel` (`route.ts:466-503`, testé #101). OK.
- **Remboursement partiel** : détecté (`amount_refunded < amount`) → pas de reprise auto, alerte admin manuelle (`route.ts:457-464`). OK (choix prudent).
- **VIP en défaut de paiement** : `subscription.updated` statut non-actif → `is_vip=false` immédiat ; filet `reset-credits` cron désactive les `vip_expires_at < now()` même si le webhook est manqué. OK.

## Compteur

- P0 : 2
- P1 : 3
- P2 : 2
- P3 : 2
- Total findings ouverts : 9 (+ ~16 vérifications adversariales passées)
