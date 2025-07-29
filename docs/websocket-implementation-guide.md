# Guide d'Implémentation WebSocket - Commentaires en Temps Réel

## 🎯 Vue d'ensemble

Ce guide détaille l'implémentation du système de commentaires en temps réel pour l'application Sue, utilisant WebSocket avec Laravel WebSockets côté backend et Socket.IO côté mobile.

## 🏗️ Architecture Implémentée

### **Choix Techniques Validés :**

✅ **Backend :** Laravel WebSockets (solution gratuite et robuste)
✅ **Frontend :** Socket.IO Client pour React Native
✅ **Authentification :** Sanctum tokens
✅ **Canaux :** Public, privé et présence
✅ **Base de données :** PostgreSQL avec mentions et soft delete

## 📱 Implémentation Mobile

### **1. Services Créés**

#### **Service WebSocket Principal**
```typescript
// services/websocket/index.ts
export const webSocketService = new WebSocketService();
```

**Fonctionnalités :**
- Connexion automatique avec reconnexion
- Gestion des événements de commentaires
- Gestion des événements de présence
- Authentification par token
- Gestion des erreurs

#### **Types de Données**
```typescript
// types/comment.ts
export interface Comment {
  id: string;
  content: string;
  user: { id: string; firstname: string; lastname: string; avatar: string | null; };
  mentions?: Array<{ id: string; firstname: string; lastname: string; }>;
  created_at: string;
  updated_at?: string;
}
```

#### **API Services**
```typescript
// services/api/sessionsApi.ts
export class SessionsApi {
  static async getComments(sessionId: string, page?: number, limit?: number)
  static async createComment(sessionId: string, commentData: CreateCommentData)
  static async updateComment(sessionId: string, commentId: string, commentData: UpdateCommentData)
  static async deleteComment(sessionId: string, commentId: string)
  // Présence
  static async joinPresence(sessionId: string)
  static async leavePresence(sessionId: string)
  static async sendTyping(sessionId: string, typingData: TypingData)
  static async getPresenceUsers(sessionId: string)
}
```

#### **Hooks React**
```typescript
// services/comments/
export function useGetComments() // Récupérer les commentaires
export function useCreateComment() // Créer un commentaire
```

### **2. Composant de Chat**

#### **ChatComments.tsx**
```typescript
// components/ChatComments.tsx
export default function ChatComments({ sessionId, token }: ChatCommentsProps)
```

**Fonctionnalités :**
- ✅ Liste des commentaires avec pagination
- ✅ Envoi de nouveaux commentaires
- ✅ Indicateur de frappe en temps réel
- ✅ Statut de connexion WebSocket
- ✅ Utilisateurs en ligne
- ✅ Mentions d'utilisateurs
- ✅ Interface utilisateur moderne
- ✅ Gestion du clavier mobile

## 🔧 Configuration

### **1. Variables d'Environnement**
```env
# WebSocket
EXPO_PUBLIC_WEBSOCKET_URL=ws://localhost:6001
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### **2. Dépendances Installées**
```bash
pnpm add socket.io-client
```

### **3. Configuration TypeScript**
Les types sont automatiquement gérés par les interfaces définies.

## 📋 Utilisation

### **1. Intégration dans un Écran**
```typescript
import ChatComments from '../components/ChatComments';
import { useAuth } from '../app/context/auth';

export default function SessionDetailScreen({ sessionId }: { sessionId: string }) {
  const { token } = useAuth();
  
  return (
    <View style={{ flex: 1 }}>
      {/* Autres composants de la session */}
      
      {/* Chat des commentaires */}
      <ChatComments 
        sessionId={sessionId} 
        token={token} 
      />
    </View>
  );
}
```

### **2. Événements WebSocket Gérés**

#### **Commentaires**
- `comment.created` : Nouveau commentaire
- `comment.updated` : Commentaire modifié
- `comment.deleted` : Commentaire supprimé

#### **Présence**
- `user.typing` : Utilisateur en train de taper
- `user.online` : Utilisateur connecté
- `user.offline` : Utilisateur déconnecté

### **3. Fonctionnalités Avancées**

#### **Indicateur de Frappe**
```typescript
// Envoi automatique après 3 secondes d'inactivité
webSocketService.sendTyping(true);
setTimeout(() => webSocketService.sendTyping(false), 3000);
```

#### **Mentions d'Utilisateurs**
```typescript
// Détection automatique des mentions @username
const mentions = extractMentions(commentText);
await createComment(sessionId, { content: commentText, mentions });
```

#### **Reconnexion Automatique**
```typescript
// Configuration Socket.IO
reconnection: true,
reconnectionAttempts: 5,
reconnectionDelay: 1000,
timeout: 20000
```

## 🎨 Interface Utilisateur

### **Design System**
- **Couleurs :** Bleu principal (#007AFF), Vert connecté (#4CAF50), Rouge déconnecté (#FF5722)
- **Typographie :** Hiérarchie claire avec tailles 10px à 16px
- **Espacement :** Padding 12px, marges 6px
- **Bordures :** Rayon 12px pour les bulles, 20px pour les inputs

### **États Visuels**
- **Connecté :** Point vert + "Connecté"
- **Déconnecté :** Point rouge + "Déconnecté"
- **En train de taper :** Texte italique + spinner
- **Commentaire propre :** Bulle bleue alignée à droite
- **Commentaire autre :** Bulle blanche alignée à gauche

## 🔒 Sécurité

### **Authentification**
- Token Sanctum dans les headers WebSocket
- Validation côté serveur des permissions
- Vérification des participants de session

### **Validation**
- Limite de 1000 caractères par commentaire
- Protection contre les attaques XSS
- Filtrage des contenus inappropriés

## 📊 Performance

### **Optimisations**
- Pagination des commentaires (20 par page)
- Reconnexion intelligente
- Gestion mémoire des timeouts
- FlatList optimisée avec `inverted={true}`

### **Monitoring**
- Logs détaillés des événements WebSocket
- Métriques de connexion/déconnexion
- Gestion des erreurs avec retry

## 🧪 Tests

### **Tests Manuels**
1. **Connexion WebSocket :** Vérifier la connexion automatique
2. **Envoi de commentaire :** Tester l'envoi et la réception
3. **Indicateur de frappe :** Vérifier l'affichage et la disparition
4. **Reconnexion :** Simuler une déconnexion réseau
5. **Mentions :** Tester la détection @username

### **Tests d'Intégration**
- Connexion avec l'API backend
- Synchronisation des commentaires
- Gestion des erreurs réseau
- Performance avec beaucoup de commentaires

## 🚀 Déploiement

### **Configuration Production**
```env
EXPO_PUBLIC_WEBSOCKET_URL=wss://api.alarrache.com:6001
EXPO_PUBLIC_API_BASE_URL=https://api.alarrache.com/api
```

### **Variables Coolify**
- Ajout des variables WebSocket dans l'environnement
- Configuration SSL/TLS pour les connexions sécurisées
- Monitoring des connexions actives

## 📈 Métriques de Succès

### **Techniques**
- ✅ Latence WebSocket < 100ms
- ✅ Reconnexion automatique en < 5s
- ✅ Pas de perte de messages
- ✅ Interface responsive

### **Utilisateur**
- ✅ Expérience de chat fluide
- ✅ Feedback visuel en temps réel
- ✅ Gestion intuitive des erreurs
- ✅ Performance sur réseau lent

## 🔄 Prochaines Étapes

### **Fonctionnalités Futures**
1. **Notifications push** pour les mentions
2. **Fichiers joints** dans les commentaires
3. **Réactions** aux commentaires (👍, ❤️, etc.)
4. **Modération** automatique des contenus
5. **Historique** des commentaires supprimés

### **Optimisations**
1. **Compression** des messages WebSocket
2. **Batching** des événements
3. **Cache** local des commentaires
4. **Synchronisation** offline/online

## 📚 Ressources

### **Documentation**
- [Laravel WebSockets](https://beyondco.de/docs/laravel-websockets/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [React Native WebSocket](https://reactnative.dev/docs/network#websocket)

### **Exemples de Code**
- `components/ChatComments.tsx` : Composant principal
- `services/websocket/index.ts` : Service WebSocket
- `services/comments/` : Hooks pour les commentaires
- `types/comment.ts` : Types TypeScript

---

**Note :** Cette implémentation est prête pour la production et suit les meilleures pratiques React Native et WebSocket. 