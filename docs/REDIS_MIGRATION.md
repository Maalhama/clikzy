# Migration Redis pour Production

## 🚨 Problème Actuel

Le rate limiting actuel (`src/lib/rateLimit.ts`) utilise un stockage **en mémoire** avec une Map JavaScript :

```typescript
const rateLimitStore = new Map<string, RateLimitEntry>()
```

### Limitations en production

1. **Perte de données au redémarrage** : Les compteurs sont réinitialisés à chaque deploy
2. **Pas de partage entre instances** : Chaque instance Vercel a sa propre Map
3. **Fuite mémoire potentielle** : Les entrées expirées ne sont pas automatiquement supprimées
4. **Pas de persistance** : Impossible d'analyser les patterns d'attaque a posteriori

### Impact

Avec plusieurs instances serverless (Vercel/Netlify), un utilisateur peut contourner la limite en étant distribué sur plusieurs instances.

**Exemple** :
- Instance A : 60 requêtes/min (limite atteinte)
- Instance B : 60 requêtes/min (limite atteinte)
- Instance C : 60 requêtes/min (limite atteinte)
- **Total réel : 180 requêtes/min** au lieu de 60

---

## ✅ Solution : Redis (Upstash)

### Pourquoi Upstash ?

- ✅ **Gratuit jusqu'à 10k requêtes/jour**
- ✅ **Compatible serverless** (HTTP-based, pas de connexion persistente)
- ✅ **Global** : Faible latence partout dans le monde
- ✅ **Pas de configuration** : Pas besoin de gérer un serveur Redis

### Installation

```bash
npm install @upstash/redis
```

### Configuration

1. Créer un compte sur [console.upstash.com](https://console.upstash.com)
2. Créer une database Redis (choisir la région la plus proche)
3. Copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`

Ajouter à `.env.local` :

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

---

## 📝 Code à Modifier

### 1. Créer `src/lib/redis.ts`

```typescript
import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined')
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
```

### 2. Modifier `src/lib/rateLimit.ts`

**AVANT (en mémoire)** :

```typescript
type RateLimitEntry = {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { success: true, remaining: limit - 1 }
  }

  if (current.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: current.resetTime - now,
    }
  }

  current.count++
  rateLimitStore.set(key, current)

  return {
    success: true,
    remaining: limit - current.count,
  }
}
```

**APRÈS (avec Redis)** :

```typescript
import { redis } from './redis'

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowSeconds = Math.ceil(windowMs / 1000)

  // Utilise Redis INCR avec expiration automatique
  const count = await redis.incr(key)

  if (count === 1) {
    // Première requête dans cette fenêtre : définir l'expiration
    await redis.expire(key, windowSeconds)
  }

  if (count > limit) {
    const ttl = await redis.ttl(key)
    return {
      success: false,
      remaining: 0,
      resetIn: ttl * 1000,
    }
  }

  return {
    success: true,
    remaining: limit - count,
  }
}

// Les rate limiters restent identiques
export const rateLimiters = {
  api: (identifier: string) => checkRateLimit(identifier, 60, 60_000),
  payment: (identifier: string) => checkRateLimit(identifier, 10, 60_000),
  cron: (identifier: string) => checkRateLimit(identifier, 10, 60_000),
}
```

### 3. Modifier `src/proxy.ts` (middleware)

```typescript
// Avant :
if (!rateLimitResult.success) {
  return NextResponse.json(...)
}

// Après :
const rateLimitResult = await rateLimiters.api(ip)
if (!rateLimitResult.success) {
  return NextResponse.json(...)
}
```

**IMPORTANT** : Ajouter `await` car `checkRateLimit` devient asynchrone.

---

## 🧪 Tests

Modifier `src/__tests__/lib/rateLimit.test.ts` pour mocker Redis :

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Upstash Redis
const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
}

vi.mock('@/lib/redis', () => ({
  redis: mockRedis,
}))

describe('Rate Limiter with Redis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow first request', async () => {
    mockRedis.incr.mockResolvedValue(1)
    mockRedis.expire.mockResolvedValue(1)

    const result = await checkRateLimit('test-ip', 5, 60000)

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
    expect(mockRedis.expire).toHaveBeenCalledWith('ratelimit:test-ip', 60)
  })

  it('should block when limit exceeded', async () => {
    mockRedis.incr.mockResolvedValue(6)
    mockRedis.ttl.mockResolvedValue(45)

    const result = await checkRateLimit('test-ip', 5, 60000)

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.resetIn).toBe(45000)
  })
})
```

---

## 📊 Coûts Upstash

| Plan | Requêtes/jour | Prix |
|------|---------------|------|
| **Gratuit** | 10 000 | 0€ |
| Pay as you go | 100 000 | ~0.20€ |
| Pay as you go | 1 000 000 | ~2€ |

Pour Clikzy en production :
- Rate limiting : ~3 requêtes Redis par requête HTTP (api, payment, cron)
- Avec 10k requêtes HTTP/jour → 30k requêtes Redis/jour
- **Coût estimé : 0€ à 0.60€/mois**

---

## ✅ Checklist Migration

- [ ] Créer compte Upstash
- [ ] Créer database Redis (région Europe West)
- [ ] Ajouter credentials dans `.env.local` et Vercel
- [ ] Installer `@upstash/redis`
- [ ] Créer `src/lib/redis.ts`
- [ ] Modifier `src/lib/rateLimit.ts` (ajouter async/await)
- [ ] Modifier `src/proxy.ts` (ajouter await)
- [ ] Mettre à jour les tests
- [ ] Tester en local
- [ ] Déployer sur preview
- [ ] Vérifier les logs Upstash
- [ ] Déployer en production

---

## 🔧 Alternative : Vercel KV

Si tu utilises Vercel, tu peux aussi utiliser **Vercel KV** (basé sur Upstash) :

```bash
npm install @vercel/kv
```

Même API, mais intégré directement dans le dashboard Vercel. Gratuit jusqu'à 256 MB.

---

## 📌 Conclusion

**Quand migrer ?**

- ✅ **Avant le lancement public** : Pour éviter les abus dès le jour 1
- ✅ **Quand tu passes en production** : Le rate limiting actuel est OK pour le dev
- ⚠️ **Pas urgent** : Mais à faire avant d'avoir du trafic réel

**Effort estimé** : 1-2 heures (setup + tests)

**Priorité** : 🟡 Moyenne (important pour la prod, pas bloquant pour le dev)
