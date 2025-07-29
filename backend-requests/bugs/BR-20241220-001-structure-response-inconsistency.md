# Signalement de Bug - API

## 📋 Informations générales

- **Titre :** Incohérence dans la structure de réponse des endpoints
- **ID :** BR-20241220-001
- **Date :** 20/12/2024
- **Signaleur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Environnement :** Développement

## 🐛 Description du bug

### Problème observé
Certains endpoints retournent des structures de réponse différentes de la documentation API. Par exemple :
- `/notifications` retourne `{ success: true, data: [], pagination: {...} }` ✅
- `/users/profile` retourne directement `{ id: "profile", full_name: "...", ... }` ❌

### Comportement attendu
Tous les endpoints doivent suivre la structure standard documentée :
```json
{
  "success": true,
  "data": { ... },
  "message": "string (optionnel)"
}
```

### Comportement actuel
Incohérence entre les endpoints :
- Notifications : Structure correcte avec `success` et `data`
- Profil utilisateur : Structure directe sans wrapper
- Sessions : Structure variable selon l'endpoint

## 🔍 Reproduction

### Étapes pour reproduire
1. Se connecter avec un utilisateur valide
2. Appeler `GET /api/notifications` → Structure correcte
3. Appeler `GET /api/users/profile` → Structure incorrecte
4. Appeler `GET /api/sessions` → Structure variable

### Données de test
```json
{
  "email": "test@example.com",
  "password": "password123",
  "device_name": "test-device"
}
```

### Fréquence
- [x] Toujours
- [ ] Parfois
- [ ] Rarement
- [ ] Seulement dans certaines conditions

## 🔧 Informations techniques

### Endpoints concernés
```
GET /api/users/profile
GET /api/sessions
GET /api/users/friends
```

### Payload envoyé
```json
{
  "Authorization": "Bearer [token]"
}
```

### Réponse reçue (profil)
```json
{
  "id": "profile",
  "full_name": "John Doe",
  "email": "john@example.com",
  "profile": {
    "total_xp": 1000,
    "total_training_time": 3600,
    "completed_videos": 10
  }
}
```

### Réponse attendue (profil)
```json
{
  "success": true,
  "data": {
    "id": "1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "avatar": null,
    "stats": {
      "sessionsCreated": 12,
      "sessionsParticipated": 45,
      "favoriteSport": "Football"
    }
  }
}
```

### Headers utilisés
```
Authorization: Bearer [token]
Content-Type: application/json
```

## 📱 Impact sur le mobile

### Écrans affectés
- Écran de profil utilisateur
- Écran des sessions
- Écran des amis
- Tous les écrans utilisant ces endpoints

### Fonctionnalités bloquées
- Affichage correct du profil utilisateur
- Gestion cohérente des erreurs
- Parsing uniforme des réponses API

### Workaround temporaire
Implémentation de gestion de structures variables dans les services API avec fallback.

## 🧪 Tests effectués

### Tests de reproduction
- [x] Test avec différents utilisateurs
- [x] Test avec différentes données
- [x] Test sur différents appareils
- [x] Test avec différents tokens

### Logs et erreurs
```
TypeError: Cannot read properties of undefined (reading 'firstName')
```

### Screenshots/Vidéos
Erreur JavaScript dans la console de développement.

## 🔗 Contexte

### Version de l'API
Laravel API v1.0

### Version du mobile
React Native Expo v1.0

### Navigateur/OS
iOS Simulator / Android Emulator

## 📊 Priorité et impact

### Impact utilisateur
- [ ] Bloque complètement l'utilisation
- [x] Ralentit l'utilisation
- [x] Fonctionnalité partielle
- [ ] Cosmétique seulement

### Impact business
- Développement mobile ralenti
- Tests plus complexes
- Maintenance difficile

### Deadline souhaitée
**15/01/2025** - Avant la prochaine release mobile

## 🔗 Liens utiles

- **Issue GitHub :** [À créer]
- **Documentation :** `docs/api/users.md`
- **Test script :** `scripts/debug-profile-response.js`

## 📝 Notes additionnelles

Ce problème affecte la cohérence globale de l'API et rend le développement mobile plus complexe. Une standardisation est nécessaire pour maintenir la qualité du code et faciliter les tests.

---

**Status :** ⏳ En attente
**Assigné à :** [À assigner]
**Date de résolution :** [À définir]
**Version de correction :** [À définir] 