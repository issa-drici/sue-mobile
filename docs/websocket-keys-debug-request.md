# 🔑 Demande de Debug - Clés WebSocket Soketi

**Date :** 22 Décembre 2024  
**Priorité :** 🔴 URGENT  
**Statut :** EN ATTENTE RÉPONSE BACKEND  

## 🚨 **Problème Identifié**

### **❌ Frontend : Impossible de se connecter à Soketi**
```
📨 Message reçu: {"event":"pusher:error","data":{"code":4001,"message":"App key w4U6jzpva3qsixtl does not exist."}}
```

### **✅ Serveur Soketi : Accessible et fonctionnel**
- **URL :** `wss://websocket.sue.alliance-tech.fr` ✅
- **Ports :** 80, 443, 6001, 6002 ouverts ✅
- **HTTP :** Status 200 ✅
- **WebSocket :** Connexion établie ✅

## 🔍 **Diagnostic Effectué**

### **Tests Frontend Réalisés :**
1. **Clé personnalisée** `w4U6jzpva3qsixtl` → ❌ N'existe pas
2. **Clé par défaut** `app-key` → ❌ N'existe pas
3. **Connexion WebSocket** → ✅ Établie avec succès
4. **Subscription au canal** → ❌ Échoue sur toutes les clés

### **Conclusion :**
Le problème n'est **PAS** dans le code frontend, mais dans la **configuration des clés d'authentification** côté serveur Soketi.

## 🎯 **Questions pour l'Équipe Backend**

### **1. Configuration Soketi Actuelle**
```bash
# Pouvez-vous vérifier dans votre .env ou docker-compose :
SOKETI_DEFAULT_APP_ID=?
SOKETI_DEFAULT_APP_KEY=?
SOKETI_DEFAULT_APP_SECRET=?
```

### **2. Variables d'Environnement Coolify**
```bash
# Dans Coolify, vérifiez que ces variables sont bien passées :
SERVICE_USER_SOKETI=w4U6jzpva3qsixtl
SERVICE_REALBASE64_64_SOKETISECRET=eHRNbVVleFVHajkyR0xYaks2ODZ6VTloRlkySUtZaFV6REtsQ1Y4ZnppakNiU2lVeEt4VDJ3UExpTnFXYlRyYg==
```

### **3. Logs du Container Soketi**
```bash
# Pouvez-vous vérifier les logs Soketi ?
docker logs [container-soketi]
# Chercher : "App key X does not exist" ou "App key X registered"
```

### **4. Test de Connexion Backend**
```bash
# Pouvez-vous tester la connexion avec vos clés ?
# - Utilisez-vous les mêmes clés que le frontend ?
# - La connexion fonctionne-t-elle côté backend ?
```

## 🔧 **Actions Demandées**

### **Immédiat :**
1. **Vérifier la configuration** des clés Soketi
2. **Consulter les logs** du container Soketi
3. **Tester la connexion** avec les clés actuelles

### **Si nécessaire :**
1. **Redémarrer le container Soketi** après modification des variables
2. **Vérifier que les variables d'environnement** sont bien passées
3. **Partager la configuration exacte** qui fonctionne

## 📋 **Informations Frontend**

### **Configuration Actuelle :**
```typescript
// config/env.ts
PUSHER_APP_ID: 'w4U6jzpva3qsixtl'
PUSHER_APP_KEY: 'OVdER0JoREU2VnRaZnM4UUlpdGlobGFTa3JDSEt4eW93UFUzc2tPcnRrRHFxbDBiWjJ1MUkxYTB2OGVRRlJtTg=='
PUSHER_HOST: 'websocket.sue.alliance-tech.fr'
```

### **Code WebSocket :**
```typescript
// services/websocket/index.ts
// Utilise Laravel Echo + Pusher-js
// Canal : sport-session.{sessionId}
// Events : comment.created, comment.updated, comment.deleted
```

## 🎯 **Résultat Attendu**

Une fois les bonnes clés identifiées et configurées :
1. **Frontend pourra se connecter** à Soketi ✅
2. **Events WebSocket** seront reçus en temps réel ✅
3. **Commentaires** s'afficheront instantanément ✅

## 📞 **Contact**

**Frontend :** Configuration 100% prête, en attente des bonnes clés  
**Backend :** Vérification de la configuration Soketi requise  

---

**Note :** Le frontend est entièrement configuré et fonctionnel. Il suffit de corriger les clés d'authentification côté serveur pour résoudre le problème.
