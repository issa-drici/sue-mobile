# Demande de Fonctionnalité : Permettre le Renvoi de Demande d'Ami Après Annulation

## 📋 Résumé

**Titre :** Corriger la logique pour permettre le renvoi de demande d'ami après annulation

**Priorité :** Haute

**Type :** Correction de bug

**Statut :** En attente de développement

## 🎯 Description

Actuellement, lorsqu'un utilisateur annule une demande d'ami puis essaie d'en renvoyer une nouvelle, l'API retourne une erreur 409 avec le message "Une demande d'ami existe déjà". Ce comportement est incorrect car une demande annulée ne devrait pas empêcher l'envoi d'une nouvelle demande.

## 🔧 Spécifications Techniques

### Endpoint Concerné

**URL :** `POST /api/users/friend-requests`

### Problème Actuel

```http
POST /api/users/friend-requests
{
  "userId": "target-user-id"
}
```

**Réponse d'erreur :**
```json
{
  "success": false,
  "error": {
    "code": "FRIEND_REQUEST_EXISTS",
    "message": "Une demande d'ami existe déjà"
  }
}
```

**Status :** 409 Conflict

### Comportement Attendu

Après l'annulation d'une demande d'ami, l'utilisateur devrait pouvoir renvoyer une nouvelle demande sans restriction.

## 🔄 Logique Métier

### Règles de Validation Actuelles (à corriger)

1. ❌ **Actuellement** : Empêche l'envoi si une demande existe (quel que soit le statut)
2. ✅ **Attendu** : Empêche l'envoi seulement si une demande est en statut `"pending"`

### Nouvelle Logique Demandée

```sql
-- Logique actuelle (problématique)
SELECT COUNT(*) FROM friend_requests 
WHERE (sender_id = ? AND receiver_id = ?) 
   OR (sender_id = ? AND receiver_id = ?)

-- Logique corrigée (demandée)
SELECT COUNT(*) FROM friend_requests 
WHERE ((sender_id = ? AND receiver_id = ?) 
    OR (sender_id = ? AND receiver_id = ?))
  AND status = 'pending'  -- Seulement les demandes en attente
  AND cancelled_at IS NULL  -- Pas de demandes annulées
```

## 📱 Impact sur l'Application Mobile

### Problème Actuel

1. **Utilisateur A** envoie une demande d'ami à **Utilisateur B** ✅
2. **Utilisateur A** annule la demande ✅
3. **Utilisateur A** essaie de renvoyer une demande ❌
4. **Résultat** : Erreur 409, impossible de renvoyer

### Comportement Attendu

1. **Utilisateur A** envoie une demande d'ami à **Utilisateur B** ✅
2. **Utilisateur A** annule la demande ✅
3. **Utilisateur A** renvoie une nouvelle demande ✅
4. **Résultat** : Nouvelle demande envoyée avec succès

## 🧪 Tests Requis

### Test 1 : Renvoi après annulation
1. Créer une demande d'ami entre utilisateur A et B
2. Annuler la demande via l'endpoint d'annulation
3. Tenter de renvoyer une nouvelle demande
4. **Vérifier** : Status 201, nouvelle demande créée

### Test 2 : Empêcher les doublons en attente
1. Créer une demande d'ami entre utilisateur A et B
2. Tenter d'envoyer une deuxième demande sans annuler
3. **Vérifier** : Status 409, erreur "Une demande d'ami existe déjà"

### Test 3 : Permettre le renvoi après refus
1. Créer une demande d'ami entre utilisateur A et B
2. Refuser la demande (côté destinataire)
3. Tenter de renvoyer une nouvelle demande
4. **Vérifier** : Status 201, nouvelle demande créée

## 🔗 Intégration avec les Autres Endpoints

### Endpoint d'Annulation (déjà correct)
```http
DELETE /api/users/friend-requests
{
  "target_user_id": "user-id"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "status": "cancelled",
    "cancelledAt": "2025-01-20T10:30:00.000000Z"
  }
}
```

### Endpoint de Recherche (à corriger)
L'API de recherche devrait retourner `status: "cancelled"` pour les demandes annulées (voir demande de fonctionnalité précédente).

## 📅 Planning Suggéré

### Phase 1 : Backend (0.5 jour)
- [ ] Modifier la logique de validation dans l'endpoint d'envoi de demande
- [ ] Exclure les demandes annulées de la vérification d'existence
- [ ] Tests unitaires

### Phase 2 : Tests (0.5 jour)
- [ ] Tests d'intégration
- [ ] Tests avec l'app mobile
- [ ] Validation des cas d'usage

## 🎯 Critères d'Acceptation

- [ ] L'envoi de demande fonctionne après annulation
- [ ] Les doublons en attente sont toujours empêchés
- [ ] Le renvoi après refus fonctionne
- [ ] Les tests passent
- [ ] Pas de régression sur les autres fonctionnalités

## 📝 Notes Additionnelles

### Base de Données

La table `friend_requests` doit avoir :
- `status` : 'pending', 'accepted', 'declined', 'cancelled'
- `cancelled_at` : timestamp de l'annulation (nullable)

### Requête SQL Suggérée

```sql
-- Vérification d'existence de demande en attente
SELECT COUNT(*) as existing_requests
FROM friend_requests 
WHERE ((sender_id = ? AND receiver_id = ?) 
    OR (sender_id = ? AND receiver_id = ?))
  AND status = 'pending'
  AND cancelled_at IS NULL;

-- Si existing_requests > 0, empêcher l'envoi
-- Sinon, permettre l'envoi
```

### Gestion des Cas Particuliers

1. **Demande annulée** : Permettre le renvoi
2. **Demande refusée** : Permettre le renvoi
3. **Demande en attente** : Empêcher le doublon
4. **Déjà amis** : Empêcher l'envoi (géré ailleurs)

---

**Demandeur :** Équipe Mobile  
**Date :** 20 Janvier 2025  
**Version :** 1.0 