import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, EventHint } from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Scrub PII (RGPD) — audit 2026-06-18 #P2.
// Le scrubber est dupliqué proprement dans chaque config Sentry (client/server/
// edge) : le périmètre interdit de créer un helper sous src/**, et les 3 runtimes
// chargent des bundles séparés. La logique est identique partout (cf. server/edge).
// Objectif : conserver le message + la stack (utiles au debug) mais retirer toute
// donnée personnelle avant envoi vers Sentry (sous-traitant US) : email, user_id,
// adresses, montants/crédits, tokens/clés, et nettoyer l'URL des query params.
// ---------------------------------------------------------------------------

const SENSITIVE_QUERY_KEYS = [
  "ref",
  "token",
  "code",
  "secret",
  "key",
  "email",
  "access_token",
  "refresh_token",
  "session",
  "session_id",
  "api_key",
  "apikey",
  "password",
  "signature",
  "auth",
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// JWT (eyJ...) / clés API longues / tokens base64-ish — on masque les longues séquences opaques.
const TOKEN_RE = /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g;
const LONG_SECRET_RE = /\b(sk_live_|sk_test_|re_|rk_live_|whsec_|pk_live_|pk_test_)[A-Za-z0-9_-]{6,}\b/g;
// "user 1234abcd…", "userId: <uuid>", soldes/crédits/montants en clair.
const USERID_RE = /\b(user[_ ]?id|userid|user)\s*[:=]?\s*["']?[0-9a-fA-F-]{8,}["']?/gi;
const MONEY_RE = /\b(amount(?:_total)?|price|credits?|earned_credits|solde|montant)\s*[:=]?\s*["']?\d+(?:[.,]\d+)?["']?/gi;
// UUID isolé (souvent un id de ligne/utilisateur).
const UUID_RE = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

function scrubString(input: string): string {
  return input
    .replace(EMAIL_RE, "[email]")
    .replace(TOKEN_RE, "[token]")
    .replace(LONG_SECRET_RE, "[secret]")
    .replace(USERID_RE, "$1=[id]")
    .replace(MONEY_RE, "$1=[amount]")
    .replace(UUID_RE, "[uuid]");
}

/** Retire les query params sensibles d'une URL, et scrubbe le reste. */
function scrubUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    for (const key of [...u.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.includes(key.toLowerCase())) {
        u.searchParams.set(key, "[redacted]");
      }
    }
    // Scrubbe aussi les valeurs résiduelles (email/uuid en query) + le path.
    return scrubString(u.toString());
  } catch {
    // Pas une URL absolue : scrub best-effort sur la chaîne brute.
    return scrubString(rawUrl);
  }
}

/** Scrub récursif et borné des structures arbitraires (extra/contexts). */
function scrubDeep(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[truncated]";
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const keyLower = k.toLowerCase();
      if (keyLower === "url") {
        out[k] = typeof v === "string" ? scrubUrl(v) : scrubDeep(v, depth + 1);
      } else if (
        /(email|password|token|secret|key|authorization|cookie|address|adresse|credits?|amount|montant|solde|user_?id)/.test(
          keyLower,
        )
      ) {
        out[k] = "[redacted]";
      } else {
        out[k] = scrubDeep(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

/** beforeSend partagé : nettoie message, exception, request, user, extra, contexts. */
function scrubEvent(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.message) {
    event.message = scrubString(event.message);
  }

  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = scrubString(ex.value);
    }
  }

  if (event.request) {
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
    if (typeof event.request.query_string === "string") {
      event.request.query_string = scrubString(event.request.query_string);
    }
    // Données de corps / cookies / headers : on ne les transmet pas.
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
  }

  // PII utilisateur : on ne conserve aucun identifiant nominatif.
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
    delete event.user.geo;
    if (event.user.id) event.user.id = "[id]";
  }

  if (event.extra) {
    event.extra = scrubDeep(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = scrubDeep(event.contexts) as ErrorEvent["contexts"];
  }

  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring DÉSACTIVÉ côté client : le tracing de perf est un
  // traceur soumis à consentement (CNIL). Sentry reste en capture d'ERREURS
  // seule (intérêt légitime : sécurité/débogage), sans transactions ni replay
  // -> pas de consentement requis. Cohérent avec server/edge (0.05, scrubbé).
  tracesSampleRate: 0,

  // Session Replay (désactivé : quota + conformité)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // RGPD : ne jamais envoyer les PII collectées par défaut (IP, headers, cookies…).
  sendDefaultPii: false,

  // Ne capture que les erreurs en production
  enabled: process.env.NODE_ENV === "production",

  // RGPD #P2 : scrub PII avant envoi (email, user_id, montants, tokens, URL).
  beforeSend: scrubEvent,

  // Ignore certaines erreurs communes non critiques
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    "ChunkLoadError",
  ],
});
