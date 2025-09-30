# 🔔 FR-20250122-001: Gestion des Tokens Push Multi-Utilisateurs

**Date :** 22 Janvier 2025  
**Priorité :** 🔴 Haute  
**Statut :** 📋 En attente  
**Type :** 🐛 Bug + ✨ Amélioration  

---

## 📋 Description du Problème

### Problème Actuel
Les tokens de notification push ne sont pas enregistrés en base de données pour les utilisateurs de l'App Store, ce qui empêche l'envoi de notifications.

### Cause Identifiée
1. **Timing d'enregistrement** : L'enregistrement du token se fait pendant l'onboarding, avant la connexion de l'utilisateur
2. **Authentification requise** : L'endpoint `/push-tokens` nécessite une authentification, mais l'utilisateur n'est pas encore connecté
3. **Gestion multi-utilisateurs** : Un même appareil peut avoir plusieurs utilisateurs, mais le token Expo est lié à l'appareil, pas à l'utilisateur

---

## 🎯 Objectifs

### Objectif Principal
Permettre l'enregistrement des tokens push pour tous les utilisateurs, y compris ceux qui acceptent les notifications pendant l'onboarding.

### Objectifs Secondaires
1. Gérer correctement les cas multi-utilisateurs sur un même appareil
2. Assurer la cohérence des tokens lors des changements d'utilisateur
3. Maintenir la sécurité de l'API

---

## 🔍 Analyse Technique

### Architecture Actuelle
```
Onboarding → Acceptation Notifications → Enregistrement Token → ❌ ÉCHEC (pas connecté)
     ↓
Connexion → ✅ Connecté mais pas de réinitialisation des notifications
```

### Problème d'Authentification
```typescript
// Endpoint /push-tokens nécessite une authentification
private requiresAuthentication(endpoint: string): boolean {
  const publicEndpoints = ['/login', '/register', '/refresh'];
  // /push-tokens n'est PAS public → nécessite un token d'auth
  return true;
}
```

### Gestion Multi-Utilisateurs
- **Token Expo** : Lié à l'appareil (unique par appareil)
- **Utilisateur** : Peut changer sur le même appareil
- **Problème** : Comment associer le bon utilisateur au token ?

---

## 💡 Solution Proposée

### Approche: Stockage Local + Synchronisation

**Principe :** Le token Expo est stocké localement dans l'app et synchronisé avec la base de données selon l'état de connexion de l'utilisateur.

#### Flux de Données
```
1. Onboarding → Acceptation → Stockage local du token
2. Connexion → Enregistrement en BDD (userId + token)
3. Déconnexion → Suppression de la ligne en BDD
4. Nouvelle connexion → Nouvelle ligne avec même token + nouveau userId
5. Multi-appareils → Chaque appareil a son propre token
```

#### Endpoints Nécessaires
```php
// Enregistrer le token lors de la connexion
POST /api/push-tokens
{
  "token": "ExponentPushToken[...]",
  "platform": "ios"
}

// Supprimer le token lors de la déconnexion
DELETE /api/push-tokens
{
  "token": "ExponentPushToken[...]"
}
```

**Avantages :**
- ✅ Simple et clair
- ✅ Gère naturellement le multi-utilisateur
- ✅ Gère naturellement le multi-appareils
- ✅ Pas de logique complexe de "rattachement"
- ✅ Sécurisé (toujours authentifié)

---

## 🛠️ Spécifications Backend

### Endpoints à Implémenter

#### 1. Enregistrer un Token Push
**Endpoint :** `POST /api/push-tokens`  
**Authentification :** Requise  
**Description :** Enregistre un token push pour l'utilisateur connecté

**Payload :**
```json
{
  "token": "ExponentPushToken[...]",
  "platform": "ios"
}
```

**Réponse Succès :**
```json
{
  "success": true,
  "message": "Token push enregistré avec succès"
}
```

**Réponse Erreur :**
```json
{
  "success": false,
  "message": "Erreur de validation"
}
```

#### 2. Supprimer un Token Push
**Endpoint :** `DELETE /api/push-tokens`  
**Authentification :** Requise  
**Description :** Supprime un token push pour l'utilisateur connecté

**Payload :**
```json
{
  "token": "ExponentPushToken[...]"
}
```

**Réponse Succès :**
```json
{
  "success": true,
  "message": "Token push supprimé avec succès"
}
```

**Réponse Erreur :**
```json
{
  "success": false,
  "message": "Token non trouvé"
}
```

### Logique Métier Requise

#### 1. Gestion des Conflits de Tokens
- Si un token existe déjà avec un autre utilisateur, supprimer l'ancienne association
- Créer la nouvelle association token ↔ utilisateur actuel
- Logger les conflits pour debugging

#### 2. Structure de Base de Données
- Table `push_tokens` avec colonnes : `id`, `user_id`, `token`, `platform`, `created_at`, `updated_at`
- Contrainte d'unicité sur `token`
- Index sur `user_id` et `token` pour les performances
- Cascade delete sur `user_id`

#### 3. Validation
- Valider que le token est un token Expo valide
- Valider que la plateforme est 'ios' ou 'android'
- Vérifier que l'utilisateur est authentifié

---

## 🧪 Tests Backend à Effectuer

### Tests Fonctionnels
1. **Enregistrement** : POST /push-tokens avec token valide → Vérifier l'enregistrement en BDD
2. **Suppression** : DELETE /push-tokens avec token existant → Vérifier la suppression en BDD
3. **Conflit de token** : Enregistrer le même token avec un autre utilisateur → Vérifier la gestion du conflit
4. **Validation** : Envoyer des données invalides → Vérifier les erreurs de validation
5. **Authentification** : Appeler les endpoints sans token → Vérifier l'erreur 401

### Tests de Régression
1. **Notifications existantes** : Vérifier que l'envoi de notifications fonctionne toujours
2. **Performance** : Vérifier l'impact sur les performances des requêtes
3. **Sécurité** : Vérifier qu'aucun token n'est exposé dans les logs

---

## 📊 Métriques de Succès

### Métriques Techniques
- **Taux d'enregistrement** : > 95% des utilisateurs avec token enregistré
- **Taux de réception** : > 90% des notifications reçues
- **Temps de réponse** : < 2s pour l'enregistrement du token

### Métriques Business
- **Engagement** : Augmentation de l'engagement utilisateur
- **Rétention** : Amélioration de la rétention grâce aux notifications
- **Support** : Réduction des tickets liés aux notifications

---

## 🚀 Plan de Déploiement Backend

### Phase 1: Développement (1-2 jours)
1. Créer l'endpoint `DELETE /push-tokens`
2. Modifier l'endpoint existant `POST /push-tokens`
3. Ajouter la migration de base de données
4. Tests unitaires et d'intégration

### Phase 2: Tests (1 jour)
1. Tests fonctionnels complets
2. Tests de régression
3. Tests de performance
4. Validation de sécurité

### Phase 3: Déploiement (1 jour)
1. Déploiement en staging
2. Tests d'intégration avec l'équipe frontend
3. Déploiement en production
4. Monitoring des métriques

---

## 🔍 Points d'Attention Backend

### Sécurité
- **Validation** : Valider strictement les tokens Expo
- **Rate Limiting** : Limiter les tentatives d'enregistrement
- **Logs** : Logger les tentatives d'enregistrement pour audit (sans exposer le token complet)

### Performance
- **Base de données** : Indexer correctement les colonnes token et user_id
- **Cache** : Mettre en cache les tokens actifs si nécessaire
- **Nettoyage** : Nettoyer périodiquement les tokens inactifs

### Monitoring
- **Alertes** : Alerter en cas de taux d'échec élevé
- **Métriques** : Suivre le nombre de tokens par utilisateur
- **Logs** : Logger les conflits de tokens (avec masquage partiel)

---

## 📝 Questions pour l'Équipe Backend

1. **Structure de la table** : Quelle est la structure actuelle de la table `push_tokens` ?
2. **Contraintes** : Y a-t-il des contraintes d'unicité sur les tokens ?
3. **Nettoyage** : Existe-t-il déjà un système de nettoyage des tokens inactifs ?
4. **Monitoring** : Quels outils de monitoring sont disponibles ?
5. **Rollback** : Quel est le plan de rollback en cas de problème ?
6. **Validation** : Comment valider qu'un token Expo est valide avant l'enregistrement ?
7. **Timing** : Quand est-ce que cette fonctionnalité sera disponible ?

---

## 🎯 Prochaines Étapes

1. **Validation** : Valider cette approche avec l'équipe backend
2. **Estimation** : Estimer le temps de développement
3. **Planning** : Planifier le déploiement
4. **Communication** : Informer l'équipe frontend des changements
5. **Tests d'intégration** : Coordonner les tests entre backend et frontend

---

**Assigné à :** Équipe Backend  
**Reviewer :** Équipe Frontend  
**Deadline :** À définir selon la priorité
