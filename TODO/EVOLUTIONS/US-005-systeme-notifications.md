# US-005 - Système de notifications complet

## 📋 Informations générales

- **ID** : US-005
- **Titre** : Système de notifications complet
- **Priorité** : 🔴 Haute
- **Statut** : 🔄 À faire
- **Créé le** : 2024-12-20
- **Assigné** : -

## 🎯 Contexte

En tant qu'utilisateur, je veux recevoir des notifications en temps réel pour être informé des événements importants liés aux sessions, invitations et interactions sociales.

**Problème actuel** : Les utilisateurs ne sont pas notifiés des événements importants, ce qui limite l'engagement et la réactivité.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] Notifications push en temps réel
- [ ] Notifications in-app avec badge de comptage
- [ ] Types de notifications supportés :
  - [ ] Invitation à une session
  - [ ] Annulation d'invitation
  - [ ] Acceptation/refus d'invitation
  - [ ] Nouveau commentaire sur une session
  - [ ] Modification d'une session
  - [ ] Rappel de session (24h avant)
  - [ ] Demande d'ami
  - [ ] Acceptation de demande d'ami
- [ ] Marquer comme lue/non lue
- [ ] Marquer toutes comme lues
- [ ] Suppression de notification
- [ ] Navigation vers la session/écran concerné
- [ ] Historique des notifications

### Non-fonctionnels
- [ ] Délai de notification < 5 secondes
- [ ] Support iOS et Android
- [ ] Gestion hors ligne
- [ ] Performance optimisée
- [ ] Respect de la vie privée

## 🎨 Interface utilisateur

### Écran de notifications
- **Localisation** : `app/(tabs)/notifications.tsx`
- **Éléments** :
  - [ ] Liste des notifications avec statut lu/non lu
  - [ ] Badge de comptage sur l'onglet
  - [ ] Bouton "Marquer toutes comme lues"
  - [ ] Pull-to-refresh
  - [ ] Navigation vers la session concernée

### Notifications push
- **Contenu** : Titre, message, données de session
- **Actions** : Accepter/Refuser (pour invitations)
- **Navigation** : Ouverture directe de l'app

## 🔧 Tâches Frontend

### 1. Configuration push
- [ ] Installer `expo-notifications`
- [ ] Configurer les permissions
- [ ] Gérer les tokens de notification
- [ ] Configurer les handlers de notification

### 2. Service API
- [ ] Créer `services/api/notificationsApi.ts` :
  - [ ] `getNotifications()`
  - [ ] `markAsRead(notificationId)`
  - [ ] `markAllAsRead()`
  - [ ] `deleteNotification(notificationId)`
  - [ ] `getUnreadCount()`
- [ ] Créer `services/notifications/` :
  - [ ] `getNotifications.ts`
  - [ ] `markAsRead.ts`
  - [ ] `markAllAsRead.ts`
  - [ ] `deleteNotification.ts`
  - [ ] `getUnreadCount.ts`

### 3. Interface utilisateur
- [ ] Modifier `app/(tabs)/notifications.tsx` :
  - [ ] Implémenter la liste des notifications
  - [ ] Ajouter les actions (marquer comme lu, supprimer)
  - [ ] Gérer la navigation vers les sessions
  - [ ] Ajouter le pull-to-refresh
  - [ ] Gérer les états de chargement

### 4. Badge de comptage
- [ ] Modifier `app/(tabs)/_layout.tsx` :
  - [ ] Ajouter le badge sur l'onglet notifications
  - [ ] Mettre à jour le compteur en temps réel

### 5. Gestion des notifications push
- [ ] Créer `hooks/useNotifications.ts` :
  - [ ] Gestion des permissions
  - [ ] Enregistrement du token
  - [ ] Gestion des notifications reçues
  - [ ] Navigation automatique

## 🔌 Tâches Backend

### 1. Endpoints API
- [ ] `GET /notifications` - Liste des notifications
- [ ] `PATCH /notifications/{id}/read` - Marquer comme lue
- [ ] `PATCH /notifications/read-all` - Marquer toutes comme lues
- [ ] `DELETE /notifications/{id}` - Supprimer notification
- [ ] `GET /notifications/unread-count` - Compteur non lues

### 2. Service de notifications push
- [ ] Intégrer Firebase Cloud Messaging
- [ ] Gérer les tokens utilisateur
- [ ] Créer les templates de notification
- [ ] Gérer l'envoi en masse

### 3. Logique métier
- [ ] Créer des événements automatiques :
  - [ ] Invitation envoyée
  - [ ] Invitation acceptée/refusée
  - [ ] Nouveau commentaire
  - [ ] Modification de session
  - [ ] Rappel de session
- [ ] Gérer la suppression automatique (30 jours)
- [ ] Optimiser les requêtes

## 📱 Configuration mobile

### iOS
- [ ] Configurer APNs
- [ ] Gérer les permissions
- [ ] Tester sur appareil réel

### Android
- [ ] Configurer FCM
- [ ] Gérer les permissions
- [ ] Tester sur appareil réel

## 🧪 Tests

### Tests unitaires
- [ ] Test des hooks de notifications
- [ ] Test des services API
- [ ] Test de la logique de navigation

### Tests d'intégration
- [ ] Test des notifications push
- [ ] Test de la synchronisation
- [ ] Test des performances

## 📊 Impact

### Positif
- ✅ Augmentation de l'engagement utilisateur
- ✅ Meilleure réactivité aux événements
- ✅ Expérience utilisateur améliorée

### Risques
- ⚠️ Complexité de configuration push
- ⚠️ Gestion des permissions
- ⚠️ Performance avec beaucoup de notifications

## 🔗 Liens

- **US-004** : Annuler une invitation
- **US-006** : Annuler sa présence
- **Frontend** : `app/(tabs)/notifications.tsx`
- **API Documentation** : `docs/api/notifications.md`
- **Backend Request** : `FR-20241220-001-push-notifications.md` 