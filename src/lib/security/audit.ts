/**
 * Audit Logging System
 * Centralized logging for security-critical events
 */

export type AuditEventType =
  // Auth events
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.password_reset'
  | 'auth.failed_login'
  // Credit events
  | 'credits.purchase'
  | 'credits.deduct'
  | 'credits.refund'
  | 'credits.daily_reset'
  // Game events
  | 'game.click'
  | 'game.win'
  | 'game.fraud_detected'
  // Admin events
  | 'admin.access'
  | 'admin.action'
  // Payment events
  | 'payment.checkout_created'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.webhook_received'
  // VIP events
  | 'vip.subscribed'
  | 'vip.cancelled'
  | 'vip.renewed'
  // Security events
  | 'security.rate_limited'
  | 'security.suspicious_activity'
  | 'security.blocked'

export interface AuditLogEntry {
  timestamp: string
  event: AuditEventType
  userId?: string
  username?: string
  ip?: string
  userAgent?: string
  details: Record<string, unknown>
  severity: 'info' | 'warning' | 'error' | 'critical'
}

/**
 * Log an audit event
 * In production, this should be sent to a logging service (Datadog, Logtail, etc.)
 */
export function auditLog(
  event: AuditEventType,
  details: Record<string, unknown>,
  options: {
    userId?: string
    username?: string
    ip?: string
    userAgent?: string
    severity?: AuditLogEntry['severity']
  } = {}
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId: options.userId,
    username: options.username,
    ip: options.ip,
    userAgent: options.userAgent,
    details,
    severity: options.severity || getSeverityForEvent(event),
  }

  // Format log message
  const logMessage = formatAuditLog(entry)

  // Log based on severity
  switch (entry.severity) {
    case 'critical':
    case 'error':
      console.error(logMessage)
      break
    case 'warning':
      console.warn(logMessage)
      break
    default:
      console.log(logMessage)
  }
}

function getSeverityForEvent(event: AuditEventType): AuditLogEntry['severity'] {
  const criticalEvents: AuditEventType[] = [
    'game.fraud_detected',
    'security.blocked',
    'payment.failed',
  ]
  const warningEvents: AuditEventType[] = [
    'auth.failed_login',
    'security.rate_limited',
    'security.suspicious_activity',
  ]
  const errorEvents: AuditEventType[] = [
    'credits.refund',
  ]

  if (criticalEvents.includes(event)) return 'critical'
  if (errorEvents.includes(event)) return 'error'
  if (warningEvents.includes(event)) return 'warning'
  return 'info'
}

function formatAuditLog(entry: AuditLogEntry): string {
  const severityUpper = entry.severity.toUpperCase()
  const userPart = entry.userId ? `user=${entry.userId.substring(0, 8)}` : ''
  const ipPart = entry.ip ? `ip=${entry.ip}` : ''

  const parts = [
    '[AUDIT]',
    `[${severityUpper}]`,
    `[${entry.event}]`,
    userPart,
    ipPart,
    JSON.stringify(entry.details),
  ].filter(Boolean)

  return parts.join(' ')
}

/**
 * Extract IP from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return headers.get('x-real-ip') || 'unknown'
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown'
}
