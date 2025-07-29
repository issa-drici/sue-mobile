# US-009 : Modifier une session

## 🎲 **Complexité** : 8 (Complexe, 1 semaine)

## 📋 **Description**
En tant qu'organisateur d'une session, je veux pouvoir modifier les détails de ma session (sport, date, heure, lieu, nombre max de participants) afin de corriger des erreurs ou ajuster les informations.

## 🎯 **Objectifs**
- Permettre à l'organisateur de modifier sa session
- Maintenir la cohérence des données
- Informer les participants des modifications

## 👥 **Acteurs**
- **Organisateur** : Peut modifier sa session
- **Participants** : Reçoivent une notification des modifications

## 📱 **Scénarios**

### **Scénario principal : Modification réussie**
1. L'utilisateur accède au détail de sa session
2. Il clique sur "Modifier la session"
3. Il est redirigé vers un formulaire pré-rempli
4. Il modifie les champs souhaités
5. Il valide les modifications
6. La session est mise à jour
7. Les participants reçoivent une notification
8. L'utilisateur est redirigé vers le détail de la session

### **Scénario alternatif : Annulation**
1. L'utilisateur accède au formulaire de modification
2. Il clique sur "Annuler"
3. Il retourne au détail de la session sans modification

### **Scénario d'erreur : Validation**
1. L'utilisateur tente de modifier avec des données invalides
2. Le système affiche les erreurs de validation
3. L'utilisateur corrige les erreurs

## 🔧 **Spécifications techniques**

### **Frontend**
- **Écran de modification** : Formulaire similaire à la création
- **Validation** : Même règles que la création
- **Navigation** : Bouton "Modifier" dans le détail de session
- **États** : Loading, succès, erreur

### **Backend**
- **Endpoint** : `PUT /api/sessions/{id}`
- **Validation** : Vérifier que l'utilisateur est l'organisateur
- **Notifications** : Envoyer aux participants
- **Audit** : Logger les modifications

### **Données modifiables**
- Sport
- Date
- Heure
- Lieu
- Nombre maximum de participants

### **Données non modifiables**
- ID de la session
- Organisateur
- Participants actuels
- Commentaires

## 📊 **Critères d'acceptation**

### **Fonctionnels**
- [ ] Seul l'organisateur peut modifier sa session
- [ ] Tous les champs sont modifiables sauf l'organisateur
- [ ] Les modifications sont validées
- [ ] Les participants sont notifiés des changements
- [ ] L'historique des modifications est conservé

### **Interface**
- [ ] Bouton "Modifier" visible pour l'organisateur
- [ ] Formulaire pré-rempli avec les données actuelles
- [ ] Messages de confirmation/erreur clairs
- [ ] Navigation intuitive

### **Sécurité**
- [ ] Vérification des permissions
- [ ] Validation côté serveur
- [ ] Protection contre les modifications non autorisées

## 🚀 **Priorité**
**Haute** - Fonctionnalité essentielle pour la gestion des sessions

## 📅 **Estimation**
- **Frontend** : 2-3 jours
- **Backend** : 1-2 jours
- **Tests** : 1 jour
- **Total** : 4-6 jours

## 🔗 **Dépendances**
- US-001 (Création de session)
- US-002 (Détail de session)
- Système de notifications

## 📝 **Notes**
- Considérer l'impact sur les participants existants
- Gérer les cas où la nouvelle date/heure pose problème
- Prévoir une confirmation pour les modifications importantes 