# Feature Request — Réinvitation d'un utilisateur qui a refusé une invitation

## 📋 Informations générales

- **Titre :** Réinvitation d'un utilisateur qui a refusé une invitation
- **ID :** FR-20250122-001
- **Date :** 22/01/2025
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 15/02/2025

## 🎯 Description

### Fonctionnalité demandée
Permettre à l'organisateur d'une session de réinviter un utilisateur qui a précédemment refusé une invitation à cette session.

### Contexte
Actuellement, quand un utilisateur refuse une invitation à une session, l'organisateur ne peut plus le réinviter. Cela peut être problématique si :
- L'utilisateur a changé d'avis
- L'organisateur veut insister poliment
- Les circonstances ont changé (nouveau créneau, nouveau lieu, etc.)

### Cas d'usage
- Un ami refuse une invitation car il est occupé ce jour-là
- L'organisateur change l'heure de la session pour accommoder l'ami
- L'organisateur veut réinviter l'ami avec la nouvelle heure
- L'ami peut maintenant accepter la nouvelle invitation

## 🔧 Spécifications techniques

### Endpoint nécessaire
```
POST /api/sessions/{sessionId}/participants/{userId}/reinvite
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
  "message": "string (optionnel)" // Message personnalisé pour la réinvitation
}
```

### Codes de réponse
- `200` - Réinvitation envoyée avec succès
- `400` - Utilisateur n'a pas refusé l'invitation précédemment
- `403` - Non autorisé (pas l'organisateur de la session)
- `404` - Session ou utilisateur non trouvé
- `409` - Utilisateur déjà invité avec un autre statut

## 📱 Impact sur le mobile

### Écrans concernés
- Écran de détail de session (`app/session/[id].tsx`)
- Liste des participants

### Hooks/Composants à créer
- `useReinviteParticipant` - Hook pour la réinvitation
- `ReinviteButton` - Composant bouton de réinvitation

### Tests à implémenter
- Test de réinvitation d'un utilisateur qui a refusé
- Test de réinvitation d'un utilisateur qui n'a pas refusé (erreur)
- Test de permissions (seul l'organisateur peut réinviter)

## 🔄 Logique métier

### Conditions préalables
1. L'utilisateur doit être l'organisateur de la session
2. L'utilisateur cible doit avoir le statut `declined` dans la session
3. La session ne doit pas être terminée

### Actions effectuées
1. Vérifier les permissions et conditions
2. Mettre à jour le statut du participant de `declined` à `pending`
3. Créer une nouvelle notification d'invitation
4. Envoyer une notification push si configurée
5. Retourner la session mise à jour

### Validation
- **sessionId** : Doit exister et appartenir à l'utilisateur connecté
- **userId** : Doit exister et avoir le statut `declined` dans la session
- **message** : Optionnel, max 500 caractères

## 📡 Format de réponse

### Succès (200)
```json
{
  "success": true,
  "message": "Invitation renvoyée avec succès",
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
          "status": "pending" // Changé de "declined" à "pending"
        }
      ]
    }
  }
}
```

### Erreur 400 - Utilisateur n'a pas refusé
```json
{
  "success": false,
  "message": "Cet utilisateur n'a pas refusé l'invitation précédemment",
  "error": "USER_NOT_DECLINED"
}
```

### Erreur 403 - Non autorisé
```json
{
  "success": false,
  "message": "Vous n'êtes pas autorisé à réinviter des participants à cette session",
  "error": "UNAUTHORIZED"
}
```

### Erreur 409 - Statut incompatible
```json
{
  "success": false,
  "message": "Cet utilisateur a déjà accepté l'invitation",
  "error": "USER_ALREADY_ACCEPTED"
}
```

## 🔔 Notifications

### Notification créée
- **Type** : `session_invitation`
- **Titre** : "Nouvelle invitation à une session"
- **Message** : "[Organisateur] vous a réinvité à sa session de [sport]"
- **Données** : 
  ```json
  {
    "type": "session_invitation",
    "session_id": "session-uuid",
    "organizer_id": "organizer-uuid",
    "message": "Message personnalisé (si fourni)"
  }
  ```

### Notification push
Si configurée, envoyer une notification push avec les mêmes données.

## 🧪 Tests de validation

### Tests positifs
1. Organisateur réinvite un utilisateur qui a refusé → Succès
2. Statut passe de `declined` à `pending`
3. Notification créée et envoyée
4. Session retournée avec participants mis à jour

### Tests négatifs
1. Utilisateur non-organisateur tente de réinviter → 403
2. Réinvitation d'un utilisateur qui n'a pas refusé → 400
3. Réinvitation d'un utilisateur qui a accepté → 409
4. Session inexistante → 404
5. Utilisateur inexistant → 404

## 📊 Impact

### Positif
- ✅ Amélioration de l'expérience utilisateur
- ✅ Plus de flexibilité pour les organisateurs
- ✅ Réduction des sessions annulées faute de participants

### Risques
- ⚠️ Possibilité de spam d'invitations
- ⚠️ Complexité de gestion des notifications multiples

## 🔗 Liens

- **US-001** : Suppression d'invitation de session
- **US-004** : Annuler une invitation à une session
- **Frontend** : `app/session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md`
