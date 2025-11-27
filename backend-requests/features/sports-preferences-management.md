# Demande de Nouvelle Fonctionnalité

## 📋 Informations générales

- **Titre :** Gestion des Sports Préférés Utilisateur
- **ID :** FR-20241220-001
- **Date :** 20/12/2024
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 27/12/2024

## 🎯 Description

### Fonctionnalité demandée
Implémentation d'un système de gestion des sports préférés pour chaque utilisateur, permettant de personnaliser l'expérience de création de session et d'améliorer l'UX.

### Contexte
Actuellement, lors de la création d'une session, tous les sports sont affichés de manière égale. Pour améliorer l'expérience utilisateur, nous souhaitons :
1. Permettre aux utilisateurs de définir leurs sports préférés
2. Afficher en priorité ces sports lors de la création de session
3. Mémoriser les sports sélectionnés pour les afficher en premier

### Cas d'usage
- Un utilisateur pratique principalement le tennis et le football
- Lors de la création d'une session, ces sports apparaissent en premier
- L'utilisateur peut facilement accéder à ses sports habituels
- Les autres sports restent accessibles via un bouton "Voir plus"

## 🔧 Spécifications techniques

### Endpoints nécessaires
```
GET /api/users/profile
PUT /api/users/sports-preferences
```

### Structure des données

#### Réponse GET /api/users/profile (modification)
```json
{
  "success": true,
  "data": {
    "id": "string",
    "firstname": "string",
    "lastname": "string",
    "email": "string",
    "avatar": "string|null",
    "sports_preferences": ["tennis", "football", "basketball"],
    "stats": {
      "sessionsCreated": 0,
      "sessionsParticipated": 0,
      "favoriteSport": "tennis"
    }
  }
}
```

#### Requête PUT /api/users/sports-preferences
```json
{
  "sports_preferences": ["tennis", "football", "basketball"]
}
```

#### Réponse PUT /api/users/sports-preferences
```json
{
  "success": true,
  "message": "Sports préférés mis à jour avec succès",
  "data": {
    "sports_preferences": ["tennis", "football", "basketball"]
  }
}
```

### Paramètres de requête
Aucun paramètre spécifique requis.

### Codes de réponse
- `200` - Succès
- `400` - Données invalides (sports non reconnus)
- `401` - Non autorisé
- `422` - Erreur de validation
- `500` - Erreur serveur

### Validation des sports
Les sports valides sont : 
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
- `app/create-session.tsx` - Affichage prioritaire des sports préférés
- `app/(onboarding)/` - Éventuel écran de sélection des sports (optionnel)

### Hooks/Composants à créer
- `hooks/useSportsPreferences.ts` - Gestion des sports préférés
- `services/users/updateSportsPreferences.ts` - Service API
- Modification de `services/users/getUserProfile.ts`

### Tests à implémenter
- Test de récupération des sports préférés
- Test de mise à jour des sports préférés
- Test de validation des sports
- Test d'affichage prioritaire dans create-session

## 🧪 Tests et validation

### Tests à effectuer côté backend
- [ ] Test de validation des sports (sports valides/invalides)
- [ ] Test d'autorisation (utilisateur connecté)
- [ ] Test de mise à jour des préférences
- [ ] Test de récupération des préférences
- [ ] Test de performance avec de nombreux sports

### Tests côté mobile
- [ ] Test de l'endpoint GET /users/profile avec sports_preferences
- [ ] Test de l'endpoint PUT /users/sports-preferences
- [ ] Test de gestion d'erreur (sports invalides)
- [ ] Test d'interface utilisateur (affichage prioritaire)
- [ ] Test de persistance des préférences

## 📊 Estimation

### Backend
- **Temps estimé :** 4-6 heures
- **Complexité :** Moyenne
- **Tâches :**
  - Ajouter le champ `sports_preferences` à la table users
  - Créer la migration de base de données
  - Modifier l'endpoint GET /users/profile
  - Créer l'endpoint PUT /users/sports-preferences
  - Ajouter la validation des sports

### Mobile
- **Temps estimé :** 6-8 heures
- **Complexité :** Moyenne
- **Tâches :**
  - Créer le hook useSportsPreferences
  - Modifier le service getUserProfile
  - Créer le service updateSportsPreferences
  - Modifier l'écran create-session
  - Implémenter la logique d'affichage prioritaire

## 🔗 Liens utiles

- **Types existants :** `types/sport.ts`
- **Sports disponibles :** `utils/sportEmojis.ts`
- **Service API base :** `services/api/baseApi.ts`
- **Endpoints existants :** `services/api/endpoints.ts`

## 📝 Notes additionnelles

### Contraintes
- Les sports doivent correspondre exactement aux types définis dans `types/sport.ts`
- L'ordre des sports préférés doit être préservé
- Maximum 10 sports préférés (recommandé pour une bonne UX)
- 47 sports disponibles au total

### Dépendances
- Aucune dépendance externe
- Utilise l'infrastructure d'authentification existante

### Évolution future
- Possibilité d'ajouter d'autres sports (actuellement 47 sports disponibles)
- Statistiques d'utilisation des sports
- Recommandations basées sur les préférences
- Catégorisation des sports (individuel/collectif, intérieur/extérieur, etc.)

---

**Status :** ⏳ En attente
**Assigné à :** [À définir]
**Date de mise à jour :** 20/12/2024

## 🔄 Mise à jour - 20/12/2024

### Changements apportés
- **Extension de la liste des sports** : Passage de 5 à 47 sports disponibles
- **Sports ajoutés** : Arts martiaux (aïkido, judo, karaté), sports de glisse (skateboard, SUP, bodyboard), sports d'endurance (marche nordique, marche sportive), sports aquatiques (aquafitness, sauvetage sportif), tir à l'arc
- **Validation mise à jour** : Liste complète des 47 sports valides
- **Limite recommandée** : Maximum 10 sports préférés pour une bonne UX

### Impact backend
- Mise à jour de la validation des sports dans l'API
- Adaptation de la base de données si nécessaire
- Tests de validation avec la nouvelle liste complète
