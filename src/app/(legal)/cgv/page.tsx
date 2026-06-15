import type { Metadata } from 'next'
import { MEDIATEUR } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente - CLEEKZY',
  description: 'Conditions générales de vente pour l\'achat de crédits sur CLEEKZY',
}

export default function CGVPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-black mb-2">
        Conditions Générales de Vente
      </h1>
      <p className="text-white/50 text-sm mb-8">
        Dernière mise à jour : 23 janvier 2026
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">1. Objet</h2>
        <p className="text-white/70">
          Les présentes Conditions Générales de Vente (CGV) régissent l'achat de crédits sur la plateforme CLEEKZY. Tout achat implique l'acceptation sans réserve des présentes CGV.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">2. Produits</h2>
        <p className="text-white/70 mb-4">
          CLEEKZY propose à la vente des packs de crédits permettant de participer aux jeux sur la plateforme :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li><strong className="text-white">Packs de crédits :</strong> plusieurs paliers, avec un bonus x2 sur le premier achat de chaque pack par mois civil.</li>
          <li><strong className="text-white">Abonnement V.I.P :</strong> avantages premium (crédits quotidiens majorés, remises sur les packs), sans engagement.</li>
        </ul>
        <p className="text-white/70 mt-4">
          La grille complète des packs, quantités et prix en vigueur est affichée sur la page <a href="/shop" className="text-neon-purple hover:underline">Boutique</a>. Les crédits sont des biens numériques utilisables uniquement sur la plateforme CLEEKZY.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">3. Prix</h2>
        <p className="text-white/70 mb-4">
          Les prix sont indiqués en euros (€) TTC. CLEEKZY se réserve le droit de modifier ses prix à tout moment. Les prix applicables sont ceux en vigueur au moment de la validation de la commande.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">4. Commande</h2>
        <p className="text-white/70 mb-4">
          Pour passer commande, l'utilisateur doit :
        </p>
        <ol className="text-white/70 list-decimal pl-6 mb-4">
          <li>Être connecté à son compte CLEEKZY</li>
          <li>Sélectionner un pack de crédits</li>
          <li>Procéder au paiement via Stripe</li>
        </ol>
        <p className="text-white/70">
          La commande est confirmée dès réception du paiement. Les crédits sont crédités instantanément sur le compte de l'utilisateur.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">5. Paiement</h2>
        <p className="text-white/70 mb-4">
          Le paiement s'effectue par carte bancaire via la plateforme sécurisée Stripe. Les moyens de paiement acceptés sont :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li>Carte Visa</li>
          <li>Carte Mastercard</li>
          <li>American Express</li>
          <li>Apple Pay</li>
          <li>Google Pay</li>
        </ul>
        <p className="text-white/70 mt-4">
          Les transactions sont sécurisées par chiffrement SSL. CLEEKZY ne stocke aucune donnée bancaire.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">6. Droit de rétractation</h2>
        <p className="text-white/70 mb-4">
          Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contenus numériques fournis sur un support immatériel dont l'exécution a commencé avec l'accord du consommateur.
        </p>
        <p className="text-white/70">
          En validant votre achat, vous reconnaissez expressément que les crédits seront immédiatement disponibles et utilisables, et vous renoncez à votre droit de rétractation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">7. Livraison des lots</h2>
        <p className="text-white/70 mb-4">
          En cas de victoire à un jeu, le lot est livré gratuitement en France métropolitaine. Les conditions de livraison sont :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li><strong className="text-white">Délai :</strong> 5 à 7 jours ouvrés après confirmation de l'adresse</li>
          <li><strong className="text-white">Zone :</strong> France métropolitaine uniquement</li>
          <li><strong className="text-white">Transporteur :</strong> Colissimo ou transporteur équivalent</li>
        </ul>
        <p className="text-white/70 mt-4">
          Un numéro de suivi sera communiqué par email dès l'expédition.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">8. Garantie des lots</h2>
        <p className="text-white/70 mb-4">
          Les lots sont des produits neufs bénéficiant de la garantie légale de conformité (2 ans) et de la garantie des vices cachés.
        </p>
        <p className="text-white/70">
          En cas de produit défectueux, contactez notre support dans les 14 jours suivant la réception pour un échange ou remplacement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">9. Responsabilité</h2>
        <p className="text-white/70 mb-4">
          CLEEKZY ne pourra être tenu responsable :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li>Des retards de livraison imputables au transporteur</li>
          <li>Des dommages lors du transport (réclamation auprès du transporteur)</li>
          <li>De l'utilisation frauduleuse des crédits par des tiers</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">10. Service client</h2>
        <p className="text-white/70 mb-4">
          Pour toute question relative à une commande :
        </p>
        <ul className="text-white/70 list-disc pl-6">
          <li><strong className="text-white">Email :</strong> <a href="mailto:support@cleekzy.com" className="text-neon-purple hover:underline">support@cleekzy.com</a></li>
          <li><strong className="text-white">Page support :</strong> <a href="/support" className="text-neon-purple hover:underline">cleekzy.com/support</a></li>
        </ul>
        <p className="text-white/70 mt-4">
          Délai de réponse : sous 24 heures ouvrées.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">11. Médiation</h2>
        <p className="text-white/70">
          En cas de litige, vous pouvez recourir gratuitement au service de médiation de la consommation.{' '}
          {MEDIATEUR ? (
            <>Médiateur compétent : {MEDIATEUR.name} · <a href={MEDIATEUR.url} className="text-neon-purple underline" target="_blank" rel="noopener noreferrer">{MEDIATEUR.url}</a>.</>
          ) : (
            <>Les coordonnées du médiateur de la consommation compétent sont communiquées sur simple demande à contact@cleekzy.com.</>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-neon-purple mb-4">12. Droit applicable</h2>
        <p className="text-white/70">
          Les présentes CGV sont soumises au droit français. Tout litige sera de la compétence exclusive des tribunaux français.
        </p>
      </section>
    </article>
  )
}
