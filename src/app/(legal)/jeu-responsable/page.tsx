import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Jeu responsable · Cleekzy',
  description: "Cleekzy s'engage pour un jeu responsable : réservé aux 18 ans et plus, garde le contrôle de tes dépenses, et trouve de l'aide si besoin.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold text-white">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-white/65">{children}</div>
    </section>
  )
}

export default function JeuResponsablePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 text-center">
        <span className="kicker">Engagement</span>
      </div>
      <h1 className="text-center font-display text-3xl font-bold text-white">Jeu responsable</h1>
      <p className="mt-3 text-center text-sm text-white/55">
        Cleekzy doit rester un divertissement. Voici nos engagements et les outils pour garder le contrôle.
      </p>

      <Section title="Réservé aux 18 ans et plus">
        <p>
          L&apos;inscription et le jeu sont strictement interdits aux mineurs. Tu certifies avoir 18 ans ou plus en créant
          ton compte. Si tu es un parent, protège l&apos;accès à tes appareils et moyens de paiement.
        </p>
      </Section>

      <Section title="Joue avec de l'argent que tu peux te permettre de perdre">
        <p>
          Chaque clic dans une enchère coûte un crédit, et les crédits s&apos;achètent avec de l&apos;argent réel. Fixe-toi un
          budget AVANT de jouer et tiens-t&apos;y. Ne joue jamais pour « te refaire » après une perte, ni avec de l&apos;argent
          destiné à tes dépenses essentielles.
        </p>
      </Section>

      <Section title="Garde le contrôle">
        <ul className="list-disc space-y-1 pl-5">
          <li>Définis un budget de jeu et un temps de jeu maximum.</li>
          <li>Fais des pauses régulières ; le jeu ne doit pas empiéter sur ta vie quotidienne.</li>
          <li>Ne considère jamais le jeu comme une source de revenus.</li>
          <li>Garde à l&apos;esprit que perdre fait partie du jeu.</li>
        </ul>
      </Section>

      <Section title="Signes d'alerte">
        <p>Demande de l&apos;aide si tu te reconnais dans l&apos;une de ces situations :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tu joues plus que prévu, ou dépenses plus que ton budget.</li>
          <li>Tu rejoues pour récupérer ce que tu as perdu.</li>
          <li>Le jeu affecte ton humeur, ton sommeil, tes relations ou tes finances.</li>
          <li>Tu mens à tes proches sur ton temps ou ton argent de jeu.</li>
        </ul>
      </Section>

      <Section title="Besoin d'aide ?">
        <p>
          En France, <span className="font-semibold text-white">Joueurs Info Service</span> t&apos;écoute gratuitement,
          anonymement, 7j/7 de 8h à 2h :
        </p>
        <p className="text-base font-bold text-neon-purple">09 74 75 13 13</p>
        <p>
          Plus d&apos;informations et auto-évaluation sur{' '}
          <a href="https://www.joueurs-info-service.fr" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:underline">
            joueurs-info-service.fr
          </a>.
        </p>
      </Section>

      <Section title="Faire une pause ou fermer ton compte">
        <p>
          Tu peux <span className="font-semibold text-white">mettre ton compte en pause</span> (de 24 h à 90 jours) à tout
          moment depuis ton <Link href="/profile" className="text-neon-purple hover:underline">profil</Link>, section
          « Faire une pause » : pendant la pause, tu ne peux ni jouer ni acheter, et elle ne peut pas être raccourcie.
        </p>
        <p>
          Tu peux aussi y <span className="font-semibold text-white">supprimer définitivement ton compte</span> (section
          « Confidentialité &amp; données »). Pour toute autre demande, écris-nous à{' '}
          <a href="mailto:support@cleekzy.com" className="text-neon-purple hover:underline">support@cleekzy.com</a>.
        </p>
      </Section>
    </div>
  )
}
