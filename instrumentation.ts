export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fail-fast : vérifie la présence des variables d'environnement requises au boot.
    const { validateEnvOnStartup } = await import("@/lib/security/envValidation");
    validateEnvOnStartup();

    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// RGPD #P2 (audit 2026-06-18) : ne JAMAIS joindre l'URL brute (elle peut porter
// des query params sensibles : ?ref=, ?token=, email, ids). On ne conserve que
// le chemin (pathname), sans query string. Le beforeSend des configs Sentry
// re-scrubbe en seconde barrière, mais on minimise à la source.
function safePathname(rawUrl: string): string {
  try {
    return new URL(rawUrl).pathname;
  } catch {
    // URL relative/malformée : on coupe au premier "?" pour retirer la query.
    return rawUrl.split("?")[0] ?? rawUrl;
  }
}

export const onRequestError = async (
  error: Error,
  request: Request,
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error, {
    extra: {
      // pathname seul (pas l'URL complète) -> pas de query params sensibles.
      path: safePathname(request.url),
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  });
};
