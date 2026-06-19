/**
 * Générateur de commentaires de bots — crédibles, variés, pour l'ambiance.
 * Ton : joueurs FR d'une arène d'enchères « dernier clic gagne ».
 * Déterministe (seed) pour ne pas flicker au re-render. Pas d'emoji (DA Cleekzy).
 *
 * Pools volontairement larges (~200 phrases) + sélection sans répétition pour les
 * lots affichés d'un coup : on évite les doublons visibles dans un même feed / une
 * même discussion, tout en gardant des messages cohérents avec le reste.
 */

import { generateDeterministicUsername } from '@/lib/bots/usernameGenerator'

const HYPE = [
  'Allez c’est parti, je tente ma chance',
  'Cette partie est complètement folle',
  'Ça chauffe sévère là',
  'Y a trop de monde sur ce lot',
  'Je le sens bien ce coup-ci',
  'On lâche rien les amis',
  'Quelle bataille de fou',
  'Ça part dans tous les sens',
  'Grosse ambiance sur cette partie',
  'Je suis à fond là',
  'Ça envoie du lourd ce soir',
  'Jamais vu autant de monde sur un lot',
  'C’est la guerre sur cette enchère',
  'Mes mains tremblent je vous jure',
  'On est combien à viser ce truc sérieux',
  'Le rythme est dingue là',
  'Impossible de lâcher mon téléphone',
  'Ça clique de partout, c’est magnifique',
  'Première partie de la soirée, motivé',
  'Je sens que ça va se jouer à rien',
  'Adrénaline à fond, j’adore',
  'Trop tendu ce duel',
  'Ça spamme dur en ce moment',
  'Tout le monde est réveillé apparemment',
  'Ce lot rend les gens fous',
  'On dirait que personne veut lâcher',
  'Le suspense me tue',
  'Ambiance de feu ce soir',
  'Allez, qui tient avec moi',
  'Ça part vite je m’accroche',
  'Soirée tranquille puis je tombe là-dessus',
  'Je devais dormir mais bon',
  'Cette manche est épique',
  'Plus chaud tu meurs',
  'On se calme pas du tout là',
  'Ça pousse fort de tous les côtés',
]

const STRATEGY = [
  'Je clique au dernier moment, vous allez voir',
  'Patience… patience…',
  'Lâchez l’affaire les gars, il est pour moi',
  'Celui qui me snipe je le retiens',
  'Je garde mes crédits pour la fin',
  'Faut être là à la bonne seconde',
  'Je reviens ce soir pour le finir',
  'Bluff total, je suis encore là',
  'Vous cliquez trop tôt les amis',
  'Le secret c’est la patience',
  'Je laisse les autres se fatiguer',
  'Économie de crédits, je vise la fin',
  'Je note qui clique, je prépare ma riposte',
  'On verra qui tient le plus longtemps',
  'Je reste planqué pour l’instant',
  'Mon plan est en place, surprise à la fin',
  'Je clique pas pour rien moi',
  'Chacun sa technique, la mienne marche',
  'Je laisse mijoter encore un peu',
  'Faut savoir attendre le bon moment',
  'Je garde mes munitions',
  'Trop tôt pour sortir l’artillerie',
  'Je joue la montre ce coup-ci',
  'Le timing c’est tout dans ce jeu',
  'Je vous observe, je vous observe',
  'Patience récompensée, vous allez voir',
  'Je clique que quand ça compte',
  'Stratégie du sniper, comme d’hab',
  'Je laisse les impatients se cramer',
  'Encore un peu et je passe à l’attaque',
  'Je suis pas pressé, le lot va tomber',
  'Calme avant la tempête',
  'Je prépare mon dernier clic tranquille',
  'Tout est question de sang-froid',
  'Je connais le truc maintenant',
  'Discret mais bien présent',
]

const SALT = [
  'Encore raté hier de justesse…',
  'Snipé à 2 secondes, j’y crois pas',
  'J’ai cligné des yeux et c’était fini',
  'Qui m’a piqué mon lot là',
  'Rageant ce timer',
  'J’avais dit que j’arrêtais… un dernier',
  'Toujours snipé au pire moment',
  'Pas possible d’être malchanceux à ce point',
  'Trois fois que je perds ce soir, aïe',
  'Mon doigt a glissé, voilà voilà',
  'J’étais sûr de l’avoir celui-là',
  'La rage quand tu perds au dernier clic',
  'Bon ben encore loupé, bravo moi',
  'Pourquoi je clique toujours une seconde trop tôt',
  'On m’a volé la victoire là c’est sûr',
  'Mon wifi a lagué au pire moment évidemment',
  'J’ai pas vu le temps passer, perdu',
  'Sérieux qui clique aussi vite',
  'Encore deuxième, ça devient une habitude',
  'Je vais finir par y arriver un jour',
  'Les nerfs ce timer franchement',
  'À une seconde près, je vais pleurer',
  'Plus de crédits au pire moment, classique',
  'Loupé pour trois fois rien',
  'Quelqu’un d’autre est maudit comme moi ?',
  'Je rage mais je reviens demain',
  'Le sniper de service a encore frappé',
  'Bon, la prochaine est pour moi promis',
]

const GG = [
  'GG à celui qui tient',
  'Bien joué le gagnant, respect',
  'Chapeau, belle partie',
  'Trop fort, je m’incline',
  'Respect à celui qui a tenu jusqu’au bout',
  'Bien défendu ce lot',
  'Bravo l’artiste, méritée celle-là',
  'Beau sang-froid le gagnant',
  'GG bien joué, à la prochaine',
  'Joli, tu l’as bien volé celui-là',
  'Propre, rien à dire',
  'Bien tenu, je reconnais',
  'Félicitations, belle bataille',
  'Respect, j’ai rien pu faire',
  'Le meilleur a gagné ce coup-ci',
  'GG les amis, c’était chaud',
  'Bravo, tu mérites ton lot',
  'Belle stratégie, chapeau bas',
  'On remet ça quand tu veux, GG',
  'Bien mérité, sans rancune',
  'Joli timing le gagnant',
  'GG, revanche à la prochaine partie',
]

const NEWBIE = [
  'Première fois que je joue, c’est addictif',
  'J’ai gagné un truc la semaine dernière, ça marche vraiment',
  'Comment on fait pour gagner déjà ?',
  'Mon café et Cleekzy le matin, le combo',
  'Je suis accro à ce jeu au secours',
  'Reçu mon colis hier, nickel',
  'Un pote m’a dit que c’était truqué, je confirme que non',
  'Je débute, des conseils les pros ?',
  'C’est ma deuxième partie, j’adore déjà',
  'On m’a parlé du site, je comprends pourquoi',
  'Livraison rapide pour mon dernier lot, top',
  'Je pensais que c’était une arnaque, en fait non',
  'Première victoire hier, encore sous le choc',
  'C’est plus prenant que je pensais',
  'Quelqu’un peut m’expliquer la phase finale ?',
  'Je suis là depuis une heure sans m’en rendre compte',
  'Mon frère m’a mis au défi, me voilà',
  'Sympa la communauté ici',
  'Je teste depuis ce matin, conquis',
  'C’est quoi votre meilleur lot gagné ?',
  'Reçu ma montre la semaine dernière, je valide',
  'Débutant mais motivé, je m’accroche',
  'Première soirée ici, ça passe crème',
  'On gagne vraiment des trucs alors ? cool',
  'Je recommande à mes potes direct',
  'Trois jours que je joue, déjà fan',
  'Le concept est génial je trouve',
  'Petit nouveau, soyez sympas hein',
]

const TIMING = [
  'Go go go dernière ligne droite',
  'Maintenant ou jamais',
  'Plus que quelques secondes, accrochez-vous',
  'C’est le moment',
  'Allez un dernier clic et j’arrête (promis)',
  'On y est presque',
  'Ça se joue maintenant les amis',
  'Dernière chance, je fonce',
  'Le timer descend, accrochez-vous',
  'C’est chaud là, très chaud',
  'Tout se joue dans les dernières secondes',
  'Je lâche pas si près du but',
  'Allez allez allez',
  'On touche au but, courage',
  'La fin approche, qui tient ?',
  'Plus le droit à l’erreur maintenant',
  'Dernier sprint, je donne tout',
  'Ça va le faire, je le sens',
  'Encore quelques clics et c’est plié',
  'Le money time, on y est',
  'Tenez bon, c’est presque fini',
  'Là c’est la vraie bataille',
  'Compte à rebours lancé, accrochez-vous',
  'On lâche rien si près de la fin',
]

const ITEM = [
  'Le {item} il me le faut absolument',
  '{item} à ce prix c’est cadeau',
  'Je vise le {item} depuis ce matin',
  'Quelqu’un d’autre veut le {item} ?',
  'Ce {item} sera à moi, vous verrez',
  'J’ai toujours voulu un {item}',
  'Le {item} pour quelques centimes, faut tenter',
  'Pas touche au {item} les gars',
  'Le {item} en jeu, je peux pas résister',
  'Tellement envie de ce {item}',
  'Le {item} c’est exactement ce qu’il me faut',
  'Ça fait longtemps que je rêve d’un {item}',
  'Le {item} à ce tarif, je rêve',
  'Qui me laisse le {item} gentiment ?',
  'Le {item} pour moi, vous insistez pas',
  'Un {item} comme ça, ça se rate pas',
  'Je clique pour le {item} jusqu’au bout',
  'Le {item} hante mes nuits là',
  'Allez le {item} tombe pour moi ce soir',
  'Le {item} mérite qu’on se batte',
  'J’offre le {item} si je gagne, promis',
  'Le {item} ce serait le cadeau parfait',
  'On se calme tous sur le {item} s’il vous plaît',
  'Le {item} m’appelle, je résiste pas',
  'Première fois que je vois un {item} ici',
  'Le {item} à ce prix faut être fou pour pas tenter',
  'Je revends pas le {item}, je le garde',
  'Le {item} c’est mon objectif du jour',
  'Croisez les doigts pour mon {item}',
  'Le {item} ou rien ce soir',
]

const GENERIC = [...HYPE, ...STRATEGY, ...SALT, ...GG, ...NEWBIE, ...TIMING]

/** Garde 3 mots max pour rester naturel dans une phrase. */
function shortName(name: string): string {
  return name.split(' ').slice(0, 3).join(' ')
}

function hashStr(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

/** Mélange déterministe (Fisher-Yates + LCG seedé) : même salt => même ordre. */
function shuffleDeterministic<T>(arr: readonly T[], salt: string): T[] {
  const a = arr.slice()
  let h = hashStr(salt) || 1
  for (let i = a.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    const j = h % (i + 1)
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

/** Pool de contenus possibles pour une discussion (génériques + templates item résolus). */
function contentPool(itemName?: string): string[] {
  if (itemName && itemName.length > 0) {
    const short = shortName(itemName)
    return [...GENERIC, ...ITEM.map((t) => t.replace('{item}', short))]
  }
  return [...GENERIC]
}

/** Âge étalé (du plus récent au plus ancien) avec un peu de jitter déterministe. */
function spreadAgeMs(i: number, count: number, spanMin: number, jitterMod: number): number {
  return Math.floor(((i + 1) / (count + 1)) * spanMin * 60 * 1000) + ((i * 7919) % jitterMod)
}

/**
 * Renvoie un message crédible et varié. ~40% des messages mentionnent l'item
 * (si fourni). Le seed est fortement mélangé (Knuth) pour bien étaler la sélection
 * sur tout le pool et limiter les répétitions sur les appels successifs (simulation).
 */
export function generateBotComment(seed: number, itemName?: string): string {
  const s = Math.abs(Math.trunc(seed))
  const mixed = Math.imul(s ^ 0x9e3779b1, 2654435761) >>> 0
  const useItem = !!itemName && itemName.length > 0 && s % 5 < 2
  if (useItem) {
    const tmpl = ITEM[mixed % ITEM.length]
    return tmpl.replace('{item}', shortName(itemName!))
  }
  return GENERIC[mixed % GENERIC.length]
}

export type BotComment = {
  id: string
  username: string
  content: string
  created_at: string
  game_id: string
  item_name: string
  item_image: string
}

type SeedGame = { id: string; item: { name: string; image_url: string } | null }

/** Construit un commentaire bot (forme CommentFeedItem) pour une partie. */
export function buildBotComment(game: SeedGame, key: string, atMs: number): BotComment | null {
  if (!game.item) return null
  const seed = hashStr(`${game.id}-${key}`)
  return {
    id: `bot-${game.id}-${key}`,
    username: generateDeterministicUsername(`${game.id}-${key}-cmt`),
    content: generateBotComment(seed, game.item.name),
    created_at: new Date(atMs).toISOString(),
    game_id: game.id,
    item_name: game.item.name,
    item_image: game.item.image_url,
  }
}

/**
 * Lot initial de commentaires bots pour que le feed soit vivant dès l'arrivée.
 * Timestamps étalés sur la dernière ~heure. Sans doublon de contenu dans le lot
 * (on régénère avec une clé décalée si une phrase retombe). À appeler côté client
 * (useEffect) pour éviter tout mismatch d'hydratation.
 */
export function seedBotComments(games: SeedGame[], count: number, nowMs: number): BotComment[] {
  const usable = games.filter((g) => g.item)
  if (usable.length === 0) return []
  const out: BotComment[] = []
  const seen = new Set<string>()
  for (let i = 0; i < count; i++) {
    const g = usable[(i * 3 + 1) % usable.length]
    const ageMs = spreadAgeMs(i, count, 55, 90000)
    let c = buildBotComment(g, `seed-${i}`, nowMs - ageMs)
    let guard = 0
    while (c && seen.has(c.content) && guard < 12) {
      guard++
      c = buildBotComment(g, `seed-${i}-${guard}`, nowMs - ageMs)
    }
    if (c) {
      seen.add(c.content)
      out.push(c)
    }
  }
  return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export type SeededComment = { id: string; username: string; content: string; created_at: string }

/**
 * Lot de commentaires bots pour la discussion d'UNE partie (page de jeu).
 * Sélection sans répétition : on mélange le pool de façon déterministe (clé = partie)
 * puis on prend les `count` premiers => zéro doublon tant que count <= taille du pool.
 */
export function seedGameComments(gameId: string, itemName: string, count: number, nowMs: number): SeededComment[] {
  const pool = shuffleDeterministic(contentPool(itemName), `gc-${gameId}`)
  const out: SeededComment[] = []
  for (let i = 0; i < count; i++) {
    const content = pool[i % pool.length]
    const ageMs = spreadAgeMs(i, count, 25, 45000)
    out.push({
      id: `botg-${gameId}-${i}`,
      username: generateDeterministicUsername(`${gameId}-g${i}-cmt`),
      content,
      created_at: new Date(nowMs - ageMs).toISOString(),
    })
  }
  return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}
