# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Ajouté
- Système de création vidéo Remotion avec compositions professionnelles
  - ClikzyAd : Publicité TikTok/Reels (12.6s, 9:16)
  - ClikzyVertical : Promo verticale 30s
  - Skill Remotion avec 30+ règles de best practices
- Documentation complète du projet
  - CONTRIBUTING.md : Guide de contribution
  - docs/API.md : Documentation complète des APIs
  - docs/REDIS_MIGRATION.md : Guide migration Redis/Upstash
- Tests pour le système de parrainage (6 tests)
- Tests pour les actions de jeu (5 tests)

### Corrigé
- Bug critique : Crédits de parrainage ajoutés aux crédits quotidiens au lieu des earned_credits
- Erreur de build : Fonction `easeOutCubic` manquante dans Remotion
- Convention Next.js 16 : Renommé middleware.ts → proxy.ts
- Build warnings : metadataBase pour images OG/Twitter

### Amélioré
- Couverture de tests : 19 → 30 tests (+58%)
- Build : 0 erreurs, 0 warnings
- Configuration Turbopack pour éviter les warnings workspace

## [0.1.0] - 2026-01-25

### Ajouté
- Configuration complète Claude Code avec skills et agents
- Support pour 10 skills essentiels (ultrathink, smart-agent, architect, etc.)
- Configuration MCP avec Context7 pour documentation
- Instructions de développement dans CLAUDE.md

### Sécurité
- Rate limiting sur toutes les routes API
- Détection de fraude pour les clics
- RLS (Row Level Security) sur Supabase
- Headers de sécurité (CSP, HSTS, X-Frame-Options)
- Validation Stripe webhook signatures

---

Format des types de changements :
- **Ajouté** : Nouvelles fonctionnalités
- **Modifié** : Changements dans les fonctionnalités existantes
- **Déprécié** : Fonctionnalités bientôt supprimées
- **Supprimé** : Fonctionnalités supprimées
- **Corrigé** : Corrections de bugs
- **Sécurité** : Corrections de vulnérabilités
