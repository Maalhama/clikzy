import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - CLEEKZY',
  description: 'Politique de confidentialité et protection des données personnelles de CLEEKZY',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-black mb-2">
        Politique de Confidentialité
      </h1>
      <p className="text-white/50 text-sm mb-8">
        Dernière mise à jour : 23 janvier 2026
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">1. Introduction</h2>
        <p className="text-white/70 mb-4">
          CLEEKZY s'engage à protéger la vie privée de ses utilisateurs. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">2. Responsable du traitement</h2>
        <div className="text-white/70 space-y-2">
          <p><strong className="text-white">Responsable :</strong> Azizi Mehdi</p>
          <p><strong className="text-white">Adresse :</strong> 32 boulevard Capdevila</p>
          <p><strong className="text-white">Email :</strong> <a href="mailto:contact@cleekzy.com" className="text-neon-purple hover:underline">contact@cleekzy.com</a></p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">3. Données collectées</h2>
        <p className="text-white/70 mb-4">
          Nous collectons les données suivantes :
        </p>
        <ul className="text-white/70 list-disc pl-6 mb-4">
          <li><strong className="text-white">Données d'identification :</strong> nom d'utilisateur, adresse email</li>
          <li><strong className="text-white">Données de livraison :</strong> nom, prénom, adresse postale, téléphone (uniquement en cas de gain)</li>
          <li><strong className="text-white">Données de jeu :</strong> historique des parties, clics, victoires</li>
          <li><strong className="text-white">Données de paiement :</strong> traitées par Stripe, nous ne stockons pas vos informations bancaires</li>
          <li><strong className="text-white">Données techniques :</strong> adresse IP, type de navigateur, données de connexion</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">4. Finalités du traitement</h2>
        <p className="text-white/70 mb-4">
          Vos données sont utilisées pour :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li>Gérer votre compte utilisateur</li>
          <li>Permettre votre participation aux jeux</li>
          <li>Livrer les lots en cas de victoire</li>
          <li>Traiter les paiements</li>
          <li>Vous envoyer des communications relatives au service</li>
          <li>Améliorer nos services et détecter les fraudes</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">5. Base légale</h2>
        <p className="text-white/70 mb-4">
          Le traitement de vos données repose sur :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li><strong className="text-white">L'exécution du contrat :</strong> pour la gestion de votre compte et la participation aux jeux</li>
          <li><strong className="text-white">Le consentement :</strong> pour les communications marketing</li>
          <li><strong className="text-white">L'intérêt légitime :</strong> pour la prévention des fraudes et l'amélioration du service</li>
          <li><strong className="text-white">L'obligation légale :</strong> pour la conservation de certaines données</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">6. Destinataires des données</h2>
        <p className="text-white/70 mb-4">
          Vos données peuvent être partagées avec :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li><strong className="text-white">Stripe :</strong> pour le traitement des paiements</li>
          <li><strong className="text-white">Supabase :</strong> pour l'hébergement des données</li>
          <li><strong className="text-white">Transporteurs :</strong> pour la livraison des lots</li>
          <li><strong className="text-white">Resend :</strong> pour l'envoi des emails</li>
        </ul>
        <p className="text-white/70 mt-4">
          Nous ne vendons jamais vos données à des tiers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">7. Durée de conservation</h2>
        <p className="text-white/70 mb-4">
          Vos données sont conservées :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li><strong className="text-white">Données de compte :</strong> pendant la durée de votre inscription + 3 ans</li>
          <li><strong className="text-white">Données de paiement :</strong> 10 ans (obligation légale)</li>
          <li><strong className="text-white">Données de jeu :</strong> pendant la durée de votre inscription</li>
          <li><strong className="text-white">Données de livraison :</strong> 5 ans après la livraison</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">8. Vos droits</h2>
        <p className="text-white/70 mb-4">
          Conformément au RGPD, vous disposez des droits suivants :
        </p>
        <ul className="text-white/70 list-disc pl-6 mb-4">
          <li><strong className="text-white">Droit d'accès :</strong> obtenir une copie de vos données</li>
          <li><strong className="text-white">Droit de rectification :</strong> corriger vos données inexactes</li>
          <li><strong className="text-white">Droit à l'effacement :</strong> demander la suppression de vos données</li>
          <li><strong className="text-white">Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
          <li><strong className="text-white">Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
          <li><strong className="text-white">Droit à la limitation :</strong> limiter le traitement de vos données</li>
        </ul>
        <p className="text-white/70">
          Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@cleekzy.com" className="text-neon-purple hover:underline">privacy@cleekzy.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">9. Cookies</h2>
        <p className="text-white/70 mb-4">
          Nous utilisons des cookies essentiels pour le fonctionnement du site :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li><strong className="text-white">Cookies d'authentification :</strong> pour maintenir votre session</li>
          <li><strong className="text-white">Cookies de sécurité :</strong> pour protéger contre les attaques</li>
        </ul>
        <p className="text-white/70 mt-4">
          Nous n'utilisons pas de cookies publicitaires ou de tracking tiers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">10. Sécurité</h2>
        <p className="text-white/70">
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement SSL/TLS, accès restreint aux données, surveillance des systèmes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">11. Transferts internationaux</h2>
        <p className="text-white/70">
          Certaines données peuvent être transférées vers des pays hors UE (États-Unis pour Stripe et Supabase). Ces transferts sont encadrés par des clauses contractuelles types ou des décisions d'adéquation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-neon-purple mb-4">12. Contact et réclamation</h2>
        <p className="text-white/70 mb-4">
          Pour toute question : <a href="mailto:privacy@cleekzy.com" className="text-neon-purple hover:underline">privacy@cleekzy.com</a>
        </p>
        <p className="text-white/70">
          Vous pouvez également adresser une réclamation à la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:underline">www.cnil.fr</a>
        </p>
      </section>
    </article>
  )
}
