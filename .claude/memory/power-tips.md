# Power Tips - Claude Code

## Raccourcis essentiels

| Raccourci | Action |
|-----------|--------|
| `Shift+Tab` | Basculer en Plan Mode |
| `#` | Ajouter une instruction au CLAUDE.md |
| `/clear` | Nettoyer le contexte (à utiliser souvent) |
| `Esc` | Annuler l'action en cours |
| `Ctrl+C` | Interrompre Claude |

## Commandes utiles

```bash
# Lancer sans permissions (mode yolo)
claude --dangerously-skip-permissions

# Voir l'utilisation des tokens
/usage

# Statistiques de la session
/stats

# Installer l'app GitHub pour review auto
/install-github-app

# Gérer les serveurs MCP
/mcp
```

## Niveaux de réflexion

| Niveau | Trigger | Usage |
|--------|---------|-------|
| Standard | (rien) | Tâches simples |
| Think | "think" | Problèmes standards |
| Think Hard | "think hard" | Problèmes difficiles |
| **Ultrathink** | "ultrathink" | Problèmes complexes (max tokens) |

## Bonnes pratiques

### 1. Utiliser `/clear` souvent
Chaque nouvelle tâche = contexte frais. Évite la pollution du contexte.

### 2. Plan Mode d'abord
Toujours `Shift+Tab` pour passer en plan mode avant de coder des features complexes.

### 3. Diviser les problèmes
Un gros problème = plusieurs petits problèmes. Ne pas tout faire d'un coup.

### 4. Screenshots et visuels
Ajouter des captures d'écran dans les prompts pour plus de précision.

### 5. Contexte minimal
Ne pas surcharger le CLAUDE.md. Garder court et factuel.

## MCP Servers recommandés

```bash
# Context7 - Documentation des libs
claude mcp add context7 npx -y @anthropics/context7-mcp

# Playwright - Tests E2E
claude mcp add playwright npx @playwright/mcp@latest

# Supabase - Base de données
claude mcp add supabase npx supabase-mcp
```

## Alias terminal recommandés

```bash
# ~/.zshrc ou ~/.bashrc
alias c="claude"
alias cc="claude --dangerously-skip-permissions"
alias cplan="claude --plan"
```

## Workflow optimal

```
1. /clear (nouveau contexte)
2. Shift+Tab (plan mode)
3. Décrire la tâche
4. Valider le plan
5. Implémenter
6. /review (valider)
7. /commits (committer)
```
