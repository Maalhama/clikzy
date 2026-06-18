# Audit conformité légale & réglementaire — Cleekzy

**Date** : 2026-06-18
**Périmètre** : Conformité légale & réglementaire (jeu d'argent FR/ANJ, protection des mineurs, jeu responsable, RGPD, CGU/CGV, transparence des chances)
**Branche** : `main` (commit `3e22f4f`)
**Avertissement** : Je ne suis pas avocat. Les éléments ci-dessous sont des **risques juridiques étayés**, pas des avis de droit. Les expositions P0/P1 doivent être validées par un conseil spécialisé (jeux d'argent FR) **avant tout lancement public en argent réel**.

---

## Synthèse exécutive

Cleekzy fait payer de l'argent réel (crédits Stripe) pour cliquer dans une « enchère au dernier clic » dont l'issue est aléatoire du point de vue de l'utilisateur, **où la plupart des participants perdent leurs crédits sans rien obtenir**, et où l'opérateur **injecte lui-même des bots qui participent et peuvent influencer l'issue** d'enchères en argent réel. À cela s'ajoute une **« jauge » LIVE en production** (gauge `GAUGE_ENABLED=true`, `GAUGE_MULTIPLIER=2`, alimentée par le webhook Stripe via `add_purchased_value`) qui exige de dépenser **2× la valeur de l'item** pour l'obtenir « garanti ».

La page CGU affirme noir sur blanc « **CLEEKZY n'est pas un jeu de hasard** » — affirmation que je considère **juridiquement fragile à dangereuse** au regard du modèle réel (penny-auction + bots + espérance de gain fortement négative). Le risque de fond (qualification de jeu d'argent/loterie soumis à agrément ANJ, voire loterie prohibée art. L322-1 et s. Code de la sécurité intérieure) est **le risque dominant du projet** et doit être tranché par un avocat avant lancement.

Côté **conformité « hygiène »**, le travail déjà fait est sérieux et au-dessus de la moyenne d'un MVP : auto-exclusion fail-closed appliquée sur quasiment toutes les actions payantes, export RGPD complet (jauge incluse), suppression/anonymisation codée, consentement cookies réel pour Umami, Sentry en mode erreurs-seules. Il reste des trous précis (voir P1/P2).

### Compte par sévérité
- **P0** : 4
- **P1** : 6
- **P2** : 6
- **P3** : 4

### Top 5 (une ligne chacun)
1. **[P0]** Modèle de fond (penny-auction argent réel + jauge ×2 garantie) probablement qualifiable de jeu d'argent/loterie soumis à agrément ANJ — risque de fermeture/sanction pénale.
2. **[P0]** Bots opérés par Cleekzy participent aux enchères en argent réel et peuvent en influencer l'issue, non divulgué dans les CGU (qui ne les interdisent qu'aux joueurs) — pratique commerciale trompeuse.
3. **[P0]** CGU affirment « CLEEKZY n'est pas un jeu de hasard » et « pas d'algorithme aléatoire » — déclaration contredite par le modèle réel, aggrave le risque de tromperie et de requalification.
4. **[P0]** Vérification d'âge purement cosmétique : la case 18+ est cliquée côté client mais `signUp` ne l'exige pas côté serveur (contournable) ; aucun contrôle d'âge au paiement.
5. **[P1]** `redeemGift` (réclamation de code cadeau crédits/VIP) n'a aucun garde d'auto-exclusion, contrairement à toutes les autres actions — un joueur en pause peut recréditer son compte.

---

## P0 — Exposition pouvant entraîner sanction / fermeture

### [P0] Le modèle (penny-auction argent réel + jauge ×2) est probablement un jeu d'argent/loterie soumis à agrément ANJ
- **Fichier** : `src/app/(legal)/terms/page.tsx:57-66` (description du jeu) ; `src/lib/utils/constants.ts:17-18` (`GAUGE_ENABLED=true`, `GAUGE_MULTIPLIER=2`) ; `src/actions/game.ts:33-44, 150-200` ; webhook `src/app/api/stripe/webhook/route.ts:257-266`.
- **Risque juridique** : En droit français, un jeu d'argent suppose (1) une **mise** financière, (2) l'**espérance d'un gain**, (3) l'intervention du **hasard** (même partielle). Une loterie prohibée (art. L322-1 et s. Code de la sécurité intérieure) ajoute l'**offre au public** + l'espérance d'un gain par le hasard. Ici : la mise = les crédits achetés en argent réel ; le gain = un lot de valeur ; le hasard = du point de vue de l'utilisateur, l'issue dépend du comportement non observable des autres participants **et de bots opérés par l'opérateur**, ce qui s'apparente à un aléa subi. Les penny-auctions « bid-fee » ont déjà été analysées à l'étranger comme du jeu d'argent (gambling) selon les juridictions. Le slogan « jeu d'adresse et de timing » ne neutralise pas l'aléa : un juge regarde la **réalité économique**, pas la qualification choisie par l'éditeur. **L'absence d'agrément ANJ pour une activité requalifiée = exploitation illégale de jeux d'argent (sanctions pénales : amendes, voire emprisonnement ; fermeture ; blocage par l'ANJ).**
- **La jauge ×2 aggrave** : payer un montant fixe (2× la valeur) pour obtenir un bien physique « garanti » est plus proche d'une vente à prime / d'un mécanisme de fidélité payant que d'un jeu — mais combinée au reste, elle peut être vue comme un dispositif incitant à continuer à dépenser (chasing) et brouille encore la frontière. Le commentaire de code lui-même qualifie le ×2 de « **LEVIER JURIDIQUE** » (`src/lib/utils/constants.ts:14`), preuve que l'équipe a conscience de la sensibilité.
- **Preuve** : `terms/page.tsx:65` « CLEEKZY n'est pas un jeu de hasard. Il n'y a pas de tirage au sort ni d'algorithme aléatoire. » à mettre en regard de l'injection de bots (`src/app/api/cron/bot-clicks/route.ts`) et de l'espérance de gain négative (`comment-ca-marche/page.tsx:39-40` « consomme tes crédits, que tu gagnes ou non… comme repartir sans rien »).
- **Recommandation** : **AVANT tout lancement payant public**, obtenir un avis écrit d'un avocat spécialisé jeux d'argent (FR/UE) sur la qualification ANJ/loterie. Si requalification probable : soit demande d'agrément (lourd, réservé à des catégories définies), soit refonte du modèle (supprimer la mise réelle, ou la composante aléatoire, ou l'offre au public). Documenter la décision (registre des risques). Ne pas se reposer sur la seule formule « jeu d'adresse » dans les CGU.
- **Statut** : OUVERT — risque business P0 structurant. (La mémoire `cleekzy-gauge-pivot` note déjà « juridique à valider après, garde-fou cassé » : confirmé ici, le ×2 est live.)

### [P0] Bots opérés par l'opérateur influencent des enchères en argent réel sans divulgation honnête dans les CGU
- **Fichier** : `src/app/api/cron/bot-clicks/route.ts:267,335-419` (clics bots, `is_bot`, désignation du gagnant) ; CGU `src/app/(legal)/terms/page.tsx:97-102` (interdiction des bots **aux joueurs uniquement**).
- **Risque juridique** : Pratique commerciale trompeuse (art. L121-2 à L121-4 Code de la consommation) et potentiellement déloyale. Les CGU interdisent aux utilisateurs « Ne pas utiliser de bots, scripts ou outils automatisés » (`terms:98`) **sans jamais divulguer que l'opérateur, lui, injecte des bots** qui participent et peuvent prolonger le timer / occuper la position de dernier clic. Le joueur paie de l'argent réel en croyant affronter de vrais humains. Même si la page « Comment ça marche » mentionne des « participants animés par la plateforme » qui « n'empêchent jamais un joueur réel de remporter un lot » (`comment-ca-marche/page.tsx:78-83`), cette mention (a) est sur une autre page que les CGU, (b) **contredit** l'engagement implicite, (c) est minimisée. Si un bot peut relancer le timer et faire perdre des crédits à des joueurs réels (ce que fait `bot-clicks`), l'affirmation « n'empêche jamais un joueur réel de gagner » est au mieux ambiguë.
- **Preuve** : `bot-clicks/route.ts:382` `is_bot: isBot` inscrit dans `clicks` ; `:267` `is_bot: true` ; `endGame` peut désigner un bot gagnant (`out_is_bot`, `winners.is_bot`). La désignation du gagnant et les relances de timer sont réelles.
- **Recommandation** : (1) **Divulgation claire et loyale, au même niveau que les CGU**, du fait que la plateforme opère des participants automatisés, de leur rôle exact, et de l'impossibilité (ou non) pour un bot de remporter un lot mis en jeu réel. (2) Garantir et **prouver** par la mécanique que les bots ne peuvent jamais remporter un lot réel ni faire perdre des crédits à un joueur réel d'une manière non divulguée. (3) Faire valider la rédaction par un avocat (la divulgation de bots est aussi un point ANJ : intégrité des jeux). La mémoire `cleekzy-go-live-readiness` liste déjà « divulgation bots » comme action Mehdi — confirmé P0.
- **Statut** : OUVERT.

### [P0] Les CGU affirment faussement « CLEEKZY n'est pas un jeu de hasard » / « pas d'algorithme aléatoire »
- **Fichier** : `src/app/(legal)/terms/page.tsx:65`.
- **Risque juridique** : Cette affirmation catégorique est un **élément aggravant** pour les deux P0 précédents. Elle peut être lue comme une tentative de se soustraire à la qualification de jeu d'argent, et constitue une allégation potentiellement trompeuse si un régulateur/juge estime que l'aléa existe. Affirmer « pas d'algorithme aléatoire » est par ailleurs partiellement faux au regard des mini-jeux provably-fair (qui utilisent bien un aléa, `comment-ca-marche:67-76`) et de la dynamique d'enchère pilotée par des bots dont le comportement n'est pas prévisible par l'utilisateur.
- **Preuve** : contradiction interne entre `terms:65` et `comment-ca-marche:67-83`.
- **Recommandation** : Supprimer l'affirmation péremptoire. Ne pas auto-qualifier le service de « pas un jeu de hasard » dans un document contractuel : laisser la qualification à l'analyse juridique et adopter une rédaction neutre + mentions jeu responsable. Ne jamais nier l'aléa par écrit si le modèle en comporte.
- **Statut** : OUVERT.

### [P0] Vérification d'âge purement cosmétique (case client non vérifiée serveur, aucun contrôle au paiement)
- **Fichier** : `src/app/(auth)/register/page.tsx:40,62-63,107-108,248-258` (case `ageConfirmed` côté client) ; `src/actions/auth.ts:118-175` (`signUp` — **aucune** vérification d'âge) ; `src/actions/stripe.ts` (checkout — aucun contrôle d'âge).
- **Risque juridique** : Protection des mineurs. La case « Je certifie avoir 18 ans » n'est qu'un `useState` côté client : un appel direct à la server action `signUp` (ou OAuth) **crée le compte sans aucun contrôle serveur**. Aucune date de naissance n'est demandée, aucune vérification d'âge réelle. Pour une activité que l'ANJ pourrait qualifier de jeu d'argent, l'**interdiction effective aux mineurs** est une obligation centrale (art. L320-8 CSI pour les jeux régulés ; CNIL pour la collecte de données de mineurs). Une simple case déclarative est généralement jugée insuffisante pour un service à risque. Au paiement, Stripe ne vérifie pas l'âge.
- **Preuve** : `auth.ts:118-175` ne lit ni `ageConfirmed` ni date de naissance ; `register/page.tsx` envoie uniquement email/password/username au serveur (`handleSubmit` lignes ~73-79).
- **Recommandation** : (1) Au minimum, **collecter et valider la date de naissance côté serveur** (refus si < 18 ans) dans `signUp` et bloquer le 1er paiement tant que l'âge n'est pas confirmé. (2) Évaluer un contrôle d'âge renforcé (vérification documentaire/tiers) si requalification jeu d'argent. (3) Journaliser la confirmation d'âge (preuve). (4) Conserver la case côté client mais ne jamais s'y fier seule.
- **Statut** : OUVERT — la mémoire affirme « 18+ » fait, mais c'est déclaratif uniquement.

---

## P1 — Exposition sérieuse

### [P1] `redeemGift` n'a aucun garde d'auto-exclusion (recrédit possible pendant une pause jeu responsable)
- **Fichier** : `src/actions/gift.ts:136-153` (`redeemGift`) — comparer à `createGiftCheckout` (`gift.ts:23-24`) et à toutes les autres actions payantes qui appellent `selfExcludedUntil`.
- **Risque juridique** : Contournement de l'auto-exclusion (jeu responsable). Un joueur ayant demandé une pause (auto-exclusion) **ne peut pas se reconnecter** (`auth.ts:64-67`, `auth/callback`), donc l'exposition pratique est réduite — MAIS si la session reste valide (cookie déjà actif au moment de l'exclusion, ou réclamation via un device encore connecté) ou si l'exclusion est appliquée sans invalider toutes les sessions, `redeemGift` permet de **recréditer crédits/VIP** sans contrôle. Une auto-exclusion qui n'est pas étanche sur **tous** les leviers de (re)mise est un défaut de jeu responsable.
- **Preuve** : `redeem_gift_code` est appelé (`gift.ts:145`) sans `const excl = await selfExcludedUntil(...)` préalable. Toutes les autres actions sensibles (`game.ts:43`, `buyItNow.ts:83`, `collection.ts:103`, `miniGames.ts:108,217`, `stripe.ts:31,135,396`) ont ce garde.
- **Recommandation** : Ajouter le garde `selfExcludedUntil` en tête de `redeemGift` (refus pendant la pause). S'assurer aussi que `set_self_exclusion` **invalide toutes les sessions actives** de l'utilisateur (pas seulement la session courante via `signOut`).
- **Statut** : OUVERT (déjà noté par un autre agent ; confirmé et étendu).

### [P1] Aucune invalidation globale de session à l'auto-exclusion / aucune vérif d'exclusion sur les routes serveur protégées
- **Fichier** : `src/actions/privacy.ts:124` (`requestSelfExclusion` fait `supabase.auth.signOut()` = session **courante** seulement) ; middleware/routes `(main)` ne re-vérifient pas `selfExcludedUntil` au chargement de page.
- **Risque juridique** : Jeu responsable. L'auto-exclusion s'appuie sur le blocage à la (re)connexion (`auth.ts`, `auth/callback`) et sur les gardes par action. Mais si un device reste connecté (cookie de session non révoqué) au moment où l'exclusion est posée depuis un autre device, ce device peut continuer à naviguer ; les actions payantes sont protégées une par une (bien), mais toute action future **oubliée** (ex. `redeemGift`, future feature) rouvre une brèche. Le modèle « deny-list par action » est fragile par construction.
- **Preuve** : `requestSelfExclusion` ne révoque que la session locale ; pas de `signOut({ scope: 'global' })` ni de purge des refresh tokens côté admin.
- **Recommandation** : (1) À l'exclusion, révoquer **toutes** les sessions (`auth.admin.signOut(userId, 'global')` côté service role). (2) Centraliser le check d'exclusion dans le middleware `(main)` pour fail-closed par défaut au lieu d'une allow-list d'actions. (3) Test d'intégration dédié.
- **Statut** : OUVERT.

### [P1] Suppression de compte RGPD jamais testée (droit à l'effacement non vérifié)
- **Fichier** : `src/actions/privacy.ts:71-107` (`deleteMyAccount`) ; absence : aucun test (`grep` sur `src/__tests__` → 0 résultat pour `deleteMyAccount`/`exportMyData`/`requestSelfExclusion`).
- **Risque juridique** : RGPD art. 17. Le code anonymise `winners.username`, `games.last_click_username`/`last_click_user_id`, les PII de `profiles`, puis appelle `auth.admin.deleteUser`. C'est **bien conçu**, mais : (a) si la FK profil ne cascade pas, l'étape 2 anonymise mais ne supprime pas la ligne `profiles` ; (b) d'autres tables PII potentielles (`comments.content` peut contenir des données perso, `shipping_*` sur `winners`/`buy_it_now_purchases`/`gauge_wins`) **ne sont pas anonymisées** ici ; (c) **aucun test** ne prouve que la suppression aboutit réellement. La mémoire `cleekzy-go-live-readiness` liste « test deleteMyAccount » comme action Mehdi NON faite. Une suppression qui échoue silencieusement = violation du droit à l'effacement.
- **Preuve** : `privacy.ts:83-96` n'anonymise que `winners.username`, `games.last_click_*` et `profiles.*` ; `comments`, `gauge_wins.shipping_*` (si applicable), `buy_it_now_purchases` (adresses) non traités. Pas de test.
- **Recommandation** : (1) Écrire un test d'intégration `deleteMyAccount` (compte jetable → vérifier 0 PII résiduelle dans toutes les tables). (2) Étendre l'anonymisation aux `comments` (purge contenu) et à toute table portant des PII de livraison conservées au-delà du profil. (3) Documenter la base légale de conservation des lignes anonymisées (obligation comptable) dans la politique de confidentialité.
- **Statut** : OUVERT.

### [P1] Aucune limite de dépôt / de perte / de temps (outils de jeu responsable incomplets)
- **Fichier** : absent — `grep "limite de dépôt|deposit_limit|loss_limit|plafond|cooling"` → aucun dans `src/` (hors tests sans rapport). Seuls existent : auto-exclusion (`privacy.ts`), page `/jeu-responsable`, badge 18+.
- **Risque juridique** : Jeu responsable. Pour une activité à risque addictif et a fortiori si requalifiée en jeu d'argent, l'absence d'**outils de modération** (plafonds de dépôt journaliers/hebdo, auto-limitation, « reality check » de session, message de mise en garde au paiement) est un manquement. La page `/jeu-responsable` donne de bons conseils et le 09-74-75-13-13, mais ne fournit aucun **outil contraignant** autre que la pause totale (24h–90j).
- **Preuve** : pas de mécanisme de plafond ; pas de rappel de durée/dépense en cours de jeu (`grep` sur `src/app/(main)/game` pour `jeu responsable` → 0).
- **Recommandation** : Ajouter au minimum (1) un **plafond de dépôt** paramétrable par l'utilisateur, (2) un rappel « budget/temps » périodique en session, (3) un lien jeu responsable + message de modération **sur l'écran de paiement** (`/shop`/checkout). Prioriser avant lancement payant.
- **Statut** : OUVERT.

### [P1] Mentions légales incomplètes / probablement erronées (adresse partielle, statut, ARS, ANJ, RCS/TVA)
- **Fichier** : `src/app/(legal)/legal/page.tsx:18-35` ; `src/app/(legal)/privacy/page.tsx:26-31`.
- **Risque juridique** : Obligations LCEN (art. 6-III) & Code de commerce. L'adresse de l'éditeur est tronquée : « 32 boulevard Capdevila » **sans code postal ni ville** (légal:24, privacy:29) — mention légale incomplète. Le SIRET affiché « 841 307 408 » n'a que **9 chiffres** (= numéro SIREN, pas un SIRET à 14 chiffres) — incohérence à corriger. Statut « Auto-entrepreneur » : un micro-entrepreneur exploitant une activité potentiellement qualifiée de jeu d'argent peut être **hors champ** du régime (cf. P0 ANJ). Aucune mention d'un éventuel n° TVA, ni d'information ANJ/jeu responsable obligatoire si requalification.
- **Preuve** : `legal/page.tsx:24-25`, `privacy/page.tsx:29`.
- **Recommandation** : Compléter l'adresse (CP + ville), corriger SIRET (14 chiffres), vérifier l'adéquation du statut micro-entreprise à l'activité (avec l'avocat ANJ), ajouter TVA si applicable. Ces données sont publiques et indexées → exposition réputationnelle + manquement LCEN.
- **Statut** : OUVERT.

### [P1] Politique de confidentialité ne couvre pas tout le traitement réel (bots, jauge cash, conservation cadeaux/commentaires, durée de la jauge)
- **Fichier** : `src/app/(legal)/privacy/page.tsx` (la jauge est désormais citée :43, mais incomplet).
- **Risque juridique** : RGPD art. 13/14 (information). La politique a été mise à jour pour citer la jauge (:43), Umami/Sentry (:88-89), Stripe/Resend (:84-87) — bon point. Mais : (a) **aucune mention** du traitement lié aux participants automatisés (bots) si des données de jeu réelles s'y mélangent ; (b) la finalité de la jauge est décrite comme « obtention garantie d'un article » sans expliquer le coût (×2) ni la base légale du traitement financier associé ; (c) les `comments` (données potentiellement à caractère personnel publiées) et les `gift_codes` ne sont pas listés dans les catégories de données ni dans les durées de conservation ; (d) la date « 23 janvier 2026 » est antérieure à l'ajout de la jauge (juin 2026) → incohérence de versioning (la jauge a été ajoutée sans bumper la date).
- **Preuve** : `privacy/page.tsx:15` « Dernière mise à jour : 23 janvier 2026 » alors que `:43` décrit la jauge (feature de juin 2026).
- **Recommandation** : Mettre à jour la date, ajouter `comments`/`gift_codes` aux données + durées, décrire honnêtement le traitement des participants automatisés, et lier explicitement la base légale (exécution du contrat) au traitement financier de la jauge.
- **Statut** : PARTIEL (jauge citée mais incomplet).

---

## P2 — À corriger

### [P2] Footer du layout légal sans lien « Jeu responsable » ni « Comment ça marche », et wordmark « CLIKZY » (typo)
- **Fichier** : `src/app/(legal)/layout.tsx:23-25` (wordmark `CLIK`+`ZY` = « CLIKZY ») ; `:52-56` (footer légal : CGU/Confidentialité/Mentions/CGV uniquement).
- **Risque juridique** : Cohérence/accessibilité de l'information jeu responsable. Le footer applicatif (`AppFooter.tsx:20-33`) lie bien `/jeu-responsable`, `/comment-ca-marche` et affiche un badge 18+. Mais le **layout des pages légales** (indexées, souvent point d'entrée SEO) n'expose ni le jeu responsable ni le 18+, et affiche un wordmark erroné « CLIKZY » au lieu de « CLEEKZY ». Sur un service à risque, l'accès au jeu responsable doit être omniprésent.
- **Preuve** : `(legal)/layout.tsx:23-25, 52-56`.
- **Recommandation** : Corriger le wordmark (« CLEEKZY ») ; ajouter « Jeu responsable » + badge 18+ dans le footer légal. (Typo déjà relevée dans AUDIT-2026-06-17 ligne #228, non corrigée sur main.)
- **Statut** : OUVERT.

### [P2] Médiateur de la consommation non renseigné (obligation L612-1)
- **Fichier** : `src/lib/legal.ts:4` (`MEDIATEUR = null`) ; rendu CGV `src/app/(legal)/cgv/page.tsx:142-149` (fallback « communiqués sur simple demande »).
- **Risque juridique** : Art. L612-1 & L616-1 Code de la consommation : tout professionnel vendant à des consommateurs doit **adhérer à un médiateur** et communiquer ses coordonnées (nom + site) de façon visible et lisible. Le fallback actuel (« sur simple demande ») n'est pas conforme : les coordonnées doivent être affichées, pas fournies sur demande.
- **Preuve** : `legal.ts:4` `export const MEDIATEUR ... = null`.
- **Recommandation** : Adhérer à un médiateur de la consommation et renseigner `MEDIATEUR` (nom + URL). Bloquant pour la vente B2C conforme.
- **Statut** : OUVERT.

### [P2] Droit de rétractation : exclusion correctement rédigée mais consentement préalable non tracé
- **Fichier** : `src/app/(legal)/cgv/page.tsx:79-87` ; checkout `src/actions/stripe.ts`.
- **Risque juridique** : Art. L221-28 13° Code conso : l'exclusion du droit de rétractation pour contenu numérique exige le **consentement exprès préalable** du consommateur **ET** sa reconnaissance qu'il perd son droit de rétractation, **avant** l'exécution. La CGV le mentionne (bon), mais rien ne prouve que ce consentement est recueilli **au moment du paiement** (case dédiée sur l'écran d'achat). Sans cette case, l'exclusion peut être inopposable → droit de rétractation de 14 jours rétabli.
- **Preuve** : `cgv:84-85` renvoie à « en validant votre achat » mais aucune case explicite côté checkout (`grep` shop/checkout : aucune mention rétractation/budget).
- **Recommandation** : Ajouter sur l'écran de paiement une case explicite « Je demande l'exécution immédiate et renonce à mon droit de rétractation » (horodatée, journalisée).
- **Statut** : OUVERT.

### [P2] Transparence des chances / espérance de gain insuffisamment mise en avant (risque de pratique trompeuse douce)
- **Fichier** : `src/app/(legal)/comment-ca-marche/page.tsx:37-48` (présent) ; absent sur le hero/landing et sur les cartes de jeu.
- **Risque juridique** : Pratique commerciale trompeuse par omission (L121-3). La page « Comment ça marche » dit honnêtement « consomme tes crédits, que tu gagnes ou non… comme repartir sans rien » (:39-40) — **excellent**. Mais cette information n'apparaît **pas** sur le hero anonyme (qui montre la jauge ×2 « garanti » de façon attractive, `HeroLiveCard.tsx:304-306`) ni à proximité immédiate du bouton de clic. Le déséquilibre entre la mise en avant du « garanti » et la discrétion du « la plupart perdent » crée un risque de tromperie par omission.
- **Preuve** : `HeroLiveCard.tsx:227-231,304-306` (jauge « garanti » montrée à l'anon, jamais accompagnée de l'avertissement « la plupart perdent leurs crédits »).
- **Recommandation** : Afficher l'espérance de gain réelle / un avertissement « la plupart des participants ne remportent pas le lot et perdent leurs crédits » à proximité du gameplay et sous le hero. Aligner le discours marketing sur la page transparence.
- **Statut** : OUVERT.

### [P2] Contradiction de règle du jeu entre CGU/Comment-ça-marche et le code (relance du timer)
- **Fichier** : `src/app/(legal)/comment-ca-marche/page.tsx:31-34` (« repart à 1min30 ») ; AUDIT-2026-06-17 ligne #170 notait « remet le minuteur à zéro » contradictoire ; `src/actions/game.ts:106-109` (`TIMER_RESET_VALUE`).
- **Risque juridique** : Information contractuelle sur les règles du jeu. Les règles affichées doivent correspondre exactement au comportement réel (sinon pratique trompeuse / litige consommateur). L'audit précédent a relevé une formulation contradictoire ; vérifier que la version actuelle (`comment-ca-marche:31-34` « repart à 1min30 ») correspond bien à `GAME_CONSTANTS.TIMER_RESET_VALUE` et au seuil `FINAL_PHASE_THRESHOLD`.
- **Preuve** : à recroiser `comment-ca-marche:33` vs `game.ts:107-108`.
- **Recommandation** : Source unique de vérité pour la durée de relance (constante) référencée dans le texte, ou figer la valeur exacte et la tester.
- **Statut** : À VÉRIFIER.

### [P2] Cookie consent : pas de granularité, pas de re-consentement, cookie/Sentry chargés indépendamment du choix
- **Fichier** : `src/components/common/CookieConsent.tsx` ; `src/hooks/useCookieConsent.ts` ; `sentry.client.config.ts`.
- **Risque juridique** : CNIL/ePrivacy. Points positifs : Umami n'est chargé **qu'après** « Accepter » (`Analytics.tsx:20`), refus respecté, choix mémorisé. Faiblesses : (1) la bannière n'offre **pas de granularité** (un seul bouton Accepter/Refuser pour « cookies… analyser le trafic ») — acceptable car seul Umami est concerné, mais le texte « analyser le trafic du site » suppose un cookie analytique alors qu'Umami est cookieless ; (2) **pas de moyen de retirer le consentement** une fois donné depuis l'UI (il faut vider le localStorage) — la CNIL exige un retrait aussi simple que le don ; (3) **Sentry s'initialise au chargement** indépendamment du consentement (`sentry.client.config.ts`, enabled en prod) — justifié par « intérêt légitime, erreurs seules, pas de replay/PII », position **défendable mais contestable** : Sentry peut capter IP/URL ; le `sendDefaultPii` n'est pas explicitement mis à `false`.
- **Preuve** : `useCookieConsent.ts` ne propose pas de réouverture de bannière ; `sentry.client.config.ts:1-26` init inconditionnel en prod, pas de `sendDefaultPii: false`.
- **Recommandation** : (1) Ajouter un lien « Gérer mes cookies » (rouvrir la bannière) pour permettre le retrait. (2) Mettre `sendDefaultPii: false` explicitement dans Sentry. (3) Ajuster le texte (« mesure d'audience sans cookie pisteur »). (4) Documenter la base « intérêt légitime » de Sentry dans un registre.
- **Statut** : OUVERT (partiellement conforme).

---

## P3 — Mineur / hygiène

### [P3] Email de contact RGPD non unifié et registre des traitements absent
- **Fichier** : `privacy/page.tsx:30` (`contact@`), `:123,162` (`privacy@`) ; pas de registre art. 30 dans le repo.
- **Risque** : RGPD art. 30 (registre des activités de traitement) non matérialisé (attendu en interne, hors repo, mais à produire). Adresses de contact RGPD multiples (`privacy@` / `contact@`) — s'assurer que `privacy@cleekzy.com` est réellement opérationnel et monitoré (délai légal 1 mois pour répondre aux demandes de droits).
- **Recommandation** : Produire un registre des traitements (interne) ; confirmer que `privacy@` est relevé.
- **Statut** : OUVERT.

### [P3] Transferts hors UE mentionnés sans détailler le mécanisme par sous-traitant
- **Fichier** : `privacy/page.tsx:153-156`.
- **Risque** : RGPD chap. V. La politique mentionne « clauses contractuelles types ou décisions d'adéquation » de façon générique pour Stripe/Supabase/Vercel/Resend/Sentry (US). Acceptable en MVP, mais idéalement préciser le mécanisme par prestataire (DPF, SCC).
- **Recommandation** : Lister par sous-traitant le mécanisme de transfert. Vérifier les DPA signés avec chacun.
- **Statut** : OUVERT.

### [P3] CGU : pas de version datée par modification ni d'acceptation tracée
- **Fichier** : `terms/page.tsx:15,34` (modif « par email ou notification » mais pas de re-acceptation).
- **Risque** : Opposabilité des CGU. Les CGU se réservent de modifier à tout moment avec information ; pour des CGV de vente B2C, une modification substantielle peut nécessiter une nouvelle acceptation. Pas de trace d'acceptation horodatée par utilisateur.
- **Recommandation** : Journaliser l'acceptation des CGU/CGV à l'inscription (version + date) ; redemander acceptation lors de changements substantiels.
- **Statut** : OUVERT.

### [P3] Auto-exclusion fail-closed très court (5 min) — robuste mais à documenter
- **Fichier** : `src/lib/selfExclusion.ts:13-19`.
- **Risque** : Bon design (fail-closed sur erreur DB pendant 5 min). Mineur : en cas d'erreur DB persistante, l'action est bloquée 5 min puis retentée — un joueur exclu ne devrait jamais passer, mais l'erreur n'est pas distinguée d'un « non-exclu ». Acceptable. À documenter dans la procédure jeu responsable.
- **Recommandation** : Conserver. Ajouter un test couvrant le chemin fail-closed.
- **Statut** : ACCEPTABLE (pour information).

---

## Points conformes / bien faits (à préserver)
- Auto-exclusion **fail-closed** et appliquée sur la quasi-totalité des actions payantes (clic, packs, VIP, Buy-It-Now, collection, mini-jeux, achat cadeau, reconnexion) — `selfExclusion.ts` + 8 call sites. Seul `redeemGift` manque (P1).
- Export RGPD **complet**, incluant la jauge (`user_item_gauges`, `gauge_wins`) et l'auto-exclusion — `privacy.ts:12-64`.
- Suppression/anonymisation codée avec anonymisation de `games.last_click_username` (mais non testée, cf. P1).
- Consentement cookies **réel** : Umami chargé seulement après « Accepter » — `Analytics.tsx:20`.
- Sentry en mode **erreurs seules** (pas de tracing perf client, pas de session replay) — `sentry.client.config.ts`.
- Page `/jeu-responsable` correcte : 18+, budget, signes d'alerte, **09 74 75 13 13**, joueurs-info-service, pause 24h–90j — bon socle.
- Page `/comment-ca-marche` honnête sur la perte possible des crédits et sur les participants animés (mais à remonter vers le gameplay/landing, cf. P2).
- Médiation prévue dans l'architecture (`lib/legal.ts`), reste à renseigner (P2).
- CGV : exclusion du droit de rétractation correctement fondée sur L221-28 (reste le tracking du consentement, P2).
