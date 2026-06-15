'use client'

import { useState } from 'react'
import { exportMyData, deleteMyAccount } from '@/actions/privacy'

/** Droits RGPD : export et suppression de compte (art. 15/17/20). */
export function PrivacyCard() {
  const [exporting, setExporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const r = await exportMyData()
      if (r.success && r.data) {
        const blob = new Blob([r.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mes-donnees-cleekzy.json'
        a.click()
        URL.revokeObjectURL(url)
      } else {
        setError(r.error || 'Export impossible pour le moment.')
      }
    } catch {
      setError('Export impossible pour le moment.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const r = await deleteMyAccount(confirmText)
    if (r.success) {
      window.location.href = '/'
    } else {
      setError(r.error || 'Erreur')
      setDeleting(false)
    }
  }

  const canDelete = confirmText.trim().toUpperCase() === 'SUPPRIMER'

  return (
    <section className="panel p-5">
      <h2 className="font-display text-lg font-bold text-white">Confidentialité &amp; données</h2>
      <p className="mt-1 mb-4 text-sm text-white/55">
        Tes droits RGPD : récupère une copie de tes données, ou supprime définitivement ton compte.
      </p>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleExport} disabled={exporting} className="btn-arena-outline px-4 py-2.5 text-sm disabled:opacity-50">
          {exporting ? 'Préparation…' : 'Exporter mes données'}
        </button>
        {!confirmOpen && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
          >
            Supprimer mon compte
          </button>
        )}
      </div>

      {error && !confirmOpen && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

      {confirmOpen && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/[0.06] p-4">
          <p className="text-sm text-white/80">
            Cette action est <span className="font-semibold text-danger">définitive</span> : ton compte, ton solde et
            ton avatar sont supprimés. Tape <span className="stat-numeral font-bold text-white">SUPPRIMER</span> pour confirmer.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="SUPPRIMER"
            className="mt-3 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-center text-sm tracking-widest text-white placeholder:tracking-normal placeholder:text-white/30 focus:border-danger/50 focus:outline-none"
          />
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting || !canDelete}
              className="rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            >
              {deleting ? 'Suppression…' : 'Confirmer la suppression'}
            </button>
            <button
              onClick={() => { setConfirmOpen(false); setConfirmText(''); setError(null) }}
              className="btn-arena-ghost px-4 py-2.5 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
