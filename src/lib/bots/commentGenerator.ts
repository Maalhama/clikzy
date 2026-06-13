/**
 * Générateur de commentaires de bots — crédibles, variés, pour l'ambiance.
 * Ton : joueurs FR d'une arène d'enchères « dernier clic gagne ».
 * Déterministe (seed) pour ne pas flicker au re-render. Pas d'emoji (DA Cleekzy).
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
]

const SALT = [
  'Encore raté hier de justesse…',
  'Snipé à 2 secondes, j’y crois pas',
  'J’ai cligné des yeux et c’était fini',
  'Qui m’a piqué mon lot là',
  'Rageant ce timer',
  'J’avais dit que j’arrêtais… un dernier',
  'Toujours sniper au pire moment',
]

const GG = [
  'GG à celui qui tient',
  'Bien joué le gagnant, respect',
  'Chapeau, belle partie',
  'Trop fort, je m’incline',
  'Respect à celui qui a tenu jusqu’au bout',
  'Bien défendu ce lot',
]

const NEWBIE = [
  'Première fois que je joue, c’est addictif',
  'J’ai gagné un truc la semaine dernière, ça marche vraiment',
  'Comment on fait pour gagner déjà ?',
  'Mon café et Cleekzy le matin, le combo',
  'Je suis accro à ce jeu au secours',
  'Reçu mon colis hier, nickel',
  'Un pote m’a dit que c’était truqué, je confirme que non',
]

const TIMING = [
  'Go go go dernière ligne droite',
  'Maintenant ou jamais',
  'Plus que quelques secondes, accrochez-vous',
  'C’est le moment',
  'Allez un dernier clic et j’arrête (promis)',
  'On y est presque',
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
]

const GENERIC = [...HYPE, ...STRATEGY, ...SALT, ...GG, ...NEWBIE, ...TIMING]

/** Garde 3 mots max pour rester naturel dans une phrase. */
function shortName(name: string): string {
  return name.split(' ').slice(0, 3).join(' ')
}

/**
 * Renvoie un message crédible et varié. ~40% des messages mentionnent l'item
 * (si fourni). La sélection est étalée sur tout le pool via le seed → peu de répétitions.
 */
export function generateBotComment(seed: number, itemName?: string): string {
  const s = Math.abs(Math.trunc(seed))
  const useItem = !!itemName && itemName.length > 0 && s % 5 < 2
  if (useItem) {
    const tmpl = ITEM[Math.floor(s / 7) % ITEM.length]
    return tmpl.replace('{item}', shortName(itemName!))
  }
  return GENERIC[Math.floor(s / 3) % GENERIC.length]
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

function hashStr(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
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
 * Timestamps étalés sur la dernière ~heure. À appeler côté client (useEffect)
 * pour éviter tout mismatch d'hydratation.
 */
export function seedBotComments(games: SeedGame[], count: number, nowMs: number): BotComment[] {
  const usable = games.filter((g) => g.item)
  if (usable.length === 0) return []
  const out: BotComment[] = []
  for (let i = 0; i < count; i++) {
    const g = usable[(i * 3 + 1) % usable.length]
    const ageMs = Math.floor(((i + 1) / (count + 1)) * 55 * 60 * 1000) + ((i * 7919) % 90000)
    const c = buildBotComment(g, `seed-${i}`, nowMs - ageMs)
    if (c) out.push(c)
  }
  return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export type SeededComment = { id: string; username: string; content: string; created_at: string }

/** Lot de commentaires bots pour la discussion d'UNE partie (page de jeu). */
export function seedGameComments(gameId: string, itemName: string, count: number, nowMs: number): SeededComment[] {
  const out: SeededComment[] = []
  for (let i = 0; i < count; i++) {
    const seed = hashStr(`${gameId}-g${i}`)
    const ageMs = Math.floor(((i + 1) / (count + 1)) * 25 * 60 * 1000) + ((i * 6131) % 45000)
    out.push({
      id: `botg-${gameId}-${i}`,
      username: generateDeterministicUsername(`${gameId}-g${i}-cmt`),
      content: generateBotComment(seed, itemName),
      created_at: new Date(nowMs - ageMs).toISOString(),
    })
  }
  return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}
