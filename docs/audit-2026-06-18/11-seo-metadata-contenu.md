# Audit SEO technique, métadonnées & contenu — Cleekzy

Date : 2026-06-18
Périmètre : SEO technique, robots/sitemap, métadonnées par route, Open Graph / Twitter, données structurées (JSON-LD), hiérarchie de titres, 404, qualité copy FR.
Méthode : lecture statique de `src/app/**`, `public/`, `next.config.ts`, croisement avec les audits précédents (`docs/AUDIT-2026-06-12.md`, `-15.md`, `-17.md`).
Stack : Next.js 16 App Router. Branche : `main`.

---

## ⚠️ Correction de prémisse : le domaine de prod est **cleekzy.com**, PAS cleekzy.fr

La consigne de mission indiquait « domaine de prod cleekzy.fr ». **C'est faux.** Toutes les sources internes convergent vers `cleekzy.com` :

- `src/app/layout.tsx:50,74,110,121,125` → `https://www.cleekzy.com`
- `src/app/sitemap.ts:4` → fallback `https://www.cleekzy.com`
- `public/robots.txt:8` → `Sitemap: https://www.cleekzy.com/sitemap.xml`
- `public/manifest.json`, e-mails Resend (`*@cleekzy.com`), `docs/AUDIT-2026-06-15.md:22` « prod www.cleekzy.com ».

Le `clikzy.fr` de la mémoire (`cleekzy-audit-2026-06`) était **l'ancien domaine + une typo**, déjà corrigé en urgence le 2026-06-12 (`docs/AUDIT-2026-06-12.md:27,99`). **Aucune occurrence de `cleekzy.fr` ou `clikzy.fr` ne subsiste dans `public/robots.txt` ni dans le code applicatif** — vérifié. Les seuls résidus `CLIKZY`/`Clikzy` sont dans `remotion/` (vidéos marketing, hors périmètre SEO) et un wordmark legal (cf. P1 ci-dessous). Le robots.txt est donc **sain côté domaine**.

Toute la suite de l'audit raisonne avec le domaine correct **cleekzy.com**.

---

## Synthèse par sévérité

| Sévérité | Nombre |
|----------|--------|
| P0 | 1 |
| P1 | 4 |
| P2 | 6 |
| P3 | 6 |

---

## P0

### [P0] Pages privées indexables : aucune `noindex`, elles redirigent vers /login (soft-404 / contenu vide pour Googlebot)
- **Fichiers** :
  - `src/app/(main)/shop/page.tsx:30` (redirect `/login`), listée au sitemap `src/app/sitemap.ts:44`
  - `src/app/(main)/vip/page.tsx:17` (redirect `/login`), sitemap `:38`
  - `src/app/(main)/mini-games/page.tsx:14`, sitemap `:50`
  - `src/app/(main)/profile/page.tsx:20` (redirect, **aucune** metadata)
  - `src/app/(main)/collection/page.tsx:11`, `src/app/(main)/clans/page.tsx:12`
  - `src/app/(main)/cadeau/offrir/page.tsx` (indexable, accès via auth)
- **Impact** : `/shop`, `/vip`, `/mini-games` sont **dans le sitemap** (donc soumis à l'indexation) mais redirigent vers `/login` pour tout visiteur non connecté — dont Googlebot. Google voit soit une redirection vers une page d'auth (qu'il indexera mal), soit du contenu vide. Résultat : pages « mortes » dans l'index, dilution du crawl budget, et aucune des trois (boutique, VIP, mini-jeux) ne pourra jamais ranker sur son contenu réel car le bot ne le voit jamais. `/profile` n'a en plus aucune balise title/description (hérite du template générique). `robots.txt` ne bloque QUE `/profile`, pas `/shop` `/vip` `/mini-games` `/collection` `/clans`.
- **Preuve** : `sitemap.ts:38-54` liste vip/shop/mini-games avec priorités 0.7-0.8, alors que chacune fait `redirect('/login')` si `!user`. `robots.txt:11-20` ne disallow que `/api/`, `/admin/`, `/auth/callback`, `/reset-password`, `/forgot-password`, `/profile`.
- **Correctif** : décider de la stratégie par page :
  - Soit **retirer du sitemap** shop/vip/mini-games + ajouter `Disallow:` dans robots.txt + `robots: { index: false }` dans leur metadata.
  - Soit (mieux pour /shop et /vip qui ont une valeur SEO commerciale) rendre une **version publique consultable** (sans redirect, prix/avantages visibles, CTA « se connecter pour acheter ») afin que Googlebot indexe le contenu réel. C'est déjà le pattern de `/game/[id]` (auth optionnelle, cf. `game/[id]/page.tsx:46`).
  - `/profile`, `/collection`, `/clans`, `/cadeau/offrir` → `robots: { index: false }` (pages perso, aucune valeur SEO).
- **Statut** : À corriger (P0 — décision produit requise : noindex vs version publique).

---

## P1

### [P1] Pages d'authentification sans `noindex` ni metadata (login/register/forgot/reset)
- **Fichiers** : `src/app/(auth)/login/page.tsx:1`, `register/page.tsx:1`, `forgot-password/page.tsx:1`, `reset-password/page.tsx:1` — tous `'use client'`, donc **aucune metadata possible** ; le layout `(auth)/layout.tsx` est lui aussi `'use client'` et n'exporte pas de metadata.
- **Impact** : `/login` et `/register` n'apparaissent pas dans `robots.txt` (seuls `/reset-password` et `/forgot-password` y sont). Ils sont donc **crawlables et indexables**, héritent du title/description génériques du root layout, et peuvent apparaître en SERP à la place de la vraie landing. Le prior audit (`AUDIT-2026-06-15.md:97`) signalait « /login,/register dans le sitemap » — **le sitemap a été nettoyé** (vérifié : aucun login/register dans `sitemap.ts`), mais l'indexation reste ouverte car ni robots ni metadata noindex.
- **Preuve** : `grep "index: false"` ne retourne que `cadeau/merci/page.tsx:8`. Les 4 pages auth sont des client components sans `generateMetadata`.
- **Correctif** : ajouter `Disallow: /login` et `Disallow: /register` dans `robots.txt`. Comme ce sont des client components, exporter la metadata depuis le `layout.tsx` du groupe `(auth)` (le convertir en server component avec `export const metadata = { robots: { index: false } }`, et déplacer l'interactivité dans un sous-composant client).
- **Statut** : À corriger.

### [P1] Wordmark mal orthographié « CLIKZY » sur toutes les pages légales (indexables)
- **Fichier** : `src/app/(legal)/layout.tsx:21-22` → `<span>CLIK</span><span>ZY</span>`.
- **Impact** : le header de **toutes** les pages légales indexables (`/legal`, `/terms`, `/privacy`, `/cgv`, `/comment-ca-marche`, `/jeu-responsable`) affiche la marque erronée « CLIKZY » au lieu de « CLEEKZY ». Incohérence de marque sur du contenu indexé + crédibilité (pages où la confiance compte le plus). Déjà signalé `AUDIT-2026-06-17.md:228,332`, toujours présent.
- **Preuve** : ligne 21-22 ci-dessus ; le footer du même fichier (`:53`) écrit pourtant correctement « CLEEKZY ».
- **Correctif** : remplacer `CLIK`/`ZY` par `CLEEK`/`ZY` (ou utiliser le composant `<Logo />` déjà importé dans `support/page.tsx`).
- **Statut** : À corriger.

### [P1] Canonical URL dépend d'une variable d'env non documentée pour la prod — risque de canonicals cassés
- **Fichiers** : `src/app/layout.tsx:50` `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cleekzy.com')`, `src/app/sitemap.ts:4` même fallback ; `.env.example:7` et `.env.local:9` valent **`http://localhost:3000`** sans aucun commentaire indiquant la valeur de prod.
- **Impact** : tous les `alternates.canonical` (relatifs : `/lobby`, `/shop`, etc.) sont résolus contre `metadataBase`. Si la variable `NEXT_PUBLIC_SITE_URL` est absente en prod, le fallback `www.cleekzy.com` sauve la mise ; mais si elle est définie avec la mauvaise valeur (ex. copiée du `.env.example` = `http://localhost:3000`, ou apex sans www), **tous les canonicals, OG:url, et URLs du sitemap pointent vers le mauvais host** → désindexation potentielle / duplicate content massif. Le `.env.example` qui sert de référence pointe vers localhost sans avertissement.
- **Preuve** : `.env.example:7 NEXT_PUBLIC_SITE_URL=http://localhost:3000`, aucun commentaire `# Prod: https://www.cleekzy.com`.
- **Correctif** : documenter dans `.env.example` (`# En prod: https://www.cleekzy.com — sert de base à TOUS les canonicals/OG/sitemap`). Vérifier la valeur effective sur Vercel (action Mehdi). Optionnel : hardcoder `https://www.cleekzy.com` comme base et n'utiliser l'env que pour le dev local, pour éliminer le risque.
- **Statut** : À corriger + action Mehdi (vérif env Vercel).

### [P1] JSON-LD trompeur : `WebApplication` déclare `offers price 0 EUR` sur un jeu payant
- **Fichier** : `src/app/layout.tsx:104-127`.
- **Impact** : le seul bloc de données structurées du site annonce `@type: WebApplication`, `offers: { price: '0', priceCurrency: 'EUR' }` et `applicationCategory: 'Game'`. Or Cleekzy est une enchère où **chaque clic consomme un crédit acheté en argent réel** (`comment-ca-marche/page.tsx:37-44` : « Les crédits s'achètent avec de l'argent réel »). Déclarer « prix 0 » est factuellement faux et peut être vu comme du schema trompeur (risque de pénalité rich-results) ; côté juridique/ANJ (sujet sensible signalé en mémoire `cleekzy-go-live-readiness`), afficher « jeu gratuit prix 0 » dans les données structurées d'un produit qui frôle le jeu d'argent est risqué.
- **Preuve** : `layout.tsx:113-117`.
- **Correctif** : retirer le bloc `offers` (ou le rendre honnête), et préférer un schema `Organization` + `WebSite` (avec `potentialAction SearchAction` si une recherche existe) plutôt qu'un `WebApplication`/`Game` avec prix. Ne PAS ajouter de schema `Product`/`Offer` sur les lots (donnerait l'impression d'une boutique e-commerce de produits gagnables, trompeur). Aligner sur le ton « divertissement, on peut repartir sans rien ».
- **Statut** : À corriger.

---

## P2

### [P2] OG/Twitter par page absents : pages partageables héritent toutes du visuel + texte génériques
- **Fichiers** : `gagnants/page.tsx:5-9`, `classement/page.tsx:4-8`, `joueur/[username]/page.tsx:34-42`, `collection`, `clans`, `cadeau/*`, toutes les pages légales : metadata sans bloc `openGraph`/`twitter` propre.
- **Impact** : seuls le root layout (générique), `/game/[id]` (OG avec image du lot, `game/[id]/page.tsx:34`) et `/wrapped/[username]` (OG dédiée, `opengraph-image.tsx`) ont un OG contextualisé. Les pages à fort potentiel de partage social — **Mur des gagnants** (preuve sociale) et **profil joueur** (`/joueur/[username]`, conçue comme « page d'atterrissage au partage de victoire » d'après son propre commentaire ligne 7-8) — partagent un visuel et un texte génériques. Le profil joueur a un title/description dynamiques (`:37-40`) mais **pas de `openGraph`/`twitter`**, donc à la prévisualisation Twitter/Discord/WhatsApp il affiche l'OG global, pas les stats du joueur.
- **Preuve** : `joueur/[username]/page.tsx:34-42` ne retourne que `title` + `description`, sans `openGraph`. Comparer à `wrapped/[username]/page.tsx:16-19` qui, lui, le fait.
- **Correctif** : ajouter `openGraph`/`twitter` aux pages partageables. Pour `/joueur/[username]`, créer un `opengraph-image.tsx` (réutiliser le pattern de `wrapped/[username]/opengraph-image.tsx`). Pour `/gagnants`, OG montrant les derniers lots livrés.
- **Statut** : À corriger.

### [P2] Aucune donnée structurée Organization / WebSite / FAQ / BreadcrumbList
- **Fichiers** : seul `layout.tsx:104` porte du JSON-LD (le `WebApplication` problématique). Vérifié : `joueur`, `lobby`, `profile` n'ont **aucun** JSON-LD (les hits grep étaient des commentaires eslint).
- **Impact** : pas de `Organization` (logo, sameAs réseaux sociaux → knowledge panel), pas de `WebSite`, et surtout la page `/comment-ca-marche` a une structure **idéale pour un `FAQPage`** (6 sections Q/R : « Le principe », « Combien ça coûte », « La jauge », « Mini-jeux équité », etc. — `comment-ca-marche/page.tsx:29-86`) mais n'expose aucun schema FAQ → opportunité de rich snippets perdue.
- **Correctif** : ajouter (a) `Organization` dans le layout (name, url, logo `/icon-512.png`, `sameAs` réseaux), (b) `FAQPage` JSON-LD sur `/comment-ca-marche` à partir des `Section`. Attention au schema trompeur sur le jeu d'argent (voir P1 JSON-LD) : formuler les réponses FAQ sans surpromesse.
- **Statut** : À corriger.

### [P2] Pages publiques sans `alternates.canonical` : risque de duplicate sur la landing et les pages dynamiques
- **Fichiers avec canonical** : support, gagnants, classement, lobby, shop, vip (OK). **Sans canonical** : `src/app/page.tsx` (la landing, racine !), `comment-ca-marche`, `jeu-responsable`, `legal`, `terms`, `privacy`, `cgv`, `joueur/[username]`, `wrapped/[username]`, `cadeau/*`, `collection`, `clans`, `mini-games`.
- **Impact** : sans canonical explicite, les variantes d'URL (paramètres de tracking `?ref=`, `?utm=`, slash final, www vs apex) peuvent générer du duplicate content. La **landing racine** est la page la plus importante et n'a pas de canonical. Le param `?ref=` est explicitement utilisé pour le parrainage (mémoire `cleekzy-audit-2026-06`), donc `https://www.cleekzy.com/?ref=xxx` crée autant d'URLs dupliquées de la home.
- **Preuve** : `page.tsx` (racine) n'exporte aucune metadata locale → hérite du layout, qui ne pose pas de canonical par page.
- **Correctif** : ajouter `alternates: { canonical: '/' }` sur la landing et `canonical` sur chaque page légale/publique. Pour `/joueur` et `/wrapped`, canonical dynamique `/joueur/${username}`.
- **Statut** : À corriger.

### [P2] Incohérence www vs apex dans le contenu légal
- **Fichier** : `src/app/(legal)/legal/page.tsx:22` affiche `URL : https://cleekzy.com` (apex), alors que tout le SEO technique (metadataBase, OG, sitemap, robots) utilise `https://www.cleekzy.com` (avec www). `terms/page.tsx:21` écrit `cleekzy.com` sans protocole.
- **Impact** : incohérence de canonicalisation. Si le canonical technique est `www` mais que les mentions légales déclarent l'apex, et qu'aucune redirection 301 apex→www (ou inverse) n'est garantie, Google peut indexer les deux hosts. Aucune règle de redirect host n'a été trouvée dans `next.config.ts` (à confirmer côté Vercel).
- **Correctif** : choisir UN host canonique (recommandé : `www.cleekzy.com` puisque déjà partout dans le code), mettre une redirection 301 de l'autre (Vercel domains / `next.config.ts redirects`), et aligner le texte des mentions légales.
- **Statut** : À corriger + action Mehdi (redirect host Vercel).

### [P2] Double `<h1>` rendu dans le HTML de la landing (versions mobile + desktop)
- **Fichier** : `src/components/landing/LandingClient.tsx:442` (section `md:hidden`, ligne 427) ET `:597` (section `hidden md:flex`, ligne 581).
- **Impact** : les deux `<h1>` « Le dernier clic gagne » sont présents dans le DOM/HTML servi (l'un masqué en CSS selon le breakpoint). Googlebot lit le HTML complet → voit **deux h1 identiques**. Google tolère plusieurs h1, mais c'est un signal de structure faible et de la duplication de contenu hero. À noter : la racine `page.tsx` montre 0 h1 car le titre vit dans `LandingClient`.
- **Preuve** : grep `<h1` = 2 occurrences dans `LandingClient.tsx`, sous `md:hidden` et `hidden md:flex`.
- **Correctif** : factoriser le titre hero en un seul `<h1>` (composant partagé) avec des classes responsive, plutôt que deux blocs dupliqués. À défaut, garder un seul `<h1>` et passer l'autre en `<p>`/`<div>` stylé.
- **Statut** : À corriger.

### [P2] `/cadeau` (réclamation) et `/cadeau/offrir` indexables sans valeur SEO et avec contenu vide hors contexte
- **Fichiers** : `cadeau/page.tsx:5-8` (indexable), `cadeau/offrir/page.tsx:4-7` (indexable). Seul `cadeau/merci/page.tsx:8` a `robots: { index: false }`.
- **Impact** : `/cadeau` n'a de sens qu'avec un `?code=` ; sans code, c'est un formulaire vide. `/cadeau/offrir` redirige/exige une session pour payer. Indexées, elles génèrent des pages thin-content et des URLs `?code=` dupliquées.
- **Correctif** : `robots: { index: false }` sur `/cadeau` et `/cadeau/offrir` (cohérent avec `/cadeau/merci`).
- **Statut** : À corriger.

---

## P3

### [P3] Em-dash (—) dans le copy user-facing
- **Fichiers** : `comment-ca-marche/page.tsx`, `support/page.tsx` + `SupportForm.tsx`, `LandingClient.tsx`, `HeroLiveCard.tsx`, `WinnersPodium.tsx`, `PrizesBento.tsx`, `wrapped/[username]/page.tsx`, et titres metadata `game/[id]` (`… — au dernier clic`) / `vip` (`V.I.P — 20 crédits/jour`).
- **Impact** : règle « pas d'em-dash dans le copy » issue d'un AUTRE projet (Devoria, mémoire `feedback_no_em_dash`) — **confiance moyenne pour Cleekzy**, aucune trace de cette règle dans le CLAUDE.md de Cleekzy. Sur Cleekzy l'em-dash est utilisé de façon stylistique cohérente (titres énergiques). Signalé pour information, **pas une faute établie**.
- **Correctif** : ne rien faire sauf décision produit explicite d'interdire l'em-dash sur Cleekzy. Si interdit : remplacer par « · » (déjà utilisé) ou « : ».
- **Statut** : Info / à arbitrer.

### [P3] Emoji dans l'UI/copy — RAS côté pages publiques scannées
- **Constat** : scan des pages publiques (landing, légales, support) : **aucun emoji** détecté dans le texte. La DA utilise du pixel-art/SVG (conforme mémoire `cleekzy-pixel-art`). Bon point.
- **Statut** : Conforme (aucune action).

### [P3] `metadataBase` présent et correct, mais OG:url hardcodé en dur
- **Fichier** : `layout.tsx:74` `openGraph.url: 'https://www.cleekzy.com'` en dur, alors que `metadataBase:50` lit l'env. Incohérence mineure : si l'env change (staging), l'OG:url restera figé sur la prod.
- **Correctif** : dériver `openGraph.url` de la même source que `metadataBase` (ou le laisser relatif). Mineur.
- **Statut** : À corriger (mineur).

### [P3] `not-found.tsx` custom présent et soigné, mais sans metadata noindex explicite
- **Fichier** : `src/app/not-found.tsx` — 404 « GAME OVER » bien faite, h1 unique, liens vers /lobby et /. Next renvoie bien un statut 410/404 côté serveur. Pas de `metadata` (mineur : Next gère le statut HTTP, l'indexation d'une 404 n'arrive pas).
- **Statut** : Conforme (rien à faire).

### [P3] `manifest.json` : `start_url: /lobby` derrière auth + description « Jeu gratuit »
- **Fichier** : `public/manifest.json:5,4`.
- **Impact** : `start_url: '/lobby'` est public (lobby ouvert anon d'après mémoire), donc OK pour la PWA. La `description` « Jeu gratuit en temps réel » reprend le même angle « gratuit » que le JSON-LD (cf. P1) — cohérence du wording « gratuit » à surveiller juridiquement, mais hors strict périmètre SEO. Mineur.
- **Statut** : Info.

### [P3] Twitter handle `@cleekzy_fr` à vérifier
- **Fichier** : `layout.tsx:83` `twitter.creator: '@cleekzy_fr'`.
- **Impact** : si le compte X `@cleekzy_fr` n'existe pas, l'attribution de la twitter card est cassée (pas bloquant pour l'affichage de la card). À confirmer (action Mehdi).
- **Statut** : Action Mehdi (vérif compte X).

---

## Points conformes (à NE PAS « corriger »)

- **Domaine robots.txt sain** : `cleekzy.com` partout, aucun résidu `cleekzy.fr`/`clikzy.fr` (la mémoire est obsolète sur ce point — déjà fixé le 2026-06-12).
- **`lang="fr"`** présent sur `<html>` (`layout.tsx:137`).
- **`metadataBase` défini** (`layout.tsx:50`).
- **Sitemap dynamique** correct : pages statiques + profils gagnants réels (`is_bot=false`), borné à 100, fail-safe en cas d'erreur DB (`sitemap.ts:100-128`).
- **OG dédiées** sur `/game/[id]` (image du lot) et `/wrapped/[username]` (image générée + twitter card) — bien fait.
- **404 custom** soignée, h1 unique.
- **Accents FR** : copy globalement irréprochable (é/è/ê/à/ç corrects), aucune faute d'accent détectée dans les pages publiques.
- **`alt` sur `next/image`** présents (gagnants, joueur).
- **`/cadeau/merci`** déjà en `noindex` (bon réflexe).
- **Pages légales complètes** : CGU/CGV/Confidentialité/Mentions avec titles+descriptions uniques (le seul défaut est le wordmark CLIKZY, P1).
