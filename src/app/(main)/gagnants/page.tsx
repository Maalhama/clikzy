import Image from 'next/image'
import Link from 'next/link'
import { getWinnersWall } from '@/actions/winners'

export const metadata = {
  title: 'Mur des gagnants',
  description: 'Ils ont cliqué en dernier, ils ont gagné, et on a livré. La preuve en direct : produits remportés, statuts de livraison, joueurs récompensés.',
  alternates: { canonical: '/gagnants' },
}
export const revalidate = 120

const STATUS: Record<string, { label: string; cls: string }> = {
  delivered: { label: 'Livré', cls: 'border-success/40 bg-success/15 text-success' },
  shipped: { label: 'Expédié', cls: 'border-cyan-400/40 bg-cyan-400/15 text-cyan-300' },
  processing: { label: 'En préparation', cls: 'border-neon-purple/40 bg-neon-purple/15 text-neon-purple' },
  address_needed: { label: 'Adresse en attente', cls: 'border-yellow-400/40 bg-yellow-400/15 text-yellow-300' },
  pending: { label: 'En préparation', cls: 'border-white/15 bg-white/5 text-white/60' },
}

export default async function GagnantsPage() {
  const winners = await getWinnersWall(60)
  const delivered = winners.filter((w) => w.shippingStatus === 'delivered' || w.shippingStatus === 'shipped').length
  // Preuve « vérifiée » la plus forte : gagnants ayant partagé une photo (modérée) de leur lot reçu.
  const withPhoto = winners.filter((w) => w.deliveryPhotoUrl).length

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 text-center reveal reveal-1">
        <span className="kicker">Preuve de confiance</span>
        <h1 className="title-giant mt-2 text-4xl text-white md:text-5xl">Mur des <span className="text-neon-purple neon-text">gagnants</span></h1>
        <p className="mt-2 text-sm text-white/55">
          Ils ont cliqué en dernier, ils ont gagné, et on livre. {delivered > 0 && (
            <span className="font-semibold text-success">{delivered} lots déjà expédiés ou livrés.</span>
          )}
          {withPhoto > 0 && (
            <span className="font-semibold text-neon-blue"> {withPhoto} photo{withPhoto > 1 ? 's' : ''} de lots reçus partagée{withPhoto > 1 ? 's' : ''}.</span>
          )}
        </p>
      </div>

      {winners.length === 0 ? (
        <div className="panel p-10 text-center text-white/50">Les premiers gagnants arrivent bientôt.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 reveal reveal-2">
          {winners.map((w) => {
            const st = STATUS[w.shippingStatus] ?? STATUS.pending
            return (
              <div key={w.id} className="panel panel-hover overflow-hidden p-3">
                <div className="relative mb-2 aspect-square overflow-hidden rounded-xl bg-bg-primary/50">
                  {w.deliveryPhotoUrl ? (
                    // Photo réelle du colis reçu (modérée).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.deliveryPhotoUrl} alt={`${w.itemName} reçu par ${w.username}`} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Image src={w.itemImage} alt={w.itemName} fill sizes="200px" className="object-contain p-2" />
                  )}
                  <span className={`absolute left-1.5 top-1.5 rounded-md border px-1.5 py-0.5 text-[0.55rem] font-semibold ${st.cls}`}>
                    {st.label}
                  </span>
                  {w.deliveryPhotoUrl && (
                    <span className="absolute right-1.5 top-1.5 rounded-md bg-success/90 px-1.5 py-0.5 text-[0.55rem] font-semibold text-white">Photo réelle</span>
                  )}
                </div>
                <p className="truncate text-xs font-semibold text-white">{w.itemName}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="truncate text-[0.65rem] text-neon-pink">{w.username}</span>
                  {w.itemValue ? <span className="stat-numeral text-[0.7rem] text-success">{w.itemValue.toFixed(0)}€</span> : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 text-center reveal reveal-3">
        <Link href="/lobby" className="btn-arena px-8 py-3.5 text-sm">Rejoindre l&apos;arène</Link>
      </div>
    </main>
  )
}
