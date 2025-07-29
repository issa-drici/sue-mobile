import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../app/context/auth';
import { useComments } from '../hooks/useComments';

interface ChatCommentsProps {
  sessionId: string;
  onCommentsReload?: () => void; // Callback pour recharger les commentaires
}

const CommentItem = ({ comment, isOwnComment }: { comment: any; isOwnComment: boolean }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Utiliser la structure de votre backend
  const userName = comment.user?.firstname && comment.user?.lastname
    ? `${comment.user.firstname} ${comment.user.lastname}`
    : comment.fullName || 'Utilisateur inconnu';

  const timeString = comment.created_at || comment.createdAt;

  return (
    <View style={[styles.commentItem, isOwnComment ? styles.ownComment : styles.otherComment]}>
      <View style={styles.commentHeader}>
        <Text style={[styles.userName, isOwnComment ? { color: '#fff', opacity: .7 } : {}]}>
          {userName}
        </Text>
        <Text style={[styles.timeText, isOwnComment ? { color: '#fff' } : {}]}>
          {formatTime(timeString)}
        </Text>
      </View>
      <Text style={[styles.commentText, isOwnComment ? { color: '#fff' } : {}]}>{comment.content}</Text>
      {comment.mentions && comment.mentions.length > 0 && (
        <View style={styles.mentionsContainer}>
          <Text style={styles.mentionsText}>
            Mentionné : {comment.mentions.map((m: any) => `${m.firstname} ${m.lastname}`).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};

const TypingIndicator = ({ typingUsers }: { typingUsers: string[] }) => {
  if (typingUsers.length === 0) return null;

  return (
    <View style={styles.typingIndicator}>
      <Text style={styles.typingText}>
        {typingUsers.length === 1
          ? `${typingUsers[0]} est en train d'écrire...`
          : `${typingUsers.join(', ')} sont en train d'écrire...`
        }
      </Text>
      <ActivityIndicator size="small" color="#007AFF" style={styles.typingSpinner} />
    </View>
  );
};

export default function ChatComments({ sessionId, onCommentsReload }: ChatCommentsProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  
  const flatListRef = useRef<FlatList>(null);

  const {
    comments,
    onlineUsers,
    typingUsers,
    isConnected,
    isLoadingComments,
    isCreatingComment,
    sendComment,
    handleTyping,
    stopTyping,
    getTypingUsersNames,
    getOnlineUsersCount
  } = useComments(sessionId);

  // COMMENTÉ - Indicateurs de frappe désactivés pour l'instant
  /*
  // Arrêter l'indicateur de frappe quand le composant se démonte (modal fermée)
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);
  */

  // Recharger les commentaires quand le composant se démonte (modal fermée)
  useEffect(() => {
    return () => {
      onCommentsReload?.();
    };
  }, [onCommentsReload]);


  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      await sendComment(commentText.trim());
      setCommentText('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer le commentaire');
    }
  };

  const handleTextChange = (text: string) => {
    setCommentText(text);
    
    // COMMENTÉ - Indicateurs de frappe désactivés pour l'instant
    /*
    // Si le texte est vide, arrêter immédiatement l'indicateur de frappe
    if (!text || text.trim().length === 0) {
      stopTyping();
    } else {
      // Sinon, continuer avec la logique normale de frappe
      handleTyping(text);
    }
    */
  };

  const handleInputBlur = () => {
    // COMMENTÉ - Indicateurs de frappe désactivés pour l'instant
    /*
    // Arrêter l'indicateur de frappe quand le champ perd le focus
    stopTyping();
    */
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const renderComment = ({ item }: { item: any }) => {
    const isOwnComment = item.user?.id === user?.id || item.userId === user?.id;
    return <CommentItem comment={item} isOwnComment={isOwnComment} />;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* COMMENTÉ - En-tête avec statut de connexion désactivé pour l'instant */}
      {/*
      <View style={styles.header}>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </Text>
        </View>
        {getOnlineUsersCount() > 0 && (
          <Text style={styles.onlineUsersText}>
            {getOnlineUsersCount()} en ligne
          </Text>
        )}
      </View>
      */}

      {/* Liste des commentaires */}
      <FlatList
        ref={flatListRef}
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        style={styles.commentsList}
        inverted={true}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoadingComments ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.emptyStateText}>Chargement des commentaires...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>Aucun commentaire pour le moment</Text>
              <Text style={styles.emptyStateSubtext}>Soyez le premier à commenter !</Text>
            </View>
          )
        }
      />

      {/* COMMENTÉ - Indicateur de frappe désactivé pour l'instant */}
      {/* <TypingIndicator typingUsers={getTypingUsersNames()} /> */}

      {/* Zone de saisie */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={commentText}
          onChangeText={handleTextChange}
          // COMMENTÉ - Indicateurs de frappe désactivés pour l'instant
          // onBlur={handleInputBlur}
          placeholder="Écrivez un commentaire..."
          multiline
          maxLength={1000}
          editable={!isCreatingComment}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || isCreatingComment) && styles.sendButtonDisabled
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || isCreatingComment}
        >
          {isCreatingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  onlineUsersText: {
    fontSize: 12,
    color: '#007AFF',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  commentItem: {
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    width: '100%',
  },
  ownComment: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    color: '#fff',
  },
  otherComment: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  timeText: {
    fontSize: 10,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  mentionsContainer: {
    marginTop: 4,
    padding: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 4,
  },
  mentionsText: {
    fontSize: 11,
    color: '#007AFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginRight: 8,
  },
  typingSpinner: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 8,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
}); 