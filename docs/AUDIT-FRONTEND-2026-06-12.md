# Audit Frontend / DA / UI — Cleekzy — 12 juin 2026

Méthodologie : tournée visuelle complète (10 pages, desktop), Lighthouse prod (home + lobby),
axe-core prod, recherche web (références du genre : Stake/EmpireDrop/CSGORoll/Packdraw ;
tendances 2026 ; heuristiques Refactoring UI / Nielsen / Laws of UX / Material dark).

**Verdict honnête : 7/10 visuellement.** L'identité existe et la landing est forte, mais le site
est aujourd'hui dans la colonne « néon cheap » sur plusieurs critères du genre (sur-saturation
multi-couleurs, glow permanent) là où les leaders (Stake, EmpireDrop) gagnent par la sobriété
premium. Les fondations sont bonnes : c'est un travail de **discipline**, pas de refonte.

---

## 1. Mesures objectives (prod, 12/06/2026)

| Page | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | 72 | 82 | 96 | 100 | **6,9 s** 🔴 | 0 ✅ |
| Lobby | **51** 🔴 | 86 | 96 | 100 | **7,0 s** 🔴 | **0,355** 🔴 |

axe-core : **14 boutons sans nom accessible**, **13 contrastes insuffisants** (home),
heading-order, select sans label, skip-link non focusable, aria-hidden avec descendant focusable.

### Causes identifiées
- **LCP 7 s** : images produits avec `unoptimized` (game-client, LobbyFeatured) = pas de
  compression Next ; fonts display non préchargées ; hero image non priorisée partout.
- **CLS 0,355 lobby** : les widgets du header (perso/calendrier/coffres) et les pills stats
  poppent après coup sans espace réservé ; cascade `.reveal` qui décale ; LobbyGamificationBar
  chargée après. Fix : `min-height` réservées + skeletons à dimensions fixes.

---

## 2. Direction artistique — le diagnostic central

### 🔴 Le problème n°1 : « si tout brille, rien ne brille »
Chaque écran fait concourir 4 à 6 couleurs néon à intensité égale. Exemple mesuré sur le
lobby : pills stats = jaune (jackpot) + violet (en jeu) + vert (remportés) + rouge (phase
finale) + bleu (crédits), plus le rose des cards, le cyan des timers, l'orange des flammes.
La grille premium/cheap du genre (recherche) est sans appel :
- **Premium (Stake, EmpireDrop)** : base sombre désaturée, UN accent dominant, néon réservé
  aux éléments live/actifs.
- **Cheap** : 3+ néons saturés en compétition, glow CSS permanent en décor.

**Règle cible** : violet #9B5CFF = accent primaire unique (CTA, états actifs, navigation).
Rose #FF4FD8 = réservé aux reward moments (victoire, drop, level-up). Tout le reste
(stats, pills, badges info) = blanc/gris à 2 niveaux d'opacité max. Le glow box-shadow
devient CONDITIONNEL (hover, urgence réelle, reward) — jamais décoratif permanent.

### 🟠 Incohérence des « pages spectacle » vs « pages sobres »
- Heros géants multicolores : LP (blanc+violet+cyan), Boutique (blanc+cyan glow),
  Mini-jeux (blanc+dégradé rose), V.I.P (or).
- Titres sobres petits : Collection, Classement, Clans, Gagnants (kicker + titre 4xl).
Deux systèmes typographiques cohabitent sans logique. Unifier : UN pattern de page-header
(kicker + display + sous-titre) avec UNE taille pour les pages app, le traitement géant
réservé à la LP.

### 🟠 Élévation par bordures au lieu de surfaces
Quasi toutes les cards = `bg-secondary + border white/10`. Le standard dark (Material) :
élévation par ÉCLAIRCISSEMENT de surface (3-4 paliers : #0B0F1A → #11162A → #161D33 →
#1B2340) + bordures seulement en appoint. Résultat actuel : tout est au même niveau de
profondeur, l'œil ne hiérarchise pas.

### ✅ Ce qui est fort (à ne pas toucher)
- Hero LP : typographie display géante deux-tons, mockup live crédible, double CTA. Niveau pro.
- Identité Unbounded + Hanken Grotesk : pairing sain (géométrique large vs humaniste),
  encore peu vu dans le genre = différenciant. `stat-numeral` mono pour les chiffres : très bon.
- Mini-jeux : iconographie distinctive par jeu, fun, cohérente.
- Mur des gagnants : grille propre, vraies photos produits, badges de statut. Social proof crédible.
- Page jeu (au-dessus du pli) : hiérarchie timer → leader → CTA → feed claire.
- Pixel art personnage/items : signature visuelle unique dans le genre.

---

## 3. Problèmes écran par écran

### Landing
1. **Trou vertical géant** entre le hero et « Comment ça marche » : un viewport quasi entier
   de vide (fond + shapes seulement). Resserrer ou meubler (ticker, stats).
2. **Step cards semi-transparentes** : la cascade GSAP laisse les cartes 01/02 à ~40 %
   d'opacité selon la position de scroll — on dirait un bug de chargement. Vérifier les
   triggers ScrollTrigger (start trop tard) ou pré-révéler au-dessus d'un seuil.
3. Footer LP riche ✅ mais le compteur « EN LIGNE » est simulé → voir §6 risques.

### Lobby
4. **~600 px consommés avant la première card de jeu** (titre + widgets + pills + barre
   gamification + filtres). Sur un site de jeu, le jouable doit être visible immédiatement.
   Compacter : fusionner les pills stats dans la barre de gamification, réduire le titre.
5. CLS 0,355 (voir §1).
6. Les 3 widgets (perso/calendrier/coffres) + 5 pills + barre 110/300 + « 1 quête » +
   « Classement » = 10 éléments d'UI méta avant le jeu. Trop de bruit (Hick's Law).

### Page de jeu
7. **Rectangle vide ~500 px** sous l'image produit dans la carte gauche au scroll : remplir
   (specs produit, valeur, derniers gagnants d'items similaires, partage) ou raccourcir la carte.
8. **Règles dupliquées 2×** dans le même viewport (panneau « RÈGLES DU JEU » + bandeau bas).
   Supprimer le bandeau bas.

### Collection
9. Réparée aujourd'hui (crash cosmétiques arena). Zone coffres vide = bon empty state ✅.

### Clans
10. **Page squelettique** : deux panneaux flottants dans un océan de vide, aucune mise en
    scène (pas de blason, pas de bannière, pas de stats riches). La moins finie du site.

### Boutique / V.I.P / Mini-jeux / Classement / Gagnants
11. Solides individuellement. Mais : 3 styles de heros différents (cyan / or / rose), et le
    classement affiche « 13e sur 13 joueurs » — démotivant à faible volume (afficher le
    percentile ou masquer sous N joueurs).

### Transverse
12. **Système de boutons éclaté** : btn-arena (clip-path), pills arrondis, rectangles arrondis,
    ghost, gradients divers. Définir 3 variants (primary arena / secondary outline / ghost) et
    s'y tenir.
13. **Tailles texte < 11 px** : nombreux text-[0.55rem]/[0.6rem] (8,8-9,6 px) — sous le seuil
    de lisibilité, surtout sur les labels importants (kickers OK, data non).
14. **Émojis comme icônes** dans CreditPacksModal (🎰🎯🤝, ajoutés aujourd'hui — mea culpa) :
    remplacer par Lucide (Dices, Target, Users) pour la cohérence.
15. **Pas de footer sur les pages app** : les pages courtes (clans, classement) se terminent
    dans le vide. Un footer minimal (légal + support + réseaux) ancre l'écran.
16. Contrastes : `text-white/40` et `/45` massivement utilisés pour de l'info utile
    (< 3:1, échec WCAG). Remonter à /55 minimum pour l'info, garder /40 pour le décoratif.

---

## 4. Motion / juice — l'écart au standard du genre

Le moment signature (le CLIC) est sous-investi par rapport aux références :
- **Clic d'enchère** : ajouter compression du bouton (squash), onde radiale, tick sonore
  court, micro-shake du timer. C'est l'équivalent du « spin » des concurrents — chaque clic
  doit être physiquement satisfaisant.
- **Feedback gradué par rareté** (règle anti-kitsch) : commun = pop discret ; légendaire =
  build-up + particules + son multicouche. Le CaseOpeningModal le fait déjà bien ✅.
- **Count-ups** : présents sur le jackpot ✅, à généraliser (crédits après gain, XP, solde).
- Renoncer aux animations permanentes concurrentes (animate-pulse sur 4+ éléments du lobby
  simultanément) : 1-2 éléments animés max par vue (recherche : règle sévérité haute).
- `prefers-reduced-motion` : respecté sur reveal/grain ✅, manquant sur canvas-confetti.

---

## 5. Accessibilité — quick wins chiffrés

1. 14 boutons sans nom accessible (favoris cœur, fermetures, etc.) → aria-label.
2. 13 contrastes en échec sur la home → passe text-white/40→/55 sur l'info.
3. Select de tri sans label → aria-label="Trier les parties".
4. heading-order (h1→h3 sautés) sur le lobby.
5. skip-link non focusable, aria-hidden avec focusable dedans (menu).
6. Touch targets < 24 px (pills, boutons ×).

---

## 6. ⚠️ Risques légaux à décision business (honnêteté obligatoire)

Issus de la recherche (DGCCRF, art. L320-1 CSI, JONUM/SREN, ANJ) — je signale, la décision
appartient à Mehdi :
1. **Compteur « EN LIGNE » simulé + bots dans le classement + faux gagnants dans les feeds** :
   social proof simulée = « pratique commerciale trompeuse » (DGCCRF, 960 sanctions 2025,
   client mystère numérique actif). Le pattern le plus risqué du site.
2. **Qualification loterie (L320-1)** : espérance de gain + part de hasard + sacrifice
   financier = loterie prohibée. La DA doit pousser le registre compétition/skill, PAS le
   registre casino — or « Roue de la Fortune », jackpot, vocabulaire de gain vont dans le
   sens casino. À cadrer juridiquement.
3. Afficher le coût réel en euros à côté des crédits, et les outils de jeu responsable au
   même niveau visuel que l'achat (signal premium + conformité ANJ).

---

## 7. Plan d'action priorisé

> **État au 12/06 soir : P0 exécuté en intégralité + P1 majoritaire** (commits
> ca697d1 → 484aede). **Mesures finales lobby : perf 51→77, CLS 0,355→0,152,
> LCP 7,0→4,4 s, Speed Index 6,4→3,6 s, a11y 86→93.** Cause racine du CLS :
> le translateY de .page-enter (containing block + animation non-composited)
> -> transition en opacity seule. Reste 1 shift de 0,15 (insertion au-dessus
> des filtres lobby, à instrumenter avec web-vitals attribution).
> Fait : unoptimized supprimés (98 PNG/24MB enfin compressés), placeholders
> anti-CLS (jackpot/online/countdown), will-change sur le halo arena (62% du
> CLS = animation non-composited), triggers GSAP scopés desktop (step cards
> réparées), carte produit jeu self-start+sticky, bandeau règles dupliqué
> supprimé, pills stats neutralisées (discipline néon), émojis→Lucide,
> aria-labels/inert/h2/contrastes, footer app 18+, lobby compacté.
> Refactors P1 livrés (bd87e05) : système de boutons 3 variants (.btn-arena /
> -outline / -ghost, doc + migrations), élévations .surface-1/2/3 (modals en
> surface-3), lobby bento (tuile large col-span-2, aspect calibré 11/4).
> Migration boutons TERMINÉE (9b1ff44) : 13 CTA migrés au total, inventaire
> exhaustif par agent, familles hors périmètre documentées (icon-buttons,
> chips/pagination, tuiles, exceptions doré/rouge).
> CLS instrumenté (PerformanceObserver buffered + Lighthouse local) :
> desktop réel ~0,0005, mobile local 0,087 (< 0,1 ✓). Prod : perf 77,
> LCP 4,2 s, variance CLS 0,09-0,16 selon les runs.
> PNG sources : 800x800, poids dû aux dégradés néon — recompression écartée
> (risque de banding, Next sert déjà l'AVIF dérivé).
> Restent (P2, à valider avec Mehdi) : heros unifiés (goût), LCP < 2,5 s
> (CDN images ou redesign des fonds néon), shift mobile résiduel ~0,06
> (probablement swap de la font display).

### P0 — Discipline visuelle + perf (le plus gros ROI) — ✅ FAIT
1. **Passe « discipline néon »** : pills stats lobby en monochrome (blanc/gris + icône
   colorée), glow permanent → conditionnel, rose réservé aux rewards. 1 journée, transforme
   la perception premium du site entier.
2. **LCP** : retirer `unoptimized` des images produits, `priority` + `sizes` corrects,
   preload de la font Unbounded. Cible < 2,5 s.
3. **CLS lobby** : min-height réservées pour widgets/pills/barre gamification. Cible < 0,1.
4. **Vides** : trou LP hero→steps, rectangle vide page jeu, règles dupliquées.
5. **A11y quick wins** (§5) : ~2 h de travail, +10 points Lighthouse.

### P1 — Cohérence systémique
6. Unifier les heros de pages (1 pattern, 1 gamme de tailles, highlight = violet).
7. Système de boutons : 3 variants documentés dans globals.css, migration page par page.
8. Élévations par paliers de surface (4 tokens) au lieu de border white/10 partout.
9. Lobby : compacter le header méta (~300 px récupérés au-dessus du pli).
10. Juice du clic d'enchère (squash + onde + son) — le moment signature du produit.
11. Footer app minimal sur toutes les pages.
12. Remplacer les émojis du CreditPacksModal par des icônes Lucide.

### P2 — Élévation du genre
13. Lobby en bento grid (1 vedette + moyennes + petites) — standard 2026, +23 % scroll depth.
14. Page Clans : mise en scène complète (blason généré, bannière, stats riches).
15. Grain texture subtil (2-4 % opacité) sur le fond pour casser le flat.
16. Page jeu : colonne gauche enrichie (specs, historique, partage).
17. Classement : masquer le rang exact sous N joueurs réels, percentiles.

### Hors scope design (décision business)
18. Social proof simulée → réelle ou retirée (risque DGCCRF).
19. Cadrage juridique L320-1 / JONUM avec un avocat.
