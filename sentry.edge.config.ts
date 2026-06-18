import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, EventHint, Event as SentryEvent } from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Scrub PII (RGPD) — audit 2026-06-18 #P2.
// Dupliqué proprement dans chaque config Sentry (client/server/edge) : le
// périmètre interdit un helper sous src/**, et les 3 runtimes ont des bundles
// séparés. Logique identique partout. Conserve message + stack (debug) mais
// retire email, user_id, adresses, montants/crédits, tokens et nettoie l'URL.
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
const TOKEN_RE = /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g;
const LONG_SECRET_RE = /\b(sk_live_|sk_test_|re_|rk_live_|whsec_|pk_live_|pk_test_)[A-Za-z0-9_-]{6,}\b/g;
const USERID_RE = /\b(user[_ ]?id|userid|user)\s*[:=]?\s*["']?[0-9a-fA-F-]{8,}["']?/gi;
const MONEY_RE = /\b(amount(?:_total)?|price|credits?|earned_credits|solde|montant)\s*[:=]?\s*["']?\d+(?:[.,]\d+)?["']?/gi;
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

function scrubUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    for (const key of [...u.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.includes(key.toLowerCase())) {
        u.searchParams.set(key, "[redacted]");
      }
    }
    return scrubString(u.toString());
  } catch {
    return scrubString(rawUrl);
  }
}

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
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
  }

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

// Générique sur `Event` (base commune) : @sentry/nextjs ne réexporte pas
// `TransactionEvent`, mais le générique préserve le type concret reçu en sortie,
// donc compatible avec `beforeSendTransaction`. Champs touchés présents sur Event.
function scrubTransaction<T extends SentryEvent>(event: T): T {
  if (event.transaction) {
    event.transaction = scrubString(event.transaction);
  }
  if (event.request) {
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
    if (typeof event.request.query_string === "string") {
      event.request.query_string = scrubString(event.request.query_string);
    }
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
    delete event.user.geo;
    if (event.user.id) event.user.id = "[id]";
  }
  return event;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring : taux BAS et harmonisé avec le serveur (#P2 audit
  // 2026-06-18). Le client reste à 0 (consentement CNIL) ; l'edge n'est pas
  // soumis au consentement navigateur, on garde 5 % pour préserver le quota du
  // plan gratuit. Transactions scrubbées via beforeSendTransaction.
  tracesSampleRate: 0.05,
  beforeSendTransaction: scrubTransaction,

  // RGPD : ne jamais envoyer les PII collectées par défaut (IP, headers, cookies…).
  sendDefaultPii: false,

  // Ne capture que les erreurs en production
  enabled: process.env.NODE_ENV === "production",

  // RGPD #P2 : scrub PII avant envoi (email, user_id, montants, tokens, URL).
  beforeSend: scrubEvent,
});
