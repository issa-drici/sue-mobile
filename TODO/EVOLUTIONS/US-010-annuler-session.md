# US-010 : Annuler une session

## 🎲 **Complexité** : 8 (Complexe, 1 semaine)

## 📋 **Description**
En tant qu'organisateur d'une session, je veux pouvoir annuler ma session afin de gérer les imprévus ou les changements de plan.

## 🎯 **Objectifs**
- Permettre à l'organisateur d'annuler sa session
- Informer automatiquement tous les participants
- Libérer les créneaux pour d'autres sessions
- Maintenir un historique des sessions annulées

## 👥 **Acteurs**
- **Organisateur** : Peut annuler sa session
- **Participants** : Reçoivent une notification d'annulation
- **Système** : Gère l'état de la session

## 📱 **Scénarios**

### **Scénario principal : Annulation réussie**
1. L'utilisateur accède au détail de sa session
2. Il clique sur "Annuler la session"
3. Une confirmation s'affiche avec les détails
4. Il confirme l'annulation
5. La session passe en statut "annulée"
6. Tous les participants reçoivent une notification
7. L'utilisateur est redirigé vers la liste des sessions
8. La session n'apparaît plus dans les sessions actives

### **Scénario alternatif : Annulation de l'action**
1. L'utilisateur clique sur "Annuler la session"
2. Il clique sur "Non" dans la confirmation
3. Il reste sur le détail de la session

### **Scénario d'erreur : Session déjà commencée**
1. L'utilisateur tente d'annuler une session en cours
2. Le système affiche un message d'erreur
3. L'annulation est refusée

## 🔧 **Spécifications techniques**

### **Frontend**
- **Bouton d'annulation** : Visible pour l'organisateur uniquement
- **Modal de confirmation** : Afficher les détails de la session
- **États de session** : Ajouter "annulée" aux statuts possibles
- **Navigation** : Redirection après annulation

### **Backend**
- **Endpoint** : `DELETE /api/sessions/{id}` ou `PATCH /api/sessions/{id}/cancel`
- **Validation** : Vérifier que l'utilisateur est l'organisateur
- **Notifications** : Envoyer à tous les participants
- **Statut** : Marquer la session comme "annulée"

### **Données à gérer**
- **Statut de session** : "active", "annulée", "terminée"
- **Date d'annulation** : Timestamp de l'annulation
- **Raison d'annulation** : Optionnel
- **Participants** : Tous marqués comme "annulé"

## 📊 **Critères d'acceptation**

### **Fonctionnels**
- [ ] Seul l'organisateur peut annuler sa session
- [ ] Confirmation obligatoire avant annulation
- [ ] Tous les participants sont notifiés
- [ ] La session n'apparaît plus dans les sessions actives
- [ ] L'historique est conservé

### **Interface**
- [ ] Bouton "Annuler" visible pour l'organisateur
- [ ] Modal de confirmation claire
- [ ] Messages de succès/erreur appropriés
- [ ] Redirection automatique après annulation

### **Sécurité**
- [ ] Vérification des permissions
- [ ] Protection contre les annulations non autorisées
- [ ] Validation côté serveur

### **Données**
- [ ] Statut mis à jour en "annulée"
- [ ] Date d'annulation enregistrée
- [ ] Participants notifiés
- [ ] Session retirée des listes actives

## 🚀 **Priorité**
**Haute** - Fonctionnalité essentielle pour la gestion des sessions

## 📅 **Estimation**
- **Frontend** : 1-2 jours
- **Backend** : 1 jour
- **Tests** : 1 jour
- **Total** : 3-4 jours

## 🔗 **Dépendances**
- US-001 (Création de session)
- US-002 (Détail de session)
- US-009 (Modifier une session)
- Système de notifications

## 📝 **Notes**
- Considérer les sessions avec des participants payants
- Gérer les sessions récurrentes
- Prévoir une option de "report" vs "annulation"
- Maintenir l'historique pour les statistiques

## 🚨 **Cas particuliers**
- **Session en cours** : Empêcher l'annulation
- **Session passée** : Empêcher l'annulation
- **Participants payants** : Gérer les remboursements
- **Sessions récurrentes** : Annuler une occurrence ou la série 