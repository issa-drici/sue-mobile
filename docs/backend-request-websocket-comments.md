# Demande Backend - Événements WebSocket Commentaires

## 🚨 Problème Identifié

Les nouveaux commentaires ne s'affichent pas en temps réel pour les autres participants. L'événement WebSocket `comment.created` n'est pas émis par le backend.

## 🔍 Diagnostic

**Test effectué :**
- ✅ Connexion WebSocket réussie
- ✅ Authentification réussie  
- ✅ Rejoindre la session réussie
- ✅ Événement `online-users` reçu
- ✅ Création de commentaire via API réussie
- ❌ **Événement `comment.created` NON reçu**

## 📋 Demande de Correction

### 1. Événement `comment.created`

**Où :** Dans le contrôleur de création de commentaire (probablement `CommentController@store`)

**Action :** Après la création réussie d'un commentaire, émettre l'événement WebSocket :

```php
// Après la création du commentaire
$comment = Comment::create([...]);

// Émettre l'événement WebSocket
broadcast(new CommentCreated($comment))->toOthers();

// Ou si vous utilisez Laravel WebSockets directement :
event(new CommentCreated($comment));
```

### 2. Événement `comment.updated`

**Où :** Dans le contrôleur de mise à jour de commentaire

**Action :** Après la mise à jour réussie :

```php
broadcast(new CommentUpdated($comment))->toOthers();
```

### 3. Événement `comment.deleted`

**Où :** Dans le contrôleur de suppression de commentaire

**Action :** Après la suppression réussie :

```php
broadcast(new CommentDeleted($commentId))->toOthers();
```

## 📡 Format des Événements Attendus

### `comment.created`
```json
{
  "id": "123",
  "content": "Contenu du commentaire",
  "userId": "456",
  "sessionId": "789",
  "user": {
    "id": "456",
    "firstname": "John",
    "lastname": "Doe",
    "avatar": null
  },
  "created_at": "2025-01-22 01:30:00",
  "updated_at": "2025-01-22 01:30:00"
}
```

### `comment.updated`
```json
{
  "id": "123",
  "content": "Contenu modifié",
  "updated_at": "2025-01-22 01:35:00"
}
```

### `comment.deleted`
```json
"123"  // ID du commentaire supprimé
```

## 🎯 Priorité

**URGENT** - Ce problème empêche la communication en temps réel entre les participants d'une session.

## 🔧 Test de Validation

Après la correction, le script `scripts/test-websocket-comments.js` devrait recevoir l'événement `comment.created` immédiatement après la création d'un commentaire. 