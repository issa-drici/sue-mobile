# API Sessions - Documentation Backend

## Vue d'ensemble

Ce document détaille tous les endpoints de gestion des sessions de sport pour l'application Sue.

## Base URL

```
https://api.alarrache.com/api
```

## Endpoints

### 1. GET /sessions

**Description :** Récupérer toutes les sessions disponibles

**URL :** `/sessions`

**Méthode :** `GET`

**Headers :**

```
Authorization: Bearer <token>
```

**Query Parameters :**

```
?page=1&limit=20&sport=tennis&date=2024-01-15
```

**Réponse Succès (200) :**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "sport": "tennis",
      "date": "2024-03-25",
      "time": "18:00",
      "location": "Tennis Club de Paris",
      "organizer": {
        "id": "1",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "participants": [
        {
          "id": "1",
          "firstName": "Jean",
          "lastName": "Dupont",
          "status": "accepted"
        },
        {
          "id": "2",
          "firstName": "Marie",
          "lastName": "Martin",
          "status": "pending"
        }
      ],
      "comments": [
        {
          "id": "1",
          "userId": "1",
          "firstName": "Jean",
          "lastName": "Dupont",
          "content": "N'oubliez pas vos raquettes !",
          "createdAt": "2024-03-20T10:00:00Z"
        }
      ]
    },
    {
      "id": "2",
      "sport": "golf",
      "date": "2024-03-26",
      "time": "14:00",
      "location": "Golf Club de Versailles",
      "organizer": {
        "id": "2",
        "firstName": "Marie",
        "lastName": "Martin"
      },
      "participants": [
        {
          "id": "1",
          "firstName": "Jean",
          "lastName": "Dupont",
          "status": "accepted"
        },
        {
          "id": "2",
          "firstName": "Marie",
          "lastName": "Martin",
          "status": "accepted"
        }
      ],
      "comments": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### 2. GET /sessions/{id}

**Description :** Récupérer une session spécifique

**URL :** `/sessions/{id}`

**Méthode :** `GET`

**Headers :**

```
Authorization: Bearer <token>
```

**Réponse Succès (200) :**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "sport": "tennis",
    "date": "2024-03-25",
    "time": "18:00",
    "location": "Tennis Club de Paris",
    "organizer": {
      "id": "1",
      "firstName": "Jean",
      "lastName": "Dupont"
    },
    "participants": [
      {
        "id": "1",
        "firstName": "Jean",
        "lastName": "Dupont",
        "status": "accepted"
      },
      {
        "id": "2",
        "firstName": "Marie",
        "lastName": "Martin",
        "status": "pending"
      }
    ],
    "comments": [
      {
        "id": "1",
        "userId": "1",
        "firstName": "Jean",
        "lastName": "Dupont",
        "content": "N'oubliez pas vos raquettes !",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ]
  }
}
```

**Réponse Erreur (404) :**

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session non trouvée"
  }
}
```

### 3. POST /sessions

**Description :** Créer une nouvelle session

**URL :** `/sessions`

**Méthode :** `POST`

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "sport": "tennis",
  "date": "2024-03-25",
  "time": "18:00",
  "location": "Tennis Club de Paris"
}
```

**Réponse Succès (201) :**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "sport": "tennis",
    "date": "2024-03-25",
    "time": "18:00",
    "location": "Tennis Club de Paris",
    "organizer": {
      "id": "1",
      "firstName": "Jean",
      "lastName": "Dupont"
    },
    "participants": [
      {
        "id": "1",
        "firstName": "Jean",
        "lastName": "Dupont",
        "status": "accepted"
      }
    ],
    "comments": []
  },
  "message": "Session créée avec succès"
}
```

### 4. POST /sessions/{id}/invite

**Description :** Inviter des utilisateurs à une session

**URL :** `/sessions/{id}/invite`

**Méthode :** `POST`

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "userIds": ["2", "3", "4"]
}
```

**Réponse Succès (201) :**

```json
{
  "success": true,
  "data": {
    "sessionId": "1",
    "invitedUsers": [
      {
        "id": "2",
        "firstname": "Marie",
        "lastname": "Martin",
        "email": "marie@example.com"
      },
      {
        "id": "3",
        "firstname": "Bob",
        "lastname": "Johnson",
        "email": "bob@example.com"
      }
    ],
    "errors": []
  },
  "message": "2 utilisateur(s) invité(s) avec succès"
}
```

**Réponse Erreur (403) :**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas autorisé à inviter des utilisateurs à cette session"
  }
}
```

**Réponse Erreur (404) :**

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session non trouvée"
  }
}
```

**Réponse Erreur (400) :**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Données invalides",
    "details": {
      "userIds": ["Le champ userIds est requis"]
    }
  }
}
```

### 5. PUT /sessions/{id}

**Description :** Mettre à jour une session existante

**URL :** `/sessions/{id}`

**Méthode :** `PUT`

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "sport": "tennis",
  "date": "2024-03-26",
  "time": "19:00",
  "location": "Tennis Club de Lyon"
}
```

**Réponse Succès (200) :**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "sport": "tennis",
    "date": "2024-03-26",
    "time": "19:00",
    "location": "Tennis Club de Lyon",
    "organizer": {
      "id": "1",
      "firstName": "Jean",
      "lastName": "Dupont"
    },
    "participants": [
      {
        "id": "1",
        "firstName": "Jean",
        "lastName": "Dupont",
        "status": "accepted"
      },
      {
        "id": "2",
        "firstName": "Marie",
        "lastName": "Martin",
        "status": "pending"
      }
    ],
    "comments": []
  },
  "message": "Session mise à jour"
}
```

**Réponse Erreur (403) :**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas autorisé à modifier cette session"
  }
}
```

### 6. DELETE /sessions/{id}

**Description :** Supprimer une session

**URL :** `/sessions/{id}`

**Méthode :** `DELETE`

**Headers :**

```
Authorization: Bearer <token>
```

**Réponse Succès (200) :**

```json
{
  "success": true,
  "message": "Session supprimée"
}
```

**Réponse Erreur (403) :**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas autorisé à supprimer cette session"
  }
}
```

### 7. PATCH /sessions/{id}/respond

**Description :** Répondre à une invitation de session

**URL :** `/sessions/{id}/respond`

**Méthode :** `PATCH`

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "response": "accept"
}
```

**Réponse Succès (200) :**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "sport": "tennis",
    "participants": [
      {
        "id": "1",
        "firstName": "Jean",
        "lastName": "Dupont",
        "status": "accepted"
      },
      {
        "id": "2",
        "firstName": "Marie",
        "lastName": "Martin",
        "status": "accepted"
      }
    ]
  },
  "message": "Invitation acceptée"
}
```

**Réponse Erreur (403) :**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas invité à cette session"
  }
}
```

**Réponse Erreur (400) :**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_RESPONSE",
    "message": "Réponse invalide. Utilisez 'accept' ou 'decline'"
  }
}
```

### 8. POST /sessions/{id}/comments

**Description :** Ajouter un commentaire à une session

**URL :** `/sessions/{id}/comments`

**Méthode :** `POST`

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "content": "Super session !"
}
```

**Réponse Succès (201) :**

```json
{
  "success": true,
  "data": {
    "id": "2",
    "userId": "3",
    "firstName": "Bob",
    "lastName": "Johnson",
    "content": "Super session !",
    "createdAt": "2024-03-20T11:00:00Z"
  },
  "message": "Commentaire ajouté"
}
```

## Codes d'erreur

| Code                  | Description                      |
| --------------------- | -------------------------------- |
| `SESSION_NOT_FOUND`   | Session non trouvée              |
| `VALIDATION_ERROR`    | Erreur de validation des données |
| `FORBIDDEN`           | Accès non autorisé               |
| `SESSION_FULL`        | Session complète                 |
| `INVALID_RESPONSE`    | Réponse d'invitation invalide    |
| `UNAUTHORIZED`        | Token invalide ou manquant       |
| `USER_NOT_FOUND`      | Utilisateur non trouvé           |
| `ALREADY_INVITED`     | Utilisateur déjà invité          |
| `ALREADY_PARTICIPANT` | Utilisateur déjà participant     |

## Validation

### Création/Mise à jour de session

- **sport** : Requis, valeurs autorisées : tennis, golf, musculation, football, basketball
- **date** : Requis, format YYYY-MM-DD, doit être dans le futur
- **time** : Requis, format HH:MM
- **location** : Requis, max 200 caractères

### Invitation

- **userIds** : Requis, tableau d'IDs utilisateurs valides
- **userIds[]** : Chaque ID doit correspondre à un utilisateur existant

### Réponse à invitation

- **response** : Requis, valeurs autorisées : "accept", "decline"

### Commentaires

- **content** : Requis, 1-500 caractères

## Entités

### SportSession

```json
{
  "id": "string",
  "sport": "tennis | golf | musculation | football | basketball",
  "date": "string (YYYY-MM-DD)",
  "time": "string (HH:MM)",
  "location": "string",
  "organizer": {
    "id": "string",
    "firstName": "string",
    "lastName": "string"
  },
  "participants": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "status": "pending | accepted | declined"
    }
  ],
  "comments": [
    {
      "id": "string",
      "userId": "string",
      "firstName": "string",
      "lastName": "string",
      "content": "string",
      "createdAt": "string (ISO 8601)"
    }
  ]
}
```

### SessionParticipant

```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "status": "pending | accepted | declined"
}
```

### SessionComment

```json
{
  "id": "string",
  "userId": "string",
  "firstName": "string",
  "lastName": "string",
  "content": "string",
  "createdAt": "string (ISO 8601)"
}
```

## Logique métier

### Statuts de participants

- **pending** : Invitation en attente
- **accepted** : Invitation acceptée
- **declined** : Invitation refusée

### Règles métier

1. Seul l'organisateur peut modifier/supprimer sa session
2. Seul l'organisateur peut inviter des utilisateurs à sa session
3. Les participants peuvent commenter même s'ils n'ont pas encore accepté
4. Les sessions passées ne peuvent plus être modifiées
5. L'organisateur est automatiquement ajouté comme participant accepté
6. Les commentaires sont publics pour tous les participants
7. Un utilisateur ne peut pas être invité s'il est déjà participant
8. Un utilisateur ne peut pas être invité s'il a déjà reçu une invitation
9. Seuls les utilisateurs invités peuvent répondre aux invitations

## Sports supportés

- tennis
- golf
- musculation
- football
- basketball
