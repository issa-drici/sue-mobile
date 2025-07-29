# Demande de Fonctionnalité : Endpoint de Suppression d'Ami

## 📋 Résumé

**Titre :** Endpoint pour supprimer un ami de sa liste d'amis

**Priorité :** Haute

**Type :** Nouvelle fonctionnalité API

**Statut :** En attente de développement

## 🎯 Description

Actuellement, lorsqu'un utilisateur a accepté une demande d'ami, il n'y a pas de moyen de supprimer cette relation via l'API. L'utilisateur doit garder cette personne dans sa liste d'amis même s'il ne souhaite plus maintenir cette relation.

Nous avons besoin d'un nouvel endpoint qui permet à l'utilisateur de supprimer un ami de sa liste d'amis.

## 🔧 Spécifications Techniques

### Endpoint Demandé

**URL :** `DELETE /api/users/friends/{friendId}`

**Méthode :** `DELETE`

**Description :** Supprimer un ami de sa liste d'amis

### Headers Requis

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Paramètres

- `friendId` (string, requis) : ID de l'ami à supprimer

### Réponse Succès (200)

```json
{
  "success": true,
  "data": {
    "removedFriendId": "uuid-de-l-ami-supprime",
    "removedAt": "2025-01-20T10:30:00.000000Z"
  },
  "message": "Ami supprimé avec succès"
}
```

### Réponse Erreur (404) - Ami introuvable

```json
{
  "success": false,
  "error": {
    "code": "FRIEND_NOT_FOUND",
    "message": "Cette personne n'est pas dans votre liste d'amis"
  }
}
```

### Réponse Erreur (403) - Non autorisé

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas autorisé à supprimer cet ami"
  }
}
```

### Réponse Erreur (400) - Paramètre invalide

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FRIEND_ID",
    "message": "ID d'ami invalide"
  }
}
```

## 🔄 Logique Métier

### Règles de Validation

1. **Vérification de l'amitié** : L'utilisateur connecté doit avoir une relation d'amitié avec l'utilisateur cible
2. **Autorisation** : Seul l'utilisateur connecté peut supprimer ses propres amis
3. **Suppression bidirectionnelle** : La suppression doit être réciproque (les deux utilisateurs ne sont plus amis)

### Actions à Effectuer

1. Vérifier que l'utilisateur connecté et l'utilisateur cible sont amis
2. Supprimer la relation d'amitié des deux côtés
3. Supprimer les notifications associées à cette amitié
4. Retourner une confirmation de suppression

## 📱 Impact sur l'Application Mobile

### Fonctionnalité Actuelle

L'application mobile a déjà implémenté l'interface utilisateur pour la suppression d'ami :
- Bouton "..." à côté de chaque ami
- Modal avec option "Supprimer"
- Confirmation avant suppression
- Indicateur de chargement

### Endpoint Utilisé Actuellement

```typescript
// services/api/endpoints.ts
export const USERS_ENDPOINTS = {
  // ... autres endpoints
  REMOVE_FRIEND: (friendId: string) => `/users/friends/${friendId}`,
} as const;
```

```typescript
// services/api/usersApi.ts
static async removeFriend(friendId: string): Promise<void> {
  const response = await baseApiService.delete<LaravelResponse<void>>(
    USERS_ENDPOINTS.REMOVE_FRIEND(friendId)
  );
  return response.data;
}
```

### Erreur Actuelle

```
ERROR ❌ API Error: 404 - The route api/users/friends/9f6fd17e-21c6-427e-9b82-983b7e2cbd7a could not be found.
```

## 🧪 Tests Requis

### Test 1 : Suppression d'ami réussie
1. Créer une relation d'amitié entre utilisateur A et B
2. Utilisateur A supprime utilisateur B de ses amis
3. **Vérifier** : Status 200, relation supprimée des deux côtés

### Test 2 : Tentative de suppression d'un non-ami
1. Utilisateur A essaie de supprimer utilisateur C (qui n'est pas son ami)
2. **Vérifier** : Status 404, erreur "Cette personne n'est pas dans votre liste d'amis"

### Test 3 : Tentative de suppression par un tiers
1. Utilisateur A et B sont amis
2. Utilisateur C essaie de supprimer B des amis de A
3. **Vérifier** : Status 403, erreur "Vous n'êtes pas autorisé"

### Test 4 : ID d'ami invalide
1. Utilisateur A essaie de supprimer un ID invalide
2. **Vérifier** : Status 400, erreur "ID d'ami invalide"

## 🔗 Intégration avec les Autres Endpoints

### Endpoint de Liste d'Amis
L'endpoint `GET /api/users/friends` doit ne plus retourner l'ami supprimé.

### Endpoint de Recherche
L'endpoint `GET /api/users/search` doit retourner `isFriend: false` pour l'ami supprimé.

## 📅 Planning Suggéré

### Phase 1 : Backend (0.5 jour)
- [ ] Créer le contrôleur `FriendController@remove`
- [ ] Ajouter la route `DELETE /api/users/friends/{friendId}`
- [ ] Implémenter la logique de suppression bidirectionnelle
- [ ] Tests unitaires

### Phase 2 : Tests (0.5 jour)
- [ ] Tests d'intégration
- [ ] Tests avec l'application mobile
- [ ] Validation des réponses API

---

**Note :** Cette implémentation est un exemple et peut nécessiter des ajustements selon l'architecture existante du projet. 