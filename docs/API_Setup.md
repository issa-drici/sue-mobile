# Configuration de l'API - Variables d'Environnement

## Configuration avec variables d'environnement

### 1. Créer un fichier `.env` à la racine du projet

```bash
# Configuration de l'API
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Mode mocks (true pour utiliser les mocks, false pour l'API réelle)
EXPO_PUBLIC_USE_MOCKS=false

# Configuration du serveur
EXPO_PUBLIC_SERVER_HOST=localhost
EXPO_PUBLIC_SERVER_PORT=8000
EXPO_PUBLIC_API_VERSION=v1

# Configuration de l'application
EXPO_PUBLIC_APP_NAME=Sue
EXPO_PUBLIC_APP_VERSION=1.0.0

# Configuration des timeouts (en millisecondes)
EXPO_PUBLIC_REQUEST_TIMEOUT=10000
EXPO_PUBLIC_MAX_RETRIES=3

# Configuration de l'environnement
EXPO_PUBLIC_ENVIRONMENT=development
```

### 2. Variables d'environnement disponibles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `EXPO_PUBLIC_API_BASE_URL` | URL de base de l'API | `http://localhost:8000/api` |
| `EXPO_PUBLIC_USE_MOCKS` | Activer/désactiver les mocks | `false` |
| `EXPO_PUBLIC_SERVER_HOST` | Hôte du serveur | `localhost` |
| `EXPO_PUBLIC_SERVER_PORT` | Port du serveur | `8000` |
| `EXPO_PUBLIC_API_VERSION` | Version de l'API | `v1` |
| `EXPO_PUBLIC_APP_NAME` | Nom de l'application | `Sue` |
| `EXPO_PUBLIC_APP_VERSION` | Version de l'application | `1.0.0` |
| `EXPO_PUBLIC_REQUEST_TIMEOUT` | Timeout des requêtes (ms) | `10000` |
| `EXPO_PUBLIC_MAX_RETRIES` | Nombre max de tentatives | `3` |
| `EXPO_PUBLIC_ENVIRONMENT` | Environnement | `development` |

### 3. URLs supportées

Vous pouvez configurer différentes URLs selon votre serveur :

```bash
# Express.js (port 3000)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
EXPO_PUBLIC_SERVER_PORT=3000

# Django (port 8000)
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
EXPO_PUBLIC_SERVER_PORT=8000

# Flask (port 5000)
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_SERVER_PORT=5000

# Laravel (port 8000)
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
EXPO_PUBLIC_SERVER_PORT=8000

# Node.js avec port personnalisé
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
EXPO_PUBLIC_SERVER_PORT=4000
```

### 4. Vérification de la configuration

L'URL configurée sera utilisée dans :
- `config/env.ts` - Configuration d'environnement
- `services/api/baseApi.ts` - Service API principal

### 5. Redémarrage requis

Après modification du fichier `.env`, redémarrez l'application :

```bash
npx expo start --clear
```

### 6. Logs de débogage

L'application affiche maintenant des logs détaillés :
- 🌐 Requêtes API réelles
- 🎭 Requêtes mock
- ✅ Réponses réussies
- ❌ Erreurs API

## Structure des endpoints attendue

Votre serveur doit exposer les endpoints suivants :

### Authentification
- `POST /api/register` - Inscription
- `POST /api/login` - Connexion
- `POST /api/logout` - Déconnexion
- `POST /api/refresh` - Rafraîchissement du token

### Utilisateurs
- `GET /api/users/profile` - Profil utilisateur
- `GET /api/users/friends` - Liste des amis
- `GET /api/users/friend-requests` - Demandes d'amis
- `GET /api/users/search?q=query` - Recherche d'utilisateurs
- `PUT /api/users/profile` - Mise à jour du profil
- `POST /api/users/update-email` - Changement d'email
- `POST /api/users/update-password` - Changement de mot de passe
- `DELETE /api/users` - Suppression de compte

### Sessions
- `GET /api/sessions` - Liste des sessions
- `GET /api/sessions/:id` - Détails d'une session
- `POST /api/sessions` - Création d'une session
- `PUT /api/sessions/:id` - Modification d'une session
- `DELETE /api/sessions/:id` - Suppression d'une session
- `POST /api/sessions/:id/respond` - Répondre à une invitation
- `POST /api/sessions/:id/comments` - Ajouter un commentaire

### Notifications
- `GET /api/notifications` - Liste des notifications
- `POST /api/notifications/:id/read` - Marquer comme lu
- `POST /api/notifications/read-all` - Tout marquer comme lu

### Demandes d'amis
- `POST /api/users/friend-requests/:id` - Répondre à une demande

## Format des réponses

Toutes les réponses doivent suivre ce format :

```json
{
  "success": true,
  "data": {
    // Données de la réponse
  },
  "message": "Message optionnel"
}
```

## Gestion des erreurs

Les erreurs doivent suivre ce format :

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Message d'erreur"
  }
}
```

## Headers requis

- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <token>` (pour les routes protégées)

## Codes d'erreur standards

- `400` - Bad Request (données invalides)
- `401` - Unauthorized (token invalide)
- `403` - Forbidden (accès refusé)
- `404` - Not Found (ressource non trouvée)
- `409` - Conflict (conflit de données)
- `500` - Internal Server Error (erreur serveur)

## Test de connexion

Pour tester si votre serveur répond correctement :

```bash
curl -X GET http://localhost:8000/api/health
```

Ou dans l'application, vérifiez les logs de la console pour voir les requêtes envoyées.

## Fonctions utilitaires disponibles

```typescript
import { buildApiUrl, isDevelopment, isMockMode } from '../config/env';

// Construire une URL complète
const url = buildApiUrl('/auth/login');

// Vérifier si on est en mode développement
if (isDevelopment()) {
}

// Vérifier si les mocks sont activés
if (isMockMode()) {
}
``` 