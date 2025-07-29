# Guide de migration - Contexte d'authentification

Ce guide explique les améliorations apportées au contexte d'authentification et comment migrer depuis l'ancienne version.

## Améliorations apportées

### 🔐 **Sécurité renforcée**
- **SecureStore** au lieu d'AsyncStorage pour le stockage des tokens
- Gestion automatique des tokens d'authentification pour les API
- Nettoyage automatique lors de la déconnexion

### 🚀 **Intégration API**
- Utilisation des services API centralisés (`AuthApi`)
- Configuration automatique des headers d'authentification
- Gestion des erreurs API standardisée

### 📱 **UX améliorée**
- Gestion des états de chargement
- Gestion des erreurs avec possibilité de les effacer
- Auto-rechargement de l'utilisateur au démarrage

### 🔧 **Maintenabilité**
- Code plus modulaire et réutilisable
- Types TypeScript complets
- Callbacks optimisés avec `useCallback`

## Migration depuis l'ancienne version

### 1. Installation des dépendances

```bash
npx expo install expo-secure-store
```

### 2. Mise à jour des imports

```typescript
// Avant
import { useAuth } from '../context/auth';

// Après (pas de changement, mais nouvelles fonctionnalités)
import { useAuth } from '../context/auth';
```

### 3. Utilisation des nouvelles fonctionnalités

#### Gestion des erreurs
```typescript
// Avant
const { user, signIn } = useAuth();

// Après
const { user, signIn, error, clearError, isLoading } = useAuth();

// Affichage des erreurs
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity onPress={clearError}>
      <Text>Fermer</Text>
    </TouchableOpacity>
  </View>
)}
```

#### États de chargement
```typescript
// Avant
const [isLoading, setIsLoading] = useState(false);

// Après
const { isLoading } = useAuth();

// Utilisation dans les boutons
<TouchableOpacity disabled={isLoading}>
  {isLoading ? <ActivityIndicator /> : <Text>Se connecter</Text>}
</TouchableOpacity>
```

### 4. Configuration de l'API

#### URL de base
Modifiez l'URL dans `services/api.ts` :
```typescript
const API_BASE_URL = 'https://votre-api.com/api';
```

#### Structure de réponse
Adaptez la structure de réponse selon votre API dans `app/context/auth.tsx` :
```typescript
// Exemple d'adaptation
const userResponse: User = {
  id: response.user?.id || response.id,
  firstName: response.user?.firstName || response.firstName,
  lastName: response.user?.lastName || response.lastName,
  email: response.user?.email || response.email,
  token: response.token || response.access_token,
  avatar: response.user?.avatar || response.avatar,
};
```

## Nouveautés disponibles

### 1. Gestion automatique des tokens
```typescript
// Le token est automatiquement configuré lors de la connexion
// Plus besoin de configurer manuellement les headers
```

### 2. Stockage sécurisé
```typescript
// Les données utilisateur sont stockées de manière sécurisée
// Automatiquement géré par le contexte
```

### 3. Déconnexion propre
```typescript
// Appel automatique à l'API de déconnexion
// Nettoyage complet des données locales
// Suppression du token des headers API
```

### 4. Gestion des erreurs centralisée
```typescript
// Erreurs automatiquement extraites des réponses API
// Possibilité de les effacer manuellement
// Affichage cohérent dans toute l'app
```

## Exemples d'utilisation

### Écran de connexion
```typescript
export function LoginScreen() {
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      // Navigation automatique après connexion
    } catch (error) {
      // L'erreur est déjà gérée dans le contexte
    }
  };

  return (
    <View>
      {error && (
        <ErrorDisplay error={error} onClose={clearError} />
      )}
      
      <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator /> : <Text>Se connecter</Text>}
      </TouchableOpacity>
    </View>
  );
}
```

### Composant protégé
```typescript
export function ProtectedComponent() {
  const { user, signOut, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;

  return (
    <View>
      <Text>Bienvenue {user.firstName} !</Text>
      <TouchableOpacity onPress={signOut}>
        <Text>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Avantages de la nouvelle version

### ✅ **Sécurité**
- Stockage sécurisé des tokens
- Gestion automatique de l'authentification API

### ✅ **Performance**
- Callbacks optimisés
- État centralisé avec `useMemo`

### ✅ **Maintenabilité**
- Code modulaire
- Types TypeScript complets
- Gestion d'erreurs standardisée

### ✅ **UX**
- États de chargement automatiques
- Gestion des erreurs intuitive
- Persistance de session

## Tests

Pour tester la nouvelle implémentation :

1. **Test de connexion** : Vérifiez que le token est bien configuré
2. **Test de persistance** : Redémarrez l'app, l'utilisateur doit rester connecté
3. **Test de déconnexion** : Vérifiez que toutes les données sont nettoyées
4. **Test d'erreurs** : Testez avec des identifiants incorrects

## Support

Si vous rencontrez des problèmes lors de la migration :

1. Vérifiez que `expo-secure-store` est installé
2. Adaptez la structure de réponse API selon votre backend
3. Testez avec des mocks avant de passer en production
4. Consultez la documentation dans `services/README.md` 