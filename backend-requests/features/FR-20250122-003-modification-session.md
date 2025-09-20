# Feature Request — Modification d'une session existante

## 📋 Informations générales

- **Titre :** Modification d'une session existante
- **ID :** FR-20250122-003
- **Date :** 22/01/2025
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 15/02/2025

## 🎯 Description

### Fonctionnalité demandée
Permettre à l'organisateur d'une session de modifier les détails de sa session (date, heure, lieu).

### Contexte
Actuellement, une fois une session créée, l'organisateur ne peut plus modifier ses détails. Cela peut être problématique si :
- L'organisateur a fait une erreur lors de la création
- Les circonstances ont changé (nouveau lieu, nouvelle heure)
- Il veut ajuster le nombre maximum de participants

### Cas d'usage
- Un organisateur crée une session de tennis pour le samedi à 14h
- Il se rend compte qu'il a fait une erreur sur l'heure (c'était 16h)
- Il veut corriger l'heure de la session
- Les participants sont notifiés du changement
- **Note :** Le sport reste "tennis" et ne peut pas être changé

## 🔧 Spécifications techniques

### Endpoint nécessaire
```
PUT /api/sessions/{sessionId}
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
  "date": "2025-02-15",
  "time": "16:00",
  "location": "Tennis Club de Paris"
}
```

**Note :** Le champ `sport` n'est pas inclus car il ne peut pas être modifié.

### Codes de réponse
- `200` - Session mise à jour avec succès
- `400` - Données invalides
- `403` - Non autorisé (pas l'organisateur de la session)
- `404` - Session non trouvée
- `409` - Session déjà terminée

## 📱 Impact sur le mobile

### Écrans concernés
- Écran de détail de session (`app/session/[id].tsx`)
- Nouvel écran d'édition (`app/edit-session/[id].tsx`) - Sport et nombre max de participants en lecture seule

### Hooks/Composants créés
- `useUpdateSession` - Hook pour la mise à jour de session (déjà existant)
- Bouton "Modifier" dans l'interface (déjà implémenté)
- Écran d'édition de session (déjà créé)

### Tests à implémenter
- Test de modification d'une session par l'organisateur
- Test de modification par un non-organisateur (erreur)
- Test de validation des données
- Test de notification des participants

## 🔄 Logique métier

### Conditions préalables
1. L'utilisateur doit être l'organisateur de la session
2. La session ne doit pas être terminée
3. Les nouvelles données doivent être valides

### Actions effectuées
1. Vérifier les permissions et conditions
2. Mettre à jour les données modifiables de la session dans la base de données (date, heure, lieu)
3. Créer des notifications pour tous les participants
4. Envoyer des notifications push si configurées
5. Retourner la session mise à jour

**Note :** Le sport de la session reste inchangé.

### Validation
- **sessionId** : Doit exister
- **utilisateur** : Doit être l'organisateur de la session
- **session** : Ne doit pas être terminée
- **date** : Doit être dans le futur
- **time** : Format HH:MM
- **location** : Max 200 caractères

**Note :** Le sport n'est pas validé car il ne peut pas être modifié.

## 📡 Format de réponse

### Succès (200)
```json
{
  "success": true,
  "message": "Session mise à jour avec succès",
  "data": {
    "session": {
      "id": "session-uuid",
      "sport": "tennis",
      "date": "2025-02-15",
      "time": "16:00",
      "location": "Tennis Club de Paris",
      "maxParticipants": 8,
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

### Erreur 400 - Données invalides
```json
{
  "success": false,
  "message": "Les données fournies sont invalides",
  "error": "VALIDATION_ERROR",
  "details": {
    "date": ["La date doit être dans le futur"],
    "location": ["Le lieu ne peut pas dépasser 200 caractères"]
  }
}
```

### Erreur 403 - Non autorisé
```json
{
  "success": false,
  "message": "Vous n'êtes pas autorisé à modifier cette session",
  "error": "UNAUTHORIZED"
}
```

### Erreur 409 - Session terminée
```json
{
  "success": false,
  "message": "Impossible de modifier une session terminée",
  "error": "SESSION_ENDED"
}
```

## 🔔 Notifications

### Notification créée pour tous les participants
- **Type** : `session_update`
- **Titre** : "Session modifiée"
- **Message** : "[Organisateur] a modifié sa session de [sport]"
- **Données** : 
  ```json
  {
    "type": "session_update",
    "session_id": "session-uuid",
    "organizer_id": "organizer-uuid",
    "changes": {
      "date": "2025-02-15",
      "time": "16:00",
      "location": "Tennis Club de Paris"
    }
  }
  ```

### Notification push
Si configurée, envoyer une notification push à tous les participants avec les mêmes données.

## 🧪 Tests de validation

### Tests positifs
1. Organisateur modifie sa session → Succès
2. Données mises à jour dans la base de données
3. Notifications créées et envoyées aux participants
4. Session retournée avec données mises à jour

### Tests négatifs
1. Utilisateur non-organisateur tente de modifier → 403
2. Modification d'une session terminée → 409
3. Données invalides → 400
4. Session inexistante → 404

## 📊 Impact

### Positif
- ✅ Amélioration de l'expérience utilisateur
- ✅ Plus de flexibilité pour les organisateurs
- ✅ Correction d'erreurs possibles

### Risques
- ⚠️ Notifications multiples pour les participants
- ⚠️ Confusion si modifications fréquentes

## 🔗 Liens

- **US-009** : Modifier une session
- **Frontend** : `app/session/[id].tsx`, `app/edit-session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md`
