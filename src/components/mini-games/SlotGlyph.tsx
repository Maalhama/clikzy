'use client'

// Symboles de machine à sous dessinés en SVG néon (remplacent les emojis).
// L'index correspond à SLOTS_SYMBOLS côté serveur — ne pas réordonner.

const GLYPHS: Array<{ color: string; node: React.ReactNode }> = [
  // 0 — Cerises
  {
    color: '#FF4757',
    node: (
      <>
        <circle cx="8.5" cy="16" r="4" />
        <circle cx="15.5" cy="17" r="3.4" />
        <path d="M8.5 12c.6-4 2.5-6.8 6-8M15.5 13.6c-.5-3.5.2-6.7 2.5-9" />
        <path d="M14 4l4 .6" />
      </>
    ),
  },
  // 1 — Citron
  {
    color: '#FFB800',
    node: (
      <>
        <ellipse cx="12" cy="13" rx="7.5" ry="5.5" transform="rotate(-18 12 13)" />
        <path d="M5.5 16.5L3.8 18M18.6 8.2L20.3 7" />
      </>
    ),
  },
  // 2 — Orange
  {
    color: '#FF8C00',
    node: (
      <>
        <circle cx="12" cy="13.5" r="6.5" />
        <path d="M12 7V4.5M10 4.5h4" />
        <path d="M12 13.5l3.5-3.5M12 13.5l-3.5 3.5M12 13.5l3.5 3.5M12 13.5l-3.5-3.5" opacity="0.5" />
      </>
    ),
  },
  // 3 — Raisin
  {
    color: '#9B5CFF',
    node: (
      <>
        <circle cx="9" cy="11" r="3" />
        <circle cx="15" cy="11" r="3" />
        <circle cx="12" cy="16" r="3" />
        <path d="M12 8V4M12 4c1.6-.4 3 0 4 1" />
      </>
    ),
  },
  // 4 — Diamant
  {
    color: '#3CCBFF',
    node: (
      <>
        <path d="M7 5h10l4 5-9 10-9-10 4-5z" />
        <path d="M3 10h18M7 5l5 5 5-5M12 10v10" opacity="0.6" />
      </>
    ),
  },
  // 5 — Sept
  {
    color: '#FF4FD8',
    node: (
      <>
        <path d="M6 5h12l-7 15" strokeWidth="2.6" />
      </>
    ),
  },
]

export function SlotGlyph({ index, size = 40 }: { index: number; size?: number }) {
  const g = GLYPHS[index % GLYPHS.length]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={g.color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: `drop-shadow(0 0 6px ${g.color}AA)` }}
      aria-hidden="true"
    >
      {g.node}
    </svg>
  )
}
