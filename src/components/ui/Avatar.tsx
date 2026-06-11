import Image from 'next/image'
import { AVATAR_FRAMES } from '@/lib/cosmetics'

/** Avatar du joueur avec cadre cosmétique (frame). Image ou initiale dégradée. */
export function Avatar({
  username,
  avatarUrl,
  frame = 'frame_default',
  size = 40,
}: {
  username: string
  avatarUrl?: string | null
  frame?: string
  size?: number
}) {
  const f = AVATAR_FRAMES[frame] ?? AVATAR_FRAMES.frame_default
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ${f.extra ?? ''}`}
      style={{ width: size, height: size, boxShadow: f.glow }}
    >
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neon-purple to-neon-pink"
        style={{ border: `2px solid ${f.ring}` }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={username} width={size} height={size} className="h-full w-full object-cover" />
        ) : (
          <span className="font-bold text-white" style={{ fontSize: size * 0.42 }}>
            {username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}
