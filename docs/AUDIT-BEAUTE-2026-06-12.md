# Audit Beauté Visuelle — Cleekzy — 12 juin 2026

Pas de métriques ici : l'œil du directeur artistique. Tournée complète au pixel,
croisée avec les références award-winning du genre. Objectif client : « le
meilleur site visuellement ».

**Verdict : 7,5/10 — un très bon site de production, pas encore un site
mémorable.** L'identité existe (Unbounded, pixel art, néon navy), l'exécution
est propre, mais trois plafonds de verre le séparent du « whoa » : la couleur
criée au lieu d'être orchestrée, la lumière plate, et l'absence d'un moment
signature inoubliable.

---

## 1. Le diagnostic en trois plafonds

### 🔴 Plafond n°1 — La couleur est criée, pas orchestrée
Le problème n'est plus les pills (corrigées) : il est SYSTÉMIQUE sur la LP et
les détails :
- **Titres de section en aplat fluo massif + glow** : « LOTS À REMPORTER » en
  rose flood-fill, « DERNIERS GAGNANTS » en vert flood-fill. C'est la technique
  la moins raffinée du néon — les sites premium utilisent du blanc avec UN mot
  accent, de l'outline, ou un dégradé contenu, jamais un mot entier en fluo
  saturé pleine chasse. Chaque section crie une couleur différente : violet/cyan
  (hero), rose (lots), vert (gagnants), or (vedette).
- **Le footer a 3 couleurs de titres de colonnes** (NAVIGATION violet, LÉGAL
  cyan, CONTACT rose). Les badges de réassurance : vert + bleu + rose.
- **Règle cible** : UNE couleur d'accent par écran (violet), le reste en
  blanc/gris. Le rose = uniquement les rewards. Le vert = uniquement le live/
  succès (petites surfaces). JAMAIS un titre entier en fluo : accent sur un mot,
  en dégradé court ou avec un soulignement lumineux.

### 🔴 Plafond n°2 — La lumière est plate
Le fond est une couleur unie + grille + shapes outline dispersées (triangles,
carrés, ronds pointillés) : du décor « confetti 2015 », sans intention ni
profondeur. Les références premium construisent la profondeur par la LUMIÈRE :
- Nappes lumineuses positionnelles (le hero éclairé par le produit, pas un
  fond uniforme) ;
- Vignettage des bords (l'œil guidé vers le centre) ;
- Brouillard/dégradés multi-stops entre les sections (transitions douces au
  lieu de vides) ;
- Lumière diégétique : le produit du mockup devrait ÉCLAIRER sa carte (glow
  colorée extraite du produit, ombre portée riche, socle lumineux — le
  hero-stage-floor existe mais reste timide).

### 🔴 Plafond n°3 — Pas de moment signature
Le site n'a pas UN élément dont on se souvient. Or la matière existe déjà :
- **Le pixel art est la signature la plus distinctive du site** (personnage,
  items, coffres) — et il est invisible sur la LP ! Aucun concurrent n'a ça.
- Le curseur custom existe (cosmétique) mais pas par défaut sur la LP.
- L'arrivée sur le site est statique : pas de séquence d'entrée orchestrée
  (le hero apparaît, point).

---

## 2. Critique écran par écran (au pixel)

### Landing
| Élément | Verdict | Détail |
|---|---|---|
| Hero typographie | ✅ Fort | « LE DERNIER CLIC GAGNE » : niveau pro. Le point rose final = beau détail. |
| Hero CTA | 🔴 | « ENTRER DANS L'ARÈNE » wrappe sur 2 lignes, « COMMENT ÇA MARCHE » aussi — boutons trop étroits pour leur libellé, ça casse la ligne du hero. |
| Mockup live | 🟠 | La montre flotte sur un fond plat : pas de socle lumineux marqué, pas d'ombre riche, pas de reflet. Le produit est posé, pas présenté. |
| Fond | 🔴 | Shapes géométriques outline éparses + points confetti : générique. Zéro intention lumineuse. |
| Titres sections | 🔴 | Aplats fluo massifs (rose, vert) — voir plafond n°1. |
| Podium gagnants | 🟠 | Avatars = cercles dégradés avec initiale. Pauvre, alors que le pixel art existe. La couronne dorée du 1er = bien. |
| Ticker live | ✅ | Bon pattern du genre, bien exécuté. |
| FAQ | ✅ | Sobre et propre. |
| Footer | 🟠 | Wordmark glow ✓, watermark fantôme ✓ — mais 3 couleurs de titres de colonnes. |

### Lobby
- La carte « À la une » est devenue le bon point focal ✓. Le bento ✓.
- Les GameCards : les BORDURES dégradées par état (violet/rouge/vert) font le
  travail mais TOUTES les cards ont un liseré coloré → aucune ne ressort. Les
  fonds d'image (dégradé violet uniforme) aplatissent les produits.
- Le widget perso pixel = la meilleure chose du header ✓.

### Page jeu
- Hiérarchie forte ✓. Le compteur géant rouge = bon. La carte produit sticky ✓.
- Le feed « derniers clics » : lignes violettes uniformes, pas de vie (le
  leader devrait rayonner, les entrées s'estomper avec l'âge).

### Mini-jeux
- Les icônes par jeu : distinctives ✓. Mais chaque jeu titre dans SA couleur
  (violet/rose/cyan/or) — défendable comme identité par jeu, à condition que
  le reste de l'écran reste neutre (c'est le cas) — ACCEPTÉ.

### Collection / Classement / Clans / Boutique / V.I.P
- Heros unifiés ✓ (fait aujourd'hui). Clans mis en scène ✓.
- Boutique : les médaillons de packs (pièces 3D-ish dégradées) = bien.
- Classement : avatars initiales = même pauvreté que le podium LP.

---

## 3. Le plan « best-looking site » — par impact

### Tier S — Transforme la perception (à faire en premier)
1. **Discipline des titres de section (LP)** : finir le travail commencé sur
   les pages app. Blanc + UN mot en violet (ou dégradé court violet→rose sur
   le mot), plus jamais d'aplat fluo entier. Toucherait : LOTS À REMPORTER,
   DERNIERS GAGNANTS, badges footer, titres colonnes footer.
2. **Refonte lumière du fond** : remplacer les shapes confetti par 2-3 nappes
   lumineuses intentionnelles par écran (radial-gradients positionnels XL,
   double-stop, très flous) + vignettage léger des bords + transitions de
   section en dégradé (plus aucune coupure sèche). CSS pur.
3. **Mise en scène du produit hero** : socle lumineux fort + ombre portée
   colorée + halo extrait de la teinte produit. Le produit devient la source
   de lumière de sa carte.

### Tier A — La signature mémorable
4. **Le pixel art sur la LP** : le personnage pixel en mascotte d'accueil
   (coin du hero, animé idle 2-3 frames), pixel-coffres dans la section lots,
   avatars pixel par défaut (podium, classement) à la place des initiales.
   C'est LE différenciant que personne d'autre n'a.
5. **Curseur custom par défaut** sur la LP (la flèche néon existe déjà en
   cosmétique) + traînée subtile au mouvement : transforme la première seconde.
6. **Séquence d'entrée du hero** (one-shot, 1s, orchestrée) : kicker → titre
   ligne 1 → ligne 2 → mockup qui s'allume (la live card passe de éteinte à
   allumée) → ticker qui démarre. L'arrivée devient un moment.

### Tier B — Le polish des détails
7. GameCards : bordure colorée RÉSERVÉE aux états urgents/gagnés (les cards
   normales en bordure neutre) → la hiérarchie revient.
8. Feed de clics : opacité dégressive avec l'âge, leader avec halo.
9. Footer : titres de colonnes en blanc, une seule teinte d'accent.
10. Boutons hero LP : largeur min pour ne jamais wrapper.

### Hors scope CSS (investissements, à valider)
- Mascotte pixel **Rive** (10-15x plus léger que Lottie, state machines : suit le
  curseur, célèbre les victoires) — LE différenciateur au meilleur ratio.
- Élément 3D léger (Spline) réservé à UN objet hero (le coffre).
- Illustrations custom des fonds de mini-jeux.

---

## 4. Ce que font les winners (recherche Awwwards/FWA 2024-2026)

Croisement avec les case studies **Zentry** (Site of the Month, le standard du
gaming web), **Igloo Inc** (Site of the Year 2024), **RiotX Arcane** (FWA) :

1. **La lumière est un matériau** : source positionnelle, diégétique (les
   éléments ÉMETTENT : un CTA éclaire son conteneur, une carte rare projette
   sa lueur sur ses voisines), granuleuse (grain anti-banding). Les glows
   flottants sans source = signature du site générique. → confirme plafond n°2.
2. **Le fond n'est jamais une couleur, c'est une matière** : grain partout,
   noise dans les dégradés, brouillard entre les sections. → plafond n°2.
3. **Unicité procédurale** (leçon Igloo) : l'œil détecte la duplication — varier
   chaque instance de card (délai, angle de lueur, grain par index).
4. **Le motion défini avant le design** (leçon Zentry) : leurs transitions
   « cinématiques » sont des clip-path DOM, PAS du WebGL. Le spectaculaire
   est accessible.
5. **Le wow = la cohérence d'un univers**, pas l'accumulation d'effets.
   L'univers Cleekzy : « l'arène d'arcade néon où le dernier clic gagne » —
   chaque effet doit servir cette fiction (le site s'ALLUME comme une borne).
6. **Pixel art = revival premium 2025-2026** (signale le « fait main » à l'ère
   de l'IA) : l'assumer en SYSTÈME — scramble text pixelisé, transitions en
   dissolution pixel, curseur pixel, mascotte pixel réactive. → plafond n°3.

### Les 10 techniques concrètes de la recherche (CSS/SVG/Canvas, classées impact)
1. Fond atmosphérique multi-couches (orbes positionnelles + vignettage + dégradé vertical)
2. Grain global mix-blend-overlay 4-8% + grainy gradients
3. Lumière diégétique liée à l'état live (enchère qui chauffe = lueur qui monte — la lumière devient information)
4. Cascade d'entrée hero orchestrée (~1s, stagger : le site « démarre »)
5. Typo traitée : chiffres fantômes outline géants, mix fill/outline, background-clip dégradé animé
6. Transitions de page en mask/clip-path (View Transitions API), flash violet 400-600ms
7. God rays conic-gradient derrière l'objet vedette (l'effet « loot légendaire » en pur CSS)
8. Curseur custom avec lag + boutons magnétiques (marqueur n°1 des sites primés)
9. Glass panels posés SUR les orbes (le verre a besoin de quelque chose à distordre)
10. Particules Canvas ambiantes (60-80, réactives curseur, ~3 ko) + variation procédurale des grilles

Sources : case studies Awwwards Zentry & Igloo Inc, RiotX Arcane (Thinkingbox),
CSS-Tricks (grainy gradients, god rays), Toptal dark UI, Orpetron transitions.
