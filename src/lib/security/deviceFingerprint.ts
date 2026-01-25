/**
 * Device Fingerprinting
 * Collect device characteristics to detect multi-accounting
 */

// In-memory store for device fingerprints (use Redis in production)
const deviceFingerprints = new Map<string, DeviceRecord>()

interface DeviceRecord {
  fingerprint: string
  userIds: Set<string>
  firstSeen: number
  lastSeen: number
  clickCount: number
}

export interface DeviceInfo {
  fingerprint: string
  userAgent: string
  acceptLanguage: string
  screenResolution?: string
  timezone?: string
  platform?: string
}

/**
 * Generate a simple server-side fingerprint from headers
 * Note: Client-side fingerprinting (FingerprintJS) would be more accurate
 */
export function generateServerFingerprint(headers: Headers): string {
  const components = [
    headers.get('user-agent') || '',
    headers.get('accept-language') || '',
    headers.get('accept-encoding') || '',
    headers.get('sec-ch-ua') || '',
    headers.get('sec-ch-ua-platform') || '',
    headers.get('sec-ch-ua-mobile') || '',
  ]

  // Simple hash function
  const str = components.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  return `fp_${Math.abs(hash).toString(36)}`
}

/**
 * Register a device-user association
 */
export function registerDevice(fingerprint: string, userId: string): void {
  const now = Date.now()
  let record = deviceFingerprints.get(fingerprint)

  if (!record) {
    record = {
      fingerprint,
      userIds: new Set(),
      firstSeen: now,
      lastSeen: now,
      clickCount: 0,
    }
    deviceFingerprints.set(fingerprint, record)
  }

  record.userIds.add(userId)
  record.lastSeen = now
}

/**
 * Check if a device is associated with multiple accounts
 */
export function checkMultiAccount(fingerprint: string, userId: string): {
  isMultiAccount: boolean
  accountCount: number
  otherAccounts: string[]
} {
  const record = deviceFingerprints.get(fingerprint)

  if (!record) {
    return {
      isMultiAccount: false,
      accountCount: 1,
      otherAccounts: [],
    }
  }

  const otherAccounts = Array.from(record.userIds).filter(id => id !== userId)

  return {
    isMultiAccount: otherAccounts.length > 0,
    accountCount: record.userIds.size,
    otherAccounts: otherAccounts.map(id => id.substring(0, 8)), // Truncate for privacy
  }
}

/**
 * Record a click from a device
 */
export function recordDeviceClick(fingerprint: string): void {
  const record = deviceFingerprints.get(fingerprint)
  if (record) {
    record.clickCount++
    record.lastSeen = Date.now()
  }
}

/**
 * Get device statistics
 */
export function getDeviceStats(fingerprint: string): DeviceRecord | null {
  return deviceFingerprints.get(fingerprint) || null
}

/**
 * Clear device data (for testing)
 */
export function clearDeviceData(): void {
  deviceFingerprints.clear()
}

/**
 * Check if device is suspicious based on multi-accounting
 */
export function isDeviceSuspicious(fingerprint: string): {
  suspicious: boolean
  reason?: string
  riskLevel: 'low' | 'medium' | 'high'
} {
  const record = deviceFingerprints.get(fingerprint)

  if (!record) {
    return { suspicious: false, riskLevel: 'low' }
  }

  // Multiple accounts from same device
  if (record.userIds.size >= 3) {
    return {
      suspicious: true,
      reason: `Device associated with ${record.userIds.size} accounts`,
      riskLevel: 'high',
    }
  }

  if (record.userIds.size === 2) {
    return {
      suspicious: true,
      reason: 'Device associated with 2 accounts',
      riskLevel: 'medium',
    }
  }

  return { suspicious: false, riskLevel: 'low' }
}
