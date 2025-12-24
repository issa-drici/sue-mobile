import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
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
import { Bubble, Composer, GiftedChat, InputToolbar, Send } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../app/context/auth';
import { useComments } from '../hooks/useComments';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

interface ChatCommentsProps {
  sessionId: string;
  onCommentsReload?: () => void;
  onUserPress?: (userId: string, firstname?: string, lastname?: string) => void;
  onCloseComments?: () => void;
}

export default function ChatComments({ sessionId, onCommentsReload, onUserPress, onCloseComments }: ChatCommentsProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const {
    comments,
    isCreatingComment,
    sendComment,
  } = useComments(sessionId);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleTextChange = (text: string) => {
    setCommentText(text);
  };

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
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [comments]);

  const handleGiftedSend = React.useCallback(async (msgs: any[] = []) => {
    const text = msgs?.[0]?.text?.trim();
    if (!text || isCreatingComment) return;
    try {
      await sendComment(text);
      setCommentText('');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du commentaire:', error);
      if (error?.message?.includes('commentaire') || error?.status === 500) {
        Alert.alert('Erreur', "Impossible d'envoyer le commentaire. Veuillez réessayer.");
      }
    }
  }, [isCreatingComment, sendComment]);

  const renderDay = React.useCallback((props: any) => {
    const dateValue = props?.currentMessage?.createdAt;
    if (!dateValue) return null;
    const date = new Date(dateValue);
    const weekdays = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    const months = [
      'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
    ];
    const label = `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    return (
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <Text style={{ fontSize: 10, color: '#999', fontWeight: '800', letterSpacing: 1 }}>{label}</Text>
      </View>
    );
  }, []);

  const renderBubble = React.useCallback((props: any) => {
    const { currentMessage } = props;
    const isCurrentUser = currentMessage?.user?._id === String(user?.id);

    return (
      <View style={styles.messageContainer}>
        {!isCurrentUser && currentMessage?.user?.name && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (onUserPress && currentMessage?.user?._id) {
                if (onCloseComments) {
                  onCloseComments();
                }
                setTimeout(() => {
                  const fullName = currentMessage.user.name || '';
                  const nameParts = fullName.split(' ');
                  const firstname = nameParts[0] || '';
                  const lastname = nameParts.slice(1).join(' ') || '';
                  onUserPress(currentMessage.user._id, firstname, lastname);
                }, 300);
              }
            }}
            style={styles.usernameContainer}
          >
            <Text style={styles.usernameText}>
              {currentMessage.user.name.toUpperCase()}
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
          timeTextStyle={{
            left: { color: '#999' },
            right: { color: '#000' },
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
        placeholder="ÉCRIRE UN MESSAGE..."
        renderAvatar={() => null}
        renderUsernameOnMessage={false}
        showAvatarForEveryMessage
        renderBubble={renderBubble}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={{
              backgroundColor: '#FFF',
              borderTopWidth: 1,
              borderTopColor: '#F0F0F0',
              paddingTop: 8,
              marginBottom: Platform.OS === 'ios' ? (keyboardOpen ? -insets.bottom : 0) : 0,
            }}
            primaryStyle={{ alignItems: 'center' }}
          />
        )}
        renderComposer={(props) => (
          <Composer
            {...props}
            textInputStyle={{
              backgroundColor: '#F5F5F5',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 8,
              marginRight: 12,
              marginLeft: 12,
              fontSize: 14,
              fontWeight: '500',
            }}
            placeholderTextColor="#999"
          />
        )}
        renderSend={(props) => (
          <Send {...props} containerStyle={{ justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#000',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Ionicons name="arrow-up" size={20} color={ACCENT_COLOR} />
            </View>
          </Send>
        )}
        renderDay={renderDay}
        locale="fr"
        dateFormat="dddd D MMMM"
        timeFormat="HH:mm"
        listViewProps={{
          keyboardDismissMode: Platform.OS === 'ios' ? 'interactive' : 'on-drag',
          keyboardShouldPersistTaps: 'always',
          contentContainerStyle: { paddingTop: 12, paddingBottom: 20 },
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
    marginVertical: 4,
  },
  usernameContainer: {
    marginBottom: 4,
    marginLeft: 12,
  },
  usernameText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '800',
    fontStyle: 'italic',
  },
  bubbleLeft: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 2,
  },
  bubbleRight: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 2,
  },
  bubbleTextLeft: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  bubbleTextRight: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
