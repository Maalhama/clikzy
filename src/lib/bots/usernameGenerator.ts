/**
 * Générateur de pseudos réalistes
 * Inspiré des vrais pseudos sur Instagram, TikTok, Discord, etc.
 */

// Pseudos réalistes pré-générés (style réseaux sociaux modernes)
const REALISTIC_USERNAMES = [
  // Style simple (prénom + chiffres)
  'music.emma', 'music.lucas', 'music.theo', 'vibes.hugo', 'music.lea',
  'lena.music', 'music.maxime', 'clara.music', 'tom.music', 'julie.music',
  // Style année de naissance
  'emma2004', 'lucas2003', 'theo2005', 'hugo99', 'lea2002', 'nathan01',
  'chloe2004', 'enzo2003', 'manon2001', 'jade2005', 'louis2000', 'sarah03',
  'clara2002', 'tom2004', 'julie2001', 'marie2003', 'paul2000', 'leo2005',
  // Style gamer/pseudo court
  'emm4', 'lcs_', 'th3o', 'hug0', 'l3a_', 'nath_', 'enz0_', 'mxm',
  'clra', 'jde_', 'srh_', 'lna_', 'ryn_', 'adm_', 'tom_', 'julz',
  // Style underscore
  '_emma', '_lucas', '_theo', '_hugo', '_lea', '_nathan', '_enzo',
  'emma_', 'lucas_', 'theo_', 'hugo_', 'lea_', 'nathan_', 'enzo_',
  '_clara', '_tom', '_julie', '_marie', '_paul', '_leo', '_lena',
  // Style point
  'em.ma', 'lu.cas', 'the.o', 'hu.go', 'le.a', 'na.than', 'en.zo',
  'cl.ara', 'to.m', 'ju.lie', 'ma.rie', 'pa.ul', 'le.o', 'le.na',
  // Prénoms maghrébins réalistes
  'ryanbzh', 'adam.dz', 'yasmine.fr', 'nour_75', 'lina.93', 'sara_92',
  'mehdi_77', 'amine.94', 'karim_95', 'youssef.dz', 'nadia_31', 'amina.ma',
  'rayan.fr', 'sofiane_', 'walid.93', 'bilal_75', 'hamza.dz', 'ismail_',
  // Prénoms africains réalistes
  'moussa_sn', 'ibra_221', 'mamadou.sn', 'fatou_', 'awa.221', 'ousmane_',
  'seydou.sn', 'cheikh_', 'modou.221', 'pape_sn', 'aliou_', 'demba.sn',
  // Style lettres doublées
  'emmaa', 'lucass', 'theoo', 'hugoo', 'leaa', 'nathann', 'enzoo',
  'claraa', 'tomm', 'juliee', 'mariee', 'paull', 'leoo', 'lenaa',
  // Style chiffre au milieu
  'em4a', 'luc4s', 'the0', 'hug0o', 'le4', 'n4than', 'enz0o',
  'cl4ra', 't0m', 'jul1e', 'm4rie', 'p4ul', 'l3o', 'l3na',
  // Style x devant
  'xemma', 'xlucas', 'xtheo', 'xhugo', 'xlea', 'xnathan', 'xenzo',
  'xclara', 'xtom', 'xjulie', 'xmarie', 'xpaul', 'xleo', 'xlena',
  // Mix réaliste varié
  'music.mxm', 'music_tom', 'jade_vibes', 'vibes.clara',
  'chloe.music', 'sarah_music', 'laura_music', 'marie.music', 'zoey_',
  'music.paul', 'leo.vibes', 'lena.music', 'tom.vibes', 'julie_vibes',
  // Pseudos courts populaires
  'lcs', 'thm', 'hgo', 'ntn', 'enz', 'mxm', 'clr', 'jde', 'srh', 'lna',
  'emm', 'tom', 'leo', 'pul', 'mre', 'jul', 'ryn', 'adm', 'sfn', 'wld',
  // Style TikTok/Insta
  'real.nathan', 'just.enzo', 'its.maxime', 'hey.clara', 'the.jade',
  'real.emma', 'just.lucas', 'its.theo', 'hey.hugo', 'the.lea',
  'just.tom', 'its.julie', 'hey.marie', 'the.paul', 'real.leo',
  // Style ibérique
  'pablo.es', 'diego_', 'carlos.es', 'miguel_', 'maria.es', 'carmen_',
  'lucia.es', 'ana_', 'sofia.es', 'elena_', 'marta.es', 'alba_',
  // Style gaming
  'dark.emma', 'ice.lucas', 'fire.theo', 'shadow.hugo', 'light.lea',
  'storm.nathan', 'frost.enzo', 'blaze.tom', 'nova.clara', 'venom.paul',

  // ========== 100 NOUVEAUX PSEUDOS ==========

  // Style Discord/Gaming moderne
  'zKenzo', 'xMatis', 'iLouna', 'oRaphael', 'zAya', 'xKillian', 'iMaelys',
  'NotLiam', 'NotMila', 'ImAxel', 'ImZoe', 'itzGabin', 'itzLola',
  // Style TikTok français
  'camille.off', 'arthur.ofc', 'oceane.ttv', 'mathis.live', 'romane.vlog',
  'jules.daily', 'alice.snap', 'ethan.gram', 'celia.tkt', 'nolan.yt',
  // Style numéro département
  'alex_13', 'marine_69', 'kevin_59', 'laura_33', 'dylan_44', 'melissa_06',
  'jordan_31', 'anais_34', 'florian_67', 'oceane_35', 'bastien_38', 'eva_83',
  // Style prénom rare français
  'titouan_', 'garance.fr', 'apolline_', 'marius.off', 'celestin_', 'capucine.music',
  'augustin_', 'victorine.fr', 'leandre_', 'ambroise.off', 'clementine_', 'elouan.bzh',
  // Style Belgique/Suisse
  'maxence.be', 'eloise_ch', 'baptiste.be', 'agathe_ch', 'corentin.be', 'margaux_ch',
  'thibault.be', 'justine_ch', 'quentin.be', 'clemence_ch', 'valentin.be', 'amelie_ch',
  // Style Quebec
  'alexis.qc', 'laurie_mtl', 'gabriel.qc', 'audrey_514', 'olivier.qc', 'maude_mtl',
  'philippe.qc', 'karine_418', 'simon.qc', 'melanie_qc', 'mathieu.mtl', 'catherine_qc',
  // Style Maghreb étendu
  'sami_dz', 'amira.ma', 'yacine_tn', 'salma.dz', 'anis_ma', 'ines.tn',
  'zakaria_dz', 'asma.ma', 'oussama_tn', 'meryem.dz', 'aymen_ma', 'chaima.tn',
  // Style Afrique de l'Ouest étendu
  'abdou_ml', 'mariam.ci', 'amadou_bf', 'aissatou.gn', 'boubacar_ne', 'kadiatou.sn',
  'souleymane_ml', 'fatoumata.ci', 'lamine_bf', 'mariama.gn', 'diallo_ne', 'binta.sn',
  // Style lettres répétées moderne
  'axeel_', 'noaah', 'liaam_', 'maellee', 'evaaa_', 'louiss',
  'huugo', 'inees_', 'yaann', 'louuise', 'raphhael', 'cloee_',
  // Style minimaliste
  'mths', 'cml', 'jls', 'mrn', 'ncls', 'vltn', 'rmn', 'pln', 'clt', 'fbn',
  // Style emoji/symbole (sans emoji)
  'la.vie.en.rose', 'petit.soleil', 'coeur.de.lion', 'etoile.filante', 'fleur.de.lys',
  // Style anglicisme français
  'french.boy', 'paris.girl', 'lyon.vibes', 'marseille.life', 'nice.mood',
  'bordeaux.style', 'toulouse.gang', 'nantes.crew', 'lille.spirit', 'strasbourg.kid',
]

/**
 * Simple hash function for deterministic random
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Génère un pseudo aléatoire
 */
export function generateUsername(): string {
  return REALISTIC_USERNAMES[Math.floor(Math.random() * REALISTIC_USERNAMES.length)]
}

/**
 * Génère un pseudo déterministe basé sur une seed
 * Retourne toujours le même pseudo pour la même seed
 */
export function generateDeterministicUsername(seed: string): string {
  const hash = hashString(seed)
  return REALISTIC_USERNAMES[hash % REALISTIC_USERNAMES.length]
}

/**
 * Génère un ensemble de pseudos uniques
 */
export function generateUniqueUsernames(count: number): string[] {
  const shuffled = [...REALISTIC_USERNAMES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// Export pour utilisation dans d'autres fichiers
export const ALL_USERNAMES = REALISTIC_USERNAMES
