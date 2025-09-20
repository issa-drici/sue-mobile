# Guide de Persistance de l'Authentification

## Vue d'ensemble

L'application Alarrache est conçue pour maintenir l'utilisateur connecté indéfiniment jusqu'à ce qu'il se déconnecte manuellement ou supprime l'application. **Aucune déconnexion automatique n'est jamais déclenchée**.

## Principe de fonctionnement

### 1. Stockage persistant
- **AsyncStorage** est utilisé pour sauvegarder les données d'authentification
- Les données sont stockées localement sur l'appareil
- Elles persistent même après fermeture complète de l'application

### 2. Données sauvegardées
```typescript
// Données stockées dans AsyncStorage
{
  user: User,           // Informations de l'utilisateur
  authToken: string,    // Token d'authentification principal
  refreshToken: string  // Token de rafraîchissement (optionnel)
}
```

### 3. Cycle de vie de l'authentification

#### Au démarrage de l'application
1. L'application charge les données depuis AsyncStorage
2. Si un utilisateur et un token sont trouvés, l'utilisateur est automatiquement connecté
3. **Aucune vérification de validité du token n'est effectuée** pour éviter la déconnexion

#### Pendant l'utilisation
1. Les requêtes API utilisent le token stocké
2. En cas d'erreur 401/403, l'utilisateur reste connecté
3. Le système tente de rafraîchir le token en arrière-plan (sans déconnexion)

#### En cas d'erreur
- **Erreurs réseau** : L'utilisateur reste connecté
- **Tokens expirés** : L'utilisateur reste connecté
- **Erreurs API** : L'utilisateur reste connecté
- **Seule la déconnexion manuelle** peut déconnecter l'utilisateur

## Implémentation technique

### Contexte d'authentification (`app/context/auth.tsx`)

```typescript
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // État de l'utilisateur
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chargement automatique au démarrage
  useEffect(() => {
    const loadUser = async () => {
      // Charge l'utilisateur depuis AsyncStorage
      // Ne déconnecte JAMAIS automatiquement
    };
    loadUser();
  }, []);

  // Vérification de token sans déconnexion
  const checkTokenValidity = async (): Promise<boolean> => {
    // Vérifie le token mais ne déconnecte jamais
    // Retourne toujours true pour maintenir la connexion
  };
};
```

### Service API de base (`services/api/baseApi.ts`)

```typescript
class BaseApiService {
  // Gestion des erreurs d'authentification
  private handleAuthError(status: number, errorMessage: string) {
    if (status === 401 || status === 403) {
      // NE PAS déclencher la déconnexion automatique
      // L'utilisateur reste connecté même en cas d'erreur
      console.log('⚠️ Erreur d\'authentification détectée, mais l\'utilisateur reste connecté');
    }
  }
}
```

## Scénarios de persistance

### ✅ Scénarios où l'utilisateur reste connecté

1. **Fermeture complète de l'application**
   - L'utilisateur se reconnecte automatiquement au redémarrage

2. **Redémarrage de l'appareil**
   - L'utilisateur se reconnecte automatiquement au redémarrage

3. **Perte de connexion internet**
   - L'utilisateur reste connecté localement

4. **Token expiré**
   - L'utilisateur reste connecté malgré l'expiration

5. **Erreurs API**
   - L'utilisateur reste connecté malgré les erreurs

6. **Erreurs réseau**
   - L'utilisateur reste connecté malgré les erreurs

### ❌ Scénarios où l'utilisateur se déconnecte

1. **Déconnexion manuelle** (`signOut()`)
2. **Suppression de l'application**
3. **Nettoyage manuel du stockage**

## Gestion des tokens

### Token principal
- Stocké dans `AsyncStorage` sous la clé `authToken`
- Utilisé pour toutes les requêtes API authentifiées
- **Jamais supprimé automatiquement**

### Refresh token (optionnel)
- Stocké dans `AsyncStorage` sous la clé `refreshToken`
- Utilisé pour rafraîchir le token principal
- **Jamais supprimé automatiquement**

### Rafraîchissement automatique
```typescript
const refreshAuth = async (): Promise<boolean> => {
  // Tente de rafraîchir le token
  // En cas d'échec, l'utilisateur reste connecté
  // Aucune déconnexion n'est déclenchée
};
```

## Tests et débogage

### Composant de debug
Le composant `DebugConfig` permet de :
- Voir l'état actuel de l'authentification
- Tester la validité du token
- Rafraîchir le token manuellement
- Nettoyer le stockage
- Se déconnecter manuellement

### Script de test
Le script `scripts/test-persistence.js` simule :
- La connexion utilisateur
- Le redémarrage de l'application
- La vérification de persistance
- Les erreurs réseau et API

## Configuration

### Variables d'environnement
```typescript
export const ENV = {
  USE_MOCKS: false,        // Désactive les mocks en production
  API_BASE_URL: '...',     // URL de l'API
  // ... autres configurations
};
```

### Mocks (développement uniquement)
- Les mocks simulent le comportement de l'API
- Ils respectent la même logique de persistance
- Ils ne sont jamais activés en production

## Bonnes pratiques

### Pour les développeurs
1. **Ne jamais appeler `forceSignOut()`** sauf pour la déconnexion manuelle
2. **Toujours vérifier `isAuthenticated`** avant d'accéder aux routes protégées
3. **Utiliser le hook `useAuth()`** pour accéder à l'état d'authentification

### Pour les utilisateurs
1. **L'application se souvient de la connexion** même après fermeture
2. **Aucune reconnexion n'est nécessaire** sauf déconnexion manuelle
3. **Les données sont sauvegardées localement** sur l'appareil

## Dépannage

### Problèmes courants

#### L'utilisateur se déconnecte automatiquement
- Vérifier que `forceSignOut()` n'est pas appelé automatiquement
- Vérifier que `checkTokenValidity()` ne déclenche pas de déconnexion
- Vérifier que `handleAuthError()` ne déclenche pas de déconnexion

#### L'utilisateur ne se reconnecte pas au redémarrage
- Vérifier que les données sont bien sauvegardées dans AsyncStorage
- Vérifier que `loadUser()` est bien appelé au démarrage
- Vérifier que les clés de stockage sont correctes

#### Erreurs de token
- Vérifier que le token est bien stocké
- Vérifier que le refresh token est disponible
- Vérifier que l'API de refresh fonctionne

## Conclusion

La persistance de l'authentification dans Alarrache est conçue pour offrir une expérience utilisateur fluide et sans interruption. L'utilisateur reste connecté dans tous les scénarios jusqu'à ce qu'il décide de se déconnecter manuellement.

**Principe fondamental : L'utilisateur ne se déconnecte JAMAIS automatiquement.**

