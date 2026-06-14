import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% des transactions

  // Ne capture que les erreurs en production
  enabled: process.env.NODE_ENV === "production",
});

// Avertissement au boot : en prod sans DSN, les erreurs ne remontent nulle part.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
  console.warn(
    "[Sentry] NEXT_PUBLIC_SENTRY_DSN absent en production — les erreurs serveur ne sont PAS remontées.",
  );
}
