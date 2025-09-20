# FR-20250122-004: Endpoint pour récupérer le profil d'un utilisateur par ID

## 🎯 Objectif
Créer un endpoint pour récupérer le profil d'un utilisateur spécifique par son ID, utilisé dans la modal de profil utilisateur.

## 📋 Fonctionnalité demandée

### Endpoint
- **Méthode** : `GET`
- **URL** : `/api/users/{userId}`
- **Authentification** : Requise (token Bearer)

### Paramètres
- `userId` (path parameter) : ID de l'utilisateur dont on veut récupérer le profil

### Réponse attendue

#### Succès (200)
```json
{
  "success": true,
  "data": {
    "id": "123",
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean.dupont@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "stats": {
      "sessionsCreated": 5,
      "sessionsParticipated": 12
    },
    "isAlreadyFriend": false
  }
}
```

#### Erreur (404)
```json
{
  "success": false,
  "message": "Utilisateur non trouvé"
}
```

#### Erreur (401)
```json
{
  "success": false,
  "message": "Non autorisé"
}
```

## 🔒 Sécurité
- Vérifier que l'utilisateur connecté a le droit d'accéder au profil demandé
- Ne pas exposer d'informations sensibles (mot de passe, etc.)
- Limiter les informations retournées selon les permissions

## 📊 Données à inclure
- **Informations de base** : id, firstname, lastname, email, avatar
- **Statistiques** : sessionsCreated, sessionsParticipated
- **Statut d'amitié** : isAlreadyFriend (boolean) - indique si l'utilisateur connecté a déjà cet utilisateur en ami
- **Exclure** : mot de passe, informations sensibles

## 🧪 Tests à implémenter
- Test avec un utilisateur existant (ami et non-ami)
- Test avec un utilisateur inexistant
- Test sans authentification
- Test avec des permissions insuffisantes
- Test du statut d'amitié (isAlreadyFriend)

## 📝 Notes
- Cet endpoint est utilisé dans la modal de profil utilisateur
- Les statistiques peuvent être calculées en temps réel ou mises en cache
- L'avatar peut être null si l'utilisateur n'en a pas défini
