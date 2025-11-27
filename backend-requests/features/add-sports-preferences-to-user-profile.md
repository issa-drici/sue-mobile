# Demande de Nouvelle Fonctionnalité

## 📋 Informations générales

- **Titre :** Ajouter les sports préférés dans l'endpoint GET /users/{id}
- **ID :** FR-20250122-007
- **Date :** 22/01/2025
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 29/01/2025

## 🎯 Description

### Fonctionnalité demandée
Ajouter le champ `sports_preferences` dans la réponse de l'endpoint `GET /api/users/{id}` pour permettre l'affichage des badges de sports dans la modal de profil utilisateur.

### Contexte
Actuellement, l'endpoint `GET /api/users/{id}` ne retourne pas les sports préférés de l'utilisateur. Cependant, la modal de profil utilisateur a besoin de ces informations pour afficher les badges de sports préférés.

### Cas d'usage
- Un utilisateur clique sur le nom d'un autre utilisateur
- La modal de profil s'ouvre
- Les sports préférés de l'utilisateur sont affichés sous forme de badges avec emojis
- Cela permet de mieux connaître les centres d'intérêt sportifs de l'utilisateur

## 🔧 Spécifications techniques

### Endpoint concerné
```
GET /api/users/{id}
```

### Modification de la réponse

#### Réponse actuelle
```json
{
  "success": true,
  "data": {
    "id": "123",
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean.dupont@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "stats": {
      "sessionsCreated": 5,
      "sessionsParticipated": 12
    },
    "isAlreadyFriend": false,
    "hasPendingRequest": false,
    "relationshipStatus": "none"
  }
}
```

#### Réponse demandée
```json
{
  "success": true,
  "data": {
    "id": "123",
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean.dupont@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "sports_preferences": ["tennis", "football", "basketball"],
    "stats": {
      "sessionsCreated": 5,
      "sessionsParticipated": 12
    },
    "isAlreadyFriend": false,
    "hasPendingRequest": false,
    "relationshipStatus": "none"
  }
}
```

### Structure du champ `sports_preferences`
- **Type** : `array` de `string`
- **Contenu** : Liste des sports préférés de l'utilisateur
- **Valeurs possibles** : Voir la liste des sports valides dans `FR-20241220-001`
- **Valeur par défaut** : `[]` (tableau vide) si l'utilisateur n'a pas de préférences

### Sports valides
Les sports valides sont définis dans la demande `FR-20241220-001` :
```json
[
  "aïkido", "aquafitness", "athlétisme", "aviron", "badminton", "baseball", 
  "basketball", "bodyboard", "bowling", "boxe", "course", "cyclisme", 
  "danse", "équitation", "escalade", "football", "golf", "gymnastique", 
  "handball", "hockey", "jiu-jitsu-brésilien", "judo", "karaté", "kayak", 
  "marche-nordique", "marche-sportive", "musculation", "natation", "padel", 
  "pêche", "pétanque", "pilates", "ping-pong", "planche-à-voile", "randonnée", 
  "rugby", "sauvetage-sportif", "ski", "skateboard", "snowboard", "squash", 
  "stand-up-paddle", "surf", "tennis", "tir-à-l-arc", "triathlon", "volleyball", "yoga"
]
```

## 📱 Impact sur le mobile

### Écrans concernés
- `components/UserProfileModal.tsx` - Affichage des badges de sports préférés

### Modifications déjà effectuées
- ✅ Ajout de l'import `getSportEmoji` et `Sport`
- ✅ Ajout de la section "Sports préférés" dans la modal
- ✅ Stylisation des badges avec emojis
- ✅ Mise à jour du service `getUserById` pour inclure `sports_preferences`

### Tests à implémenter
- Test de récupération des sports préférés via l'endpoint
- Test d'affichage des badges dans la modal
- Test avec utilisateur sans sports préférés
- Test avec utilisateur avec plusieurs sports préférés

## 🧪 Tests et validation

### Tests à effectuer côté backend
- [ ] Test de récupération des sports préférés pour un utilisateur existant
- [ ] Test avec utilisateur sans sports préférés (retourne tableau vide)
- [ ] Test avec utilisateur avec plusieurs sports préférés
- [ ] Test de performance avec de nombreux sports
- [ ] Test de validation des sports (sports valides/invalides)

### Tests côté mobile
- [ ] Test d'affichage des badges dans la modal de profil
- [ ] Test avec utilisateur sans sports préférés (section masquée)
- [ ] Test avec utilisateur avec sports préférés (section visible)
- [ ] Test de l'affichage des emojis correspondants
- [ ] Test de la mise en page avec plusieurs badges

## 📝 Notes

### Compatibilité
- Cette modification est rétrocompatible
- Les clients existants qui n'utilisent pas ce champ ne seront pas affectés
- Le champ `sports_preferences` est optionnel dans la réponse

### Performance
- Les sports préférés peuvent être mis en cache côté serveur
- Pas d'impact significatif sur les performances de l'endpoint

### Sécurité
- Les sports préférés sont des informations publiques
- Aucune restriction d'accès nécessaire
- Pas d'informations sensibles exposées

## 🔗 Liens connexes
- [FR-20241220-001: Gestion des Sports Préférés Utilisateur](./sports-preferences-management.md)
- [FR-20250122-004: Endpoint pour récupérer le profil d'un utilisateur par ID](./FR-20250122-004-get-user-profile-by-id.md)

