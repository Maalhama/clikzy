import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CLEEKZY - Le dernier clic gagne'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0B0F1A 0%, #141B2D 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span
            style={{
              fontSize: '120px',
              fontWeight: 900,
              letterSpacing: '-4px',
              color: '#9B5CFF',
              textShadow: '0 0 60px rgba(155, 92, 255, 0.5)',
            }}
          >
            CLEEK
          </span>
          <span
            style={{
              fontSize: '120px',
              fontWeight: 900,
              letterSpacing: '-4px',
              color: '#FF4FD8',
              textShadow: '0 0 60px rgba(255, 79, 216, 0.5)',
            }}
          >
            ZY
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '30px',
          }}
        >
          Le dernier clic gagne
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
          }}
        >
          iPhone, PS5, MacBook et plus à gagner gratuitement
        </div>

        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: '64px',
            display: 'flex',
          }}
        >
          <svg width="72" height="72" viewBox="0 0 24 24">
            <path
              d="M5 3l14 9-7 2-3 7-4-18z"
              fill="#FF4FD8"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '64px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 26px',
            borderRadius: '999px',
            border: '2px solid rgba(0, 255, 136, 0.5)',
            background: 'rgba(0, 255, 136, 0.08)',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '999px',
              background: '#00FF88',
              boxShadow: '0 0 18px rgba(0, 255, 136, 0.9)',
              display: 'flex',
            }}
          />
          <span
            style={{
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '4px',
              color: '#00FF88',
            }}
          >
            EN DIRECT
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
