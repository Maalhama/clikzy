import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0B0F1A 0%, #141B2D 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <span
          style={{
            fontSize: '20px',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #9B5CFF 0%, #FF4FD8 100%)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          C
        </span>
      </div>
    ),
    {
      ...size,
    }
  )
}
