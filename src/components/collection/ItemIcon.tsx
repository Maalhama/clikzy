'use client'

// Icônes d'équipement néon dessinées item par item (24×24, trait 1.6),
// teintées à la couleur de la rareté. Un design distinctif par objet du
// catalogue — fallback sur l'icône du slot si l'id est inconnu.

const RARITY_HEX: Record<string, string> = {
  common: '#B9C2D8',
  rare: '#3CCBFF',
  epic: '#9B5CFF',
  legendary: '#FFD700',
  mythic: '#FF4FD8',
}

const SLOT_FALLBACK: Record<string, React.ReactNode> = {
  casque: (
    <>
      <path d="M6 13a6 6 0 0 1 12 0v4.5H6V13z" />
      <path d="M12 4v3M8.5 13.5h7" />
    </>
  ),
  armure: (
    <>
      <path d="M12 4l5 1.5v6c0 4-2.2 6.8-5 8.5-2.8-1.7-5-4.5-5-8.5v-6L12 4z" />
      <path d="M12 7.5v9" />
    </>
  ),
  anneau: (
    <>
      <circle cx="12" cy="14" r="5.5" />
      <path d="M9.8 7.2L12 4l2.2 3.2L12 9.5l-2.2-2.3z" />
    </>
  ),
  artefact: (
    <>
      <path d="M12 3l5 4-5 14-5-14 5-4z" />
      <path d="M7 7h10M12 3v18" />
    </>
  ),
}

const ICONS: Record<string, React.ReactNode> = {
  // ---------- CASQUES ----------
  // Casque de Bronze : bol simple + nasale
  helm_c1: (
    <>
      <path d="M6 14a6 6 0 0 1 12 0v3H6v-3z" />
      <path d="M12 8v9" />
      <path d="M6 14h12" />
    </>
  ),
  // Capuche Usée : capuche tombante, visage dans l'ombre
  helm_c2: (
    <>
      <path d="M7 18c-1-5 .5-11 5-13 4.5 2 6 8 5 13" />
      <path d="M9 18c0-3 1-5.5 3-6.5 2 1 3 3.5 3 6.5" />
      <path d="M5.5 18h13" />
    </>
  ),
  // Heaume d'Argent : casque intégral, fentes de visière
  helm_r1: (
    <>
      <path d="M7 9a5 5 0 0 1 10 0v9H7V9z" />
      <path d="M7 12.5h10" />
      <path d="M9.5 15h2M14.5 15h-2" />
      <path d="M12 4v2" />
    </>
  ),
  // Capuche de l'Ombre : capuche pointue + croissant d'ombre
  helm_r2: (
    <>
      <path d="M12 3c5 3 6.5 9 5.5 15h-11C5.5 12 7 6 12 3z" />
      <path d="M10 13a4 4 0 0 0 5 2.5c-.6 1.6-2 2.5-3.6 2.5-2 0-3.4-1.5-3.4-3.4 0-.6.1-1.1.3-1.6.4.2 1 .1 1.7 0z" fill="currentColor" stroke="none" opacity="0.5" />
    </>
  ),
  // Couronne de Cuivre : trois pointes + base
  helm_e1: (
    <>
      <path d="M5 17V9l3.5 3L12 6l3.5 6L19 9v8H5z" />
      <path d="M5 17h14" />
      <circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // Masque Spectral : masque ovale, yeux fendus
  helm_e2: (
    <>
      <path d="M12 3.5c4 0 6 2.8 6 7 0 4.5-2.5 8.5-6 10-3.5-1.5-6-5.5-6-10 0-4.2 2-7 6-7z" />
      <path d="M8.8 11l2.4 1.2M15.2 11l-2.4 1.2" />
      <path d="M11 16.5c.6.6 1.4.6 2 0" />
    </>
  ),
  // Casque du Dragon : heaume + cornes
  helm_l1: (
    <>
      <path d="M8 10a4.5 4.5 0 0 1 8.5-1.5V18H8v-8z" />
      <path d="M8 13.5h8.5" />
      <path d="M8 9C6 8 4.8 6 5 3.5 7.5 4 9 5.5 9.3 7.5" />
      <path d="M16.5 9c2-1 3.2-3 3-5.5-2.5.5-4 2-4.3 4" />
    </>
  ),
  // Diadème Mythique : fin bandeau + gemme losange + arcs
  helm_m1: (
    <>
      <path d="M4 15c2.5-3 5-4.5 8-4.5s5.5 1.5 8 4.5" />
      <path d="M12 7l1.8 2.5L12 12l-1.8-2.5L12 7z" />
      <path d="M6.5 12.5L5 10.5M17.5 12.5l1.5-2" />
    </>
  ),

  // ---------- ANNEAUX ----------
  // Anneau de Fer : simple bande épaisse
  ring_c1: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  // Bague Gravée : bande + encoches
  ring_c2: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 5.5v2M12 16.5v2M5.5 12h2M16.5 12h2" />
    </>
  ),
  // Anneau Saphir : bande + gemme à facettes
  ring_r1: (
    <>
      <circle cx="12" cy="14.5" r="5" />
      <path d="M9 7.5h6l1.5 2.5-4.5 4-4.5-4L9 7.5z" />
      <path d="M9 10h6" />
    </>
  ),
  // Jonc d'Or : double bande entrelacée
  ring_r2: (
    <>
      <circle cx="10" cy="12" r="5.5" />
      <circle cx="14" cy="12" r="5.5" />
    </>
  ),
  // Bague d'Émeraude : pierre rectangulaire sertie
  ring_e1: (
    <>
      <circle cx="12" cy="15" r="4.5" />
      <rect x="8.5" y="5" width="7" height="5" rx="1" />
      <path d="M10.5 5v5M13.5 5v5" />
    </>
  ),
  // Anneau du Roi : bande surmontée d'une couronne
  ring_l1: (
    <>
      <circle cx="12" cy="15" r="4.5" />
      <path d="M8.5 9V5.5l2.3 1.8L12 4.5l1.2 2.8 2.3-1.8V9h-7z" />
    </>
  ),
  // Sceau Cosmique : anneau + orbite
  ring_m1: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <ellipse cx="12" cy="12" rx="9" ry="3.2" />
      <circle cx="19.5" cy="10" r="1" fill="currentColor" stroke="none" />
    </>
  ),

  // ---------- ARMURES ----------
  // Veste Renforcée : gilet + surpiqûres
  arm_c1: (
    <>
      <path d="M8 5l4 1.5L16 5l3 3-2 2v9H7v-9L5 8l3-3z" />
      <path d="M12 6.5V19" />
      <path d="M9 12h2M13 12h2" strokeDasharray="1.5 1.5" />
    </>
  ),
  // Tunique de Lin : tunique simple manches courtes
  arm_c2: (
    <>
      <path d="M9 5h6l4 3-2 3-1-.8V19H8v-8.8L7 11 5 8l4-3z" />
      <path d="M10 5c.5 1 1.2 1.5 2 1.5S13.5 6 14 5" />
    </>
  ),
  // Cuirasse d'Acier : plastron galbé
  arm_r1: (
    <>
      <path d="M12 4l5.5 2v6.5c0 3.5-2.2 6-5.5 7.5-3.3-1.5-5.5-4-5.5-7.5V6L12 4z" />
      <path d="M8.5 9.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      <path d="M12 11.5V19" />
    </>
  ),
  // Maille Tissée : cotte + trame
  arm_r2: (
    <>
      <path d="M12 4l5 1.8v7c0 3.5-2 5.8-5 7.2-3-1.4-5-3.7-5-7.2v-7L12 4z" />
      <path d="M9 8.5h6M9 11.5h6M9 14.5h6" />
      <path d="M10.5 7v9M13.5 7v9" />
    </>
  ),
  // Plastron Runique : plastron + rune losange gravée
  arm_e1: (
    <>
      <path d="M12 4l5.5 2v6.5c0 3.5-2.2 6-5.5 7.5-3.3-1.5-5.5-4-5.5-7.5V6L12 4z" />
      <path d="M12 8.5l2.2 3-2.2 3-2.2-3 2.2-3z" />
    </>
  ),
  // Armure de Phénix : plastron + flammes montantes
  arm_l1: (
    <>
      <path d="M12 4.5L17 6v6c0 3.5-2 6.2-5 7.7-3-1.5-5-4.2-5-7.7V6l5-1.5z" />
      <path d="M12 16c-1.6-.8-2.3-2.2-1.8-3.8.3.5.7.8 1.2.9-.4-1.3 0-2.6 1.2-3.6-.1 1 .2 1.8 1 2.4.7.6 1 1.4.8 2.3-.2 1-.9 1.6-2.4 1.8z" />
    </>
  ),
  // Carapace Astrale : écailles + étoile
  arm_m1: (
    <>
      <path d="M12 4l5.5 2v6.5c0 3.5-2.2 6-5.5 7.5-3.3-1.5-5.5-4-5.5-7.5V6L12 4z" />
      <path d="M12 8l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3L12 8z" fill="currentColor" stroke="none" opacity="0.7" />
      <path d="M8 15.5c1.2 1 2.5 1.5 4 1.5s2.8-.5 4-1.5" />
    </>
  ),

  // ---------- ARTEFACTS ----------
  // Pierre Runique : menhir + rune
  arte_c1: (
    <>
      <path d="M9 20l-1.5-9L12 4l4.5 7L15 20H9z" />
      <path d="M12 9v6M10 11.5l4 2M14 11.5l-4 2" />
    </>
  ),
  // Trèfle Porte-Bonheur : trois feuilles + tige
  arte_c2: (
    <>
      <circle cx="9" cy="9" r="3" />
      <circle cx="15" cy="9" r="3" />
      <circle cx="12" cy="13.5" r="3" />
      <path d="M12 16.5c0 2-.7 3.2-2 4" />
    </>
  ),
  // Sphère Arcanique : orbe + volute interne
  arte_r1: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M8.5 12a3.5 3.5 0 0 1 7 0 2.3 2.3 0 0 1-4.6 0 1.4 1.4 0 0 1 2.8 0" />
    </>
  ),
  // Amulette Solaire : pendentif soleil
  arte_r2: (
    <>
      <circle cx="12" cy="13.5" r="4" />
      <path d="M12 6.5v-3M12 13.5l-.001.001" />
      <path d="M6.7 8.2l-1.4-1.4M17.3 8.2l1.4-1.4M5.5 13.5h-2M20.5 13.5h-2M6.7 18.8l-1.4 1.4M17.3 18.8l1.4 1.4M12 22.5v-1.5" />
    </>
  ),
  // Foudre Captive : éclair dans un cristal
  arte_e1: (
    <>
      <path d="M12 2.5l6 5-2 11-4 3-4-3-2-11 6-5z" />
      <path d="M13 8l-3 4.5h2.5L11 17l4-5h-2.5L13 8z" />
    </>
  ),
  // Lanterne des Âmes : lanterne + flamme
  arte_e2: (
    <>
      <path d="M9 8h6l1 9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2l1-9z" />
      <path d="M10 8V6.5A2 2 0 0 1 12 4.5a2 2 0 0 1 2 2V8" />
      <path d="M12 12c-.9.8-1 1.8-.3 2.7.2-.4.5-.6.8-.7-.1.7.2 1.2.8 1.5.5-.8.4-1.7-.3-2.5-.3-.4-.6-.7-1-1z" />
      <path d="M12 19v2" />
    </>
  ),
  // Clé des Abysses : clé ouvragée
  arte_l1: (
    <>
      <circle cx="8" cy="8" r="4" />
      <circle cx="8" cy="8" r="1.5" />
      <path d="M11 11l8.5 8.5" />
      <path d="M16 16l2.5-2.5M18.5 18.5L21 16" />
    </>
  ),
  // Étoile Primordiale : étoile à 4 branches + éclats
  arte_m1: (
    <>
      <path d="M12 3l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8L12 3z" />
      <path d="M18 4.5l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" fill="currentColor" stroke="none" opacity="0.7" />
    </>
  ),
}

export function ItemIcon({
  itemId, slot, rarity, size = 32, className = '',
}: {
  itemId?: string
  slot: string
  rarity: string
  size?: number
  className?: string
}) {
  const color = RARITY_HEX[rarity] ?? RARITY_HEX.common
  const paths = (itemId && ICONS[itemId]) || SLOT_FALLBACK[slot] || SLOT_FALLBACK.artefact
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ filter: `drop-shadow(0 0 ${Math.max(4, size / 6)}px ${color}99)`, color }}
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
}
