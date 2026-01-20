/**
 * Générateur de pseudos réalistes et crédibles
 * Inclut des prénoms français, ibériques, maghrébins et africains
 */

// Prénoms français masculins
const FRENCH_MALE = [
  'Lucas', 'Hugo', 'Theo', 'Nathan', 'Mathis', 'Enzo', 'Louis', 'Gabriel',
  'Thomas', 'Antoine', 'Maxime', 'Alexandre', 'Quentin', 'Nicolas', 'Julien',
  'Clement', 'Romain', 'Kevin', 'Dylan', 'Florian', 'Alexis', 'Jordan',
  'Pierre', 'Paul', 'Baptiste', 'Valentin', 'Adrien', 'Bastien', 'Corentin',
  'Damien', 'Fabien', 'Gauthier', 'Guillaume', 'Hadrien', 'Jérémy', 'Kylian',
  'Léo', 'Mathieu', 'Nolan', 'Olivier', 'Raphaël', 'Sébastien', 'Tristan',
  'Vincent', 'Xavier', 'Yann', 'Yanis', 'Loïc', 'Tanguy', 'Erwan', 'Gaël',
  'Axel', 'Evan', 'Ethan', 'Noah', 'Timéo', 'Sacha', 'Maël', 'Tom', 'Adam',
]

// Prénoms français féminins
const FRENCH_FEMALE = [
  'Emma', 'Léa', 'Chloé', 'Manon', 'Camille', 'Sarah', 'Julie', 'Marie',
  'Laura', 'Marion', 'Pauline', 'Morgane', 'Clara', 'Océane', 'Lisa', 'Anaïs',
  'Lucie', 'Inès', 'Jade', 'Zoé', 'Louise', 'Alice', 'Juliette', 'Lola',
  'Charlotte', 'Margot', 'Clémence', 'Eva', 'Mathilde', 'Nina', 'Rose', 'Victoire',
  'Agathe', 'Ambre', 'Audrey', 'Aurélie', 'Céline', 'Diane', 'Elodie', 'Fanny',
  'Gaëlle', 'Héloïse', 'Iris', 'Justine', 'Katia', 'Laetitia', 'Maëlle', 'Noémie',
  'Ophélie', 'Priscilla', 'Romane', 'Solène', 'Tiphaine', 'Vanessa', 'Wendy',
  'Yasmine', 'Zélie', 'Apolline', 'Capucine', 'Cassandre', 'Lina', 'Mila', 'Nour',
]

// Prénoms ibériques (espagnols/portugais) masculins
const IBERIAN_MALE = [
  'Pablo', 'Diego', 'Carlos', 'Miguel', 'Alejandro', 'Javier', 'Sergio', 'Daniel',
  'David', 'Adrián', 'Álvaro', 'Andrés', 'Bruno', 'César', 'Eduardo', 'Fernando',
  'Gabriel', 'Gonzalo', 'Héctor', 'Iván', 'Jorge', 'José', 'Juan', 'Luis',
  'Manuel', 'Marco', 'Mario', 'Mateo', 'Nicolás', 'Oscar', 'Pedro', 'Rafael',
  'Raúl', 'Ricardo', 'Roberto', 'Rodrigo', 'Salvador', 'Santiago', 'Víctor',
  'Iker', 'Enzo', 'Thiago', 'Gael', 'Leo', 'Hugo', 'Luca', 'Martín', 'Tomás',
  // Portugais
  'João', 'Tiago', 'Rui', 'Nuno', 'Diogo', 'Gonçalo', 'Bernardo', 'Afonso',
  'Duarte', 'Vasco', 'Simão', 'Renato', 'Fábio', 'André', 'Filipe', 'Francisco',
]

// Prénoms ibériques féminins
const IBERIAN_FEMALE = [
  'María', 'Carmen', 'Ana', 'Isabel', 'Laura', 'Lucía', 'Elena', 'Paula',
  'Marta', 'Alba', 'Andrea', 'Sofía', 'Sara', 'Claudia', 'Irene', 'Silvia',
  'Cristina', 'Patricia', 'Raquel', 'Verónica', 'Mónica', 'Beatriz', 'Rosa',
  'Nuria', 'Pilar', 'Alicia', 'Julia', 'Rocío', 'Teresa', 'Natalia', 'Eva',
  'Adriana', 'Alejandra', 'Ángela', 'Daniela', 'Diana', 'Esther', 'Gloria',
  'Helena', 'Inés', 'Jessica', 'Leticia', 'Lourdes', 'Marina', 'Noelia',
  // Portugais
  'Mariana', 'Carolina', 'Beatriz', 'Inês', 'Catarina', 'Rita', 'Leonor',
  'Matilde', 'Francisca', 'Mafalda', 'Constança', 'Madalena', 'Bianca',
]

// Prénoms maghrébins masculins
const MAGHREBI_MALE = [
  'Mohamed', 'Ahmed', 'Youssef', 'Omar', 'Ali', 'Ibrahim', 'Karim', 'Mehdi',
  'Amine', 'Ayoub', 'Bilal', 'Hamza', 'Ismail', 'Malik', 'Nassim', 'Rachid',
  'Samir', 'Sofiane', 'Tarik', 'Walid', 'Yacine', 'Zakaria', 'Abdel', 'Adil',
  'Aziz', 'Driss', 'Farid', 'Hicham', 'Ilyas', 'Jalil', 'Khalid', 'Lotfi',
  'Mourad', 'Nabil', 'Reda', 'Sami', 'Selim', 'Slim', 'Wael', 'Yassine',
  'Anis', 'Badis', 'Chakib', 'Djamel', 'Elias', 'Fares', 'Ghani', 'Hakim',
  'Idir', 'Jad', 'Kamel', 'Lamine', 'Marwan', 'Nadir', 'Othmane', 'Rayan',
  'Saber', 'Tahar', 'Wassim', 'Yazid', 'Ziad', 'Anas', 'Imran', 'Nizar',
  'Rayane', 'Samy', 'Yanis', 'Adam', 'Amir', 'Naïm', 'Rami', 'Sélim',
]

// Prénoms maghrébins féminins
const MAGHREBI_FEMALE = [
  'Fatima', 'Amina', 'Khadija', 'Layla', 'Nadia', 'Samira', 'Yasmine', 'Zineb',
  'Aicha', 'Asma', 'Dalia', 'Hafsa', 'Hanane', 'Imen', 'Jamila', 'Karima',
  'Latifa', 'Malika', 'Meryem', 'Nabila', 'Nour', 'Rachida', 'Rim', 'Salma',
  'Siham', 'Soukaina', 'Wafa', 'Zahra', 'Amira', 'Basma', 'Chaima', 'Dounia',
  'Farah', 'Ghizlane', 'Hajar', 'Ikram', 'Jihane', 'Kawtar', 'Lina', 'Mariam',
  'Nawal', 'Oumaima', 'Rania', 'Sanae', 'Soraya', 'Wissal', 'Yousra', 'Aya',
  'Inès', 'Lyna', 'Maïssa', 'Manel', 'Sara', 'Sofia', 'Alya', 'Nora', 'Léna',
]

// Prénoms africains masculins (Afrique subsaharienne)
const AFRICAN_MALE = [
  'Mamadou', 'Moussa', 'Ibrahima', 'Ousmane', 'Abdoulaye', 'Seydou', 'Cheikh',
  'Amadou', 'Modou', 'Aliou', 'Babacar', 'Boubacar', 'Demba', 'Doudou', 'Elhadj',
  'Fallou', 'Gorgui', 'Habib', 'Idrissa', 'Lamine', 'Malick', 'Ndongo', 'Pape',
  'Samba', 'Thierno', 'Youssou', 'Abdou', 'Assane', 'Bamba', 'Cheikhou', 'Diallo',
  'Fodé', 'Ismaïla', 'Kéba', 'Mbaye', 'Ndiaye', 'Oumar', 'Pathé', 'Sadio',
  // Afrique centrale/ouest
  'Kwame', 'Kofi', 'Yao', 'Koffi', 'Issa', 'Bakary', 'Tidiane', 'Souleymane',
  'Kalidou', 'Edouard', 'Wilfried', 'Serge', 'Christian', 'Patrick', 'Didier',
  'Samuel', 'Emmanuel', 'Francis', 'Kevin', 'Bryan', 'Junior', 'Prince', 'Cédric',
]

// Prénoms africains féminins
const AFRICAN_FEMALE = [
  'Fatou', 'Aminata', 'Mariama', 'Aissatou', 'Oumou', 'Bintou', 'Awa', 'Djeneba',
  'Fatoumata', 'Kadiatou', 'Khady', 'Maimouna', 'Ndèye', 'Rokhaya', 'Seynabou',
  'Sokhna', 'Rama', 'Coumba', 'Dieynaba', 'Mame', 'Ndeye', 'Ramatoulaye',
  // Afrique centrale/ouest
  'Adjoua', 'Akua', 'Ama', 'Efua', 'Abena', 'Adwoa', 'Afua', 'Akosua',
  'Christelle', 'Sandrine', 'Nadège', 'Carine', 'Estelle', 'Régine', 'Ornella',
  'Grâce', 'Divine', 'Bénédicte', 'Francine', 'Nathalie', 'Pamela', 'Sonia',
]

// Tous les prénoms combinés
export const ALL_FIRST_NAMES = [
  ...FRENCH_MALE, ...FRENCH_FEMALE,
  ...IBERIAN_MALE, ...IBERIAN_FEMALE,
  ...MAGHREBI_MALE, ...MAGHREBI_FEMALE,
  ...AFRICAN_MALE, ...AFRICAN_FEMALE,
]

// Suffixes réalistes variés
export const SUFFIXES = [
  // Vide (prénom seul)
  '',
  // Départements français populaires
  '59', '62', '75', '69', '13', '33', '31', '44', '67', '93', '94', '77',
  '78', '91', '92', '95', '01', '06', '83', '34', '38', '57', '54', '76',
  // Années de naissance (90s-2000s)
  '95', '96', '97', '98', '99', '00', '01', '02', '03', '04', '05',
  // Suffixes style gaming/réseaux sociaux
  '_off', '_officiel', '_real', '_fr', '_gaming', '_ytb', '_twitch', '_ttv',
  'music', 'pro', 'life', 'bzh', 'x', 'gaming', 'yt', 'tv', 'zik',
  // Suffixes numériques variés
  '2k', '2k4', '2k5', '1er', '123', '007', '69', '420', '666', '777', '999',
  // Style leet/gaming
  'x', 'xx', 'xX', 'Xx', '_x', 'z', 'zz', '_', '__',
  // Diminutifs
  'du75', 'du93', 'du13', 'du69', 'de_paris', 'de_lyon', 'de_marseille',
]

// Patterns de pseudo crédibles
type UsernamePattern = (firstName: string, suffix: string) => string

const USERNAME_PATTERNS: UsernamePattern[] = [
  // Prénom simple en minuscule + suffix (lucas75)
  (firstName, suffix) => firstName.toLowerCase() + suffix,
  // Prénom avec majuscule + suffix (Lucas_off)
  (firstName, suffix) => firstName + suffix,
  // Prénom en minuscule sans underscore (lucasmusic)
  (firstName, suffix) => firstName.toLowerCase() + suffix.replace(/_/g, ''),
  // Prénom + underscore + suffix (lucas_75)
  (firstName, suffix) => {
    if (suffix.startsWith('_')) return firstName.toLowerCase() + suffix
    if (suffix === '') return firstName.toLowerCase()
    return firstName.toLowerCase() + '_' + suffix
  },
  // xXPrenomXx style gaming
  (firstName, suffix) => `xX${firstName}Xx${suffix.replace(/_/g, '')}`,
  // Prénom + chiffres aléatoires
  (firstName) => firstName.toLowerCase() + Math.floor(Math.random() * 999).toString().padStart(2, '0'),
  // Style Discord (Prénom#1234 -> prenom1234)
  (firstName) => firstName.toLowerCase() + Math.floor(1000 + Math.random() * 9000),
  // Prénom doublé (lucaslucas)
  (firstName, suffix) => firstName.toLowerCase() + firstName.toLowerCase().slice(0, 3) + suffix.replace(/_/g, ''),
  // Diminutif + suffix (lulu75)
  (firstName, suffix) => {
    const diminutif = firstName.toLowerCase().slice(0, 2) + firstName.toLowerCase().slice(0, 2)
    return diminutif + suffix.replace(/_/g, '')
  },
  // Style pro/esport (FNC_Lucas)
  (firstName) => {
    const teams = ['FNC', 'KC', 'VIT', 'G2', 'TL', 'NRG', 'TSM', 'C9', 'BDS', 'MAD', 'SK', 'AST']
    return teams[Math.floor(Math.random() * teams.length)] + '_' + firstName
  },
  // Prénom inversé + suffix (sacul75)
  (firstName, suffix) => firstName.toLowerCase().split('').reverse().join('') + suffix.replace(/_/g, ''),
  // I am Prénom style (IamLucas)
  (firstName) => 'Iam' + firstName,
  // Le/La + prénom (LeLucas, LaEmma)
  (firstName) => (Math.random() > 0.5 ? 'Le' : 'La') + firstName,
  // Just + prénom (JustLucas)
  (firstName) => 'Just' + firstName,
  // Prénom + année complète
  (firstName) => firstName.toLowerCase() + (1995 + Math.floor(Math.random() * 15)),
  // The Real prénom
  (firstName) => 'TheReal' + firstName,
  // Prénom + emoji textuel (lucasfire, emmaheart)
  (firstName) => {
    const emojis = ['fire', 'king', 'queen', 'boss', 'star', 'gold', 'dark', 'light', 'ice', 'wave']
    return firstName.toLowerCase() + emojis[Math.floor(Math.random() * emojis.length)]
  },
]

/**
 * Simple hash function for deterministic random
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Génère un pseudo unique et crédible
 */
export function generateUsername(): string {
  const firstName = ALL_FIRST_NAMES[Math.floor(Math.random() * ALL_FIRST_NAMES.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
  const pattern = USERNAME_PATTERNS[Math.floor(Math.random() * USERNAME_PATTERNS.length)]

  return pattern(firstName, suffix)
}

/**
 * Génère un pseudo déterministe basé sur une seed (ex: game ID)
 * Retourne toujours le même pseudo pour la même seed
 */
export function generateDeterministicUsername(seed: string): string {
  const hash = hashString(seed)

  // Use hash to pick firstName deterministically
  const firstName = ALL_FIRST_NAMES[hash % ALL_FIRST_NAMES.length]

  // Use different part of hash for suffix
  const suffixIndex = Math.floor(hash / ALL_FIRST_NAMES.length) % SUFFIXES.length
  const suffix = SUFFIXES[suffixIndex]

  // Use simple deterministic patterns (avoid patterns with Math.random)
  const simplePatterns = [
    (fn: string, sfx: string) => fn.toLowerCase() + sfx,
    (fn: string, sfx: string) => fn + sfx,
    (fn: string, sfx: string) => fn.toLowerCase() + (sfx.startsWith('_') ? sfx : '_' + sfx),
    (fn: string, sfx: string) => fn.toLowerCase() + sfx.replace(/_/g, ''),
  ]

  const patternIndex = Math.floor(hash / (ALL_FIRST_NAMES.length * SUFFIXES.length)) % simplePatterns.length
  const pattern = simplePatterns[patternIndex]

  const result = pattern(firstName, suffix)
  // Clean up double underscores or trailing underscores
  return result.replace(/__+/g, '_').replace(/_$/, '')
}

/**
 * Génère un ensemble de pseudos uniques
 */
export function generateUniqueUsernames(count: number): string[] {
  const usernames = new Set<string>()

  while (usernames.size < count) {
    usernames.add(generateUsername())
  }

  return Array.from(usernames)
}

/**
 * Génère un pseudo basé sur une origine spécifique
 */
export function generateUsernameByOrigin(origin: 'french' | 'iberian' | 'maghrebi' | 'african'): string {
  let firstNames: string[]

  switch (origin) {
    case 'french':
      firstNames = [...FRENCH_MALE, ...FRENCH_FEMALE]
      break
    case 'iberian':
      firstNames = [...IBERIAN_MALE, ...IBERIAN_FEMALE]
      break
    case 'maghrebi':
      firstNames = [...MAGHREBI_MALE, ...MAGHREBI_FEMALE]
      break
    case 'african':
      firstNames = [...AFRICAN_MALE, ...AFRICAN_FEMALE]
      break
  }

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]
  const pattern = USERNAME_PATTERNS[Math.floor(Math.random() * USERNAME_PATTERNS.length)]

  return pattern(firstName, suffix)
}
