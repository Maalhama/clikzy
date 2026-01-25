/**
 * Web Vitals Monitoring
 * Track Core Web Vitals metrics for performance monitoring
 */

export type WebVitalMetric = {
  id: string
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
}

// Thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },   // Largest Contentful Paint
  FID: { good: 100, poor: 300 },     // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },    // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },   // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },   // Time to First Byte
  INP: { good: 200, poor: 500 },     // Interaction to Next Paint
}

/**
 * Get rating for a metric value
 */
function getRating(name: WebVitalMetric['name'], value: number): WebVitalMetric['rating'] {
  const threshold = THRESHOLDS[name]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Report Web Vital to analytics
 * In production, send to analytics service (Umami, Google Analytics, etc.)
 */
export function reportWebVital(metric: WebVitalMetric): void {
  const rating = getRating(metric.name, metric.value)

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const color = rating === 'good' ? '\x1b[32m' : rating === 'needs-improvement' ? '\x1b[33m' : '\x1b[31m'
    console.log(`${color}[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${rating})\x1b[0m`)
  }

  // Send to Umami if configured
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(`web-vital-${metric.name.toLowerCase()}`, {
      value: Math.round(metric.value),
      rating,
    })
  }

  // You can also send to other analytics services here
  // sendToAnalytics({ ...metric, rating })
}

/**
 * Initialize Web Vitals tracking
 * Call this in your root layout or _app
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')

    onCLS((metric) => reportWebVital({
      id: metric.id,
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType,
    }))

    onFCP((metric) => reportWebVital({
      id: metric.id,
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType,
    }))

    onLCP((metric) => reportWebVital({
      id: metric.id,
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType,
    }))

    onTTFB((metric) => reportWebVital({
      id: metric.id,
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType,
    }))

    onINP((metric) => reportWebVital({
      id: metric.id,
      name: 'INP',
      value: metric.value,
      rating: getRating('INP', metric.value),
      delta: metric.delta,
      navigationType: metric.navigationType,
    }))
  } catch (error) {
    // web-vitals not available, skip
    console.warn('Web Vitals not available:', error)
  }
}
