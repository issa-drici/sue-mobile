# Mocks - Données de test

Ce dossier contient toutes les données mockées utilisées dans l'application pour le développement et les tests.

## Structure

### `sessions.ts`
Contient les données mockées pour les sessions sportives.
- **Type**: `SportSession[]`
- **Utilisation**: Écrans d'accueil, historique, détails de session

### `users.ts`
Contient les données mockées pour les utilisateurs et amis.
- **Types**: `User[]`, `Friend[]`, `FriendRequest[]`, `UserProfile`
- **Utilisation**: Profil utilisateur, liste d'amis, demandes d'amis, création de session

### `notifications.ts`
Contient les données mockées pour les notifications.
- **Type**: `Notification[]`
- **Utilisation**: Écran des notifications

## Types associés

Les types correspondants se trouvent dans le dossier `../types/` :
- `types/sport.ts` - Types pour les sessions sportives
- `types/user.ts` - Types pour les utilisateurs et amis
- `types/notification.ts` - Types pour les notifications

## Utilisation

```typescript
// Import depuis le fichier spécifique
import { mockSessions } from '../mocks/sessions';
import { mockUsers } from '../mocks/users';

// Ou import depuis l'index
import { mockSessions, mockUsers, mockNotifications } from '../mocks';
```

## Bonnes pratiques

1. **Toujours typer les mocks** avec les interfaces définies dans `types/`
2. **Utiliser des données réalistes** mais fictives
3. **Maintenir la cohérence** entre les différents mocks (IDs, noms, etc.)
4. **Documenter les changements** dans ce README
5. **Ne jamais utiliser de données sensibles** dans les mocks

## Remplacement par des API

Lors de la mise en production, ces mocks devront être remplacés par des appels API vers le backend. Les types resteront les mêmes pour assurer la compatibilité. 