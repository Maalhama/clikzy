import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

// Favicon façon logo header : « C » néon dégradé violet→rose avec halo,
// curseur de clic en surimpression (la signature Cleekzy).
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(160deg, #0B0F1A 0%, #141B2D 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '14px',
          border: '2px solid rgba(155, 92, 255, 0.55)',
          position: 'relative',
        }}
      >
        {/* halo néon derrière la lettre */}
        <div
          style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(155,92,255,0.55) 0%, rgba(255,79,216,0.25) 55%, transparent 75%)',
            filter: 'blur(6px)',
            display: 'flex',
          }}
        />
        <span
          style={{
            fontSize: '40px',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #9B5CFF 20%, #FF4FD8 90%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginLeft: '-4px',
            marginTop: '-2px',
          }}
        >
          C
        </span>
        {/* curseur signature en bas à droite */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          style={{ position: 'absolute', right: '7px', bottom: '6px' }}
        >
          <path
            d="M5 3l14 9-7 2-3 7-4-18z"
            fill="#FF4FD8"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
