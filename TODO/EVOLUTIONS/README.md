# 🚀 Évolutions et nouvelles fonctionnalités

Liste des User Stories et nouvelles fonctionnalités à implémenter.

## 📋 Liste des évolutions

| ID | Titre | Priorité | Complexité | Statut | Assigné | Créé le |
|----|-------|----------|------------|--------|---------|---------|
| US-001 | Suppression d'invitation de session | 🔴 Haute | 3 | 🔄 À faire | - | 2024-01-XX |
| US-002 | Suppression de participation à une session | 🔴 Haute | 5 | 🔄 À faire | - | 2024-01-XX |
| US-003 | Commentaire automatique lors de l'acceptation d'invitation | 🟡 Moyenne | 2 | 🔄 À faire | - | 2024-01-XX |
| US-004 | Annuler une invitation à une session | 🔴 Haute | 3 | 🔄 À faire | - | 2024-12-20 |
| US-005 | Système de notifications complet | 🔴 Haute | 13 | 🔄 À faire | - | 2024-12-20 |
| US-006 | Annuler sa présence à une session | 🔴 Haute | 5 | 🔄 À faire | - | 2024-12-20 |
| US-007 | Liste des notifications complète | 🟡 Moyenne | 8 | 🔄 À faire | - | 2024-12-20 |
| US-008 | Limite de participants lors de l'invitation | 🟡 Moyenne | 5 | 🔄 À faire | - | 2024-12-20 |
| US-009 | Modifier une session | 🔴 Haute | 8 | 🔄 À faire | - | 2024-12-20 |
| US-010 | Annuler une session | 🔴 Haute | 8 | 🔄 À faire | - | 2024-12-20 |
| US-011 | Modal de profil utilisateur | 🟡 Moyenne | 8 | 🔄 À faire | - | 2024-12-20 |

## 🎯 Priorités

- **🔴 Haute** : Fonctionnalité critique pour l'expérience utilisateur
- **🟡 Moyenne** : Amélioration significative de l'expérience
- **🟢 Basse** : Fonctionnalité d'amélioration

## 🎲 Complexité (Suite de Fibonacci)

- **1** : Très simple, modification mineure
- **2** : Simple, quelques heures de travail
- **3** : Facile, 1-2 jours
- **5** : Moyen, 2-3 jours
- **8** : Complexe, 1 semaine
- **13** : Très complexe, 2-3 semaines
- **21** : Extrêmement complexe, 1 mois+

## 📝 Détails des évolutions

### US-001 - Suppression d'invitation de session
**Complexité** : 3 (Facile, 1-2 jours)
**Description** : Permettre à l'organisateur de supprimer une invitation envoyée avant qu'elle soit acceptée.

**Contexte** : L'organisateur peut se tromper dans le choix des participants ou vouloir annuler une invitation.

**Critères d'acceptation** :
- ✅ L'organisateur peut voir un bouton "Supprimer" à côté de chaque invitation en attente
- ✅ La suppression retire l'invitation de la liste des participants
- ✅ L'utilisateur invité ne reçoit plus de notification de cette session
- ✅ Impossible de supprimer une invitation déjà acceptée

---

### US-002 - Suppression de participation à une session
**Complexité** : 5 (Moyen, 2-3 jours)
**Description** : Permettre à un participant de se désinscrire d'une session à laquelle il a accepté de participer.

**Contexte** : Un participant peut avoir un empêchement et vouloir libérer sa place.

**Critères d'acceptation** :
- ✅ Le participant peut voir un bouton "Se désinscrire" sur les sessions où il a le statut "accepted"
- ✅ La désinscription retire le participant de la liste des participants
- ✅ Un commentaire automatique est ajouté : "[Nom Prénom] s'est désinscrit de la session"
- ✅ Confirmation demandée avant désinscription

---

### US-003 - Commentaire automatique lors de l'acceptation d'invitation
**Complexité** : 2 (Simple, quelques heures)
**Description** : Ajouter automatiquement un commentaire quand un utilisateur accepte une invitation.

**Contexte** : L'organisateur veut être informé automatiquement des acceptations.

**Critères d'acceptation** :
- ✅ Quand un utilisateur accepte une invitation, un commentaire automatique est ajouté
- ✅ Le commentaire contient : "[Nom Prénom] a accepté l'invitation à la session"
- ✅ Le commentaire est identifiable comme système (userId: "system")

---

### US-004 - Annuler une invitation à une session
**Complexité** : 3 (Facile, 1-2 jours)
**Description** : Permettre à l'utilisateur qui a envoyé une invitation de l'annuler avant qu'elle soit acceptée.

**Contexte** : L'utilisateur peut se tromper dans le choix des participants ou vouloir corriger une erreur.

**Critères d'acceptation** :
- ✅ L'utilisateur peut voir un bouton "Annuler" à côté de chaque invitation en attente
- ✅ L'annulation retire l'invitation de la liste des participants
- ✅ L'utilisateur invité reçoit une notification d'annulation
- ✅ Impossible d'annuler une invitation déjà acceptée
- ✅ Confirmation demandée avant annulation

---

### US-005 - Système de notifications complet
**Complexité** : 13 (Très complexe, 2-3 semaines)
**Description** : Implémenter un système de notifications push et in-app complet.

**Contexte** : Améliorer l'engagement et la réactivité des utilisateurs.

**Critères d'acceptation** :
- ✅ Notifications push en temps réel
- ✅ Notifications in-app avec badge de comptage
- ✅ Types de notifications : invitations, commentaires, modifications, rappels
- ✅ Marquer comme lue/non lue
- ✅ Navigation vers la session concernée
- ✅ Historique des notifications

---

### US-006 - Annuler sa présence à une session
**Complexité** : 5 (Moyen, 2-3 jours)
**Description** : Permettre à un participant de se désinscrire d'une session à laquelle il a accepté de participer.

**Contexte** : Un participant peut avoir un empêchement et vouloir libérer sa place.

**Critères d'acceptation** :
- ✅ Le participant peut voir un bouton "Se désinscrire" sur la page de détail de session
- ✅ La désinscription retire le participant de la liste des participants
- ✅ L'organisateur reçoit une notification de désinscription
- ✅ Impossible de se désinscrire si la session a déjà commencé
- ✅ Confirmation demandée avant désinscription

---

### US-007 - Liste des notifications complète
**Complexité** : 8 (Complexe, 1 semaine)
**Description** : Améliorer l'écran de notifications avec des fonctionnalités avancées.

**Contexte** : Offrir une meilleure gestion des notifications aux utilisateurs.

**Critères d'acceptation** :
- ✅ Liste paginée des notifications
- ✅ Filtrage par type de notification
- ✅ Tri par date (plus récentes en premier)
- ✅ Actions sur chaque notification (marquer lu, supprimer)
- ✅ Actions globales (marquer toutes comme lues)
- ✅ Recherche dans les notifications
- ✅ Badge de comptage sur l'onglet

---

### US-008 - Limite de participants lors de l'invitation
**Complexité** : 5 (Moyen, 2-3 jours)
**Description** : Bloquer la sélection de participants si la limite de la session serait dépassée.

**Contexte** : Éviter de dépasser la capacité des sessions et informer les utilisateurs.

**Critères d'acceptation** :
- ✅ Affichage du nombre de participants actuels et de la limite
- ✅ Calcul en temps réel : participants confirmés + en attente + sélectionnés
- ✅ Désactivation des amis si la limite serait dépassée
- ✅ Message d'information sur la limite
- ✅ Indicateur visuel pour les amis non sélectionnables
- ✅ Validation avant envoi des invitations

---

### US-009 - Modifier une session
**Complexité** : 8 (Complexe, 1 semaine)
**Description** : Permettre à l'organisateur de modifier les détails de sa session (sport, date, heure, lieu, nombre max de participants).

**Contexte** : L'organisateur peut avoir besoin de corriger des erreurs ou ajuster les informations de sa session.

**Critères d'acceptation** :
- ✅ Seul l'organisateur peut modifier sa session
- ✅ Tous les champs sont modifiables sauf l'organisateur
- ✅ Les modifications sont validées
- ✅ Les participants sont notifiés des changements
- ✅ L'historique des modifications est conservé
- ✅ Bouton "Modifier" visible pour l'organisateur
- ✅ Formulaire pré-rempli avec les données actuelles
- ✅ Messages de confirmation/erreur clairs

---

### US-010 - Annuler une session
**Complexité** : 8 (Complexe, 1 semaine)
**Description** : Permettre à l'organisateur d'annuler sa session pour gérer les imprévus ou les changements de plan.

**Contexte** : L'organisateur peut avoir besoin d'annuler sa session pour diverses raisons (météo, empêchement, etc.).

**Critères d'acceptation** :
- ✅ Seul l'organisateur peut annuler sa session
- ✅ Confirmation obligatoire avant annulation
- ✅ Tous les participants sont notifiés
- ✅ La session n'apparaît plus dans les sessions actives
- ✅ L'historique est conservé
- ✅ Bouton "Annuler" visible pour l'organisateur
- ✅ Modal de confirmation claire
- ✅ Messages de succès/erreur appropriés
- ✅ Redirection automatique après annulation
- ✅ Impossible d'annuler une session en cours ou passée

---

### US-011 - Modal de profil utilisateur
**Complexité** : 8 (Complexe, 1 semaine)
**Description** : Permettre de cliquer sur n'importe quel nom d'utilisateur pour ouvrir une modal avec son profil détaillé.

**Contexte** : Améliorer l'expérience sociale en permettant de mieux connaître les autres utilisateurs.

**Critères d'acceptation** :
- ✅ Clic sur n'importe quel nom d'utilisateur ouvre la modal
- ✅ Affichage des informations du profil (photo, nom, statistiques, sport favori)
- ✅ Modal se ferme correctement
- ✅ Gestion des erreurs (utilisateur non trouvé)
- ✅ Actions contextuelles (ajouter en ami, voir les sessions)
- ✅ Design cohérent avec l'application
- ✅ Animation d'ouverture/fermeture fluide
- ✅ Chargement rapide avec mise en cache 