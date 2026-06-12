import Link from 'next/link'

// 404 façon borne d'arcade : GAME OVER, scanlines, INSERT COIN.
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary px-4">
      {/* Halos néon */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-neon-purple/10 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-neon-pink/10 blur-[150px]" />
        {/* Scanlines CRT */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.6) 3px, transparent 4px)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-xl text-center">
        <span className="kicker">Erreur 404</span>

        {/* GAME OVER géant, grésillement électrique */}
        <h1 className="title-giant mt-4 text-6xl leading-[0.95] text-white sm:text-8xl">
          GAME
          <br />
          <span className="text-electric">OVER</span>
        </h1>

        <p className="mx-auto mt-6 max-w-sm text-sm text-white/55">
          Cette page n&apos;existe pas. Ou quelqu&apos;un a cliqué en dernier dessus.
          L&apos;arène, elle, tourne toujours.
        </p>

        {/* Faux compteur d'arcade */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="live-dot" />
          <span className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            Continue ?
          </span>
        </div>

        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/lobby" className="btn-arena px-8 py-3.5 text-sm">
            Insérer un crédit · Lobby
          </Link>
          <Link href="/" className="btn-arena-ghost px-8 py-3.5 text-sm">
            Page d&apos;accueil
          </Link>
        </div>

        {/* Score line, clin d'œil arcade */}
        <p className="stat-numeral mt-10 text-xs text-white/25">
          SCORE 0404 &nbsp;·&nbsp; HI-SCORE 9999 &nbsp;·&nbsp; CREDIT 10
        </p>
      </div>
    </div>
  )
}
