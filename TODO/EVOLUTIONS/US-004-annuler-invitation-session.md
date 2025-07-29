# US-004 - Annuler une invitation à une session

## 📋 Informations générales

- **ID** : US-004
- **Titre** : Annuler une invitation à une session
- **Priorité** : 🔴 Haute
- **Statut** : 🔄 À faire
- **Créé le** : 2024-12-20
- **Assigné** : -

## 🎯 Contexte

En tant qu'utilisateur qui a invité quelqu'un à une session, je veux pouvoir annuler cette invitation avant qu'elle soit acceptée, afin de corriger une erreur ou changer d'avis.

**Problème actuel** : Une fois une invitation envoyée, elle ne peut plus être annulée, même si elle n'a pas encore été acceptée.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] L'utilisateur qui a envoyé l'invitation peut voir un bouton "Annuler" à côté de chaque invitation en attente
- [ ] Le bouton "Annuler" n'apparaît que pour les invitations avec le statut "pending"
- [ ] L'annulation retire l'invitation de la liste des participants de la session
- [ ] L'utilisateur invité reçoit une notification d'annulation
- [ ] Impossible d'annuler une invitation déjà acceptée
- [ ] Impossible d'annuler une invitation déjà refusée
- [ ] Confirmation demandée avant annulation
- [ ] L'organisateur peut annuler toutes les invitations de sa session

### Non-fonctionnels
- [ ] Temps de réponse < 2 secondes
- [ ] Feedback visuel pendant l'annulation
- [ ] Gestion des erreurs avec messages appropriés
- [ ] Mise à jour en temps réel de l'interface

## 🎨 Interface utilisateur

### Écran de détail de session
- **Localisation** : Liste des participants dans `app/session/[id].tsx`
- **Élément** : Bouton "Annuler" à côté de chaque participant avec `status: "pending"`
- **Style** : Bouton rouge avec icône "close-circle-outline"
- **Position** : À droite du nom du participant

### Modal de confirmation
- **Titre** : "Annuler l'invitation"
- **Message** : "Êtes-vous sûr de vouloir annuler l'invitation envoyée à [Nom Prénom] ?"
- **Boutons** : "Annuler" (gris) et "Confirmer" (rouge)

## 🔧 Tâches Frontend

### 1. Service API
- [ ] Créer `services/api/endpoints.ts` : ajouter `CANCEL_INVITATION: (sessionId: string, userId: string) => `/sessions/${sessionId}/invitations/${userId}/cancel``
- [ ] Créer `services/api/sessionsApi.ts` : ajouter méthode `cancelInvitation(sessionId, userId)`
- [ ] Créer `services/sessions/cancelInvitation.ts` : hook `useCancelInvitation()`
- [ ] Exporter le hook dans `services/sessions/index.ts`
- [ ] Exporter le hook dans `services/index.ts`

### 2. Interface utilisateur
- [ ] Modifier `app/session/[id].tsx` :
  - [ ] Importer le hook `useCancelInvitation`
  - [ ] Ajouter état pour modal de confirmation
  - [ ] Créer fonction `handleCancelInvitation(userId, userName)`
  - [ ] Ajouter bouton "Annuler" dans `renderParticipantItem`
  - [ ] Créer modal de confirmation
  - [ ] Gérer les états de chargement et d'erreur

### 3. Gestion des erreurs
- [ ] Gérer erreur 403 (non autorisé)
- [ ] Gérer erreur 404 (invitation non trouvée)
- [ ] Gérer erreur 400 (invitation déjà acceptée/refusée)
- [ ] Afficher messages d'erreur appropriés

## 🔌 Tâches Backend

### 1. Endpoint API
- **Méthode** : `DELETE`
- **URL** : `/api/sessions/{sessionId}/invitations/{userId}/cancel`
- **Headers** : `Authorization: Bearer {token}`
- **Body** : Aucun

### 2. Logique métier
- [ ] Vérifier que l'utilisateur a le droit d'annuler l'invitation (organisateur ou inviteur)
- [ ] Vérifier que l'invitation existe et a le statut "pending"
- [ ] Supprimer l'entrée de la table `session_participants`
- [ ] Créer une notification d'annulation pour l'utilisateur invité
- [ ] Retourner la session mise à jour

### 3. Validation
- [ ] Session existe
- [ ] Invitation existe et appartient à l'utilisateur
- [ ] Statut de l'invitation est "pending"
- [ ] Utilisateur a les droits pour annuler

### 4. Réponses API

#### Succès (200)
```json
{
  "success": true,
  "data": {
    "sessionId": "1",
    "cancelledUserId": "2",
    "message": "Invitation annulée avec succès"
  }
}
```

#### Erreur (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'êtes pas autorisé à annuler cette invitation"
  }
}
```

## 📊 Impact

### Positif
- ✅ Contrôle total sur les invitations envoyées
- ✅ Possibilité de corriger les erreurs
- ✅ Meilleure gestion des sessions

### Risques
- ⚠️ Confusion possible avec la suppression d'invitation (US-001)
- ⚠️ Notifications supplémentaires

## 🔗 Liens

- **US-001** : Suppression d'invitation de session (organisateur uniquement)
- **US-005** : Système de notifications
- **Frontend** : `app/session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md` 