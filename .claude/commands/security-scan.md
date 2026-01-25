# Commande: /security-scan

Audit de sécurité complet du codebase.

## Argument

$ARGUMENTS = [scope] (optionnel : all, backend, frontend, deps, secrets)
- Par défaut : all

## Workflow

### Phase 1: Scan des dépendances

1. **Audit npm**
   ```bash
   npm audit
   ```
   - Identifie les vulnérabilités connues (CVE)
   - Classe par sévérité : critical, high, moderate, low

2. **Dépendances obsolètes**
   ```bash
   npm outdated
   ```
   - Identifie les packages avec des mises à jour de sécurité

### Phase 2: Détection de secrets

**Patterns recherchés** :
- API keys hardcodées
- Tokens d'authentification
- Mots de passe en clair
- URLs avec credentials
- Clés privées

**Fichiers à scanner** :
- `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- `*.env*` (vérifier qu'ils sont gitignorés)
- Fichiers de config

**Vérifications** :
- [ ] `.env` dans `.gitignore`
- [ ] Pas de secrets dans le code source
- [ ] Pas de secrets dans les logs
- [ ] Variables d'environnement documentées dans `.env.example`

### Phase 3: Analyse OWASP Top 10

**A01 - Broken Access Control**
- Vérification des middlewares d'auth
- Contrôle des routes protégées
- Validation des permissions

**A02 - Cryptographic Failures**
- Pas de MD5/SHA1 pour les passwords
- HTTPS forcé en production
- Cookies sécurisés (httpOnly, secure, sameSite)

**A03 - Injection**
- SQL : Requêtes paramétrées uniquement
- XSS : Échappement des inputs utilisateur
- Command injection : Pas d'exec() avec user input

**A04 - Insecure Design**
- Rate limiting présent
- Validation des inputs (Zod, etc.)
- Gestion des erreurs sans leak d'info

**A05 - Security Misconfiguration**
- Headers de sécurité (HSTS, CSP, X-Frame-Options, etc.)
- Mode debug désactivé en prod
- Pas d'endpoints de debug exposés

**A06 - Vulnerable Components**
- Couvert par Phase 1 (npm audit)

**A07 - Authentication Failures**
- Sessions sécurisées
- Logout qui invalide la session
- Protection brute force

**A08 - Data Integrity Failures**
- Validation des données côté serveur
- Signature des tokens (JWT)

**A09 - Logging Failures**
- Logs des événements de sécurité
- Pas de données sensibles dans les logs

**A10 - SSRF**
- Validation des URLs externes
- Pas de fetch arbitraire

### Phase 4: Analyse spécifique Next.js/React

**Server Components**
- Pas de données sensibles exposées au client
- Validation des Server Actions

**API Routes**
- Authentification sur toutes les routes sensibles
- Rate limiting
- Validation des inputs

**Client Components**
- Pas de secrets côté client
- Sanitization des données affichées

### Phase 5: Rapport

**Format de sortie** :

```markdown
# Security Scan Report

## Résumé
- Critiques : X
- Hautes : X
- Moyennes : X
- Basses : X

## Vulnérabilités critiques 🔴
| Fichier | Ligne | Type | Description | Fix |
|---------|-------|------|-------------|-----|

## Vulnérabilités hautes 🟠
| Fichier | Ligne | Type | Description | Fix |

## Vulnérabilités moyennes 🟡
| Fichier | Ligne | Type | Description | Fix |

## Recommandations
1. [Action prioritaire 1]
2. [Action prioritaire 2]

## Checklist sécurité
- [ ] npm audit clean
- [ ] Pas de secrets hardcodés
- [ ] Headers de sécurité configurés
- [ ] Auth sur routes sensibles
- [ ] Rate limiting actif
```

## Principes

- **Ne jamais ignorer les critiques**
- **Documenter les faux positifs**
- **Proposer des fixes concrets**
- **Prioriser par impact business**
