# Corrections des problèmes d'authentification

## Problèmes identifiés

### 1. Erreur 422 - validation.required
**Problème :** L'API Laravel attend un champ `device_name` dans les requêtes de connexion et d'inscription, mais l'application ne l'envoyait pas.

**Solution :** Ajout du champ `device_name` dans les fonctions `signIn` et `signUp` du contexte d'authentification.

### 2. Erreur 401 - Unauthenticated
**Problème :** Les requêtes API échouaient car l'utilisateur n'était pas authentifié.

**Solution :** 
- Configuration du callback de déconnexion automatique dans le service de base API
- Gestion automatique des erreurs 401/403 avec déconnexion forcée

### 3. Warning - Export par défaut manquant
**Problème :** Le fichier `app/context/auth.tsx` n'avait pas d'export par défaut.

**Solution :** Ajout de `export default AuthProvider;`

### 4. Paramètre manquant dans l'inscription
**Problème :** La fonction `signUp` dans la page d'inscription n'envoyait pas le paramètre `password_confirmation`.

**Solution :** Correction de l'appel de fonction pour inclure `confirmPassword`.

## Fichiers modifiés

### 1. `app/context/auth.tsx`
- ✅ Ajout du champ `device_name` dans les requêtes de connexion et d'inscription
- ✅ Configuration du callback de déconnexion automatique
- ✅ Ajout de l'export par défaut

### 2. `app/(auth)/register.tsx`
- ✅ Correction de l'appel à `signUp` pour inclure `password_confirmation`

### 3. `config/env.ts`
- ✅ Activation temporaire des mocks pour le développement

## Scripts utiles

### Test d'authentification
```bash
node scripts/test-auth.js
```

### Nettoyage du stockage
```bash
node scripts/clear-auth-storage.js
```

## Configuration des mocks

Les mocks sont actuellement activés pour éviter les erreurs d'API pendant le développement. Pour utiliser l'API réelle :

1. Modifiez `config/env.ts`
2. Changez `USE_MOCKS: true` en `USE_MOCKS: false`
3. Redémarrez l'application

## Test de l'authentification

Avec les mocks activés, vous pouvez tester l'authentification avec :
- **Email :** `test@example.com`
- **Mot de passe :** `password123`

Ou créer un nouveau compte avec n'importe quelles données valides.

## Structure des données attendues par l'API

### Connexion
```json
{
  "email": "user@example.com",
  "password": "password123",
  "device_name": "Alarrache Mobile App"
}
```

### Inscription
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "device_name": "Alarrache Mobile App"
}
```

## Gestion des erreurs

Le système gère automatiquement :
- ✅ Erreurs 401/403 avec déconnexion automatique
- ✅ Erreurs de validation avec messages d'erreur
- ✅ Erreurs réseau avec gestion gracieuse
- ✅ Nettoyage du stockage en cas d'erreur

## Prochaines étapes

1. Tester l'authentification avec les mocks
2. Désactiver les mocks pour tester avec l'API réelle
3. Vérifier que les notifications push fonctionnent correctement
4. Tester la persistance de l'authentification 