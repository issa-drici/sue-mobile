# BR-20250122-001: Incohérence de pagination dans l'API des notifications

## 🐛 Problème
L'API `/api/notifications` retourne une pagination incohérente entre les données et les métadonnées.

### 🔍 Observations
- **API curl** : `"total": 47, "totalPages": 3` ✅
- **Frontend** : `"total": 20, "totalPages": 1` ❌

### 📊 Tests effectués
```bash
# Test direct avec curl
curl -H "Authorization: Bearer TOKEN" "https://api.sue.alliance-tech.fr/api/notifications?page=1&limit=20"
# Résultat : {"pagination": {"page": 1, "limit": 20, "total": 47, "totalPages": 3}}

# Test frontend
# Résultat : {"pagination": {"page": 1, "limit": 20, "total": 20, "totalPages": 1}}
```

## 🎯 Impact
- Le scroll infini ne fonctionne pas
- Les utilisateurs ne voient que 20 notifications au lieu de 47
- Impossible de charger les pages suivantes

## 🔧 Demande
1. **Vérifier** pourquoi l'API retourne des métadonnées différentes selon le client
2. **Corriger** la pagination pour qu'elle soit cohérente
3. **Confirmer** que l'API retourne bien `"total": 47, "totalPages": 3` pour tous les clients

## 📝 Informations techniques
- **Endpoint** : `/api/notifications`
- **Paramètres** : `page=1&limit=20`
- **Headers** : `Authorization: Bearer TOKEN`
- **Environnement** : Production

## 🏷️ Tags
- `bug`
- `pagination`
- `notifications`
- `api-inconsistency`
- `scroll-infinite`

---
**Priorité** : HIGH  
**Statut** : 🔍 EN ATTENTE  
**Date** : 2025-01-22







