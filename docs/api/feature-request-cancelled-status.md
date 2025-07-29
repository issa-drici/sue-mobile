# Demande de Fonctionnalité : Statut "cancelled" dans l'API de Recherche

## 📋 Résumé

**Titre :** Ajouter le statut "cancelled" dans la réponse de l'API de recherche d'utilisateurs

**Priorité :** Haute

**Type :** Correction de bug

**Statut :** En attente de développement

## 🎯 Description

Actuellement, l'API de recherche d'utilisateurs (`GET /api/users/search`) ne retourne que les statuts de relation suivants :
- `"none"` : Aucune relation
- `"pending"` : Demande d'ami en attente
- `"accepted"` : Amis
- `"declined"` : Demande refusée

**Problème :** Le statut `"cancelled"` n'est pas retourné, ce qui empêche l'interface mobile d'afficher correctement le bouton "Ajouter" après l'annulation d'une demande d'ami.

## 🔧 Spécifications Techniques

### Endpoint Concerné

**URL :** `GET /api/users/search?q={query}`

### Structure Actuelle

```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "relationship": {
        "status": "none", // ❌ Ne retourne jamais "cancelled"
        "isFriend": false,
        "hasPendingRequest": false,
        "mutualFriends": 0
      }
    }
  ]
}
```

### Structure Demandée

```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "relationship": {
        "status": "cancelled", // ✅ Nouveau statut à ajouter
        "isFriend": false,
        "hasPendingRequest": false, // Doit être false pour cancelled
        "mutualFriends": 0
      }
    }
  ]
}
```

## 🔄 Logique Métier

### Règles de Gestion

1. **Statut "cancelled"** : Doit être retourné quand une demande d'ami a été annulée par l'expéditeur
2. **hasPendingRequest** : Doit être `false` quand le statut est `"cancelled"`
3. **isFriend** : Doit rester `false` pour le statut `"cancelled"`

### Cas d'Usage

1. **Utilisateur A** envoie une demande d'ami à **Utilisateur B**
2. **Utilisateur A** annule la demande via `DELETE /api/users/friend-requests`
3. **Utilisateur A** recherche **Utilisateur B** via `GET /api/users/search`
4. **Résultat attendu** : `status: "cancelled"` et `hasPendingRequest: false`

## 📱 Impact sur l'Application Mobile

### Problème Actuel

```typescript
// Logique actuelle dans l'app mobile
const getButtonContent = () => {
  if (item.isFriend) {
    return { text: 'Ami', action: null };
  } else if (item.hasPendingRequest && item.relationshipStatus !== 'cancelled') {
    return { text: 'Annuler', action: 'cancel' };
  } else {
    return { text: 'Ajouter', action: 'add' };
  }
};
```

**Résultat actuel :** 
- Après annulation, l'API retourne `status: "none"` 
- L'interface affiche correctement "Ajouter"
- Mais ce n'est pas la logique métier correcte

### Solution Demandée

**Résultat attendu :**
- Après annulation, l'API retourne `status: "cancelled"`
- L'interface affiche "Ajouter" (correct)
- La logique métier est cohérente

## 🧪 Tests Requis

### Test 1 : Demande annulée
1. Créer une demande d'ami entre utilisateur A et B
2. Annuler la demande via l'endpoint d'annulation
3. Rechercher l'utilisateur B
4. **Vérifier** : `status: "cancelled"` et `hasPendingRequest: false`

### Test 2 : Demande refusée vs annulée
1. Créer une demande d'ami
2. Refuser la demande (côté destinataire)
3. Rechercher l'utilisateur
4. **Vérifier** : `status: "declined"`

5. Créer une nouvelle demande d'ami
6. Annuler la demande (côté expéditeur)
7. Rechercher l'utilisateur
8. **Vérifier** : `status: "cancelled"`

## 🔗 Intégration avec l'Endpoint d'Annulation

### Endpoint d'Annulation (déjà implémenté)
```http
DELETE /api/users/friend-requests
{
  "target_user_id": "user-id"
}
```

### Réponse d'Annulation
```json
{
  "success": true,
  "data": {
    "requestId": "request-id",
    "senderId": "sender-id",
    "receiverId": "receiver-id",
    "status": "cancelled", // ✅ Déjà correct
    "cancelledAt": "2025-01-20T10:30:00.000000Z"
  }
}
```

**Problème :** L'endpoint d'annulation retourne `status: "cancelled"` mais l'API de recherche ne le reflète pas.

## 📅 Planning Suggéré

### Phase 1 : Backend (0.5 jour)
- [ ] Modifier la requête de recherche pour inclure les demandes annulées
- [ ] Ajouter le statut `"cancelled"` dans la logique de détermination du statut
- [ ] Tests unitaires

### Phase 2 : Tests (0.5 jour)
- [ ] Tests d'intégration
- [ ] Tests avec l'app mobile
- [ ] Validation des cas d'usage

## 🎯 Critères d'Acceptation

- [ ] L'API de recherche retourne `status: "cancelled"` pour les demandes annulées
- [ ] `hasPendingRequest` est `false` quand `status` est `"cancelled"`
- [ ] L'interface mobile affiche correctement le bouton "Ajouter" après annulation
- [ ] Les tests passent
- [ ] Pas de régression sur les autres statuts

## 📝 Notes Additionnelles

### Base de Données

Vérifier que la table `friend_requests` a bien un champ `cancelled_at` et que les requêtes SQL prennent en compte ce champ pour déterminer le statut.

### Requête SQL Suggérée

```sql
-- Dans la logique de détermination du statut de relation
CASE 
  WHEN fr.status = 'pending' AND fr.cancelled_at IS NULL THEN 'pending'
  WHEN fr.status = 'pending' AND fr.cancelled_at IS NOT NULL THEN 'cancelled'
  WHEN fr.status = 'accepted' THEN 'accepted'
  WHEN fr.status = 'declined' THEN 'declined'
  ELSE 'none'
END as relationship_status
```

---

**Demandeur :** Équipe Mobile  
**Date :** 20 Janvier 2025  
**Version :** 1.0 