import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Comment ça marche & Équité · Cleekzy',
  description: "Comprends le fonctionnement des enchères Cleekzy et pourquoi nos mini-jeux sont vérifiablement équitables (provably-fair).",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold text-white">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-white/65">{children}</div>
    </section>
  )
}

export default function CommentCaMarchePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 text-center">
        <span className="kicker">Transparence</span>
      </div>
      <h1 className="text-center font-display text-3xl font-bold text-white">Comment ça marche &amp; Équité</h1>
      <p className="mt-3 text-center text-sm text-white/55">
        Le jeu doit être clair. Voici exactement comment fonctionnent les enchères et pourquoi tu peux nous faire confiance.
      </p>

      <Section title="Le principe : le dernier clic gagne">
        <p>
          Chaque enchère a un compte à rebours. <span className="font-semibold text-white">Chaque clic coûte 1 crédit</span> et
          relance le minuteur (dans la dernière ligne droite, il repart à 1min30). Quand le minuteur atteint
          zéro, <span className="font-semibold text-white">le dernier joueur à avoir cliqué remporte le lot</span> et se le fait livrer.
        </p>
      </Section>

      <Section title="Combien ça coûte (en toute transparence)">
        <p>
          Les crédits s&apos;achètent avec de l&apos;argent réel. Cliquer dans une enchère <span className="font-semibold text-white">consomme tes crédits, que tu gagnes ou non</span>.
          C&apos;est un jeu : on peut gagner un lot à une fraction de sa valeur… comme repartir sans rien. Ne dépense
          jamais plus que ce que tu peux te permettre de perdre — vois notre page{' '}
          <Link href="/jeu-responsable" className="text-neon-purple hover:underline">jeu responsable</Link>.
        </p>
        <p>
          Pas de chance ? Le <span className="font-semibold text-white">« Rachat malin »</span> te permet souvent de racheter
          le lot que tu visais à prix réduit, en tenant compte des crédits déjà dépensés.
        </p>
      </Section>

      <Section title="La jauge : l'item garanti">
        <p>
          Sur une enchère, tu peux aussi remplir une <span className="font-semibold text-white">jauge</span> en
          cliquant. Quand elle est pleine, l&apos;item est <span className="font-semibold text-white">à toi,
          garanti</span> — même si tu n&apos;as pas gagné au minuteur, et il t&apos;est livré.
        </p>
        <p>
          La jauge se remplit avec tes crédits payants. Une fois pleine, tu auras misé{' '}
          <span className="font-semibold text-white">2× la valeur réelle de l&apos;item</span> en argent réel :
          c&apos;est le prix, affiché en toute transparence, de la garantie d&apos;obtention.
        </p>
        <p>
          <span className="font-semibold text-white">Rien n&apos;est perdu</span> : si tu t&apos;arrêtes avant la
          fin, ta progression te revient sous forme de crédits réutilisables.
        </p>
      </Section>

      <Section title="Mini-jeux : équité vérifiable (provably-fair)">
        <p>
          Nos mini-jeux utilisent un système <span className="font-semibold text-white">provably-fair</span> de type casino
          crypto : avant chaque partie, le serveur s&apos;engage sur l&apos;empreinte (hash) d&apos;une graine secrète. Le
          résultat est calculé à partir de cette graine + d&apos;une graine que <span className="font-semibold text-white">tu
          contrôles</span>. À la rotation, la graine secrète est révélée : tu peux alors{' '}
          <span className="font-semibold text-white">recalculer et vérifier chaque résultat passé</span>. Impossible pour
          nous de truquer une partie après coup.
        </p>
      </Section>

      <Section title="Une activité animée">
        <p>
          Pour que les parties restent vivantes à toute heure, l&apos;activité affichée peut inclure des participants
          animés par la plateforme. Cela n&apos;empêche jamais un joueur réel de remporter un lot : le dernier clic
          humain au compte à rebours gagne.
        </p>
      </Section>

      <Section title="Tes lots, bien réels">
        <p>
          Les lots gagnés sont de vrais produits, expédiés chez toi avec un suivi. Retrouve les derniers gagnants sur la
          page <Link href="/gagnants" className="text-neon-purple hover:underline">Gagnants</Link>.
        </p>
      </Section>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        <Link href="/lobby" className="btn-arena px-6 py-3 text-sm">Entrer dans l&apos;arène</Link>
        <Link href="/cgv" className="btn-arena-outline px-6 py-3 text-sm">Lire les CGV</Link>
      </div>
    </div>
  )
}
