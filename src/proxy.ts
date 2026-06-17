import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimiters } from '@/lib/rateLimit'

type CookieOptions = {
  name: string
  value: string
  options?: Record<string, unknown>
}

function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP (behind proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  // Fallback to a default identifier
  return 'unknown'
}

// #0 — CSP par requête avec NONCE : remplace `script-src 'unsafe-inline'` (qui
// laissait exécuter n'importe quel script injecté) par un nonce aléatoire. Next.js
// applique automatiquement ce nonce à ses scripts (lu via le header CSP de la
// requête) ; nos scripts inline (JSON-LD) le portent explicitement. On garde la
// liste blanche d'hôtes (Stripe/Umami/Cloudflare) plutôt que `strict-dynamic`
// pour ne pas casser les scripts externes. `style-src 'unsafe-inline'` conservé
// (framer-motion/Tailwind injectent des styles ; risque XSS bien moindre).
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production'
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''} https://js.stripe.com https://challenges.cloudflare.com https://*.umami.is`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://*.umami.is",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(request)

    // Apply stricter limits for sensitive routes
    let rateLimitResult

    if (pathname.startsWith('/api/stripe')) {
      rateLimitResult = await rateLimiters.payment(ip)
    } else if (pathname.startsWith('/api/cron')) {
      rateLimitResult = await rateLimiters.cron(ip)
    } else {
      rateLimitResult = await rateLimiters.api(ip)
    }

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessaie dans quelques instants.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // Nonce CSP : propagé aux Server Components via le header de requête `x-nonce`,
  // et le header CSP de requête est lu par Next.js pour nonce-r ses propres scripts.
  const nonce = btoa(crypto.randomUUID())
  const csp = buildCsp(nonce)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })
  supabaseResponse.headers.set('content-security-policy', csp)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieOptions[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          supabaseResponse.headers.set('content-security-policy', csp)
        },
      },
    }
  )

  // IMPORTANT: Use getUser() not getSession() for security
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated.
  // /lobby et /game sont VOLONTAIREMENT ouverts (consultables sans compte, rétention) ;
  // le clic « Jouer » redirige vers l'inscription côté client.
  const protectedPaths = ['/profile', '/collection', '/mini-games', '/shop', '/vip']
  const isProtectedRoute = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Auth routes - redirect to lobby if already authenticated
  const authPaths = ['/login', '/register']
  const isAuthRoute = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/lobby'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
