#!/bin/bash

# Script pour tester E2E avec les mêmes conditions que CI
# Reproduit l'environnement GitHub Actions en local

set -e

echo "🧪 Test E2E - Simulation CI/CD"
echo "==============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📦 Variables d'environnement (fake comme CI)..."
export NEXT_PUBLIC_SUPABASE_URL=https://fake.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key
export SUPABASE_SERVICE_ROLE_KEY=fake-service-key
export STRIPE_SECRET_KEY=sk_test_fake
export STRIPE_WEBHOOK_SECRET=whsec_fake
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_fake
export RESEND_API_KEY=re_fake
export RESEND_FROM_EMAIL="CLEEKZY <noreply@cleekzy.com>"
export CRON_SECRET=fake-cron-secret
export NEXT_PUBLIC_SITE_URL=http://localhost:3000

echo -e "${GREEN}✅ Variables configurées${NC}"
echo ""

# Vérifier que Playwright est installé
if ! command -v playwright &> /dev/null; then
    echo -e "${YELLOW}⚠️  Playwright non installé. Installation...${NC}"
    npx playwright install --with-deps chromium
fi

echo "🚀 Démarrage du serveur Next.js..."
# Démarrer le serveur en arrière-plan
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

echo "PID du serveur: $DEV_PID"

# Attendre que le serveur démarre
echo "⏳ Attente du serveur (max 2 minutes)..."
timeout=120
elapsed=0

while ! curl -s http://localhost:3000 > /dev/null; do
    sleep 1
    elapsed=$((elapsed + 1))

    if [ $elapsed -ge $timeout ]; then
        echo -e "${RED}❌ Le serveur n'a pas démarré dans les 2 minutes${NC}"
        kill $DEV_PID 2>/dev/null || true
        exit 1
    fi

    # Afficher un point tous les 5 secondes
    if [ $((elapsed % 5)) -eq 0 ]; then
        echo -n "."
    fi
done

echo ""
echo -e "${GREEN}✅ Serveur démarré${NC}"
echo ""

# Exécuter les tests
echo "🧪 Exécution des tests Playwright..."
echo ""

if npx playwright test --reporter=list; then
    echo ""
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    TEST_EXIT=0
else
    echo ""
    echo -e "${RED}❌ Certains tests ont échoué${NC}"
    TEST_EXIT=1
fi

# Arrêter le serveur
echo ""
echo "🛑 Arrêt du serveur..."
kill $DEV_PID 2>/dev/null || true

exit $TEST_EXIT
