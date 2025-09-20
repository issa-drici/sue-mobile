# FR-20250122-005: Ajouter le champ isAlreadyFriend à l'endpoint de profil utilisateur

## 🎯 Objectif
Ajouter le champ `isAlreadyFriend` à l'endpoint de profil utilisateur existant pour indiquer si l'utilisateur connecté a déjà cet utilisateur en ami.

## 📋 Fonctionnalité demandée

### Endpoint existant à modifier
- **Méthode** : `GET`
- **URL** : `/api/users/{userId}` (déjà implémenté)
- **Authentification** : Requise (token Bearer)

### Modification de la réponse

#### Réponse actuelle
```json
{
  "success": true,
  "data": {
    "id": "123",
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean.dupont@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "stats": {
      "sessionsCreated": 5,
      "sessionsParticipated": 12
    }
  }
}
```

#### Réponse demandée
```json
{
  "success": true,
  "data": {
    "id": "123",
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean.dupont@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "stats": {
      "sessionsCreated": 5,
      "sessionsParticipated": 12
    },
    "isAlreadyFriend": false
  }
}
```

## 🔧 Implémentation technique

### Logique à ajouter
1. **Récupérer l'utilisateur connecté** depuis le token d'authentification
2. **Vérifier la relation d'amitié** entre l'utilisateur connecté et l'utilisateur demandé
3. **Ajouter le champ** `isAlreadyFriend` à la réponse

### Requête SQL suggérée
```sql
SELECT EXISTS(
  SELECT 1 FROM friendships 
  WHERE (user_id = ? AND friend_id = ?) 
     OR (user_id = ? AND friend_id = ?)
) as isAlreadyFriend
```

## 📊 Valeurs possibles
- `true` : L'utilisateur connecté a déjà cet utilisateur en ami
- `false` : L'utilisateur connecté n'a pas cet utilisateur en ami

## 🧪 Tests à ajouter
- Test avec un utilisateur qui est déjà ami
- Test avec un utilisateur qui n'est pas ami
- Test avec son propre profil (devrait retourner `false` ou `null`)

## 📝 Notes
- **Rétrocompatibilité** : Le champ est optionnel pour ne pas casser les clients existants
- **Performance** : Optimiser la requête pour éviter les N+1 queries
- **Cache** : Considérer la mise en cache de cette information si nécessaire

## 🎯 Utilisation frontend
Ce champ sera utilisé dans la modal de profil utilisateur pour afficher :
- "Ajouter en ami" si `isAlreadyFriend: false`
- "Déjà dans vos amis" si `isAlreadyFriend: true`







