# US-008 - Limite de participants lors de l'invitation

## 📋 Informations générales

- **ID** : US-008
- **Titre** : Limite de participants lors de l'invitation
- **Priorité** : 🟡 Moyenne
- **Statut** : 🔄 À faire
- **Créé le** : 2024-12-20
- **Assigné** : -

## 🎯 Contexte

En tant qu'utilisateur invitant des amis à une session, je veux être informé de la limite de participants et ne pas pouvoir sélectionner plus d'amis que la capacité de la session.

**Problème actuel** : Il n'y a pas de contrôle sur le nombre de participants lors de l'invitation, ce qui peut mener à dépasser la limite de la session.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] Affichage du nombre de participants actuels et de la limite
- [ ] Calcul en temps réel : participants confirmés + en attente + sélectionnés
- [ ] Désactivation des amis si la limite serait dépassée
- [ ] Message d'information sur la limite
- [ ] Indicateur visuel pour les amis non sélectionnables
- [ ] Validation avant envoi des invitations
- [ ] Gestion des sessions sans limite (maxParticipants = null)

### Non-fonctionnels
- [ ] Calcul en temps réel sans latence
- [ ] Interface responsive
- [ ] Messages d'erreur clairs
- [ ] Performance optimisée

## 🎨 Interface utilisateur

### Modal d'invitation
- **Localisation** : `app/session/[id].tsx` (modal d'invitation)
- **Éléments** :
  - [ ] Compteur de participants : "X/Y participants"
  - [ ] Barre de progression visuelle
  - [ ] Message d'information sur la limite
  - [ ] Amis désactivés avec indicateur visuel
  - [ ] Bouton d'envoi désactivé si limite dépassée

### Indicateurs visuels
- **Amis sélectionnables** : Normal
- **Amis non sélectionnables** : Grisé avec icône "lock"
- **Message d'information** : "Limite de X participants atteinte"

## 🔧 Tâches Frontend

### 1. Logique de calcul
- [ ] Créer `utils/sessionHelpers.ts` :
  - [ ] `calculateAvailableSlots(session, selectedFriends)`
  - [ ] `isFriendSelectable(session, friend, selectedFriends)`
  - [ ] `getParticipantsCount(session)`

### 2. Interface utilisateur
- [ ] Modifier `app/session/[id].tsx` :
  - [ ] Ajouter le compteur de participants dans la modal
  - [ ] Implémenter la logique de désactivation des amis
  - [ ] Ajouter les indicateurs visuels
  - [ ] Gérer la validation avant envoi
  - [ ] Ajouter les messages d'information

### 3. Composants
- [ ] Créer `components/ParticipantsCounter.tsx` :
  - [ ] Affichage du compteur
  - [ ] Barre de progression
  - [ ] Message d'information
- [ ] Créer `components/FriendSelectionItem.tsx` :
  - [ ] Item d'ami avec état sélectionnable/non sélectionnable
  - [ ] Indicateurs visuels

### 4. Validation
- [ ] Validation côté client avant envoi
- [ ] Messages d'erreur appropriés
- [ ] Gestion des cas limites

## 🔌 Tâches Backend

### 1. Validation API
- [ ] Modifier l'endpoint d'invitation pour valider la limite
- [ ] Retourner une erreur si la limite serait dépassée
- [ ] Calculer le nombre de participants après invitation

### 2. Logique métier
- [ ] Vérifier que `participants_confirmés + participants_en_attente + nouveaux_invités <= maxParticipants`
- [ ] Gérer les sessions sans limite (maxParticipants = null)
- [ ] Retourner le nombre de places restantes

### 3. Réponses API

#### Erreur (400) - Limite dépassée
```json
{
  "success": false,
  "error": {
    "code": "SESSION_FULL",
    "message": "La limite de participants serait dépassée",
    "details": {
      "currentParticipants": 8,
      "maxParticipants": 10,
      "requestedInvitations": 3,
      "availableSlots": 2
    }
  }
}
```

## 📊 Calculs

### Formule de validation
```
participants_confirmés + participants_en_attente + nouveaux_invités <= maxParticipants
```

### Exemple
- **Session** : Tennis, max 10 participants
- **Participants confirmés** : 6
- **Participants en attente** : 2
- **Places disponibles** : 10 - 6 - 2 = 2
- **Amis sélectionnables** : Maximum 2

## 🧪 Tests

### Tests unitaires
- [ ] Test des fonctions de calcul
- [ ] Test de la validation
- [ ] Test des cas limites

### Tests d'intégration
- [ ] Test de l'interface avec différentes limites
- [ ] Test de la validation API
- [ ] Test des messages d'erreur

## 📊 Impact

### Positif
- ✅ Prévention des dépassements de limite
- ✅ Interface claire et informative
- ✅ Meilleure gestion des sessions

### Risques
- ⚠️ Complexité de l'interface
- ⚠️ Gestion des cas limites

## 🔗 Liens

- **US-004** : Annuler une invitation
- **US-006** : Annuler sa présence
- **Frontend** : `app/session/[id].tsx`
- **API Documentation** : `docs/api/sessions.md` 