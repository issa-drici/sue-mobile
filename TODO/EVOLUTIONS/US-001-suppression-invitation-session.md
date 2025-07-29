# US-001 - Suppression d'invitation de session

## 📋 Informations générales

- **ID** : US-001
- **Titre** : Suppression d'invitation de session
- **Priorité** : 🔴 Haute
- **Statut** : 🔄 À faire
- **Créé le** : 2024-01-XX
- **Assigné** : -

## 🎯 Contexte

En tant qu'organisateur d'une session, je veux pouvoir supprimer une invitation envoyée avant qu'elle soit acceptée, afin de corriger une erreur de sélection ou annuler une invitation.

**Problème actuel** : Une fois une invitation envoyée, l'organisateur ne peut plus la retirer, même si elle n'a pas encore été acceptée.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] L'organisateur peut voir un bouton "Supprimer" à côté de chaque invitation en attente (`status: "pending"`)
- [ ] Le bouton "Supprimer" n'apparaît que pour les invitations en attente
- [ ] La suppression retire l'invitation de la liste des participants de la session
- [ ] L'utilisateur invité ne reçoit plus de notification de cette session
- [ ] Impossible de supprimer une invitation déjà acceptée (`status: "accepted"`)
- [ ] Impossible de supprimer une invitation déjà refusée (`status: "declined"`)
- [ ] Confirmation demandée avant suppression

### Non-fonctionnels
- [ ] Temps de réponse < 2 secondes
- [ ] Feedback visuel pendant la suppression
- [ ] Gestion des erreurs avec messages appropriés
- [ ] Mise à jour en temps réel de l'interface

## 🎨 Interface utilisateur

### Écran de détail de session
- **Localisation** : Liste des participants dans `app/session/[id].tsx`
- **Élément** : Bouton "Supprimer" à côté de chaque participant avec `status: "pending"`
- **Style** : Bouton rouge avec icône "trash-outline"
- **Position** : À droite du nom du participant

### Modal de confirmation
- **Titre** : "Supprimer l'invitation"
- **Message** : "Êtes-vous sûr de vouloir supprimer l'invitation envoyée à [Nom Prénom] ?"
- **Boutons** : "Annuler" (gris) et "Supprimer" (rouge)

## 🔧 Tâches Frontend

### 1. Service API
- [ ] Créer `services/api/endpoints.ts` : ajouter `REMOVE_INVITATION: (sessionId: string, userId: string) => `/sessions/${sessionId}/participants/${userId}``
- [ ] Créer `services/api/sessionsApi.ts` : ajouter méthode `removeInvitation(sessionId, userId)`
- [ ] Créer `services/sessions/removeInvitation.ts` : hook `useRemoveInvitation()`
- [ ] Exporter le hook dans `services/sessions/index.ts`
- [ ] Exporter le hook dans `services/index.ts`

### 2. Interface utilisateur
- [ ] Modifier `app/session/[id].tsx` :
  - [ ] Importer le hook `useRemoveInvitation`
  - [ ] Ajouter état pour modal de confirmation
  - [ ] Créer fonction `handleRemoveInvitation(userId, userName)`
  - [ ] Ajouter bouton "Supprimer" dans `renderParticipantItem`
  - [ ] Créer modal de confirmation
  - [ ] Gérer les états de chargement et d'erreur

### 3. Composants UI
- [ ] Créer composant `RemoveInvitationButton` (optionnel)
- [ ] Créer composant `ConfirmationModal` (optionnel)

### 4. Gestion des erreurs
- [ ] Gérer erreur 403 (non autorisé)
- [ ] Gérer erreur 404 (invitation non trouvée)
- [ ] Gérer erreur 400 (invitation déjà acceptée/refusée)
- [ ] Afficher messages d'erreur appropriés

## 🔌 Tâches Backend

### 1. Endpoint API
- **Méthode** : `DELETE`
- **URL** : `/api/sessions/{sessionId}/participants/{userId}`
- **Headers** : `Authorization: Bearer {token}`
- **Body** : Aucun

### 2. Logique métier
- [ ] Vérifier que l'utilisateur est l'organisateur de la session
- [ ] Vérifier que l'invitation existe et a le statut "pending"
- [ ] Supprimer l'entrée de la table `session_participants`
- [ ] Supprimer les notifications associées
- [ ] Retourner la session mise à jour

### 3. Validation
- [ ] Session existe et appartient à l'utilisateur
- [ ] Participant existe dans la session
- [ ] Statut de l'invitation est "pending"
- [ ] Impossible de supprimer sa propre participation

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
    ]
  },
  "message": "Invitation supprimée avec succès"
}
```

#### Erreur 403 (Non autorisé)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas autorisé à supprimer cette invitation"
  }
}
```

#### Erreur 404 (Invitation non trouvée)
```json
{
  "success": false,
  "error": {
    "code": "INVITATION_NOT_FOUND",
    "message": "Invitation non trouvée"
  }
}
```

#### Erreur 400 (Invitation déjà traitée)
```json
{
  "success": false,
  "error": {
    "code": "INVITATION_ALREADY_PROCESSED",
    "message": "Impossible de supprimer une invitation déjà acceptée ou refusée"
  }
}
```

## 🧪 Tests

### Tests Frontend
- [ ] Test du hook `useRemoveInvitation`
- [ ] Test de l'affichage du bouton "Supprimer"
- [ ] Test de la modal de confirmation
- [ ] Test de la suppression réussie
- [ ] Test de la gestion des erreurs
- [ ] Test de la mise à jour de l'interface

### Tests Backend
- [ ] Test de suppression d'invitation en attente
- [ ] Test de tentative de suppression d'invitation acceptée
- [ ] Test de tentative de suppression par non-organisateur
- [ ] Test de suppression d'invitation inexistante
- [ ] Test de suppression de sa propre participation

### Tests d'intégration
- [ ] Test complet du workflow de suppression
- [ ] Test de la mise à jour en temps réel
- [ ] Test de la suppression des notifications

## 📱 Maquettes

### État normal
```
┌─────────────────────────────────────┐
│ Participants                        │
├─────────────────────────────────────┤
│ ✅ Jean Dupont (Accepté)            │
│ ⏳ Marie Martin (En attente) [🗑️]   │
│ ❌ Pierre Durand (Refusé)           │
└─────────────────────────────────────┘
```

### Modal de confirmation
```
┌─────────────────────────────────────┐
│ Supprimer l'invitation              │
├─────────────────────────────────────┤
│ Êtes-vous sûr de vouloir supprimer  │
│ l'invitation envoyée à Marie Martin?│
├─────────────────────────────────────┤
│ [Annuler]        [Supprimer]        │
└─────────────────────────────────────┘
```

## 🔄 Workflow utilisateur

1. **Accès** : L'utilisateur va sur le détail d'une session qu'il a créée
2. **Identification** : Il voit la liste des participants avec leurs statuts
3. **Action** : Il clique sur le bouton "🗑️" à côté d'une invitation en attente
4. **Confirmation** : Une modal lui demande de confirmer la suppression
5. **Validation** : Il clique sur "Supprimer"
6. **Feedback** : L'interface affiche "Suppression en cours..."
7. **Résultat** : L'invitation disparaît de la liste et un message de succès s'affiche

## 📊 Métriques

- **Temps de suppression** : < 2 secondes
- **Taux de succès** : > 95%
- **Taux d'erreur** : < 5%

## 🔗 Dépendances

- Aucune dépendance externe
- Utilise l'infrastructure API existante
- Compatible avec le système d'authentification actuel

## 📝 Notes techniques

- Utiliser le même pattern que les autres actions de session
- Gérer les états de chargement pour une bonne UX
- Implémenter la suppression optimiste (mise à jour UI avant confirmation API)
- Ajouter des logs pour le debugging 