# Configuration des Cron Jobs - Cleekzy

## Prérequis

1. Compte sur [cron-job.org](https://cron-job.org) (gratuit)
2. Variable `CRON_SECRET` configurée sur Vercel

## Cron Jobs à configurer

### 1. Bot Clicks (CRITIQUE)

Gère le cycle de vie des jeux : activation, clics des bots, fin des parties.

| Paramètre | Valeur |
|-----------|--------|
| **URL** | `https://cleekzy.com/api/cron/bot-clicks` |
| **Méthode** | `GET` ou `POST` |
| **Fréquence** | Toutes les minutes (`* * * * *`) |
| **Header** | `Authorization: Bearer [CRON_SECRET]` |

### 2. Reset Credits (CRITIQUE)

Reset les crédits quotidiens des utilisateurs gratuits à minuit.

| Paramètre | Valeur |
|-----------|--------|
| **URL** | `https://cleekzy.com/api/cron/reset-credits` |
| **Méthode** | `GET` ou `POST` |
| **Fréquence** | Chaque jour à minuit UTC (`0 0 * * *`) |
| **Header** | `Authorization: Bearer [CRON_SECRET]` |

> **Note :** Pour minuit heure de Paris, utiliser `0 23 * * *` (23h UTC = 00h Paris en hiver) ou `0 22 * * *` (22h UTC = 00h Paris en été).

### 3. Create Rotation (IMPORTANT)

Crée les jeux pour la prochaine rotation (toutes les 3 heures).

| Paramètre | Valeur |
|-----------|--------|
| **URL** | `https://cleekzy.com/api/cron/create-rotation` |
| **Méthode** | `GET` ou `POST` |
| **Fréquence** | `45 22,1,4,7,10,13,16,19 * * *` (à :45 aux heures de rotation) |
| **Header** | `Authorization: Bearer [CRON_SECRET]` |

> Les heures (22, 1, 4, 7, 10, 13, 16, 19 UTC) correspondent aux rotations Paris (23h, 2h, 5h, 8h, 11h, 14h, 17h, 20h).

### 4. Activate Games (BACKUP)

Backup pour activer les jeux - normalement géré par bot-clicks.

| Paramètre | Valeur |
|-----------|--------|
| **URL** | `https://cleekzy.com/api/cron/activate-games` |
| **Méthode** | `GET` ou `POST` |
| **Fréquence** | Toutes les minutes (`* * * * *`) |
| **Header** | `Authorization: Bearer [CRON_SECRET]` |

## Configuration sur cron-job.org

### Étape 1 : Créer un compte
1. Aller sur https://cron-job.org
2. S'inscrire (gratuit jusqu'à 50 jobs)

### Étape 2 : Ajouter un cron job
1. Cliquer sur "Create cronjob"
2. Remplir les champs :
   - **Title** : Nom du job (ex: "Cleekzy - Bot Clicks")
   - **URL** : L'URL du endpoint
   - **Schedule** : Expression cron
   - **Request method** : GET
   - **Headers** : Ajouter `Authorization` avec la valeur `Bearer [CRON_SECRET]`

### Étape 3 : Tester
1. Cliquer sur "Test run" pour vérifier que ça fonctionne
2. Vérifier les logs pour s'assurer que le job s'exécute correctement

## Vérification

Pour tester manuellement un endpoint :

```bash
curl -X GET "https://cleekzy.com/api/cron/bot-clicks" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Réponse attendue :
```json
{
  "message": "Activated 0, checked 18 games, 0 ended",
  "activated": 0,
  "processed": 18,
  "ended": 0
}
```

## Monitoring

Les logs des cron jobs sont visibles dans :
- **Vercel** : Logs des fonctions serverless
- **cron-job.org** : Historique des exécutions avec statut
