# Structure des Services - Version Découpée

## Organisation

Les hooks sont maintenant organisés dans le dossier `services/` avec une structure par domaine et **un fichier par fonction/endpoint** :

```
services/
├── api.ts                    # Service API principal
├── index.ts                  # Export principal
├── sessions/
│   ├── index.ts             # Export des hooks de sessions
│   ├── getSessions.ts       # Récupérer toutes les sessions
│   ├── createSession.ts     # Créer une session
│   ├── updateSession.ts     # Mettre à jour une session
│   ├── deleteSession.ts     # Supprimer une session
│   └── getSessionById.ts    # Récupérer une session par ID
├── users/
│   ├── index.ts             # Export des hooks d'utilisateurs
│   ├── getUsers.ts          # Récupérer tous les utilisateurs
│   ├── searchUsers.ts       # Rechercher des utilisateurs
│   └── updateUser.ts        # Mettre à jour un utilisateur
├── friends/
│   ├── index.ts             # Export des hooks d'amis
│   ├── getFriends.ts        # Récupérer les amis
│   ├── sendFriendRequest.ts # Envoyer une demande d'ami
│   ├── getFriendRequests.ts # Récupérer les demandes d'amis
│   └── respondToFriendRequest.ts # Répondre à une demande d'ami
└── notifications/
    ├── index.ts             # Export des hooks de notifications
    ├── getNotifications.ts  # Récupérer les notifications
    ├── markNotificationAsRead.ts # Marquer une notification comme lue
    └── markAllNotificationsAsRead.ts # Marquer toutes comme lues
```

## Avantages de cette structure

1. **Découpage maximal** : Un fichier par fonction/endpoint
2. **Dépendances limitées** : Chaque hook est indépendant
3. **Structure uniforme** : Tous les hooks retournent `{ data, isLoading, error }`
4. **Import précis** : Importez seulement ce dont vous avez besoin
5. **Maintenabilité** : Facile de modifier une fonction sans impacter les autres

## Configuration des Mocks

La gestion des mocks reste simplifiée avec une seule variable d'environnement :

```typescript
// config/env.ts
export const ENV = {
  // Utiliser les mocks (true) ou les vraies API (false)
  USE_MOCKS: process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
  
  // URL de l'API
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.alarrache.com/api',
};
```

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Utiliser les mocks (true) ou les vraies API (false)
EXPO_PUBLIC_USE_MOCKS=true

# URL de l'API (optionnel)
# EXPO_PUBLIC_API_BASE_URL=https://api.alarrache.com/api
```

## Utilisation des Hooks

### Import spécifique

```typescript
// Importez seulement ce dont vous avez besoin
import { 
  useGetSessions,
  useCreateSession,
  useGetFriends,
  useSendFriendRequest,
  useGetNotifications,
  useMarkNotificationAsRead
} from '../services';
```

### Structure uniforme des hooks

Tous les hooks suivent la même structure :

```typescript
// Hooks de lecture (avec auto-fetch)
{
  data: T[],           // Les données
  isLoading: boolean,  // État de chargement
  error: string | null, // Erreur éventuelle
  refetch: () => void  // Fonction pour recharger
}

// Hooks d'action (sans auto-fetch)
{
  data: T | null,      // Résultat de l'action
  isLoading: boolean,  // État de chargement
  error: string | null, // Erreur éventuelle
  action: (params) => Promise<T> // Fonction d'action
}
```

### Exemples d'utilisation

#### Sessions

```typescript
function SessionsComponent() {
  // Récupérer les sessions
  const { data: sessions, isLoading, error, refetch } = useGetSessions();
  
  // Créer une session
  const { createSession, isLoading: isCreating } = useCreateSession();
  
  // Mettre à jour une session
  const { updateSession, isLoading: isUpdating } = useUpdateSession();
  
  // Supprimer une session
  const { deleteSession, isLoading: isDeleting } = useDeleteSession();
  
  // Récupérer une session spécifique
  const { data: session, isLoading: isLoadingSession } = useGetSessionById('123');

  const handleCreate = async () => {
    try {
      await createSession({
        sport: 'tennis',
        date: '2024-01-15',
        location: 'Tennis Club',
      });
      refetch(); // Recharger la liste
    } catch (error) {
    }
  };

  if (isLoading) return <Text>Chargement...</Text>;
  if (error) return <Text>Erreur: {error}</Text>;

  return (
    <View>
      {sessions.map(session => (
        <Text key={session.id}>{session.sport}</Text>
      ))}
      <Button 
        title={isCreating ? 'Création...' : 'Créer'} 
        onPress={handleCreate}
        disabled={isCreating}
      />
    </View>
  );
}
```

#### Amis

```typescript
function FriendsComponent() {
  // Récupérer les amis
  const { data: friends, isLoading, error } = useGetFriends();
  
  // Envoyer une demande d'ami
  const { sendFriendRequest, isLoading: isSending } = useSendFriendRequest();
  
  // Récupérer les demandes d'amis
  const { data: requests, refetch } = useGetFriendRequests();
  
  // Répondre à une demande
  const { respondToFriendRequest, isLoading: isResponding } = useRespondToFriendRequest();

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      Alert.alert('Succès', 'Demande envoyée !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande');
    }
  };

  const handleRespond = async (requestId: string, response: 'accept' | 'decline') => {
    try {
      await respondToFriendRequest(requestId, response);
      refetch(); // Recharger les demandes
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de répondre');
    }
  };

  return (
    <View>
      <Text>Mes amis ({friends.length})</Text>
      {friends.map(friend => (
        <Text key={friend.id}>{friend.firstName} {friend.lastName}</Text>
      ))}
      
      <Text>Demandes ({requests.length})</Text>
      {requests.map(request => (
        <View key={request.id}>
          <Text>{request.firstName} {request.lastName}</Text>
          <Button title="Accepter" onPress={() => handleRespond(request.id, 'accept')} />
          <Button title="Refuser" onPress={() => handleRespond(request.id, 'decline')} />
        </View>
      ))}
    </View>
  );
}
```

#### Notifications

```typescript
function NotificationsComponent() {
  // Récupérer les notifications
  const { data: notifications, isLoading, error, refetch } = useGetNotifications();
  
  // Marquer une notification comme lue
  const { markAsRead, isLoading: isMarking } = useMarkNotificationAsRead();
  
  // Marquer toutes comme lues
  const { markAllAsRead, isLoading: isMarkingAll } = useMarkAllNotificationsAsRead();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      refetch(); // Recharger la liste
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer comme lue');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refetch(); // Recharger la liste
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer toutes comme lues');
    }
  };

  return (
    <View>
      <Text>Notifications ({notifications.length})</Text>
      {notifications.map(notification => (
        <View key={notification.id}>
          <Text style={{ opacity: notification.read ? 0.5 : 1 }}>
            {notification.message}
          </Text>
          {!notification.read && (
            <Button 
              title="Marquer comme lue" 
              onPress={() => handleMarkAsRead(notification.id)}
              disabled={isMarking}
            />
          )}
        </View>
      ))}
      <Button 
        title="Tout marquer comme lu" 
        onPress={handleMarkAllAsRead}
        disabled={isMarkingAll}
      />
    </View>
  );
}
```

## Migration depuis l'ancienne structure

Si vous utilisiez les anciens hooks, remplacez :

```typescript
// Ancien
import { useSessions } from '../hooks/useSessions';

// Nouveau
import { useGetSessions, useCreateSession } from '../services';
```

## Ajout d'un nouveau service

1. Créez un nouveau dossier dans `services/`
2. Créez un fichier par fonction/endpoint
3. Créez un `index.ts` pour exporter les hooks
4. Ajoutez l'export dans `services/index.ts`

Exemple pour un service `payments` :

```typescript
// services/payments/createPayment.ts
export function useCreatePayment() {
  const [data, setData] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = useCallback(async (paymentData: PaymentData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (ENV.USE_MOCKS) {
        // Logique mock
      } else {
        const response = await PaymentsApi.create(paymentData);
        setData(response);
        return response;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, createPayment };
}

// services/payments/index.ts
export { useCreatePayment } from './createPayment';

// services/index.ts
export * from './payments';
``` 