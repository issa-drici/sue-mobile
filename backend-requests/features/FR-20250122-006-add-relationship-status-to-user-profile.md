# FR-20250122-006: Ajouter le statut de relation complet à l'endpoint de profil utilisateur

## 🎯 Objectif

**Titre :** Ajouter les champs `hasPendingRequest` et `relationshipStatus` à l'endpoint de profil utilisateur

**Priorité :** 🔴 **HAUTE** - Nécessaire pour la gestion des états dans la modal de profil

**Type :** Feature Request

**Statut :** 🔄 **À implémenter**

**Créé le :** 2025-01-22

## 📋 Contexte

Actuellement, l'endpoint `GET /api/users/{userId}` retourne seulement `isAlreadyFriend` mais pas les autres informations de relation nécessaires pour gérer correctement les états dans la modal de profil utilisateur.

## 🚨 Problème actuel

### Réponse actuelle
```json
{
  "success": true,
  "data": {
    "id": "9f99f1f4-d3b0-4820-809a-84b204c1f446",
    "firstname": "Asmaa",
    "lastname": "Guediri",
    "email": "gued.as76@hotmail.com",
    "avatar": null,
    "stats": {
      "sessionsCreated": 17,
      "sessionsParticipated": 28
    },
    "isAlreadyFriend": false
  }
}
```

### Champs manquants
- `hasPendingRequest` : Indique si une demande d'ami est en attente
- `relationshipStatus` : Statut détaillé de la relation

## ✅ Solution proposée

### Réponse demandée
```json
{
  "success": true,
  "data": {
    "id": "9f99f1f4-d3b0-4820-809a-84b204c1f446",
    "firstname": "Asmaa",
    "lastname": "Guediri",
    "email": "gued.as76@hotmail.com",
    "avatar": null,
    "stats": {
      "sessionsCreated": 17,
      "sessionsParticipated": 28
    },
    "isAlreadyFriend": false,
    "hasPendingRequest": true,
    "relationshipStatus": "pending"
  }
}
```

## 🔧 Spécifications techniques

### Nouveaux champs à ajouter

#### `hasPendingRequest` (boolean)
- `true` : Une demande d'ami est en attente (envoyée par l'utilisateur connecté)
- `false` : Aucune demande d'ami en attente

#### `relationshipStatus` (string)
- `"none"` : Aucune relation
- `"pending"` : Demande d'ami en attente (envoyée par l'utilisateur connecté)
- `"received"` : Demande d'ami reçue (envoyée par l'utilisateur cible)
- `"accepted"` : Amis (relation acceptée)
- `"declined"` : Demande refusée
- `"cancelled"` : Demande annulée

### Logique métier

```php
// Vérifier si l'utilisateur connecté a envoyé une demande en attente
$hasPendingRequest = FriendRequest::where('sender_id', auth()->id())
    ->where('receiver_id', $userId)
    ->where('status', 'pending')
    ->exists();

// Déterminer le statut de la relation
$relationshipStatus = 'none';

if ($isAlreadyFriend) {
    $relationshipStatus = 'accepted';
} elseif ($hasPendingRequest) {
    $relationshipStatus = 'pending';
} else {
    // Vérifier si l'utilisateur cible a envoyé une demande
    $receivedRequest = FriendRequest::where('sender_id', $userId)
        ->where('receiver_id', auth()->id())
        ->where('status', 'pending')
        ->first();
    
    if ($receivedRequest) {
        $relationshipStatus = 'received';
    }
}
```

## 📊 Impact sur l'application

### Modal de profil utilisateur
Avec ces informations, la modal pourra afficher le bon bouton :

1. **`relationshipStatus: "accepted"`** → "Déjà dans vos amis" (vert)
2. **`relationshipStatus: "pending"`** → "Annuler la demande" (rouge)
3. **`relationshipStatus: "received"`** → "Accepter/Refuser la demande" (bleu/rouge)
4. **`relationshipStatus: "none"`** → "Ajouter comme ami" (bleu)

### Cohérence avec la recherche d'amis
Ces champs permettront d'avoir la même logique que dans l'écran de recherche d'amis.

## 🧪 Tests à effectuer

### Test 1 : Utilisateur sans relation
```bash
curl -X GET /api/users/{userId} \
  -H "Authorization: Bearer {token}"
```
**Attendu :** `hasPendingRequest: false`, `relationshipStatus: "none"`

### Test 2 : Utilisateur avec demande en attente
```bash
# Après avoir envoyé une demande d'ami
curl -X GET /api/users/{userId} \
  -H "Authorization: Bearer {token}"
```
**Attendu :** `hasPendingRequest: true`, `relationshipStatus: "pending"`

### Test 3 : Utilisateur ami
```bash
# Après avoir accepté une demande d'ami
curl -X GET /api/users/{userId} \
  -H "Authorization: Bearer {token}"
```
**Attendu :** `isAlreadyFriend: true`, `relationshipStatus: "accepted"`

## 📝 Notes

- **Rétrocompatibilité** : Les champs existants restent inchangés
- **Performance** : Impact minimal, une requête supplémentaire sur la table `friend_requests`
- **Sécurité** : Vérifier que l'utilisateur connecté ne peut voir que ses propres relations

## 🚀 Priorité

**Haute** - Cette fonctionnalité est nécessaire pour que la modal de profil utilisateur fonctionne correctement avec tous les états de relation.





