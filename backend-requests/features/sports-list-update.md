# Demande de Mise à Jour - Liste des Sports

## 📋 Informations générales

- **Titre :** Mise à jour de la liste des sports disponibles
- **ID :** FR-20241220-002
- **Date :** 20/12/2024
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 27/12/2024

## 🎯 Description

### Fonctionnalité demandée
Mise à jour de la liste des sports disponibles dans l'application pour passer de 5 à 47 sports, permettant une meilleure couverture des activités sportives et une expérience utilisateur enrichie.

### Contexte
L'application mobile utilise actuellement une liste limitée de 5 sports (tennis, golf, musculation, football, basketball). Pour offrir une expérience plus complète et couvrir un large éventail d'activités sportives, nous souhaitons étendre cette liste à 47 sports.

### Cas d'usage
- Création de sessions pour des sports non couverts actuellement
- Amélioration de la recherche et de la découverte d'activités
- Meilleure personnalisation des préférences utilisateur
- Couverture des sports populaires en France

## 🔧 Spécifications techniques

### Liste complète des sports (47 sports)

```json
[
  "aïkido",
  "aquafitness", 
  "athlétisme",
  "aviron",
  "badminton",
  "baseball",
  "basketball",
  "bodyboard",
  "bowling",
  "boxe",
  "course",
  "cyclisme",
  "danse",
  "équitation",
  "escalade",
  "football",
  "golf",
  "gymnastique",
  "handball",
  "hockey",
  "jiu-jitsu-brésilien",
  "judo",
  "karaté",
  "kayak",
  "marche-nordique",
  "marche-sportive",
  "musculation",
  "natation",
  "padel",
  "pêche",
  "pétanque",
  "pilates",
  "ping-pong",
  "planche-à-voile",
  "randonnée",
  "rugby",
  "sauvetage-sportif",
  "ski",
  "skateboard",
  "snowboard",
  "squash",
  "stand-up-paddle",
  "surf",
  "tennis",
  "tir-à-l-arc",
  "triathlon",
  "volleyball",
  "yoga"
]
```

### Catégories de sports

**Sports de raquette (8) :**
- Tennis, Padel, Badminton, Squash, Ping-pong, Volleyball, Basketball, Handball

**Sports aquatiques (8) :**
- Natation, Surf, Planche à voile, Kayak, Aviron, Aquafitness, Sauvetage sportif, Bodyboard

**Sports d'endurance (6) :**
- Course, Cyclisme, Randonnée, Marche nordique, Marche sportive, Triathlon

**Arts martiaux (4) :**
- Boxe, Jiu-jitsu brésilien, Aïkido, Judo, Karaté

**Sports de glisse (4) :**
- Ski, Snowboard, Skateboard, Stand up paddle

**Sports collectifs (6) :**
- Football, Rugby, Hockey, Baseball, Volleyball, Handball

**Sports de bien-être (3) :**
- Yoga, Pilates, Danse

**Sports de précision (3) :**
- Golf, Tir à l'arc, Pétanque

**Autres (7) :**
- Musculation, Escalade, Équitation, Gymnastique, Athlétisme, Bowling, Pêche

## 📱 Impact sur le mobile

### Écrans concernés
- `app/create-session.tsx` - Sélection de sport lors de la création
- `app/(onboarding)/` - Éventuel écran de sélection des préférences
- `app/profile/` - Gestion des sports préférés
- `app/history.tsx` - Filtrage par sport
- `app/(tabs)/` - Affichage des sessions par sport

### Composants à créer/modifier
- `components/SportSelector.tsx` - Composant réutilisable de sélection
- `components/SportBadge.tsx` - Badge pour afficher un sport
- `components/SportFilter.tsx` - Filtre par sport
- `utils/sportHelpers.ts` - Fonctions utilitaires pour les sports

### Tests à implémenter
- Test de validation des 47 sports
- Test de recherche et filtrage
- Test de l'interface de sélection
- Test de performance avec la liste étendue

## 🧪 Tests et validation

### Tests à effectuer côté backend
- [ ] Validation de tous les 47 sports
- [ ] Test de performance avec la liste étendue
- [ ] Test de compatibilité avec l'existant
- [ ] Test de migration des données existantes

### Tests côté mobile
- [ ] Test de l'interface de sélection
- [ ] Test de recherche dans la liste
- [ ] Test de performance de l'affichage
- [ ] Test de compatibilité avec les sessions existantes

## 📊 Estimation

### Backend
- **Temps estimé :** 2-3 heures
- **Complexité :** Faible
- **Tâches :**
  - Mise à jour de la validation des sports
  - Tests de validation
  - Documentation API

### Mobile
- **Temps estimé :** 4-6 heures
- **Complexité :** Moyenne
- **Tâches :**
  - Mise à jour des types TypeScript
  - Création des composants réutilisables
  - Tests d'interface
  - Optimisation des performances

## 🔗 Liens utiles

- **Types existants :** `types/sport.ts`
- **Liste des sports :** `utils/sportsList.ts`
- **Emojis des sports :** `utils/sportEmojis.ts`
- **Écran de création :** `app/create-session.tsx`

## 📝 Notes additionnelles

### Contraintes
- Les noms des sports doivent être exactement identiques entre frontend et backend
- L'ordre alphabétique doit être respecté
- Les caractères spéciaux (accents, tirets) doivent être gérés correctement

### Dépendances
- Aucune dépendance externe
- Compatible avec l'infrastructure existante

### Évolution future
- Possibilité d'ajouter de nouveaux sports facilement
- Catégorisation des sports (individuel/collectif, intérieur/extérieur)
- Statistiques d'utilisation par sport
- Recommandations basées sur la popularité

---

**Status :** ⏳ En attente
**Assigné à :** [À définir]
**Date de mise à jour :** 20/12/2024

