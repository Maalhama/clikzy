import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales - CLIKZY',
  description: 'Mentions légales du site CLIKZY',
}

export default function LegalPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-black mb-2">
        Mentions Légales
      </h1>
      <p className="text-white/50 text-sm mb-8">
        Dernière mise à jour : 23 janvier 2026
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">1. Éditeur du site</h2>
        <div className="text-white/70 space-y-2">
          <p><strong className="text-white">Nom du site :</strong> CLIKZY</p>
          <p><strong className="text-white">URL :</strong> https://clikzy.fr</p>
          <p><strong className="text-white">Éditeur :</strong> Azizi Mehdi (Auto-entrepreneur)</p>
          <p><strong className="text-white">Adresse :</strong> 32 boulevard Capdevila</p>
          <p><strong className="text-white">SIRET :</strong> 841 307 408</p>
          <p><strong className="text-white">Email :</strong> <a href="mailto:contact@clikzy.fr" className="text-neon-purple hover:underline">contact@clikzy.fr</a></p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">2. Directeur de la publication</h2>
        <p className="text-white/70">
          <strong className="text-white">Nom :</strong> Azizi Mehdi
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">3. Hébergement</h2>
        <div className="text-white/70 space-y-2">
          <p><strong className="text-white">Hébergeur :</strong> Vercel Inc.</p>
          <p><strong className="text-white">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
          <p><strong className="text-white">Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:underline">https://vercel.com</a></p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">4. Base de données</h2>
        <div className="text-white/70 space-y-2">
          <p><strong className="text-white">Fournisseur :</strong> Supabase Inc.</p>
          <p><strong className="text-white">Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-neon-purple hover:underline">https://supabase.com</a></p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">5. Propriété intellectuelle</h2>
        <p className="text-white/70 mb-4">
          L'ensemble du contenu du site CLIKZY (textes, images, vidéos, logos, icônes, sons, logiciels, etc.) est protégé par le droit d'auteur et le droit des marques.
        </p>
        <p className="text-white/70">
          Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de CLIKZY.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">6. Limitation de responsabilité</h2>
        <p className="text-white/70 mb-4">
          CLIKZY s'efforce de fournir des informations aussi précises que possible. Toutefois, CLIKZY ne pourra être tenu responsable des omissions, inexactitudes et carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
        </p>
        <p className="text-white/70">
          CLIKZY ne saurait être tenu pour responsable des dommages directs et indirects causés au matériel de l'utilisateur lors de l'accès au site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">7. Liens hypertextes</h2>
        <p className="text-white/70">
          Le site CLIKZY peut contenir des liens vers d'autres sites. CLIKZY n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-neon-purple mb-4">8. Droit applicable</h2>
        <p className="text-white/70">
          Les présentes mentions légales sont soumises au droit français. En cas de litige, et après échec de toute tentative de recherche d'une solution amiable, les tribunaux français seront seuls compétents.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-neon-purple mb-4">9. Contact</h2>
        <p className="text-white/70">
          Pour toute question concernant ces mentions légales, contactez-nous à : <a href="mailto:contact@clikzy.fr" className="text-neon-purple hover:underline">contact@clikzy.fr</a>
        </p>
      </section>
    </article>
  )
}
