# Audit 06 — Accessibilité (WCAG 2.2), états UX, PWA, mobile

Cible : Cleekzy (penny-auction temps réel, mobile-first, PWA installable, PAS d'app native).
Stack : Next.js 16, React 19, framer-motion. Branche `main`. Date : 2026-06-18.

Méthode : vérification adversariale de `docs/AUDIT-2026-06-17.md`. Cet audit avait
marqué « ✅ CORRIGÉ » plusieurs lots a11y (focus trap modales, aria-live timer,
role=alert formulaires, prefers-reduced-motion, cible tactile 44px). La vérification
du code montre que **plusieurs de ces fixes sont partiels ou inexacts** : le hook
de piège de focus n'est branché que sur 3 modales sur 12 ; le timer n'est pas une
région live ; `prefers-reduced-motion` n'est honoré en JS que par 2 composants sur
14 ; la zone sûre iOS ne décale pas le header (qui est `fixed`).

Ce qui EST réellement corrigé et vérifié (ne pas re-traiter) : `text-white/40` éliminé
(0 occurrence), skip-link cible `#main-content` existante dans `(main)` et landing,
`aria-expanded`/`aria-haspopup`/`inert` sur le menu mobile, `aria-label` sur le textarea
de chat, `role=alert` sur les erreurs de login/shipping/shop/gift, `:focus-visible`
global fort (2.4.7), `maximum-scale=5` (zoom non bloqué), bandeau PWA dismiss persistant,
indicateur « En direct / Hors ligne » réellement câblé sur `isConnected`, labels +
`autocomplete` corrects sur les formulaires, `error.tsx`/`global-error.tsx`/`loading.tsx`
présents, empty states du lobby complets.

Légende statut : OUVERT = à corriger ; RÉGRESSION = annoncé corrigé en 06-17 mais faux ;
PARTIEL = corrigé pour une partie seulement.

---

## P0

### [P0] 9 modales sur 12 n'ont aucun piège de focus, aucune fermeture Échap, aucune restauration du focus
- Fichier : `src/components/collection/CaseOpeningModal.tsx:78`, `src/components/lobby/LobbyChestsModal.tsx`, `src/components/lobby/PaymentSuccessModal.tsx:54`, `src/components/lobby/LobbyCharacterModal.tsx`, `src/components/common/CookieConsent.tsx`, `src/components/pwa/IOSInstallTour.tsx:161`, `src/components/jackpot/JackpotWidget.tsx:98`, `src/components/progression/RewardsCalendarModal.tsx:67`, `src/components/tutorial/SpotlightTour.tsx:164`
- Statut : RÉGRESSION (06-17 annonçait « ✅ CORRIGÉ — Modales sans piège de focus… » en incluant explicitement `SpotlightTour.tsx`).
- Impact : utilisateur clavier/lecteur d'écran piégé. Toutes ces vues posent `role="dialog" aria-modal="true"` mais le focus reste dans la page sous le voile : Tab sort de la boîte, Échap ne ferme pas, et à la fermeture le focus n'est PAS rendu au déclencheur (on repart en haut du document). `aria-modal="true"` ment au lecteur d'écran (il annonce une modale dont rien n'est piégé). Le SpotlightTour (tour onboarding obligatoire, anon + connecté) et l'IOSInstallTour (tuto d'install PWA, cœur de la stratégie « PWA, pas d'app native ») sont concernés : un utilisateur clavier ne peut pas naviguer le tour ni le quitter au clavier. C'est un blocage total pour la catégorie clavier-only / lecteur d'écran sur des parcours non contournables (onboarding, achat, ouverture de coffre).
- Preuve : seuls `AnonGateModal.tsx`, `CreditPacksModal.tsx`, `VIPSubscriptionModal.tsx` importent `useModalA11y` (`grep -rln useModalA11y` → 3 fichiers + le hook). Le hook existe et est correct (`src/hooks/useModalA11y.ts` : focus initial + trap Tab/Shift-Tab + Échap + restauration). Il n'est simplement pas branché ailleurs. `SpotlightTour.tsx` n'a qu'un `onClose` câblé sur un bouton « Passer » et aucun listener clavier.
- Correctif : appeler `useModalA11y(isOpen, onClose, panelRef)` dans les 9 composants (ajouter un `ref` sur le panneau). Pour SpotlightTour/IOSInstallTour : passer `onClose` (= « Passer ») comme handler Échap. Vérifier que CookieConsent ne piège pas le focus au point de bloquer la lecture de la page si non-bloquant (sinon le marquer `role="region"` plutôt que dialog).

---

## P1

### [P1] Le timer du jeu n'est jamais annoncé au lecteur d'écran (role=timer sans région live)
- Fichier : `src/app/(main)/game/[id]/game-client.tsx:481-490` et `:855-865` (les deux layouts mobile/desktop)
- Statut : RÉGRESSION (06-17 : « ✅ CORRIGÉ — Compte à rebours du timer non annoncé (pas de aria-live ni role=timer) »). `role="timer"` a bien été ajouté, mais `role="timer"` n'est PAS une région live : il ne déclenche aucune annonce. L'`aria-label` est recalculé chaque seconde, mais un changement d'`aria-label` n'est pas annoncé non plus.
- Impact : un joueur aveugle ne perçoit jamais l'urgence (« plus que 5 secondes »), ce qui est le cœur du gameplay (le dernier clic gagne). Donnée critique inaudible.
- Preuve : `role="timer"` + `aria-label={...formatTime(displayTimeLeft)}` sur un `<span>`, sans `aria-live`. `useTimer` tick à 100 ms → si on ajoutait naïvement `aria-live` ici, le lecteur d'écran serait spammé.
- Correctif : ne PAS rendre le span seconde-par-seconde live. Ajouter une région `aria-live="assertive"` SÉPARÉE et masquée (`.sr-only`) qui n'écrit qu'aux seuils utiles : à l'entrée en phase finale, puis à 30 s, 10 s, 5 s, 3-2-1 et « Temps écoulé ». Throttler les mises à jour de cette région (pas à chaque tick).

### [P1] Aucun retour lecteur d'écran sur le clic, le solde de crédits, le changement de leader ou la complétion de jauge
- Fichier : `src/app/(main)/game/[id]/game-client.tsx:207-285` (handleClick), `:481` (timer), `:671+` (boîte crédits), `src/components/game/GameClicksFeed.tsx`, `src/components/lobby/LiveClicksFeed.tsx`
- Statut : OUVERT (listé P2 en 06-17, jamais traité).
- Impact : un joueur aveugle clique « dans le vide » : pas de confirmation « clic enregistré », pas d'annonce « tu es en tête », pas de « crédit utilisé, il t'en reste N », pas de « jauge à 60 % ». Tout le feedback est purement visuel (animation `clickAnimation`, `creditsAnimation`, bursts de particules) + sonore optionnel. L'action centrale du produit n'a aucune sortie accessible.
- Preuve : `handleClick` ne touche que de l'état visuel et du son ; `grep -n 'sr-only\|aria-live'` dans game-client = 0 résultat. Le fil d'activité (`GameClicksFeed`/`LiveClicksFeed`) n'est pas une région live.
- Correctif : une région `aria-live="polite"` `.sr-only` mise à jour après réconciliation serveur : « Clic enregistré, tu es en tête. Crédits restants : N. » ; annoncer « Jauge à X % » sur changement notable ; annoncer la complétion de jauge et la victoire (la victoire ne pousse qu'un son + vibration aujourd'hui).

### [P1] Zone sûre iOS : le fix annoncé ne décale PAS le header (qui est `position: fixed`)
- Fichier : `src/app/globals.css:2607-2611` (`@media (display-mode: standalone) { body { padding-top: env(safe-area-inset-top) } }`), `src/components/layout/Header.tsx:190` (`<header class="fixed top-0 …">`)
- Statut : RÉGRESSION fonctionnelle (06-17 P1 « à traiter » ; un fix a été tenté via `viewportFit:'cover'` + padding body, mais il est inopérant pour le header).
- Impact : en PWA installée iOS (display-mode standalone, status bar `black-translucent` cf. `appleWebApp.statusBarStyle`), le contenu du header passe TOUJOURS sous l'encoche / la barre d'état. `padding-top` sur `<body>` ne déplace pas un descendant `position: fixed` (il est positionné par rapport au viewport, pas au body padé). Le commentaire dans `layout.tsx:41` affirme « le header utilise pt-[env(safe-area-inset-top)] » : c'est faux, aucune classe de ce type n'existe (`grep safe-area-inset src/` → header absent).
- Preuve : `viewport.viewportFit = 'cover'` OK (layout.tsx:42) ; mais le seul consommateur de `env(safe-area-inset-top)` est `body` ; le header `fixed top-0` n'a aucun `padding-top`/`top` lié à la zone sûre. Le spacer `<div className="h-14 lg:h-[68px]" />` est fixe lui aussi.
- Correctif : mettre la zone sûre SUR le header : `style={{ paddingTop: 'env(safe-area-inset-top)' }}` sur `<header>` et `top:0` conservé, OU `top: env(safe-area-inset-top)`. Ajuster le spacer en `calc(3.5rem + env(safe-area-inset-top))`. Retirer le `padding-top` du body (sinon double décalage) ou le garder uniquement pour le contenu non-fixe.

### [P1] 12 composants framer-motion sur 14 ignorent prefers-reduced-motion (animations JS infinies)
- Fichier : `src/app/(main)/mini-games/MiniGamesClient.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/components/landing/widgets/FloatingTimer.tsx`, `src/components/collection/CaseOpeningModal.tsx`, `src/components/lobby/PullToRefreshIndicator.tsx`, `src/components/pwa/IOSInstallTour.tsx:196-200`, `src/components/notifications/BadgeNotification.tsx`, `src/components/mini-games/WheelOfFortune.tsx`, `src/components/mini-games/ScratchCard.tsx`, `src/components/mini-games/CoinFlip.tsx`, `src/components/mini-games/SlotMachine.tsx`
- Statut : PARTIEL (06-17 ne flaggait que 2 fichiers : VIPSubscriptionModal + SpotlightTour, qui SONT corrigés). Ces deux-là honorent `useReducedMotion`. Les 12 autres avec `repeat: Infinity` ne l'importent même pas.
- Impact : WCAG 2.3.3 (Animation from Interactions, AAA) et confort vestibulaire. La règle CSS globale `@media (prefers-reduced-motion) { *,*::before,*::after { animation-duration:0.01ms!important; animation-iteration-count:1!important } }` (globals.css:583, 1530) neutralise les animations CSS, MAIS les animations JS framer-motion (`animate={{...}} transition={{ repeat: Infinity }}`) ne passent pas par CSS `animation` : elles tournent en JS (Web Animations / rAF) et échappent à cette règle. Mascotte qui flotte en boucle, roue/slot/coin qui pulsent, badge qui rebondit, pull-to-refresh qui tourne — tout reste en mouvement infini.
- Preuve : `grep -rln 'repeat: Infinity'` → 14 fichiers ; seuls SpotlightTour et VIPSubscriptionModal contiennent `useReducedMotion`. Ex. IOSInstallTour:196 `animate={{ opacity:[0.4,0.8,0.4] }} transition={{ repeat: Infinity }}` sans garde.
- Correctif : dans chaque composant, `const rm = useReducedMotion()` et `animate={rm ? undefined : {...}}` / `transition={rm ? undefined : {...}}` (pattern déjà utilisé dans VIPSubscriptionModal et SpotlightTour). Prioriser les mini-jeux (mouvement permanent) et la mascotte.

### [P1] Bouton « favori » interactif imbriqué dans le lien de carte (imbrication interactive invalide)
- Fichier : `src/components/lobby/GameCard.tsx:234-274` (`<button>` favori à l'intérieur du `<Link>` de la carte)
- Statut : OUVERT (listé P2 en 06-17, non traité ; relevé ici en P1 a11y car HTML invalide + comportement clavier cassé).
- Impact : HTML invalide (`<a>` ne peut pas contenir un `<button>` — contenu interactif imbriqué). Hydratation React fragile et surtout navigation clavier ambiguë : au clavier la carte entière est un lien, le bouton favori imbriqué n'est pas atteignable de façon fiable et l'`Entrée` déclenche le lien. Lecteurs d'écran annoncent un lien contenant un bouton (incohérent).
- Preuve : `<Link href=… >` ligne 234 enveloppe directement `<button aria-label="Ajouter aux favoris">` ligne 243. Le `e.preventDefault()` masque le bug à la souris mais pas au clavier ni pour la validité DOM.
- Correctif : sortir le bouton favori du `<Link>` (le poser en frère, positionné en absolute par-dessus la carte via un wrapper `position:relative` qui n'est pas lui-même un lien), ou transformer la carte en `<div>` cliquable avec un `<Link>` interne sur le titre uniquement.

---

## P2

### [P2] Auto-fermeture du PaymentSuccessModal en 5 s sans pause au survol/focus, et barre de progression animée sous reduced-motion
- Fichier : `src/components/lobby/PaymentSuccessModal.tsx:33-51`, `:118-126`
- Statut : OUVERT (P2 06-17).
- Impact : WCAG 2.2.1 (Timing Adjustable). La confirmation d'achat (crédits / VIP / pass) disparaît après 5 s sans possibilité de mettre en pause au survol ou au focus clavier ; un utilisateur lent à lire ou un lecteur d'écran qui n'a pas fini d'énoncer le montant perd l'info. La barre `setInterval(50ms)` tourne même en reduced-motion (mouvement non désactivable).
- Preuve : `useEffect` lance un `setInterval` inconditionnel ; pas de `onMouseEnter`/`onFocus` pour stopper ; pas de garde `prefers-reduced-motion`.
- Correctif : mettre l'auto-dismiss en pause sur `mouseenter`/`focusin` du panneau (et reprendre sur sortie), ou supprimer l'auto-dismiss (le CTA + croix suffisent). Sous reduced-motion, masquer la barre et garder un simple texte « Fermeture dans 5 s ». Brancher aussi `useModalA11y` (cf. P0).

### [P2] Contrastes texte sous le seuil AA persistants : text-white/25, /30, /35
- Fichier (échantillon) : `src/components/lobby/LobbyCharacterModal.tsx:82` (white/25), `src/components/landing/widgets/PrizesBento.tsx:227` (white/25), `src/components/landing/LandingClient.tsx:612` (white/25), `src/components/profile/PrivacyCard.tsx:84` (white/30), `src/components/gift/GiftClaim.tsx:106` (white/30), `src/components/comments/GameComments.tsx:72` (white/30, compteur 280), `src/components/modals/AnonGateModal.tsx:75` (white/35, « Jeu 100% gratuit »)
- Statut : PARTIEL (06-17 a éliminé `text-white/40`, 0 occurrence restante — vérifié — mais 16 occurrences de `/25`/`/30`/`/35` subsistent, plus 20 de `/45`).
- Impact : WCAG 1.4.3. Sur fond `#0B0F1A`, `white/25` ≈ 2.2:1, `white/30` ≈ 2.6:1, `white/35` ≈ 3.1:1 — tous échouent l'AA texte (4.5:1). `white/45` ≈ 4.4:1 est juste sous le seuil (limite). Concerne du texte informatif (compteur de caractères, notes légales/gratuité, libellés de modale).
- Preuve : comptage — `white/25`:4, `white/30`:5, `white/35`:7, `white/45`:20, `white/40`:0.
- Correctif : remonter le texte informatif à `text-white/60` minimum (4.5:1). Réserver `/45` et moins au décoratif pur (séparateurs, glyphes non porteurs d'info). Le compteur 280 du chat (`GameComments:72`) porte une info → `/60`.

### [P2] Échec de chargement de la jauge avalé silencieusement (pas d'état d'erreur ni de retry)
- Fichier : `src/app/(main)/game/[id]/game-client.tsx:148` (`getItemGauge(...).then(setGauge).catch(() => {})`)
- Statut : OUVERT (P2 06-17).
- Impact : si `getItemGauge` échoue (réseau/RLS), la fiole reste à sa valeur d'init synchrone (0 %) sans signaler l'erreur : l'utilisateur croit n'avoir aucune progression alors qu'il a peut-être payé. Risque de perception « ma progression a disparu » (sensible vu le pivot jauge = paiement progressif).
- Preuve : `.catch(() => {})` vide. Idem `checkVIPStatus().catch(() => {})` ligne 141.
- Correctif : sur échec, garder la dernière valeur connue et afficher un micro-état « impossible de charger ta progression, réessayer » avec un bouton de retry, plutôt qu'un 0 % trompeur.

### [P2] CollectionClient et LeaderboardClient masquent les échecs réseau en état « vide » au lieu d'« erreur »
- Fichier : `src/components/collection/CollectionClient.tsx:25-29` (`load`), `src/components/leaderboard/LeaderboardClient.tsx:33-38`
- Statut : OUVERT (nouveau ; le 06-17 a corrigé le full-page spinner via SSR-first, mais pas la gestion d'erreur).
- Impact : dans LeaderboardClient, un échec de `getLeaderboard` fait `setRows([])` → l'UI affiche un classement « vide » (faux négatif), pas une erreur. Dans CollectionClient, `load()` en échec ne met à jour ni les données ni d'erreur : après une action (équiper, ouvrir un coffre), l'UI reste figée sur l'état précédent sans feedback. Pas de spinner infini (bien), mais confusion possible.
- Preuve : `setRows(lb.success && lb.data ? lb.data : [])` ; `load` ne traite pas `res.success === false`.
- Correctif : distinguer « vide » de « erreur » : sur `!success`, afficher un état d'erreur réessayable plutôt qu'un tableau vide ou un état figé.

### [P2] Hiérarchie de titres : lobby sans h1, page de jeu avec deux h1
- Fichier : `src/app/(main)/lobby/page.tsx` + `LobbyClient` (aucun `<h1>`), `src/app/(main)/game/[id]/game-client.tsx` (deux `<h1>`, un par layout mobile/desktop dupliqué)
- Statut : OUVERT (non relevé en 06-17 ; corollaire de la duplication mobile/desktop reportée).
- Impact : WCAG 1.3.1 / 2.4.6. Le lobby (page d'atterrissage du parcours connecté) n'a pas de titre de niveau 1 → navigation par titres au lecteur d'écran sans point d'entrée. La page de jeu rend les deux layouts (mobile masqué desktop et vice-versa via CSS), donc DEUX `<h1>` dans le DOM ; les lecteurs d'écran ignorent le `display:none` partiellement et peuvent voir deux titres principaux.
- Preuve : `grep -c '<h1'` → lobby/page.tsx:0, LobbyClient:0, game-client.tsx:2.
- Correctif : ajouter un `<h1>` (visible ou `.sr-only`) au lobby (« Parties en cours »). Pour la page de jeu, soit fusionner les layouts (refactor reporté en 06-17), soit ne garder qu'un `<h1>` et passer le second en `<p>`/`<h2>`.

### [P2] Petites cibles tactiles : croix VIP, clear de recherche, bouton retour lobby, croix menu mobile
- Fichier : `src/components/modals/VIPSubscriptionModal.tsx:64-70` (croix `p-1.5` + icône 16px ≈ 28px), `src/components/lobby/SearchBar.tsx` (clear ~20px, retour ~40px), `src/components/layout/Header.tsx:392-400` (croix menu `w-8 h-8` = 32px)
- Statut : PARTIEL (06-17 a corrigé CreditPacksModal → `h-11 w-11` = 44px, vérifié ; mais VIP/SearchBar/menu restent < 44px).
- Impact : WCAG 2.5.8 (Target Size Minimum, 24px) souvent OK, mais < l'objectif 44px mobile recommandé ; difficile à viser au pouce, surtout la croix VIP (28px) et le clear recherche (20px < 24px → échoue 2.5.8).
- Preuve : VIP `className="… p-1.5 …"` avec `<X size={16}/>` ; menu croix `w-8 h-8`.
- Correctif : porter ces zones cliquables à `h-11 w-11` (ou padding pour atteindre 44px) comme CreditPacksModal. Le clear de SearchBar doit au minimum dépasser 24px.

### [P2] Service worker sans cache : aucune expérience hors-ligne (mais aussi aucun cache stale dangereux)
- Fichier : `public/sw.js` (aucun `addEventListener('fetch')`, aucune API Cache)
- Statut : OUVERT (constat ; arbitrage produit).
- Impact : le SW ne sert qu'au push et au focus de fenêtre. Hors-ligne, la PWA installée affiche l'erreur navigateur brute (pas de page offline). Point POSITIF et important : comme il n'y a AUCUN cache de réponses, il n'y a AUCUN risque de servir des prix/soldes/jauges périmés (préoccupation explicite de l'audit) — c'est sain pour un produit temps réel + paiement. Le compromis est l'absence totale d'offline.
- Preuve : `grep "addEventListener('fetch'|caches\." public/sw.js` → aucun résultat.
- Correctif (optionnel) : ajouter UNIQUEMENT un fallback offline pour la coquille (page `/offline` + assets statiques versionnés), en network-first et en EXCLUANT explicitement `/api/*`, les pages de jeu, le solde et la jauge (ne JAMAIS mettre en cache de données de prix/temps réel). Sinon documenter le choix « PWA online-only ».

### [P2] Manifest PWA : pas d'icône `maskable`, pas de `screenshots`
- Fichier : `public/manifest.json:11-24`
- Statut : OUVERT.
- Impact : les deux icônes sont `purpose: "any"`. Sans variante `maskable`, Android applique un masque adaptatif qui peut rogner le logo (mauvais rendu sur l'écran d'accueil). Absence de `screenshots` → fiche d'installation moins riche (et pas d'invite enrichie sur Chrome).
- Preuve : `"purpose": "any"` sur icon-192 et icon-512, pas d'entrée `maskable`, pas de clé `screenshots`.
- Correctif : ajouter une icône `purpose: "maskable"` (avec safe-zone) et 1-2 `screenshots` (mobile portrait). L'`apple-touch-icon.png` (180px) est bien présent côté iOS.

---

## P3

### [P3] Emoji utilisés dans l'UI (icônes d'items/slots de la Collection) — violation règle de marque « pas d'emoji UI »
- Fichier : `src/components/collection/rarity.ts:16,32-33` (🪖🛡️💍🔮👑🐲💎… comme icônes de slots et pool de cosmétiques)
- Statut : OUVERT (conformité de marque).
- Impact : la mémoire produit impose « aucun emoji UI, Lucide ou texte seul ». Ces emojis sont rendus dans la grille Collection / équipement. Incohérence visuelle avec le reste (Lucide + pixel art) et rendu cross-plateforme imprévisible (un emoji n'est pas un asset maîtrisé). Note : l'app utilise par ailleurs du pixel art pour les visuels de jeu — ces emojis devraient être des sprites pixel ou des icônes Lucide.
- Preuve : `grep -P '[emoji range]'` → `rarity.ts` mappe slots et items sur des emojis.
- Correctif : remplacer par des `PixelSprite`/`ItemIcon` (déjà existants) ou des icônes Lucide. `✓` (ShippingAddressForm:206, BadgesSection:333) et `⚠️` (AdminDashboard, admin-only) sont des glyphes mineurs/hors parcours public — basse priorité.

### [P3] Em-dash (—) présent dans 55 fichiers TSX, dont du copy user-facing
- Fichier : 55 fichiers `.tsx` (ex. `AnonGateModal.tsx`, `Header.tsx`, `GameCard.tsx`, `LobbyHeader.tsx`, `PackCard.tsx`, `LeaderboardClient.tsx`…)
- Statut : OUVERT (confiance FAIBLE — voir nuance).
- Impact : le prompt demande de flagger l'em-dash dans le copy. NUANCE : la règle « pas d'em-dash » (`feedback_no_em_dash`) est documentée pour Devoria, PAS pour Cleekzy, et la DA Cleekzy semble utiliser `—` volontairement comme séparateur stylistique (ex. « ×N — explication », « Étape i sur N »). À traiter comme cohérence éditoriale à confirmer avec le porteur, pas comme bug.
- Preuve : `grep -rl '—' src` → 55 tsx.
- Correctif : décision éditoriale. Si on suit la règle Devoria, remplacer par « , » / « : » / « · » dans le copy de phrase ; conserver `—` comme glyphe de séparation décoratif. Sinon, ne rien changer (DA assumée).

### [P3] Code postal en `type="text"` sans `inputMode="numeric"` (clavier mobile non optimal)
- Fichier : `src/components/forms/ShippingAddressForm.tsx:126-137`
- Statut : OUVERT (mineur).
- Impact : sur mobile, le champ code postal ouvre un clavier alphanumérique au lieu du pavé numérique. Friction de saisie sur le formulaire de livraison (étape sensible : réception du lot gagné).
- Preuve : `<input type="text" maxLength={5} autoComplete="postal-code">` sans `inputMode`.
- Correctif : ajouter `inputMode="numeric"` (et éventuellement `pattern="[0-9]{5}"`). Le téléphone est déjà `type="tel"` (OK).

---

## Vérifié OK (ne pas re-traiter)

- `text-white/40` : 0 occurrence (contraste 06-17 réellement appliqué).
- Skip-link : cible `#main-content` présente dans `(main)/layout.tsx:64` et `LandingClient.tsx:292` ; style sr-only→focus correct.
- Menu mobile : `aria-expanded`, `aria-haspopup="menu"`, `inert`/`aria-hidden` quand fermé, scroll-lock body — corrects (`Header.tsx:202-207, 354-355`).
- `:focus-visible` global double-anneau (globals.css:106) — fort, WCAG 2.4.7/1.4.11 OK.
- `maximum-scale=5` (layout.tsx:39) — zoom NON bloqué (bien ; ne pas passer à 1).
- `lang="fr"` sur `<html>` (layout.tsx:137).
- `role=alert` sur erreurs login/register/forgot/reset/shipping/shop/gift/comments — présents.
- Indicateur realtime « En direct / Hors ligne » réellement câblé sur `isConnected` (game-client:360-363) — la déconnexion temps réel EST visible (améliorable en région live mais pas un trou).
- Animations CSS sous reduced-motion : règle universelle `* { animation-duration:0.01ms!important; animation-iteration-count:1!important }` (globals.css:583) + gardes ciblées (gauge-magma 2599, god-rays 1831) — CSS bien couvert ; le trou est uniquement côté JS (cf. P1).
- Empty states du lobby complets (LobbyClient:497-517 : aucune partie / favori / phase finale / à venir / premium / terminée).
- `error.tsx` (main), `global-error.tsx`, `not-found.tsx`, et `loading.tsx` (auth/lobby/profile/mini-games/game) présents.
- Formulaires : `<label htmlFor>` + `autoComplete` corrects partout (shipping, login, register).
- Modales du dossier `src/components/modals/` (Anon/CreditPacks/VIP) : focus trap branché et croix CreditPacks à 44px (h-11 w-11).
- SW sans cache de réponses authentifiées → aucun risque de prix/jauge stale (point positif sécurité UX).

---

## Synthèse

| Sévérité | Nombre |
|----------|--------|
| P0 | 1 |
| P1 | 5 |
| P2 | 8 |
| P3 | 3 |
| **Total** | **17** |

Fil rouge : l'audit 06-17 a sur-déclaré plusieurs lots a11y « corrigés ». Le hook
`useModalA11y` est bon mais n'est branché que sur 3 modales (P0). Le `role="timer"`
et le `prefers-reduced-motion` ont été appliqués trop étroitement (P1). Le fix de
zone sûre iOS cible le mauvais élément (P1). Les fondations existent (skip-link,
focus-visible, labels, error/loading boundaries, indicateur realtime) — il faut
généraliser les patterns déjà écrits, pas en inventer.
