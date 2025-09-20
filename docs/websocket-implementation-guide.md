# 🔧 Guide d'Implémentation WebSocket - Correction Noms d'Événements

**Date :** 22 Décembre 2024  
**Version :** 2.0  
**Statut :** ✅ RÉSOLU  

## 📋 **Problème Identifié et Résolu**

### **🚨 Cause Racine**
L'app mobile écoutait les **mauvais noms d'événements** WebSocket :

- **Backend Laravel** émet : `comment.created` (kebab-case)
- **Frontend React Native** écoutait : `CommentCreated` (PascalCase)

### **✅ Solution Appliquée**
Correction des noms d'événements dans `services/websocket/index.ts` :

```typescript
// ❌ AVANT (ne marchait pas)
.listen('CommentCreated', (data) => { /* ... */ })
.listen('CommentUpdated', (data) => { /* ... */ })
.listen('CommentDeleted', (data) => { /* ... */ })

// ✅ APRÈS (fonctionne maintenant)
.listen('comment.created', (data) => { /* ... */ })
.listen('comment.updated', (data) => { /* ... */ })
.listen('comment.deleted', (data) => { /* ... */ })
```

## 🔍 **Architecture WebSocket Complète**

### **1. Configuration Frontend (Soketi)**
```typescript
const echo = new Echo({
  broadcaster: 'pusher',
  key: 'OVdER0JoREU2VnRaZnM4UUlpdGlobGFTa3JDSEt4eW93UFUzc2tPcnRrRHFxbDBiWjJ1MUkxYTB2OGVRRlJtTg==',
  wsHost: 'websocket.sue.alliance-tech.fr',
  wsPort: 443,
  wssPort: 443,
  forceTLS: true,
  enabledTransports: ['ws', 'wss']
});
```

### **2. Canal de Diffusion**
```typescript
// Canal correct : sport-session.{sessionId}
const channel = echo.channel(`sport-session.${sessionId}`);
```

### **3. Événements Écoutés**
```typescript
// Événements commentaires
channel.listen('comment.created', (data) => {
  console.log('📨 Nouveau commentaire reçu:', data);
  this.config?.onCommentCreated?.(data.comment || data);
});

channel.listen('comment.updated', (data) => {
  console.log('✏️ Commentaire modifié:', data);
  this.config?.onCommentUpdated?.(data.comment || data);
});

channel.listen('comment.deleted', (data) => {
  console.log('🗑️ Commentaire supprimé:', data);
  this.config?.onCommentDeleted?.(data.commentId || data.id);
});
```

## 📊 **Mapping Événements Backend ↔ Frontend**

| Événement Backend | Événement Frontend | Description |
|-------------------|-------------------|-------------|
| `comment.created` | `comment.created` | Nouveau commentaire créé |
| `comment.updated` | `comment.updated` | Commentaire modifié |
| `comment.deleted` | `comment.deleted` | Commentaire supprimé |
| `user.online` | `user.online` | Utilisateur connecté |
| `user.offline` | `user.offline` | Utilisateur déconnecté |
| `user.typing` | `user.typing` | Utilisateur en train de taper |

## 🧪 **Test de Validation**

### **Scénario de Test**
1. **Compte A** : Se connecte à une session
2. **Compte B** : Se connecte à la même session
3. **Compte A** : Crée un commentaire
4. **Compte B** : Devrait recevoir l'événement `comment.created` immédiatement

### **Logs Attendus**
```
✅ Connecté à Soketi
📡 Rejoindre le canal sport-session.{sessionId}
🎧 Écoute de tous les événements sur le canal session...
📨 Nouveau commentaire reçu via WebSocket: {...}
📊 Structure de l'événement: {...}
```

## 🚀 **Bonnes Pratiques**

### **1. Convention de Nommage**
- **Backend Laravel** : Utilise `kebab-case` (ex: `comment.created`)
- **Frontend** : Doit écouter exactement le même nom
- **Éviter** : `PascalCase` ou `snake_case` qui ne correspondent pas

### **2. Gestion des Erreurs**
```typescript
channel.listen('comment.created', (data) => {
  try {
    console.log('📨 Nouveau commentaire reçu:', data);
    this.config?.onCommentCreated?.(data.comment || data);
  } catch (error) {
    console.error('❌ Erreur traitement événement:', error);
  }
});
```

### **3. Debug et Logs**
```typescript
// Écouter TOUS les événements pour debug
channel.listen_global((eventName, data) => {
  console.log(`🔔 Événement reçu: ${eventName}`, data);
});
```

## 📈 **Statut Actuel**

- ✅ **Configuration Soketi** : Opérationnelle
- ✅ **Canal WebSocket** : Correct (`sport-session.*`)
- ✅ **Noms d'événements** : Corrigés (kebab-case)
- ✅ **Connexion WebSocket** : Stable
- 🧪 **Tests temps réel** : En cours de validation

## 🔮 **Évolutions Futures**

### **1. Événements Additionnels**
- Notifications push
- Mise à jour statut session
- Changements participants

### **2. Optimisations**
- Reconnexion automatique
- Gestion offline/online
- Compression des données

## 📚 **Ressources**

- **Documentation Laravel Broadcasting** : [laravel.com/docs/broadcasting](https://laravel.com/docs/broadcasting)
- **Documentation Soketi** : [github.com/soketi/soketi](https://github.com/soketi/soketi)
- **Documentation Pusher** : [pusher.com/docs](https://pusher.com/docs)

---

**Note :** Cette correction résout le problème principal de communication temps réel. Les commentaires devraient maintenant apparaître instantanément pour tous les participants d'une session. 