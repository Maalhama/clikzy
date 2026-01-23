import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% des transactions (économise le quota)

  // Session Replay (désactivé pour économiser le quota)
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
