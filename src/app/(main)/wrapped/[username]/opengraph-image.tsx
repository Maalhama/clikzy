import { ImageResponse } from 'next/og'
import { fetchWrappedStats } from '@/lib/wrapped'

export const runtime = 'edge'
export const alt = 'Cleekzy Wrapped'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function euro(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

export default async function WrappedOG({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const decoded = decodeURIComponent(username)
  const s = await fetchWrappedStats(decoded)

  const hasValue = !!s && s.totalValueWon > 0
  const heroNumber = !s ? '' : hasValue ? `${euro(s.totalValueWon)}€` : s.totalClicks.toLocaleString('fr-FR')
  const heroLabel = !s ? '' : hasValue ? 'de lots remportés' : 'clics envoyés'

  const cells = s
    ? [
        { label: 'VICTOIRES', value: String(s.totalWins) },
        { label: 'CLICS', value: s.totalClicks.toLocaleString('fr-FR') },
        { label: 'NIVEAU', value: String(s.level) },
        { label: 'SUCCÈS', value: String(s.badges) },
      ]
    : []

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
        {/* halo */}
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

        {/* En-tête */}
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
            WRAPPED
          </span>
        </div>

        {/* Bloc central */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '8px' }}>
            <span style={{ fontSize: '64px', fontWeight: 900, color: '#FFFFFF' }}>{decoded}</span>
            {s && (
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#FF4FD8',
                  background: 'rgba(255,79,216,0.12)',
                  border: '2px solid rgba(255,79,216,0.4)',
                  borderRadius: '999px',
                  padding: '8px 22px',
                  display: 'flex',
                }}
              >
                {s.title}
              </span>
            )}
          </div>

          {s ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
              <span
                style={{
                  fontSize: '150px',
                  fontWeight: 900,
                  letterSpacing: '-4px',
                  color: hasValue ? '#FF4FD8' : '#9B5CFF',
                  textShadow: '0 0 70px rgba(255,79,216,0.4)',
                  lineHeight: 1,
                }}
              >
                {heroNumber}
              </span>
              <span style={{ fontSize: '34px', color: 'rgba(255,255,255,0.6)', paddingBottom: '22px', display: 'flex' }}>
                {heroLabel}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '52px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex' }}>
              Le dernier clic gagne
            </span>
          )}
        </div>

        {/* Pied : stats + url */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '40px' }}>
            {cells.map((c) => (
              <div key={c.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '44px', fontWeight: 900, color: '#FFFFFF' }}>{c.value}</span>
                <span style={{ fontSize: '20px', letterSpacing: '3px', color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
            cleekzy.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
