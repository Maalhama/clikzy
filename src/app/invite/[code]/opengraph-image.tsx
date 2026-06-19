import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Invitation Cleekzy'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function InviteOG({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const c = decodeURIComponent(code).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0B0F1A 0%, #141B2D 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 70px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-120px',
            width: '520px',
            height: '520px',
            borderRadius: '999px',
            background: 'rgba(255, 79, 216, 0.18)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px', color: '#9B5CFF' }}>CLEEK</span>
          <span style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px', color: '#FF4FD8' }}>ZY</span>
          <span
            style={{
              marginLeft: '8px',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '6px',
              color: 'rgba(255,255,255,0.55)',
              border: '2px solid rgba(255,255,255,0.18)',
              borderRadius: '999px',
              padding: '6px 18px',
              display: 'flex',
            }}
          >
            INVITATION
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '60px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.05 }}>
            Rejoins-moi sur Cleekzy
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '28px' }}>
            <span style={{ fontSize: '30px', color: 'rgba(255,255,255,0.6)', display: 'flex' }}>Code parrain</span>
            <span
              style={{
                fontSize: '56px',
                fontWeight: 900,
                letterSpacing: '8px',
                color: '#FF4FD8',
                background: 'rgba(255,79,216,0.12)',
                border: '2px solid rgba(255,79,216,0.4)',
                borderRadius: '18px',
                padding: '8px 28px',
                display: 'flex',
              }}
            >
              {c}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '30px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', display: 'flex' }}>
            Des crédits offerts pour commencer
          </span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
            cleekzy.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
