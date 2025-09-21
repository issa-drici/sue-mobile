import { BrandColors } from '@/constants/Colors';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Bubble, GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../app/context/auth';
import { useComments } from '../hooks/useComments';

dayjs.locale('fr');

interface ChatCommentsProps {
  sessionId: string;
  onCommentsReload?: () => void; // Callback pour recharger les commentaires
  onUserPress?: (userId: string, firstname?: string, lastname?: string) => void; // Callback pour clic sur utilisateur
  onCloseComments?: () => void; // Callback pour fermer la modal des commentaires
}

// Indicateur de saisie retiré pour simplifier l'écran (réintégrable si besoin)

export default function ChatComments({ sessionId, onCommentsReload, onUserPress, onCloseComments }: ChatCommentsProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);




  // Hauteur de réserve en bas pour ne pas masquer les derniers messages (liste non inversée)
  // Réserves calculées gérées par GiftedChat, plus besoin ici

  // Pas de logs en production

  // plus de FlatList direct
  // const inputRef = useRef<TextInput>(null);

  // Scroll utilitaires: aller au dernier message (liste non inversée)
  // Pas de scroll automatique

  //

  //

  const {
    comments,
    isCreatingComment,
    sendComment,
  } = useComments(sessionId);

  // Ordonner du plus ancien au plus récent (dernier en bas)
  // Liste conservée telle quelle (nouveaux d'abord) pour un rendu inversé

  // Aucun scroll automatique au montage ni aux mises à jour de données

  // Gestion clavier déléguée à GiftedChat (marge dynamique pour coller au clavier/safe area)
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  //

  // envoi géré par GiftedChat via handleGiftedSend

  const handleTextChange = (text: string) => {
    setCommentText(text);
  };

  // Mapping des commentaires vers le format GiftedChat
  const giftedMessages = React.useMemo(() => {
    return comments
      .map((c: any) => {
        const createdAtRaw = c.created_at || c.createdAt;
        const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date();
        const userId = c.user?.id ?? c.userId ?? 'unknown';
        const name = c.fullName || (
          c.user ? `${c.user.firstname || ''} ${c.user.lastname || ''}`.trim() : 'Utilisateur'
        );
        return {
          _id: String(c.id || `${userId}-${createdAtRaw || createdAt.toISOString()}`),
          text: String(c.content || ''),
          createdAt,
          user: {
            _id: String(userId),
            name
          }
        } as any;
      })
      // GiftedChat attend les plus récents en premier
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [comments]);

  const handleGiftedSend = React.useCallback(async (msgs: any[] = []) => {
    const text = msgs?.[0]?.text?.trim();
    if (!text || isCreatingComment) return;
    try {
      await sendComment(text);
      setCommentText('');
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le commentaire");
    }
  }, [isCreatingComment, sendComment]);

  //

  //

  const renderDay = React.useCallback((props: any) => {
    const dateValue = props?.currentMessage?.createdAt;
    if (!dateValue) return null;
    const date = new Date(dateValue);
    const weekdays = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const label = `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    return (
      <View style={{ alignItems: 'center', marginVertical: 8 }}>
        <View style={{ backgroundColor: '#E5E5EA', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 }}>
          <Text style={{ fontSize: 12, color: '#555', fontWeight: '600' }}>{label}</Text>
        </View>
      </View>
    );
  }, []);

  // Fonction pour rendre les bulles avec noms cliquables
  const renderBubble = React.useCallback((props: any) => {
    const { currentMessage } = props;
    const isCurrentUser = currentMessage?.user?._id === String(user?.id);

    return (
      <View style={styles.messageContainer}>
        {!isCurrentUser && currentMessage?.user?.name && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Empêcher la propagation vers les éléments parents
              if (onUserPress && currentMessage?.user?._id) {
                // Fermer d'abord la modal des commentaires
                if (onCloseComments) {
                  onCloseComments();
                }
                // Puis ouvrir la modal de profil après un court délai
                setTimeout(() => {
                  const fullName = currentMessage.user.name || '';
                  const nameParts = fullName.split(' ');
                  const firstname = nameParts[0] || '';
                  const lastname = nameParts.slice(1).join(' ') || '';
                  onUserPress(currentMessage.user._id, firstname, lastname);
                }, 300); // Délai pour laisser le temps à la modal de se fermer
              }
            }}
            style={styles.usernameContainer}
          >
            <Text style={styles.usernameText}>
              {currentMessage.user.name}
            </Text>
          </TouchableOpacity>
        )}
        <Bubble
          {...props}
          wrapperStyle={{
            left: styles.bubbleLeft,
            right: styles.bubbleRight,
          }}
          textStyle={{
            left: styles.bubbleTextLeft,
            right: styles.bubbleTextRight,
          }}
        />
      </View>
    );
  }, [onUserPress, user?.id]);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={giftedMessages}
        onSend={handleGiftedSend}
        user={{ _id: String(user?.id || 'me'), name: `${user?.firstname || ''} ${user?.lastname || ''}`.trim() }}
        text={commentText}
        onInputTextChanged={handleTextChange}
        alwaysShowSend
        placeholder="Écrivez un message..."
        // bottomOffset={0}
        textInputProps={{
          returnKeyType: 'send',
          blurOnSubmit: false,
          submitBehavior: 'submit' as const,
          enablesReturnKeyAutomatically: true,
          onSubmitEditing: () => {
            const t = commentText?.trim();
            if (t) {
              void handleGiftedSend([{ text: t }]);
            }
          }
        }}
        renderAvatar={() => null}
        renderUsernameOnMessage={false} // Désactivé car on gère nous-mêmes les noms
        showAvatarForEveryMessage
        renderBubble={renderBubble}
        // renderChatFooter={() => <View style={{ height: 8 }} />}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={{
              marginBottom: Platform.OS === 'ios' ? (keyboardOpen ? -insets.bottom : 0) : 0,
            }}
          />
        )}

        renderSend={(props) => (
          <Send {...props} containerStyle={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 }}>
            <Text style={{ color: BrandColors.primary, fontWeight: '600' }}>Envoyer</Text>
          </Send>
        )}
        renderDay={renderDay}
        locale="fr"
        dateFormat="dddd D MMMM"
        timeFormat="HH:mm"
        listViewProps={{
          keyboardDismissMode: Platform.OS === 'ios' ? 'interactive' : 'on-drag',
          keyboardShouldPersistTaps: 'always',
          contentContainerStyle: { paddingTop: 12 },
        } as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageContainer: {
    marginVertical: 2,
  },
  usernameContainer: {
    marginBottom: 2,
    marginLeft: 8,
  },
  usernameText: {
    fontSize: 12,
    color: BrandColors.primary,
    fontWeight: '600',
  },
  bubbleLeft: {
    backgroundColor: '#f0f0f0',
  },
  bubbleRight: {
    backgroundColor: BrandColors.primary,
  },
  bubbleTextLeft: {
    color: '#000',
  },
  bubbleTextRight: {
    color: '#fff',
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
    color: BrandColors.primary,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  commentsContent: {
    paddingBottom: 12,
  },
  commentItem: {
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    width: '100%',
  },
  ownComment: {
    backgroundColor: BrandColors.primary,
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
    color: BrandColors.primary,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
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
    backgroundColor: BrandColors.primary,
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