'use server'

import { createClient } from '@/lib/supabase/server'

export type JackpotState = {
  amount: number
  lastWinner: string | null
  lastWinnerAmount: number | null
}

/** État public du jackpot communautaire (lecture anon autorisée). */
export async function getJackpot(): Promise<JackpotState> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('jackpot')
    .select('amount, last_winner_username, last_winner_amount')
    .eq('id', 1)
    .single()
  return {
    amount: data?.amount ?? 0,
    lastWinner: data?.last_winner_username ?? null,
    lastWinnerAmount: data?.last_winner_amount ?? null,
  }
}
