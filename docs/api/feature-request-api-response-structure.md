# Demande de Fonctionnalité : Structure de Réponse API pour la Recherche d'Utilisateurs

## 📋 Résumé

**Titre :** Amélioration de la structure de réponse pour la recherche d'utilisateurs

**Priorité :** Haute

**Type :** Amélioration API

**Statut :** En attente de développement

## 🎯 Problème

L'application mobile a besoin d'informations précises sur le statut des relations entre utilisateurs pour afficher correctement les boutons d'action (Ajouter, Annuler, Ami). Actuellement, il peut y avoir des incohérences entre `hasPendingRequest` et `relationshipStatus`.

## 🔧 Spécifications Requises

### Endpoint : `GET /api/users/search`

### Structure de Réponse Attendue

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-utilisateur",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "relationship": {
        "isFriend": false,
        "hasPendingRequest": true,
        "status": "pending",
        "mutualFriends": 2,
        "friendRequestId": "uuid-demande-optionnel"
      }
    }
  ]
}
```

### Règles de Cohérence

1. **Si `isFriend: true`** → `hasPendingRequest: false` et `status: "accepted"`

2. **Si `hasPendingRequest: true`** → `status` doit être l'un de :
   - `"pending"` (demande en attente)
   - `"cancelled"` (demande annulée)

3. **Si `status: "cancelled"`** → `hasPendingRequest: false` (même si l'API retournait `true`)

4. **Si `status: "declined"`** → `hasPendingRequest: false`

5. **Si `status: "none"`** → `hasPendingRequest: false` et `isFriend: false`

### Cas d'Usage Spécifiques

#### 1. Demande d'ami en attente
```json
{
  "relationship": {
    "isFriend": false,
    "hasPendingRequest": true,
    "status": "pending",
    "mutualFriends": 0
  }
}
```
**Bouton affiché :** "Annuler" (rouge)

#### 2. Demande d'ami annulée
```json
{
  "relationship": {
    "isFriend": false,
    "hasPendingRequest": false,
    "status": "cancelled",
    "mutualFriends": 0
  }
}
```
**Bouton affiché :** "Ajouter" (bleu)

#### 3. Demande d'ami refusée
```json
{
  "relationship": {
    "isFriend": false,
    "hasPendingRequest": false,
    "status": "declined",
    "mutualFriends": 0
  }
}
```
**Bouton affiché :** "Ajouter" (bleu)

#### 4. Amis
```json
{
  "relationship": {
    "isFriend": true,
    "hasPendingRequest": false,
    "status": "accepted",
    "mutualFriends": 5
  }
}
```
**Bouton affiché :** "Ami" (vert, désactivé)

#### 5. Aucune relation
```json
{
  "relationship": {
    "isFriend": false,
    "hasPendingRequest": false,
    "status": "none",
    "mutualFriends": 0
  }
}
```
**Bouton affiché :** "Ajouter" (bleu)

## 🔄 Logique Métier Backend

### Requête SQL Suggérée

```sql
SELECT 
    u.id,
    u.firstname,
    u.lastname,
    u.email,
    u.avatar,
    CASE 
        WHEN fr_accepted.id IS NOT NULL THEN true
        ELSE false
    END as is_friend,
    CASE 
        WHEN fr_pending.id IS NOT NULL THEN true
        ELSE false
    END as has_pending_request,
    CASE 
        WHEN fr_accepted.id IS NOT NULL THEN 'accepted'
        WHEN fr_pending.id IS NOT NULL AND fr_pending.cancelled_at IS NULL THEN 'pending'
        WHEN fr_pending.id IS NOT NULL AND fr_pending.cancelled_at IS NOT NULL THEN 'cancelled'
        WHEN fr_declined.id IS NOT NULL THEN 'declined'
        ELSE 'none'
    END as relationship_status,
    COALESCE(mutual.mutual_count, 0) as mutual_friends
FROM users u
LEFT JOIN friend_requests fr_accepted ON 
    (fr_accepted.from_user_id = ? AND fr_accepted.to_user_id = u.id OR 
     fr_accepted.to_user_id = ? AND fr_accepted.from_user_id = u.id) 
    AND fr_accepted.status = 'accepted'
LEFT JOIN friend_requests fr_pending ON 
    fr_pending.from_user_id = ? AND fr_pending.to_user_id = u.id 
    AND fr_pending.status = 'pending'
LEFT JOIN friend_requests fr_declined ON 
    fr_declined.from_user_id = ? AND fr_declined.to_user_id = u.id 
    AND fr_declined.status = 'declined'
LEFT JOIN (
    SELECT 
        u2.id,
        COUNT(DISTINCT f1.friend_id) as mutual_count
    FROM users u2
    JOIN friends f1 ON f1.user_id = u2.id
    JOIN friends f2 ON f2.user_id = ? AND f2.friend_id = f1.friend_id
    GROUP BY u2.id
) mutual ON mutual.id = u.id
WHERE u.id != ?
AND (u.firstname ILIKE ? OR u.lastname ILIKE ? OR u.email ILIKE ?)
```

### Paramètres de la Requête

- `?` (6 fois) : ID de l'utilisateur connecté
- `?` (3 fois) : Terme de recherche avec wildcards

## 🧪 Tests Requis

### Tests Unitaires

```php
public function test_search_users_returns_correct_relationship_status()
{
    // Test 1: Demande en attente
    $this->assertSearchResult($user, $target, [
        'isFriend' => false,
        'hasPendingRequest' => true,
        'status' => 'pending'
    ]);

    // Test 2: Demande annulée
    $this->assertSearchResult($user, $target, [
        'isFriend' => false,
        'hasPendingRequest' => false,
        'status' => 'cancelled'
    ]);

    // Test 3: Amis
    $this->assertSearchResult($user, $target, [
        'isFriend' => true,
        'hasPendingRequest' => false,
        'status' => 'accepted'
    ]);
}
```

### Tests d'Intégration

```bash
# Test avec demande en attente
curl -X GET "http://localhost:8000/api/users/search?q=john" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Vérifier que hasPendingRequest=true ET status=pending
```

## 📱 Impact sur l'Application Mobile

### Avantages

- ✅ **Cohérence des données** : Plus d'incohérences entre les champs
- ✅ **Interface fiable** : Les boutons s'affichent correctement
- ✅ **Logique simplifiée** : Moins de conditions complexes dans le frontend
- ✅ **Meilleure UX** : Pas de boutons "Annuler" sur des demandes déjà annulées

### Code Mobile Actuel

```typescript
const getButtonContent = () => {
  if (item.isFriend) {
    return { icon: 'checkmark-circle', color: '#34C759', text: 'Ami', action: null };
  } else if (item.hasPendingRequest && item.relationshipStatus !== 'cancelled') {
    return { icon: 'close-circle', color: '#FF3B30', text: 'Annuler', action: 'cancel' };
  } else {
    return { icon: 'person-add', color: '#007AFF', text: 'Ajouter', action: 'add' };
  }
};
```

## 🚀 Planning Suggéré

### Phase 1 : Backend (1 jour)
- [ ] Mettre à jour la requête SQL
- [ ] Ajouter les tests unitaires
- [ ] Vérifier la cohérence des données

### Phase 2 : Tests (0.5 jour)
- [ ] Tests d'intégration
- [ ] Tests avec l'app mobile
- [ ] Validation des cas d'usage

### Phase 3 : Déploiement (0.5 jour)
- [ ] Déploiement en staging
- [ ] Tests finaux
- [ ] Déploiement en production

## 🎯 Critères d'Acceptation

- [ ] La structure de réponse est cohérente
- [ ] `hasPendingRequest` et `status` ne sont jamais contradictoires
- [ ] Les tests passent
- [ ] L'application mobile affiche les bons boutons
- [ ] Performance de la requête acceptable

## 📝 Notes Additionnelles

### Performance

- Index sur `friend_requests.from_user_id`, `friend_requests.to_user_id`, `friend_requests.status`
- Index sur `users.firstname`, `users.lastname`, `users.email`
- Considérer le cache pour les requêtes fréquentes

### Sécurité

- Vérifier que l'utilisateur connecté ne peut voir que les relations appropriées
- Valider les paramètres de recherche

---

**Demandeur :** Équipe Mobile  
**Date :** 20 Janvier 2025  
**Version :** 1.0 