'use client'

import { useEffect, useState } from 'react'
import { Coins, Check, Lock, Crown, Loader2 } from 'lucide-react'
import { getPassState, claimPassTier, type PassState } from '@/actions/battlePass'
import { createPassCheckoutSession } from '@/actions/stripe'
import { NeonChest } from '@/components/collection/NeonChest'
import { ItemIcon } from '@/components/collection/ItemIcon'

const PASS_TIERS = [5, 10, 15, 20, 25] as const

const TIER_REWARD: Record<number, { kind: 'chest' | 'credits' | 'item'; rarity?: 'rare' | 'epic' | 'legendary'; label: string }> = {
  5: { kind: 'chest', rarity: 'rare', label: 'Coffre rare' },
  10: { kind: 'credits', label: '25 crédits' },
  15: { kind: 'chest', rarity: 'epic', label: 'Coffre épique + Curseur d’Arène' },
  20: { kind: 'item', label: 'Artefact exclusif + Sillage d’Arène' },
  25: { kind: 'chest', rarity: 'legendary', label: 'Coffre légendaire + Aura d’Arène' },
}

/**
 * Rail premium du Passe d'Arène : 5 paliers liés aux jours réclamés du
 * calendrier. Achat one-shot 4,99 € (Stripe), récompenses côté serveur.
 */
export function BattlePassRail({ onClaimed }: { onClaimed?: () => void }) {
  const [state, setState] = useState<PassState | null>(null)
  const [busy, setBusy] = useState<number | 'buy' | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    getPassState().then((res) => { if (res.success && res.data) setState(res.data) })
  }, [])

  if (!state) return null

  const buy = async () => {
    setBusy('buy')
    const res = await createPassCheckoutSession()
    if (res.success && res.data?.url) {
      window.location.href = res.data.url
      return
    }
    setBusy(null)
  }

  const claim = async (tier: number) => {
    if (busy !== null) return
    setBusy(tier)
    const res = await claimPassTier(tier)
    if (res.success && res.data) {
      setState((s) => s ? { ...s, claimedTiers: [...s.claimedTiers, tier] } : s)
      setFlash(
        res.data.kind === 'credits'
          ? `+${res.data.amount} crédits !`
          : res.data.kind === 'item'
          ? `${res.data.itemName} ajouté à ton inventaire !`
          : `Coffre ${res.data.rarity === 'legendary' ? 'légendaire' : res.data.rarity === 'epic' ? 'épique' : 'rare'} ajouté !`
      )
      onClaimed?.()
    } else if (res.error) {
      setFlash(res.error)
    }
    setBusy(null)
  }

  return (
    <div className="mt-4 rounded-xl border border-yellow-400/25 bg-gradient-to-br from-yellow-400/[0.06] to-transparent p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-400" />
          <span className="font-display text-sm font-semibold text-white">Passe d&apos;Arène</span>
          <span className="rounded-md border border-yellow-400/40 bg-yellow-400/10 px-1.5 py-0.5 font-display text-[0.55rem] font-bold uppercase tracking-wider text-yellow-300">
            Premium
          </span>
        </div>
        <span className="stat-numeral text-xs text-white/50">{state.daysClaimed}/25 jours</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {PASS_TIERS.map((tier) => {
          const reward = TIER_REWARD[tier]
          const claimed = state.claimedTiers.includes(tier)
          const reachable = state.daysClaimed >= tier
          const claimable = state.purchased && reachable && !claimed
          return (
            <button
              key={tier}
              onClick={() => claimable && claim(tier)}
              disabled={!claimable || busy !== null}
              title={reward.label}
              className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border transition-all ${
                claimed
                  ? 'border-success/40 bg-success/10'
                  : claimable
                  ? 'cursor-pointer border-yellow-400 bg-yellow-400/15 shadow-[0_0_16px_-4px_rgba(250,204,21,0.8)] animate-pulse'
                  : 'border-white/10 bg-white/[0.03] opacity-60'
              }`}
            >
              <span className="stat-numeral absolute left-1 top-0.5 text-[0.55rem] text-white/55">{tier}j</span>
              {claimed ? (
                <Check className="h-4 w-4 text-success" />
              ) : busy === tier ? (
                <Loader2 className="h-4 w-4 animate-spin text-yellow-300" />
              ) : reward.kind === 'chest' ? (
                <NeonChest rarity={reward.rarity ?? 'rare'} size={26} />
              ) : reward.kind === 'credits' ? (
                <Coins className="h-4 w-4 text-yellow-400" />
              ) : (
                <ItemIcon itemId="pass_artefact" slot="artefact" rarity="epic" size={20} />
              )}
              {!state.purchased && !claimed && (
                <Lock className="absolute bottom-1 right-1 h-3 w-3 text-white/50" />
              )}
            </button>
          )
        })}
      </div>

      {flash && <p className="mt-2 text-center text-xs font-semibold text-success">{flash}</p>}

      {!state.purchased && (
        <button
          onClick={buy}
          disabled={busy !== null}
          className="btn-arena mt-3 w-full py-2.5 text-xs disabled:opacity-60"
        >
          {busy === 'buy' ? 'Redirection…' : 'Débloquer le Passe — 4,99 €'}
        </button>
      )}
    </div>
  )
}
