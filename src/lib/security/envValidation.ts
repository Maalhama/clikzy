/**
 * Environment Variables Validation
 * Validates required environment variables at startup
 */

interface EnvVar {
  name: string
  required: boolean
  description: string
}

const ENV_VARS: EnvVar[] = [
  // Supabase (required)
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anonymous key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, description: 'Supabase service role key' },

  // Site URL
  { name: 'NEXT_PUBLIC_SITE_URL', required: false, description: 'Site URL for redirects' },

  // Stripe (required for payments)
  { name: 'STRIPE_SECRET_KEY', required: false, description: 'Stripe secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: false, description: 'Stripe webhook secret' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: false, description: 'Stripe publishable key' },

  // Resend (required for emails)
  { name: 'RESEND_API_KEY', required: false, description: 'Resend API key' },
  { name: 'RESEND_FROM_EMAIL', required: false, description: 'Resend from email' },

  // Cron
  { name: 'CRON_SECRET', required: false, description: 'Cron job authorization secret' },

  // Upstash Redis (rate-limit distribué — sans lui, le rate-limit retombe sur un
  // compteur PAR INSTANCE, contournable en serverless multi-instance).
  { name: 'UPSTASH_REDIS_REST_URL', required: false, description: 'Upstash Redis REST URL (rate-limit distribué)' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', required: false, description: 'Upstash Redis REST token (rate-limit distribué)' },

  // Sentry (optional)
  { name: 'NEXT_PUBLIC_SENTRY_DSN', required: false, description: 'Sentry DSN for error tracking' },
]

export interface ValidationResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * Validate all required environment variables
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name]

    if (!value) {
      if (envVar.required) {
        missing.push(`${envVar.name}: ${envVar.description}`)
      } else {
        warnings.push(`${envVar.name}: ${envVar.description} (optional)`)
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Validate and log environment status
 * Call this at application startup
 */
export function validateEnvOnStartup(): void {
  const result = validateEnv()

  if (!result.valid) {
    console.error('═══════════════════════════════════════════════════════')
    console.error('ENVIRONMENT VALIDATION FAILED')
    console.error('═══════════════════════════════════════════════════════')
    console.error('Missing required environment variables:')
    result.missing.forEach(m => console.error(`  ✗ ${m}`))
    console.error('')
    console.error('Please set these variables in your .env.local file')
    console.error('═══════════════════════════════════════════════════════')

    // In production, you might want to throw an error
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables')
    }
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('[ENV] Optional variables not set:')
    result.warnings.forEach(w => console.warn(`  - ${w}`))
  }

  // En PRODUCTION, l'absence d'Upstash dégrade SILENCIEUSEMENT le rate-limit vers un
  // compteur par-instance (anti credential-stuffing / anti-clic contournable). On le
  // signale fort (sans bloquer le boot — un déploiement sans Redis reste possible).
  if (
    process.env.NODE_ENV === 'production' &&
    !(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ) {
    console.error('[ENV] ⚠ Upstash Redis absent en production : rate-limit NON distribué (par-instance, contournable en serverless). Configure UPSTASH_REDIS_REST_URL/TOKEN.')
  }
}

/**
 * Check if a specific feature is configured
 */
export function isFeatureConfigured(feature: 'stripe' | 'resend' | 'sentry' | 'cron' | 'redis'): boolean {
  switch (feature) {
    case 'redis':
      return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    case 'stripe':
      return !!(
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      )
    case 'resend':
      return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
    case 'sentry':
      return !!process.env.NEXT_PUBLIC_SENTRY_DSN
    case 'cron':
      return !!process.env.CRON_SECRET
    default:
      return false
  }
}
