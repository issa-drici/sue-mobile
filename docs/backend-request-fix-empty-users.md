# Demande Backend - Correction Utilisateurs Vides

## 🎯 **Problème Identifié**
Les commentaires retournent des objets `user: {}` vides au lieu des informations utilisateur.

## 📍 **Endpoint Concerné**
```
GET /api/sessions/{sessionId}/comments
```

## 🔍 **Exemple de Réponse Actuelle (Problématique)**
```json
{
  "success": true,
  "data": [
    {
      "id": "6271",
      "sessionId": "4e86b99c-b306-4e1b-aefe-27644661c006",
      "userId": "9f6fd17e-21c6-427e-9b82-983b7e2cbd7a",
      "content": "Test commentaire",
      "mentions": null,
      "createdAt": {
        "date": "2025-07-21 23:41:38.000000",
        "timezone_type": 3,
        "timezone": "Europe/Paris"
      },
      "updatedAt": {
        "date": "2025-07-21 23:41:38.000000",
        "timezone_type": 3,
        "timezone": "Europe/Paris"
      },
      "user": {} // ❌ OBJET VIDE
    }
  ],
  "pagination": null
}
```

## 🎯 **Réponse Demandée**
```json
{
  "success": true,
  "data": [
    {
      "id": "6271",
      "sessionId": "4e86b99c-b306-4e1b-aefe-27644661c006",
      "userId": "9f6fd17e-21c6-427e-9b82-983b7e2cbd7a",
      "content": "Test commentaire",
      "mentions": null,
      "createdAt": {
        "date": "2025-07-21 23:41:38.000000",
        "timezone_type": 3,
        "timezone": "Europe/Paris"
      },
      "updatedAt": {
        "date": "2025-07-21 23:41:38.000000",
        "timezone_type": 3,
        "timezone": "Europe/Paris"
      },
      "user": {
        "id": "9f6fd17e-21c6-427e-9b82-983b7e2cbd7a",
        "firstname": "Issa",
        "lastname": "Drici",
        "email": "driciissa76@gmail.com",
        "phone": null,
        "role": "player"
      } // ✅ OBJET COMPLET
    }
  ],
  "pagination": null
}
```

## 💡 **Raison**
L'application mobile a besoin des informations utilisateur pour afficher les noms des auteurs des commentaires.

## 🔧 **Solution Suggérée**
- Charger la relation `user` dans la requête Eloquent
- S'assurer que les informations utilisateur sont incluses dans la réponse

## ✅ **Impact**
- ✅ Noms d'utilisateurs affichés correctement
- ✅ Interface utilisateur plus informative
- ✅ Expérience utilisateur améliorée 