# US-003 - Commentaire automatique lors de l'acceptation d'invitation

## 📋 Informations générales

- **ID** : US-003
- **Titre** : Commentaire automatique lors de l'acceptation d'invitation
- **Priorité** : 🟡 Moyenne
- **Statut** : 🔄 À faire
- **Créé le** : 2024-01-XX
- **Assigné** : -

## 🎯 Contexte

En tant qu'organisateur de session, je veux être informé automatiquement quand un participant accepte mon invitation, afin de suivre l'évolution de ma session et savoir combien de participants confirment leur présence.

**Problème actuel** : Quand un utilisateur accepte une invitation, aucun commentaire n'est ajouté à la session pour tracer cette action.

## ✅ Critères d'acceptation

### Fonctionnels
- [ ] Quand un utilisateur accepte une invitation, un commentaire automatique est ajouté à la session
- [ ] Le commentaire contient : "[Nom Prénom] a accepté l'invitation à la session"
- [ ] Le commentaire est identifiable comme système (userId: "system")
- [ ] Le commentaire apparaît dans la liste des commentaires de la session
- [ ] Le commentaire est horodaté avec la date/heure d'acceptation

### Non-fonctionnels
- [ ] Le commentaire est ajouté de manière transparente (pas d'impact sur les performances)
- [ ] Le commentaire est cohérent avec le format des autres commentaires
- [ ] Pas de duplication de commentaires pour la même action

## 🎨 Interface utilisateur

### Affichage du commentaire
- **Localisation** : Section commentaires dans `app/session/[id].tsx`
- **Style** : Commentaire avec fond légèrement différent pour indiquer qu'il s'agit d'un commentaire système
- **Icône** : Icône système (engrenage ou info) pour distinguer des commentaires utilisateur

### Format du commentaire
```
[Système] Marie Martin a accepté l'invitation à la session
Il y a 5 minutes
```

## 🔧 Tâches Frontend

### 1. Affichage des commentaires système
- [ ] Modifier `app/session/[id].tsx` :
  - [ ] Identifier les commentaires système (userId: "system")
  - [ ] Appliquer un style différent pour les commentaires système
  - [ ] Ajouter une icône système pour les distinguer

### 2. Styles CSS
- [ ] Ajouter style `systemComment` dans les styles
- [ ] Ajouter style `systemCommentText` pour le texte
- [ ] Ajouter style `systemCommentIcon` pour l'icône

### 3. Composants UI
- [ ] Créer composant `SystemComment` (optionnel)
- [ ] Modifier le rendu des commentaires pour gérer les commentaires système

## 🔌 Tâches Backend

### 1. Modification de l'endpoint existant
- **Endpoint** : `PATCH /sessions/{sessionId}/respond` (déjà existant)
- **Modification** : Ajouter la logique de création de commentaire automatique

### 2. Logique métier
- [ ] Quand `response: "accept"`, ajouter automatiquement un commentaire
- [ ] Créer l'entrée dans la table `session_comments`
- [ ] Utiliser `userId: "system"` pour identifier le commentaire système
- [ ] Contenu : "[Nom Prénom] a accepté l'invitation à la session"

### 3. Validation
- [ ] Vérifier que l'utilisateur a bien le statut "pending" avant acceptation
- [ ] Éviter les doublons de commentaires système
- [ ] Gérer les cas d'erreur lors de la création du commentaire

### 4. Réponse API modifiée

#### Succès (200) - Acceptation avec commentaire
```json
{
  "success": true,
  "data": {
    "id": "session-id",
    "sport": "tennis",
    "participants": [
      {
        "id": "1",
        "firstName": "Jean",
        "lastName": "Dupont",
        "status": "accepted"
      },
      {
        "id": "2",
        "firstName": "Marie",
        "lastName": "Martin",
        "status": "accepted"
      }
    ],
    "comments": [
      {
        "id": "comment-id",
        "userId": "system",
        "firstName": "Système",
        "lastName": "",
        "content": "Marie Martin a accepté l'invitation à la session",
        "createdAt": "2024-01-XXT10:00:00Z"
      }
    ]
  },
  "message": "Invitation acceptée"
}
```

## 🧪 Tests

### Tests Frontend
- [ ] Test de l'affichage des commentaires système
- [ ] Test du style différent pour les commentaires système
- [ ] Test de l'icône système
- [ ] Test de l'horodatage des commentaires système

### Tests Backend
- [ ] Test de création de commentaire lors de l'acceptation
- [ ] Test de non-duplication des commentaires système
- [ ] Test de gestion d'erreur lors de la création du commentaire
- [ ] Test de format du contenu du commentaire

### Tests d'intégration
- [ ] Test complet du workflow d'acceptation avec commentaire
- [ ] Test de l'affichage du commentaire dans l'interface
- [ ] Test de la cohérence des données

## 📱 Maquettes

### Section commentaires
```
┌─────────────────────────────────────┐
│ Commentaires                        │
├─────────────────────────────────────┤
│ [⚙️] Marie Martin a accepté         │
│     l'invitation à la session       │
│     Il y a 5 minutes                │
├─────────────────────────────────────┤
│ Jean Dupont                         │
│ Super session !                     │
│ Il y a 2 heures                     │
└─────────────────────────────────────┘
```

## 🔄 Workflow utilisateur

1. **Action** : L'utilisateur clique sur "Accepter l'invitation"
2. **Traitement** : L'API met à jour le statut et ajoute un commentaire automatique
3. **Affichage** : Le commentaire système apparaît dans la liste des commentaires
4. **Visibilité** : L'organisateur peut voir qui a accepté son invitation

## 📊 Métriques

- **Temps d'ajout du commentaire** : < 500ms
- **Taux de succès** : > 99%
- **Taux d'erreur** : < 1%

## 🔗 Dépendances

- Utilise l'endpoint `PATCH /sessions/{sessionId}/respond` existant
- Compatible avec le système de commentaires existant
- Aucune dépendance externe

## 📝 Notes techniques

- Le commentaire système doit être clairement identifiable
- Utiliser un userId spécial ("system") pour éviter les conflits
- Le commentaire doit être ajouté dans la même transaction que l'acceptation
- Gérer les cas où la création du commentaire échoue
- Maintenir la cohérence des données

## 🔄 Impact sur l'existant

### Modifications nécessaires
- [ ] Modifier la logique de `respondToInvitation` dans le backend
- [ ] Adapter l'affichage des commentaires dans le frontend
- [ ] Ajouter les styles pour les commentaires système

### Compatibilité
- ✅ Compatible avec les commentaires existants
- ✅ Pas d'impact sur les autres fonctionnalités
- ✅ Rétrocompatible avec les sessions existantes 