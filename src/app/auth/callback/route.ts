import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

type CookieOptions = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/lobby'

  // Determine the redirect URL base
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cleekzy.com'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: CookieOptions[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors in server components
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the intended destination
      return NextResponse.redirect(`${siteUrl}${next}`)
    }

    console.error('[Auth Callback] Error exchanging code:', error.message)
  }

  // Return the user to login with error
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_error`)
}
