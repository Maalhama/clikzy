# Spec — Passe d'Arène (battle pass mensuel Cleekzy)

> Statut : SPEC à valider par Mehdi avant implémentation (touche Stripe + économie).

## Concept
Une piste de récompenses mensuelle adossée au calendrier existant (`calendar_claims`)
et à l'XP. Deux pistes parallèles :
- **Gratuite** : ce que le calendrier donne déjà (coffres samedi, XP, 1-2 crédits).
- **Premium (4,99 €/mois, non récurrent)** : double piste débloquée rétroactivement
  pour le mois en cours.

## Récompenses premium (proposition, cohérente avec « les crédits s'achètent »)
| Palier (jours réclamés) | Gratuit (existant) | Premium |
|---|---|---|
| 5 jours | — | coffre rare |
| 10 jours | — | 25 crédits |
| 15 jours | — | coffre épique |
| 20 jours | — | item cosmétique exclusif du mois (slot artefact, `bonus_kind: cosmetic`) |
| 25 jours | — | coffre légendaire |
| Tous les samedis | coffre du rang | coffre du rang **+1** |

## Modèle de données
- `battle_passes(user_id, month date, purchased_at, stripe_payment_intent)` PK (user_id, month)
- réutilise `calendar_claims` pour compter les jours réclamés du mois
- RPC `claim_pass_tier(p_user_id, p_tier)` DEFINER : vérifie achat + jours >= palier + non réclamé
- `pass_tier_claims(user_id, month, tier)` PK

## Stripe
- Nouveau produit one-shot « Passe d'Arène — {mois} » 4,99 €
- Webhook : `checkout.session.completed` → INSERT battle_passes (idempotent via stripe_events existant)

## UI
- Le modal calendrier devient l'écran du passe : rail vertical des paliers à droite,
  badge « PREMIUM » + CTA d'achat si non possédé
- Compteur « X/25 jours réclamés ce mois »

## Garde-fous
- Aucune récompense n'augmente les chances de gagner un lot (contrainte absolue)
- Crédits premium plafonnés à 25/mois (≈ la moitié du petit pack — n'érode pas la boutique)
- Items cosmétiques exclusifs = vraie valeur sans toucher l'économie
