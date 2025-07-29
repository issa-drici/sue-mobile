# Demande de Fonctionnalité : Endpoint d'Annulation de Demande d'Ami

## 📋 Résumé

**Titre :** Endpoint pour annuler une demande d'ami envoyée

**Priorité :** Moyenne

**Type :** Nouvelle fonctionnalité API

**Statut :** ✅ **IMPLÉMENTÉ**

## 🎯 Description

Actuellement, lorsqu'un utilisateur envoie une demande d'ami, il n'y a pas de moyen de l'annuler via l'API. L'utilisateur doit attendre que l'autre personne accepte ou refuse la demande.

Nous avons besoin d'un nouvel endpoint qui permet à l'utilisateur qui a envoyé la demande de l'annuler.

## 🔧 Spécifications Techniques

### Endpoint Implémenté

**URL :** `DELETE /api/users/friend-requests`

**Méthode :** `DELETE`

**Description :** Annuler une demande d'ami envoyée par l'utilisateur connecté

### Headers Requis

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body (JSON)

```json
{
  "target_user_id": "uuid-de-l-utilisateur-cible"
}
```

### Paramètres

- `target_user_id` (string, requis) : ID de l'utilisateur cible de la demande d'ami

### Réponse Succès (200)

```json
{
  "success": true,
  "data": {
    "requestId": "uuid-de-la-demande",
    "senderId": "uuid-de-l-expediteur",
    "receiverId": "uuid-du-destinataire",
    "status": "cancelled",
    "cancelledAt": "2025-01-20T10:30:00.000000Z"
  },
  "message": "Demande d'ami annulée avec succès"
}
```

### Réponse Erreur (400) - Paramètre manquant

```json
{
  "success": false,
  "error": {
    "code": "MISSING_TARGET_USER_ID",
    "message": "L'ID de l'utilisateur cible est requis"
  }
}
```

### Réponse Erreur (404) - Demande introuvable

```json
{
  "success": false,
  "error": {
    "code": "FRIEND_REQUEST_NOT_FOUND",
    "message": "Demande d'ami introuvable"
  }
}
```

### Réponse Erreur (403) - Non autorisé

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_CANCELLATION",
    "message": "Vous ne pouvez annuler que vos propres demandes d'ami"
  }
}
```

### Réponse Erreur (409) - Demande déjà traitée

```json
{
  "success": false,
  "error": {
    "code": "REQUEST_ALREADY_PROCESSED",
    "message": "Cette demande d'ami a déjà été acceptée ou refusée"
  }
}
```

## 🔄 Logique Métier

### Règles de Validation

1. **Existence de la demande** : La demande d'ami doit exister
2. **Propriétaire de la demande** : Seul l'utilisateur qui a envoyé la demande peut l'annuler
3. **Statut de la demande** : La demande doit être en statut "pending"
4. **Authentification** : L'utilisateur doit être connecté

### Actions Effectuées

1. Vérifier l'existence d'une demande d'ami de l'utilisateur connecté vers l'utilisateur cible
2. Vérifier que la demande est en statut "pending"
3. Marquer la demande comme "cancelled"
4. Enregistrer la date d'annulation
5. Retourner la confirmation

## 📊 Impact sur l'Application Mobile

### Avantages

- ✅ **Meilleure UX** : Les utilisateurs peuvent annuler leurs demandes
- ✅ **Contrôle utilisateur** : Plus de contrôle sur les interactions sociales
- ✅ **Interface cohérente** : Bouton "Annuler" dans la recherche d'amis
- ✅ **Feedback immédiat** : Confirmation visuelle de l'annulation

### Cas d'Usage

1. **Erreur de saisie** : L'utilisateur a envoyé une demande par erreur
2. **Changement d'avis** : L'utilisateur ne veut plus ajouter cette personne
3. **Demande en double** : Éviter les demandes multiples
4. **Nettoyage** : Supprimer les demandes anciennes non répondues

## 🔗 Intégration avec l'API Existante

### Endpoints Concernés

- `GET /users/search` : Retourne `hasPendingRequest: true` pour les demandes en attente
- `POST /users/friend-requests` : Crée une nouvelle demande
- `PATCH /users/friend-requests/{id}` : Accepte/refuse une demande reçue

### Modifications Nécessaires

1. **Base de données** : Ajouter un champ `cancelled_at` à la table `friend_requests`
2. **Modèle** : Ajouter la logique de gestion des annulations
3. **Contrôleur** : Créer le nouveau endpoint DELETE
4. **Validation** : Ajouter les règles de validation

## 🧪 Tests Requis

### Tests Unitaires

- ✅ Test d'annulation réussie
- ✅ Test d'annulation d'une demande inexistante
- ✅ Test d'annulation d'une demande d'un autre utilisateur
- ✅ Test d'annulation d'une demande déjà traitée

### Tests d'Intégration

- ✅ Test avec l'application mobile
- ✅ Test de mise à jour de l'affichage après annulation
- ✅ Test de gestion des erreurs

## 📅 Planning Suggéré

### Phase 1 : Backend (1-2 jours)
- [ ] Créer la migration de base de données
- [ ] Implémenter le contrôleur
- [ ] Ajouter les validations
- [ ] Tests unitaires

### Phase 2 : Tests (0.5 jour)
- [ ] Tests d'intégration
- [ ] Tests avec l'app mobile
- [ ] Validation des cas d'erreur

### Phase 3 : Déploiement (0.5 jour)
- [ ] Déploiement en staging
- [ ] Tests finaux
- [ ] Déploiement en production

## 🎯 Critères d'Acceptation

- [ ] L'endpoint DELETE fonctionne correctement
- [ ] Seul le propriétaire peut annuler sa demande
- [ ] Les erreurs sont gérées et retournées correctement
- [ ] L'application mobile peut utiliser l'endpoint
- [ ] Les tests passent
- [ ] La documentation est mise à jour

## 📝 Notes Additionnelles

### Sécurité

- Vérification stricte de l'authentification
- Validation que l'utilisateur est propriétaire de la demande
- Protection contre les attaques CSRF

### Performance

- Index sur les colonnes `user_id` et `status` de la table `friend_requests`
- Cache des requêtes fréquentes si nécessaire

### Monitoring

- Logs des annulations pour audit
- Métriques sur l'utilisation de l'endpoint
- Alertes en cas d'erreurs fréquentes

---

**Demandeur :** Équipe Mobile  
**Date :** 20 Janvier 2025  
**Version :** 1.0 