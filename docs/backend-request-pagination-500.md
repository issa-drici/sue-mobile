# Demande Backend - Tous les Commentaires

## 🎯 **Demande**
Renvoie **tous** les commentaires (sans pagination) pour l'endpoint des commentaires de session.

## 📍 **Endpoint Concerné**
```
GET /api/sessions/{sessionId}/comments
```

## 🔧 **Modification Demandée**
- **Actuellement** : Pagination avec 20 éléments par page
- **Demandé** : Tous les commentaires sans pagination

## 💡 **Raison**
Les nouveaux commentaires ne s'affichent pas dans l'application mobile car ils sont dans les pages suivantes. En renvoyant tous les commentaires, ils seront tous visibles immédiatement.

## 📝 **Exemple de Réponse Actuelle**
```json
{
  "success": true,
  "data": [...], // 20 commentaires max
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 46,
    "totalPages": 3
  }
}
```

## 🎯 **Exemple de Réponse Demandée**
```json
{
  "success": true,
  "data": [...], // TOUS les commentaires
  "pagination": null
}
```

## ✅ **Impact**
- ✅ Tous les commentaires visibles immédiatement
- ✅ Nouveaux commentaires immédiatement visibles
- ✅ Pas de pagination à gérer côté frontend
- ✅ Solution simple et efficace
- ✅ Pas de modification côté frontend nécessaire 