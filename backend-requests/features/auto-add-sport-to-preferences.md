# Demande de Nouvelle Fonctionnalité

## 📋 Informations générales

- **Titre :** Ajout automatique du sport aux préférences lors de la création de session
- **ID :** FR-20241220-003
- **Date :** 20/12/2024
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 27/12/2024

## 🎯 Description

### Fonctionnalité demandée
Ajouter automatiquement le sport sélectionné aux préférences de l'utilisateur lors de la création d'une session, si ce sport n'est pas déjà dans ses préférences.

### Contexte
Actuellement, lorsqu'un utilisateur crée une session avec un sport qui n'est pas dans ses préférences, ce sport n'est pas automatiquement ajouté. Cela crée une incohérence car l'utilisateur a manifesté un intérêt pour ce sport en créant une session, mais il n'apparaît pas dans ses préférences pour les prochaines utilisations.

### Cas d'usage
- Un utilisateur a les préférences : `["tennis", "basketball", "golf", "musculation"]`
- Il crée une session d'aïkido
- Le sport "aïkido" doit être automatiquement ajouté à ses préférences
- Lors des prochaines créations de session, "aïkido" apparaît dans ses sports préférés

## 🔧 Spécifications techniques

### Endpoint concerné
```
POST /api/sessions
```

### Logique à implémenter

#### Avant la création de la session
1. Vérifier si le sport de la session est dans les `sports_preferences` de l'utilisateur
2. Si le sport n'est pas présent, l'ajouter à la liste des préférences
3. Mettre à jour le profil utilisateur avec les nouvelles préférences

#### Structure de la requête de création de session
```json
{
  "sport": "aïkido",
  "date": "2024-12-21",
  "startTime": "14:00",
  "endTime": "16:00",
  "location": "Dojo central",
  "maxParticipants": 8,
  "pricePerPerson": 15
}
```

#### Logique d'ajout automatique
```php
// Pseudo-code
if (!in_array($sessionData['sport'], $user->sports_preferences)) {
    $user->sports_preferences[] = $sessionData['sport'];
    $user->save();
}
```

### Contraintes
- **Limite de préférences** : Pas de limites de nombre de sports préférés
- **Validation** : Le sport doit être dans la liste des sports valides (47 sports)
- **Ordre** : Ajouter le nouveau sport à la fin de la liste
- **Pas de doublons** : Vérifier que le sport n'est pas déjà présent

### Codes de réponse
- `201` - Session créée et préférences mises à jour
- `400` - Données invalides
- `401` - Non autorisé
- `422` - Erreur de validation (sport invalide, limite atteinte)
- `500` - Erreur serveur

## 📱 Impact sur le mobile

### Écrans concernés
- `app/create-session.tsx` - Création de session
- `app/(tabs)/` - Affichage des sports préférés

### Comportement attendu
1. **Création de session** : L'utilisateur sélectionne un sport non préféré
2. **Ajout automatique** : Le sport est ajouté aux préférences côté backend
3. **Synchronisation** : L'app mobile récupère les nouvelles préférences
4. **Affichage** : Le sport apparaît dans les préférences lors des prochaines utilisations

### Hooks/Composants concernés
- `hooks/useSportsPreferences.ts` - Récupération des préférences
- `services/sessions/createSession.ts` - Création de session
- `services/users/getUserProfile.ts` - Profil utilisateur

## 🧪 Tests et validation

### Tests à effectuer côté backend
- [ ] Test d'ajout automatique d'un nouveau sport
- [ ] Test de non-ajout si le sport est déjà présent
- [ ] Test de limite de 10 sports préférés
- [ ] Test de validation du sport (dans la liste des 47 sports)
- [ ] Test de création de session avec sport invalide
- [ ] Test de performance avec de nombreux sports

### Tests côté mobile
- [ ] Test de création de session avec sport non préféré
- [ ] Test de synchronisation des préférences après création
- [ ] Test d'affichage du nouveau sport dans les préférences
- [ ] Test de création de session avec sport déjà préféré

## 📊 Estimation

### Backend
- **Temps estimé :** 2-3 heures
- **Complexité :** Faible
- **Tâches :**
  - Modification de l'endpoint POST /sessions
  - Ajout de la logique d'ajout automatique
  - Tests de validation
  - Gestion des erreurs

### Mobile
- **Temps estimé :** 1-2 heures
- **Complexité :** Faible
- **Tâches :**
  - Tests d'intégration
  - Vérification de la synchronisation
  - Tests d'interface utilisateur

## 🔗 Liens utiles

- **Endpoint sessions :** `services/sessions/createSession.ts`
- **Liste des sports :** `utils/sportsList.ts`
- **Préférences utilisateur :** `hooks/useSportsPreferences.ts`
- **Profil utilisateur :** `services/users/getUserProfile.ts`

## 📝 Notes additionnelles

### Contraintes
- L'ajout doit être transparent pour l'utilisateur
- Pas de notification ou de confirmation nécessaire
- L'ordre des préférences existantes doit être préservé
- Le nouveau sport est ajouté à la fin de la liste

### Dépendances
- Utilise l'infrastructure de création de session existante
- Utilise le système de préférences utilisateur existant
- Dépend de la liste des sports valides (47 sports)

### Évolution future
- Possibilité de configurer le comportement (ajout automatique ou manuel)
- Statistiques d'ajout automatique de sports
- Recommandations basées sur les sports ajoutés automatiquement

---

**Status :** ⏳ En attente
**Assigné à :** [À définir]
**Date de mise à jour :** 20/12/2024
