import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation - CLEEKZY',
  description: 'Conditions générales d\'utilisation de la plateforme CLEEKZY',
}

export default function TermsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-black mb-2">
        Conditions Générales d'Utilisation
      </h1>
      <p className="text-white/50 text-sm mb-8">
        Dernière mise à jour : 23 janvier 2026
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">1. Objet</h2>
        <p className="text-white/70 mb-4">
          Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de la plateforme CLEEKZY, accessible à l'adresse cleekzy.com (ci-après "le Site").
        </p>
        <p className="text-white/70">
          CLEEKZY est une plateforme de jeu en ligne où les utilisateurs peuvent participer à des parties en cliquant pour tenter de remporter des lots. Le dernier joueur à cliquer avant la fin du timer remporte le lot.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">2. Acceptation des CGU</h2>
        <p className="text-white/70 mb-4">
          L'inscription et l'utilisation du Site impliquent l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Site.
        </p>
        <p className="text-white/70">
          CLEEKZY se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification par email ou notification sur le Site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">3. Inscription et compte utilisateur</h2>
        <p className="text-white/70 mb-4">
          Pour participer aux jeux, l'utilisateur doit créer un compte en fournissant :
        </p>
        <ul className="text-white/70 list-disc pl-6 mb-4">
          <li>Une adresse email valide</li>
          <li>Un nom d'utilisateur unique</li>
          <li>Un mot de passe sécurisé</li>
        </ul>
        <p className="text-white/70 mb-4">
          L'utilisateur s'engage à fournir des informations exactes et à jour. Il est responsable de la confidentialité de ses identifiants de connexion.
        </p>
        <p className="text-white/70">
          <strong className="text-white">Conditions d'âge :</strong> L'utilisation du Site est réservée aux personnes majeures (18 ans ou plus). En créant un compte, vous certifiez avoir l'âge légal requis.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">4. Fonctionnement du jeu</h2>
        <p className="text-white/70 mb-4">
          <strong className="text-white">Principe :</strong> CLEEKZY est un jeu d'adresse et de timing. Chaque partie met en jeu un lot spécifique. Les joueurs utilisent leurs crédits pour cliquer et relancer le timer. Le dernier joueur à avoir cliqué lorsque le timer atteint zéro remporte le lot.
        </p>
        <p className="text-white/70 mb-4">
          <strong className="text-white">Crédits :</strong> Chaque utilisateur reçoit 10 crédits gratuits par jour. Des crédits supplémentaires peuvent être achetés. Un clic consomme un crédit.
        </p>
        <p className="text-white/70">
          <strong className="text-white">Important :</strong> CLEEKZY n'est pas un jeu de hasard. Il n'y a pas de tirage au sort ni d'algorithme aléatoire. Le résultat dépend uniquement du timing des joueurs.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">5. Crédits et paiements</h2>
        <p className="text-white/70 mb-4">
          Les crédits gratuits quotidiens sont réinitialisés chaque jour à minuit (heure de Paris). Les crédits achetés ne sont pas soumis à cette réinitialisation.
        </p>
        <p className="text-white/70 mb-4">
          Les paiements sont sécurisés via Stripe. Les crédits achetés sont non remboursables sauf disposition légale contraire.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">6. Lots et livraison</h2>
        <p className="text-white/70 mb-4">
          Les lots mis en jeu sont des produits neufs. En cas de victoire, l'utilisateur sera contacté par email pour fournir son adresse de livraison.
        </p>
        <p className="text-white/70 mb-4">
          La livraison est gratuite en France métropolitaine. Le délai de livraison est généralement de 5 à 7 jours ouvrés après confirmation de l'adresse.
        </p>
        <p className="text-white/70">
          CLEEKZY ne peut être tenu responsable des retards de livraison imputables au transporteur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">7. Comportement des utilisateurs</h2>
        <p className="text-white/70 mb-4">
          Les utilisateurs s'engagent à :
        </p>
        <ul className="text-white/70 list-disc pl-6 mb-4">
          <li>Ne pas utiliser de bots, scripts ou outils automatisés</li>
          <li>Ne pas tenter de manipuler le système ou exploiter des failles</li>
          <li>Ne pas créer plusieurs comptes</li>
          <li>Respecter les autres utilisateurs</li>
        </ul>
        <p className="text-white/70">
          Tout comportement frauduleux entraînera la suspension immédiate du compte sans remboursement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">8. Propriété intellectuelle</h2>
        <p className="text-white/70">
          L'ensemble des éléments du Site (logo, design, textes, images) sont la propriété exclusive de CLEEKZY. Toute reproduction ou utilisation sans autorisation est interdite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">9. Limitation de responsabilité</h2>
        <p className="text-white/70 mb-4">
          CLEEKZY met tout en œuvre pour assurer la disponibilité du Site mais ne peut garantir un fonctionnement sans interruption. CLEEKZY ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du Site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">10. Droit applicable</h2>
        <p className="text-white/70">
          Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-neon-purple mb-4">11. Contact</h2>
        <p className="text-white/70">
          Pour toute question concernant ces CGU, contactez-nous à : <a href="mailto:support@cleekzy.com" className="text-neon-purple hover:underline">support@cleekzy.com</a>
        </p>
      </section>
    </article>
  )
}
