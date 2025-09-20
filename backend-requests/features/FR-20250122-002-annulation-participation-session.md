# Feature Request — Annulation de participation à une session

## 📋 Informations générales

- **Titre :** Annulation de participation à une session
- **ID :** FR-20250122-002
- **Date :** 22/01/2025
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 15/02/2025

## 🎯 Description

### Fonctionnalité demandée
Permettre à un utilisateur qui a accepté une invitation à une session d'annuler sa participation.

### Contexte
Actuellement, quand un utilisateur accepte une invitation à une session, il ne peut plus se désinscrire. Cela peut être problématique si :
- L'utilisateur a un empêchement de dernière minute
- Il veut libérer sa place pour quelqu'un d'autre
- Il a changé d'avis

### Cas d'usage
- Un participant accepte une invitation à une session de tennis
- Quelques jours avant, il se rend compte qu'il ne peut pas y aller
- Il veut annuler sa participation pour libérer sa place
- L'organisateur peut réinviter quelqu'un d'autre à sa place

## 🔧 Spécifications techniques

### Endpoint nécessaire
```
PATCH /api/sessions/{sessionId}/cancel-participation
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
  "status": "declined"
}
```
*Note : Le body est optionnel car le statut est toujours "declined" pour cette action.*

### Codes de réponse
- `200` - Participation annulée avec succès
- `400` - Utilisateur n'a pas accepté l'invitation
- `403` - Non autorisé (pas participant de la session)
- `404` - Session non trouvée
- `409` - Session déjà terminée

## 📱 Impact sur le mobile

### Écrans concernés
- Écran de détail de session (`app/session/[id].tsx`)
- Liste des participants

### Hooks/Composants créés
- `useCancelParticipation` - Hook pour l'annulation de participation
- Bouton "Annuler ma participation" dans l'interface

### Tests à implémenter
- Test d'annulation de participation d'un utilisateur qui a accepté
- Test d'annulation d'un utilisateur qui n'a pas accepté (erreur)
- Test de permissions (seul le participant peut s'annuler)

## 🔄 Logique métier

### Conditions préalables
1. L'utilisateur doit être un participant de la session avec le statut `accepted`
2. La session ne doit pas être terminée
3. L'utilisateur ne doit pas être l'organisateur de la session

### Actions effectuées
1. Vérifier les permissions et conditions
2. Mettre à jour le statut du participant de `accepted` à `declined` dans la table `session_participants`
3. Libérer une place dans la session (si limite de participants configurée)
4. Créer une notification pour l'organisateur
5. Envoyer une notification push si configurée
6. Retourner la session mise à jour

### Validation
- **sessionId** : Doit exister
- **utilisateur** : Doit être participant avec statut `accepted`
- **session** : Ne doit pas être terminée
- **status** : Doit être "declined" (valeur fixe, non modifiable par l'utilisateur)

## 📡 Format de réponse

### Succès (200)
```json
{
  "success": true,
  "message": "Participation annulée avec succès",
  "data": {
    "session": {
      "id": "session-uuid",
      "sport": "tennis",
      "date": "2025-02-15",
      "time": "14:00",
      "location": "Tennis Club",
      "participants": [
        {
          "id": "user-uuid",
          "firstname": "Jean",
          "lastname": "Dupont",
          "status": "declined" // Changé de "accepted" à "declined"
        }
      ]
    }
  }
}
```

### Erreur 400 - Utilisateur n'a pas accepté
```json
{
  "success": false,
  "message": "Vous n'avez pas accepté l'invitation à cette session",
  "error": "USER_NOT_ACCEPTED"
}
```

### Erreur 403 - Non autorisé
```json
{
  "success": false,
  "message": "Vous n'êtes pas autorisé à annuler votre participation à cette session",
  "error": "UNAUTHORIZED"
}
```

### Erreur 409 - Session terminée
```json
{
  "success": false,
  "message": "Impossible d'annuler la participation à une session terminée",
  "error": "SESSION_ENDED"
}
```

## 🔔 Notifications

### Notification créée pour l'organisateur
- **Type** : `session_update`
- **Titre** : "Participation annulée"
- **Message** : "[Nom Prénom] a annulé sa participation à votre session de [sport]"
- **Données** : 
  ```json
  {
    "type": "session_update",
    "session_id": "session-uuid",
    "user_id": "user-uuid",
    "action": "participation_cancelled",
    "previous_status": "accepted",
    "new_status": "declined"
  }
  ```

### Notification push
Si configurée, envoyer une notification push à l'organisateur avec les mêmes données.

## 🧪 Tests de validation

### Tests positifs
1. Participant annule sa participation → Succès
2. Statut du participant passe de `accepted` à `declined`
3. Notification créée et envoyée à l'organisateur
4. Session retournée avec participants mis à jour

### Tests négatifs
1. Utilisateur non-participant tente de s'annuler → 403
2. Annulation d'un utilisateur qui n'a pas accepté → 400
3. Annulation d'une session terminée → 409
4. Session inexistante → 404

## 📊 Impact

### Positif
- ✅ Amélioration de l'expérience utilisateur
- ✅ Plus de flexibilité pour les participants
- ✅ Meilleure gestion des places disponibles

### Risques
- ⚠️ Possibilité d'annulations de dernière minute
- ⚠️ Impact sur la planification des sessions

## 🔗 Liens

- **US-002** : Suppression de participation à une session
- **Frontend** : `app/session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md`
