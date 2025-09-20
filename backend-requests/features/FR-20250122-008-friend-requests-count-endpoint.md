# FR-20250122-008: Endpoint pour compter les demandes d'amis non traitées

## 🎯 Objectif

**Titre :** Créer un endpoint pour compter les demandes d'amis non traitées

**Priorité :** 🔴 **HAUTE** - Nécessaire pour le système de badge

**Type :** Feature Request

**Statut :** 🔄 **À implémenter**

**Créé le :** 2025-01-22

## 📋 Contexte

Pour implémenter un système de badge sur l'onglet "Amis" (similaire aux notifications), nous avons besoin d'un endpoint qui retourne le nombre de demandes d'amis non traitées reçues par l'utilisateur connecté.

## 🚨 Problème actuel

Actuellement, il n'existe pas d'endpoint pour récupérer uniquement le nombre de demandes d'amis en attente. L'utilisateur doit aller dans l'onglet "Demandes" pour voir s'il y a des demandes, ce qui n'est pas optimal pour l'UX.

## ✅ Solution proposée

### Nouvel endpoint
```
GET /api/users/friend-requests/count
```

### Réponse attendue
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### Logique métier
- Compter uniquement les demandes d'amis **reçues** par l'utilisateur connecté
- Statut `pending` uniquement
- Ne pas compter les demandes envoyées par l'utilisateur connecté

### Code PHP proposé
```php
public function getFriendRequestsCount()
{
    $count = FriendRequest::where('receiver_id', auth()->id())
        ->where('status', 'pending')
        ->count();
    
    return response()->json([
        'success' => true,
        'data' => [
            'count' => $count
        ]
    ]);
}
```

## 🔧 Spécifications techniques

### Endpoint
- **URL** : `GET /api/users/friend-requests/count`
- **Authentification** : Requise (Bearer token)
- **Paramètres** : Aucun

### Réponse
- **Code** : 200 OK
- **Format** : JSON
- **Structure** :
  ```json
  {
    "success": true,
    "data": {
      "count": number
    }
  }
  ```

### Gestion d'erreurs
- **401 Unauthorized** : Token manquant ou invalide
- **500 Internal Server Error** : Erreur serveur

## 📊 Impact sur l'application

### Frontend
- ✅ Badge sur l'onglet "Amis" avec le nombre de demandes
- ✅ Polling automatique toutes les 10 secondes
- ✅ Mise à jour en temps réel du badge
- ✅ Suppression de l'onglet "Demandes" séparé

### UX améliorée
- ✅ L'utilisateur voit immédiatement s'il a des demandes d'amis
- ✅ Plus besoin de naviguer vers un onglet séparé
- ✅ Expérience similaire aux notifications

## 🧪 Tests à effectuer

### Test 1 : Utilisateur sans demandes
```bash
curl -X GET /api/users/friend-requests/count \
  -H "Authorization: Bearer {token}"
```
**Attendu :** `{ "success": true, "data": { "count": 0 } }`

### Test 2 : Utilisateur avec demandes
```bash
curl -X GET /api/users/friend-requests/count \
  -H "Authorization: Bearer {token}"
```
**Attendu :** `{ "success": true, "data": { "count": 3 } }`

### Test 3 : Token invalide
```bash
curl -X GET /api/users/friend-requests/count \
  -H "Authorization: Bearer invalid_token"
```
**Attendu :** `401 Unauthorized`

## 📝 Notes

- **Performance** : Endpoint léger, utilise `count()` au lieu de récupérer les données
- **Sécurité** : Vérifier que l'utilisateur ne peut voir que ses propres demandes
- **Cohérence** : Suivre la même structure de réponse que les autres endpoints

## 🚀 Priorité

**Haute** - Cet endpoint est nécessaire pour implémenter le système de badge sur l'onglet "Amis" et améliorer significativement l'expérience utilisateur.





