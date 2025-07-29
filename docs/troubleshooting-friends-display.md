# Guide de dépannage : Affichage des noms des amis

## 🐛 Problème identifié

Dans l'écran de création de session, la section "Participants" affiche seulement une icône générique et un cercle de sélection, mais **pas le nom de la personne**.

## ✅ Tests effectués

Le script `scripts/test-friends-display.js` confirme que :
- ✅ Les données des amis sont correctement formatées
- ✅ La logique de sélection fonctionne
- ✅ Les composants UI sont corrects
- ✅ Les propriétés `firstName` et `lastName` sont présentes

## 🔍 Diagnostic

### 1. Vérifier les logs de debug

Dans l'écran de création de session, ouvrez la console de développement et cherchez les logs :

```javascript
// Log ajouté dans create-session.tsx
  count: friends?.length || 0,
  friends: friends,
  isLoading,
  error
});
```

**Résultats attendus :**
- `count: 3` (ou plus)
- `friends: Array` avec des objets contenant `firstName` et `lastName`
- `isLoading: false`
- `error: null`

### 2. Vérifier les données mockées

Si vous utilisez les mocks, vérifiez que `mocks/users.ts` contient bien :

```typescript
export const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'Jean', // ✅ camelCase
    lastName: 'Dupont', // ✅ camelCase
    email: 'jean.dupont@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  // ...
];
```

### 3. Vérifier le service useGetFriends

Le service `services/friends/getFriends.ts` doit retourner :

```typescript
const mockFriends: Friend[] = mockUsers.slice(0, 3).map(user => ({
  id: user.id,
  firstName: user.firstName, // ✅ Utilise camelCase
  lastName: user.lastName,   // ✅ Utilise camelCase
  avatar: user.avatar,
  email: user.email
}));
```

## 🔧 Solutions

### Solution 1 : Vérifier la configuration

1. **Ouvrir l'écran de création de session**
2. **Ouvrir la console de développement** (F12 ou Cmd+Option+I)
3. **Chercher les logs de debug** commençant par "👥 Amis chargés"
4. **Vérifier que `friends` contient des données**

### Solution 2 : Forcer le rechargement

Si les données ne se chargent pas :

```typescript
// Dans create-session.tsx, ajouter temporairement :
React.useEffect(() => {
  // Forcer le rechargement
}, []);
```

### Solution 3 : Vérifier les types

Assurez-vous que le type `Friend` est correctement importé :

```typescript
// Dans create-session.tsx
import { Friend } from '../services/types/users'; // ✅ Correct

// Le type Friend doit avoir :
interface Friend {
  id: string;
  firstName: string; // ✅ camelCase
  lastName: string;  // ✅ camelCase
  avatar?: string;
  email: string;
}
```

### Solution 4 : Test avec données statiques

Temporairement, remplacez les données dynamiques par des données statiques :

```typescript
// Dans create-session.tsx, remplacer temporairement :
const { data: friends, isLoading, error } = useGetFriends();

// Par :
const friends = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    avatar: 'https://i.pravatar.cc/150?img=1',
    email: 'jean.dupont@example.com'
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Martin',
    avatar: 'https://i.pravatar.cc/150?img=2',
    email: 'marie.martin@example.com'
  }
];
const isLoading = false;
const error = null;
```

## 🧪 Tests à effectuer

### Test 1 : Vérifier les données
```bash
node scripts/test-friends-display.js
```

### Test 2 : Vérifier l'API (si pas en mode mock)
```bash
curl -X GET "http://localhost:8000/api/friends" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3 : Vérifier les logs dans l'app
1. Ouvrir l'écran de création de session
2. Ouvrir la console de développement
3. Chercher les logs de debug
4. Vérifier que les données sont présentes

## 📋 Checklist de vérification

- [ ] Les logs de debug s'affichent dans la console
- [ ] `friends.length > 0` dans les logs
- [ ] Chaque ami a `firstName` et `lastName`
- [ ] `isLoading` est `false`
- [ ] `error` est `null`
- [ ] Les noms s'affichent dans l'interface

## 🚨 Problèmes courants

### Problème 1 : Données vides
**Symptôme :** `friends.length === 0`
**Solution :** Vérifier que `useGetFriends()` fonctionne

### Problème 2 : Propriétés manquantes
**Symptôme :** `firstName` ou `lastName` sont `undefined`
**Solution :** Vérifier les types et les données mockées

### Problème 3 : Erreur de chargement
**Symptôme :** `error` n'est pas `null`
**Solution :** Vérifier la configuration API et les mocks

### Problème 4 : Interface ne se met pas à jour
**Symptôme :** Les données sont là mais l'interface ne change pas
**Solution :** Vérifier les styles et la logique de rendu

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Capturer les logs de debug** de la console
2. **Prendre une capture d'écran** de l'interface
3. **Vérifier la configuration** (`config/env.ts`)
4. **Tester avec l'API réelle** si possible

## 🔗 Liens utiles

- **Fichier principal** : `app/create-session.tsx`
- **Service** : `services/friends/getFriends.ts`
- **Types** : `services/types/users.ts`
- **Mocks** : `mocks/users.ts`
- **Test** : `scripts/test-friends-display.js` 