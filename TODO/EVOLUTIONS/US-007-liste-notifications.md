# US-007 - Liste des notifications complète

## 📋 Informations générales

- **ID** : US-007
- **Titre** : Liste des notifications complète
- **Priorité** : 🟡 Moyenne
- **Statut** : 🔄 À faire
- **Créé le** : 2024-12-20
- **Assigné** : -

## 🎯 Contexte

En tant qu'utilisateur, je veux avoir une vue complète de toutes mes notifications avec des actions pour les gérer efficacement.

**Problème actuel** : L'écran de notifications est basique et manque de fonctionnalités avancées.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] Liste paginée des notifications
- [ ] Filtrage par type de notification
- [ ] Tri par date (plus récentes en premier)
- [ ] Statut lu/non lu avec indicateur visuel
- [ ] Actions sur chaque notification :
  - [ ] Marquer comme lue/non lue
  - [ ] Supprimer
  - [ ] Navigation vers la session concernée
- [ ] Actions globales :
  - [ ] Marquer toutes comme lues
  - [ ] Supprimer toutes les notifications lues
  - [ ] Supprimer toutes les notifications
- [ ] Pull-to-refresh
- [ ] Recherche dans les notifications
- [ ] Badge de comptage sur l'onglet
- [ ] Notifications groupées par date

### Non-fonctionnels
- [ ] Temps de chargement < 3 secondes
- [ ] Pagination optimisée (20 notifications par page)
- [ ] Gestion hors ligne
- [ ] Performance avec beaucoup de notifications

## 🎨 Interface utilisateur

### Écran de notifications
- **Localisation** : `app/(tabs)/notifications.tsx`
- **Éléments** :
  - [ ] Header avec compteur et actions globales
  - [ ] Filtres par type (Tous, Invitations, Commentaires, etc.)
  - [ ] Barre de recherche
  - [ ] Liste des notifications groupées par date
  - [ ] Pull-to-refresh
  - [ ] Pagination infinie

### Notification item
- **Éléments** :
  - [ ] Icône selon le type
  - [ ] Titre et message
  - [ ] Date relative
  - [ ] Indicateur lu/non lu
  - [ ] Actions (marquer lu, supprimer)
  - [ ] Navigation vers la session

## 🔧 Tâches Frontend

### 1. Interface utilisateur
- [ ] Modifier `app/(tabs)/notifications.tsx` :
  - [ ] Implémenter la liste paginée
  - [ ] Ajouter les filtres par type
  - [ ] Ajouter la barre de recherche
  - [ ] Implémenter le groupement par date
  - [ ] Ajouter les actions sur chaque notification
  - [ ] Ajouter les actions globales
  - [ ] Implémenter le pull-to-refresh
  - [ ] Gérer la pagination infinie

### 2. Composants
- [ ] Créer `components/NotificationItem.tsx` :
  - [ ] Affichage de la notification
  - [ ] Actions individuelles
  - [ ] Navigation vers la session
- [ ] Créer `components/NotificationFilters.tsx` :
  - [ ] Filtres par type
  - [ ] Barre de recherche
- [ ] Créer `components/NotificationActions.tsx` :
  - [ ] Actions globales
  - [ ] Compteur de notifications

### 3. Hooks personnalisés
- [ ] Créer `hooks/useNotificationFilters.ts` :
  - [ ] Gestion des filtres
  - [ ] Gestion de la recherche
- [ ] Créer `hooks/useNotificationPagination.ts` :
  - [ ] Gestion de la pagination
  - [ ] Chargement infini

### 4. Badge de comptage
- [ ] Modifier `app/(tabs)/_layout.tsx` :
  - [ ] Badge avec compteur de notifications non lues
  - [ ] Mise à jour en temps réel

## 🔌 Tâches Backend

### 1. Endpoints API
- [ ] `GET /notifications?page=1&limit=20&type=invitation&search=tennis` - Liste paginée avec filtres
- [ ] `PATCH /notifications/{id}/toggle-read` - Basculer lu/non lu
- [ ] `DELETE /notifications/read` - Supprimer toutes les lues
- [ ] `DELETE /notifications/all` - Supprimer toutes
- [ ] `GET /notifications/stats` - Statistiques (total, non lues, par type)

### 2. Logique métier
- [ ] Pagination optimisée
- [ ] Filtrage par type et recherche
- [ ] Tri par date de création
- [ ] Gestion des actions en masse
- [ ] Statistiques en temps réel

### 3. Performance
- [ ] Indexation des colonnes de recherche
- [ ] Cache des notifications récentes
- [ ] Optimisation des requêtes

## 📊 Types de notifications

### Invitations
- **Icône** : `mail-outline`
- **Couleur** : `#007AFF`
- **Actions** : Accepter, Refuser, Voir session

### Commentaires
- **Icône** : `chatbubble-outline`
- **Couleur** : `#34C759`
- **Actions** : Voir commentaire, Voir session

### Modifications de session
- **Icône** : `information-circle-outline`
- **Couleur** : `#FF9500`
- **Actions** : Voir session

### Rappels
- **Icône** : `alarm-outline`
- **Couleur** : `#FF3B30`
- **Actions** : Voir session

### Amis
- **Icône** : `person-add-outline`
- **Couleur** : `#5856D6`
- **Actions** : Accepter, Refuser

## 🧪 Tests

### Tests unitaires
- [ ] Test des composants de notification
- [ ] Test des hooks de filtrage et pagination
- [ ] Test des actions sur les notifications

### Tests d'intégration
- [ ] Test de la liste avec beaucoup de notifications
- [ ] Test des filtres et de la recherche
- [ ] Test de la pagination

## 📊 Impact

### Positif
- ✅ Meilleure organisation des notifications
- ✅ Actions rapides et efficaces
- ✅ Expérience utilisateur améliorée

### Risques
- ⚠️ Complexité de l'interface
- ⚠️ Performance avec beaucoup de notifications

## 🔗 Liens

- **US-005** : Système de notifications
- **US-004** : Annuler une invitation
- **US-006** : Annuler sa présence
- **Frontend** : `app/(tabs)/notifications.tsx`
- **API Documentation** : `docs/api/notifications.md` 