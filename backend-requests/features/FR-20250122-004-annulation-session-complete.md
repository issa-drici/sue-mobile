# Feature Request — Annulation complète d'une session

## 📋 Informations générales

- **Titre :** Annulation complète d'une session
- **ID :** FR-20250122-004
- **Date :** 22/01/2025
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 15/02/2025

## 🎯 Description

### Fonctionnalité demandée
Permettre à l'organisateur d'une session d'annuler complètement sa session.

### Contexte
Actuellement, l'organisateur ne peut pas annuler une session qu'il a créée. Cela peut être problématique si :
- L'organisateur a un empêchement de dernière minute
- Les circonstances ont changé (météo, lieu indisponible, etc.)
- Il veut créer une nouvelle session avec des détails différents

### Cas d'usage
- Un organisateur crée une session de tennis pour le samedi à 14h
- Quelques jours avant, il se rend compte qu'il ne peut pas organiser la session
- Il veut annuler complètement la session
- Tous les participants sont notifiés de l'annulation
- La session apparaît comme "annulée" dans l'historique

## 🔧 Spécifications techniques

### Endpoint nécessaire
```
PATCH /api/sessions/{sessionId}/cancel
```

### Headers requis
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

### Body de la requête
```json
{
  "status": "cancelled"
}
```
*Note : Le body est optionnel car le statut est toujours "cancelled" pour cette action.*

### Codes de réponse
- `200` - Session annulée avec succès
- `400` - Session déjà annulée ou terminée
- `403` - Non autorisé (pas l'organisateur de la session)
- `404` - Session non trouvée

## 📱 Impact sur le mobile

### Écrans concernés
- Écran de détail de session (`app/session/[id].tsx`)
- Liste des sessions (affichage du statut "annulée")

### Hooks/Composants créés
- `useCancelSession` - Hook pour l'annulation de session
- Bouton "Annuler la session" dans l'interface (visible uniquement pour l'organisateur)

### Tests à implémenter
- Test d'annulation de session par l'organisateur
- Test d'annulation par un non-organisateur (erreur)
- Test de notification des participants
- Test d'affichage du statut "annulée"

## 🔄 Logique métier

### Conditions préalables
1. L'utilisateur doit être l'organisateur de la session
2. La session ne doit pas être déjà annulée
3. La session ne doit pas être terminée

### Actions effectuées
1. Vérifier les permissions et conditions
2. Mettre à jour le statut de la session à `cancelled` dans la base de données
3. Créer des notifications pour tous les participants
4. Envoyer des notifications push si configurées
5. Retourner la session mise à jour

### Validation
- **sessionId** : Doit exister
- **utilisateur** : Doit être l'organisateur de la session
- **session** : Ne doit pas être déjà annulée ou terminée
- **status** : Doit être "cancelled" (valeur fixe, non modifiable par l'utilisateur)

## 📡 Format de réponse

### Succès (200)
```json
{
  "success": true,
  "message": "Session annulée avec succès",
  "data": {
    "session": {
      "id": "session-uuid",
      "sport": "tennis",
      "date": "2025-02-15",
      "time": "14:00",
      "location": "Tennis Club",
      "status": "cancelled",
      "organizer": {
        "id": "organizer-uuid",
        "firstname": "Jean",
        "lastname": "Dupont"
      },
      "participants": [
        {
          "id": "user-uuid",
          "firstname": "Marie",
          "lastname": "Martin",
          "status": "accepted"
        }
      ]
    }
  }
}
```

### Erreur 400 - Session déjà annulée
```json
{
  "success": false,
  "message": "Cette session est déjà annulée",
  "error": "SESSION_ALREADY_CANCELLED"
}
```

### Erreur 400 - Session terminée
```json
{
  "success": false,
  "message": "Impossible d'annuler une session terminée",
  "error": "SESSION_ENDED"
}
```

### Erreur 403 - Non autorisé
```json
{
  "success": false,
  "message": "Vous n'êtes pas autorisé à annuler cette session",
  "error": "UNAUTHORIZED"
}
```

## 🔔 Notifications

### Notification créée pour tous les participants
- **Type** : `session_cancelled`
- **Titre** : "Session annulée"
- **Message** : "[Organisateur] a annulé sa session de [sport]"
- **Données** :
  ```json
  {
    "type": "session_cancelled",
    "session_id": "session-uuid",
    "organizer_id": "organizer-uuid",
    "sport": "tennis",
    "date": "2025-02-15",
    "time": "14:00"
  }
  ```

### Notification push
Si configurée, envoyer une notification push à tous les participants avec les mêmes données.

## 🧪 Tests de validation

### Tests positifs
1. Organisateur annule sa session → Succès
2. Statut de la session passe à `cancelled`
3. Notifications créées et envoyées aux participants
4. Session retournée avec statut mis à jour

### Tests négatifs
1. Utilisateur non-organisateur tente d'annuler → 403
2. Annulation d'une session déjà annulée → 400
3. Annulation d'une session terminée → 400
4. Session inexistante → 404

## 📊 Impact

### Positif
- ✅ Amélioration de l'expérience utilisateur
- ✅ Plus de flexibilité pour les organisateurs
- ✅ Gestion propre des annulations

### Risques
- ⚠️ Annulations de dernière minute
- ⚠️ Impact sur la planification des participants

## 🔗 Liens

- **US-003** : Annulation d'une session
- **Frontend** : `app/session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md`
