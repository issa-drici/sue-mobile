# 🔍 Guide de Debug Frontend Expo - WebSocket Soketi

**Date :** 22 Décembre 2024  
**Version :** 1.0  
**Statut :** 🔴 DEBUG EN COURS  

## 📋 **Contexte du Problème**

### **✅ Backend Laravel : Fonctionne Parfaitement**
- Broadcasting configuré et fonctionnel ✅
- Events `comment.created` émis correctement ✅
- Credentials Soketi corrects ✅
- Configuration `routes/channels.php` et `BroadcastServiceProvider` ✅

### **❌ Frontend Expo : Ne Reçoit Pas les Events**

## 🎯 **Diagnostic Frontend Requis**

### **1. Configuration Expo Pusher**
```javascript
// Montre-moi ta configuration exacte :
import Pusher from 'pusher-js';

const pusher = new Pusher('w4U6jzpva3qsixtl', {
  cluster: 'mt1', // ou autre ?
  // Autres options ?
});
```

### **2. Version des Dependencies**
```json
// package.json - versions exactes :
{
  "pusher-js": "version?",
  "expo": "version?"
}
```

### **3. Connexion au Canal**
```javascript
// Comment tu te connectes au canal ?
const channel = pusher.subscribe('sport-session.123');

// Quels listeners ?
channel.bind('comment.created', (data) => {
  console.log('Comment received:', data);
});
```

### **4. Logs Frontend**
```javascript
// Tu vois des erreurs dans la console ?
// Des logs de connexion ?
// Des logs de subscription ?
```

## 🔍 **Tests de Diagnostic**

### **Test 1 : Connexion Basique**
```javascript
// Test simple de connexion
pusher.connection.bind('connected', () => {
  console.log('✅ Connected to Soketi');
});

pusher.connection.bind('error', (err) => {
  console.log('❌ Connection error:', err);
});
```

### **Test 2 : Subscription au Canal**
```javascript
const channel = pusher.subscribe('sport-session.test');

channel.bind('pusher:subscription_succeeded', () => {
  console.log('✅ Subscribed to channel');
});

channel.bind('pusher:subscription_error', (err) => {
  console.log('❌ Subscription error:', err);
});
```

### **Test 3 : Test d'Event**
```javascript
// Test manuel d'event
channel.trigger('client-test', { message: 'test' });
```

## 🚨 **Hypothèses de Problèmes**

### **1. Version Pusher Incompatible**
- Expo peut utiliser une version différente
- Incompatibilité avec Soketi

### **2. Configuration de Canal Incorrecte**
- Nom du canal mal formaté
- Authentification du canal

### **3. CORS/Headers**
- Problème de connexion WebSocket
- Headers manquants

### **4. Format d'Event**
- Laravel émet `comment.created` (kebab-case)
- Frontend écoute peut-être `CommentCreated` (PascalCase)

## 🎯 **Actions Immédiates**

### **1. Vérifier la Console Frontend**
- Erreurs de connexion ?
- Erreurs de subscription ?
- Logs de Pusher ?

### **2. Vérifier la Version Pusher**
- Compatibilité avec Soketi
- Mettre à jour si nécessaire

### **3. Tester la Connexion Directe**
- Connexion basique
- Subscription au canal
- Réception d'events

## 📱 **Code de Test Complet**

```javascript
import Pusher from 'pusher-js';

// Configuration
const pusher = new Pusher('w4U6jzpva3qsixtl', {
  cluster: 'mt1', // Ajuster selon ta config
  forceTLS: true,
  encrypted: true,
});

// Test de connexion
pusher.connection.bind('connected', () => {
  console.log('✅ Connected to Soketi');
  
  // Test de subscription
  const channel = pusher.subscribe('sport-session.test');
  
  channel.bind('pusher:subscription_succeeded', () => {
    console.log('✅ Subscribed to sport-session.test');
  });
  
  channel.bind('pusher:subscription_error', (err) => {
    console.log('❌ Subscription error:', err);
  });
  
  // Test d'event
  channel.bind('comment.created', (data) => {
    console.log('✅ Comment event received:', data);
  });
});

pusher.connection.bind('error', (err) => {
  console.log('❌ Connection error:', err);
});

pusher.connection.bind('disconnected', () => {
  console.log('❌ Disconnected from Soketi');
});
```

## 🔧 **Solutions Possibles**

### **1. Mise à Jour Pusher**
```bash
npm install pusher-js@latest
# ou
yarn add pusher-js@latest
```

### **2. Configuration Alternative**
```javascript
const pusher = new Pusher('w4U6jzpva3qsixtl', {
  cluster: 'mt1',
  forceTLS: true,
  encrypted: true,
  wsHost: 'websocket.sue.alliance-tech.fr',
  wsPort: 443,
  wssPort: 443,
  disableStats: true,
});
```

### **3. Test avec WebSocket Direct**
```javascript
// Fallback si Pusher ne marche pas
const ws = new WebSocket('wss://websocket.sue.alliance-tech.fr/app/w4U6jzpva3qsixtl');
```

## 📋 **Checklist de Debug**

- [ ] Configuration Pusher correcte
- [ ] Version Pusher compatible
- [ ] Connexion au serveur
- [ ] Subscription au canal
- [ ] Réception d'events
- [ ] Logs d'erreurs
- [ ] CORS/Headers

## 🚀 **Prochaines Étapes**

1. **Vérifier la configuration actuelle** dans l'app
2. **Tester la connexion basique** avec le code de test
3. **Identifier les erreurs** dans la console
4. **Ajuster la configuration** selon les résultats
5. **Valider la réception d'events**

---

**Note :** Ce guide nous permettra d'identifier précisément où se situe le problème côté frontend et de le résoudre rapidement.
