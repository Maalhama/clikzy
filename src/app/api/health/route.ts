import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health check endpoint for uptime monitoring (UptimeRobot, etc.)
 * GET /api/health
 *
 * Returns:
 * - 200: All systems operational
 * - 503: Database connection failed
 */
export async function GET() {
  const checks = {
    status: 'ok' as 'ok' | 'error',
    timestamp: new Date().toISOString(),
    services: {
      api: true,
      database: false,
    },
  }

  try {
    // Check database connection
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      checks.status = 'error'
      checks.services.database = false
    } else {
      checks.services.database = true
    }
  } catch {
    checks.status = 'error'
    checks.services.database = false
  }

  const statusCode = checks.status === 'ok' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
