# Guide d'utilisation des API

Ce guide explique comment utiliser les hooks et services API dans l'application Sue.

## Architecture

### 1. Hook générique `useApi`
Le hook `useApi` est un hook générique qui gère :
- Les appels HTTP (GET, POST, PUT, DELETE)
- La gestion d'état (loading, error, data)
- L'auto-fetch lors du focus de l'écran
- La gestion des headers d'authentification

### 2. Services API
Les services API (`services/api.ts`) fournissent des méthodes typées pour chaque entité :
- `SessionsApi` - Gestion des sessions sportives
- `UsersApi` - Gestion des utilisateurs et amis
- `NotificationsApi` - Gestion des notifications
- `AuthApi` - Authentification

### 3. Hooks spécifiques
Les hooks spécifiques (`hooks/useSessions.ts`) combinent le hook générique avec la logique métier.

## Utilisation

### Hook générique `useApi`

```typescript
import { useApi } from '../hooks/useApi';

function MyComponent() {
  const { data, loading, error, refetch } = useApi('/api/endpoint', {
    autoFetch: true,
    headers: { Authorization: 'Bearer token' },
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <DataDisplay data={data} />;
}
```

### Services API directs

```typescript
import { SessionsApi } from '../services/api';

async function createSession() {
  try {
    const session = await SessionsApi.create({
      sport: 'tennis',
      date: '2024-04-01',
      location: 'Tennis Club',
    });
  } catch (error) {
  }
}
```

### Hooks spécifiques

```typescript
import { useSessions, useSession } from '../hooks/useSessions';

// Liste des sessions
function SessionsList() {
  const { sessions, loading, error, createSession } = useSessions();
  
  // Utilisation...
}

// Session individuelle
function SessionDetail({ sessionId }: { sessionId: string }) {
  const { session, loading, error, respondToInvitation } = useSession(sessionId);
  
  // Utilisation...
}
```

## Configuration

### 1. URL de base
Modifiez l'URL de base dans `services/api.ts` :
```typescript
const API_BASE_URL = 'https://votre-api.com/api';
```

### 2. Authentification
Configurez le token d'authentification :
```typescript
import { apiService } from '../services/api';

// Lors de la connexion
apiService.setAuthToken('votre-token-jwt');

// Lors de la déconnexion
apiService.clearAuthToken();
```

### 3. Gestion des erreurs
Les erreurs sont automatiquement gérées, mais vous pouvez personnaliser :
```typescript
const { data, error } = useApi('/endpoint', {
  onError: (error) => {
    // Logique personnalisée
    Alert.alert('Erreur', error);
  },
});
```

## Avantages de cette approche

### ✅ **Réutilisabilité**
- Le hook `useApi` peut être utilisé pour n'importe quel endpoint
- Les services API sont organisés par entité

### ✅ **Gestion d'état automatique**
- Loading, error, data gérés automatiquement
- Auto-refresh lors du focus de l'écran

### ✅ **Type Safety**
- TypeScript pour tous les types de données
- IntelliSense dans l'IDE

### ✅ **Gestion d'authentification**
- Headers automatiques avec le token
- Gestion centralisée des tokens

### ✅ **Facilité de test**
- Hooks et services facilement testables
- Mock des API pour les tests

## Migration depuis les mocks

Pour migrer de vos mocks vers de vraies API :

1. **Remplacez les imports** :
```typescript
// Avant
import { mockSessions } from '../mocks/sessions';

// Après
import { useSessions } from '../hooks/useSessions';
```

2. **Utilisez les hooks** :
```typescript
// Avant
const [sessions, setSessions] = useState(mockSessions);

// Après
const { sessions, loading, error } = useSessions();
```

3. **Gérez les états de chargement** :
```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

## Exemples complets

Voir le fichier `services/README.md` pour des exemples complets d'utilisation.

## Bonnes pratiques

1. **Utilisez les hooks spécifiques** plutôt que le hook générique directement
2. **Gérez toujours les états loading et error**
3. **Utilisez les callbacks onSuccess/onError** pour la logique métier
4. **Testez vos API** avec des mocks avant de les utiliser en production
5. **Documentez vos endpoints** dans les services API 