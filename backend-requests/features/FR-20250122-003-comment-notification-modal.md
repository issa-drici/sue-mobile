# FR-20250122-003 - Navigation automatique vers modal de commentaires

## Contexte
L'application mobile doit ouvrir automatiquement la modal de commentaires quand l'utilisateur clique sur une notification de commentaire dans une session.

## Fonctionnalité implémentée côté frontend
- ✅ Modification du service de notifications pour passer le paramètre `openComments=true` dans l'URL
- ✅ Modification de l'écran de session pour détecter ce paramètre et ouvrir automatiquement la modal
- ✅ Ajout d'une fonction de test pour simuler les notifications de commentaire

## Comportement attendu
1. **Notification reçue** : L'utilisateur reçoit une notification push pour un nouveau commentaire
2. **Clic sur notification** : L'utilisateur clique sur la notification
3. **Navigation** : L'app s'ouvre sur l'écran de détail de la session
4. **Modal automatique** : La modal de commentaires s'ouvre automatiquement

## Structure de notification backend requise

### Pour les notifications de commentaire
```json
{
  "title": "Nouveau commentaire",
  "body": "John Doe a commenté sur votre session de tennis",
  "data": {
    "type": "comment",
    "session_id": "123",
    "notification_id": "unique-id",
    "user_id": "456"
  }
}
```

### Champs obligatoires dans `data`
- `type`: `"comment"` (pour identifier le type de notification)
- `session_id`: ID de la session concernée
- `notification_id`: ID unique de la notification
- `user_id`: ID de l'utilisateur qui a commenté (optionnel)

## Tests côté frontend

### Fonction de test disponible
```typescript
// Dans le service de notifications
await pushNotificationService.sendTestCommentNotification(sessionId, userId);
```

### Test manuel
1. Aller sur une session existante
2. Appeler la fonction de test depuis la console :
   ```javascript
   // Dans la console du navigateur/app
   pushNotificationService.sendTestCommentNotification('session-id-here');
   ```
3. Vérifier que la notification s'affiche
4. Cliquer sur la notification
5. Vérifier que l'app s'ouvre sur la session avec la modal de commentaires ouverte

## Configuration backend nécessaire

### Endpoint de test
L'endpoint `/notifications/send` doit accepter le format suivant pour les tests :

```json
{
  "recipientId": "user-id-or-self",
  "title": "Nouveau commentaire", 
  "body": "Test: Un nouveau commentaire a été ajouté à la session",
  "data": {
    "type": "comment",
    "session_id": "session-id",
    "notification_id": "unique-id",
    "extra": { "test": true }
  }
}
```

### Envoi automatique lors de commentaires
Quand un utilisateur ajoute un commentaire à une session, le backend doit automatiquement envoyer des notifications push à :
- L'organisateur de la session (si ce n'est pas lui qui a commenté)
- Tous les participants acceptés de la session (sauf celui qui a commenté)

## Priorité
**Haute** - Améliore significativement l'expérience utilisateur pour les interactions sociales

## Statut
**Terminé côté frontend** - En attente de validation backend et tests d'intégration

## Notes techniques
- Le paramètre `openComments=true` est automatiquement ajouté à l'URL lors de la navigation
- La modal s'ouvre via un `useEffect` qui détecte ce paramètre
- Le paramètre est nettoyé automatiquement lors de la fermeture de la modal
- Compatible avec tous les types de navigation (deep linking, notifications, etc.)


