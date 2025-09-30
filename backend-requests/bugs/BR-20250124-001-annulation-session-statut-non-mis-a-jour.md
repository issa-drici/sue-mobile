# Bug Report — Annulation de session : statut non mis à jour

## 📋 Informations générales

- **Titre :** Annulation de session : le statut reste "active" au lieu de "cancelled"
- **ID :** BR-20250124-001
- **Date :** 24/01/2025
- **Rapporteur :** Équipe Mobile
- **Priorité :** 🔴 CRITICAL
- **Statut :** 🐛 Bug confirmé

## 🐛 Description du bug

### Problème
L'endpoint d'annulation de session retourne un message de succès mais ne met pas à jour le statut de la session dans la base de données.

### Comportement attendu
- L'endpoint `PATCH /api/sessions/{id}/cancel` doit mettre à jour le statut de la session à `"cancelled"`
- La session doit apparaître avec le statut `"cancelled"` dans les réponses suivantes

### Comportement actuel
- L'endpoint retourne `{"success":true,"message":"Session annulée avec succès"}`
- Mais le statut de la session reste `"active"` dans la base de données
- Les requêtes suivantes montrent toujours `"status":"active"`

## 🔍 Tests effectués

### Test avec curl
```bash
# 1. Login réussi
curl -X POST "https://api.sue.alliance-tech.fr/api/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "driciissa76@gmail.com", "password": "Asmaa1997", "device_name": "curl-test"}'

# Token obtenu: 138|8DuGXZEkGbfHysFUaXsWxIsg9fIc7hehxwdPWjIc6c0f1db0

# 2. Récupération des sessions
curl -X GET "https://api.sue.alliance-tech.fr/api/sessions" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 138|8DuGXZEkGbfHysFUaXsWxIsg9fIc7hehxwdPWjIc6c0f1db0"

# Session de tennis trouvée: 95e9f95e-bc77-4c68-ab0c-d61485e6876c
# Statut initial: "active"

# 3. Tentative d'annulation
curl -X PATCH "https://api.sue.alliance-tech.fr/api/sessions/95e9f95e-bc77-4c68-ab0c-d61485e6876c/cancel" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 138|8DuGXZEkGbfHysFUaXsWxIsg9fIc7hehxwdPWjIc6c0f1db0" \
  -d '{"status": "cancelled"}'

# Réponse: {"success":true,"message":"Session annulée avec succès","data":{"session":{...}}}
# Mais le statut dans la réponse est toujours "active"

# 4. Vérification après annulation
curl -X GET "https://api.sue.alliance-tech.fr/api/sessions" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 138|8DuGXZEkGbfHysFUaXsWxIsg9fIc7hehxwdPWjIc6c0f1db0"

# Résultat: La session a toujours le statut "active"
```

## 📊 Données de test

### Session testée
- **ID :** `95e9f95e-bc77-4c68-ab0c-d61485e6876c`
- **Sport :** tennis
- **Date :** 2025-09-26
- **Organisateur :** Issa Drici (9f8fedb9-23a3-4294-bbd6-52813e86cbe9)
- **Statut avant annulation :** `"active"`
- **Statut après annulation :** `"active"` (devrait être `"cancelled"`)

### Requête d'annulation
```json
{
  "status": "cancelled"
}
```

### Réponse de l'API
```json
{
  "success": true,
  "message": "Session annulée avec succès",
  "data": {
    "session": {
      "id": "95e9f95e-bc77-4c68-ab0c-d61485e6876c",
      "sport": "tennis",
      "date": "2025-09-26",
      "startTime": "18:30:00",
      "endTime": "19:35:00",
      "location": "Practice",
      "maxParticipants": null,
      "pricePerPerson": null,
      "status": "active",  // ❌ Devrait être "cancelled"
      "organizer": {
        "id": "9f8fedb9-23a3-4294-bbd6-52813e86cbe9",
        "fullName": "Issa Drici"
      },
      "participants": [...],
      "comments": [...]
    }
  }
}
```

## 🔧 Spécifications techniques

### Endpoint concerné
```
PATCH /api/sessions/{sessionId}/cancel
```

### Headers utilisés
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

### Codes de réponse
- `200` - Retourné (mais avec données incorrectes)
- Le statut devrait être mis à jour à `"cancelled"`

## 🚨 Impact

### Fonctionnel
- Les utilisateurs pensent que leur session est annulée
- Mais la session reste active dans le système
- Les participants ne sont pas informés de l'annulation
- Les sessions "annulées" apparaissent toujours dans les listes

### Utilisateur
- Confusion totale sur l'état réel des sessions
- Impossibilité d'annuler réellement une session
- Mauvaise expérience utilisateur

## 🔍 Investigation nécessaire

### Côté backend
1. **Contrôleur** : Vérifier la logique dans le contrôleur d'annulation
2. **Modèle** : Vérifier que le modèle Session met bien à jour le statut
3. **Base de données** : Vérifier que la requête UPDATE est bien exécutée
4. **Transaction** : Vérifier s'il y a un rollback de transaction

### Points à vérifier
- [ ] Le contrôleur reçoit bien la requête
- [ ] La validation du statut "cancelled" fonctionne
- [ ] La requête UPDATE est bien exécutée en base
- [ ] Il n'y a pas de rollback de transaction
- [ ] La réponse retourne bien les données mises à jour

## 🛠️ Solution suggérée

### Étapes de correction
1. **Debug** : Ajouter des logs dans le contrôleur d'annulation
2. **Vérification** : Tester la requête UPDATE directement en base
3. **Correction** : Corriger la logique de mise à jour du statut
4. **Test** : Vérifier que l'annulation fonctionne correctement

## 📅 Priorité

**CRITICAL** - Ce bug empêche complètement l'annulation de sessions, fonctionnalité essentielle de l'application.

## 🔗 Fichiers concernés

### Backend
- Contrôleur des sessions (méthode cancel)
- Modèle Session
- Migration/référentiel de données

### Frontend
- `services/api/sessionsApi.ts` (méthode cancelSession)
- `services/sessions/cancelSession.ts` (hook useCancelSession)
- `app/session/[id].tsx` (interface d'annulation)

## 📝 Notes supplémentaires

- Le problème semble être uniquement côté backend
- L'endpoint répond correctement mais ne fait pas la mise à jour
- Aucune erreur n'est retournée, ce qui rend le debug difficile
- Le token d'authentification fonctionne correctement


