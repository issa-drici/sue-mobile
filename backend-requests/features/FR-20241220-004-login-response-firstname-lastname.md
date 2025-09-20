# Demande de fonctionnalité : Ajouter firstname et lastname dans la réponse de connexion

## 📋 Description

Actuellement, l'endpoint `/api/login` ne retourne que `full_name` (qui est souvent `null`) dans la réponse utilisateur, alors que l'endpoint `/api/register` retourne correctement `firstname` et `lastname`.

## 🎯 Objectif

Modifier l'endpoint de connexion pour qu'il retourne `firstname` et `lastname` dans la réponse utilisateur, comme c'est déjà le cas pour l'inscription.

## 🔍 Problème actuel

### Réponse actuelle de `/api/login` :
```json
{
  "message": "Connexion réussie",
  "token": "3|SE2CMrpPKR1lFHD2keaqlScE4znF6ouZSralFFdw3a709976",
  "user": {
    "id": "9f8fee90-222c-4df7-ad0d-a205991b1ae2",
    "email": "test@example.com",
    "full_name": null,
    "role": "player"
  }
}
```

### Réponse actuelle de `/api/register` (correcte) :
```json
{
  "token": "2|4Wvdxrzi2JFicg3N11gaLEe3WXsQCNdYTN7OjpWP667567e4",
  "user": {
    "email": "test@example.com",
    "firstname": "Test",
    "lastname": "User",
    "role": "player",
    "id": "9f8fee90-222c-4df7-ad0d-a205991b1ae2",
    "updated_at": "2025-08-05T14:48:35.000000Z",
    "created_at": "2025-08-05T14:48:35.000000Z"
  }
}
```

## ✅ Solution demandée

### Réponse attendue de `/api/login` :
```json
{
  "message": "Connexion réussie",
  "token": "3|SE2CMrpPKR1lFHD2keaqlScE4znF6ouZSralFFdw3a709976",
  "user": {
    "id": "9f8fee90-222c-4df7-ad0d-a205991b1ae2",
    "email": "test@example.com",
    "firstname": "Test",
    "lastname": "User",
    "role": "player"
  }
}
```

## 🔧 Implémentation suggérée

Dans le contrôleur d'authentification Laravel, modifier la réponse de connexion pour inclure `firstname` et `lastname` :

```php
// Dans le contrôleur de connexion
return response()->json([
    'message' => 'Connexion réussie',
    'token' => $token,
    'user' => [
        'id' => $user->id,
        'email' => $user->email,
        'firstname' => $user->firstname,
        'lastname' => $user->lastname,
        'role' => $user->role
    ]
]);
```

## 📱 Impact sur le frontend

Cette modification permettra de :
- ✅ Supprimer la logique de normalisation complexe dans le frontend
- ✅ Avoir une cohérence entre les réponses de connexion et d'inscription
- ✅ Éviter les valeurs par défaut comme "Utilisateur Anonyme"
- ✅ Simplifier le code d'authentification

## 🧪 Tests

### Test avec curl :
```bash
curl -X POST https://api.sue.alliance-tech.fr/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "device_name": "Alarrache Mobile App"
  }'
```

### Réponse attendue :
```json
{
  "message": "Connexion réussie",
  "token": "...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "firstname": "Test",
    "lastname": "User",
    "role": "player"
  }
}
```

## 📅 Priorité

**Haute** - Cette modification est nécessaire pour une expérience utilisateur cohérente et pour simplifier le code frontend.

## 🔗 Liens connexes

- Issue frontend : Correction de la gestion des données utilisateur
- Documentation API : Structure des réponses d'authentification 