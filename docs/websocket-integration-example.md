# Exemple d'Intégration WebSocket - Écran de Détail de Session

## 🎯 Vue d'ensemble

Cet exemple montre comment intégrer le système de commentaires en temps réel dans l'écran de détail d'une session sportive.

## 📱 Implémentation Complète

### **1. Écran de Détail de Session**

```typescript
// app/session/[id].tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetSessionById, useInviteFriends, useRespondToInvitation } from '../../services';
import ChatComments from '../../components/ChatComments';

export default function SessionDetailScreen({ sessionId }: { sessionId: string }) {
  const [showComments, setShowComments] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const { data: session, isLoading, getSessionById } = useGetSessionById();
  const { inviteFriends, isLoading: isInviting } = useInviteFriends();
  const { respondToInvitation, isLoading: isResponding } = useRespondToInvitation();

  // ... autres logiques existantes ...

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Informations de la session */}
        <View style={styles.sessionInfo}>
          <Text style={styles.title}>{session?.title}</Text>
          <Text style={styles.description}>{session?.description}</Text>
          <Text style={styles.date}>
            {new Date(session?.date || '').toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Actions principales */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="person-add" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Inviter des amis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(true)}
          >
            <Ionicons name="chatbubbles" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Commentaires</Text>
          </TouchableOpacity>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {session?.participants?.map((participant) => (
            <View key={participant.id} style={styles.participant}>
              <Text>{participant.firstname} {participant.lastname}</Text>
              <Text style={styles.participantStatus}>
                {participant.status === 'accepted' ? '✅ Accepté' : '⏳ En attente'}
              </Text>
            </View>
          ))}
        </View>

        {/* Commentaires récents (aperçu) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commentaires récents</Text>
            <TouchableOpacity onPress={() => setShowComments(true)}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {/* Aperçu des 3 derniers commentaires */}
          {session?.recentComments?.slice(0, 3).map((comment) => (
            <View key={comment.id} style={styles.commentPreview}>
              <Text style={styles.commentAuthor}>
                {comment.user.firstname} {comment.user.lastname}
              </Text>
              <Text style={styles.commentText} numberOfLines={2}>
                {comment.content}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal des commentaires */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowComments(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Commentaires</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ChatComments sessionId={sessionId} />
        </View>
      </Modal>

      {/* Modal d'invitation (existant) */}
      {/* ... code existant ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  sessionInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  participant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantStatus: {
    fontSize: 12,
    color: '#666',
  },
  commentPreview: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
});
```

### **2. Hook Personnalisé pour les Commentaires**

```typescript
// hooks/useSessionComments.ts
import { useComments } from './useComments';
import { useGetSessionById } from '../services';

export const useSessionComments = (sessionId: string) => {
  const { data: session, getSessionById } = useGetSessionById();
  const commentsHook = useComments(sessionId);

  // Recharger les données de session après un nouveau commentaire
  const handleCommentCreated = (comment: any) => {
    // Recharger les données de session pour mettre à jour l'aperçu
    getSessionById(sessionId);
  };

  return {
    ...commentsHook,
    session,
    handleCommentCreated,
  };
};
```

### **3. Composant d'Aperçu des Commentaires**

```typescript
// components/CommentsPreview.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../types/comment';

interface CommentsPreviewProps {
  comments: Comment[];
  onViewAll: () => void;
  maxComments?: number;
}

export default function CommentsPreview({ 
  comments, 
  onViewAll, 
  maxComments = 3 
}: CommentsPreviewProps) {
  const displayComments = comments.slice(0, maxComments);
  const hasMoreComments = comments.length > maxComments;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commentaires récents</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {displayComments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={32} color="#ccc" />
          <Text style={styles.emptyText}>Aucun commentaire</Text>
        </View>
      ) : (
        <>
          {displayComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.authorName}>
                  {comment.user.firstname} {comment.user.lastname}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTime(comment.created_at)}
                </Text>
              </View>
              <Text style={styles.commentText} numberOfLines={2}>
                {comment.content}
              </Text>
            </View>
          ))}
          
          {hasMoreComments && (
            <TouchableOpacity style={styles.moreButton} onPress={onViewAll}>
              <Text style={styles.moreText}>
                Voir {comments.length - maxComments} commentaire(s) de plus
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  commentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  moreText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
});
```

### **4. Intégration dans l'Écran Principal**

```typescript
// app/session/[id].tsx (version simplifiée)
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionComments } from '../../hooks/useSessionComments';
import CommentsPreview from '../../components/CommentsPreview';
import ChatComments from '../../components/ChatComments';

export default function SessionDetailScreen({ sessionId }: { sessionId: string }) {
  const [showComments, setShowComments] = useState(false);
  const { session, comments } = useSessionComments(sessionId);

  return (
    <View style={styles.container}>
      {/* Contenu principal de la session */}
      
      {/* Aperçu des commentaires */}
      <CommentsPreview
        comments={comments}
        onViewAll={() => setShowComments(true)}
      />

      {/* Modal des commentaires complets */}
      {showComments && (
        <ChatComments 
          sessionId={sessionId}
        />
      )}
    </View>
  );
}
```

## 🎨 Améliorations UX

### **1. Animations de Transition**

```typescript
// Animations pour l'ouverture/fermeture du modal
import { Animated } from 'react-native';

const fadeAnim = useRef(new Animated.Value(0)).current;

const showComments = () => {
  setShowComments(true);
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();
};

const hideComments = () => {
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start(() => setShowComments(false));
};
```

### **2. Notifications Push**

```typescript
// Intégration avec les notifications push
import * as Notifications from 'expo-notifications';

const handleCommentCreated = (comment: CommentEvent) => {
  // Si le commentaire n'est pas de l'utilisateur actuel
  if (comment.user.id !== user?.id) {
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nouveau commentaire',
        body: `${comment.user.firstname} a commenté : ${comment.content.substring(0, 50)}...`,
        data: { sessionId, commentId: comment.id },
      },
      trigger: null, // Notification immédiate
    });
  }
};
```

### **3. Indicateurs Visuels**

```typescript
// Badge pour les nouveaux commentaires
const [unreadComments, setUnreadComments] = useState(0);

const handleCommentCreated = (comment: CommentEvent) => {
  if (comment.user.id !== user?.id) {
    setUnreadComments(prev => prev + 1);
  }
};

// Dans le JSX
<TouchableOpacity onPress={() => setShowComments(true)}>
  <Ionicons name="chatbubbles" size={24} color="#007AFF" />
  {unreadComments > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{unreadComments}</Text>
    </View>
  )}
</TouchableOpacity>
```

## 📊 Métriques et Analytics

### **1. Tracking des Interactions**

```typescript
// Analytics pour les commentaires
const trackCommentAction = (action: string, sessionId: string) => {
  analytics.track('comment_action', {
    action,
    sessionId,
    timestamp: new Date().toISOString(),
  });
};

// Utilisation
const handleSendComment = async (content: string) => {
  try {
    await sendComment(content);
    trackCommentAction('comment_sent', sessionId);
  } catch (error) {
    trackCommentAction('comment_error', sessionId);
  }
};
```

### **2. Performance Monitoring**

```typescript
// Monitoring de la performance WebSocket
const monitorWebSocketPerformance = () => {
  const startTime = Date.now();
  
  webSocketService.connect(config).then(() => {
    const connectionTime = Date.now() - startTime;
    analytics.track('websocket_connection_time', {
      connectionTime,
      sessionId,
    });
  });
};
```

## 🔧 Configuration Avancée

### **1. Variables d'Environnement**

```env
# .env
EXPO_PUBLIC_WEBSOCKET_URL=ws://localhost:6001
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
EXPO_PUBLIC_ENABLE_COMMENTS=true
EXPO_PUBLIC_MAX_COMMENT_LENGTH=1000
EXPO_PUBLIC_TYPING_TIMEOUT=2000
```

### **2. Configuration TypeScript**

```typescript
// types/env.d.ts
declare module '@env' {
  export const EXPO_PUBLIC_WEBSOCKET_URL: string;
  export const EXPO_PUBLIC_API_BASE_URL: string;
  export const EXPO_PUBLIC_ENABLE_COMMENTS: string;
  export const EXPO_PUBLIC_MAX_COMMENT_LENGTH: string;
  export const EXPO_PUBLIC_TYPING_TIMEOUT: string;
}
```

## 🚀 Déploiement

### **1. Build de Production**

```bash
# Build pour production
expo build:android --release-channel production
expo build:ios --release-channel production

# Ou avec EAS
eas build --platform all --profile production
```

### **2. Configuration Production**

```typescript
// config/production.ts
export const PRODUCTION_CONFIG = {
  WEBSOCKET_URL: 'wss://api.alarrache.com:6001',
  API_BASE_URL: 'https://api.alarrache.com/api',
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
};
```

---

**Cette implémentation fournit une expérience utilisateur complète et moderne pour les commentaires en temps réel ! 🎉** 