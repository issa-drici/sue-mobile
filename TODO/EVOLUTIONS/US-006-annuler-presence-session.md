# US-006 - Annuler sa présence à une session

## 📋 Informations générales

- **ID** : US-006
- **Titre** : Annuler sa présence à une session
- **Priorité** : 🔴 Haute
- **Statut** : 🔄 À faire
- **Créé le** : 2024-12-20
- **Assigné** : -

## 🎯 Contexte

En tant que participant à une session, je veux pouvoir annuler ma participation si j'ai un empêchement, afin de libérer ma place pour d'autres participants.

**Problème actuel** : Une fois qu'un participant a accepté une invitation, il ne peut plus se désinscrire de la session.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] Le participant peut voir un bouton "Se désinscrire" sur la page de détail de session
- [ ] Le bouton n'apparaît que pour les participants avec le statut "accepted"
- [ ] La désinscription retire le participant de la liste des participants
- [ ] L'organisateur reçoit une notification de désinscription
- [ ] Impossible de se désinscrire si la session a déjà commencé
- [ ] Confirmation demandée avant désinscription
- [ ] L'organisateur ne peut pas se désinscrire de sa propre session

### Non-fonctionnels
- [ ] Temps de réponse < 2 secondes
- [ ] Feedback visuel pendant la désinscription
- [ ] Gestion des erreurs avec messages appropriés
- [ ] Mise à jour en temps réel de l'interface

## 🎨 Interface utilisateur

### Écran de détail de session
- **Localisation** : `app/session/[id].tsx`
- **Élément** : Bouton "Se désinscrire" dans la section statut utilisateur
- **Style** : Bouton rouge avec icône "person-remove-outline"
- **Position** : À côté du statut "Vous participez à cette session"

### Modal de confirmation
- **Titre** : "Se désinscrire de la session"
- **Message** : "Êtes-vous sûr de vouloir vous désinscrire de cette session ? Votre place sera libérée."
- **Boutons** : "Annuler" (gris) et "Se désinscrire" (rouge)

## 🔧 Tâches Frontend

### 1. Service API
- [ ] Créer `services/api/endpoints.ts` : ajouter `CANCEL_PARTICIPATION: (sessionId: string) => `/sessions/${sessionId}/participate/cancel``
- [ ] Créer `services/api/sessionsApi.ts` : ajouter méthode `cancelParticipation(sessionId)`
- [ ] Créer `services/sessions/cancelParticipation.ts` : hook `useCancelParticipation()`
- [ ] Exporter le hook dans `services/sessions/index.ts`
- [ ] Exporter le hook dans `services/index.ts`

### 2. Interface utilisateur
- [ ] Modifier `app/session/[id].tsx` :
  - [ ] Importer le hook `useCancelParticipation`
  - [ ] Ajouter état pour modal de confirmation
  - [ ] Créer fonction `handleCancelParticipation()`
  - [ ] Ajouter bouton "Se désinscrire" dans la section statut
  - [ ] Créer modal de confirmation
  - [ ] Gérer les états de chargement et d'erreur
  - [ ] Vérifier que la session n'a pas commencé

### 3. Gestion des erreurs
- [ ] Gérer erreur 403 (non autorisé)
- [ ] Gérer erreur 404 (session non trouvée)
- [ ] Gérer erreur 400 (session déjà commencée)
- [ ] Gérer erreur 400 (organisateur ne peut pas se désinscrire)
- [ ] Afficher messages d'erreur appropriés

## 🔌 Tâches Backend

### 1. Endpoint API
- **Méthode** : `DELETE`
- **URL** : `/api/sessions/{sessionId}/participate/cancel`
- **Headers** : `Authorization: Bearer {token}`
- **Body** : Aucun

### 2. Logique métier
- [ ] Vérifier que l'utilisateur est un participant accepté
- [ ] Vérifier que l'utilisateur n'est pas l'organisateur
- [ ] Vérifier que la session n'a pas encore commencé
- [ ] Supprimer l'entrée de la table `session_participants`
- [ ] Créer une notification pour l'organisateur
- [ ] Retourner la session mise à jour

### 3. Validation
- [ ] Session existe
- [ ] Utilisateur est participant accepté
- [ ] Utilisateur n'est pas l'organisateur
- [ ] Session n'a pas encore commencé

### 4. Réponses API

#### Succès (200)
```json
{
  "success": true,
  "data": {
    "sessionId": "1",
    "userId": "2",
    "message": "Participation annulée avec succès"
  }
}
```

#### Erreur (400)
```json
{
  "success": false,
  "error": {
    "code": "SESSION_STARTED",
    "message": "Impossible de se désinscrire d'une session qui a déjà commencé"
  }
}
```

#### Erreur (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous ne pouvez pas vous désinscrire de cette session"
  }
}
```

## 📊 Impact

### Positif
- ✅ Flexibilité pour les participants
- ✅ Libération de places pour d'autres
- ✅ Meilleure gestion des sessions

### Risques
- ⚠️ Désistements de dernière minute
- ⚠️ Impact sur la planification des sessions

## 🔗 Liens

- **US-004** : Annuler une invitation
- **US-005** : Système de notifications
- **US-007** : Limite de participants
- **Frontend** : `app/session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md` 