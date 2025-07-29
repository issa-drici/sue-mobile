# Bugs à Corriger

## 🎲 **Complexité (Suite de Fibonacci)**
- **1** : Très simple, modification mineure
- **2** : Simple, quelques heures de travail
- **3** : Facile, 1-2 jours
- **5** : Moyen, 2-3 jours
- **8** : Complexe, 1 semaine
- **13** : Très complexe, 2-3 semaines

## 📋 **Liste des bugs**

| ID | Titre | Complexité | Statut | Assigné | Créé le |
|----|-------|------------|--------|---------|---------|
| BUG-001 | Erreur 409 lors du renvoi de demande d'ami après annulation | 3 | 🔄 En attente | - | 2024-12-20 |
| BUG-002 | Noms non affichés dans la liste des demandes d'ami | 2 | ✅ Corrigé | - | 2024-12-20 |
| BUG-003 | Endpoint de suppression d'ami manquant | 5 | 🔄 En attente | - | 2024-12-20 |

## 📝 **Détails des bugs**

### BUG-001 : Erreur 409 lors du renvoi de demande d'ami après annulation
**Complexité** : 3 (Facile, 1-2 jours)
- **Statut** : En attente de correction backend
- **Description** : Après avoir annulé une demande d'ami, impossible de renvoyer une nouvelle demande (erreur 409)
- **Impact** : Fonctionnalité d'ajout d'ami partiellement cassée
- **Solution** : Modifier la logique backend pour exclure les demandes annulées de la vérification d'existence

### BUG-002 : Noms non affichés dans la liste des demandes d'ami
**Complexité** : 2 (Simple, quelques heures)
- **Statut** : ✅ **CORRIGÉ**
- **Description** : Les prénoms et noms des expéditeurs de demandes d'ami ne s'affichaient pas
- **Solution** : Adaptation du code pour gérer la structure de réponse de l'API

### BUG-003 : Endpoint de suppression d'ami manquant
**Complexité** : 5 (Moyen, 2-3 jours)
- **Statut** : En attente de développement backend
- **Description** : L'endpoint `DELETE /api/users/friends/{friendId}` n'existe pas (erreur 404)
- **Impact** : Fonctionnalité de suppression d'ami non fonctionnelle
- **Solution** : Créer l'endpoint backend selon la spécification dans `docs/api/feature-request-remove-friend.md` 