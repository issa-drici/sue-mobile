# US-002 - Suppression de participation à une session

## 📋 Informations générales

- **ID** : US-002
- **Titre** : Suppression de participation à une session
- **Priorité** : 🔴 Haute
- **Statut** : 🔄 À faire
- **Créé le** : 2024-01-XX
- **Assigné** : -

## 🎯 Contexte

En tant que participant à une session, je veux pouvoir me désinscrire d'une session à laquelle j'ai accepté de participer, afin de libérer ma place si je ne peux plus y assister.

**Problème actuel** : Une fois qu'un utilisateur a accepté une invitation, il ne peut plus se désinscrire de la session.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] Le participant peut voir un bouton "Se désinscrire" sur les sessions où il a le statut "accepted"
- [ ] Le bouton "Se désinscrire" n'apparaît que pour les participants (pas pour l'organisateur)
- [ ] La désinscription retire le participant de la liste des participants de la session
- [ ] Un commentaire automatique est ajouté à la session : "[Nom Prénom] s'est désinscrit de la session"
- [ ] Confirmation demandée avant désinscription
- [ ] Impossible de se désinscrire d'une session déjà terminée

### Non-fonctionnels
- [ ] Temps de réponse < 2 secondes
- [ ] Feedback visuel pendant la désinscription
- [ ] Gestion des erreurs avec messages appropriés
- [ ] Mise à jour en temps réel de l'interface

## 🎨 Interface utilisateur

### Écran de détail de session
- **Localisation** : Section participants dans `app/session/[id].tsx`
- **Élément** : Bouton "Se désinscrire" à côté du nom du participant avec `status: "accepted"`
- **Style** : Bouton rouge avec icône "person-remove-outline"
- **Position** : À droite du nom du participant (seulement pour l'utilisateur actuel)

### Modal de confirmation
- **Titre** : "Se désinscrire de la session"
- **Message** : "Êtes-vous sûr de vouloir vous désinscrire de cette session ? Cette action ne peut pas être annulée."
- **Boutons** : "Annuler" (gris) et "Se désinscrire" (rouge)

## 🔧 Tâches Frontend

### 1. Service API
- [ ] Créer `services/api/endpoints.ts` : ajouter `LEAVE_SESSION: (sessionId: string) => `/sessions/${sessionId}/leave``
- [ ] Créer `services/api/sessionsApi.ts` : ajouter méthode `leaveSession(sessionId)`
- [ ] Créer `services/sessions/leaveSession.ts` : hook `useLeaveSession()`
- [ ] Exporter le hook dans `services/sessions/index.ts`
- [ ] Exporter le hook dans `services/index.ts`

### 2. Interface utilisateur
- [ ] Modifier `app/session/[id].tsx` :
  - [ ] Importer le hook `useLeaveSession`
  - [ ] Ajouter état pour modal de confirmation
  - [ ] Créer fonction `handleLeaveSession()`
  - [ ] Ajouter bouton "Se désinscrire" dans `renderParticipantItem`
  - [ ] Créer modal de confirmation
  - [ ] Gérer les états de chargement et d'erreur

### 3. Composants UI
- [ ] Créer composant `LeaveSessionButton` (optionnel)
- [ ] Créer composant `ConfirmationModal` (optionnel)

### 4. Gestion des erreurs
- [ ] Gérer erreur 403 (non autorisé)
- [ ] Gérer erreur 404 (session non trouvée)
- [ ] Gérer erreur 400 (session terminée)
- [ ] Afficher messages d'erreur appropriés

## 🔌 Tâches Backend

### 1. Endpoint API
- **Méthode** : `DELETE`
- **URL** : `/api/sessions/{sessionId}/leave`
- **Headers** : `Authorization: Bearer {token}`
- **Body** : Aucun

### 2. Logique métier
- [ ] Vérifier que l'utilisateur est un participant avec le statut "accepted"
- [ ] Vérifier que la session n'est pas terminée
- [ ] Supprimer l'entrée de la table `session_participants`
- [ ] Ajouter automatiquement un commentaire : "[Nom Prénom] s'est désinscrit de la session"
- [ ] Retourner la session mise à jour

### 3. Validation
- [ ] Session existe et n'est pas terminée
- [ ] Utilisateur est participant avec statut "accepted"
- [ ] Impossible de se désinscrire si on est l'organisateur

### 4. Réponses API

#### Succès (200)
```json
{
  "success": true,
  "data": {
    "id": "session-id",
    "sport": "tennis",
    "participants": [
      {
        "id": "user-id",
        "firstName": "Jean",
        "lastName": "Dupont",
        "status": "accepted"
      }
    ],
    "comments": [
      {
        "id": "comment-id",
        "userId": "system",
        "firstName": "Système",
        "lastName": "",
        "content": "Marie Martin s'est désinscrit de la session",
        "createdAt": "2024-01-XXT10:00:00Z"
      }
    ]
  },
  "message": "Vous vous êtes désinscrit de la session"
}
```

#### Erreur 403 (Non autorisé)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas autorisé à vous désinscrire de cette session"
  }
}
```

#### Erreur 404 (Session non trouvée)
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session non trouvée"
  }
}
```

#### Erreur 400 (Session terminée)
```json
{
  "success": false,
  "error": {
    "code": "SESSION_ALREADY_FINISHED",
    "message": "Impossible de se désinscrire d'une session terminée"
  }
}
```

## 🧪 Tests

### Tests Frontend
- [ ] Test du hook `useLeaveSession`
- [ ] Test de l'affichage du bouton "Se désinscrire"
- [ ] Test de la modal de confirmation
- [ ] Test de la désinscription réussie
- [ ] Test de la gestion des erreurs
- [ ] Test de la mise à jour de l'interface

### Tests Backend
- [ ] Test de désinscription d'un participant
- [ ] Test de tentative de désinscription par l'organisateur
- [ ] Test de désinscription d'une session terminée
- [ ] Test de désinscription d'une session inexistante
- [ ] Test de l'ajout automatique du commentaire

### Tests d'intégration
- [ ] Test complet du workflow de désinscription
- [ ] Test de la mise à jour en temps réel
- [ ] Test de l'affichage du commentaire automatique

## 📱 Maquettes

### État normal
```
┌─────────────────────────────────────┐
│ Participants                        │
├─────────────────────────────────────┤
│ ✅ Jean Dupont (Organisateur)       │
│ ✅ Marie Martin (Participant) [🚪]  │
│ ⏳ Pierre Durand (En attente)       │
└─────────────────────────────────────┘
```

### Modal de confirmation
```
┌─────────────────────────────────────┐
│ Se désinscrire de la session        │
├─────────────────────────────────────┤
│ Êtes-vous sûr de vouloir vous       │
│ désinscrire de cette session ?      │
│ Cette action ne peut pas être       │
│ annulée.                            │
├─────────────────────────────────────┤
│ [Annuler]      [Se désinscrire]     │
└─────────────────────────────────────┘
```

## 🔄 Workflow utilisateur

1. **Accès** : L'utilisateur va sur le détail d'une session où il participe
2. **Identification** : Il voit son nom dans la liste des participants avec le statut "Participant"
3. **Action** : Il clique sur le bouton "🚪" à côté de son nom
4. **Confirmation** : Une modal lui demande de confirmer la désinscription
5. **Validation** : Il clique sur "Se désinscrire"
6. **Feedback** : L'interface affiche "Désinscription en cours..."
7. **Résultat** : Son nom disparaît de la liste et un commentaire automatique s'ajoute

## 📊 Métriques

- **Temps de désinscription** : < 2 secondes
- **Taux de succès** : > 95%
- **Taux d'erreur** : < 5%

## 🔗 Dépendances

- Aucune dépendance externe
- Utilise l'infrastructure API existante
- Compatible avec le système d'authentification actuel

## 📝 Notes techniques

- Utiliser le même pattern que les autres actions de session
- Gérer les états de chargement pour une bonne UX
- Implémenter la désinscription optimiste (mise à jour UI avant confirmation API)
- Ajouter des logs pour le debugging
- Le commentaire automatique doit être identifiable comme système 