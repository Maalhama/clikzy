import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring DÉSACTIVÉ : le tracing de perf est un traceur soumis à
  // consentement (CNIL). Sentry reste en capture d'ERREURS seule (intérêt légitime :
  // sécurité/débogage), sans transactions ni replay -> pas de consentement requis.
  tracesSampleRate: 0,

  // Session Replay (désactivé : quota + conformité)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Ne capture que les erreurs en production
  enabled: process.env.NODE_ENV === "production",

  // Ignore certaines erreurs communes non critiques
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    "ChunkLoadError",
  ],
});
