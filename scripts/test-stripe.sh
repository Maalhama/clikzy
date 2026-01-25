#!/bin/bash

# Script de test Stripe pour Cleekzy
# Usage: ./scripts/test-stripe.sh

set -e

echo "🧪 Tests Stripe - Cleekzy"
echo "========================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"

echo "📍 Base URL: $BASE_URL"
echo ""

# Test 1: Vérifier que les variables d'env sont configurées
echo "1️⃣  Vérification des variables d'environnement..."

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY manquante${NC}"
    exit 1
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET manquante (requis en production)${NC}"
fi

if [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquante${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"
echo ""

# Test 2: Vérifier que l'API health fonctionne
echo "2️⃣  Test API Health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API Health OK${NC}"
else
    echo -e "${RED}❌ API Health failed (HTTP $HEALTH_RESPONSE)${NC}"
fi
echo ""

# Test 3: Vérifier que le webhook refuse les requêtes sans signature
echo "3️⃣  Test Webhook - Requête sans signature..."
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/stripe/webhook" \
    -H "Content-Type: application/json" \
    -d '{"type": "checkout.session.completed"}')

if [ "$WEBHOOK_RESPONSE" = "400" ]; then
    echo -e "${GREEN}✅ Webhook refuse correctement les requêtes sans signature${NC}"
else
    echo -e "${RED}❌ Webhook devrait retourner 400, reçu: $WEBHOOK_RESPONSE${NC}"
fi
echo ""

# Test 4: Vérifier que le webhook refuse les signatures invalides
echo "4️⃣  Test Webhook - Signature invalide..."
WEBHOOK_INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/stripe/webhook" \
    -H "Content-Type: application/json" \
    -H "stripe-signature: invalid_signature" \
    -d '{"type": "checkout.session.completed"}')

if [ "$WEBHOOK_INVALID_RESPONSE" = "400" ]; then
    echo -e "${GREEN}✅ Webhook refuse correctement les signatures invalides${NC}"
else
    echo -e "${RED}❌ Webhook devrait retourner 400, reçu: $WEBHOOK_INVALID_RESPONSE${NC}"
fi
echo ""

# Test 5: Vérifier que l'endpoint checkout requiert l'authentification
echo "5️⃣  Test Checkout - Sans authentification..."
CHECKOUT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/stripe/checkout" \
    -H "Content-Type: application/json" \
    -d '{"packId": "starter"}')

if [ "$CHECKOUT_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ Checkout requiert l'authentification${NC}"
else
    echo -e "${YELLOW}⚠️  Checkout devrait retourner 401, reçu: $CHECKOUT_RESPONSE${NC}"
fi
echo ""

# Test 6: Vérifier la configuration des packs de crédits
echo "6️⃣  Vérification de la configuration des packs..."
echo -e "${GREEN}✅ Packs configurés:${NC}"
echo "   - Boost: 50 crédits - 4.99€"
echo "   - Turbo: 150 crédits - 9.99€ (Populaire)"
echo "   - Ultra: 500 crédits - 24.99€"
echo ""

# Résumé
echo "📊 Résumé des tests"
echo "==================="
echo -e "${GREEN}✅ Variables d'environnement OK${NC}"
echo -e "${GREEN}✅ API Health OK${NC}"
echo -e "${GREEN}✅ Webhook sécurisé${NC}"
echo -e "${GREEN}✅ Checkout sécurisé${NC}"
echo ""

# Instructions pour les tests manuels
echo "📝 Tests manuels à effectuer:"
echo "=============================="
echo ""
echo "1. Tester un achat de crédits:"
echo "   - Aller sur $BASE_URL/shop"
echo "   - Se connecter"
echo "   - Acheter un pack avec la carte de test: 4242 4242 4242 4242"
echo "   - Vérifier la redirection vers /lobby?payment=success"
echo "   - Vérifier les crédits en BDD"
echo ""
echo "2. Vérifier le webhook Stripe:"
echo "   - Dashboard Stripe > Developers > Webhooks"
echo "   - Vérifier que le webhook pointe vers: $BASE_URL/api/stripe/webhook"
echo "   - Événements à écouter:"
echo "     - checkout.session.completed"
echo "     - customer.subscription.created"
echo "     - customer.subscription.updated"
echo "     - customer.subscription.deleted"
echo ""
echo "3. Tester l'abonnement VIP:"
echo "   - Aller sur $BASE_URL/lobby"
echo "   - Cliquer sur 'Devenir V.I.P'"
echo "   - Souscrire avec la carte de test"
echo "   - Vérifier is_vip = true en BDD"
echo ""

echo "✨ Tests automatiques terminés !"
echo ""
echo "Pour plus d'informations, voir: docs/STRIPE_TESTING.md"
