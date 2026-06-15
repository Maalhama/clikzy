// Génère les icônes Cleekzy (PWA + favicon) depuis un SVG vectoriel.
// Logo header : wordmark CLEEK (violet) + ZY (rose) + curseur néon qui clique.
// FULL-BLEED (carré plein) : l'OS arrondit/masque lui-même.
// Lancer : node scripts/generate-icons.cjs
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const PUB = path.join(__dirname, '..', 'public')

function iconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B0F1A"/><stop offset="1" stop-color="#141B2D"/></linearGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9B5CFF"/><stop offset="1" stop-color="#FF4FD8"/></linearGradient>
    <radialGradient id="halo" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#9B5CFF" stop-opacity="0.32"/><stop offset="1" stop-color="#9B5CFF" stop-opacity="0"/></radialGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="cursorGlow" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="2.4"/></filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#halo)"/>
  <g filter="url(#glow)">
    <text x="256" y="258" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="82" letter-spacing="-3"><tspan fill="#9B5CFF">CLEEK</tspan><tspan fill="#FF4FD8">ZY</tspan></text>
  </g>
  <!-- curseur : glow néon coloré flou DERRIERE, puis curseur NET dessus (contour blanc crisp) -->
  <g transform="translate(290,286) scale(5.6)">
    <path d="M5 3l14 9-7 2-3 7-4-18z" fill="#C04DEE" filter="url(#cursorGlow)" opacity="0.75"/>
    <path d="M5 3l14 9-7 2-3 7-4-18z" fill="url(#neon)" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>
  </g>
  <circle cx="294" cy="302" r="8" fill="#FF4FD8" opacity="0.9"/>
</svg>`
}

async function main() {
  const svg = iconSVG()
  fs.writeFileSync(path.join(PUB, 'icon.svg'), svg)
  const buf = Buffer.from(svg)
  for (const [name, size] of [['icon-512.png',512],['icon-192.png',192],['apple-touch-icon.png',180]]) {
    await sharp(buf).resize(size,size).png().toFile(path.join(PUB, name)); console.log('écrit', name, size)
  }
}
main().catch((e)=>{console.error(e);process.exit(1)})
