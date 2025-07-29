# Services API - Structure Modulaire

Cette nouvelle structure organise les services API par domaine avec les types externalisés pour une meilleure lisibilité et maintenabilité.

## Structure des fichiers

```
services/
├── api/                    # Services API par domaine
│   ├── baseApi.ts         # Service API de base avec configuration
│   ├── endpoints.ts       # Tous les endpoints centralisés
│   ├── authApi.ts         # Service d'authentification
│   ├── sessionsApi.ts     # Service des sessions
│   ├── usersApi.ts        # Service des utilisateurs
│   ├── notificationsApi.ts # Service des notifications
│   └── index.ts           # Export de tous les services API
├── types/                 # Types TypeScript par domaine
│   ├── auth.ts           # Types d'authentification
│   ├── sessions.ts       # Types des sessions
│   ├── users.ts          # Types des utilisateurs
│   ├── notifications.ts  # Types des notifications
│   └── index.ts          # Export de tous les types
├── api.ts                # Fichier d'export principal
├── index.ts              # Export de tous les services et hooks
└── README.md             # Documentation
```

## Services disponibles

### BaseApiService (`api/baseApi.ts`)
Service de base qui gère :
- Configuration de l'URL de l'API
- Gestion des tokens d'authentification
- Méthodes HTTP génériques (GET, POST, PUT, DELETE, PATCH)
- Gestion des erreurs

### AuthApi (`api/authApi.ts`)
Gestion de l'authentification :
- `login(credentials)` - Connexion utilisateur
- `register(userData)` - Inscription utilisateur
- `logout()` - Déconnexion
- `refreshToken()` - Rafraîchissement du token

### SessionsApi (`api/sessionsApi.ts`)
Gestion des sessions de sport :
- `getAll()` - Récupérer toutes les sessions
- `getById(id)` - Récupérer une session par ID
- `create(sessionData)` - Créer une nouvelle session
- `update(id, sessionData)` - Mettre à jour une session
- `delete(id)` - Supprimer une session
- `respondToInvitation(sessionId, response)` - Répondre à une invitation
- `addComment(sessionId, comment)` - Ajouter un commentaire

### UsersApi (`api/usersApi.ts`)
Gestion des utilisateurs et amis :
- `getProfile()` - Récupérer le profil utilisateur
- `updateProfile(profileData)` - Mettre à jour le profil
- `getFriends()` - Récupérer la liste d'amis
- `getFriendRequests()` - Récupérer les demandes d'amis
- `sendFriendRequest(userId)` - Envoyer une demande d'ami
- `respondToFriendRequest(requestId, response)` - Répondre à une demande d'ami
- `searchUsers(query)` - Rechercher des utilisateurs
- `updateEmail(newEmail, currentEmail)` - Mettre à jour l'email
- `updatePassword(currentPassword, newPassword)` - Mettre à jour le mot de passe
- `deleteAccount()` - Supprimer le compte

### NotificationsApi (`api/notificationsApi.ts`)
Gestion des notifications :
- `getAll()` - Récupérer toutes les notifications
- `markAsRead(notificationId)` - Marquer une notification comme lue
- `markAllAsRead()` - Marquer toutes les notifications comme lues

## Types disponibles

### Types d'authentification (`types/auth.ts`)
- `LoginCredentials` - Données de connexion
- `RegisterData` - Données d'inscription
- `AuthResponse` - Réponse d'authentification

### Types des sessions (`types/sessions.ts`)
- `Session` - Session de sport
- `CreateSessionData` - Données pour créer une session
- `UpdateSessionData` - Données pour mettre à jour une session
- `Comment` - Commentaire sur une session

### Types des utilisateurs (`types/users.ts`)
- `UserProfile` - Profil utilisateur
- `UpdateProfileData` - Données pour mettre à jour le profil
- `Friend` - Ami
- `FriendRequest` - Demande d'ami
- `SearchUserResult` - Résultat de recherche d'utilisateur

### Types des notifications (`types/notifications.ts`)
- `Notification` - Notification

## Endpoints (`api/endpoints.ts`)

Tous les endpoints sont centralisés dans ce fichier et organisés par domaine :
- `AUTH_ENDPOINTS` - Endpoints d'authentification
- `SESSIONS_ENDPOINTS` - Endpoints des sessions
- `USERS_ENDPOINTS` - Endpoints des utilisateurs
- `FRIEND_REQUESTS_ENDPOINTS` - Endpoints des demandes d'amis
- `NOTIFICATIONS_ENDPOINTS` - Endpoints des notifications

## Bonnes pratiques

### Utilisation des hooks React Navigation

Pour les écrans qui utilisent React Navigation, utilisez `useFocusEffect` au lieu de `useEffect` :

```typescript
import { useFocusEffect } from '@react-navigation/native';

// ✅ Bon : useFocusEffect pour les écrans de navigation
useFocusEffect(
  React.useCallback(() => {
    if (sessionId) {
      getSessionById(sessionId);
    }
  }, [sessionId, getSessionById])
);

// ❌ Éviter : useEffect pour les écrans de navigation
useEffect(() => {
  if (sessionId) {
    getSessionById(sessionId);
  }
}, [sessionId, getSessionById]);
```

**Pourquoi `useFocusEffect` ?**
- Se déclenche chaque fois que l'écran devient actif (focus)
- Parfait pour recharger les données quand l'utilisateur revient sur l'écran
- Évite les problèmes de données obsolètes
- Optimisé pour React Navigation

## Utilisation

```typescript
// Import des services API
import { AuthApi, SessionsApi, UsersApi, NotificationsApi } from '../services/api';

// Import des types
import { LoginCredentials, Session, UserProfile, Notification } from '../services/types';

// Authentification
const authResponse = await AuthApi.login({ email: 'user@example.com', password: 'password' });

// Sessions
const sessions = await SessionsApi.getAll();
const newSession = await SessionsApi.create({
  title: 'Match de foot',
  date: '2024-01-15T14:00:00Z',
  location: 'Stade municipal',
  sport: 'football',
  maxParticipants: 22
});

// Utilisateurs
const profile = await UsersApi.getProfile();
const friends = await UsersApi.getFriends();

// Notifications
const notifications = await NotificationsApi.getAll();
```

## Avantages de cette structure

1. **Séparation des responsabilités** : Chaque service gère un domaine spécifique
2. **Types externalisés** : Types TypeScript organisés par domaine
3. **Lisibilité** : Code plus facile à lire et comprendre
4. **Maintenabilité** : Modifications isolées par domaine
5. **Réutilisabilité** : Services et types indépendants et réutilisables
6. **Type Safety** : Types TypeScript robustes et spécifiques
7. **Centralisation des endpoints** : Facilite la maintenance des URLs
8. **Organisation modulaire** : Structure claire et évolutive
9. **Bonnes pratiques React Navigation** : Utilisation appropriée des hooks de navigation 