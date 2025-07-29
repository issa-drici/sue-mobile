# Demande de Nouvelle Fonctionnalité

## 📋 Informations générales

- **Titre :** Endpoint pour le compteur de notifications non lues
- **ID :** FR-20241220-002
- **Date :** 20/12/2024
- **Demandeur :** Équipe Mobile
- **Priorité :** 🟡 HIGH
- **Deadline :** 10/01/2025

## 🎯 Description

### Fonctionnalité demandée
Créer un endpoint `/api/notifications/unread-count` pour récupérer le nombre de notifications non lues d'un utilisateur.

### Contexte
L'équipe mobile a implémenté un hook `useGetUnreadCount()` qui nécessite cet endpoint pour afficher le badge de notifications non lues dans l'interface utilisateur.

### Cas d'usage
- Affichage du badge de notifications sur l'onglet notifications
- Mise à jour en temps réel du compteur
- Optimisation des performances (éviter de charger toutes les notifications)

## 🔧 Spécifications techniques

### Endpoints nécessaires
```
GET /api/notifications/unread-count
```

### Structure des données
```json
{
  "success": true,
  "data": {
    "unreadCount": 15
  }
}
```

### Paramètres de requête
```
Aucun paramètre requis
```

### Codes de réponse
- `200` - Succès
- `401` - Non autorisé
- `500` - Erreur serveur

## 📱 Impact sur le mobile

### Écrans concernés
- Écran principal (badge notifications)
- Écran des notifications
- Navigation par onglets

### Hooks/Composants à créer
- `useGetUnreadCount()` - Déjà implémenté côté mobile
- Badge de notifications dans la navigation

### Tests à implémenter
- Test de récupération du compteur
- Test de mise à jour après marquage comme lu
- Test de performance

## 🧪 Tests et validation

### Tests à effectuer côté backend
- [ ] Test de récupération du compteur
- [ ] Test d'autorisation
- [ ] Test de performance
- [ ] Test de cohérence avec les notifications

### Tests côté mobile
- [x] Test de l'endpoint (script existant)
- [x] Test d'interface utilisateur
- [x] Test de performance
- [x] Test de régression

## 📊 Estimation

### Backend
- **Temps estimé :** 4 heures
- **Complexité :** Faible (requête simple)

### Mobile
- **Temps estimé :** 0 heure (déjà implémenté)
- **Complexité :** N/A

## 🔗 Liens utiles

- **Documentation API :** `docs/api/notifications.md`
- **Hook mobile :** `services/notifications/getUnreadCount.ts`
- **Test script :** `scripts/test-notifications-fixed.js`

## 📝 Notes additionnelles

### Implémentation suggérée
```php
// Dans le contrôleur NotificationsController
public function getUnreadCount()
{
    $unreadCount = auth()->user()->notifications()
        ->where('read', false)
        ->count();
    
    return response()->json([
        'success' => true,
        'data' => [
            'unreadCount' => $unreadCount
        ]
    ]);
}
```

### Route à ajouter
```php
// Dans routes/api.php
Route::get('/notifications/unread-count', [NotificationsController::class, 'getUnreadCount'])
    ->middleware('auth:sanctum');
```

### Considérations de performance
- Utiliser une requête COUNT optimisée
- Considérer le cache Redis pour les utilisateurs actifs
- Index sur la colonne `read` de la table notifications

---

**Status :** ⏳ En attente
**Assigné à :** [À assigner]
**Date de mise à jour :** 20/12/2024 