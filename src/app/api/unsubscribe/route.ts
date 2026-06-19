import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribe } from '@/lib/email/unsubscribe'

// Désabonnement des emails de rétention via lien signé (pas d'auth requise).
// GET /api/unsubscribe?u=<user_id>&t=<hmac>

function page(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · Cleekzy</title></head><body style="margin:0;background:#0a0a0f;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><div style="max-width:480px;margin:80px auto;padding:32px;text-align:center;"><div style="font-size:28px;font-weight:900;letter-spacing:-1px;margin-bottom:24px;"><span style="color:#9B5CFF;">CLEEK</span><span style="color:#FF4FD8;">ZY</span></div><h1 style="font-size:22px;margin:0 0 12px;">${title}</h1><p style="color:rgba(255,255,255,.7);line-height:1.6;margin:0;">${message}</p><a href="https://cleekzy.com/lobby" style="display:inline-block;margin-top:24px;color:#9B5CFF;text-decoration:none;">Retour au jeu →</a></div></body></html>`
  return new NextResponse(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get('u')
  const t = request.nextUrl.searchParams.get('t')

  if (!u || !t || !verifyUnsubscribe(u, t)) {
    return page('Lien invalide', "Ce lien de désabonnement n'est pas valide. Tu peux gérer tes préférences depuis ton profil.", 400)
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    // colonne ajoutée par la migration 20260619120002 (client non typé : pas de friction TS)
    const { error } = await supabase.from('profiles').update({ marketing_opt_out: true }).eq('id', u)
    if (error) {
      console.error('[UNSUBSCRIBE] update error:', error)
      return page('Oups', 'Une erreur est survenue. Réessaie plus tard.', 500)
    }
  } catch (e) {
    console.error('[UNSUBSCRIBE] error:', e)
    return page('Oups', 'Une erreur est survenue. Réessaie plus tard.', 500)
  }

  return page('Désabonnement confirmé', "C'est noté : tu ne recevras plus d'emails de rappel. Tu peux continuer à jouer quand tu veux.", 200)
}
