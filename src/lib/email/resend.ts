import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('RESEND_API_KEY not configured - emails will not be sent')
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Cleekzy <noreply@cleekzy.com>'
