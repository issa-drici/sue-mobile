# 🔔 Configuration des Notifications Push

## 📋 Vue d'ensemble

Ce guide détaille la configuration et l'utilisation du système de notifications push avec Expo Notifications dans l'application Sue.

## 🏗️ Architecture

### Frontend (React Native/Expo)
- **Service** : `PushNotificationService` - Gestion des notifications
- **Hook** : `usePushNotifications` - Hook React pour les notifications
- **Configuration** : `app.json` - Configuration Expo

### Backend (Laravel)
- **Endpoint** : `POST /api/push-tokens` - Enregistrement des tokens
- **Service** : `ExpoPushNotificationService` - Envoi des notifications
- **Base de données** : Table `push_tokens` - Stockage des tokens

## 🔧 Configuration requise

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
# Expo Project ID (optionnel, peut être défini dans le code)
EXPO_PROJECT_ID=your-expo-project-id
```

### 2. Configuration Expo

Le plugin `expo-notifications` est déjà configuré dans `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#007AFF",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ]
  }
}
```

### 3. Assets requis

Créez les fichiers suivants :

- `assets/images/notification-icon.png` - Icône de notification (96x96px)
- `assets/sounds/notification.wav` - Son de notification (optionnel)

## 🚀 Utilisation

### 1. Initialisation automatique

Le service s'initialise automatiquement dans l'écran principal :

```typescript
import { usePushNotifications } from '../../hooks';

export default function HomeScreen() {
  const { isInitialized, token } = usePushNotifications();
  
  // Le service s'initialise automatiquement
  // isInitialized: true quand les notifications sont prêtes
  // token: le token Expo Push Token
}
```

### 2. Utilisation manuelle

```typescript
import { pushNotificationService } from '../../services/notifications/pushNotifications';

// Initialiser manuellement
const success = await pushNotificationService.initialize();

// Envoyer une notification locale (pour les tests)
await pushNotificationService.sendLocalNotification({
  title: 'Test',
  body: 'Ceci est un test',
  data: {
    type: 'test',
    session_id: '123',
  },
});
```

### 3. Hook React

```typescript
import { usePushNotifications } from '../../hooks';

function MyComponent() {
  const {
    isInitialized,
    isInitializing,
    token,
    initialize,
    sendLocalNotification,
  } = usePushNotifications();

  const handleTestNotification = async () => {
    await sendLocalNotification({
      title: 'Test',
      body: 'Notification de test',
      data: { type: 'test' },
    });
  };

  return (
    <View>
      <Text>Notifications: {isInitialized ? '✅' : '❌'}</Text>
      <Text>Token: {token ? '✅' : '❌'}</Text>
      <Button title="Test Notification" onPress={handleTestNotification} />
    </View>
  );
}
```

## 📱 Types de notifications

### 1. Invitation de session
```typescript
{
  title: 'Nouvelle invitation',
  body: 'Vous avez reçu une invitation à une session de tennis',
  data: {
    type: 'session_invitation',
    session_id: 'session-uuid',
    user_id: 'sender-uuid',
  },
}
```

### 2. Acceptation/Refus
```typescript
{
  title: 'Invitation acceptée',
  body: 'Jean a accepté votre invitation',
  data: {
    type: 'session_update',
    session_id: 'session-uuid',
    user_id: 'accepter-uuid',
  },
}
```

### 3. Commentaire
```typescript
{
  title: 'Nouveau commentaire',
  body: 'Nouveau commentaire sur votre session',
  data: {
    type: 'comment',
    session_id: 'session-uuid',
    user_id: 'commenter-uuid',
  },
}
```

### 4. Demande d'ami
```typescript
{
  title: 'Nouvelle demande d\'ami',
  body: 'Marie veut vous ajouter comme ami',
  data: {
    type: 'friend_request',
    user_id: 'requester-uuid',
  },
}
```

## 🔄 Navigation automatique

Le service gère automatiquement la navigation selon le type de notification :

- **session_invitation** → `/session/{session_id}`
- **session_update** → `/session/{session_id}`
- **friend_request** → `/friends`
- **comment** → `/session/{session_id}`
- **general** → Pas de navigation

## 🧪 Tests

### 1. Test local

```bash
# Lancer l'application
npx expo start

# Dans l'app, utilisez le bouton de test pour envoyer une notification locale
```

### 2. Test avec le backend

```bash
# Configurer le script de test
# Éditer scripts/test-push-notifications.js

# Lancer les tests
node scripts/test-push-notifications.js
```

### 3. Test manuel

```typescript
// Dans l'application
const { sendLocalNotification } = usePushNotifications();

await sendLocalNotification({
  title: 'Test manuel',
  body: 'Ceci est un test manuel',
  data: { type: 'test' },
});
```

## 🔍 Debugging

### 1. Logs disponibles

Le service génère des logs détaillés :

```
🔔 Initialisation du service de notifications push...
📱 Token Expo obtenu: ExponentPushToken[...]
✅ Token enregistré côté backend
✅ Service de notifications push initialisé
📨 Notification reçue (arrière-plan): {...}
👆 Notification cliquée: {...}
```

### 2. Vérification des permissions

```typescript
import * as Notifications from 'expo-notifications';

const { status } = await Notifications.getPermissionsAsync();
// 'granted' | 'denied' | 'undetermined'
```

### 3. Vérification du token

```typescript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id',
});
```

## 🚨 Problèmes courants

### 1. Permissions refusées
- **Symptôme** : `⚠️ Permissions de notifications refusées`
- **Solution** : Aller dans les paramètres de l'app et autoriser les notifications

### 2. Token non obtenu
- **Symptôme** : `❌ Erreur lors de l'obtention du token Expo`
- **Solution** : Vérifier la configuration Expo et l'Expo Project ID

### 3. Token non enregistré
- **Symptôme** : `❌ Erreur lors de l'enregistrement du token`
- **Solution** : Vérifier la connectivité avec le backend et l'authentification

### 4. Notifications non reçues
- **Symptôme** : Aucune notification reçue
- **Solutions** :
  - Vérifier que l'app n'est pas en mode "Ne pas déranger"
  - Vérifier les paramètres de notifications système
  - Tester avec une notification locale d'abord

## 📊 Monitoring

### 1. Métriques à surveiller
- Taux d'enregistrement des tokens
- Taux de réception des notifications
- Taux de clic sur les notifications
- Erreurs d'envoi

### 2. Logs à analyser
- Erreurs d'enregistrement de token
- Erreurs d'envoi de notification
- Tokens invalides
- Problèmes de permissions

## 🔒 Sécurité

### 1. Tokens
- Les tokens sont stockés de manière sécurisée côté backend
- Chaque utilisateur peut avoir plusieurs tokens (multi-appareils)
- Les tokens invalides sont automatiquement nettoyés

### 2. Permissions
- Les notifications nécessitent l'autorisation explicite de l'utilisateur
- L'utilisateur peut révoquer les permissions à tout moment
- Le service gère gracieusement les permissions refusées

## 🚀 Prochaines étapes

### 1. Fonctionnalités à implémenter
- [ ] Notifications programmées (rappels de session)
- [ ] Notifications groupées
- [ ] Templates de notifications
- [ ] Analytics des notifications

### 2. Améliorations possibles
- [ ] Support des notifications riches (images, actions)
- [ ] Notifications silencieuses pour la synchronisation
- [ ] Gestion des canaux de notification (Android)
- [ ] Support des notifications critiques (iOS)

---

**Note** : Ce système utilise Expo Notifications qui est gratuit et ne nécessite aucune configuration supplémentaire côté backend. L'intégration est complète et prête à l'emploi. 