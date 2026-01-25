#!/bin/bash
# Hook: Lint après édition de fichiers TypeScript/JavaScript
# Désactivé par défaut pour éviter la consommation excessive de tokens

FILE="$1"

# Vérifier si le fichier est un fichier TS/JS
if [[ "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # Lint silencieux - ne pas bloquer si erreur
  # Décommenter la ligne suivante pour activer
  # npx eslint "$FILE" --fix --quiet 2>/dev/null || true
  echo "📝 Edited: $FILE"
fi
