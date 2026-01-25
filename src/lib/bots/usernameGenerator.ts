/**
 * Générateur de pseudos réalistes
 * 300 pseudos inspirés de vrais utilisateurs sur Instagram, TikTok, Discord, Twitch, etc.
 */

// 300 pseudos réalistes ultra-variés
const REALISTIC_USERNAMES = [
  // === Gaming/Twitch Style (40 pseudos) ===
  'xXDarkKnightXx', 'ProGamerHD', 'NinjaStyle_', 'ShadowHunter99', 'IceWolf42',
  'FireDragon88', 'ThunderStrike_', 'BlazeFury', 'NightRaven_', 'StormBreaker_',
  'GhostRider_92', 'SilentKiller_', 'RapidFire_88', 'DeadShot99', 'WarMachine_',
  'IronFist_77', 'TitanSlayer', 'NoMercy_', 'LegendKiller_', 'BeastMode99',
  'xXSniperXx', 'ProPlayer_94', 'EliteGamer_', 'xXAceXx', 'MasterChief_',
  'Headhunter_', 'Quickscope_', 'FragMaster_', 'xXViperXx', 'GodMode_88',
  'xXPhantomXx', 'Destroyeur_', 'xXReaperXx', 'KillerInstinct_', 'xXBladeXx',
  'SoloKing_', 'CrownVictor_', 'xXJokerXx', 'WildCard_99', 'xXToxicXx',

  // === Twitch/YouTube Streamers Style (30 pseudos) ===
  'lucas.ttv', 'emma.yt', 'maxime.live', 'lea.stream', 'theo.tv',
  'sarah_ttv', 'kevin.twitch', 'marie.yt', 'nathan_live', 'chloe.tv',
  'hugo.ttv', 'julie_stream', 'tom.yt', 'clara.live', 'paul_ttv',
  'lena.twitch', 'enzo.yt', 'jade_tv', 'louis.stream', 'manon.ttv',
  'arthur.yt', 'oceane_ttv', 'ethan.live', 'camille.tv', 'nolan_stream',
  'mathis.ttv', 'alice.yt', 'romane_live', 'jules.tv', 'celia_ttv',

  // === Instagram/TikTok Influencers Style (40 pseudos) ===
  'emma.off', 'lucas.ofc', 'theo.official', 'lea.daily', 'maxime.gram',
  'sarah_off', 'hugo.snap', 'chloe.insta', 'nathan.vlog', 'marie_daily',
  'tom.off', 'julie.vibes', 'paul.mood', 'clara_gram', 'leo.pic',
  'just.emma', 'its.lucas', 'real.theo', 'hey.lea', 'the.maxime',
  'just.sarah', 'its.hugo', 'real.chloe', 'hey.nathan', 'the.marie',
  'only.tom', 'just.julie', 'its.paul', 'real.clara', 'hey.leo',
  'vibes.emma', 'mood.lucas', 'vibes.theo', 'mood.lea', 'vibes.max',
  'aesthetic.sarah', 'vibe.hugo', 'mood.chloe', 'vibes.nathan', 'aesthetic.marie',

  // === Années de Naissance (35 pseudos) ===
  'emma2004', 'lucas2003', 'theo2005', 'lea2002', 'maxime2004',
  'sarah2003', 'hugo2005', 'chloe2002', 'nathan2001', 'marie2004',
  'tom2003', 'julie2005', 'paul2002', 'clara2001', 'leo2004',
  'lena2003', 'enzo2005', 'jade2002', 'louis2001', 'manon2000',
  'arthur99', 'oceane00', 'ethan01', 'camille02', 'nolan03',
  'mathis04', 'alice05', 'romane00', 'jules01', 'celia02',
  'bastien03', 'eva04', 'gabin05', 'lola00', 'gabriel01',

  // === Numéros Départements France (30 pseudos) ===
  'alex_75', 'marine_69', 'kevin_13', 'laura_33', 'dylan_59',
  'melissa_31', 'jordan_44', 'anais_06', 'florian_67', 'oceane_35',
  'bastien_38', 'eva_83', 'lucas_92', 'emma_93', 'theo_94',
  'lea_77', 'maxime_78', 'sarah_95', 'hugo_91', 'chloe_76',
  'nathan_34', 'marie_54', 'tom_29', 'julie_56', 'paul_22',
  'clara_14', 'leo_17', 'lena_85', 'enzo_86', 'jade_49',

  // === Style Underscore/Point (35 pseudos) ===
  '_emma', '_lucas', '_theo', '_lea', '_maxime',
  'emma_', 'lucas_', 'theo_', 'lea_', 'maxime_',
  '_sarah_', '_hugo_', '_chloe_', '_nathan_', '_marie_',
  'em.ma', 'lu.cas', 'the.o', 'le.a', 'max.ime',
  'sa.rah', 'hu.go', 'chlo.e', 'na.than', 'ma.rie',
  'tom.', 'julie.', 'paul.', 'clara.', 'leo.',
  '.lena', '.enzo', '.jade', '.louis', '.manon',

  // === Style Lettres Répétées/Modifiées (30 pseudos) ===
  'emmaa', 'lucass', 'theoo', 'leaa', 'maximee',
  'sarahh', 'hugoo', 'chloee', 'nathann', 'mariee',
  'tomm', 'juliee', 'paull', 'claraa', 'leoo',
  'em4a', 'luc4s', 'the0', 'le4', 'maxim3',
  's4rah', 'hug0', 'chl0e', 'n4than', 'm4rie',
  't0m', 'jul1e', 'p4ul', 'cl4ra', 'l3o',

  // === Style Minimaliste/Court (25 pseudos) ===
  'emm', 'lcs', 'thm', 'lea', 'mxm',
  'srh', 'hgo', 'chl', 'ntn', 'mre',
  'tom', 'jul', 'pul', 'clr', 'leo',
  'lna', 'enz', 'jde', 'lus', 'mnn',
  'art', 'ocn', 'eth', 'cml', 'nln',

  // === Style x/z Préfixe Gaming (25 pseudos) ===
  'xemma', 'xlucas', 'xtheo', 'xlea', 'xmax',
  'zsarah', 'zhugo', 'xchloe', 'znathan', 'xmarie',
  'xtom', 'zjulie', 'xpaul', 'zclara', 'xleo',
  'zlena', 'xenzo', 'zjade', 'xlouis', 'zmanon',
  'xarthur', 'zoceane', 'xethan', 'zcamille', 'xnolan',

  // === Style Discord (30 pseudos) ===
  'NotEmma', 'NotLucas', 'NotTheo', 'NotLea', 'NotMax',
  'ImSarah', 'ImHugo', 'ImChloe', 'ImNathan', 'ImMarie',
  'itzTom', 'itzJulie', 'itzPaul', 'itzClara', 'itzLeo',
  'iLena', 'iEnzo', 'iJade', 'iLouis', 'iManon',
  'oArthur', 'oOceane', 'oEthan', 'oCamille', 'oNolan',
  'zKenzo', 'zAya', 'zGabin', 'zLola', 'zRaphael',

  // === Prénoms Français Rares (25 pseudos) ===
  'titouan_', 'garance.fr', 'apolline_', 'marius.off', 'celestin_',
  'capucine.music', 'augustin_', 'victorine.fr', 'leandre_', 'ambroise.off',
  'clementine_', 'elouan.bzh', 'agathe_', 'baptiste.off', 'margaux_',
  'corentin.fr', 'eloise_', 'quentin.off', 'clemence_', 'thibault.fr',
  'valentin_', 'justine.off', 'maxence_', 'amelie.fr', 'axelle_',

  // === Belgique/Suisse/Luxembourg (20 pseudos) ===
  'maxence.be', 'eloise.ch', 'baptiste.be', 'agathe.ch', 'corentin.be',
  'margaux.ch', 'thibault.be', 'justine.ch', 'quentin.be', 'clemence.ch',
  'valentin.be', 'amelie.ch', 'laurent.lu', 'sophie.be', 'nicolas.ch',
  'marie.lu', 'pierre.be', 'anne.ch', 'francois.be', 'julie.lu',

  // === Quebec/Canada (20 pseudos) ===
  'alexis.qc', 'laurie_mtl', 'gabriel.qc', 'audrey_514', 'olivier.qc',
  'maude_mtl', 'philippe.qc', 'karine_418', 'simon.qc', 'melanie_qc',
  'mathieu.mtl', 'catherine_qc', 'marc_514', 'isabelle.qc', 'daniel_mtl',
  'julie_qc', 'patrick.mtl', 'nathalie_514', 'francois.qc', 'veronique_mtl',

  // === Maghreb (Maroc, Algérie, Tunisie) (30 pseudos) ===
  'adam.dz', 'yasmine.ma', 'mehdi.tn', 'lina.dz', 'amine.ma',
  'nour.tn', 'karim.dz', 'sara.ma', 'youssef.tn', 'amina.dz',
  'sami.ma', 'ines.tn', 'hamza.dz', 'salma.ma', 'aymen.tn',
  'rayan_dz', 'amira_ma', 'yacine_tn', 'nadia_dz', 'anis_ma',
  'chaima_tn', 'bilal_dz', 'meryem_ma', 'oussama_tn', 'ismail_dz',
  'asma_ma', 'zakaria_tn', 'sofiane_dz', 'walid_ma', 'ryanbzh',

  // === Afrique de l'Ouest (Sénégal, Mali, Côte d'Ivoire) (25 pseudos) ===
  'moussa_sn', 'fatou_ml', 'mamadou.ci', 'awa_sn', 'ibrahima_ml',
  'mariam.ci', 'ousmane_sn', 'kadiatou_ml', 'amadou.ci', 'aissatou_sn',
  'boubacar_ml', 'binta.ci', 'seydou_sn', 'fatoumata_ml', 'lamine.ci',
  'mariama_sn', 'souleymane_ml', 'diallo.ci', 'aliou_sn', 'cheikh_ml',
  'modou.ci', 'pape_sn', 'abdou_ml', 'ibra_221', 'demba.sn',

  // === Espagne/Portugal (20 pseudos) ===
  'pablo.es', 'maria.pt', 'diego.es', 'ana.pt', 'carlos.es',
  'sofia.pt', 'miguel.es', 'lucia.pt', 'javier.es', 'ines.pt',
  'antonio.es', 'beatriz.pt', 'rafael.es', 'catarina.pt', 'manuel.es',
  'mariana.pt', 'fernando.es', 'joana.pt', 'alberto.es', 'rita.pt',

  // === Italie/Grèce (15 pseudos) ===
  'lorenzo.it', 'giulia.gr', 'matteo.it', 'maria.gr', 'alessandro.it',
  'sofia.gr', 'francesco.it', 'elena.gr', 'marco.it', 'anna.gr',
  'luca.it', 'christina.gr', 'andrea.it', 'dimitri.gr', 'giovanni.it',

  // === Style Aesthetic/Vibes (20 pseudos) ===
  'sunset.vibes', 'moon.child', 'star.dust', 'ocean.waves', 'night.sky',
  'golden.hour', 'soft.aesthetic', 'dark.mood', 'light.energy', 'pure.vibes',
  'cool.breeze', 'warm.soul', 'free.spirit', 'wild.heart', 'gentle.mind',
  'calm.waters', 'bright.days', 'quiet.nights', 'loud.dreams', 'sweet.life',

  // === Style Gaming Pro (15 pseudos) ===
  'ProMax_', 'EliteSniper_', 'TopFragger_', 'KingSlayer_', 'BossRush_',
  'MegaKill_', 'UltraRare_', 'SuperStar_', 'HyperActive_', 'TurboMode_',
  'NitroBoost_', 'PowerUp_', 'LevelMax_', 'RankOne_', 'ChampMode_',

  // === Mix International Réaliste (15 pseudos) ===
  'alex.uk', 'sophie.de', 'max.nl', 'lisa.se', 'tim.dk',
  'emma.no', 'john.us', 'kate.au', 'mike.nz', 'anna.fi',
  'tom.ie', 'lucy.ca', 'ben.za', 'mia.br', 'leo.ar',
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
